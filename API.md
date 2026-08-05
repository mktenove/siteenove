# Contrato da API

O que o front precisa receber para funcionar. Vale como especificação para
quem for construir o backend — a implementação pode ser qualquer uma, desde
que as respostas tenham este formato.

Hoje existe um **banco de referência no Supabase** com 1.286 imóveis reais
carregados. Ele serve como dado de marcação para o front e como prova de que
o modelo aguenta o acervo verdadeiro. Detalhes em `supabase/README.md`.

---

## Convenções

- Tudo em JSON, UTF-8.
- Valores monetários em **número**, sem formatação (`745000`, não `"R$ 745.000"`).
  Formatar é trabalho do front, que precisa do número para simular
  financiamento.
- Áreas em **m² como número decimal** (`192.5`).
- Datas em **ISO 8601** com fuso (`2026-08-05T16:34:33Z`).
- Campo ausente ≠ campo vazio. Use `null` quando não há valor; omitir a
  chave faz o front tratar como "não sei" em vez de "não tem".
- Paginação por `limit` e `offset`, com `total` no envelope. Sem isso a
  listagem não consegue montar a paginação.

## Envelope das listagens

```json
{
  "data":   [ /* itens */ ],
  "total":  1286,
  "limit":  30,
  "offset": 0
}
```

---

## `GET /imoveis`

Listagem e busca. É o endpoint mais usado do site.

### Filtros

| parâmetro | tipo | observação |
|---|---|---|
| `tipo` | `CA`, `AP`, `TE`… | aceita vários: `tipo=CA,AP` |
| `finalidade` | `VENDA`, `LOCACAO`, `LANCAMENTO` | |
| `cidade` | texto ou id | |
| `bairro` | texto ou id | |
| `valor_min`, `valor_max` | número | |
| `dormitorios_min` | número | "3 ou mais", não "exatamente 3" |
| `vagas_min` | número | idem |
| `area_min`, `area_max` | número | |
| `destaque` | booleano | |
| `q` | texto livre | busca em título, descrição e bairro |
| `ordem` | `recentes`, `menor_valor`, `maior_valor` | padrão: `recentes` |
| `limit`, `offset` | número | `limit` padrão 30, máximo 100 |

**Só devolve imóveis publicados.** Rascunho, vendido e suspenso nunca
aparecem aqui — essa regra fica no backend, não no front.

### Item da lista

Enxuto de propósito: a listagem carrega dezenas de cards e não precisa da
ficha inteira.

```json
{
  "codigo": "CA2872",
  "tipo": "CA",
  "tipo_nome": "Casa",
  "finalidade": "VENDA",
  "titulo": "Casa à venda em Novo Hamburgo, com 3 suítes",
  "cidade": "Novo Hamburgo",
  "bairro": "Rondônia",
  "valor": 3495000,
  "valor_sob_consulta": false,
  "area_util": 383.83,
  "dormitorios": 3,
  "suites": 3,
  "banheiros": 4,
  "vagas": 4,
  "capa": "https://.../CA2872/000.jpeg",
  "destaque": false,
  "lat": -29.709975,
  "lng": -51.121819
}
```

`lat`/`lng` vêm na listagem porque o mapa da busca precisa deles sem ter de
buscar cada imóvel.

---

## `GET /imoveis/{codigo}`

A ficha. O código é a chave — `/imoveis/CA2872`, em maiúsculas ou não.

Traz tudo do item da lista, mais:

```json
{
  "descricao": "<p>…</p>",
  "descricao_formato": "html",
  "cep": "93415640",
  "logradouro": "Rua das Acácias",
  "numero": "240",
  "complemento": null,
  "condominio": {
    "id": 12,
    "nome": "Horizon Clube Residencial",
    "slug": "horizon-clube-residencial",
    "chamada": "…",
    "capa": "https://…"
  },
  "mostrar_endereco": "SOMENTE_BAIRRO",
  "valor_condominio": 1400,
  "valor_iptu": 5000,
  "aceita_financiamento": true,
  "area_total": 284.6,
  "vagas_cobertas": 2,
  "ano_construcao": null,
  "mobiliado": true,
  "link_video": "https://…",
  "tour_virtual": null,
  "publicado_em": "2026-08-02T00:00:00Z",
  "fotos": [
    { "url": "https://.../CA2872/000.jpeg", "legenda": null, "ordem": 0, "capa": true }
  ],
  "caracteristicas": [
    { "nome": "Churrasqueira", "grupo": "IMOVEL" }
  ],
  "destaques": [
    { "titulo": "fachada", "capa": "https://…",
      "quadros": [ { "url": "https://…", "legenda": "Frente voltada para o nascente." } ] }
  ],
  "corretor": { "nome": "Fabiana Klein", "creci": "…", "telefone": "…", "foto": "https://…" }
}
```

### Dois pontos que decidem o comportamento do front

**`descricao` vem em HTML.** É como os corretores escrevem no CRM, com
parágrafos e negrito. O front precisa sanitizar antes de renderizar — o
campo `descricao_formato` existe para o dia em que houver texto puro.

**`mostrar_endereco` governa o que pode aparecer na tela**, e o backend
precisa respeitar isso na própria resposta:

| valor | o que o backend devolve |
|---|---|
| `COMPLETO` | logradouro, número e coordenadas exatas |
| `SOMENTE_RUA` | logradouro sim, número **nulo** |
| `SOMENTE_BAIRRO` | logradouro e número **nulos**; coordenadas deslocadas |
| `OCULTO` | só cidade |

São **quatro** níveis, não três. O `SOMENTE_RUA` só apareceu quando carreguei
o acervo real — 29 imóveis o usam, e o schema inicial os rejeitava.

Filtrar isso no front não serve: o endereço estaria no JSON, visível a
qualquer um que abrisse a aba de rede. No acervo atual **a maioria é
`SOMENTE_BAIRRO`**, então isso não é caso de exceção, é o caso comum.

---

## Condomínio é outra entidade

**Cadastrar um imóvel e cadastrar um condomínio são coisas diferentes.** O
condomínio existe sozinho — tem lazer, planta, construtora, previsão de
entrega — e vários imóveis apontam para ele.

No acervo atual, 370 imóveis (28%) estão em condomínio, distribuídos em 158
condomínios. O maior deles reúne 45 imóveis. Modelado como texto solto
dentro do imóvel, esses 45 repetiriam o mesmo endereço e a mesma lista de
lazer — e corrigir a piscina exigiria editar 45 fichas.

Na ficha do imóvel o condomínio vem **resumido** (id, nome, slug, chamada e
capa), o suficiente para montar a seção do fim da página. O peso pesado fica
no endpoint próprio.

### `GET /condominios/{slug}`

A página de vendas do condomínio.

```json
{
  "id": 12,
  "nome": "Horizon Clube Residencial",
  "slug": "horizon-clube-residencial",
  "chamada": "…",
  "descricao": "<p>…</p>",
  "construtora": "…",
  "ano_entrega": 2027,
  "situacao_obra": "EM_OBRAS",
  "total_unidades": 180,
  "torres": 3,
  "andares": 12,
  "cidade": "Estância Velha",
  "bairro": "Centro",
  "lat": -29.65, "lng": -51.17,
  "fotos": [ { "url": "…", "tipo": "FOTO", "legenda": null, "ordem": 0 } ],
  "caracteristicas": [ { "nome": "Piscina" }, { "nome": "Salão de festas" } ],
  "unidades_disponiveis": 7
}
```

`tipo` da foto distingue **FOTO**, **PLANTA** e **IMPLANTACAO** — a planta
não pode entrar no carrossel junto com a foto da fachada.

### `GET /condominios/{slug}/imoveis`

As unidades disponíveis. Mesmo formato e mesmos filtros de `GET /imoveis`.
É o que alimenta o "veja as unidades" no fim da página do condomínio.

### `GET /condominios`

Listagem, para a página de lançamentos. Filtros: `cidade`, `situacao_obra`,
`q`.

> **Só devolve condomínio publicado.** O cadastro de um condomínio costuma
> começar antes de haver unidade à venda, e nesse período ele não pode
> aparecer.

---

## `GET /tipos`, `GET /cidades`, `GET /bairros?cidade=`

Alimentam os filtros. Devolvem `sigla`/`id`, `nome` e `quantidade` de
imóveis publicados — a contagem evita oferecer um filtro que não traz nada.

---

## `POST /leads`

O formulário de contato.

```json
{ "imovel_codigo": "CA2872", "nome": "…", "telefone": "…",
  "email": "…", "mensagem": "…", "origem": "ficha" }
```

Responde `201` com `{ "id": 123 }`. **Nunca expõe leitura** — a lista de
leads tem telefone e e-mail de quem pediu informação, e não pode ser
alcançável pela chave que vai no site.

---

## `POST /imoveis` (área interna)

Cadastro. Autenticado.

**O `codigo` não é enviado.** O backend gera a partir do `tipo`, no formato
sigla + 4 dígitos (`CA2875`), continuando os contadores do CRM atual.

A geração precisa ser atômica: dois corretores salvando ao mesmo tempo não
podem receber o mesmo número. Um `select max(numero)+1` falha exatamente
nesse caso. Há uma implementação de referência em
`supabase/01-schema.sql` (função `gerar_codigo`), com o porquê comentado.

---

## Erros

Sempre com corpo, nunca só o status:

```json
{ "erro": "tipo_invalido", "mensagem": "tipo de imóvel XX não existe" }
```

`404` para imóvel inexistente **ou não publicado** — não distinga os dois,
senão dá para descobrir códigos de imóveis suspensos por tentativa.

---

## O que já existe

O Supabase do projeto expõe uma API REST automática sobre este mesmo
schema. Ela **não segue este contrato** (usa a sintaxe do PostgREST), mas
serve para o front trabalhar com dado real desde já:

```
GET {SUPABASE_URL}/rest/v1/imovel?select=*&situacao=eq.PUBLICADO&limit=30
    apikey: {chave anônima}
```

Quem construir o backend definitivo pode manter o PostgREST e adaptar o
front, ou implementar este contrato por cima. A segunda opção é melhor: o
contrato esconde a estrutura das tabelas, e regras como o
`mostrar_endereco` não têm como ser garantidas por uma API automática.

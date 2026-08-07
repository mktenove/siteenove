# Prompt para construir o backend da Enove Imobiliária

Este arquivo é para ser entregue inteiro a quem for construir o backend —
pessoa ou agente. Ele descreve o que já existe, o que falta, e o que cada
tela precisa pedir, campo a campo.

Leia também, no mesmo repositório:

| Arquivo | O que tem |
|---|---|
| `supabase/01-schema.sql` … `05-condominio.sql` | o schema que já está rodando |
| `API.md` | o contrato que o front espera |
| `prototipo/dados.js` | as consultas que o site faz hoje |
| `api/plantao.js` | a única função de servidor que existe |
| `migracao/` | os scripts que trouxeram o acervo do Flip |

---

## 1. O que é a Enove e o que o site já faz

Imobiliária de Estância Velha/RS, se reposicionando para atuar além do Vale
do Sinos. O site novo está no ar, é estático (HTML/CSS/JS sem framework,
hospedado na Vercel) e **lê direto do Supabase pelo navegador**, usando a
chave publicável e RLS.

O site tem: home com busca conversacional, página de imóvel, página de
condomínio, página de bairro, um chat estilo WhatsApp que captura contato, e
um formulário de avaliação que manda o pedido para o plantão.

**O que ele NÃO tem: nenhuma tela de cadastro.** Os imóveis entraram por um
script de migração rodado uma vez. Hoje não existe forma de a equipe
cadastrar, editar ou despublicar um imóvel. É esse o buraco principal.

---

## 2. Estado atual, verificado

Contagens conferidas direto no banco em 2026-08-07:

| Tabela | Linhas | Observação |
|---|---:|---|
| `imovel` | 1.286 | todos `finalidade = VENDA`, `situacao = PUBLICADO` |
| `imovel_foto` | 28.278 | **as URLs apontam para o S3 do Flip**, ver §7.1 |
| `condominio` | 158 | 370 imóveis (28%) pertencem a algum |
| `cidade` | 25 | todas RS |
| `bairro` | 122 | 4 duplicados só por caixa, ver §7.3 |
| `caracteristica` | 114 | |
| `corretor` | **0** | ninguém cadastrado, ver §7.4 |
| `destaque` | **0** | o front dos stories existe e não tem dado |
| `lead` | varia | o chat e a avaliação já gravam aqui |

Storage: bucket `imoveis`, público, **1.276 pastas** por código de imóvel,
cada uma com `000.jpeg` (a capa). As demais fotos não foram copiadas.

O código do imóvel é sigla + 4 dígitos (`CA2875`) e **é a chave primária**,
não um id numérico. Gerado por `gerar_codigo(sigla)`, que faz
`update tipo_imovel set proximo = proximo + 1 ... returning` — trava a linha
do tipo, então dois corretores salvando ao mesmo tempo entram em fila em vez
de receberem o mesmo número. Não troque por `select max()+1`.

---

## 3. Regras que não podem ser quebradas

1. **Não reescreva o schema.** Ele está em produção com 1.286 imóveis e o
   front consome esses nomes de coluna. Estenda com migrações.
2. **A chave `sb_secret_` (service_role) nunca vai para o navegador nem para
   o git.** Ela ignora o RLS. Vive só em variável de ambiente de servidor.
   O `prototipo/dados.js` tem uma guarda em tempo de execução que recusa a
   conexão se ela aparecer no front — mantenha.
3. **RLS não é opcional.** Sem as políticas de `03-rls.sql`, a chave
   publicável lê a tabela `lead` inteira (nomes, telefones, e-mails de quem
   se interessou) e altera imóveis. Toda tabela nova nasce com RLS ligado.
4. **Nenhum número inventado no site.** Já houve uma tabela de R$/m²
   "ilustrativa" alimentando uma estimativa que o texto apresentava como
   real. Foi removida. Se o dado não existe, a tela diz que não existe.

---

## 4. Entrega A — painel de cadastro

O que a equipe da Enove precisa conseguir fazer sozinha. Autenticação pelo
Supabase Auth, ligando `auth.users.id` em `corretor.auth_id`.

### 4.1 Papéis

| Papel | Pode |
|---|---|
| `corretor` | criar e editar os próprios imóveis; ver os próprios leads |
| `gerente` | tudo de imóvel e condomínio, de qualquer corretor; ver todos os leads; publicar |
| `admin` | o acima, mais corretores, tipos, características e cidades |

Publicar (`situacao` → `PUBLICADO`) é ação de gerente. Corretor salva como
`RASCUNHO` e pede revisão.

### 4.2 Cadastro de imóvel — passo a passo

O formulário tem seis etapas. **Só a etapa 1 é obrigatória para salvar
rascunho.** Para publicar, ver a lista de exigências no fim.

---

**Etapa 1 — Identificação**

| Campo | Coluna | Tipo | Obrigatório | Como preencher |
|---|---|---|---|---|
| Tipo | `tipo` | `char(2)` | sim | lista de `tipo_imovel`. Os 13 cadastrados: AD=Apartamento Duplex, AP=Apartamento, AR=Área, CA=Casa, CH=Chácara, ES=Estúdio, LJ=Loja, PA=Pavilhão, PR=Prédio, SA=Sala, SI=Sítio, SJ=Sobreloja, TE=Terreno |
| Código | `codigo` | `text` PK | automático | `gerar_codigo(sigla)` no momento de salvar. Nunca digitado, nunca editável depois |
| Finalidade | `finalidade` | enum | sim | `VENDA` · `LOCACAO` · `LANCAMENTO` |
| Situação | `situacao` | enum | automático | nasce `RASCUNHO`. Depois `PUBLICADO` · `VENDIDO` · `SUSPENSO` |
| Título | `titulo` | `text` | não | uma linha. Se vazio, o front monta a partir de tipo + bairro |
| Descrição | `descricao` | `text` | não | texto livre, aceita quebras de linha |
| Exclusivo | `exclusivo` | `bool` | não | selo "Exclusivo" no card |
| Destaque | `destaque` | `bool` | não | entra nas vitrines da home |
| Corretor responsável | `corretor_id` | FK | sim | lista de `corretor` ativos; padrão = quem está logado |

---

**Etapa 2 — Localização**

| Campo | Coluna | Obrigatório | Como preencher |
|---|---|---|---|
| Cidade | `cidade_id` | sim | lista de `cidade`; permitir criar nova (nome + UF) |
| Bairro | `bairro_id` | sim | lista filtrada pela cidade; permitir criar novo |
| CEP | `cep` | não | busca ViaCEP e preenche logradouro/bairro/cidade |
| Logradouro | `logradouro` | não | |
| Número | `numero` | não | texto, não inteiro ("1213", "s/n", "1213 A") |
| Complemento | `complemento` | não | |
| Nome do condomínio (texto solto) | `condominio` | não | campo legado do Flip. **Prefira `condominio_id`** (etapa 6) |
| Latitude / Longitude | `lat` / `lng` | não | mapa arrastável; geocodificar a partir do endereço |
| Visibilidade do endereço | `mostrar_endereco` | sim | quatro níveis: `COMPLETO` · `SOMENTE_RUA` · `SOMENTE_BAIRRO` (padrão) · `OCULTO`. Assumi três quando escrevi o schema e o CHECK recusou a carga; foi corrigido em `04-ajustes.sql` |

O campo de visibilidade **precisa ser respeitado pela API pública**: com
`SOMENTE_BAIRRO`, `logradouro`, `numero` e as coordenadas exatas não podem
sair no JSON. Hoje isso não é filtrado — é uma correção a fazer. Numa
amostra de 1.000 imóveis o acervo está em 833 `SOMENTE_BAIRRO`, 141
`COMPLETO` e 26 `SOMENTE_RUA`; `OCULTO` não aparece.

---

**Etapa 3 — Valores**

| Campo | Coluna | Obrigatório | Regra |
|---|---|---|---|
| Valor de venda | `valor` | se `finalidade` inclui VENDA | numérico. **Validar piso**: já entrou um imóvel a R$ 2.300 (aluguel digitado como venda). Avisar abaixo de R$ 20.000 |
| Valor de locação | `valor_locacao` | se `finalidade` inclui LOCACAO | |
| Condomínio (mensal) | `valor_condominio` | não | |
| IPTU | `valor_iptu` | não | deixar claro se é mensal ou anual — o acervo migrado está inconsistente |
| Sob consulta | `valor_sob_consulta` | não | esconde o valor no site |
| Aceita financiamento | `aceita_financiamento` | não | |
| Aceita permuta | `aceita_permuta` | não | |

---

**Etapa 4 — Medidas**

| Campo | Coluna | Regra |
|---|---|---|
| Área útil (m²) | `area_util` | usada no cálculo de R$/m² do site |
| Área total (m²) | `area_total` | validar `area_total >= area_util` |
| Dormitórios | `dormitorios` | |
| Suítes | `suites` | validar `suites <= dormitorios` |
| Banheiros | `banheiros` | |
| Vagas | `vagas` | |
| Vagas cobertas | `vagas_cobertas` | validar `<= vagas` |
| Ano de construção | `ano_construcao` | |
| Mobiliado | `mobiliado` | |

---

**Etapa 5 — Características e mídia**

*Características* — multisseleção de `caracteristica` (114 cadastradas),
agrupadas por `grupo`: `IMOVEL`, `CONDOMINIO`, `ENTORNO`. Grava em
`imovel_caracteristica`. Permitir criar nova (admin).

*Fotos* — grava em `imovel_foto`:

| Campo | Coluna | Regra |
|---|---|---|
| Arquivo | → Storage | bucket `imoveis`, caminho `{codigo}/{ordem}.jpeg` |
| URL | `url` | a URL pública do Storage, **nunca a de terceiros** |
| Miniatura | `thumb_url` | gerar; o site carrega dezenas de cards por vez |
| Legenda | `legenda` | |
| Ordem | `ordem` | arrastável |
| Capa | `capa` | exatamente uma por imóvel. O site filtra por `capa=is.true` |

Exigências do upload: aceitar JPEG, PNG, WebP e HEIC; converter para WebP;
gerar miniatura ≤ 400 px; limitar a 40 fotos por imóvel; **detectar o tipo
pelos bytes mágicos, não pelo header enviado** — o S3 do Flip devolve
`application/octet-stream` e o bucket recusa.

*Vídeo e tour* — `link_video` (YouTube/Vimeo), `tour_virtual` (Matterport).

*Destaques (stories)* — a página do imóvel tem um carrossel estilo Instagram
que abre em tela cheia. O front está pronto, **a tabela está vazia**.

- `destaque`: `titulo`, `capa_url`, `ordem` — um por assunto ("Sala",
  "Vista", "Lazer")
- `destaque_quadro`: `foto_url`, `legenda`, `ordem` — os quadros de cada um

---

**Etapa 6 — Condomínio**

Vincular a um condomínio já cadastrado (`condominio_id`) ou criar na hora.
Ao vincular, a ficha do imóvel passa a exibir a seção de venda do
condomínio. Ver §4.3.

---

**Para publicar, exigir:** tipo, finalidade, cidade, bairro, corretor, pelo
menos um valor coerente com a finalidade, área útil, pelo menos 3 fotos com
uma capa definida, e `mostrar_endereco` escolhido conscientemente.

### 4.3 Cadastro de condomínio

Cadastrar um imóvel e cadastrar um condomínio são coisas diferentes. Um
condomínio existe sozinho, tem lazer, construtora e entrega — e vários
imóveis apontam para ele. Sem essa separação, os 45 imóveis do Horizon Clube
repetiriam nome, endereço e lazer em cada ficha.

| Campo | Coluna | Obrigatório | Nota |
|---|---|---|---|
| Nome | `nome` | sim | |
| Slug | `slug` | automático | a partir do nome; único; é a URL `/condominios/{slug}` |
| Cidade / Bairro | `cidade_id` / `bairro_id` | sim | |
| CEP, logradouro, número | | não | |
| Lat/Lng | `lat` / `lng` | não | |
| Chamada | `chamada` | não | uma linha de destaque |
| Descrição | `descricao` | não | é a "página de vendas" |
| Construtora | `construtora` | não | |
| Ano de entrega | `ano_entrega` | não | |
| Situação da obra | `situacao_obra` | não | `LANCAMENTO` · `EM_OBRAS` · `PRONTO` · `ENTREGUE` |
| Total de unidades | `total_unidades` | não | |
| Torres / Andares | `torres` / `andares` | não | |
| Condomínio médio | `valor_condominio_medio` | não | |
| Publicado | `publicado` | automático | nasce `false` |

Mais `condominio_foto` (galeria, plantas) e `condominio_caracteristica`
(lazer). Ver `05-condominio.sql`.

### 4.4 Painel de leads

Hoje os leads chegam de duas origens e ninguém os vê — não há tela.

| Coluna | Conteúdo |
|---|---|
| `nome`, `telefone`, `email` | o que a pessoa informou |
| `mensagem` | o pedido em texto |
| `imovel_codigo` | quando veio de uma ficha |
| `origem` | `chat` · `avaliacao` · `ficha` · `whatsapp` · `story` |
| `criado_em` | |

Precisa de: lista com filtro por origem/data/corretor, marcação de
atendido/perdido, atribuição a corretor, e exportação CSV. E de uma
**notificação** quando entra um lead — hoje ele fica parado no banco.

---

## 5. Entrega B — API pública

`API.md` tem o contrato completo. O essencial:

```
GET  /imoveis?tipo=&cidade=&bairro=&preco_min=&preco_max=&quartos=&vagas=
             &area_min=&condominio=&exclusivo=&ordem=&pagina=&por_pagina=
GET  /imoveis/{codigo}
GET  /condominios            GET /condominios/{slug}
GET  /condominios/{slug}/imoveis
GET  /cidades                GET /bairros?cidade=
GET  /tipos                  GET /caracteristicas
POST /leads
```

Regras:

- Envelope de listagem: `{ dados: [...], total, pagina, por_pagina }`.
  Sempre com `total` — o front mostra "N imóveis encontrados".
- **Só `situacao = PUBLICADO` sai na API pública.**
- Respeitar `mostrar_endereco` (§4.2).
- Paginação real. O PostgREST corta em 1.000 linhas por padrão e isso já
  causou um erro de contagem aqui (reportou 1.000 fotos onde havia 28.278).
  Se usar PostgREST direto, pagine com header `Range`.
- `POST /leads` precisa de proteção contra robô — hoje qualquer um pode
  inserir com a chave publicável. Rate limit por IP e honeypot no mínimo.

---

## 6. Entrega C — integrações

### 6.1 WhatsApp do plantão (parcialmente feito)

`api/plantao.js` já existe e está no ar como função da Vercel. **Falta
configurar as variáveis** — enquanto não estiverem, a rota responde 501 e o
site cai no `wa.me`, que só ABRE a conversa e depende de a pessoa apertar
enviar.

Dois caminhos, já implementados:

- **Meta oficial**: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`,
  `WHATSAPP_TEMPLATE`. Exige o número na plataforma WhatsApp Business.
  Atenção: mensagem que a empresa inicia, fora de uma conversa aberta nas
  últimas 24 h, **precisa ser modelo aprovado** — texto livre é recusado.
- **Gateway** (`PLANTAO_WEBHOOK`): POST em JSON para Z-API, Evolution, n8n
  ou Make, ligado ao número que a Enove já usa. Caminho curto, sem migrar.

Estender para: notificar o corretor dono do imóvel quando entra lead da
ficha dele, e confirmar para o cliente que o pedido chegou.

### 6.2 Agente de IA no chat

O chat da home (`prototipo/atendimento.js`) responde hoje com um
interpretador local determinístico. O ponto de troca está marcado no
arquivo, na função `responder()`. O contrato esperado:

```
POST /api/atendimento
  { mensagem: string, sessao: { pedido, nome, telefone, achados[], etapa } }
→ { resposta: string, imoveis: [ { cod, tipo, bairro, cidade, preco,
                                   quartos, area, foto } ] }
```

Exigências:

- **A chave da Anthropic fica no servidor.** No navegador, qualquer
  visitante lê o código-fonte e passa a gastar a conta da Enove.
- O agente consulta o acervo real por ferramenta (tool use) — nunca inventa
  imóvel, preço ou bairro. Se não achar, diz que não achou.
- Objetivo da conversa é capturar nome e telefone e entregar ao corretor,
  não conversar indefinidamente.
- Gravar a transcrição junto do lead.
- Teto de gasto por sessão e por dia.

### 6.3 Portais

A Enove precisa publicar nos portais. Gerar feed XML no padrão de cada um —
VivaReal/ZAP (Grupo OLX) usam o formato ZAP; ImovelWeb tem o seu. Um
endpoint `GET /feed/{portal}.xml` com cache, listando só `PUBLICADO`.
Considerar também manter o Flip sincronizado durante a transição.

### 6.4 As outras

| Integração | Para quê |
|---|---|
| E-mail transacional (Resend/SendGrid) | confirmação de lead, recuperação de senha, aviso ao corretor |
| ViaCEP | preencher endereço no cadastro |
| Google Maps Geocoding | lat/lng a partir do endereço; mapa na ficha |
| Google Analytics 4 / Meta Pixel | funil até o lead |
| Supabase Storage + CDN | fotos (§7.1) |
| Supabase Auth | login do painel |

---

## 7. Defeitos conhecidos, para resolver

### 7.1 As fotos dependem do S3 do Flip — risco alto

As 1.276 capas **já foram copiadas** para o bucket `imoveis`
(`{codigo}/000.jpeg`), mas **nenhuma das 28.278 linhas de `imovel_foto` teve
a `url` repontada**: todas ainda apontam para
`flip-prod-fotos.s3.amazonaws.com`. Ou seja, o site em produção hoje serve
imagem de um sistema que a Enove está deixando.

Duas tarefas: repontar as capas para o Storage (a `origem_url` guarda a URL
antiga, então dá para conferir), e copiar as 27 mil fotos restantes.

**Atenção ao custo:** o acervo completo tem ~3,07 GB e o plano gratuito do
Supabase dá 1 GB. Ou sobe de plano, ou converte para WebP e limita as fotos
por imóvel, ou usa um CDN externo. Decida antes de rodar a cópia.

### 7.2 Um imóvel com preço de aluguel como venda

`AP1138`, `finalidade = VENDA`, `valor = 2300.34`. Era o imóvel mais barato
do acervo e aparecia primeiro em qualquer busca por preço. O front hoje
filtra com um piso de R$ 20.000, o que esconde o sintoma — **o registro
continua errado no banco e provavelmente no Flip**. Corrigir na origem e
validar no cadastro.

### 7.3 Bairros duplicados por caixa

Quatro pares: "Centro"/"CENTRO" em Estância Velha, e "São Jorge", "Boa
Saúde", "Lomba Grande" em Novo Hamburgo. Vieram assim do Flip. O front
descarta a versão toda em maiúsculas na hora de montar o seletor, mas os
imóveis seguem divididos entre os dois registros — o que **subestima a
contagem por bairro**. Unificar com migração e pôr `unique` insensível a
caixa.

### 7.4 Não há corretores

`corretor` está vazia e `imovel.corretor_id` é nulo em todos. A página do
imóvel promete "um corretor com nome, rosto e agenda". Cadastrar a equipe é
pré-requisito do painel — sem isso não há a quem atribuir lead nem imóvel.

### 7.5 Stories sem conteúdo

`destaque` e `destaque_quadro` vazias. O visor em tela cheia está pronto no
front e não tem o que mostrar.

---

## 8. Segurança — a lista curta

1. RLS ligado em toda tabela, inclusive as novas.
2. `lead` é o caso crítico: qualquer um insere (é um formulário público),
   **ninguém lê sem estar autenticado**. Está assim em `03-rls.sql`;
   verifique que continua.
3. Segredos (`sb_secret_`, `WHATSAPP_TOKEN`, `ANTHROPIC_API_KEY`) só em
   variável de ambiente de servidor. `.env` está no `.gitignore` — mantenha.
4. Storage: bucket público só para leitura; escrita exige autenticação.
5. Rate limit em `POST /leads` e em `/api/atendimento`.
6. Log de auditoria em imóvel e condomínio: quem alterou o quê e quando.
7. LGPD: o lead guarda nome, telefone e e-mail. Defina prazo de retenção,
   base legal e um caminho para apagar a pedido.

---

## 9. Como sei que está pronto

- [ ] Um corretor loga, cadastra um imóvel do zero e ele aparece no site
      com código gerado automaticamente, sem ninguém tocar em SQL.
- [ ] O mesmo imóvel some do site ao virar `SUSPENSO`.
- [ ] Um imóvel com `mostrar_endereco = SOMENTE_BAIRRO` não expõe
      logradouro, número nem coordenada exata em nenhuma resposta da API.
- [ ] Um condomínio é cadastrado uma vez e aparece na ficha dos imóveis
      vinculados a ele.
- [ ] Um lead do chat chega no WhatsApp do plantão **sem ninguém apertar
      enviar**, e aparece no painel.
- [ ] Nenhuma foto do site aponta para `flip-prod-fotos.s3.amazonaws.com`.
- [ ] `GET /imoveis` devolve `total = 1286` (ou o número do dia) e pagina
      corretamente além da linha 1.000.
- [ ] Com a chave publicável, um `select` em `lead` devolve vazio.
- [ ] Feed XML válido pelo validador do portal.
- [ ] O site continua funcionando com o banco fora do ar: ele cai nos
      imóveis de exemplo embutidos. Não quebre esse caminho.

---

## 10. Ordem sugerida

1. **Corretores + Auth + painel de imóvel** — é o que destrava a operação.
2. **Repontar as fotos** — tira a dependência do Flip.
3. **Painel de leads + notificação** — hoje o contato entra e ninguém vê.
4. **Fechar o WhatsApp do plantão** — falta só configurar.
5. **API pública formal** — o site já funciona sem ela; formalize quando
   houver um segundo consumidor (app, portal, parceiro).
6. **Agente de IA** — depois que o acervo estiver confiável.
7. **Feeds dos portais**.

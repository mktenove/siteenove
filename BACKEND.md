# Backend — proposta

O site novo passa a ser a **origem** dos imóveis, com fluxo de cadastro o mais
próximo possível do que a equipe já usa no Flip.

## Recomendação: Postgres gerenciado + painel próprio

**Supabase** (Postgres + Storage + Auth) com um painel de cadastro feito sob
medida, publicado junto do site na Vercel.

Por que essa combinação, e não as alternativas:

| Opção | Por que não |
|---|---|
| CMS headless (Strapi, Directus) | Painel pronto, mas o vocabulário é genérico: "collection", "entry". O corretor precisa ver *imóvel*, *dormitórios*, *código*. Adaptar dá quase o mesmo trabalho de fazer o painel. |
| Firebase / Firestore | Sem transação forte por linha do jeito que a geração de código precisa. Contador de código em Firestore exige transação manual e erra sob concorrência. |
| Backend próprio do zero | Autenticação, upload, redimensionamento de foto e backup são meses de trabalho já resolvidos. |

O que o Supabase resolve de graça e importa aqui: **Postgres de verdade**
(a geração de código depende disso), Storage para as fotos, Auth com papéis
por corretor, e políticas de linha para "cada um edita os seus".

## A geração de código

O padrão já existe no Flip e **precisa continuar de onde ele parou**: hoje há
`CA2874`, `TE1260`, `AP1221`. Recomeçar do zero colidiria com anúncio antigo
em portal, print de WhatsApp e placa de rua.

```sql
create table tipo_imovel (
  sigla   char(2) primary key,          -- CA, AP, TE, SA, GA...
  nome    text    not null,
  proximo integer not null              -- semeado com o último do Flip
);

create function gerar_codigo(p_sigla char(2)) returns text as $$
declare n integer;
begin
  -- o UPDATE ... RETURNING trava a LINHA do tipo: dois corretores salvando
  -- ao mesmo tempo entram em fila em vez de receberem o mesmo número
  update tipo_imovel set proximo = proximo + 1
     where sigla = p_sigla
   returning proximo into n;
  if n is null then
    raise exception 'tipo de imóvel % não cadastrado', p_sigla;
  end if;
  return p_sigla || lpad(n::text, 4, '0');
end $$ language plpgsql;
```

**O erro clássico aqui é `select max(numero) + 1`.** Sob dois cadastros
simultâneos os dois leem o mesmo máximo e geram o mesmo código. O
`UPDATE ... RETURNING` evita isso porque a trava é da linha, não da leitura.

Alternativa: uma `SEQUENCE` por tipo. É livre de trava e mais rápida, mas
**pula números** quando uma transação é desfeita — o corretor cadastra,
desiste, e o código some para sempre. Com o volume da Enove (centenas por
ano, não milhares por hora), a fila do contador não custa nada e não deixa
buracos. Fica a sequência como plano B se a concorrência crescer muito.

**Limite:** quatro dígitos acabam em 9999. `CA` está em 2874. No ritmo atual
isso dura décadas, mas a regra de virada precisa ser decidida antes de chegar
lá, não depois.

## Modelo de dados — o núcleo

```
imovel            codigo (PK, texto) · tipo · finalidade (venda/aluguel/lançamento)
                  status (rascunho/publicado/vendido/suspenso)
                  titulo · descricao · exclusivo · destaque
                  cep · logradouro · numero · complemento · bairro_id · cidade_id
                  lat · lng · mostrar_endereco_exato
                  valor · condominio · iptu · aceita_financiamento · aceita_permuta
                  area_util · area_total · dormitorios · suites · banheiros · vagas
                  ano_construcao · mobiliado
                  corretor_id · criado_em · atualizado_em · publicado_em

imovel_foto       imovel_codigo · url · ordem · legenda · capa
caracteristica    nome · grupo (imóvel / condomínio / entorno)
imovel_caract     imovel_codigo · caracteristica_id
destaque          imovel_codigo · titulo · ordem          (os stories)
destaque_quadro   destaque_id · foto_url · legenda · ordem
bairro            nome · cidade_id · texto · valor_m2
cidade            nome · uf
corretor          nome · creci · foto · telefone · email
lead              imovel_codigo · nome · telefone · mensagem · origem · criado_em
```

O `codigo` é a chave primária, não um `id` numérico. Isso faz a URL do imóvel
ser `/imovel/ca2874`, que é o que o corretor dita no telefone.

## Migração

Duas decisões independentes:

1. **Semear os contadores** — obrigatório. Sem isso o primeiro cadastro
   colide com o histórico. É um `insert` com o último número de cada tipo.
2. **Trazer os ~2.900 imóveis históricos** — opcional. Só vale se os
   anúncios antigos precisam continuar no ar. Se a maioria já foi vendida,
   migrar só os ativos é mais barato e mais limpo.

## O que isso implica para o site

O protótipo hoje é HTML/CSS/JS estático, sem build. Um painel de cadastro
com upload de fotos não cabe nisso — **é o ponto em que o projeto passa a ter
framework**. A rota natural é Next.js, que mantém as páginas públicas
estáticas (rápidas, boas de SEO) e ganha rotas de servidor para o painel.

Isso não joga o protótipo fora: o CSS, a camada de movimento e os componentes
migram quase inteiros. Mas é uma conversão, não um acréscimo.

## O que precisa de decisão de vocês

- **Quais tipos existem além de CA, AP e TE.** Encontrei só esses três no ar;
  sala, galpão, sítio e chácara provavelmente existem no Flip.
- **Se o histórico vem junto** ou só os ativos.
- **Quem cadastra**: todo corretor ou uma pessoa de marketing. Muda o painel
  e as permissões.
- **O que acontece com o Flip** depois. Manter os dois é o pior dos mundos:
  cadastro duplicado e divergência garantida.

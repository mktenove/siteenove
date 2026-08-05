# Supabase — como montar o banco

Rode os três arquivos **em ordem**, no SQL Editor do Supabase.

| Arquivo | O que faz |
|---|---|
| `01-schema.sql` | 11 tabelas, a função que gera o código e os gatilhos |
| `02-tipos.sql` | os 13 tipos e a semeadura dos contadores |
| `03-rls.sql` | segurança de linha — **não pule este** |

Depois de rodar o `02`, ele mostra uma tabela com o próximo código de cada
tipo. Confira que `CA` está em `CA2925` ou acima antes de seguir.

## Por que o RLS não é opcional

A chave anônima do Supabase vai embutida no site público — qualquer visitante
consegue lê-la no código-fonte. Sem RLS, essa chave lê e escreve tudo: dá
para alterar preço de imóvel e baixar a lista completa de leads com telefone
e e-mail. O `03-rls.sql` fecha isso: o público só enxerga imóveis com
`situacao = 'PUBLICADO'`, o formulário só consegue *criar* lead sem poder
lê-los, e a escrita fica para quem estiver autenticado.

## A geração do código

`gerar_codigo('CA')` devolve `CA2925` e avança o contador. É chamada
sozinha pelo gatilho quando um imóvel entra sem código — a carga histórica
traz os códigos prontos e passa direto.

O `update ... returning` trava a linha do tipo, então dois corretores
salvando ao mesmo tempo entram em fila. Um `select max(...) + 1` faria os
dois lerem o mesmo número e gerarem o mesmo código.

## Sobre a folga nos contadores

Os contadores foram semeados com o maior número **publicado + 50**. O motivo
está em `migracao/README.md`: só 1.286 dos 5.591 imóveis são visíveis, e um
arquivado pode ter número maior.

Se o Flip informar o máximo real de cada tipo, troque os valores no
`02-tipos.sql` e rode de novo — o `greatest()` garante que o contador nunca
retrocede.

## Depois disso

1. **Storage** — criar um bucket `imoveis` para as fotos. As URLs de hoje
   apontam para o S3 do Flip e morrem quando a Enove sair de lá.
2. **Carga** — subir os 1.286 imóveis extraídos. Falta escrever o script.
3. **Painel** — o cadastro, no fluxo do Flip.

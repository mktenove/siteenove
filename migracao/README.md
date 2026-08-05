# Migração — extração do site atual

Extrai os imóveis publicados no site Flip para JSON, como insumo da carga
inicial do backend novo.

## Como usar

```bash
python3 extrair.py --listar        # descobre os códigos -> resumo.json + codigos.txt
python3 extrair.py --buscar        # baixa a ficha completa de cada um -> fichas/
python3 extrair.py --buscar 20     # só os 20 primeiros, para conferir
```

É retomável: fichas já baixadas são puladas. Pausa de 0,4 s entre requisições.

## Como funciona, e por que assim

O site é Next.js com renderização no servidor. Cada ficha
(`/imoveis/{CÓDIGO}`) traz o **registro cru** do imóvel dentro de
`__NEXT_DATA__` — 46 campos, mais `detalhes` com 47, características e a
lista de fotos com ordem. Isso é lido direto: não há interpretação de HTML,
os valores vêm do banco de origem.

**A busca não pagina por querystring.** `?pagina=2`, `?page=2` e `?p=2`
devolvem todos a primeira página — o primeiro laço que escrevi ficou
infinito por causa disso. Quem pagina é a API que o app chama:

```
GET https://imobiliariasiteapi.eurekalabs.com.br/search-imoveis
    ?limit=100&start=0&paginate=true&host=www.enoveimobiliaria.com.br
    x-flip-tenant: 156
    x-flip-site: 57
```

Sem esses dois cabeçalhos a API responde 403. Com eles, devolve `data` e
`total`, e o `start` avança de 100 em 100.

## O que foi encontrado

1.286 imóveis únicos (a API informa 1.322; a diferença de 36 são os
lançamentos, que aparecem também na lista de venda).

| tipo | sigla | qtd | maior número | contador a semear |
|---|---|---|---|---|
| Casa | CA | 537 | 2874 | **CA2875** |
| Terreno | TE | 385 | 1260 | **TE1261** |
| Apartamento | AP | 273 | 1221 | **AP1222** |
| Área | AR | 40 | 48 | AR0049 |
| Prédio | PR | 17 | 44 | PR0045 |
| Chácara | CH | 12 | 37 | CH0038 |
| Sala | SA | 6 | 141 | SA0142 |
| Pavilhão | PA | 6 | 40 | PA0041 |
| Loja | LJ | 3 | 4 | LJ0005 |
| Estúdio | ES | 3 | 3 | ES0004 |
| Sítio | SI | 2 | 6 | SI0007 |
| Ap. Duplex | AD | 1 | 2 | AD0003 |
| Sobreloja | SJ | 1 | 1 | SJ0002 |

Cidades: Estância Velha 643, Novo Hamburgo 366, Ivoti 92, Campo Bom 63,
Dois Irmãos 32, Portão 31, São Leopoldo 24, Osório 9, Nova Santa Rita 4.

## Cuidado com os contadores

**Estes números vêm só do que está publicado.** O Flip tem 5.591 imóveis no
total contra 1.301 ativos — cerca de 4.290 são histórico arquivado, e um
deles pode ter número maior que o maior ativo do mesmo tipo.

Como o código é sequencial no tempo e o imóvel mais recente é quase sempre
o ativo, a chance é pequena. Mas "pequena" não serve para chave primária:
**semeie com folga** (o maior conhecido + 50) ou peça o máximo real ao Flip.
Um código repetido é indistinguível de um imóvel diferente em placa de rua e
print de WhatsApp.

## O que a extração não alcança

- os ~4.290 imóveis arquivados
- campos internos: proprietário, comissão, histórico de status, motivo da baixa
- as fotos em si — o JSON traz URLs no S3 do Flip, que morrem se a Enove sair
  de lá. Precisam ser baixadas e re-hospedadas, seja qual for o caminho.

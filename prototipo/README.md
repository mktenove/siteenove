# Protótipo — novo site Enove

Protótipo navegável da home e da página de imóvel, construído sobre o
**Enove Design System** (amarelo `#FFFF00` + preto, display lowercase em
Cocogoose Pro, Poppins no corpo, Enove Select em dourado `#C89B3C`).

Referência de sensação de scroll: **findrealestate.com** — inércia no scroll,
hero composto em camadas, declaração em linhas grandes, fita horizontal presa.

## Como abrir

```bash
cd prototipo && python3 -m http.server 8899
```
Depois: <http://localhost:8899/index.html>

> Precisa de servidor local — abrir com `file://` bloqueia as fontes por CORS.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | Home |
| `imovel.html` | Página do imóvel |
| `site.css` | Estilos, todos apoiados nos tokens do design system |
| `motion.js` | Camada de movimento: Lenis + GSAP ScrollTrigger |
| `app.js` | Busca conversacional, avaliação instantânea, simulador |
| `vendor/` | Lenis 1.1.18 e GSAP 3.13 locais (funciona sem internet) |
| `colors_and_type.css`, `fonts/`, `assets/logos/` | Copiados do design system, sem alteração |
| `_fonttest.html` | Prova do problema das fontes trial — ver abaixo |

## Movimento (o que foi implementado)

| Efeito | Onde |
|---|---|
| Scroll com inércia (Lenis), sincronizado ao ScrollTrigger | todo o site |
| Hero composto em **3 camadas** com velocidades distintas: fundo, foto, marca d'água | home |
| Seção seguinte emerge como nuvem, sem borda | home |
| Carrossel coverflow "top investimentos" | home |
| Fita horizontal das 9 cidades, presa na tela (1.208 px de curso) | home |
| Parallax nas imagens editoriais (bairros, lançamentos, galeria, mapa) | ambas |
| Títulos revelados por máscara (clip-path), preservando `<br>` e destaques | ambas |
| Cards de bairro em profundidades alternadas | home |
| Contadores dos números do hero | home |
| Espelho de vendas preenchendo barra por barra | Enove Select |
| Header comprime, barra de progresso de leitura | ambas |
| Entradas escalonadas: especificações, custos, entorno | página do imóvel |
| Destaques em círculos que abrem um visor de stories | página do imóvel |
| Barra de ação que sobe quando o hero sai de cena | página do imóvel |

Tudo calibrado pelo manual: easing sem bounce, durações 120/200/320/520 ms,
reveals em fade + subida curta, sem zoom agressivo.

**Degradação:** com "reduzir movimento" ligado no sistema, a camada não roda e
o CSS entrega tudo estático. Sem GSAP, o `app.js` volta para
IntersectionObserver. No celular a fita vira rolagem horizontal nativa, sem pin.

## Hero — dois estagios, como a referencia

Os assets sao os que voce forneceu, em `assets/hero/`: o predio e **PNG
recortado** (alpha real, verificado), as nuvens tambem tem canal alpha, e o
ceu e JPG. Isso e o que permite o predio emergir das nuvens em vez de emergir
de uma caixa retangular.

### Estagio A — 0 a 45% do scroll

A cena sobe com tres velocidades diferentes, o que cria profundidade: o ceu
quase parado (+5%), as nuvens no meio (-22%), o predio subindo muito (-46% e
escala 1,14). Por cima, a missao da marca — "conectando pessoas a sonhos." —
que sai de cena antes do estagio B.

### Estagio B — 45 a 100%

Uma chapa clara acende cobrindo a cena, com o wordmark **vazado por mascara
SVG**. Onde estao as letras a chapa some, e por esses buracos aparece o predio
que esta atras. E o efeito dos screenshots 3 a 5 da referencia: a imagem
DENTRO das letras. O vazado cresce de 0,8 para 1,24 enquanto acende.

| z-index | camada |
|---|---|
| 100 | header |
| 55 | tufos de `cloud.webp` na faixa da frase, velando as pontas dela |
| 50 | cortinas de `cloud.webp` — abrem para as beiradas |
| 32, 31 | fumaca e nuvem frontais — passam NA FRENTE do vazado |
| 30 | **a chapa `#aad1e8` com o wordmark vazado** |
| 28 | contorno (as letras se desenhando) |
| 24 | banco de fumaca |
| 20 | predio |
| 15, 5 | nuvens do meio e do fundo |
| 10 | estagio A (missao + tagline + CTA) — desaparece atras do predio |
| 0 | ceu |

**A chapa NAO e uma cor: e o proprio ceu (`back.webp`).** Foi o ultimo passo
para chegar na referencia. Opaca, ela cobre o predio inteiro — que por isso
so continua visivel DENTRO das letras. O predio nao precisa de tween de
opacidade: quem o esconde e a chapa.

O caminho ate aqui passou por tres tentativas erradas, e vale registrar por
que cada uma falhou: azul translucido a 94% (a silhueta do predio noturno
atravessava e sujava o tom), azul opaco (limpo, mas o predio sumia por
completo, inclusive das letras nao — mas a leitura era de tinta chapada) e
azul translucido a 74% (o predio voltava, mas o fundo continuava sendo uma
cor, nao o ceu). O que a referencia faz e mais simples que qualquer uma:
a chapa e a mesma fotografia de ceu que ja esta atras.

**Por que a chapa lia branca.** O `fill` sempre foi `#aad1e8`, mas fumaca e
nuvem frontais estavam ACIMA dela e lavavam o tom (o rodape chegava a
`#eef4f8`). Desceram para z27/z26 e as cortinas cairam de `.78` para `.46` de
opacidade. Medido em Chrome real: media `#abc5d4`, desvio de 11/255 do alvo —
mais azul em cima, mais claro embaixo, onde estao as nuvens.

### Carrossel "top investimentos"

Substituiu a secao do manifesto. Mecanica de coverflow: os cartoes sao
**absolutos e posicionados pela distancia ate o ativo**, nao por uma pista
que desliza. E isso que permite o cartao central crescer e os vizinhos
recuarem sem reflow — so `transform` e `opacity` mudam.

- navegacao por setas, pontos, seta do teclado, arrasto e clique num vizinho
- o arrasto so decide a direcao ao soltar, e ignora gestos mais verticais que
  horizontais: senao competiria com a rolagem da pagina no celular
- fora do centro, os links saem da ordem de tabulacao (`tabIndex = -1`) e o
  cartao fica `aria-hidden` — sem isso o Tab passeia por cartoes invisiveis
- `z-index: 1` no `.carr__in`, pela mesma razao dos cards de bairro: o
  `::after` e gerado como ultimo filho e pintaria por cima do texto

**O selo usa Poppins, nao a display.** Ele tem um numero ("top 10"), e a
Cocogoose trial troca todo digito pelo glifo de marca d'agua da fundicao —
na primeira versao o selo saiu ilegivel. Mesma armadilha ja documentada para
os precos.

### A transicao do hero para a secao seguinte

A secao da busca era um bloco PRETO com o topo arredondado. Virou clara, e a
emenda com o hero e uma nuvem (`.cloudtop`), nao uma borda.

- `aspect-ratio: 768 / 248` — a proporcao nativa do `smoke.webp`. Sem isso a
  imagem estica e vira borrao, o mesmo erro que ja tinha aparecido nas
  camadas do hero.
- `translateY(-58%)` para invadir o hero.
- **A nuvem sozinha nao fecha.** Sobrava uma linha reta cruzando a tela no
  ponto em que o hero acaba. Por baixo dela vai um degradê que chega ao
  branco em 74% da caixa — antes da borda do hero.
- `.finder.overlap` zera o `border-radius` e o `overflow: hidden`, mas so
  para esta secao: `#bairros` tambem usa `.overlap` e continua arredondada.
- Os numeros das estatisticas eram **amarelos**; sobre branco ficariam
  ilegiveis e violariam o manual. Passaram para preto. Os chips invertem:
  brancos com borda cinza, e amarelo com texto preto no hover.

O ritmo da pagina agora e ceu -> secao clara -> `section.manifesto` preta.

### Geometria das nuvens

O ceu precisa ficar LIMPO no alto: na referencia as nuvens sao massas
definidas nas bordas e a nevoa so encosta na base do predio. Onde cada camada
comeca, em % da altura da tela:

| camada | topo | opacidade |
|---|---|---|
| tufos laterais (z55) | 14% (ate 44%) | .88 |
| cortinas (z50) | 50% | .34 |
| cloud-far | 74% | .42 |
| cloud-mid | 80% | .55 |
| cloud-front (z31) | 84% | .35 |
| smoke-bank | 86% | .50 |
| smoke-front (z32) | 90% | .45 |

**A base nunca pode cruzar o rodape** — se cruzar, aparece uma linha reta
atravessando a tela. Cada camada tem folga (`bottom` negativo) maior que a
subida que o scroll lhe da. Medido ao longo de todo o hero, a menor folga foi
de **120 px** abaixo da viewport.

**Os tufos descortinam.** Comecam sobre a frase — cada um cobrindo 303 px da
tinta do titulo — e saem para a sua extremidade conforme o scroll (`x` de
∓24vw). Em 80% do hero a sobreposicao e zero e a frase esta livre.

**Com `contain`, quem manda no tamanho e a MENOR dimensao da caixa.** Aumentar
so a altura nao aumenta a nuvem: ela fica igual, apenas centralizada numa
caixa maior. Por isso a caixa segue a proporcao do arquivo (2,36:1) — 44% de
largura pede 30vh de altura.

**Nao esticar o `cloud.webp`.** Ele e 768x326 (2,36:1). Encaixa-lo numa caixa
de outra proporcao com `background-size: 100% 100%` deforma e borra a nuvem —
foi o que transformou os tufos num veu difuso. Nos tufos a solucao foi
`contain` mais a caixa na proporcao certa, e **sem mascara**: o arquivo ja tem
alfa proprio, e a mascara radial dissolvia 74% da imagem.

### Decisoes que nao sao obvias

- **Numa mascara SVG, branco mostra e preto fura.** Por isso o retangulo da
  mascara e branco e o texto e preto — o inverso do que a intuicao sugere.
- **"imobiliaria" NAO e vazada.** Vazada, ela sumia no trecho onde a fachada
  do predio termina e so havia chapa clara atras. Agora e texto solido em
  grafite por cima da chapa, e escala junto com o vazado para o lockup nao se
  desmontar. O manual exige que o lockup seja italico e minusculo — nao exige
  que seja vazado.
- **O predio e ancorado pelo TOPO (`top: 50%`), nao pela base.** O
`predio.webp` e quadrado (1024x1024) e fica grudado na largura da tela, entao
a altura dele acompanha a LARGURA da viewport — nao tem nenhuma relacao com a
altura dela. Com a ancora em `bottom: -N%` (que e % da altura), ele estourava
por cima em telas largas e baixas (1920x820: topo em -198 px) e sumia embaixo
no celular (390x844: topo em 1002 px). Com `top: 50%`, o comeco fica em 50%
da tela em qualquer proporcao — conferido em 1440x900, 1920x820 e 390x844.

**Dimensoes intrinsecas na tag sao obrigatorias aqui.** Sem `width`/`height`,
o navegador so descobre a proporcao depois de decodificar a imagem, e o
ScrollTrigger media a cena com a altura errada: tres execucoes seguidas davam
tres resultados diferentes.

**O predio antigo era quadrado (1536x1536).** Para cobrir a largura da assinatura ele
  precisa de altura 112% da viewport; abaixo disso o "e" inicial e o "ve"
  final caem fora dele e mostram so ceu.
- **Duracoes explicitas em todos os tweens.** A duracao padrao de um tween
  GSAP e 0,5s. Sem declarar, os tweens do estagio A terminavam em 54% do
  scroll e a cena congelava no meio do caminho.
- **`immediateRender: false`** em todo `fromTo` do scrub. Sem isso eles
  renderizam na criacao: a chapa apareceria opaca ja no topo da pagina, e o
  par entrada + scrub deixaria tagline e CTA presos invisiveis.
- **A busca conversacional saiu do hero** e virou a secao seguinte (`#buscar`,
  bloco preto). Os IDs (`ask-input`, `ask-go`) e os chips seguem intactos.

### Ponto que precisa de decisao da marca

O knockout preenche o wordmark com fotografia. O manual diz que o logo nunca
vai sobre fundos "coloridos ou movimentados" — a leitura aqui foi de que isso
trata do **logo com o simbolo circular** (que o manual chama de sagrado), e
nao do wordmark tipografico, cujo uso em display minusculo o manual sanciona.
Se a marca preferir leitura estrita, a alternativa e o wordmark solido preto.


### As duas piscadas

Ambas apareciam durante o scroll, e tinham causas independentes:

1. **Promocao de camada alternando.** O CSS tinha `transform: translateZ(0)`
   na chapa e no contorno, mas o GSAP **sobrescreve a propriedade `transform`
   inteira** ao animar a escala — o `translateZ(0)` sumia, a camada era
   rebaixada, e voltava quando o GSAP parava. Solucao: tirar o `translateZ` do
   CSS e deixar o proprio GSAP promover, com `gsap.defaults({ force3D: true })`.
   Medido: 0 trocas de tipo de transform em 372 quadros.
2. **Vao no cruzamento contorno -> chapa.** O contorno apagava em 0,05 e a
   chapa acendia em 0,08, ambos comecando em 0,67 — em t=0,72 o contorno ja
   estava em 0 e a chapa em 0,625. Por alguns quadros quase nada aparecia.
   Solucao: a chapa acende primeiro (ela cobre o contorno de qualquer forma) e
   so entao o contorno apaga. A soma das opacidades no handoff nunca cai
   abaixo de 1,53.

3. **O transform saiu da raiz do SVG.** Um `transform` na raiz de um SVG
   mascarado obriga o navegador a re-rasterizar a mascara inteira a cada
   escala. Agora cada SVG fica PARADO dentro de uma `<div>`, e quem escala e a
   div — o Chrome rasteriza a mascara uma vez e o resto e composicao de GPU.

4. **"imobiliaria" existia em duas copias no cruzamento.** Uma em traco no
   contorno e outra solida dentro da chapa, ambas em `x=720 y=548`. O contorno
   ficava parado em escala 0,84 enquanto a chapa crescia para 1,2 — em t=0,72
   davam 16% de diferenca de tamanho, ou seja a palavra aparecia duplicada e
   desalinhada. No "enove" isso nao se nota porque ali o vazado e um buraco,
   nao texto solido. Solucao: o contorno percorre a MESMA curva de escala da
   chapa enquanto apaga. Medido: 0,1 px de diferenca de largura e 0,5 px de
   vertical em toda a janela em que as duas estao visiveis (antes: 61 px e
   30 px).

5. **A mascara deixou de ser um recurso SVG vivo.** A referencia
   (findrealestate.com) usa `mask-image` com um SVG apontado como IMAGEM sobre
   uma `<div>`. Um `<mask>` referenciado por `mask="url(#id)"` e um recurso SVG
   vivo, reavaliado a cada mudanca de pintura; como imagem, o navegador
   rasteriza uma vez e aplica como canal alfa. Como fonte externa nao carrega
   dentro de uma mascara, o wordmark foi **assado em contorno vetorial** em
   `assets/hero/knock-mask.svg` (8 KB), com `fill-rule="evenodd"`: o retangulo
   pinta, o contorno da letra fura, e o miolo do "o" e do "e" volta a pintar.
   As posicoes dos glifos vieram do proprio Chrome
   (`getStartPositionOfChar`), entao o kerning que ele aplica esta embutido —
   calcular pelas metricas da fonte dava 824,52 de avanco contra os 814,84
   reais. Conferido: buracos alinhados a 1,8 px na direita, 0,2 px no topo e
   1,0 px na base, sobre um wordmark de 820 px.

> **Se a fonte do wordmark mudar, `knock-mask.svg` precisa ser regerado.** Ele
> nao le mais a fonte em tempo de execucao.

> **Limite honesto desta investigacao.** Nao consegui reproduzir a piscada no
> ambiente de teste: screencast do CDP em DPR 1 e DPR 2, rolagem lenta e
> rapida, ~950 quadros compostos analisados, **zero** quadros destoantes dos
> dois vizinhos. O Chrome do teste rasteriza por software e por isso nao sofre
> o descarte de tiles de GPU que uma tela retina real sofre.

### O que foi tentado e revertido

Uma leva de otimizacoes especulativas piorou a situacao e foi desfeita:
reduzir os 45 elementos com `will-change` para 24, limitar a deriva ambiente
das nuvens a 3 camadas, e encolher a chapa da mascara de `2304x1440` para
`1840x1260`. **A ultima era um defeito real:** encolhida, a chapa nao alcanca
as beiradas em telas estreitas quando esta na menor escala (0,84) — e o teste
que a aprovou media numa escala maior, onde o problema nao aparece.

Tambem foi revertido um erro de encadeamento: fazer a chapa comecar a acender
antes do tween de escala dela. Entre os dois pontos ela renderizava em escala
1 e **saltava** para 0,84 no instante em que aparecia.

### O celular inverte a proporcao: titulo grande, predio pequeno

Medido na referencia em 390x844 — nao estimado por imagem:

| | referencia | aqui |
|---|---|---|
| titulo | 56,2 px = **14,4vw**, entrelinha 1,0 | 50,7 px = 13vw, 3 linhas |
| predio | **100%** da largura, topo em **60%** | 120% da largura, topo em 60% |
| nuvens | 187% e 149% | 187% (tufos) |

O titulo estava saindo com **24 px** no celular: o `clamp(1.5rem, 4.35vw, …)`
trava no minimo, porque 4,35vw da so 17 px numa tela de 390. Passou para
`clamp(2rem, 13vw, 3.6rem)`.

O predio nao pode ir a 100% como o da referencia: o arquivo daqui e retrato
(1024x1512) e sobe mais, entao a 100% a base entraria em quadro (folga de
-285 px). Fica em 120%, e **a subida cai para 34vh no celular** — no desktop
sao 62vh. O valor e uma funcao, para o refresh do ScrollTrigger reavaliar
quando a tela gira.

Folga da base medida ao longo de todo o hero: 28 px em 360x800, 66 px em
390x844, 72 px em 430x932. Nunca corta.

### O celular tem mascara propria

**Assar o wordmark na mascara quebrou o breakpoint mobile.** Antes, o
`@media (max-width: 720px)` reduzia `.knock__word` de 240 px para 196 px.
Esse elemento deixou de existir quando o wordmark virou contorno vetorial
dentro do arquivo de mascara — a regra virou letra morta e o vazado voltou ao
tamanho de desktop. Num celular retrato, o `viewBox` de 1440x900 com `slice`
amplia ~3,5x, entao so aparecia o miolo do lockup, cortado nos dois lados.

Solucao: **um segundo arquivo**, `knock-mask-mobile.svg`, gerado com o mesmo
metodo do de desktop mas a partir das posicoes de glifo medidas numa janela
de 430 px, e trocado por `mask-image` dentro da media query.

| | desktop | celular |
|---|---|---|
| `font-size` do lockup | 240 px | 82 px |
| largura no viewBox | 820 un. | 284 un. |
| arquivo de mascara | `knock-mask.svg` | `knock-mask-mobile.svg` |

**O `font-size` do `.line__word` e o da mascara TEM de ser o mesmo.** O
contorno e o vazado se sobrepoem durante o cruzamento; se os dois lockups
tiverem tamanhos diferentes, aparece a palavra duplicada — o mesmo defeito
que ja tinha acontecido com "imobiliaria". Conferido no celular: escalas
iguais em t=0,68, 0,70 e 0,72.

Os 82 px vem de uma conta com margem: no fim da animacao a chapa cresce para
1,2, e a 96 px o lockup chegava a 96% da largura da tela.

Varredura completa em 360x800, 390x844 e 430x932: sem vazamento horizontal,
sem bloco preso invisivel, sem texto cortado, sem erros.

> **Se mudar o `font-size` mobile do lockup, `knock-mask-mobile.svg` precisa
> ser regerado** — vale o mesmo aviso do arquivo de desktop.

## A página do imóvel

Reestruturada seguindo a referência que voce trouxe:

| Bloco | O que e |
|---|---|
| hero | foto sangrando com o nome e o endereco por cima |
| linha de fatos | tipo, endereco e situacao, com icone |
| mosaico | 1 grande + 2 a direita + 4 embaixo, com "+23 fotos" no ultimo |
| todas as caracteristicas | lista em grade, com o check desenhado por mascara CSS |
| destaques | circulos que abrem stories (abaixo) |
| barra de acao | fixa no rodape, sobe quando o hero sai de cena |

**A barra so aparece depois do hero.** No topo ela competiria com o CTA do
proprio hero, e o visitante veria dois "agendar visita" ao mesmo tempo.

**`.card__tag` precisou de `position: static` no hero.** Na origem ele e
absoluto, ancorado no canto de um card — reaproveitado no hero, os dois
selos empilhavam por cima do nome do imovel.

### Atencao com as fotos de exemplo

Duas fotos do Unsplash em uso **nao sao de imoveis**: uma e um mapa-mundi e a
outra e o retrato de uma pessoa. Ambas estao corretas onde ja estavam — o
mapa no bloco "mapa do bairro", o retrato na corretora e no time — mas foram
parar por engano no mosaico e nos stories, onde apareciam como "patio" e
"rua sem saida". Ao trocar fotos de exemplo, conferir o que o ID devolve:
o nome do arquivo nao diz nada sobre o conteudo.

## Destaques em formato de story

Circulos com anel em degradê que abrem um visor em tela cheia, no padrao de
destaques de rede social. Quatro destaques, 2 a 3 quadros cada.

- uma barra de progresso por quadro, avanco automatico de 5 s
- toque/clique nas laterais navega; segurar pausa; arrastar para baixo fecha
- teclado: setas e `Escape`
- ao terminar um destaque segue para o proximo; depois do ultimo, fecha
- com "reduzir movimento" ligado o avanco automatico **nao roda** — so manual

Dois detalhes que sao facilmente esquecidos e quebram a experiencia:

- **A rolagem da pagina precisa ser travada enquanto o visor esta aberto**, e
  o Lenis parado junto (`__lenis.stop()`). Sem isso a pagina rola atras do
  visor. Verificado que solta ao fechar, senao a pagina fica presa.
- **O foco volta para o circulo de origem ao fechar.** Sem isso quem navega
  por teclado e devolvido ao topo do documento.

O anel usa `conic-gradient` no degradê quente-para-frio das redes sociais:
amarelo e laranja embaixo a esquerda, subindo para magenta e roxo em cima a
direita. **E o unico ponto do site fora da paleta do manual** — foi uma
escolha deliberada, porque a leitura de "isto abre como story" depende
dessas cores. A primeira versao usava amarelo e o dourado do Enove Select e
nao comunicava o formato.

No desktop o visor **nao ocupa a tela toda**: o quadro fica num palco
vertical de 440 px centrado, com as barras e o cabecalho alinhados a ele.
Espalhados pela largura inteira, ficavam a metros da foto. No celular
preenche a tela.

## Fluidez do scroll — como foi calibrada

Havia **suavização dupla**: o Lenis amortece a posição do scroll e o `scrub`
do ScrollTrigger amortecia de novo por cima. As latências somam.

### Curso do hero: 390vh

A referencia usa **500vh**, e o hero daqui chegou a usar o mesmo — mas assim
ele exigia **5 gestos** para ser atravessado. A 390vh sao 2.610 px de curso,
ou **tres roladas**, com o gesto medido de 878 px (multiplicador de roda
1,3). Verificado simulando uma rajada de trackpad com momento:

| | scrollY | % do hero |
|---|---|---|
| apos 1 rolada | 878 px | 34% |
| apos 2 roladas | 1.756 px | 67% |
| apos 3 roladas | 2.634 px | 101% |

O que cada etapa ganha nesse curso: contorno se desenhando 1.279 px,
cruzamento para o vazado 209 px, crescimento 339 px, pausa final 365 px.

> **Este numero depende do `wheelMultiplier`.** Ele esta em 1,3; voltando
> para 1:1 o hero passaria a exigir quase 4 roladas. Se um mexer, o outro
> precisa ser recalculado.

> **Encurtar o hero e diferente de acelerar o scroll.** A curva do Lenis nao
> muda — o que muda e quanta cena passa por pixel rolado. Foi por isso que
> nao mexi no `wheelMultiplier`: aumentar ele daria o mesmo efeito no hero,
> mas quebraria o 1:1 com o sistema no site inteiro.

O breakpoint mobile segue a mesma conta (240vh), mas **nao foi medido** —
nao da para simular toque neste ambiente.

### O easing e composto, e por um motivo especifico

Numa exponencial pura (`1.001 - 2^-10t`, o padrao do Lenis), **arrancada e
cauda sao a mesma variavel**: mexer na `duration` desloca a curva inteira.
Verificado algebricamente — mantendo 40% do percurso aos 50 ms, o fim cai
sempre no mesmo instante, qualquer que seja a duracao. Nao da para pedir
"mais rapido no comeco e mais macio ao parar" dentro dessa familia.

A solucao foi somar duas exponenciais: a rapida (`2^-16t`, peso 0,65) domina
a arrancada, a lenta (`2^-4t`, peso 0,35) sustenta a cauda.

| | exponencial pura | composto |
|---|---|---|
| fracao aos 50 ms | 39% | **43%** |
| chega a 95% | 301 ms | 407 ms |
| chega a 99% | 455 ms | **607 ms** |

Medido no navegador depois de aplicar: 43% aos 50 ms, 92% aos 300 ms, 97%
aos 500 ms.

> A divisao por `(1 - R1)` nao e cosmetica: sem normalizar, a curva termina
> em 0,978 e o Lenis daria um pulo visivel no ultimo quadro.

**A configuracao do Lenis foi MEDIDA na referencia, nao escolhida por gosto.**
Metodo: um unico evento de roda, `window.scrollY` amostrado a cada quadro, e
a curva ajustada contra o easing padrao do Lenis.

| Parametro | Referencia | Como foi obtido |
|---|---|---|
| `duration` | **1,16** | melhor ajuste da curva, erro quadratico medio 6,4e-6 |
| `wheelMultiplier` | **1** | 100 px por deltaY 100, confirmado tambem com deltaY 200 |
| `easing` | padrao do Lenis | a curva medida cola nele |

Depois de aplicar, as duas curvas coincidem quadro a quadro:

| tempo | referencia | enove |
|---|---|---|
| 50 ms | 0,260 | 0,260 |
| 100 ms | 0,450 | 0,450 |
| 200 ms | 0,700 | 0,730 |
| 500 ms | 0,950 | 0,950 |
| 800 ms | 0,990 | 0,990 |

**A referencia nao e mais rapida a assentar — e o contrario.** Ela leva ~700 ms
para completar 99% do percurso; a configuracao anterior daqui levava ~200 ms.
O que faz a dela parecer rapida E fluida ao mesmo tempo e o formato: 26% do
caminho nos primeiros 50 ms (responde na hora) e uma cauda longa e macia.
Snappy demais le como seco, nao como rapido.

> Isto so funciona porque o `scrub` do ScrollTrigger e `true`. Com `scrub`
> numerico havia **suavizacao dupla** e as latencias somavam — foi por isso
> que a tabela abaixo, medida naquela epoca, condenava duracoes longas.

### Historico: a calibragem sob suavizacao dupla

| Configuração | A cena para depois da roda |`lerp` foi testado e e pior aqui: o decaimento exponencial tem cauda longa
(lerp 0.11 dava 832 ms, lerp 0.08 dava 1216 ms).

**Nao era engasgo.** Bisseccao desligando uma camada por vez (chapa mascarada,
contorno, predio, cada camada de nuvem, ceu) deu 60 fps e zero quadros acima
de 20 ms em todas as combinacoes. O problema era latencia de resposta, nao
taxa de quadros — por isso otimizar imagem ou camada nao teria adiantado.

> Nota de metodo: a primeira medicao que fiz usava
> `lenis.scrollTo({immediate:true})` dentro de um rAF, o que pula o pipeline
> real de scroll e nao mede nada util. As medicoes acima usam evento de roda
> de verdade.

## Armadilhas da fonte trial (alem dos numeros)

A Cocogoose trial ja tinha quebrado os digitos. Ela tambem **corrompe a
unidade `ch`**: `ch` e medida pelo avanco do glifo "0", que nessa fonte e o
bloco de marca d'agua, com 90,9 px contra 100,3 px do "M". Um `max-width: 15ch`
resolveu para 1363 px em vez dos ~780 px pretendidos, e o titulo saiu 15 px
fora do centro. **Nao usar `ch` nem `ex` enquanto a licenca nao for resolvida.**

## Verificado com navegador real

Playwright + Chrome, 1440×900 e 390×844:

- Nenhum erro de JS nas duas páginas
- Hero: as 3 camadas movem em velocidades diferentes ✓
- Fita: 1.208 px de curso horizontal, legenda dentro da janela ✓
- Manifesto: linhas acendem e apagam ✓
- Nenhum bloco preso invisível (exceto o da busca, que está em seção `hidden`
  por projeto e aparece ao buscar) ✓
- Busca conversacional: 9 frases testadas, incluindo "até 1 milhão" e "1,2 mi"
- Simulador conferido contra cálculo independente em 4 cenários
- Mobile 390 px: sem vazamento horizontal ✓

## ⚠ Achado crítico — as fontes trial não têm números

As fontes de display entregues no design system são versões **trial** e
substituem **todos os dígitos** por um glifo de marca d'água:

| Fonte | Dígitos 0-9 |
|---|---|
| `Cocogoose-Pro-*-trial.ttf` | `TRIAL ONLY — ZETAFONTS.COM` |
| `altair.*.ttf` | `NON COMMERCIAL USE ONLY — GET FULL VERSION FROM ZETAFONTS.COM` |
| `Poppins-*.ttf` | corretos (fonte aberta) |

Ou seja: **todo preço do site sairia como propaganda da fundição.** Abra
`_fonttest.html` no servidor local para ver.

Solução aplicada no protótipo: a variável `--font-num` roteia todo número
(preço, área, parcela, contadores) para **Poppins** — que o próprio manual já
define como a família de UI. Ao licenciar a Cocogoose comercial, revalidar os
dígitos e decidir se os números voltam para o display.

## O que funciona de verdade

- **Busca conversacional** — interpreta a frase, mostra os filtros extraídos e
  explica por que cada imóvel apareceu, com % de match relativo ao pedido.
- **Simulador de custo real** — tabela Price com taxa efetiva mensal, ITBI,
  escritura e registro, custo mensal e renda necessária. O valor no trilho de
  preço lê os mesmos números, então nunca divergem.
- **Avaliação instantânea** — faixa de valor por R$/m² de bairro.

## O que é simulado

- **Imóveis** — ilustrativos, em `app.js`. Em produção vêm do Flip CRM.
- **A "IA" da busca** — interpretador local em JavaScript, para demonstrar a
  experiência sem depender de rede. Em produção é a Claude API, que entende
  frases muito além dos padrões previstos aqui.
- **R$/m² por bairro e cidade, e o espelho de vendas** — números de referência.
- **Fotos** — Unsplash, só para dar volume à composição. **Nenhuma é do Vale do
  Sinos.** As trocas mais óbvias já foram feitas (tinha arranha-céus em "Novo
  Hamburgo" e uma cabana nórdica em "Ivoti"), mas toda a fotografia precisa ser
  substituída por material real da Enove — é pré-requisito do projeto.
- **Mapa** — imagem estática no lugar do Mapbox.

## Pendências antes de produção

1. **Licença das fontes** — ver o achado acima. Bloqueia o go-live.
2. **Fotografia real** — o site é construído para fotografia grande; foto de
   celular mal iluminada fica pior que o site atual.
3. **Alíquota do ITBI** — `app.js` usa 2% para Estância Velha e 1,5% de
   escritura + registro. Confirmar os valores vigentes.
4. **Integração com o Flip CRM** — definir se há API ou apenas feed XML.

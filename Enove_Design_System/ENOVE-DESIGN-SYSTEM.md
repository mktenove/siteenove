# Enove Design System — Guia para Claude Code

> **Conectar pessoas a sonhos.**
> Sistema de identidade da **Enove Imobiliária** (Estância Velha/RS) — imobiliária de alta performance no Sul do Brasil — e da sub-marca **Enove Select**, voltada a lançamentos premium.
>
> Este arquivo é a fonte única de verdade da marca. Leia antes de gerar qualquer interface, página, peça ou protótipo Enove. Quando houver conflito, **os tokens de cor/tipografia desta seção valem**.

---

## 1. Quem é a Enove

Imobiliária moderna, dinâmica e confiável. O nome "Enove" carrega *renovação e evolução*. O símbolo circular da "e"-seta reforça completude, ciclo e proteção.

A marca equilibra seis forças: performance comercial · cultura viva (*o jeito Enove de ser*) · sofisticação com segurança · conexão emocional (vende sonhos, não só imóveis) · inovação/visão de futuro · e dois mundos — **Enove Imobiliária** (imóveis prontos) + **Enove Select** (lançamentos).

**Dados institucionais (Matriz):**
- CRECI **24775**
- Plantão de vendas: **(51) 99766-8999**
- Fale conosco: **(51) 3102-8999**
- **Avenida Brasil, 1213 — Centro · Estância Velha/RS**

---

## 2. Voz e conteúdo (pt-BR)

- **Idioma:** Português (pt-BR). Direto, caloroso, profissional.
- **Pessoa:** sempre **"nós" → "você"** (informal). Nunca *tu*, nunca *o senhor*.
- **Caixa:**
  - **CAIXA ALTA** para títulos de seção e frases-manifesto: `MISSÃO`, `VISÃO`, `VALORES`, `FAZEMOS A COISA CERTA SEMPRE.`
  - **caixa baixa** para o logotipo e momentos de display — a marca é `enove`, tagline *imobiliária*.
  - **Sentence case** para corpo de texto, intros e labels de UI.
  - **Evite Title Case.**
- **Ritmo:** frases curtas e declarativas. Ponto final dentro de manchetes. Exclamação com parcimônia.
- **Voz:** treinador motivador ("Somos o melhor time"), direto e honesto ("Não cortamos caminho"), caloroso e humano ("identidade amarelinha"), números ambiciosos na frente (R$ 1 bilhão, 2030).
- **Vocabulário:** Jeito Enove de ser · Conectar pessoas a sonhos · performance · excelência · integridade · comprometimento · inovação · plantão de vendas · corretor · VGV · lançamento · imóvel pronto · identidade amarelinha · time.
- **Proibido:** corporativês, jargão em inglês ("stakeholder" não; CRM ok), emoji em material de marca, hashtag em manchete.

---

## 3. Cores

### Núcleo da marca
| Token | Hex | Nome | Uso |
|---|---|---|---|
| `--enove-yellow` | `#FFFF00` | Amarelo Enove (Pantone Yellow C) | cor primária / acento |
| `--enove-black` | `#000000` | Preto Puro (Pantone Black C) | primária / texto / fundos |
| `--enove-white` | `#FEFEFE` | Branco | canvas |
| `--enove-graphite` | `#373435` | Grafite | superfície escura secundária |
| `--enove-gray-mid` | `#8C8A8B` | Cinza Médio | texto terciário |
| `--enove-gray-light` | `#D4D3D3` | Cinza Claro | bordas / divisores |

**Variações de amarelo:** `--enove-yellow-light #FFFF66` (secundário) · `--enove-yellow-hot #FFEA00` (press/active) · `--enove-yellow-soft #FFFCA8` (fundo) · `--enove-yellow-dim #F5ED00` (hover).

**Enove Select (sub-marca premium):** `--select-gold #C89B3C` · `--select-gold-soft #E7C77A` · `--select-gold-pale #F5E6B8` · `--select-gold-deep #8A6618`.

**Semânticas:** ok `#50CF01` · warn `#FF9900` · danger `#FF0000` · info `#0004FF`.

### Regras de cor (não-negociáveis)
- O **amarelo pareia com preto ou grafite — nunca com texto branco por cima**.
- Amarelo = energia e otimismo; preto = poder e sofisticação.
- O **logo só vai sobre:** preto ✓, grafite ✓, azul escuro ✓, cinza escuro ✓, branco ✓, cinza claro ✓.
- **Nunca** coloque o logo sobre: amarelo ✗, vermelho ✗, fundos coloridos/atarefados ✗.
- **Sem gradientes de marca.** Fundos são sólidos — preto ou branco dominam; grafite é a escura secundária.

---

## 4. Tipografia

| Papel | Família | Notas |
|---|---|---|
| **Display + wordmark** | **Cocogoose Pro** | a fonte da marca (combina com o logo). Geométrica, arredondada. Display em **caixa baixa**, tracking apertado (`-0.02em`), peso Bold/ExtraBold/Heavy. |
| **Corpo + UI** | **Poppins** | workhorse secundária. 14–16px, line-height 1.55–1.6. |
| **Sinalização / placa** | **Bungee** | placas VENDE, pôsteres, sinalização grande em caixa alta. |
| **Hero especial** | **Cocogoose Letterpress** / **Cocogoose Darkmode** | momentos de destaque; Darkmode otimizada para fundo preto. |
| **Display alternativo** | **Altair** | mantida disponível como alternativa de display. |
| **Script (só Select)** | **Allura** | substituição sinalizada para a marca manuscrita "Select". ⚠︎ |

### Regras de tipo
- **Display:** lowercase, tracking `-0.02em`, Cocogoose Pro Bold/ExtraBold (ou Heavy/Ultra para impacto).
- **H1/H2:** Cocogoose Pro Bold (800), tracking apertado. H1 ~36px (manual 32–48pt), H2 ~28px (24–28pt).
- **H3/H4:** Poppins Bold (700). H4 em caixa alta, tracking `0.04em`.
- **Corpo:** Poppins Regular 14–16px, line-height 1.6.
- **Eyebrow:** Cocogoose Pro Bold 11px, caixa alta, tracking `0.12em`.
- **Lockup "imobiliária":** sempre itálico, sempre caixa baixa.

---

## 5. Espaçamento, raios, sombras, motion

- **Spacing (base 8px):** 0 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- **Raios:** xs 4 · sm 8 · md 14 · lg 22 · xl 32 · pill 999. Calmos. **Sem cards com borda-só-na-esquerda.**
- **Sombras:** curtas e suaves. Exceção: glow amarelo de assinatura em CTAs primários (`0 12px 28px -10px rgba(255,230,0,.55)`).
- **Bordas:** hairline `#E6E6E6` no branco; `rgba(255,255,255,0.14)` no preto.
- **Motion:** easing `cubic-bezier(.2,.7,.2,1)` (confiante, sem bounce). Durações 120/200/320/520ms. Hover: escurece amarelo para `--enove-yellow-dim` + eleva sombra. Press: 98% scale + `--enove-yellow-hot`. Reveals: fade + 4px up.

---

## 6. Layout, imagem e iconografia

- **Layout:** gutters generosos (≥64px desktop, 24px mobile). Blocos preto full-bleed para heroes/quebras. Composições centralizadas são nativas da marca. Header fixo: fundo preto + CTA amarelo à direita.
- **Fotografia:** arquitetural (fachadas urbanas, interiores modernos, skyline golden-hour), do dia ao crepúsculo, ancorada. Select: quente, dourada, crepúsculo/noite, leve grão. **Sem foto de família sorrindo de banco de imagem.** Sem padrões repetidos (exceto a marca d'água sutil de 9-marcas).
- **Transparência:** com parcimônia. Scrim preto 6–12% sobre fotos ok. Evite vidro fosco (puxa pro estético Apple).
- **Ícones:** sem set proprietário → **Lucide** (substituição sinalizada), traço 1.75px @ 24px. Um estilo por superfície, só strokes. Cor do ícone = cor do texto atual, salvo quando o ícone *é* o CTA (preto no amarelo / amarelo no preto). **Sem emoji.** Glifos unicode (→ ✓ · —) ok inline.
- **Símbolo "e"-seta circular é sagrado:** amarelo/branco/preto apenas, sem rotação, sem efeitos, nunca separado do círculo.

### Logos disponíveis
| Arquivo | Quando usar |
|---|---|
| `assets/logos/enove-yellow.png` | Primário — wordmark amarelo sobre preto/grafite |
| `assets/logos/enove-yellow-transparent.png` | Wordmark amarelo com fundo transparente |
| `assets/logos/enove-white.png` | Wordmark sobre foto / fundos escuros coloridos |
| `assets/logos/enove-watermark.png` | Marca d'água sutil sobre fotografia |
| `assets/logos/enove-mark-3d.webp` | Só momentos hero — raro, alto impacto |
| `assets/logos/enove-select.jpg` | **Só** em Enove Select (lançamentos) |

Tamanhos mínimos: 30mm impresso, 100px digital. Favicon usa o símbolo circular sozinho. **Nunca redesenhe o logo — use os arquivos.**

---

## 7. Como usar este sistema no Claude Code

1. **Importe os tokens primeiro.** Copie `colors_and_type.css` (variáveis de cor, tipo, espaçamento, raios, sombras, motion) e dê `@import`/`<link>` antes de qualquer estilo próprio.
2. **Leve as fontes.** Copie a pasta `fonts/` (Cocogoose Pro display+wordmark, Poppins body/UI, Bungee signage, Altair alternativa) para junto do CSS em artefatos offline.
3. **Use os logos** de `assets/logos/` — nunca redesenhe.
4. **Para produção:** copie os assets e siga as regras acima para virar especialista na marca.

### Não-negociáveis (resumo)
- Amarelo é **#FFFF00**, pareia com **preto #000000** ou **grafite #373435**, nunca com texto branco. Logo nunca sobre amarelo/vermelho/fundo atarefado.
- Display é **caixa baixa**, tracking apertado, Cocogoose Pro Bold/ExtraBold. Títulos no tom da cultura em **CAIXA ALTA**. Evite Title Case.
- Voz pt-BR, *nós → você*, tom de treinador caloroso. Sem emoji, sem hashtag, sem corporativês.
- Sem gradientes de marca, sem cards de borda-só-esquerda, sem foto de banco sorridente. Só fotografia arquitetural/urbana/golden-hour.

---

## 8. Ressalvas em aberto
1. **Allura** (script do Select) é substituição — forneça a fonte cursiva real se houver.
2. **Enove Select** (ouro + script) foi reconstruída a partir de um único JPG. Se houver manual próprio do Select, compartilhe.
3. Confirmar número de visão canônico (R$ 1bi/2030).

# Enove Design System

> **Conectar pessoas a sonhos.**  
> Identity system for **Enove Imobiliária** — a high-performance real-estate firm in Southern Brazil, with a sub-brand **Enove Select** for premium launches (lançamentos).

---

## Who is Enove?

A real-estate agency positioning itself as **modern, dynamic, trustworthy**. The name "Enove" carries *renovação e evolução* — renewal and evolution. The circular "e"-arrow symbol reinforces completude, ciclo, proteção (completeness, cycle, protection).

Blend of six things:

1. **Commercial performance** — metas ousadas, sales culture, constant evolution.
2. **Living culture** — the *jeito Enove de ser*.
3. **Sofistication with safety** — modern and elegant **and** trustworthy.
4. **Emotional connection** — selling dreams, not only buildings.
5. **Innovation / future vision** — tech, automation, AI, CRM.
6. **Two worlds** — **Enove Imobiliária** (imóveis prontos) + **Enove Select** (lançamentos).

Vision target: R$ 1 billion in VGV by 2030, become *a maior referência em performance, inovação e experiência imobiliária no Sul do Brasil*.

---

## Source materials

- **Manual de Identidade Visual** — live at `https://enovebrand-wsqn6uw2.manus.space/` (canonical source for colors, fonts, logo rules).
- `Manual da Cultura - 2025.pdf` — current 32-pp culture manual.
- Logo files under `assets/logos/`.
- Brand fonts under `fonts/` — see below.

---

## CONTENT FUNDAMENTALS — how Enove writes

**Language.** Portuguese (pt-BR). Direct, warm, professional.

**Person.** Always **"nós"** → **"você"** (informal). *"Você corretor é nosso maior ativo!"*, *"queremos ouvir você"*. Never *tu*, never *o senhor*.

**Casing.**
- **ALL CAPS** for rallying section titles: `MISSÃO`, `VISÃO`, `VALORES`, `FAZEMOS A COISA CERTA SEMPRE.`
- **all-lowercase** for the wordmark and display moments — the logo is `enove`, tagline *imobiliária*.
- **Sentence case** for body paragraphs, chapter intros, UI labels.
- **Avoid Title Case.**

**Punctuation & rhythm.** Short, declarative. Periods inside headlines (*"FAZEMOS A COISA CERTA SEMPRE."*). Exclamations used sparingly (*"NUNCA DEIXE UM CLIENTE ESPERANDO!"*).

**Voice.**
- **Rallying coach** — *"Somos o melhor time"*, *"juntos atingimos resultados extraordinários"*.
- **Direct and honest** — *"Não cortamos caminho"*.
- **Warm and human** — *"identidade amarelinha"*, *"com muito carinho"*.
- **Ambitious numbers upfront** — R$ 1 bilhão, 2030.

**Vocabulary.** Jeito Enove de ser · Conectar pessoas a sonhos · performance · excelência · integridade · comprometimento · inovação · positividade · segurança · plantão de vendas · corretor · VGV · lançamento · imóvel pronto · identidade amarelinha · time.

**No-no's.** No corporate-speak. No English jargon (CRM ok, "stakeholder" not). No emoji in brand material. No hashtags in headlines.

**Examples.**
- Mission — `Conectar pessoas a sonhos.`
- Vision — `Consolidar a Enove como a maior referência em performance, inovação e experiência imobiliária no Sul do Brasil, atingindo R$ 1 bilhão em VGV até 2030.`
- Rally — `FAZEMOS A COISA CERTA SEMPRE.`
- Tagline — *imobiliária* (italic, lowercase, paired with wordmark).

---

## VISUAL FOUNDATIONS

### Color

Primary: **Amarelo Enove `#FFFF00`** (Pantone Yellow C) + **Preto Puro `#000000`** (Pantone Black C) + **Branco `#FEFEFE`**.
Secondary: **Amarelo Claro `#FFFF66`** · **Grafite `#373435`** · **Cinza Médio `#8C8A8B`** · **Cinza Claro `#D4D3D3`**.

Rules from the manual:
- Yellow pairs with **black or graphite**, never with white text on top.
- Logo ONLY goes on: black ✓, grafite ✓, azul escuro ✓, cinza escuro ✓, branco ✓, cinza claro ✓.
- **Never** place the logo on: yellow ✗, red ✗, colorful/busy backgrounds ✗.
- Yellow transmits *energia e otimismo*; preto transmits *poder e sofisticação*. Together, an *identidade impossível de ignorar*.

### Typography

Per the Manual de Identidade Visual:

- **Primary display — Altair** (the true brand font, now shipped in `fonts/`). Geometric, modern, very legible. Used for the wordmark and all display moments. Replaces Montserrat everywhere.
- **Heading fallback — Space Grotesk** (Bold) at 32–48 pt for H1, 24–28 pt for H2. Used where Altair isn't loaded or for highlight type.
- **Body — DM Sans** Regular / Italic / Bold for paragraphs, UI, cards. 14–16 pt.
- **Signage — Bungee** (also shipped) for placas VENDE, campaign posters, anywhere big uppercase signage is needed.
- **Script (Select only) — Allura** stand-in for the hand-drawn "Select" mark. **⚠︎ Substitution flagged.**

Rules:
- Display: **lowercase**, tight tracking (`-0.02em`), Altair Heavy (900) or Ultra (950).
- H1 / H2: Space Grotesk Bold, tight tracking.
- Body: DM Sans Regular 14–16 pt, line-height 1.55–1.6.
- Eyebrow: Space Grotesk Bold 11 pt, uppercase, `0.12em` tracking.
- *imobiliária* lockup: always italic, always lowercase.

### Backgrounds

- Solids dominate — **black** or **white**. Graphite is the secondary dark surface.
- Full-bleed black hero sections are canonical (see site + all logo files).
- **No gradient brand backgrounds** in the supplied system. Avoid making up colored gradients.
- Photography: architectural (urban façades, modern interiors, golden-hour skylines), daylight-to-dusk, grounded. No stock-photo smiley families.
- **No repeating patterns** in the supplied system. A faint 9-mark watermark is the only brand-safe pattern.

### Animation

Not explicitly documented. Tone-match:
- Easing `cubic-bezier(.2,.7,.2,1)` — confident, grounded, no bounce.
- Durations 120 / 200 / 320 / 520 ms.
- Hover: darken yellow to `--enove-yellow-dim`, lift shadow.
- Press: 98% scale, `--enove-yellow-hot`.
- Reveals: fade + 4 px up translate. No big zooms.

### Borders, shadows, radii

- Hairline borders `#E6E6E6` on white; `rgba(255,255,255,0.14)` on black.
- Short soft shadows — except a signature yellow glow on primary CTAs.
- Radii calm: 8 / 14 / 22 / 32 px. Pills (`999px`) for tags and chips.
- **No left-border-only accent cards.**

### Layout rules

- Generous gutters (min 64 px desktop, 24 px mobile). The wordmark breathes in all supplied assets.
- Full-bleed black blocks for heroes / section breaks.
- Centered compositions are brand-native.
- Fixed header: black ground + yellow CTA on the right.

### Transparency & blur

Sparingly. 6–12% black scrim on hero photos OK. Avoid frosted glass — drifts toward Apple aesthetic.

### Imagery colour vibe

- Imobiliária: neutral-to-warm, daylight, architectural.
- Select: warm, golden, dusk/night, a touch of grain.

---

## ICONOGRAPHY

No proprietary icon set. **Substitution (flagged): Lucide** — stroke-based, 1.75 px weight at 24 px, matches Altair's geometric bones. MIT, CDN-available.

Rules:
- One style per surface — strokes only, never mixed with filled.
- Icon colour = current text colour, unless the icon *is* the CTA (then black on yellow or yellow on black).
- Icon + label preferred; icon-only only in dense toolbars.
- **Emoji:** 🚫 not used in brand material.
- **Unicode glyphs** (→ ✓ · —) OK inline.
- **The "e"-arrow circular symbol** is sacred — yellow / white / black only, no rotation, no effects, never separated from its circle.

**Logo assets:**
| File | Use when |
|---|---|
| `assets/logos/enove-yellow.png` | Primary — yellow wordmark on black/graphite |
| `assets/logos/enove-white.png` | Wordmark on photo / coloured dark backgrounds |
| `assets/logos/enove-watermark.png` | Subtle watermark on photography |
| `assets/logos/enove-mark-3d.webp` | Hero moments only — rare, high-impact |
| `assets/logos/enove-select.jpg` | **Only** in Enove Select (lançamentos) |

Minimum sizes (per manual): 30 mm print, 100 px digital; icon/favicon uses the circular symbol alone.

---

## Index

```
README.md                   ← this file
SKILL.md                    ← Agent SKILL manifest
colors_and_type.css         ← CSS tokens: colors, type, spacing, radii, motion
fonts/                      ← Altair family (TTF) · Bungee-Regular.ttf
assets/logos/               ← all Enove marks + Select lockup
preview/                    ← Design System tab cards (one HTML per card)
ui_kits/
  enove-imobiliaria/        ← marketing-site UI kit (React/JSX)
```

### UI kits
- **`ui_kits/enove-imobiliaria/`** — marketing-style recreation: header, hero, property search, property card grid, footer.

---

## Caveats & open questions

1. **Allura** (Select script) is a substitution — supply the real cursive source if you have it.
2. **No live website or Figma** for Enove Imobiliária itself — the UI kit is reconstructed from brand manual + brand tone. Provide a URL or Figma to make it pixel-perfect.
3. **Enove Select** palette (gold + script) is reconstructed from one JPG lockup. If Select has its own manual, share it.
4. **Vision number mismatch** between the two culture manuals (R$ 100M / 2026 vs R$ 1 bn / 2030). Confirm which is canonical.

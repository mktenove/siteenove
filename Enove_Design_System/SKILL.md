---
name: enove-design
description: Use this skill to generate well-branded interfaces and assets for Enove Imobiliária (and sub-brand Enove Select), either for production or for throwaway prototypes, mocks, slides, signage, social posts, etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

Start points:
- `README.md` — the full brand bible: who Enove is, voice, content rules, visual foundations, iconography.
- `colors_and_type.css` — drop-in CSS variables for colors, typography, spacing, radii, shadows, motion. Import this FIRST in any HTML you create for Enove.
- `fonts/` — the real brand fonts (Cocogoose Pro for display + wordmark, Poppins for body/UI, Bungee for signage, Altair as alternative display). Copy these next to your CSS when creating offline artifacts.
- `assets/logos/` — all Enove and Enove Select marks. Use these — never redraw the logo.
- `ui_kits/enove-imobiliaria/` — ready-made React components (Header, Footer, PropertyCard, SearchBar, Button, Tag, Icon) you can lift into any prototype.
- `preview/` — reference cards for each token / component; useful to eyeball what "good" looks like before you build.

Non-negotiables:
- Yellow is **#FFFF00**. Pairs with **black #000000** or **graphite #373435**, never directly with white text. The logo never sits on yellow, red or busy coloured grounds.
- Display type is **lowercase**, tight tracking, Cocogoose Pro Bold/ExtraBold. Section titles in the culture voice are **ALL CAPS** (e.g. `FAZEMOS A COISA CERTA SEMPRE.`). Avoid Title Case.
- Voice is pt-BR, *nós → você*, warm coach tone. No emoji, no hashtags, no corporate-speak.
- No gradient brand backgrounds, no left-border-only accent cards, no stock-photo smileys. Architectural / urban / golden-hour photography only.

If creating visual artifacts (slides, mocks, throwaway prototypes, signage, social posts), copy `colors_and_type.css`, the referenced `fonts/` files, and any logos into your artifact folder and build static HTML for the user to view.

If working on production code, you can copy assets and read the rules here to become an expert in designing with the Enove brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (format, audience, channel — imobiliária vs Select, print vs digital), and then act as an expert designer who outputs HTML artifacts — or production code — depending on the need.

# Enove Imobiliária — UI Kit

Marketing-site UI kit for Enove Imobiliária. Reconstructed from:
- The Manual de Identidade Visual (https://enovebrand-wsqn6uw2.manus.space/)
- The Manual de Cultura 2025
- Brand tone notes

**This is not a recreation of a real live site** — no Enove Imobiliária URL or Figma was provided. The kit captures the *look & feel* the brand manual prescribes. When a live site or Figma arrives, we can align component-by-component.

## Screens
- `index.html` — home page: dark hero with wordmark-style lowercase display, search bar, featured listings grid, yellow culture band, dark footer.

## Components (`components.jsx`)
- `Header` — sticky black header, yellow logo + nav + WhatsApp CTA
- `Footer` — black ground with yellow mark, culture footline
- `PropertyCard` — canonical listing card
- `SearchBar` — tabbed (comprar / alugar) with quick-filter chips
- `Button` — `primary` yellow, `dark` graphite, `ghost`, `whiteghost`
- `Tag` — `yellow`, `dark`, `ghost`, `ink`, `soft`
- `Icon` — stroke icons in a Lucide-compatible set (home, bed, bath, car, pin, heart, phone, etc.)

## How to run
Open `index.html` directly — it loads React + Babel from CDN and the shared CSS tokens via `../../colors_and_type.css`.

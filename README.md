# site Enove

Protótipo do novo site da **Enove Imobiliária** (Estância Velha / Vale do Sinos).

- [`PROPOSTA.md`](PROPOSTA.md) — diagnóstico do site atual e a proposta estratégica
- [`prototipo/`](prototipo/) — o protótipo navegável, com o [README técnico](prototipo/README.md)

## Rodar

```bash
cd prototipo && python3 -m http.server 8899
```
Depois: <http://localhost:8899/index.html>

> Precisa de servidor local — abrir com `file://` bloqueia as fontes por CORS.

## Procedência dos arquivos — o que precisa ser substituído

Está tudo versionado, inclusive o que abaixo. Estes itens **não são
definitivos** e continuam sendo bloqueadores de go-live:

| Arquivo | Situação |
|---|---|
| `prototipo/assets/hero/{back,cloud,smoke,house}.webp` | Vieram do site usado como referência de estudo (findrealestate.com). Precisam ser substituídos por arte própria da Enove antes de produção. |
| `prototipo/fonts/*trial*`, `fonts/altair*` | Versões de avaliação da Zetafonts. Substituem **todos os dígitos** por marca d'água da fundição — todo preço sairia como propaganda. Precisam da licença comercial. |
| Fotos em `app.js` | Unsplash, ilustrativas. Nenhuma é do Vale do Sinos. |
| `Enove_Design_System/` | Manual de marca, material interno da Enove. O repositório é público. |

`prototipo/fonts/Poppins-*` é aberta (SIL OFL) e pode ficar como está.

## Pendências antes de produção

Estão detalhadas no [README do protótipo](prototipo/README.md). As que
bloqueiam o go-live:

1. **Licença das fontes** — as trial substituem todos os dígitos por marca
   d'água da fundição.
2. **Fotografia real** — tudo é ilustrativo, nada é do Vale do Sinos.
3. **Assets de terceiros** — os quatro arquivos acima.
4. **Alíquota do ITBI** de Estância Velha — 2% é estimativa.
5. **Integração com o Flip CRM** — definir se há API ou apenas feed XML.

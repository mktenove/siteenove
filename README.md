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

## O que NÃO está versionado, e por quê

Este repositório é **público**. Quatro grupos de arquivos ficaram de fora de
propósito. Todos continuam no disco de quem já tem o projeto; só não sobem.

| Ignorado | Motivo |
|---|---|
| `assets/hero/{back,cloud,smoke,house}.webp` | Vieram do site usado como referência de estudo (findrealestate.com). São de terceiros e precisam ser substituídos por arte própria antes de produção. |
| `fonts/*trial*`, `fonts/altair*` | Versões de avaliação da Zetafonts. A licença de trial não cobre redistribuição. |
| `Enove_Design_System/` | 114 MB de manual de marca — material interno, e peso demais para o histórico. |
| `assets/hero/{hero-*,predio.png}` | Placeholders já fora de uso. |

**Consequência prática:** um clone limpo roda, mas o hero aparece sem o céu e
sem as nuvens, e a tipografia de display cai para a fonte de sistema. Para
trabalhar, copie esses arquivos por fora.

Para versioná-los, é preciso primeiro resolver a origem de cada um:
tornar o repositório privado não resolve a licença das fontes, só reduz a
exposição.

## Pendências antes de produção

Estão detalhadas no [README do protótipo](prototipo/README.md). As que
bloqueiam o go-live:

1. **Licença das fontes** — as trial substituem todos os dígitos por marca
   d'água da fundição.
2. **Fotografia real** — tudo é ilustrativo, nada é do Vale do Sinos.
3. **Assets de terceiros** — os quatro arquivos acima.
4. **Alíquota do ITBI** de Estância Velha — 2% é estimativa.
5. **Integração com o Flip CRM** — definir se há API ou apenas feed XML.

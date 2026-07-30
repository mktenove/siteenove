# Proposta — Novo site Enove Imobiliária

**Cliente:** Enove Imobiliária — CRECI 24.775J — Av. Brasil, 1213, Estância Velha/RS
**Objetivo:** substituir o site atual por uma plataforma digital proprietária que gere leads qualificados e capte imóveis, em vez de apenas listar catálogo.
**Data:** julho/2026

---

## 1. Diagnóstico do site atual

O site hoje roda em Next.js servido pelo template do **Flip CRM**. Tecnicamente funciona, mas é um template de prateleira: qualquer imobiliária do Brasil pode ter exatamente a mesma coisa trocando a logo. Pontos observados:

| Área | Situação hoje |
|---|---|
| Posicionamento | Nenhum. Não há página "Sobre", história, equipe ou prova social. A marca some atrás do catálogo. |
| Busca | Formulário clássico (cidade, finalidade, tipo, quartos, valor). Igual ao ZAP/VivaReal — e perdendo para eles em volume. |
| Página do imóvel | Preço não aparece em destaque, galeria pobre (uma foto de capa), sem formulário de contato na página, sem corretor identificado, sem planta, sem simulação de financiamento. |
| Captação de imóveis | "Quero anunciar" é só um formulário. Zero incentivo para o proprietário deixar o contato. |
| Lançamentos | Buriti Garden Premium e Horizon Clube Residencial tratados como card de catálogo, não como produto próprio. |
| Conteúdo local | Nenhum. A Enove conhece Estância Velha melhor que qualquer portal nacional — e não usa isso em lugar nenhum. |
| Acervo social | ~10 mil seguidores e ~2,4 mil posts no Instagram, totalmente desconectados do site. |

> *Observação metodológica:* a auditoria foi feita sobre o conteúdo servido publicamente. Alguns elementos carregados via JavaScript podem não ter sido capturados — a validação final é feita na primeira semana do projeto, junto com acesso ao analytics.

**O problema central:** o site atual compete no mesmo jogo dos grandes portais (catálogo + filtro), um jogo que uma imobiliária regional não vence. Ele é um folheto, não uma ferramenta.

---

## 2. A tese: onde está a disrupção de verdade

Disruptivo não é animação, parallax e cursor customizado. Isso envelhece em 18 meses. A disrupção real está em **inverter três premissas** que todo site de imobiliária repete:

**1. Ninguém quer "buscar imóvel". As pessoas querem decidir onde vão morar.**
Trocamos o formulário de filtros por descoberta: busca em linguagem natural + mapa com inteligência de bairro.

**2. O corretor não pode estar no fim do funil.**
Hoje ele aparece só quando o cliente clica em WhatsApp. Vamos colocá-lo na frente: rosto, nome, especialidade, agenda.

**3. O site serve só ao comprador — e esquece o proprietário.**
Metade do negócio de uma imobiliária é *captar* imóvel. O site atual não faz nada por isso. Vamos criar um produto inteiro para esse lado.

---

## 3. Os oito pilares do novo site

### 3.1 Busca conversacional com IA — o diferencial nº 1
Campo único, sem filtros:

> *"casa de 3 quartos até 600 mil em Estância Velha, com pátio pro cachorro e perto de escola"*

A IA (Claude API) interpreta a frase, traduz para os campos do CRM, entende o que **não** está estruturado (lendo as descrições dos anúncios: "pátio", "churrasqueira", "reformada") e devolve resultados já ordenados por aderência — com uma explicação em uma linha do *porquê* cada imóvel apareceu.

Nenhuma imobiliária do Vale do Sinos tem isso. E é a feature que rende pauta em imprensa local e posts orgânicos.

### 3.2 Mapa-first: "Explorar Estância Velha"
Modo mapa como forma principal de navegar, com camadas que os portais nacionais não têm porque não conhecem a cidade:
- Perfil de cada bairro (União, Lira, Lago Azul, Centro…) escrito pela Enove
- Escolas, mercados, farmácias, academias no raio de caminhada
- Tempo de deslocamento até Novo Hamburgo, São Leopoldo e Porto Alegre
- Faixa de preço praticada por m² no bairro

Isso transforma conhecimento local em ativo digital — a única vantagem estrutural da Enove contra o ZAP.

### 3.3 Perfil de morador (match em 60 segundos)
Um quiz curto e visual ("prefere pé no chão ou vista?", "quanto de deslocamento aceita?", "família crescendo?") que gera uma seleção curada e um alerta salvo. Captura o lead **sem formulário chato** e ainda entrega valor imediato. Taxa de conclusão de quiz é tipicamente 3–5× maior que a de formulário.

### 3.4 Transparência radical de custo
Em cada imóvel, o número que ninguém mostra: **quanto custa de verdade**.
- Simulador de financiamento (Caixa/SBPE) embutido, com parcela e renda mínima
- Custo de entrada completo: ITBI, escritura, registro (tabelas RS)
- Custo mensal estimado: parcela + IPTU + condomínio

O cliente que entende o custo total chega na visita pré-qualificado. Isso reduz visita improdutiva do corretor — ganho operacional direto.

### 3.5 Página de imóvel cinematográfica
Reconstrução completa: preço em destaque, galeria fullscreen, vídeo vertical (aproveitando o acervo do Instagram), tour 360° nos imóveis premium, planta baixa, badge de "novo/baixou preço", corretor responsável com foto e WhatsApp direto, agendamento de visita em dois cliques.

### 3.6 Corretor como protagonista
Página própria por corretor com bio, região de atuação, imóveis na carteira e depoimentos. Gera confiança, gera SEO por nome, e dá orgulho ao time — que passa a divulgar o próprio link.

### 3.7 Avaliação instantânea de imóvel (captação)
O produto do lado do proprietário. Ele informa endereço, tipo, área e quartos; recebe na hora uma **faixa estimada de valor** baseada no histórico da própria Enove e no preço/m² do bairro. Em troca, deixa o contato.

Isso vira a principal máquina de captação de exclusividades — e é exatamente o que nenhum concorrente regional oferece.

### 3.8 Lançamentos como microsites
Buriti Garden Premium e Horizon Clube Residencial ganham páginas dedicadas com identidade própria, espelho de disponibilidade, plantas, condições de pagamento e formulário de interesse — reaproveitáveis para tráfego pago.

---

## 4. Direção de design

Fugir do "azul corporativo de imobiliária". A referência não são outras imobiliárias — são marcas de produto e revistas de arquitetura.

- **Tipografia editorial** de peso alto, com o imóvel e o preço como heróis da tela
- **Paleta reduzida:** preto, off-white e um único acento forte extraído da marca Enove
- **Fotografia em tela cheia**, sem molduras e sem cards apertados
- **Movimento discreto e funcional** — transições de página fluidas, nada que atrapalhe a leitura
- **Dark mode nativo** — a maior parte da navegação imobiliária acontece à noite, no celular
- **Mobile-first de verdade:** gestos de swipe entre imóveis, tipo feed. É assim que o público já consome imóvel no Instagram.

> Pré-requisito crítico: **fotografia**. O site mais bonito do mundo morre com foto de celular mal iluminada. A proposta inclui um padrão fotográfico obrigatório e orientação para o time de captação.

---

## 5. Arquitetura técnica

| Camada | Escolha | Motivo |
|---|---|---|
| Front-end | Next.js 15 (App Router) + TypeScript + Tailwind | Performance, SEO, ecossistema |
| Estilo/motion | Tailwind + Framer Motion | Movimento controlado e leve |
| Dados de imóveis | Integração com o **Flip CRM** (API ou feed XML) | O time continua cadastrando onde já cadastra — zero retrabalho operacional |
| Banco próprio | Postgres | Favoritos, alertas, perfis, leads, avaliações |
| IA | Claude API (Anthropic) | Busca semântica, enriquecimento de descrições, geração de conteúdo de bairro |
| Mapas | Mapbox ou MapLibre | Camadas customizadas |
| Hospedagem | Vercel | Deploy contínuo, edge, CDN de imagem |
| Analytics | GA4 + Meta Pixel + painel próprio de leads | Medir origem de cada lead até o fechamento |

**Ponto de atenção nº 1:** a extensão exata da integração com o Flip CRM precisa ser validada na semana 1 (existe API? apenas feed XML? qual frequência de sincronização?). É a única dependência externa capaz de alterar prazo — e há plano B (importação por feed com cache próprio).

### SEO programático — a alavanca esquecida
Geração automática de páginas otimizadas para combinações reais de busca:
`casa à venda em Estância Velha bairro União`, `apartamento em Ivoti`, `terreno em Dois Irmãos`, e assim por diante para Novo Hamburgo, Portão, Campo Bom, São Leopoldo e Sapiranga. São centenas de páginas indexáveis com conteúdo genuíno de bairro — tráfego orgânico que hoje vai inteiro para os portais.

---

## 6. Roadmap

| Fase | Escopo | Prazo |
|---|---|---|
| **0 — Descoberta** | Acesso ao Flip e ao analytics, entrevistas com corretores, definição de métricas, auditoria de fotos | Semana 1 |
| **1 — Fundação** | Design system, identidade digital, integração com o CRM, home, busca, listagem, página de imóvel, páginas de corretor | Semanas 2–6 |
| **2 — Diferenciais** | Busca conversacional com IA, mapa de bairros, simulador de custo total, perfil de morador | Semanas 7–10 |
| **3 — Captação e escala** | Avaliação instantânea de imóvel, microsites de lançamento, SEO programático, painel de leads | Semanas 11–14 |
| **4 — Go-live e otimização** | Migração com redirecionamentos 301, testes de carga, ajustes por dados reais | Semanas 15–16 |

Cada fase entrega algo no ar. O site novo não fica seis meses em segredo.

---

## 7. Como medimos sucesso

Não é "site bonito". São seis números, medidos antes e depois:

1. Leads qualificados por mês
2. Custo por lead (orgânico vs. pago)
3. Taxa de visita agendada pelo site
4. Tempo médio de resposta ao lead
5. Captações de imóveis originadas no site
6. Tráfego orgânico e posições nas buscas locais

Meta de referência para 6 meses pós-lançamento: **2 a 3× o volume atual de leads qualificados**, com queda no custo por lead pela participação maior do orgânico.

---

## 8. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Limitações da API do Flip CRM | Validar na semana 1; plano B com feed XML + cache próprio |
| Qualidade das fotos do acervo | Padrão fotográfico definido na fase 0 + priorização dos imóveis de maior ticket |
| Perda de SEO na migração | Mapa completo de redirecionamentos 301 e monitoramento pós-go-live |
| Adoção pelo time de corretores | Corretores envolvidos desde a descoberta; página própria como incentivo |
| LGPD | Consentimento explícito, política de privacidade e trilha de auditoria dos leads |

---

## 9. Próximos passos sugeridos

1. Validar quais dos oito pilares entram na primeira versão (recomendação: **3.1 busca com IA**, **3.5 página de imóvel** e **3.7 avaliação instantânea** — maior impacto por esforço)
2. Liberar acesso ao Flip CRM e ao analytics atual para a descoberta
3. Aprovar direção de design a partir de um protótipo navegável da home e da página de imóvel

---

### O resumo em uma frase

A Enove não vai vencer o ZAP tendo um catálogo melhor. Vai vencer sendo **a única que realmente conhece Estância Velha** — e transformando esse conhecimento em software.

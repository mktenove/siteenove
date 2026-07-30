/* =========================================================================
   ENOVE — protótipo · lógica de demonstração
   ATENÇÃO: dados de imóveis são ILUSTRATIVOS. Em produção vêm do Flip CRM.
   A "busca conversacional" aqui é um interpretador local que simula o
   comportamento da Claude API — serve para demonstrar a experiência.
   ========================================================================= */

const img = (id, w) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w || 1400}&q=72`;

/* ---------- acervo ilustrativo ---------------------------------------- */
const IMOVEIS = [
  { cod:'CA1715', tipo:'casa', cidade:'Estância Velha', bairro:'Lira',
    preco:745000, quartos:3, suites:1, banheiros:3, vagas:2, area:192, terreno:360,
    condominio:0, iptu:142, tag:'Exclusivo',
    feats:['pátio amplo','churrasqueira','suíte','laje','portão eletrônico','murada'],
    perfil:['familia','pet','quintal','sossego'],
    foto:'1600585154340-be6161a56a0c' },

  { cod:'CA1902', tipo:'casa', cidade:'Estância Velha', bairro:'União',
    preco:590000, quartos:3, suites:1, banheiros:2, vagas:2, area:157,terreno:300,
    condominio:0, iptu:118, tag:'Baixou preço',
    feats:['pátio','churrasqueira','suíte','perto de escola'],
    perfil:['familia','pet','quintal','escola'],
    foto:'1613490493576-7fde63acd811' },

  { cod:'CA2357', tipo:'casa', cidade:'Estância Velha', bairro:'Lago Azul',
    preco:420000, quartos:2, suites:0, banheiros:1, vagas:3, area:92, terreno:264,
    condominio:0, iptu:78, tag:'Novo',
    feats:['pátio','garagem coberta','reformada'],
    perfil:['primeiro imovel','pet','quintal'],
    foto:'1512917774080-9991f1c4c750' },

  { cod:'AP0841', tipo:'apartamento', cidade:'Estância Velha', bairro:'Centro',
    preco:385000, quartos:2, suites:0, banheiros:1, vagas:1, area:78, terreno:0,
    condominio:340, iptu:64, tag:'',
    feats:['elevador','sacada com churrasqueira','portaria','perto de mercado'],
    perfil:['primeiro imovel','centro','pratico'],
    foto:'1568605114967-8130f3a36994' },

  { cod:'AP1120', tipo:'apartamento', cidade:'Estância Velha', bairro:'Centro',
    preco:640000, quartos:3, suites:1, banheiros:2, vagas:2, area:95, terreno:0,
    condominio:520, iptu:112, tag:'Select', select:true,
    feats:['lazer completo','piscina','academia','sacada com churrasqueira','elevador'],
    perfil:['familia','lazer','centro'],
    foto:'1600047509807-ba8f99d2cdde' },

  { cod:'TE0455', tipo:'terreno', cidade:'Estância Velha', bairro:'Buriti Garden',
    preco:265000, quartos:0, suites:0, banheiros:0, vagas:0, area:300, terreno:300,
    condominio:280, iptu:52, tag:'Select', select:true,
    feats:['condomínio fechado','segurança 24h','infraestrutura pronta'],
    perfil:['investimento','construir','sossego'],
    foto:'1580587771525-78b9dba3b914' },
];

/* ---------- formatação ------------------------------------------------ */
const brl  = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const brl0 = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

/* =========================================================================
   1. BUSCA CONVERSACIONAL
   Interpretador de linguagem natural → filtros estruturados + motivo do match.
   ========================================================================= */
function interpretar(txt) {
  const t = txt.toLowerCase();
  const f = { termos: [] };

  // preço: "até 600 mil", "600.000", "até 1 milhão", "1,2 mi"
  // as alternativas da unidade vão da mais longa para a mais curta —
  // senão "milhão" casa só com "mil" e vira mil reais.
  let m = t.match(/at[ée]\s*r?\$?\s*([\d.,]+)\s*(milh[õoãa]o|milh[õo]es|mil|mi|k|m)?/);
  if (m) {
    let n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    const u = m[2] || '';
    if (/^(milh|mi$)/.test(u))      n *= 1000000;
    else if (/^(mil|k|m)$/.test(u)) n *= 1000;
    else if (n < 10000)             n *= 1000;   // "até 600" = 600 mil
    f.precoMax = n;
    f.termos.push({ k: 'orçamento', v: 'até ' + brl0(n) });
  }

  // quartos
  m = t.match(/(\d+)\s*(quartos?|dormit[óo]rios?|dorm)/);
  if (m) { f.quartos = +m[1]; f.termos.push({ k: 'quartos', v: m[1] + '+' }); }

  // tipo
  if (/\bcasas?\b|sobrado/.test(t))         { f.tipo = 'casa';        f.termos.push({ k:'tipo', v:'casa' }); }
  else if (/\bapt|apartamentos?\b/.test(t)) { f.tipo = 'apartamento'; f.termos.push({ k:'tipo', v:'apartamento' }); }
  else if (/terrenos?|lotes?/.test(t))      { f.tipo = 'terreno';     f.termos.push({ k:'tipo', v:'terreno' }); }

  // bairro
  const bairro = ['lira','união','uniao','lago azul','centro','buriti'].find(b => t.includes(b));
  if (bairro) {
    f.bairro = bairro === 'uniao' ? 'união' : bairro;
    f.termos.push({ k: 'bairro', v: f.bairro });
  }

  // ordenação implícita
  if (/barat|econ[ôo]mic|em conta|baixo custo|menor pre[çc]o/.test(t)) {
    f.ordem = 'preco';
    f.termos.push({ k: 'ordem', v: 'do mais barato', soft: true });
  }

  // vagas
  m = t.match(/(\d+)\s*vagas?/);
  if (m) { f.vagas = +m[1]; f.termos.push({ k:'vagas', v:m[1] + '+' }); }

  // intenções soltas — o que um formulário de filtros nunca captura
  const intents = [
    { re:/cachorro|pet|cão|cao|quintal|p[áa]tio/,          key:'quintal',    lbl:'espaço externo para pet' },
    { re:/escola|col[ée]gio|creche|filhos?|crian[çc]a/,    key:'escola',     lbl:'perto de escola' },
    { re:/churrasq|churras/,                                key:'churrasco',  lbl:'churrasqueira' },
    { re:/su[íi]te/,                                        key:'suite',      lbl:'suíte' },
    { re:/sossego|tranquil|calm|silenc/,                    key:'sossego',    lbl:'rua tranquila' },
    { re:/primeiro im[óo]vel|primeira casa|sair do aluguel/,key:'primeiro',   lbl:'primeiro imóvel' },
    { re:/investi|renda|alugar/,                            key:'investir',   lbl:'perfil investimento' },
    { re:/lazer|piscina|academia/,                          key:'lazer',      lbl:'área de lazer' },
    { re:/mercado|farm[áa]cia|a p[ée]|caminhada|centro/,    key:'servicos',   lbl:'serviços a pé' },
    { re:/reformad|pronta pra morar|pronto pra morar/,      key:'pronto',     lbl:'pronto para morar' },
    { re:/financi|caixa|minha casa/,                        key:'financia',   lbl:'aceita financiamento' },
    { re:/construir|erguer|projeto pr[óo]prio/,             key:'construir',  lbl:'para construir' },
    { re:/condom[íi]nio fechado|seguran[çc]a|portaria 24/,  key:'fechado',    lbl:'condomínio fechado' },
  ];
  f.intents = intents.filter(i => i.re.test(t)).map(i => ({ key: i.key, lbl: i.lbl }));
  f.intents.forEach(i => f.termos.push({ k: 'contexto', v: i.lbl, soft: true }));

  return f;
}

/* pesos — usados no score e no cálculo do máximo possível da consulta,
   para que o "% match" seja relativo ao que o usuário pediu, não a um total fixo */
const P = { tipo: 30, preco: 30, quartos: 20, bairro: 25, vagas: 10, intent: 14 };

function maxPossivel(f) {
  return (f.tipo ? P.tipo : 0) + (f.precoMax ? P.preco : 0)
       + (f.quartos ? P.quartos : 0) + (f.bairro ? P.bairro : 0)
       + (f.vagas ? P.vagas : 0) + (f.intents || []).length * P.intent;
}

function pontuar(im, f) {
  let score = 0, motivos = [], falhas = [];

  if (f.tipo)   { im.tipo === f.tipo ? (score += P.tipo) : falhas.push('tipo'); }
  if (f.bairro) {
    // bairro é filtro rígido: pediu Lira, não faz sentido devolver União
    if (im.bairro.toLowerCase().includes(f.bairro)) {
      score += P.bairro; motivos.push('no bairro que você pediu');
    } else falhas.push('bairro');
  }
  if (f.precoMax) {
    if (im.preco <= f.precoMax) {
      score += P.preco;
      const folga = f.precoMax - im.preco;
      if (folga > f.precoMax * 0.12) motivos.push(`${brl0(folga)} abaixo do seu teto`);
    } else if (im.preco <= f.precoMax * 1.08) {
      score += P.preco * 0.4; motivos.push('pouco acima do teto — vale negociar');
    } else falhas.push('preço');
  }
  if (f.quartos) { im.quartos >= f.quartos ? (score += P.quartos) : falhas.push('quartos'); }
  if (f.vagas)   { im.vagas   >= f.vagas   ? (score += P.vagas)   : falhas.push('vagas'); }

  // o diferencial: casar intenção com o texto livre do anúncio
  const blob = (im.feats.join(' ') + ' ' + im.perfil.join(' ')).toLowerCase();
  (f.intents || []).forEach(i => {
    const hit = {
      quintal:  /pátio|patio|quintal|pet/.test(blob),
      escola:   /escola/.test(blob),
      churrasco:/churrasq/.test(blob),
      suite:    im.suites > 0,
      sossego:  /sossego|condomínio fechado/.test(blob),
      primeiro: /primeiro imovel/.test(blob),
      investir: /investimento/.test(blob),
      lazer:    /lazer|piscina|academia/.test(blob),
      servicos: /mercado|centro|elevador|portaria/.test(blob),
      pronto:   /reformada/.test(blob),
      financia: im.preco <= 900000,
      construir:im.tipo === 'terreno',
      fechado:  /condomínio fechado|segurança/.test(blob),
    }[i.key];
    if (hit) { score += P.intent; motivos.push(i.lbl); }
  });

  return { score, motivos, falhas };
}

function buscar(txt) {
  const f = interpretar(txt);
  const max = maxPossivel(f);
  let res = IMOVEIS
    .map(im => ({ im, ...pontuar(im, f), max }))
    .filter(r => r.falhas.length === 0);

  res = f.ordem === 'preco'
    ? res.sort((a, b) => a.im.preco - b.im.preco)
    : res.sort((a, b) => b.score - a.score || a.im.preco - b.im.preco);

  return { f, res };
}

/* ---------- render ---------------------------------------------------- */
function cardHTML(r, comMotivo) {
  const im = r.im;
  const pct = r.max > 0 ? Math.min(99, Math.round((r.score / r.max) * 100)) : 0;
  const meta = im.tipo === 'terreno'
    ? `<span><b>${im.area}</b> m² de terreno</span><span>condomínio fechado</span>`
    : `<span><b>${im.quartos}</b> quartos</span>
       <span><b>${im.banheiros}</b> banh.</span>
       <span><b>${im.area}</b> m²</span>
       <span><b>${im.vagas}</b> vagas</span>`;
  const tagCls = im.select ? 'card__tag card__tag--select'
               : im.tag === 'Baixou preço' ? 'card__tag card__tag--ink' : 'card__tag';
  return `
  <a class="card rise" href="imovel.html">
    <div class="card__photo">
      <img src="${img(im.foto, 800)}" alt="${im.tipo} no bairro ${im.bairro}" loading="lazy">
      ${im.tag ? `<span class="${tagCls}">${im.tag}</span>` : ''}
      ${comMotivo && pct > 0 ? `<span class="card__match">${pct}% match</span>` : ''}
      <span class="card__code">${im.cod}</span>
      <button class="card__heart" aria-label="Salvar imóvel" onclick="event.preventDefault()">
        <svg class="ico ico--sm" viewBox="0 0 24 24"><path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5C2 10.7 3.5 12.5 5 14l7 7Z"/></svg>
      </button>
    </div>
    <div class="card__body">
      <div class="card__price">${brl0(im.preco)}</div>
      <div class="card__addr">${im.bairro} · ${im.cidade}</div>
      <div class="card__meta">${meta}</div>
      ${comMotivo && r.motivos.length
        ? `<div class="card__why"><b>Por que apareceu:</b> ${r.motivos.slice(0, 3).join(' · ')}</div>` : ''}
    </div>
  </a>`;
}

function renderBusca(txt) {
  const { f, res } = buscar(txt);
  const zona   = document.getElementById('resultados');
  const leitura= document.getElementById('leitura');
  const grid   = document.getElementById('grid-resultados');
  const cont   = document.getElementById('conta-resultados');
  if (!zona) return;

  leitura.innerHTML = f.termos.length
    ? f.termos.map(t => `<span class="token ${t.soft ? 'token--miss' : ''}"><i>${t.k}</i><b>${t.v}</b></span>`).join('')
    : '<span class="token"><i>busca</i><b>todos os imóveis</b></span>';

  cont.textContent = res.length
    ? `${res.length} ${res.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`
    : 'Nenhum imóvel bateu com tudo — veja o que chegou perto';

  const mostrar = res.length
    ? res
    : IMOVEIS.slice(0, 3).map(im => ({ im, score: 0, max: 0, motivos: [] }));
  grid.innerHTML = mostrar.map(r => cardHTML(r, res.length > 0)).join('');

  zona.hidden = false;
  observar();
  zona.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =========================================================================
   2. AVALIAÇÃO INSTANTÂNEA (captação de imóveis)
   ========================================================================= */
const M2_BAIRRO = {   // R$/m² ilustrativos — em produção, do histórico da Enove
  'Centro':       4900,
  'Lira':         3900,
  'União':        3750,
  'Lago Azul':    3450,
  'Buriti Garden':4200,
  'Outro':        3600,
};

function avaliar() {
  const bairro = document.getElementById('v-bairro').value;
  const tipo   = document.getElementById('v-tipo').value;
  const area   = parseFloat(document.getElementById('v-area').value);
  const qtos   = parseInt(document.getElementById('v-quartos').value, 10) || 0;
  const out    = document.getElementById('v-out');

  if (!area || area < 20) {
    out.innerHTML = '<div class="vresult__note">Informe a área construída para calcularmos.</div>';
    out.hidden = false;
    return;
  }
  let base = M2_BAIRRO[bairro] * area;
  if (tipo === 'apartamento') base *= 1.06;
  if (tipo === 'terreno')     base *= 0.42;
  if (qtos >= 3)              base *= 1.04;

  const min = base * 0.92, max = base * 1.08;
  out.innerHTML = `
    <div class="eyebrow">Faixa estimada de venda</div>
    <div class="vresult__val">${brl0(min)} — ${brl0(max)}</div>
    <div class="vresult__note">
      Base: ${brl0(M2_BAIRRO[bairro])}/m² praticado em ${bairro} · ${area} m².
      Estimativa automática, não substitui a avaliação presencial.
      Um corretor confirma o valor com você em até 24 h.
    </div>
    <a class="btn btn--primary btn--block" href="#" style="margin-top:16px" onclick="event.preventDefault()">
      Quero a avaliação completa e gratuita
      <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </a>`;
  out.hidden = false;
}

/* =========================================================================
   3. SIMULADOR DE CUSTO REAL (página do imóvel)
   Tabela Price · ITBI e cartório estimados para RS.
   ========================================================================= */
const ITBI_PCT     = 0.02;    // Estância Velha — confirmar alíquota vigente
const CARTORIO_PCT = 0.015;   // escritura + registro, estimativa

function simular() {
  const preco  = +document.getElementById('s-preco').value;
  const entrPc = +document.getElementById('s-entrada').value;
  const anos   = +document.getElementById('s-prazo').value;
  const taxaAA = +document.getElementById('s-taxa').value;
  const cond   = +document.getElementById('s-cond').value || 0;
  const iptu   = +document.getElementById('s-iptu').value || 0;

  const entrada  = preco * (entrPc / 100);
  const financiado = preco - entrada;
  const i = Math.pow(1 + taxaAA / 100, 1 / 12) - 1;   // taxa efetiva mensal
  const n = anos * 12;
  const parcela = financiado > 0 ? financiado * i / (1 - Math.pow(1 + i, -n)) : 0;

  const itbi     = preco * ITBI_PCT;
  const cartorio = preco * CARTORIO_PCT;
  const entradaTotal = entrada + itbi + cartorio;
  const mensal   = parcela + cond + iptu;
  const renda    = mensal / 0.30;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  set('s-entrada-lbl', entrPc + '%');
  set('s-prazo-lbl',   anos + ' anos');

  // o trilho de preço lê os mesmos números — nunca divergem do simulador
  set('o-rail-parcela', brl0(parcela));
  set('o-rail-entrada', entrPc + '%');
  set('o-rail-prazo',   anos + ' anos');

  document.getElementById('o-entrada').textContent  = brl0(entrada);
  document.getElementById('o-itbi').textContent     = brl0(itbi);
  document.getElementById('o-cartorio').textContent = brl0(cartorio);
  document.getElementById('o-dia').textContent      = brl0(entradaTotal);
  document.getElementById('o-parcela').textContent  = brl0(parcela);
  document.getElementById('o-cond').textContent     = brl0(cond);
  document.getElementById('o-iptu').textContent     = brl0(iptu);
  document.getElementById('o-mensal').textContent   = brl0(mensal);
  document.getElementById('o-renda').textContent    = brl0(renda);
}

/* =========================================================================
   4. UI
   ========================================================================= */
/* Se o motion.js (GSAP) estiver ativo, ele cuida dos reveals e do parallax.
   Sem GSAP, cai para IntersectionObserver — o site nunca fica invisível. */
function observar(escopo) {
  const M = window.ENOVE_MOTION;
  if (M && M.on) {
    M.parallaxIn(escopo);
    M.reveal(escopo);
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    return;
  }
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px' });
  (escopo || document).querySelectorAll('.rise:not(.in)').forEach(el => io.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  observar();

  // busca
  const input = document.getElementById('ask-input');
  const go    = document.getElementById('ask-go');
  if (input) {
    const disparar = () => { if (input.value.trim()) renderBusca(input.value); };
    go.addEventListener('click', disparar);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') disparar(); });

    document.querySelectorAll('[data-ask]').forEach(c => {
      c.addEventListener('click', () => { input.value = c.dataset.ask; renderBusca(c.dataset.ask); });
    });

    // placeholder rotativo — mostra o alcance da busca sem ocupar tela
    const exemplos = [
      'casa de 3 quartos até 600 mil com pátio pro cachorro',
      'apartamento no centro, perto de mercado, pra sair do aluguel',
      'terreno em condomínio fechado pra construir',
      'casa com suíte e churrasqueira perto de escola',
    ];
    let k = 0;
    setInterval(() => {
      if (document.activeElement === input || input.value) return;
      k = (k + 1) % exemplos.length;
      input.placeholder = exemplos[k];
    }, 3800);
  }

  // avaliação
  const vgo = document.getElementById('v-go');
  if (vgo) vgo.addEventListener('click', avaliar);

  // simulador
  if (document.getElementById('s-preco')) {
    ['s-entrada','s-prazo','s-taxa','s-cond','s-iptu','s-preco']
      .forEach(id => document.getElementById(id).addEventListener('input', simular));
    simular();
  }

  // destaques da home
  const dest = document.getElementById('grid-destaques');
  if (dest) dest.innerHTML = IMOVEIS.filter(i => !i.select)
    .map(im => cardHTML({ im, score: 0, motivos: [] }, false)).join('');

  // similares na PDP
  const sim = document.getElementById('grid-similares');
  if (sim) sim.innerHTML = IMOVEIS.filter(i => i.cod !== 'CA1715').slice(0, 3)
    .map(im => cardHTML({ im, score: 0, motivos: [] }, false)).join('');

  observar();
});

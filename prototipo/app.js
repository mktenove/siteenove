/* =========================================================================
   ENOVE — protótipo · lógica de demonstração
   ATENÇÃO: dados de imóveis são ILUSTRATIVOS. Em produção vêm do Flip CRM.
   A "busca conversacional" aqui é um interpretador local que simula o
   comportamento da Claude API — serve para demonstrar a experiência.
   ========================================================================= */

/* Os exemplos embutidos guardam um id do Unsplash; o banco entrega URL
   completa. Sem esta checagem o prefixo era concatenado na URL do Supabase
   e todas as fotos do acervo real quebravam. */
const img = (id, w) =>
  /^https?:\/\//.test(id || '')
    ? id
    : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w || 1400}&q=72`;

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

/* `fonte` existe para a busca poder rodar sobre o que veio do banco. Sem
   ela, o ranqueamento ficaria preso aos exemplos embutidos. */
function buscar(txt, fonte) {
  const f = interpretar(txt);
  const max = maxPossivel(f);
  let res = (fonte || IMOVEIS)
    .map(im => ({ im, ...pontuar(im, f), max }))
    .filter(r => r.falhas.length === 0);

  res = f.ordem === 'preco'
    ? res.sort((a, b) => a.im.preco - b.im.preco)
    : res.sort((a, b) => b.score - a.score || a.im.preco - b.im.preco);

  return { f, res };
}

/* ---------- render ---------------------------------------------------- */
/* O Lenis controla a rolagem da página. Um `scrollIntoView` nativo rola por
   fora dele: a posição real e a que o Lenis acredita ficam diferentes, e o
   ScrollTrigger — que lê do Lenis — passa a desenhar os `pin` no lugar
   errado. Foi o que fazia a fita se sobrepor ao carrossel depois de clicar
   numa cidade. */
function rolarAte(el) {
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -80 });
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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
  <a class="card rise" href="imovel.html?cod=${encodeURIComponent(im.cod)}">
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
      <!-- 17 imóveis do acervo não têm preço na origem; "R$ 0" seria pior
           que dizer que o valor não está publicado -->
      <div class="card__price">${im.preco > 0 ? brl0(im.preco) : 'Sob consulta'}</div>
      <div class="card__addr">${im.bairro} · ${im.cidade}</div>
      <div class="card__meta">${meta}</div>
      ${comMotivo && r.motivos.length
        ? `<div class="card__why"><b>Por que apareceu:</b> ${r.motivos.slice(0, 3).join(' · ')}</div>` : ''}
    </div>
  </a>`;
}

async function renderBusca(txt) {
  /* O banco faz o filtro grosso (tipo, preço, quartos, vagas); a leitura da
     frase e o ranqueamento continuam aqui. Se o banco não responder, cai
     nos exemplos embutidos e o site segue funcionando. */
  const fonte = (await ENOVE_DB.buscar(interpretar(txt))) || IMOVEIS;
  const { f, res } = buscar(txt, fonte);
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
    : fonte.slice(0, 3).map(im => ({ im, score: 0, max: 0, motivos: [] }));
  grid.innerHTML = mostrar.map(r => cardHTML(r, res.length > 0)).join('');

  zona.hidden = false;
  observar();
  rolarAte(zona);
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
  /* Clicar numa cidade abre os empreendimentos dela. Só 10 das 25 cidades
     têm algum — nas outras, levar a uma vitrine vazia seria pior que não
     ser clicável, então cai nos imóveis da cidade. */
  async function abrirCidade(cidade) {
    const secao = document.querySelector('#top-investimentos');
    const pista = document.querySelector('[data-carr-pista]');
    const titulo = secao?.querySelector('.rally');
    const lead   = secao?.querySelector('.lead');
    if (!secao || !pista) return;

    const cs = await ENOVE_DB.condominios(12, cidade);
    if (cs && cs.length) {
      pista.innerHTML = cs.map(cartaoCondominio).join('');
      if (titulo) titulo.textContent = `EMPREENDIMENTOS EM ${cidade.toUpperCase()}.`;
      if (lead) lead.innerHTML = `${cs.length} ${cs.length === 1 ? 'empreendimento' : 'empreendimentos'} ` +
        `com unidades disponíveis. <a href="#" data-voltar-todos>Ver todas as cidades</a>`;
      document.dispatchEvent(new CustomEvent('enove:carrossel-atualizado'));
      window.ENOVE_MOTION?.recalcular?.();
      rolarAte(secao);
      lead?.querySelector('[data-voltar-todos]')?.addEventListener('click', e => {
        e.preventDefault(); recarregarCondominios();
      });
      return;
    }

    /* Não há caminho alternativo: a fita só lista cidade com empreendimento,
       então este ponto não deveria ser alcançado. */
    console.warn('[enove] sem empreendimento em', cidade);
  }

  function cartaoCondominio(c) {
    const brl = n => n ? 'R$ ' + Math.round(n).toLocaleString('pt-BR') : '—';
    const us = c.imoveis || [];
    const menor = us.map(u => Number(u.valor)).filter(v => v > 0).sort((a, b) => a - b)[0];
    const foto = us.map(u => (u.fotos || []).find(f => f.capa)?.url).find(Boolean) || '';
    const href = c.slug ? `condominio.html?e=${encodeURIComponent(c.slug)}` : '#';
    return `
      <article class="carr__card" data-carr-card data-href="${href}">
        <img src="${foto}" alt="${c.nome}" loading="lazy">
        <div class="carr__in">
          <span class="carr__badge">${us.length} ${us.length === 1 ? 'unidade' : 'unidades'}</span>
          <h3 class="carr__nome">${c.nome.toLowerCase()}</h3>
          <p class="carr__local">
            <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            ${c.bairro?.nome ? c.bairro.nome + ' · ' : ''}${c.cidade?.nome || ''}
          </p>
          <p class="carr__specs">${menor ? 'a partir de ' + brl(menor) : 'valores sob consulta'}</p>
          <a class="btn btn--primary carr__cta" href="${href}">Ver unidades
            <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
        </div>
      </article>`;
  }

  function recarregarCondominios() {
    const secao = document.querySelector('#top-investimentos');
    const pista = document.querySelector('[data-carr-pista]');
    ENOVE_DB.condominios(8).then(cs => {
      const pista = document.querySelector('[data-carr-pista]');
      if (!cs || !cs.length || !pista) return;
      pista.innerHTML = cs.map(cartaoCondominio).join('');
      document.dispatchEvent(new CustomEvent('enove:carrossel-atualizado'));
      window.ENOVE_MOTION?.recalcular?.();
    });
  }

  /* ---- seções que ainda mostravam exemplos ---------------------------
     Bairros, fita de cidades e carrossel de investimentos passam a sair do
     acervo. Se o banco não responder, o conteúdo de exemplo do HTML fica
     onde está — nenhuma seção esvazia. */
  if (ENOVE_DB.ativo) {
    const brl = n => n ? 'R$ ' + Math.round(n).toLocaleString('pt-BR') : '—';
    const comEmpreendimento = new Set();

    /* a fita depende de saber quais cidades têm empreendimento, então o
       painel só monta depois que os condomínios chegam */
    ENOVE_DB.condominios(500).then(todos => {
      (todos || []).forEach(c => c.cidade?.nome && comEmpreendimento.add(c.cidade.nome));
      return ENOVE_DB.panorama();
    }).then(p => {
      if (!p) return;

      const gb = document.querySelector('[data-bairros]');
      if (gb && p.bairros.length) {
        gb.innerHTML = p.bairros.slice(0, 6).map(b => `
          <a class="hood rise" href="bairro.html?b=${encodeURIComponent(b.nome)}&c=${encodeURIComponent(b.cidade)}">
            <img data-plx="7" src="${b.foto || ''}" alt="Bairro ${b.nome}" loading="lazy">
            <div class="hood__in">
              <div class="hood__name">${b.nome.toLowerCase()}</div>
              <p class="hood__desc">${b.n} ${b.n === 1 ? 'imóvel disponível' : 'imóveis disponíveis'} em ${b.cidade}.</p>
              <div class="hood__facts">
                <span class="fact"><b>${b.n}</b> ${b.n === 1 ? 'imóvel' : 'imóveis'}</span>
                ${b.m2 ? `<span class="fact"><b>${brl(b.m2)}</b>/m²</span>` : ''}
                <span class="fact"><b>${b.cidade}</b></span>
              </div>
            </div>
          </a>`).join('');
      }

      const fita = document.querySelector('[data-cidades]');
      /* `comEmpreendimento` é preenchido pela consulta de condomínios, que
         roda em paralelo. Cidade sem nenhum sai da fita: clicar nela levaria
         a uma vitrine vazia. */
      const cidades = p.cidades.filter(c => comEmpreendimento.has(c.nome));
      if (fita && cidades.length) {
        fita.innerHTML = cidades.map(c => `
          <article class="reel__item" data-cidade="${c.nome}" role="button" tabindex="0"
                   aria-label="Ver empreendimentos em ${c.nome}">
            <div class="reel__ph" data-plx-frame>
              <img data-plx="6" src="${c.foto || ''}" alt="${c.nome}" loading="lazy">
            </div>
            <div class="reel__cap">
              <div class="reel__name">${c.nome.toLowerCase()}</div>
              <div class="reel__meta"><b>${c.n}</b> ${c.n === 1 ? 'imóvel' : 'imóveis'}${c.m2 ? `<br>${brl(c.m2)}/m²` : ''}</div>
            </div>
          </article>`).join('');
        fita.querySelectorAll('[data-cidade]').forEach(el => {
          const abrir = () => abrirCidade(el.dataset.cidade);
          el.addEventListener('click', abrir);
          el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
          });
        });
        /* o título dizia "nove cidades" — conta as que de fato aparecem */
        const t = document.querySelector('[data-cidades-titulo]');
        if (t) t.innerHTML = `${cidades.length} CIDADES.<br>UM TIME QUE MORA NELAS.`;
      }
      observar();
      if (window.ENOVE_MOTION?.recalcular) window.ENOVE_MOTION.recalcular();
    });

    ENOVE_DB.condominios(8).then(cs => {
      const pista = document.querySelector('[data-carr-pista]');
      if (!cs || !cs.length || !pista) return;
      /* usa cartaoCondominio, que leva o destino do empreendimento. A cópia
         inline que vivia aqui apontava para #buscar, e o botão rolava para
         a seção de cima em vez de abrir a página. */
      pista.innerHTML = cs.map(cartaoCondominio).join('');
      document.dispatchEvent(new CustomEvent('enove:carrossel-atualizado'));
      window.ENOVE_MOTION?.recalcular?.();
    });
  }

  /* preenche destaques e similares com o acervo real quando houver banco */
  if (ENOVE_DB.ativo) ENOVE_DB.buscar({}, 12).then(lista => {
    if (!lista || !lista.length) return;
    if (dest) dest.innerHTML = lista.slice(0, 6)
      .map(im => cardHTML({ im, score: 0, motivos: [] }, false)).join('');
    if (sim)  sim.innerHTML  = lista.slice(6, 9)
      .map(im => cardHTML({ im, score: 0, motivos: [] }, false)).join('');
    observar();
  });

  if (dest) dest.innerHTML = IMOVEIS.filter(i => !i.select)
    .map(im => cardHTML({ im, score: 0, motivos: [] }, false)).join('');

  // similares na PDP
  const sim = document.getElementById('grid-similares');
  if (sim) sim.innerHTML = IMOVEIS.filter(i => i.cod !== 'CA1715').slice(0, 3)
    .map(im => cardHTML({ im, score: 0, motivos: [] }, false)).join('');

  observar();
});

/* =======================================================================
   Carrossel "top investimentos" — coverflow
   Os cartoes sao absolutos e posicionados pela DISTANCIA ate o ativo, nao
   por uma pista que desliza. Isso e o que permite o cartao central crescer
   e os vizinhos recuarem sem reflow: so transform e opacity mudam.
   ======================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const carr = document.querySelector('[data-carr]');
  if (!carr) return;
  /* `let`, não `const`: quando os cartões de exemplo são trocados pelos
     condomínios reais, esta lista precisa ser relida — senão o carrossel
     continua posicionando elementos que já saíram do DOM. */
  let cards = [...carr.querySelectorAll('[data-carr-card]')];
  if (!cards.length) return;
  const dots = document.querySelector('[data-carr-dots]');
  const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ativo = Math.floor(cards.length / 2);   // comeca no meio, como a referencia

  /* O passo lateral acompanha a largura do cartao para os vizinhos
     aparecerem pela borda sem encostar no central. */
  const passo = () => {
    const l = cards[0].offsetWidth;
    return Math.min(l * 1.02, innerWidth * 0.34);
  };

  function pintar() {
    const p = passo();
    cards.forEach((c, i) => {
      const d = i - ativo, ad = Math.abs(d);
      const escala = ad === 0 ? 1 : Math.max(0.72, 0.86 - (ad - 1) * 0.07);
      const visivel = ad <= 2;
      c.style.transform = `translateX(${d * p}px) scale(${escala})`;
      c.style.opacity   = ad === 0 ? '1' : (visivel ? String(0.42 - (ad - 1) * 0.20) : '0');
      c.style.zIndex    = String(20 - ad);
      c.classList.toggle('is-ativo', ad === 0);
      /* fora de vista sai da ordem de tabulacao: senao o Tab passeia por
         cartoes que ninguem esta vendo */
      c.querySelectorAll('a,button').forEach(el => el.tabIndex = ad === 0 ? 0 : -1);
      c.setAttribute('aria-hidden', ad === 0 ? 'false' : 'true');
    });
    if (dots) [...dots.children].forEach((b, i) => {
      b.classList.toggle('is-ativo', i === ativo);
      b.setAttribute('aria-selected', i === ativo ? 'true' : 'false');
    });
  }

  const ir = i => { ativo = (i + cards.length) % cards.length; pintar(); };

  if (dots) {
    cards.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'carr__dot'; b.type = 'button'; b.role = 'tab';
      b.setAttribute('aria-label', c.querySelector('.carr__nome').textContent.trim());
      b.addEventListener('click', () => ir(i));
      dots.appendChild(b);
    });
  }
  carr.querySelector('[data-carr-ant]')?.addEventListener('click', () => ir(ativo - 1));
  carr.querySelector('[data-carr-prox]')?.addEventListener('click', () => ir(ativo + 1));
  /* clicar num vizinho traz ele para o centro */
  cards.forEach((c, i) => c.addEventListener('click', e => {
    if (i !== ativo) { e.preventDefault(); ir(i); }
  }));

  /* Clicar num botão o põe em foco, e o navegador ROLA a página para
     trazê-lo à vista — por fora do Lenis. É o que fazia a página saltar
     sozinha ao avançar o carrossel, trazendo a fita de cidades para a tela.
     `preventScroll` mantém o foco (o teclado continua funcionando) sem
     mexer na rolagem. */
  carr.querySelectorAll('button').forEach(bt => {
    bt.addEventListener('mousedown', e => {
      e.preventDefault();
      bt.focus({ preventScroll: true });
    });
  });

  carr.tabIndex = 0;
  carr.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); ir(ativo - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(ativo + 1); }
  });

  /* arrasto: so decide a direcao ao soltar, para nao brigar com a rolagem
     vertical da pagina no celular */
  let x0 = null, y0 = null;
  const pegar = e => { const t = e.touches ? e.touches[0] : e; x0 = t.clientX; y0 = t.clientY; };
  const soltar = e => {
    if (x0 === null) return;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)) ir(ativo + (dx < 0 ? 1 : -1));
    x0 = y0 = null;
  };
  carr.addEventListener('pointerdown', pegar);
  carr.addEventListener('pointerup', soltar);
  carr.addEventListener('touchstart', pegar, { passive: true });
  carr.addEventListener('touchend', soltar, { passive: true });

  if (!suave) cards.forEach(c => c.style.transition = 'none');
  addEventListener('resize', pintar);

  /* refaz a lista, os pontos e os ouvintes quando o conteúdo real chega */
  document.addEventListener('enove:carrossel-atualizado', () => {
    cards = [...carr.querySelectorAll('[data-carr-card]')];
    if (!cards.length) return;
    ativo = Math.floor(cards.length / 2);
    if (dots) {
      dots.innerHTML = '';
      cards.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'carr__dot'; b.type = 'button'; b.role = 'tab';
        b.setAttribute('aria-label', c.querySelector('.carr__nome')?.textContent.trim() || `Item ${i+1}`);
        b.addEventListener('click', () => ir(i));
        dots.appendChild(b);
      });
    }
    cards.forEach((c, i) => c.addEventListener('click', e => {
      if (i !== ativo) { e.preventDefault(); ir(i); return; }
      /* no cartão do meio o clique abre o empreendimento; nos vizinhos ele
         só traz para o centro, senão navegar viraria acidente */
      if (!e.target.closest('a') && c.dataset.href && c.dataset.href !== '#')
        location.href = c.dataset.href;
    }));
    if (!suave) cards.forEach(c => c.style.transition = 'none');
    pintar();
  });

  pintar();
});

/* =======================================================================
   Destaques em formato de story
   Cada destaque tem varios quadros. O visor mostra uma barra de progresso
   por quadro, avanca sozinho e aceita toque nas laterais, teclado e
   arrasto para baixo. Ao chegar no fim de um destaque, segue para o
   proximo; depois do ultimo, fecha.
   ======================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const visor = document.querySelector('[data-story]');
  const gatilhos = [...document.querySelectorAll('[data-dest]')];
  if (!visor || !gatilhos.length) return;

  const F = (foto, w = 900, h = 1600) =>
    `https://images.unsplash.com/photo-${foto}?auto=format&fit=crop&w=${w}&h=${h}&q=72`;

  const DESTAQUES = [
    { titulo: 'fachada', quadros: [
      { foto: '1600607687939-ce8a6c25118c', txt: 'Frente voltada para o nascente — sol da manhã na sala.' },
      { foto: '1600585154340-be6161a56a0c', txt: 'Recuo de 4 m: dá para estacionar dois carros fora da garagem.' },
      { foto: '1567496898669-ee935f5f647a', txt: 'Rua sem saída, com pouco movimento de passagem.' } ] },
    { titulo: 'área gourmet', quadros: [
      { foto: '1600566753086-00f18fb6b3ea', txt: 'Churrasqueira e bancada de frente para o pátio.' },
      { foto: '1600121848594-d8644e57abab', txt: 'Cobertura sobre a área toda — usa no inverno também.' } ] },
    { titulo: 'living', quadros: [
      { foto: '1600585154340-be6161a56a0c', txt: 'Pé-direito de 2,90 m e janela em toda a parede oeste.' },
      { foto: '1600566753086-00f18fb6b3ea', txt: 'Integrado à cozinha, sem parede entre os ambientes.' },
      { foto: '1600607687939-ce8a6c25118c', txt: 'Piso porcelanato, aquecimento por piso na sala.' } ] },
    { titulo: 'entorno', quadros: [
      { foto: '1583608205776-bfd35f0d9f83', txt: 'Escola a 400 m, a pé por rua com calçada nos dois lados.' },
      { foto: '1567496898669-ee935f5f647a', txt: 'Mercado e farmácia a 6 minutos caminhando.' } ] },
  ];

  const barras   = visor.querySelector('[data-story-barras]');
  const img      = visor.querySelector('[data-story-img]');
  const legenda  = visor.querySelector('[data-story-legenda]');
  const titulo   = visor.querySelector('[data-story-titulo]');
  const DURACAO  = 5000;
  const semAnim  = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let iDest = 0, iQuadro = 0, t0 = 0, decorrido = 0, raf = null, pausado = false, aberto = false;

  function montarBarras() {
    barras.innerHTML = '';
    DESTAQUES[iDest].quadros.forEach(() => {
      const b = document.createElement('div');
      b.className = 'story__barra';
      b.appendChild(document.createElement('i'));
      barras.appendChild(b);
    });
  }

  function pintar() {
    const d = DESTAQUES[iDest], q = d.quadros[iQuadro];
    img.src = F(q.foto);
    img.alt = `${d.titulo}: ${q.txt}`;
    legenda.textContent = q.txt;
    titulo.textContent = d.titulo;
    [...barras.children].forEach((b, i) => {
      b.firstChild.style.width = i < iQuadro ? '100%' : '0%';
    });
  }

  function tick(agora) {
    if (!aberto) return;
    if (!pausado) {
      decorrido += agora - t0;
      const p = Math.min(1, decorrido / DURACAO);
      const barra = barras.children[iQuadro];
      if (barra) barra.firstChild.style.width = (p * 100) + '%';
      if (p >= 1) { avancar(1); return; }
    }
    t0 = agora;
    raf = requestAnimationFrame(tick);
  }

  function reiniciar() {
    decorrido = 0;
    cancelAnimationFrame(raf);
    if (semAnim) return;            // sem avanco automatico: so manual
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function avancar(passo) {
    const d = DESTAQUES[iDest];
    if (iQuadro + passo < 0) {
      if (iDest === 0) { iQuadro = 0; reiniciar(); pintar(); return; }
      iDest--; iQuadro = DESTAQUES[iDest].quadros.length - 1; montarBarras();
    } else if (iQuadro + passo >= d.quadros.length) {
      if (iDest === DESTAQUES.length - 1) { fechar(); return; }
      iDest++; iQuadro = 0; montarBarras();
    } else {
      iQuadro += passo;
    }
    pintar(); reiniciar();
  }

  function abrir(i) {
    iDest = i; iQuadro = 0; aberto = true;
    visor.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    window.__lenis?.stop();
    montarBarras(); pintar(); reiniciar();
    visor.querySelector('[data-story-fechar]').focus();
  }

  function fechar() {
    aberto = false;
    cancelAnimationFrame(raf);
    visor.hidden = true;
    document.documentElement.style.overflow = '';
    window.__lenis?.start();
    gatilhos[iDest]?.focus();
  }

  gatilhos.forEach((g, i) => g.addEventListener('click', () => abrir(i)));
  visor.querySelector('[data-story-fechar]').addEventListener('click', fechar);
  /* ha dois de cada: a metade invisivel de toque e a seta visivel */
  visor.querySelectorAll('[data-story-ant]').forEach(b => b.addEventListener('click', () => avancar(-1)));
  visor.querySelectorAll('[data-story-prox]').forEach(b => b.addEventListener('click', () => avancar(1)));

  /* Pausa manual, separada do "segurar para pausar": sem essa distincao,
     soltar o dedo depois de apertar o botao voltaria a tocar na hora. */
  const btPausa  = visor.querySelector('[data-story-pausa]');
  const icPausa  = visor.querySelector('[data-icone-pausa]');
  const icPlay   = visor.querySelector('[data-icone-play]');
  let travado = false;
  btPausa.addEventListener('click', e => {
    e.stopPropagation();
    travado = !travado;
    pausado = travado;
    icPausa.hidden = travado; icPlay.hidden = !travado;
    btPausa.setAttribute('aria-label', travado ? 'Retomar' : 'Pausar');
  });

  const salvar = visor.querySelector('[data-story-salvar]');
  salvar.addEventListener('click', e => {
    e.stopPropagation();
    salvar.setAttribute('aria-pressed',
      salvar.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });

  /* segurar pausa, como numa rede social */
  const segurar = v => e => {
    if (travado) return;                       // pausa manual tem prioridade
    if (e.target.closest('.story__bt, .story__cta')) return;   // controles nao pausam
    pausado = v;
  };
  visor.querySelector('[data-story-cta]').addEventListener('click', fechar);
  visor.addEventListener('pointerdown', segurar(true));
  visor.addEventListener('pointerup', segurar(false));
  visor.addEventListener('pointercancel', segurar(false));

  /* arrastar para baixo fecha */
  let y0 = null;
  visor.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
  visor.addEventListener('touchend', e => {
    if (y0 !== null && e.changedTouches[0].clientY - y0 > 90) fechar();
    y0 = null;
  }, { passive: true });

  document.addEventListener('keydown', e => {
    if (!aberto) return;
    if (e.key === 'Escape')     { e.preventDefault(); fechar(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); avancar(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); avancar(-1); }
  });
});

/* A barra de acao so sobe depois que o hero sai de cena: no topo ela
   competiria com o CTA do proprio hero. */
document.addEventListener('DOMContentLoaded', () => {
  const barra = document.querySelector('[data-pdpbar]');
  const hero  = document.querySelector('.pdph');
  if (!barra || !hero) return;
  const ver = () => barra.classList.toggle('is-visivel',
                      hero.getBoundingClientRect().bottom < 0);
  addEventListener('scroll', ver, { passive: true });
  ver();
});

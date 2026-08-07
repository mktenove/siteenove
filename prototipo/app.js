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
/* A seção não estima mais nada. Tinha uma tabela de R$/m² inventada, depois
   uma média do acervo — mas quem avalia é o corretor, e qualquer número que
   o site mostrasse antes disso viraria expectativa a desmentir. O formulário
   junta o que o plantão precisa saber e entrega a conversa pronta. */
const PLANTAO = '5551997668999';
const TEL_OK = /(\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}/;

async function carregarBairros() {
  const sel = document.getElementById('v-bairro');
  if (!sel || !window.ENOVE_DB?.ativo) return;
  const bs = await ENOVE_DB.bairros();
  if (!bs || !bs.length) return;
  sel.innerHTML = bs.map(b =>
    `<option value="${b.nome} (${b.cidade})">${b.nome} &middot; ${b.cidade}</option>`).join('') +
    '<option value="">Outro bairro</option>';
}

function recado() {
  const bairro  = document.getElementById('v-bairro').value;
  const tipo    = document.getElementById('v-tipo').value;
  const area    = parseFloat(document.getElementById('v-area').value);
  const quartos = document.getElementById('v-quartos').value;
  const nome    = (document.getElementById('v-nome').value || '').trim();
  const fone    = (document.getElementById('v-fone').value || '').trim();
  return { bairro, tipo, area, quartos, nome, fone,
    texto: `Oi! Sou ${nome} (${fone}). Quero fazer uma simulação de quanto ` +
           `vale meu imóvel: ${tipo}, ${area} m², ${quartos} quartos` +
           `${bairro ? ', em ' + bairro : ''}.` };
}

async function avaliar() {
  const d = recado();
  const aviso = document.getElementById('v-aviso');
  const botao = document.getElementById('v-go');

  if (!d.area || d.area < 20) {
    aviso.textContent = 'Informe a área construída.';
    aviso.classList.add('is-erro');
    return;
  }
  if (!d.nome || !TEL_OK.test(d.fone)) {
    aviso.textContent = 'Preencha nome e um WhatsApp com DDD para o corretor te retornar.';
    aviso.classList.add('is-erro');
    return;
  }
  aviso.classList.remove('is-erro');
  botao.disabled = true;
  aviso.textContent = 'Enviando...';

  /* O lead vai primeiro e sozinho: se o WhatsApp falhar, a Enove ainda fica
     com o contato de quem quis vender. */
  const CFG = window.ENOVE_CONFIG || {};
  if (CFG.url && CFG.chave) {
    try {
      await fetch(CFG.url + '/rest/v1/lead', {
        method: 'POST',
        headers: { apikey: CFG.chave, Authorization: 'Bearer ' + CFG.chave,
                   'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ nome: d.nome, telefone: d.fone, origem: 'avaliacao',
                               mensagem: d.texto })
      });
    } catch (e) { console.warn('[enove] lead da avaliação não gravou:', e.message); }
  }

  /* O envio de verdade acontece no servidor (api/plantao.js), porque o
     token do WhatsApp não pode viver no navegador. Enquanto ele não estiver
     configurado, a rota responde 501 e a gente cai no wa.me — que não envia,
     só abre a conversa escrita. */
  let entregue = false;
  try {
    const r = await fetch('/api/plantao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: d.nome, telefone: d.fone, tipo: d.tipo,
                             area: d.area, quartos: d.quartos, bairro: d.bairro })
    });
    entregue = r.ok;
  } catch (e) { /* rota ausente em ambiente estático */ }

  if (entregue) {
    concluir(d.nome);
    return;
  }
  botao.disabled = false;
  aviso.textContent = 'Abrindo o WhatsApp para você confirmar o envio...';
  window.open('https://wa.me/' + PLANTAO + '?text=' + encodeURIComponent(d.texto),
              '_blank', 'noopener');
}

/* Enviado de verdade: o formulário sai da frente e vira confirmação. Deixar
   os campos preenchidos na tela faz a pessoa duvidar se enviou e mandar de
   novo — dois pedidos iguais chegando ao plantão. */
function concluir(nome) {
  const form = document.querySelector('.vform');
  if (!form) return;
  form.innerHTML = `
    <div class="vok">
      <svg class="vok__ico" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
      <div class="vok__tit">Enviado, ${nome.split(' ')[0]}.</div>
      <p class="vok__txt">
        O plantão recebeu os dados do seu imóvel e vai te chamar no WhatsApp.
        Se preferir adiantar, ligue <b>(51) 99766-8999</b>.
      </p>
    </div>`;
  /* A confirmação é bem mais baixa que o formulário: a página encurta e
     tudo que foi medido abaixo daqui sai do lugar. Quem muda a altura avisa. */
  window.ENOVE_MOTION?.recalcular?.();
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

    /* Os banners de região não levam a uma página própria: caem na busca
       já preenchida. Uma vitrine por região só se justifica quando houver
       acervo nas duas — hoje só o Vale do Sinos tem. */
    document.querySelectorAll('[data-regiao]').forEach(b => {
      const r = b.dataset.regiao;
      if (!r) return;
      b.addEventListener('click', e => {
        e.preventDefault();
        /* Região sem nada publicado abre a conversa: mandar para uma busca
           vazia queima a visita, enquanto a conversa ao menos deixa o
           contato de alguém interessado naquele mercado. */
        if (b.hasAttribute('data-sem-acervo')) {
          window.ENOVE_CHAT?.perguntar('Procuro imóvel no ' + r);
          return;
        }
        input.value = 'imóveis no ' + r;
        renderBusca(input.value);
        rolarAte(document.getElementById('buscar'));
      });
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
  if (vgo) { vgo.addEventListener('click', avaliar); carregarBairros(); }


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
    ENOVE_DB.condominios(5).then(cs => {
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
    /* Lançamentos do Enove Select: os dois maiores empreendimentos, com o
       botão levando à página de cada um. Antes eram cartões fixos com
       href="#", que não iam a lugar nenhum. */
    ENOVE_DB.condominios(2).then(cs => {
      const grade = document.querySelector('[data-lancamentos]');
      if (!cs || !cs.length || !grade) return;
      const brlM = n => n ? 'R$ ' + (n >= 1e6 ? (n/1e6).toFixed(1).replace('.', ',') + ' mi'
                                              : Math.round(n/1000) + ' mil') : null;
      grade.innerHTML = cs.map(c => {
        const us = c.imoveis || [];
        const menor = us.map(u => Number(u.valor)).filter(v => v > 0).sort((a, b) => a - b)[0];
        const foto = us.map(u => (u.fotos || []).find(f => f.capa)?.url).find(Boolean) || '';
        const ds = [...new Set(us.map(u => u.dormitorios).filter(Boolean))].sort((a,b) => a-b);
        /* "3 e 4 e 5 e 6" não se lê; com três ou mais valores vira faixa */
        const dorm = !ds.length ? '' :
          ds.length === 1 ? `<b>${ds[0]}</b> ${ds[0] === 1 ? 'dormitório' : 'dormitórios'}` :
          ds.length === 2 ? `<b>${ds[0]} e ${ds[1]}</b> dormitórios` :
                            `<b>${ds[0]} a ${ds[ds.length-1]}</b> dormitórios`;
        const href = c.slug ? `condominio.html?e=${encodeURIComponent(c.slug)}` : '#';
        return `
        <a class="launch rise" href="${href}">
          <img data-plx="9" src="${foto}" alt="${c.nome}" loading="lazy">
          <div class="launch__in">
            <span class="launch__badge">Enove Select</span>
            <div class="launch__name">${c.nome.toLowerCase()}</div>
            <div class="launch__meta">
              ${dorm ? `<span>${dorm}</span>` : ''}
              ${menor ? `<span>A partir de <b>${brlM(menor)}</b></span>` : ''}
              <span><b>${us.length}</b> ${us.length === 1 ? 'unidade' : 'unidades'}</span>
            </div>
            <div class="mirror__lbl" style="margin-bottom:20px">
              ${c.bairro?.nome ? c.bairro.nome + ' · ' : ''}${c.cidade?.nome || ''}
            </div>
            <span class="btn btn--select">
              Ver plantas e condições
              <svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </div>
        </a>`;
      }).join('');
      observar();
      window.ENOVE_MOTION?.recalcular?.();
    });

    ENOVE_DB.condominios(5).then(cs => {
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
    if (sim)  sim.innerHTML  = lista.slice(6, 9)
      .map(im => cardHTML({ im, score: 0, motivos: [] }, false)).join('');
    observar();
  });

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

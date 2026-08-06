/* =========================================================================
   ENOVE — camada de movimento (Lenis + GSAP ScrollTrigger)
   ---------------------------------------------------------------------------
   Referência de sensação: findrealestate.com — scroll com inércia, hero
   composto em camadas de profundidade, declaração em linhas grandes que
   acendem conforme sobem, fita horizontal presa na tela.

   Calibrada pelo manual Enove: easing confiante sem bounce, durações
   120/200/320/520 ms, reveals em fade + subida curta, sem zoom agressivo.

   SUAVIZAÇÃO — não somar duas. O Lenis já amortece a posição do scroll; um
   `scrub` com atraso amortece de novo e as latências SOMAM. Com Lenis 1.05 +
   scrub 0.6 a cena só parava 914 ms depois de a roda parar, o que se sente
   como travamento (e não como engasgo: a taxa de quadros estava em 60 fps).
   Com scrub: true e duration 0.34 caiu para 263 ms. `lerp` foi testado e é
   pior aqui — o decaimento exponencial tem cauda longa (0.11 dava 832 ms).

   Sem GSAP, o app.js volta para IntersectionObserver.
   Com "reduzir movimento" ligado no sistema, esta camada não roda.

   NOTA TÉCNICA — por que não se usa gsap.from() aqui:
   from() grava o valor final relendo o DOM. Se algo invalida o tween antes
   dele começar (ScrollTrigger.refresh() faz isso), ele relê o elemento já
   no estado inicial e passa a animar de 0 para 0 — o conteúdo desaparece
   para sempre. Todas as animações de entrada usam set() + to() com valores
   explícitos, que a invalidação não consegue corromper.
   ========================================================================= */
(function () {
  'use strict';

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  // O GSAP promove a camada por conta propria e de forma estavel. No CSS,
  // um translateZ(0) era apagado assim que o GSAP escrevia transform, e a
  // promocao ligava/desligava a cada quadro — era isso que piscava.
  gsap.defaults({ force3D: true });
  document.documentElement.classList.add('motion-on');
  window.ENOVE_MOTION = { on: true, reveal, parallaxIn };

  const EASE = 'power3.out';
  const desktop = () => window.innerWidth > 900;

  /* =====================================================================
     0. LENIS — scroll com inércia, sincronizado ao ScrollTrigger
     ===================================================================== */
  const R1 = 0.65 * Math.pow(2, -16) + 0.35 * Math.pow(2, -4);
  const EASE_SCROLL = t => {
    if (t >= 1) return 1;
    const r = 0.65 * Math.pow(2, -16 * t) + 0.35 * Math.pow(2, -4 * t);
    return (1 - r) / (1 - R1);
  };

  function scrollSuave() {
    if (typeof Lenis === 'undefined') return null;

    const lenis = new Lenis({
      /* Valores medidos na referencia (findrealestate.com), nao chutados:
         um unico evento de roda, posicao amostrada quadro a quadro, e a
         curva ajustada contra o easing padrao do Lenis. O ajuste deu
         duration 1,16 com erro quadratico medio de 6,4e-6, e o
         multiplicador de roda deu exatamente 1,00 em dois deltas
         diferentes (100 e 200). Isto so funciona porque o `scrub` do
         ScrollTrigger e `true`: com scrub numerico havia suavizacao dupla e
         as latencias somavam. */
      /* 0,70 em vez dos 1,16 medidos na referencia: assenta em 301ms
         contra 498ms, e ainda entrega 39% do caminho nos primeiros 50ms —
         responde na hora e mantem a cauda macia. Os 0,34 de antes davam 64%
         em 50ms, o que le como corte, nao como deslize. */
      duration: 0.70,
      /* Duas exponenciais somadas em vez de uma. Numa exponencial pura,
         arrancada e cauda sao a MESMA variavel: mexer na duracao desloca a
         curva inteira. Medido — mantendo 40% aos 50ms, o fim cai sempre no
         mesmo ponto, qualquer que seja a duracao.
         Aqui a rapida (2^-16t, peso .65) domina a arrancada e a lenta
         (2^-4t, peso .35) sustenta a cauda. Resultado: 43% aos 50ms contra
         39% da anterior, e 99% aos 607ms contra 455ms — mais rapida no
         comeco E mais macia ao parar.
         O /(1-r1) e obrigatorio: sem normalizar, a curva termina em 0,978 e
         o Lenis daria um pulo no ultimo quadro. */
      easing: EASE_SCROLL,
      smoothWheel: true,
      wheelMultiplier: 1.3,           // mais terreno por gesto
      touchMultiplier: 1.3
    });

    // o ScrollTrigger passa a ler a posição do Lenis, não a do navegador
    lenis.on('scroll', ScrollTrigger.update);

    /* Rede de segurança: qualquer rolagem que aconteça por fora do Lenis —
       foco em elemento, âncora, extensão do navegador — deixa a posição real
       diferente da que ele acredita. Enquanto durar a divergência, o
       ScrollTrigger desenha os `pin` no lugar errado e as seções aparecem
       misturadas. Aqui a divergência é detectada e corrigida. */
    addEventListener('scroll', () => {
      const real = window.scrollY;
      if (Math.abs(real - lenis.scroll) > 2) {
        lenis.scrollTo(real, { immediate: true, force: true });
        ScrollTrigger.update();
      }
    }, { passive: true });
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // âncoras internas passam pelo Lenis para manter a inércia
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const alvo = document.querySelector(a.getAttribute('href'));
        if (!alvo || a.getAttribute('href') === '#') return;
        e.preventDefault();
        lenis.scrollTo(alvo, { offset: -90, duration: 1.15 });
      });
    });

    window.__lenis = lenis;   // exposto para depuração e testes
    return lenis;
  }

  /* =====================================================================
     1. PARALLAX DE IMAGEM
     ===================================================================== */
  function parallaxIn(escopo) {
    (escopo || document).querySelectorAll('[data-plx]:not([data-plx-on])').forEach(img => {
      img.setAttribute('data-plx-on', '1');
      const curso = parseFloat(img.dataset.plx) || 8;
      img.classList.add('plx');

      gsap.fromTo(img,
        { yPercent: -curso / 2 },
        {
          yPercent: curso / 2, ease: 'none',
          scrollTrigger: {
            trigger: img.closest('[data-plx-frame]') || img.parentElement,
            start: 'top bottom', end: 'bottom top', scrub: true,
            invalidateOnRefresh: true
          }
        });
    });
  }

  /* =====================================================================
     2. REVEAL — fade + subida curta, em lote
     ===================================================================== */
  function reveal(escopo) {
    const alvos = Array.prototype.slice
      .call((escopo || document).querySelectorAll('.rise:not([data-revealed])'))
      // dentro de [hidden] o ScrollTrigger mede start == end e o reveal pode
      // nunca disparar, travando o bloco invisível. Entram quando a seção abre.
      .filter(el => !el.closest('[hidden]'));
    if (!alvos.length) return;
    alvos.forEach(el => el.setAttribute('data-revealed', '1'));

    gsap.set(alvos, { y: 18, opacity: 0 });

    ScrollTrigger.batch(alvos, {
      start: 'top 88%',
      once: true,
      batchMax: 4,
      // 'auto' e não true: os cards de bairro têm um scrub em yPercent e o
      // overwrite total mataria esse tween.
      onEnter: lote => gsap.to(lote, {
        opacity: 1, y: 0, duration: 0.62, ease: EASE, stagger: 0.09,
        overwrite: 'auto',
        onStart: () => lote.forEach(el => el.classList.add('in'))
      })
    });
  }

  /* =====================================================================
     3. TÍTULOS — máscara subindo, preserva <br> e <span> internos
     ===================================================================== */
  function titulos() {
    gsap.utils.toArray('.rally, .display-hero, .reel__name').forEach(h => {
      gsap.set(h, { clipPath: 'inset(0% 0% 108% 0%)', y: 14 });
      gsap.to(h, {
        clipPath: 'inset(0% 0% -2% 0%)', y: 0, duration: 0.9, ease: EASE,
        scrollTrigger: { trigger: h, start: 'top 92%', once: true },
        onComplete: () => gsap.set(h, { clearProps: 'clipPath,transform' })
      });
    });
  }

  /* =====================================================================
     4. HERO — dois estagios
     A (0-45%): predio sobe e emerge das nuvens, missao visivel.
     B (45-100%): a chapa acende e o wordmark vazado revela o predio
     dentro das letras, crescendo. E o efeito da referencia.
     ===================================================================== */
  function hero() {
    const sec = document.querySelector('[data-hero]');
    if (!sec) return;

    const q        = s => sec.querySelector(s);
    const sky      = q('[data-sky]');
    const building = q('[data-building]');

    const knock    = q('[data-knock]');
    const knockLine= q('[data-knockline]');
    const stageA   = q('[data-stagea]');
    const title    = q('[data-title]');
    const tagline  = q('[data-tagline]');
    const cta      = q('[data-cta]');
    const nebFar   = q('[data-nebfar]');
    const nebMid   = q('[data-nebmid]');
    const nebBank  = q('[data-nebbank]');
    const nebCF    = q('[data-nebcfront]');
    const nebSF    = q('[data-nebsfront]');
    const edgeL    = q('[data-edgel]');
    const edgeR    = q('[data-edger]');
    const tuftL    = q('[data-tuftl]');
    const tuftR    = q('[data-tuftr]');
    const cue      = q('.scrollcue');

    /* --- entrada, antes de qualquer scroll ---------------------------- */
    /* set() + to() com valores explicitos: gsap.from() releria o DOM e, se
       algo invalidasse o tween antes de ele comecar, gravaria o estado ja
       zerado como destino — o conteudo sumiria para sempre. */
    const entrada = gsap.timeline({ delay: 0.15 });
    [[title, 0.00, 22], [tagline, 0.24, 16], [cta, 0.38, 14]].forEach(([el, pos, dy]) => {
      if (!el) return;
      gsap.set(el, { opacity: 0, y: dy });
      // clearProps so de opacity: limpar transform apagaria o yPercent do scrub
      entrada.to(el, { opacity: 1, y: 0, duration: 0.72, ease: EASE,
                       clearProps: 'opacity' }, pos);
    });

    /* --- timeline de scroll (0 a 1 ao longo do hero inteiro) ---------- */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec, start: 'top top', end: 'bottom bottom',
        scrub: true, invalidateOnRefresh: true
      }
    });

    /* ESTAGIO A — a cena sobe. Velocidades diferentes = profundidade:
       o ceu quase parado, o predio subindo muito, as nuvens no meio. */
    /* A timeline util termina em 0.80. O trecho 0.80–1.00 e uma pausa
       com o vazado ja formado, antes de passar para a proxima secao. */
    const D = 0.86;
    if (sky)      tl.to(sky,      { yPercent: 5,   duration: D, ease: 'none' }, 0);
    /* No celular o predio sobe menos: la ele e bem mais curto em pixels, e
       com os mesmos 62vh a base entrava em quadro. Valor em funcao para o
       refresh do ScrollTrigger reavaliar ao girar a tela. */
    const subida = () => matchMedia('(max-width: 720px)').matches ? '-34vh' : '-62vh';
    if (building) tl.to(building, { y: subida, scale: 1.09, duration: 1, ease: 'none' }   /* sobe ate o fim, inclusive na pausa */, 0);


    /* a missao sai de cena antes de a chapa acender */
    if (stageA) {
      /* Quem apaga o texto e o predio subindo por cima dele (z10 vs z20).
         O fade so ACOMPANHA essa oclusao — comeca junto com ela, nao depois,
         para a frase e o contorno nao conviverem na tela. */
      tl.to(stageA, { yPercent: -10, duration: D, ease: 'none' }, 0)
        .fromTo(stageA, { opacity: 1 },
                { opacity: 0, duration: 0.18, ease: 'none', immediateRender: false }, 0.30);
    }
    if (cue) tl.to(cue, { opacity: 0, duration: 0.08, ease: 'none' }, 0);

    /* Tween vazio: estende a timeline de 0.80 ate 1.0 sem animar nada.
       E o que cria a PAUSA — sem ele o scrub apenas estica as animacoes
       pelo scroll inteiro e a pausa nunca acontece. */
    tl.to({}, { duration: 1 - D }, D);

    /* Movimento ambiente das nuvens, independente do scroll: sobem devagar
       no eixo Y, sem deriva horizontal. Vai-e-volta de proposito — uma
       subida continua acabaria descobrindo a base e o corte reapareceria.
       A amplitude cabe na folga de 16% que o filho tem para baixo. */
    sec.querySelectorAll('[data-loop]').forEach((el, i) => {
      gsap.to(el, { y: -(2 + i * 0.8) + 'vh', duration: 15 + i * 4,
                    ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

    /* ESTAGIO B — a chapa acende e o wordmark vazado cresce.
       immediateRender: false e obrigatorio: sem ele o fromTo renderiza na
       criacao e a chapa apareceria opaca ja no topo da pagina. */
    /* Estagio das LINHAS: o wordmark se DESENHA letra por letra e entrega o
       bastao para a chapa. As duas escalas se encontram em 0.84 no ponto de
       troca (0.44), senao o wordmark daria um salto de tamanho na transicao. */
    if (knockLine) {
      const letras = gsap.utils.toArray(knockLine.querySelectorAll('[data-ltr]'));

      /* Cada letra e desenhada com stroke-dasharray: o traco comeca todo
         "recolhido" (offset = comprimento) e vai sendo solto ate 0.
         O comprimento do contorno de um glifo nao tem API — aproximamos pelo
         perimetro da caixa vezes 2.8, que cobre o contorno externo mais o
         olho interno das letras redondas. */
      const traco = el => { const b = el.getBBox(); return (b.width + b.height) * 2.8; };
      const aplicar = () => letras.forEach(l => {
        const t = traco(l);
        l.style.strokeDasharray = t;
        l.style.strokeDashoffset = t;   // recolhido: senao a letra aparece
      });                               // pronta e pisca quando chega a vez
      // getBBox so e confiavel depois das fontes carregarem
      if (document.fonts) document.fonts.ready.then(aplicar); else aplicar();
      aplicar();

      gsap.set(knockLine, { opacity: 0 });
      tl.to(knockLine, { opacity: 1, duration: 0.02, ease: 'none' }, 0.16)
        /* valores em funcao: reavaliados no refresh pos-fontes */
        .fromTo(letras, { strokeDashoffset: i => traco(letras[i]) },
                { strokeDashoffset: 0, duration: 0.08, stagger: 0.0267,
                  ease: 'none', immediateRender: false }, 0.18)
        .fromTo(knockLine, { scale: 0.78 },
                { scale: 0.84, duration: 0.49, ease: 'none', immediateRender: false }, 0.18)
        /* A chapa acende PRIMEIRO (ela cobre o contorno, z30 > z28) e so
           depois o contorno apaga. Na ordem inversa havia um vao de alguns
           quadros em que nem um nem outro estava opaco — era a piscada. */
        /* acompanha a escala da chapa durante o cruzamento: a chapa vai de
           0.84 a 1.2 em 0.67..0.80, entao em 0.72 ela esta em 0.9785. Sem
           isto, "imobiliaria" aparece duas vezes em tamanhos diferentes —
           uma em traco e outra solida — e a sobreposicao le como piscada. */
        .fromTo(knockLine, { scale: 0.84 },
                { scale: 0.9785, duration: 0.05, ease: 'none', immediateRender: false }, 0.67)
        .to(knockLine, { opacity: 0, duration: 0.05, ease: 'none' }, 0.67);
    }
    if (knock) {
      tl.fromTo(knock, { opacity: 0 },
                { opacity: 1, duration: 0.08, ease: 'none', immediateRender: false }, 0.67);
    }
    /* Fumaca em tres profundidades. So transform: o filtro ja esta
       rasterizado e reaproveitado como textura pela GPU. */
    /* Cinco profundidades: quanto mais na frente, mais rapido — e o que
       cria o paralaxe. So transform, nunca background-position. */
    /* Valores curtos de proposito: as nuvens ficam ANCORADAS embaixo,
       so respirando. Quem sobe e o predio — e o contraste entre os dois
       e que produz a sensacao de altitude. */
    if (nebFar)  tl.to(nebFar,  { y:  '-4vh', duration: D, ease: 'none' }, 0);
    if (nebMid)  tl.to(nebMid,  { y:  '-7vh', duration: D, ease: 'none' }, 0);
    if (nebBank) tl.to(nebBank, { y: '-10vh', duration: D, ease: 'none' }, 0);
    if (nebCF)   tl.to(nebCF,   { y: '-22vh', duration: D, ease: 'none' }, 0);
    if (nebSF)   tl.to(nebSF,   { y: '-26vh', duration: D, ease: 'none' }, 0);

    /* As nuvens de cima se afastam para as extremidades, abrindo o centro
       justamente enquanto o wordmark se desenha. */
    if (edgeL) tl.to(edgeL, { x: '-26vw', y: '-8vh', duration: D, ease: 'none' }, 0);
    if (edgeR) tl.to(edgeR, { x:  '26vw', y: '-8vh', duration: D, ease: 'none' }, 0);
    /* os tufos descortinam: comecam sobre o texto e cada um sai para a sua
       extremidade conforme o scroll, liberando a frase */
    if (tuftL) tl.to(tuftL, { x: '-17vw', duration: D, ease: 'none' }, 0);
    if (tuftR) tl.to(tuftR, { x:  '17vw', duration: D, ease: 'none' }, 0);
    /* os tufos ficam PARADOS de proposito: mascarados e sem tween, o
       navegador os rasteriza uma vez e nunca mais. Animados, seriam mais
       duas superficies mascaradas a recompor a cada quadro, acima de tudo. */
    /* Escala o <svg> INTEIRO, nao o <g> dentro da mascara. Escalar o
       conteudo da mascara obriga o navegador a re-rasteriza-la a cada quadro;
       escalando o elemento, a mascara e rasterizada uma vez e o resto vira
       transform composto na GPU. A tagline solida vive dentro do mesmo svg,
       entao acompanha o lockup sem tween proprio. */
    if (knock) {
      tl.fromTo(knock, { scale: 0.84 },
                { scale: 1.2, duration: 0.13, ease: 'none', immediateRender: false }, 0.67);
    }
  }

  /* =====================================================================
     5. MANIFESTO — as linhas acendem conforme sobem
     ===================================================================== */


  /* =====================================================================
     6. FITA HORIZONTAL PRESA NA TELA
     No celular vira rolagem horizontal nativa (CSS), sem pin.
     ===================================================================== */
  function fita() {
    const sec = document.querySelector('.reel');
    const trilho = document.querySelector('.reel__track');
    if (!sec || !trilho || !desktop()) return;

    const curso = () => Math.max(0, trilho.scrollWidth - window.innerWidth + 64);

    gsap.to(trilho, {
      x: () => -curso(), ease: 'none',
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: () => '+=' + curso(),
        pin: true, scrub: true, anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
  }

  /* =====================================================================
     7. NÚMEROS, HEADER, PROGRESSO, ESPELHOS, BAIRROS
     ===================================================================== */
  function contadores() {
    gsap.utils.toArray('[data-count]').forEach(el => {
      const fim = parseFloat(el.dataset.count);
      const pre = el.dataset.pre || '', pos = el.dataset.pos || '';
      const o = { v: 0 };
      gsap.to(o, {
        v: fim, duration: 1.5, ease: 'power2.out',
        // dispara ao entrar na tela, nao na carga da pagina
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => { el.textContent = pre + Math.round(o.v).toLocaleString('pt-BR') + pos; }
      });
    });
  }

  function header() {
    const h = document.querySelector('.hdr');
    if (!h) return;
    /* O header so fica solido no fim do hero. Com os 80px de antes ele
       virava preto logo na primeira rolagem, e o hero inteiro (500vh) perdia
       o efeito de ceu passando por baixo. */
    const hero = document.querySelector('[data-hero]');
    ScrollTrigger.create({
      start: () => hero ? hero.offsetHeight - window.innerHeight - 40 : 80,
      end: 'max', invalidateOnRefresh: true,
      onToggle: s => h.classList.toggle('is-stuck', s.isActive)
    });
  }

  function progresso() {
    const b = document.querySelector('.progress');
    if (!b) return;
    // .progress é position:fixed — não serve de trigger de si mesmo
    gsap.to(b, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
  }

  function espelhos() {
    gsap.utils.toArray('.mirror').forEach(m => {
      const barras = m.querySelectorAll('i.sold');
      gsap.set(barras, { scaleX: 0, transformOrigin: 'left center' });
      gsap.to(barras, {
        scaleX: 1, duration: 0.45, ease: EASE, stagger: 0.07,
        scrollTrigger: { trigger: m, start: 'top 85%', once: true }
      });
    });
  }

  function bairros() {
    if (!desktop()) return;
    // yPercent, não y: o reveal usa `y` nesses mesmos cards e o GSAP compõe
    // as duas propriedades no mesmo transform sem uma anular a outra.
    gsap.utils.toArray('#bairros .hood').forEach((c, i) => {
      const d = i % 2 === 0 ? 5 : 9;
      gsap.fromTo(c, { yPercent: d }, {
        yPercent: -d, ease: 'none',
        scrollTrigger: {
          trigger: '#bairros', start: 'top bottom', end: 'bottom top',
          scrub: true, invalidateOnRefresh: true
        }
      });
    });
  }

  /* =====================================================================
     8. PÁGINA DO IMÓVEL
     ===================================================================== */
  function pdp() {
    if (!document.querySelector('.pdp')) return;

    const cels = gsap.utils.toArray('.gal__main, .gal__cell');
    gsap.set(cels, { opacity: 0, y: 26 });
    gsap.to(cels, { opacity: 1, y: 0, duration: 0.72, ease: EASE, stagger: 0.1,
                    clearProps: 'opacity,transform' });

    const entra = (sel, vars, trigger, start) => {
      const els = gsap.utils.toArray(sel);
      if (!els.length) return;
      gsap.set(els, Object.assign({ opacity: 0 }, vars));
      gsap.to(els, {
        opacity: 1, x: 0, y: 0, scale: 1, duration: 0.5, ease: EASE, stagger: 0.07,
        scrollTrigger: { trigger, start, once: true }
      });
    };
    entra('.spec',      { y: 16 },  '.specs',    'top 88%');
    entra('.cost__row', { x: -14 }, '.cost__out', 'top 82%');
    entra('.poi',       { x: 18 },  '.mapblock', 'top 80%');

    const pin = document.querySelector('.pin');
    if (pin) {
      gsap.set(pin, { scale: 0, opacity: 0 });
      gsap.to(pin, {
        scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.2,
        scrollTrigger: { trigger: '.mapbox', start: 'top 78%', once: true }
      });
    }
  }

  /* =====================================================================
     9. REDE DE SEGURANÇA
     Se por qualquer motivo um bloco ficar invisível fora de um gatilho de
     scroll, ele é liberado. Melhor sem animação do que sem conteúdo.
     ===================================================================== */
  function redeDeSeguranca() {
    setTimeout(() => {
      document.querySelectorAll('.hero__center *, .gal__main, .gal__cell').forEach(el => {
        if (parseFloat(getComputedStyle(el).opacity) < 0.05 && !el.closest('[hidden]')) {
          gsap.set(el, { clearProps: 'opacity,transform' });
        }
      });
    }, 3200);
  }

  /* ---------------------------------------------------------------------
     arranque
     --------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    scrollSuave();
    parallaxIn();
    reveal();
    titulos();
    hero();
    fita();
    contadores();
    header();
    progresso();
    espelhos();
    bairros();
    pdp();
    redeDeSeguranca();

    /* Um refresh REMEDE tudo e re-cria os pins. Caindo com o visitante ja
       dentro de uma secao pinada, o `start` dela nao se desloca um pouco:
       COLAPSA. Medido com as fontes chegando tarde — start 6046 virou -145,
       a fita despinou e a pagina saltou 1063 px.

       Nao basta guardar as chamadas daqui: o ScrollTrigger tem eventos
       proprios de auto-refresh (`load`, `resize`) que nao passam por este
       codigo. Por isso a lista e reduzida ao DOMContentLoaded e o resto e
       controlado abaixo. */
    ScrollTrigger.config({ autoRefreshEvents: 'DOMContentLoaded' });

    let pendente = false, larguraAnterior = window.innerWidth;

    /* O critério NÃO é "estar perto do topo" — era, e criou um defeito pior:
       quem começava a rolar antes do conteúdo do banco chegar ficava com as
       posições medidas na página curta, e a fita grudava em cima do
       carrossel (pin em 2194 numa página de 15114).

       O que realmente não pode acontecer é remedir com uma seção PINADA no
       momento, porque aí ela despina embaixo do visitante. Fora disso,
       remedir é seguro em qualquer ponto da página. */
    const pinAtivo = () => ScrollTrigger.getAll().some(t => t.pin && t.isActive);
    const refrescar = () => {
      if (!pinAtivo()) { ScrollTrigger.refresh(); pendente = false; }
      else pendente = true;          /* tenta de novo ao sair do pin */
    };
    addEventListener('scroll', () => { if (pendente) refrescar(); },
                     { passive: true });
    addEventListener('load', refrescar);
    if (document.fonts) document.fonts.ready.then(refrescar);
    /* No celular, esconder a barra do navegador dispara resize so na ALTURA.
       Remedir por causa disso corromperia o pin no meio da leitura. */
    addEventListener('resize', () => {
      if (window.innerWidth === larguraAnterior) return;
      larguraAnterior = window.innerWidth;
      refrescar();
    });

    /* Trocar o conteúdo de exemplo pelo do banco muda a altura da página, e
       as posições dos `pin` ficam defasadas — a fita passa a se sobrepor ao
       carrossel. Quem injeta conteúdo chama isto depois. Passa pelo mesmo
       guarda: perto do topo remede na hora, no meio da página fica agendado.

       Um `requestAnimationFrame` duplo dá ao navegador a chance de aplicar
       o layout novo antes da medição; sem ele, remediria o estado antigo. */
    window.ENOVE_MOTION.recalcular = () =>
      requestAnimationFrame(() => requestAnimationFrame(refrescar));
  });
})();

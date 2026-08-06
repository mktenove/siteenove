/* =======================================================================
   Detector do embaralhamento entre a fita de cidades e o carrossel.

   Fica em silêncio até o defeito acontecer. Quando fita e carrossel ocupam
   a tela ao mesmo tempo — o que nunca deveria acontecer, porque estão a
   milhares de pixels de distância no documento — ele imprime no console o
   estado completo e o que foi feito nos segundos anteriores.

   Para remover depois: apague a tag <script src="diagnostico.js"> do HTML.
   ======================================================================= */
(() => {
  const historico = [];
  const anotar = t => {
    historico.push(`${(performance.now() / 1000).toFixed(1)}s ${t}`);
    if (historico.length > 12) historico.shift();
  };

  addEventListener('click', e => {
    const alvo = e.target.closest('[data-carr-prox],[data-carr-ant],.carr__dot,.carr__card,[data-cidade],a,button');
    anotar('clique em ' + (alvo ? (alvo.dataset.cidade ? 'cidade:' + alvo.dataset.cidade
      : alvo.className || alvo.tagName).toString().split(' ')[0] : 'página'));
  }, true);
  addEventListener('wheel', () => {
    const u = historico[historico.length - 1] || '';
    if (!u.includes('roda')) anotar('roda');
  }, { passive: true, capture: true });
  addEventListener('resize', () => anotar(`resize ${innerWidth}x${innerHeight}`));
  if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', () => anotar('ScrollTrigger.refresh'));

  let jaAvisou = false, jaAvisouHero = false;
  const vis = r => r.top < innerHeight && r.bottom > 0;

  /* O hero é um scrub: perto do topo ele tem de estar no começo da
     animação. Se estiver mostrando o vazado com a página no alto, é porque
     o ScrollTrigger parou de receber atualizações. */
  function olharHero() {
    if (jaAvisouHero || scrollY > 400) return;
    const chapa = document.querySelector('[data-knock]');
    if (!chapa) return;
    const op = +getComputedStyle(chapa).opacity;
    if (op < 0.1) return;
    jaAvisouHero = true;
    const st = window.ScrollTrigger?.getAll?.()
      .find(t => t.trigger === document.querySelector('[data-hero]'));
    console.warn(
      '%c[enove] HERO TRAVADO NO VAZADO — copie tudo abaixo',
      'background:#FFFF00;color:#000;font-weight:700;padding:2px 6px',
      {
        janela: `${innerWidth}x${innerHeight}`,
        scrollDaPagina: Math.round(scrollY),
        scrollDoLenis: Math.round(window.__lenis?.scroll ?? -1),
        lenisParado: window.__lenis?.isStopped ?? 'n/d',
        opacidadeDoVazado: +op.toFixed(2),
        heroTrigger: st ? { inicio: Math.round(st.start), fim: Math.round(st.end),
                            progresso: +st.progress.toFixed(3) } : 'ausente',
        overflowDoHtml: getComputedStyle(document.documentElement).overflow,
        tickerAtivo: window.gsap?.ticker?.frame ?? 'n/d',
        ultimasAcoes: historico
      });
  }

  (function vigiar() {
    olharHero();
    if (!jaAvisou) {
      const fita = document.querySelector('.reel');
      const carr = document.querySelector('#top-investimentos');
      if (fita && carr) {
        const a = fita.getBoundingClientRect(), c = carr.getBoundingClientRect();
        if (vis(a) && vis(c)) {
          jaAvisou = true;
          const st = window.ScrollTrigger?.getAll?.().find(x => x.pin);
          console.warn(
            '%c[enove] EMBARALHAMENTO FLAGRADO — copie tudo abaixo',
            'background:#FFFF00;color:#000;font-weight:700;padding:2px 6px',
            {
              janela: `${innerWidth}x${innerHeight}`,
              scrollDaPagina: Math.round(scrollY),
              scrollDoLenis: Math.round(window.__lenis?.scroll ?? -1),
              fita: { posicao: getComputedStyle(fita).position,
                      topo: Math.round(a.top), base: Math.round(a.bottom) },
              carrossel: { topo: Math.round(c.top), base: Math.round(c.bottom) },
              pin: st ? { inicio: Math.round(st.start), fim: Math.round(st.end),
                          ativo: st.isActive } : 'sem pin',
              alturaDoDocumento: document.documentElement.scrollHeight,
              ultimasAcoes: historico
            });
        }
      }
    }
    requestAnimationFrame(vigiar);
  })();
})();

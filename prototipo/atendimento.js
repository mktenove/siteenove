/* =======================================================================
   ENOVE — atendimento

   O objetivo desta tela não é vender um imóvel dentro do chat: é entender
   o que a pessoa quer, mostrar que existe algo para ela e sair da conversa
   com nome e telefone. Por isso o roteiro tem um fim — pedido, contato,
   corretor — em vez de conversar indefinidamente.

   A resposta hoje é gerada AQUI, no navegador, pelo mesmo interpretador da
   busca (`interpretar` em app.js). Não há IA de verdade ainda, e não pode
   haver: a chave da API viveria no código-fonte da página, à vista de
   qualquer visitante. Trocar por IA é trocar UMA função — `responder()`
   abaixo — por uma chamada a um endpoint seu. O contrato está escrito lá.
   ======================================================================= */
(() => {
  const painel = document.querySelector('[data-chat]');
  if (!painel) return;

  const corpo   = painel.querySelector('[data-chat-corpo]');
  const form    = painel.querySelector('[data-chat-form]');
  const campo   = painel.querySelector('[data-chat-campo]');
  const status  = painel.querySelector('[data-chat-status]');
  const botoes  = document.querySelectorAll('[data-chat-abrir]');
  const botao   = document.querySelector('.chat-abrir');
  const aviso   = document.querySelector('[data-chat-aviso]');
  const selo    = document.querySelector('[data-chat-selo]');
  const CORRETOR = '5551997668999';

  /* O que a conversa já sabe. Vira um lead no fim. */
  const sessao = { pedido: '', nome: '', telefone: '', achados: [], etapa: 'pedido' };

  /* ---------- desenho das mensagens ----------------------------------- */
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const hora = () => {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' +
           String(d.getMinutes()).padStart(2, '0');
  };

  function diz(quem, html, cru) {
    const el = document.createElement('div');
    el.className = 'msg msg--' + quem;
    el.innerHTML = '<div class="msg__balao">' + (cru ? html : esc(html)) +
                   '<span class="msg__hora">' + hora() + '</span></div>';
    corpo.appendChild(el);
    corpo.scrollTop = corpo.scrollHeight;
    return el;
  }

  /* O "digitando" existe para a resposta não aparecer instantânea — uma
     resposta imediata denuncia que é script e derruba a conversa. */
  function digitando() {
    status.textContent = 'digitando...';
    const el = diz('eles', '<span class="msg__pontos"><i></i><i></i><i></i></span>', true);
    el.classList.add('msg--digitando');
    return () => { el.remove(); status.textContent = 'online agora'; };
  }

  const espera = ms => new Promise(r => setTimeout(r, ms));

  async function responde(html, cru, ms) {
    const pronto = digitando();
    await espera(ms || 700 + Math.min(String(html).length * 9, 900));
    pronto();
    return diz('eles', html, cru);
  }

  /* ---------- cartões de imóvel dentro da conversa --------------------- */
  const brl = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

  function cartao(im) {
    const foto = im.foto || im.fotos && im.fotos[0];
    return '<a class="msg__im" href="imovel.html?cod=' + esc(im.cod) + '">' +
      (foto ? '<img src="' + esc(foto) + '" alt="" loading="lazy">' : '') +
      '<span class="msg__im__txt"><b>' + esc(im.tipo) + ' &middot; ' + esc(im.bairro || im.cidade) +
      '</b><i>' + (im.quartos ? im.quartos + ' quartos &middot; ' : '') +
      (im.area ? im.area + ' m&sup2;' : '') + '</i><u>' + brl(im.preco) + '</u></span></a>';
  }

  /* =====================================================================
     PONTO DE TROCA PARA A IA

     Hoje: lê o pedido com o interpretador local e responde com o que o
     banco devolveu. Determinístico, sem custo, sem chave exposta.

     Depois: publique um endpoint seu (Vercel Function, por exemplo) que
     guarde a ANTHROPIC_API_KEY no servidor e chame a Claude API. Troque o
     corpo desta função por:

         const r = await fetch('/api/atendimento', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ mensagem: texto, sessao })
         });
         const { resposta, imoveis } = await r.json();
         return { texto: resposta, imoveis };

     O endpoint recebe a mensagem e o estado da conversa e devolve o texto
     mais os imóveis a exibir. Nada mais no front precisa mudar. A chave
     NUNCA pode vir para cá — quem abre o código-fonte da página leria ela.
     ===================================================================== */
  /* O interpretador não conhece lugar nenhum: pedir "apartamento em
     Balneário Camboriú" devolvia os 60 imóveis do Vale do Sinos como se
     fossem de lá. Enquanto o acervo for todo do RS, essas praças respondem
     a verdade — e a verdade capta melhor que um resultado errado. */
  const FORA = /litoral\s*catarinense|santa\s*catarina|\bsc\b|floripa|florian[óo]polis|balne[áa]rio|camboriú|camboriu|itapema|bombinhas|itaja[íi]|porto\s*belo/i;

  async function responder(texto) {
    if (FORA.test(texto)) {
      return { texto: 'No litoral catarinense a Enove ainda não tem imóvel publicado — ' +
                      'é a praça que estamos abrindo agora. Deixa seu contato que eu te ' +
                      'aviso assim que entrar o primeiro, antes de ir pro site. ' +
                      'Como posso te chamar?',
               imoveis: [], pulaNome: true };
    }
    const fonte = (window.ENOVE_DB && await window.ENOVE_DB.buscar(interpretar(texto), 60))
                  || (typeof IMOVEIS !== 'undefined' ? IMOVEIS : []);
    const { f, res } = buscar(texto, fonte);
    const achados = res.slice(0, 3).map(r => r.im);

    if (!achados.length) {
      return { texto: 'Não achei nada exatamente assim no que está publicado — ' +
                      'mas entra imóvel novo toda semana, e boa parte nem chega ao site. ' +
                      'Me diz seu nome que eu passo pro corretor da região garimpar pra você.',
               imoveis: [], avanca: true };
    }

    const termos = (f.termos || []).map(t => t.v).join(', ');
    return {
      texto: 'Separei tr\u00eas' + (termos ? ' com ' + termos : '') + ':',
      imoveis: achados
    };
  }

  /* ---------- gravação do contato -------------------------------------- */
  async function gravarLead() {
    const CFG = window.ENOVE_CONFIG || {};
    if (!CFG.url || !CFG.chave) return false;
    try {
      const r = await fetch(CFG.url + '/rest/v1/lead', {
        method: 'POST',
        headers: { apikey: CFG.chave, Authorization: 'Bearer ' + CFG.chave,
                   'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          nome: sessao.nome,
          telefone: sessao.telefone,
          mensagem: sessao.pedido,
          imovel_codigo: sessao.achados[0] ? sessao.achados[0].cod : null,
          origem: 'chat'
        })
      });
      return r.ok;
    } catch (e) { console.warn('[enove] lead não gravou:', e.message); return false; }
  }

  function linkCorretor() {
    const t = 'Oi! Sou ' + (sessao.nome || 'cliente do site') +
              '. Procuro: ' + (sessao.pedido || 'imóvel') +
              (sessao.achados[0] ? ' (vi o ' + sessao.achados[0].cod + ' no site)' : '');
    return 'https://wa.me/' + CORRETOR + '?text=' + encodeURIComponent(t);
  }

  /* ---------- roteiro --------------------------------------------------- */
  /* Três etapas e acabou. Um chat que conversa para sempre é um chat que
     nunca entrega contato nenhum para o corretor. */
  const TEL = /(\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}/;

  async function ouvir(texto) {
    if (sessao.etapa === 'pedido') {
      sessao.pedido = texto;
      const r = await responder(texto);
      await responde(r.texto);
      if (r.imoveis.length) {
        sessao.achados = r.imoveis;
        diz('eles', r.imoveis.map(cartao).join(''), true);
      }
      sessao.etapa = 'nome';
      if (!r.pulaNome) await responde('Como posso te chamar?', false, 600);
      return;
    }

    if (sessao.etapa === 'nome') {
      sessao.nome = texto.trim().split(/\s+/).slice(0, 2).join(' ');
      sessao.etapa = 'telefone';
      await responde('Prazer, ' + sessao.nome + '. Me passa um WhatsApp? ' +
                     'Um corretor daqui te chama com as opções — inclusive as que ' +
                     'ainda não estão no site.');
      return;
    }

    if (sessao.etapa === 'telefone') {
      if (!TEL.test(texto)) {
        await responde('Acho que faltou um número aí. Manda com DDD, tipo 51 99999-9999.', false, 600);
        return;
      }
      sessao.telefone = texto.trim();
      sessao.etapa = 'fim';
      const ok = await gravarLead();
      await responde('Pronto, ' + sessao.nome + '. ' +
        (ok ? 'Já está com a equipe' : 'Anotado') +
        ' — te chamam ainda hoje no ' + esc(sessao.telefone) + '.');
      await responde('Se preferir não esperar, é só puxar assunto agora:', false, 500);
      diz('eles', '<a class="msg__wpp" href="' + linkCorretor() + '" target="_blank" rel="noopener">' +
          '<svg class="ico" viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.3' +
          'A8.5 8.5 0 1 1 21 11.5Z"/></svg>Falar com um corretor</a>', true);
      campo.placeholder = 'Pode continuar escrevendo';
      return;
    }

    /* depois do lead, o chat vira busca: responde imóvel e não pede mais nada */
    const r = await responder(texto);
    await responde(r.texto);
    if (r.imoveis.length) diz('eles', r.imoveis.map(cartao).join(''), true);
  }

  /* ---------- abrir e fechar -------------------------------------------- */
  let aberto = false, iniciado = false;

  function esconderAviso() {
    if (!aviso || aviso.hidden) return;
    aviso.classList.remove('is-dentro');
    setTimeout(() => { aviso.hidden = true; }, 260);
  }

  async function abrir() {
    if (aberto) return;
    aberto = true;
    esconderAviso();
    if (selo) selo.hidden = true;
    painel.hidden = false;
    requestAnimationFrame(() => painel.classList.add('is-aberto'));
    botao.classList.add('is-oculto');
    if (!iniciado) {
      iniciado = true;
      await responde('Oi! Aqui é a Enove.', false, 400);
      await responde('O que você procura?', false, 500);
    }
    campo.focus();
  }

  function fechar() {
    aberto = false;
    painel.classList.remove('is-aberto');
    botao.classList.remove('is-oculto');
    setTimeout(() => { if (!aberto) painel.hidden = true; }, 260);
  }

  botoes.forEach(b => b.addEventListener('click', abrir));
  if (aviso) aviso.querySelector('[data-chat-aviso-x]')
    .addEventListener('click', e => { e.stopPropagation(); esconderAviso(); });
  painel.querySelector('[data-chat-fechar]').addEventListener('click', fechar);
  addEventListener('keydown', e => { if (e.key === 'Escape' && aberto) fechar(); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const t = campo.value.trim();
    if (!t) return;
    campo.value = '';
    diz('voce', t);
    ouvir(t);
  });

  /* O aviso entra depois de sete segundos: cedo demais atropela a leitura
     do hero, tarde demais a pessoa ja rolou para longe do canto da tela.
     Nunca reaparece depois de dispensado ou depois da conversa comecar. */
  setTimeout(() => {
    if (aberto || iniciado || !aviso) return;
    if (selo) selo.hidden = false;
    aviso.hidden = false;
    requestAnimationFrame(() => aviso.classList.add('is-dentro'));
  }, 7000);

  /* Qualquer botão de contato da página passa a abrir a conversa em vez de
     jogar a pessoa para fora do site. */
  document.querySelectorAll('[data-abrir-chat]').forEach(b =>
    b.addEventListener('click', e => { e.preventDefault(); abrir(); }));

  /* O resto da página fala com o chat por aqui. `perguntar` entra como se a
     pessoa tivesse digitado: serve para os banners de região sem acervo,
     onde uma busca vazia seria pior que uma conversa. */
  window.ENOVE_CHAT = {
    abrir,
    async perguntar(texto) {
      await abrir();
      await espera(600);
      diz('voce', texto);
      ouvir(texto);
    }
  };
})();

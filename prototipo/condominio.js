/* Página do empreendimento. Lê ?e=slug e monta tudo a partir do banco. */
document.addEventListener('DOMContentLoaded', async () => {
  const alvo = document.querySelector('[data-cond-hero]');
  if (!alvo) return;
  const slug = new URLSearchParams(location.search).get('e');
  const set = (sel, txt) => { const e = document.querySelector(sel); if (e) e.textContent = txt; };

  if (!slug || !window.ENOVE_DB?.ativo) {
    set('[data-cond-nome]', 'empreendimento não encontrado');
    set('[data-cond-local]', 'Verifique o endereço ou volte à listagem.');
    return;
  }

  const c = await ENOVE_DB.condominio(slug);
  if (!c) {
    set('[data-cond-nome]', 'empreendimento não encontrado');
    set('[data-cond-local]', 'Ele pode ter saído do ar. Veja os outros na página inicial.');
    return;
  }

  const brl = n => n ? 'R$ ' + Math.round(n).toLocaleString('pt-BR') : null;
  const un  = c.unidades || [];
  document.title = `${c.nome} · Enove Imobiliária`;

  /* hero — a capa vem da primeira unidade com foto, já que o condomínio
     ainda não tem fotografia própria cadastrada */
  const capa = un.map(u => u.foto).find(Boolean) || '';
  const foto = document.querySelector('[data-cond-foto]');
  if (foto && capa) { foto.src = capa; foto.alt = c.nome; }
  set('[data-cond-nome]', c.nome.toLowerCase());
  set('[data-cond-local]', [c.bairro?.nome, c.cidade?.nome].filter(Boolean).join(' · '));

  const tags = document.querySelector('[data-cond-tags]');
  if (tags) {
    const t = [];
    if (un.length) t.push(`<span class="card__tag">${un.length} ${un.length === 1 ? 'unidade' : 'unidades'}</span>`);
    if (c.situacao_obra) t.push(`<span class="card__tag card__tag--ink">${c.situacao_obra.replace('_',' ').toLowerCase()}</span>`);
    tags.innerHTML = t.join('');
  }

  /* linha de fatos: só o que existe. Campo vazio vira nada, não "—" */
  const fatos = [];
  const ico = d => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  if (c.construtora)    fatos.push([ico('<path d="M3 21h18M5 21V7l7-4 7 4v14"/>'), c.construtora]);
  if (c.ano_entrega)    fatos.push([ico('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'), `entrega em ${c.ano_entrega}`]);
  if (c.total_unidades) fatos.push([ico('<path d="M3 21h18M6 21V8h12v13M9 12h2m2 0h2M9 16h2m2 0h2"/>'), `${c.total_unidades} unidades no total`]);
  if (c.torres)         fatos.push([ico('<path d="M6 21V4h5v17M13 21V9h5v12"/>'), `${c.torres} ${c.torres === 1 ? 'torre' : 'torres'}`]);
  const elFatos = document.querySelector('[data-cond-fatos]');
  if (elFatos) elFatos.innerHTML = fatos.map(([i, t]) =>
    `<div class="pdpfato">${i}<span>${t}</span></div>`).join('')
    || `<div class="pdpfato"><span>${un.length} ${un.length === 1 ? 'unidade disponível' : 'unidades disponíveis'}</span></div>`;

  const sobre = document.querySelector('[data-cond-sobre]');
  if (sobre) sobre.innerHTML = c.descricao
    ? `<h2 class="rally" style="font-size:var(--t-h2);margin:0 0 16px">SOBRE O EMPREENDIMENTO</h2>${c.descricao}`
    : '';

  /* unidades — reaproveita o card da home */
  const grid = document.getElementById('grid-unidades');
  if (grid) grid.innerHTML = un.length
    ? un.map(im => cardHTML({ im, score: 0, motivos: [] }, false)).join('')
    : '<p class="lead">Nenhuma unidade disponível no momento.</p>';

  const menor = un.map(u => u.preco).filter(v => v > 0).sort((a, b) => a - b)[0];
  set('[data-cond-menor]', menor ? `a partir de ${brl(menor)}` : 'valores sob consulta');
  set('[data-cond-resumo]', `${un.length} ${un.length === 1 ? 'unidade disponível' : 'unidades disponíveis'}`);
  set('[data-cond-sub-unidades]', un.length
    ? `${un.length} ${un.length === 1 ? 'unidade' : 'unidades'} à venda neste empreendimento.`
    : 'Fale com a gente para saber das próximas.');

  if (typeof observar === 'function') observar();
});

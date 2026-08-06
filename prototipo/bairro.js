/* Página do bairro. Lê ?b=nome&c=cidade e monta a partir do banco. */
document.addEventListener('DOMContentLoaded', async () => {
  const alvo = document.querySelector('[data-bai-hero]');
  if (!alvo) return;
  const q = new URLSearchParams(location.search);
  const nome = q.get('b'), cidade = q.get('c');
  const set = (sel, txt) => { const e = document.querySelector(sel); if (e) e.textContent = txt; };

  if (!nome || !cidade || !window.ENOVE_DB?.ativo) {
    set('[data-bai-nome]', 'bairro não encontrado');
    set('[data-bai-local]', 'Verifique o endereço ou volte à listagem.');
    return;
  }

  const b = await ENOVE_DB.bairro(nome, cidade);
  if (!b) {
    set('[data-bai-nome]', 'bairro sem imóveis no momento');
    set('[data-bai-local]', `${nome} · ${cidade}`);
    return;
  }

  const brl = n => n ? 'R$ ' + Math.round(n).toLocaleString('pt-BR') : null;
  const ims = b.imoveis;
  document.title = `${b.nome} · ${b.cidade} · Enove Imobiliária`;

  const capa = ims.map(i => i.foto).find(Boolean) || '';
  const foto = document.querySelector('[data-bai-foto]');
  if (foto && capa) { foto.src = capa; foto.alt = `Bairro ${b.nome}`; }
  set('[data-bai-nome]', b.nome.toLowerCase());
  set('[data-bai-local]', b.cidade);

  const tags = document.querySelector('[data-bai-tags]');
  if (tags) tags.innerHTML =
    `<span class="card__tag">${ims.length} ${ims.length === 1 ? 'imóvel' : 'imóveis'}</span>` +
    (b.m2 ? `<span class="card__tag card__tag--ink">${brl(b.m2)}/m²</span>` : '');

  /* a composição por tipo diz mais sobre o bairro que a média de preço */
  const ico = d => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const fatos = [];
  const tipos = Object.entries(b.tipos).sort((a, x) => x[1] - a[1]);
  if (tipos.length) fatos.push([ico('<path d="M3 21h18M6 21V8h12v13"/>'),
    tipos.slice(0, 3).map(([t, n]) => `${n} ${t}${n > 1 ? 's' : ''}`).join(' · ')]);
  if (b.menor) fatos.push([ico('<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    `de ${brl(b.menor)} a ${brl(b.maior)}`]);
  if (b.m2) fatos.push([ico('<path d="M4 4h16v16H4zM9 4v16M4 9h16"/>'), `${brl(b.m2)} por m² em média`]);
  const elFatos = document.querySelector('[data-bai-fatos]');
  if (elFatos) elFatos.innerHTML = fatos.map(([i, t]) =>
    `<div class="pdpfato">${i}<span>${t}</span></div>`).join('');

  const sobre = document.querySelector('[data-bai-sobre]');
  if (sobre) sobre.innerHTML = '';   /* texto editorial do bairro ainda não existe no banco */

  const grid = document.getElementById('grid-imoveis');
  if (grid) grid.innerHTML = ims.map(im => cardHTML({ im, score: 0, motivos: [] }, false)).join('');

  set('[data-bai-menor]', b.menor ? `a partir de ${brl(b.menor)}` : 'valores sob consulta');
  set('[data-bai-resumo]', `${ims.length} ${ims.length === 1 ? 'imóvel disponível' : 'imóveis disponíveis'}`);
  set('[data-bai-sub-imoveis]', `${ims.length} ${ims.length === 1 ? 'imóvel' : 'imóveis'} à venda em ${b.nome}.`);
  const tit = document.querySelector('[data-bai-titulo-imoveis]');
  if (tit) tit.textContent = 'IMÓVEIS NESTE BAIRRO';

  if (typeof observar === 'function') observar();
});

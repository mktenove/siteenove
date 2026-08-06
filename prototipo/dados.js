/* =======================================================================
   Camada de dados — lê os imóveis reais do Supabase.

   O front continua consumindo o MESMO formato de antes: esta camada
   traduz o registro do banco para o formato que buscar(), pontuar() e
   cardHTML() já esperam. Nenhuma dessas funções precisou mudar.

   Sem chave configurada, ou se a rede falhar, o site cai nos imóveis de
   exemplo embutidos em app.js — a página nunca fica vazia.
   ======================================================================= */
window.ENOVE_DB = (() => {
  const CFG = window.ENOVE_CONFIG || {};

  /* A chave `secret` ignora o RLS. Colada aqui, ela ficaria visível no
     código-fonte da página e daria acesso total ao banco a qualquer
     visitante. É um erro fácil de cometer — as duas chaves são parecidas —
     e caro demais para depender de atenção. */
  if (/^sb_secret_|service_role/.test(CFG.chave || '')) {
    console.error('[enove] A chave em config.js é a SECRET. Ela não pode ' +
                  'ficar no site: use a publishable (sb_publishable_...). ' +
                  'A conexão com o banco foi recusada.');
    CFG.chave = '';
  }

  const ativo = !!(CFG.url && CFG.chave);

  const CAMPOS = [
    'codigo','tipo','finalidade','titulo','valor','valor_condominio','valor_iptu',
    'area_util','area_total','dormitorios','suites','banheiros','vagas','destaque',
    'condominio_id','cidade:cidade_id(nome)','bairro:bairro_id(nome)',
    'fotos:imovel_foto(url,ordem,capa)'
  ].join(',');

  const TIPOS = { CA:'casa', AP:'apartamento', TE:'terreno', CH:'chácara',
                  SI:'sítio', SA:'sala', LJ:'loja', PA:'pavilhão', PR:'prédio',
                  AR:'área', ES:'estúdio', AD:'apartamento', SJ:'sobreloja' };
  /* o front fala "casa", o banco guarda "CA" — sem esta tradução o filtro
     de tipo nunca casa e a busca volta vazia */
  const SIGLA = { casa:'CA', apartamento:'AP', terreno:'TE', 'chácara':'CH',
                  'sítio':'SI', sala:'SA', loja:'LJ', 'pavilhão':'PA',
                  'prédio':'PR', 'área':'AR', 'estúdio':'ES' };

  /* traduz o registro do banco para o formato que o front já usa */
  function traduzir(r) {
    const fotos = (r.fotos || []).slice().sort((a, b) => (a.ordem||0) - (b.ordem||0));
    const capa  = fotos.find(f => f.capa) || fotos[0];
    return {
      cod:        r.codigo,
      tipo:       TIPOS[r.tipo] || 'imóvel',
      bairro:     r.bairro?.nome || '',
      cidade:     r.cidade?.nome || '',
      preco:      Number(r.valor) || 0,
      quartos:    r.dormitorios || 0,
      suites:     r.suites || 0,
      banheiros:  r.banheiros || 0,
      vagas:      r.vagas || 0,
      area:       Number(r.area_util) || 0,
      terreno:    Number(r.area_total) || 0,
      condominio: Number(r.valor_condominio) || 0,
      iptu:       Number(r.valor_iptu) || 0,
      foto:       capa?.url || '',
      tag:        r.destaque ? 'Destaque' : (r.condominio_id ? 'Em condomínio' : ''),
      feats:      [],
      perfil:     []
    };
  }

  async function pegar(caminho) {
    const r = await fetch(`${CFG.url}/rest/v1/${caminho}`, {
      headers: { apikey: CFG.chave, Authorization: `Bearer ${CFG.chave}` }
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return r.json();
  }

  return {
    ativo,
    /* Busca no banco. Os filtros pesados (cidade, faixa de preço, quartos)
       vão para o servidor; o ranqueamento fino continua no cliente, que é
       onde a leitura da frase acontece. */
    async buscar(f = {}, limite = 60) {
      if (!ativo) return null;
      const q = ['situacao=eq.PUBLICADO', `select=${CAMPOS}`, `limit=${limite}`];
      const sig = SIGLA[String(f.tipo || '').toLowerCase()];
      if (sig)         q.push(`tipo=eq.${sig}`);
      if (f.precoMax)  q.push(`valor=lte.${f.precoMax}`);
      if (f.precoMin)  q.push(`valor=gte.${f.precoMin}`);
      if (f.quartos)   q.push(`dormitorios=gte.${f.quartos}`);
      if (f.vagas)     q.push(`vagas=gte.${f.vagas}`);
      q.push('order=destaque.desc,valor.asc');
      try {
        const r = (await pegar(`imovel?${q.join('&')}`)).map(traduzir);
        /* devolver [] faria o chamador aceitar "nenhum imóvel" como resposta
           boa — `|| IMOVEIS` não age sobre array vazio. Null diz "não
           consegui", que é diferente de "não há". */
        return r.length ? r : null;
      } catch (e) {
        console.warn('[enove] busca no banco falhou:', e.message); return null;
      }
    },
    async porCodigo(cod) {
      if (!ativo) return null;
      try {
        const r = await pegar(`imovel?codigo=eq.${cod.toUpperCase()}&select=${CAMPOS}&limit=1`);
        return r[0] ? traduzir(r[0]) : null;
      } catch { return null; }
    },
    /* Um bairro com os imóveis dele — alimenta bairro.html */
    async bairro(nome, cidade) {
      if (!ativo) return null;
      try {
        const r = await pegar('imovel?select=' +
          CAMPOS.replace('bairro:bairro_id(nome)', 'bairro:bairro_id!inner(nome)')
                .replace('cidade:cidade_id(nome)', 'cidade:cidade_id!inner(nome)') +
          `&situacao=eq.PUBLICADO&bairro_id.nome=eq.${encodeURIComponent(nome)}` +
          `&cidade_id.nome=eq.${encodeURIComponent(cidade)}` +
          '&order=destaque.desc,valor.asc&limit=200');
        if (!r.length) return null;
        const ims = r.map(traduzir);
        const m2 = ims.map(i => (i.preco && i.area) ? i.preco / i.area : null).filter(Boolean);
        const precos = ims.map(i => i.preco).filter(v => v > 0);
        return {
          nome, cidade, imoveis: ims,
          m2: m2.length ? Math.round(m2.reduce((s, v) => s + v, 0) / m2.length) : null,
          menor: precos.length ? Math.min(...precos) : null,
          maior: precos.length ? Math.max(...precos) : null,
          /* quantos de cada tipo — dá a cara do bairro melhor que a média */
          tipos: ims.reduce((a, i) => (a[i.tipo] = (a[i.tipo] || 0) + 1, a), {})
        };
      } catch (e) { console.warn('[enove] bairro falhou:', e.message); return null; }
    },
    /* Um empreendimento com todas as unidades — alimenta condominio.html */
    async condominio(slug) {
      if (!ativo) return null;
      try {
        const r = await pegar('condominio?select=id,nome,slug,chamada,descricao,' +
          'construtora,ano_entrega,situacao_obra,total_unidades,torres,andares,lat,lng,' +
          'cidade:cidade_id(nome),bairro:bairro_id(nome),' +
          'imoveis:imovel(codigo,tipo,titulo,valor,dormitorios,suites,banheiros,vagas,' +
          'area_util,area_total,situacao,fotos:imovel_foto(url,ordem,capa))' +
          `&slug=eq.${encodeURIComponent(slug)}&limit=1`);
        if (!r[0]) return null;
        const c = r[0];
        c.unidades = (c.imoveis || [])
          .filter(u => u.situacao === 'PUBLICADO')
          .map(u => traduzir({ ...u, cidade: c.cidade, bairro: c.bairro }))
          .sort((a, b) => (a.preco || 1e12) - (b.preco || 1e12));
        return c;
      } catch (e) { console.warn('[enove] condomínio falhou:', e.message); return null; }
    },
    /* Imóveis de uma cidade, para quando ela não tem empreendimento */
    async porCidade(cidade, limite = 24) {
      if (!ativo) return null;
      try {
        const r = await pegar('imovel?select=' + CAMPOS.replace('cidade:cidade_id(nome)', 'cidade:cidade_id!inner(nome)') +
          `&situacao=eq.PUBLICADO&cidade_id.nome=eq.${encodeURIComponent(cidade)}` +
          `&order=destaque.desc,valor.asc&limit=${limite}`);
        return r.length ? r.map(traduzir) : null;
      } catch (e) { console.warn('[enove] porCidade falhou:', e.message); return null; }
    },
    /* Bairros, cidades e condomínios com números reais. O PostgREST não
       agrega, então a contagem é feita aqui — é uma leitura só, e o volume
       (1.286 registros enxutos) cabe bem. */
    async panorama() {
      if (!ativo) return null;
      try {
        const r = await pegar('imovel?select=codigo,valor,area_util,condominio_id,' +
          'cidade:cidade_id(nome),bairro:bairro_id(nome),fotos:imovel_foto(url,capa)' +
          '&situacao=eq.PUBLICADO&limit=2000');
        const cid = new Map(), bai = new Map();
        for (const i of r) {
          const c = i.cidade?.nome, b = i.bairro?.nome;
          const foto = (i.fotos || []).find(f => f.capa)?.url;
          const m2 = (i.valor && i.area_util) ? i.valor / i.area_util : null;
          if (c) {
            if (!cid.has(c)) cid.set(c, { nome: c, n: 0, m2: [], foto: null });
            const o = cid.get(c); o.n++; if (m2) o.m2.push(m2); o.foto ||= foto;
          }
          if (c && b) {
            const k = b + '|' + c;
            if (!bai.has(k)) bai.set(k, { nome: b, cidade: c, n: 0, m2: [], foto: null });
            const o = bai.get(k); o.n++; if (m2) o.m2.push(m2); o.foto ||= foto;
          }
        }
        const media = a => a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length) : null;
        const arruma = m => [...m.values()]
          .map(o => ({ ...o, m2: media(o.m2) }))
          .sort((a, b) => b.n - a.n);
        return { cidades: arruma(cid), bairros: arruma(bai), total: r.length };
      } catch (e) { console.warn('[enove] panorama falhou:', e.message); return null; }
    },
    async condominios(limite = 8, cidade = null) {
      if (!ativo) return null;
      try {
        /* Só 10 das 25 cidades têm empreendimento. O filtro vai no servidor,
           mas quem clicou numa cidade sem nenhum precisa de outro caminho —
           ver `abrirCidade` em app.js. */
        const fCidade = cidade ? `&cidade_id.nome=eq.${encodeURIComponent(cidade)}` : '';
        const r = await pegar('condominio?select=id,nome,slug,cidade:cidade_id!inner(nome),' +
          'bairro:bairro_id(nome),imoveis:imovel(codigo,valor,dormitorios,area_util,' +
          'fotos:imovel_foto(url,capa))&publicado=is.true&limit=200' + fCidade);
        /* só condomínio com unidade à venda entra na vitrine */
        return r.filter(c => (c.imoveis || []).length > 0)
                .sort((a, b) => b.imoveis.length - a.imoveis.length)
                .slice(0, limite);
      } catch (e) { console.warn('[enove] condomínios falhou:', e.message); return null; }
    },
    async total() {
      if (!ativo) return null;
      const r = await fetch(`${CFG.url}/rest/v1/imovel?select=codigo&situacao=eq.PUBLICADO`, {
        headers: { apikey: CFG.chave, Authorization: `Bearer ${CFG.chave}`,
                   Prefer: 'count=exact', Range: '0-0' }
      });
      return parseInt((r.headers.get('content-range') || '/0').split('/').pop(), 10);
    }
  };
})();

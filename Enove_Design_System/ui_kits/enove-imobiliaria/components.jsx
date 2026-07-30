// Shared UI kit components for Enove Imobiliária
// Usage: load AFTER React + Babel, before app scripts

const ui = {};

// -- Icon: simple stroke icons, Lucide-style
ui.Icon = ({ name, size = 20, stroke = 1.75, ...rest }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    close: <><path d="M18 6 6 18M6 6l12 12"/></>,
    bed: <><path d="M2 11V4M22 11v10M2 21v-7M2 14h20"/><path d="M6 11V8h12v3"/></>,
    bath: <><path d="M3 12h18v4a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-4z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M10 7h3"/></>,
    car: <><path d="M5 17h14l-1.5-6.5A2 2 0 0 0 15.57 9H8.43a2 2 0 0 0-1.93 1.5L5 17z"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></>,
    ruler: <><path d="m3 14 11-11 7 7L10 21z"/><path d="m7 10 2 2M10 7l2 2M13 4l2 2"/></>,
    pin: <><path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
    phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    chevron: <><path d="m9 18 6-6-6-6"/></>,
    whatsapp: <><path d="M17 15.5c-1-.2-1.8-.6-2.5-1.2-.7-.5-1-1.2-1-1.2"/><path d="M3 12a9 9 0 0 1 9-9c5 0 9 4 9 9s-4 9-9 9c-1.5 0-3-.4-4.3-1.1L3 21l1.1-4.7A9 9 0 0 1 3 12z"/></>,
    star: <><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>,
    check: <><path d="M20 6 9 17l-5-5"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>{paths[name]}</svg>
  );
};

// -- Button
ui.Button = ({ variant = 'primary', size = 'md', children, icon, ...rest }) => {
  const base = { fontFamily: 'inherit', fontWeight: 700, border: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, transition: 'all 160ms cubic-bezier(.2,.7,.2,1)', letterSpacing: '.02em' };
  const sizes = { sm: { padding: '8px 14px', fontSize: 12 }, md: { padding: '12px 22px', fontSize: 14 }, lg: { padding: '16px 30px', fontSize: 16 } };
  const variants = {
    primary: { background: 'var(--enove-yellow)', color: 'var(--enove-ink)', boxShadow: '0 12px 28px -10px rgba(255,230,0,.55)' },
    dark: { background: 'var(--enove-graphite)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--enove-ink)', border: '1.5px solid var(--enove-ink)' },
    whiteghost: { background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,.5)' },
  };
  return <button style={{...base, ...sizes[size], ...variants[variant]}} {...rest}>{icon && <ui.Icon name={icon} size={16} />}{children}</button>;
};

// -- Tag / badge
ui.Tag = ({ tone = 'yellow', children }) => {
  const tones = {
    yellow: { background: 'var(--enove-yellow)', color: 'var(--enove-ink)' },
    dark: { background: 'var(--enove-graphite)', color: '#fff' },
    ghost: { background: '#fff', color: 'var(--enove-ink)', border: '1.5px solid var(--border-2)' },
    ink: { background: 'var(--enove-ink)', color: 'var(--enove-yellow)' },
    soft: { background: 'var(--enove-yellow-soft)', color: 'var(--enove-ink)' },
  };
  return <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:800, padding:'5px 11px', borderRadius:999, letterSpacing:'.08em', textTransform:'uppercase', ...tones[tone] }}>{children}</span>;
};

// -- Header
ui.Header = ({ onNav }) => (
  <header style={{ position:'sticky', top:0, zIndex:10, background:'var(--enove-graphite)', color:'#fff', padding:'14px 48px', display:'flex', alignItems:'center', gap:36, borderBottom:'1px solid rgba(255,255,255,.08)'}}>
    <a href="#" onClick={e=>{e.preventDefault();onNav&&onNav('home');}} style={{display:'flex', alignItems:'center', textDecoration:'none'}}>
      <img src="../../assets/logos/enove-yellow.png" alt="Enove" style={{height:28}}/>
    </a>
    <nav style={{display:'flex', gap:28, flex:1}}>
      {['Comprar','Alugar','Vender meu imóvel','Sobre'].map(l=>(
        <a key={l} href="#" onClick={e=>{e.preventDefault();onNav&&onNav(l);}} style={{color:'#fff', textDecoration:'none', fontWeight:500, fontSize:14, opacity:.9}}>{l}</a>
      ))}
    </nav>
    <a href="#" style={{color:'#fff', textDecoration:'none', fontSize:13, display:'flex', alignItems:'center', gap:8, opacity:.8}}><ui.Icon name="phone" size={14}/> (51) 3000-0000</a>
    <ui.Button variant="primary" size="sm" icon="whatsapp">Falar com corretor</ui.Button>
  </header>
);

// -- Footer
ui.Footer = () => (
  <footer style={{background:'var(--enove-graphite)', color:'#fff', padding:'56px 48px 36px'}}>
    <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:48, alignItems:'start'}}>
      <div>
        <img src="../../assets/logos/enove-yellow.png" style={{height:36}}/>
        <p style={{color:'rgba(255,255,255,.7)', fontSize:14, marginTop:20, maxWidth:320, lineHeight:1.6}}><i>Conectar pessoas a sonhos.</i><br/>Imobiliária em Porto Alegre e região.</p>
      </div>
      {[['Enove',['Sobre','Cultura','Carreiras','Imprensa']],['Imóveis',['Comprar','Alugar','Vender','Avaliar']],['Contato',['(51) 3000-0000','contato@enove.com.br','Rua Exemplo, 123','Porto Alegre · RS']]].map(([h,items])=>(
        <div key={h}>
          <h4 style={{fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', fontWeight:700, color:'var(--enove-yellow)', margin:'0 0 16px'}}>{h}</h4>
          {items.map(i=><div key={i} style={{fontSize:14, color:'rgba(255,255,255,.75)', marginBottom:8}}>{i}</div>)}
        </div>
      ))}
    </div>
    <div style={{display:'flex', justifyContent:'space-between', marginTop:48, paddingTop:24, borderTop:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.5)', fontSize:12}}>
      <span>© 2026 Enove Imobiliária · CRECI 00000-J</span>
      <span>Fazemos a coisa certa sempre.</span>
    </div>
  </footer>
);

// -- Property card
ui.PropertyCard = ({ price, address, district, bedrooms, baths, area, parking, tag, img, onFav, fav }) => (
  <div style={{borderRadius:22, overflow:'hidden', background:'#fff', boxShadow:'0 10px 24px -8px rgba(15,13,14,.12), 0 2px 6px rgba(15,13,14,.05)', border:'1px solid var(--border-1)', transition:'transform 200ms, box-shadow 200ms'}}
    onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 20px 40px -12px rgba(15,13,14,.2), 0 4px 10px rgba(15,13,14,.06)';}}
    onMouseOut={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 10px 24px -8px rgba(15,13,14,.12), 0 2px 6px rgba(15,13,14,.05)';}}>
    <div style={{height:210, background: img || 'linear-gradient(135deg,#4A4648,#2B2829)', backgroundSize:'cover', backgroundPosition:'center', position:'relative'}}>
      {tag && <div style={{position:'absolute', top:14, left:14}}><ui.Tag tone="yellow">{tag}</ui.Tag></div>}
      <button onClick={onFav} style={{position:'absolute', top:12, right:12, width:36, height:36, borderRadius:999, border:0, background:'rgba(255,255,255,.95)', cursor:'pointer', color: fav?'#FF0000':'var(--fg-3)'}}><ui.Icon name="heart" size={18} stroke={fav?0:1.75}/></button>
    </div>
    <div style={{padding:'18px 20px 20px'}}>
      <div style={{fontSize:22, fontWeight:900, letterSpacing:'-.02em', color:'var(--enove-ink)'}}>{price}</div>
      <div style={{fontSize:14, fontWeight:600, marginTop:4}}>{address}</div>
      <div style={{fontSize:13, color:'var(--fg-3)', marginTop:2}}>{district}</div>
      <div style={{display:'flex', gap:18, fontSize:12, color:'var(--fg-2)', marginTop:14, paddingTop:14, borderTop:'1px solid var(--border-1)'}}>
        <span style={{display:'flex',alignItems:'center',gap:6}}><ui.Icon name="bed" size={14}/><b>{bedrooms}</b></span>
        <span style={{display:'flex',alignItems:'center',gap:6}}><ui.Icon name="bath" size={14}/><b>{baths}</b></span>
        <span style={{display:'flex',alignItems:'center',gap:6}}><ui.Icon name="ruler" size={14}/><b>{area} m²</b></span>
        <span style={{display:'flex',alignItems:'center',gap:6}}><ui.Icon name="car" size={14}/><b>{parking}</b></span>
      </div>
    </div>
  </div>
);

// -- Search bar (big hero version)
ui.SearchBar = ({ onSearch }) => {
  const [tab, setTab] = React.useState('comprar');
  return (
    <div style={{background:'#fff', borderRadius:22, padding:18, boxShadow:'0 24px 48px -16px rgba(15,13,14,.3)', width:'100%', maxWidth:720}}>
      <div style={{display:'flex', gap:4, marginBottom:14}}>
        {['comprar','alugar'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1, padding:'10px 8px', fontSize:12, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', border:0, background:tab===t?'var(--enove-ink)':'transparent', color:tab===t?'var(--enove-yellow)':'var(--fg-2)', borderRadius:12, cursor:'pointer', fontFamily:'inherit'}}>{t}</button>
        ))}
      </div>
      <div style={{display:'flex', gap:10, alignItems:'center', border:'1.5px solid var(--border-1)', borderRadius:999, padding:'6px 6px 6px 18px'}}>
        <ui.Icon name="search" size={18}/>
        <input defaultValue="Menino Deus, Porto Alegre" style={{flex:1, border:0, outline:'none', fontSize:15, fontFamily:'inherit', background:'transparent'}}/>
        <ui.Button variant="dark" size="md" onClick={onSearch}>Buscar</ui.Button>
      </div>
      <div style={{display:'flex', gap:8, marginTop:12, flexWrap:'wrap'}}>
        {['Apartamento','Casa','Cobertura','2 quartos','3 quartos','Com vaga'].map(c=>(
          <span key={c} style={{fontSize:12, padding:'6px 12px', background:'var(--bg-3)', color:'var(--fg-2)', borderRadius:999, fontWeight:600}}>{c}</span>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, ui);

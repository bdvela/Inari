/* ============================================================
   INARI GROUP — Dashboard (sidebar layout)
   ============================================================ */

const Icon = window.IG_Icon;

function Sidebar({ active = 'cotizaciones' }) {
  const nav = [
    { k: 'inicio',        label: 'Inicio',         icon: <Icon.Home size={17} /> },
    { k: 'cotizaciones',  label: 'Cotizaciones',   icon: <Icon.Inbox size={17} /> },
    { k: 'eventos',       label: 'Eventos',        icon: <Icon.Calendar size={17} /> },
    { k: 'proveedores',   label: 'Proveedores',    icon: <Icon.Users size={17} /> },
    { k: 'finanzas',      label: 'Finanzas',       icon: <Icon.Wallet size={17} /> },
    { k: 'analytics',     label: 'Reportes',       icon: <Icon.ChartBar size={17} /> },
  ];
  return (
    <aside className="glass-frost" style={{
      width: 240, padding: '24px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
      borderRight: '1px solid var(--border)',
      position: 'sticky', top: 0, alignSelf: 'start',
      height: '100vh',
    }}>
      <div style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="logo-mark">I</span>
        <span className="logo-text">INARI<br/><span className="sub">GROUP</span></span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 12px 6px' }}>General</div>
        {nav.map(n => {
          const isActive = n.k === active;
          return (
            <a key={n.k} href="#" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 14, fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              background: isActive ? 'rgba(232,87,42,0.08)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              paddingLeft: 14,
              transition: 'background 180ms, color 180ms',
            }}>
              <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>{n.icon}</span>
              {n.label}
              {n.k === 'cotizaciones' && (
                <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", background: 'var(--accent)', color: '#fff', padding: '2px 6px', borderRadius: 6 }}>3</span>
              )}
            </a>
          );
        })}

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '20px 12px 6px' }}>Cuenta</div>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none' }}>
          <Icon.Settings size={17} /> Ajustes
        </a>
      </div>

      {/* User card */}
      <div className="glass" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(145deg, #1A1714, #3a3530)',
          color: '#F2EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600,
        }}>VC</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Valeria Castro</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Coordinadora</div>
        </div>
        <button className="btn-ghost btn btn-sm" style={{ padding: 6, color: 'var(--text-muted)' }}>
          <Icon.Logout size={15} />
        </button>
      </div>
    </aside>
  );
}

function StatCard({ label, value, suffix, icon, accent }) {
  return (
    <div className="glass card-hover" style={{ padding: 24, position: 'relative', minHeight: 132 }}>
      <div style={{
        position: 'absolute', top: 18, right: 18,
        width: 38, height: 38, borderRadius: 10,
        background: accent ? 'rgba(232,87,42,0.10)' : 'rgba(26,23,20,0.05)',
        color: accent ? 'var(--accent)' : 'var(--text-secondary)',
        border: '1px solid ' + (accent ? 'rgba(232,87,42,0.18)' : 'var(--border)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="font-display" style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</span>
        {suffix && <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Dashboard() {
  const rows = [
    { id: 'INR-2847', client: 'Sofía & Mateo',     type: 'Boda',          guests: 120, date: '14 Jun 2026', amount: 'S/ 48,200', status: 'En revisión',   sBadge: 'badge-warning' },
    { id: 'INR-2846', client: 'Banco Continental', type: 'Corporativo',   guests: 280, date: '02 Jun 2026', amount: 'S/ 96,500', status: 'Confirmado',    sBadge: 'badge-success' },
    { id: 'INR-2845', client: 'Camila Rodríguez',  type: 'Quinceañera',   guests:  90, date: '28 May 2026', amount: 'S/ 28,400', status: 'Confirmado',    sBadge: 'badge-success' },
    { id: 'INR-2844', client: 'Estudio Lúa',       type: 'Lanzamiento',   guests: 150, date: '24 May 2026', amount: 'S/ 36,900', status: 'En revisión',   sBadge: 'badge-warning' },
    { id: 'INR-2843', client: 'Familia Ortiz',     type: 'Boda',          guests:  80, date: '17 May 2026', amount: 'S/ 32,150', status: 'Borrador',      sBadge: '' },
    { id: 'INR-2842', client: 'Lima Tech 2026',    type: 'Corporativo',   guests: 420, date: '10 May 2026', amount: 'S/ 124,000',status: 'Confirmado',    sBadge: 'badge-success' },
  ];

  return (
    <div className="mesh" style={{ display: 'flex', minHeight: '100%', width: '100%' }}>
      <span className="mesh-blob"/>
      <Sidebar active="cotizaciones" />
      <main style={{ flex: 1, padding: '40px 48px', minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
              Lunes · 4 Mayo 2026
            </div>
            <h1 className="font-display" style={{ fontSize: 44, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
              Hola, Valeria.
            </h1>
            <p style={{ marginTop: 10, fontSize: 15, color: 'var(--text-secondary)' }}>
              Tienes <strong style={{ color: 'var(--text-primary)' }}>3 cotizaciones</strong> esperando tu revisión.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary"><Icon.Download size={15} /> Exportar</button>
            <button className="btn btn-primary"><Icon.Plus size={15} /> Nueva cotización</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total cotizaciones" value="247" icon={<Icon.Inbox size={18}/>} />
          <StatCard label="Completadas" value="184" suffix="/ 247" icon={<Icon.Check size={18}/>} />
          <StatCard label="Calidad promedio" value="9.1" suffix="/ 10" icon={<Icon.Star size={18}/>} accent />
          <StatCard label="Costo promedio" value="S/ 42k" icon={<Icon.Wallet size={18}/>} />
        </div>

        {/* Filters */}
        <div className="glass" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Icon.Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Buscar por cliente, ID o tipo de evento" style={{ paddingLeft: 36, background: 'rgba(255,255,255,0.7)' }}/>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Todas','Boda','Corporativo','Quinceañera','Otros'].map((t,i) => (
              <button key={t} className="btn btn-sm" style={{
                background: i===0 ? 'rgba(232,87,42,0.10)' : 'transparent',
                color: i===0 ? 'var(--accent)' : 'var(--text-secondary)',
                border: i===0 ? '1px solid rgba(232,87,42,0.20)' : '1px solid transparent',
                fontWeight: i===0 ? 600 : 500,
              }}>{t}</button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
            <Icon.Filter size={14} /> Filtros
          </button>
        </div>

        {/* Table */}
        <div className="glass" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '120px 1.4fr 1fr 100px 1fr 1fr 140px 40px',
            padding: '14px 22px',
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            borderBottom: '1px solid var(--border)',
          }}>
            <div>ID</div><div>Cliente</div><div>Tipo</div><div style={{ textAlign: 'right' }}>Aforo</div><div>Fecha</div><div style={{ textAlign: 'right' }}>Monto</div><div>Estado</div><div/>
          </div>
          {rows.map((r, i) => (
            <div key={r.id} className="row" style={{
              display: 'grid',
              gridTemplateColumns: '120px 1.4fr 1fr 100px 1fr 1fr 140px 40px',
              padding: '16px 22px',
              alignItems: 'center',
              fontSize: 14,
              background: i % 2 === 1 ? 'rgba(255,255,255,0.4)' : 'transparent',
              borderBottom: i === rows.length - 1 ? 'none' : '1px solid rgba(26,23,20,0.04)',
              transition: 'background 180ms',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,87,42,0.05)'; const a = e.currentTarget.querySelector('.row-arrow'); if (a) { a.style.opacity = 1; a.style.transform = 'translateX(2px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? 'rgba(255,255,255,0.4)' : 'transparent'; const a = e.currentTarget.querySelector('.row-arrow'); if (a) { a.style.opacity = 0; a.style.transform = 'translateX(0)'; } }}
            >
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.id}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(26,23,20,0.06)',
                  color: 'var(--text-primary)',
                  fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{r.client.split(' ').map(s => s[0]).slice(0,2).join('')}</div>
                <div style={{ fontWeight: 500 }}>{r.client}</div>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>{r.type}</div>
              <div className="font-mono" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{r.guests}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{r.date}</div>
              <div className="font-mono" style={{ textAlign: 'right', fontWeight: 600 }}>{r.amount}</div>
              <div><span className={'badge ' + r.sBadge}>{r.status}</span></div>
              <div className="row-arrow" style={{ color: 'var(--accent)', opacity: 0, transition: 'opacity 180ms, transform 180ms', display: 'flex', justifyContent: 'flex-end' }}>
                <Icon.Arrow size={15} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
          <div>Mostrando <strong>1–6</strong> de <strong>247</strong></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm">Anterior</button>
            <button className="btn btn-secondary btn-sm">Siguiente</button>
          </div>
        </div>
      </main>
    </div>
  );
}

window.IG_Dashboard = Dashboard;

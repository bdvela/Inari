/* ============================================================
   INARI GROUP — Quotation Result
   ============================================================ */

const Icon = window.IG_Icon;

function QualityRing({ score = 9.2 }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const pct = score / 10;
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="qg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8572A" />
            <stop offset="100%" stopColor="#FF9500" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(26,23,20,0.08)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r}
          fill="none" stroke="url(#qg)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="font-display" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>de 10</div>
      </div>
    </div>
  );
}

function ProposalCard({ tier, price, highlights, features, premium }) {
  return (
    <div className={'glass card-hover'} style={{
      padding: 32,
      position: 'relative',
      border: premium ? '1px solid rgba(232,87,42,0.30)' : '1px solid var(--border)',
      boxShadow: premium
        ? 'var(--inner-spec), 0 16px 48px rgba(232,87,42,0.14), 0 4px 12px rgba(232,87,42,0.08)'
        : 'var(--inner-spec), var(--shadow-glass)',
      background: premium ? 'rgba(255,255,255,0.78)' : 'var(--surface)',
    }}>
      {premium && (
        <div style={{
          position: 'absolute', top: -12, left: 24,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          background: 'linear-gradient(145deg, #E8572A, #C94A1F)',
          color: '#fff', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          borderRadius: 8, boxShadow: 'var(--shadow-accent)',
        }}>
          <Icon.Crown size={12} /> Premium
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 className="font-display" style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{tier}</h3>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{highlights}</span>
      </div>
      <div style={{ marginTop: 14, marginBottom: 22 }}>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>S/</span>
        <span className="font-display" style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{price}</span>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>todo incluido · IGV incluido</div>
      </div>
      <div className="divider" style={{ margin: '0 0 20px' }}/>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--text-primary)' }}>
            <span style={{
              flex: '0 0 18px', width: 18, height: 18, borderRadius: 99,
              background: premium ? 'var(--accent-light)' : 'rgba(26,23,20,0.06)',
              color: premium ? 'var(--accent)' : 'var(--text-secondary)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 2,
            }}>
              <Icon.Check size={11} />
            </span>
            <span style={{ lineHeight: 1.5 }}>{f}</span>
          </li>
        ))}
      </ul>
      <button className={premium ? 'btn btn-primary' : 'btn btn-secondary'} style={{ width: '100%', marginTop: 28 }}>
        Seleccionar {tier} <Icon.Arrow size={14} />
      </button>
    </div>
  );
}

function Result() {
  const providers = [
    { cat: 'Catering',     score: 9.4, price: 'S/ 18,500', note: 'Cocina peruana contemporánea · 4 estaciones' },
    { cat: 'Decoración',   score: 9.1, price: 'S/ 8,200',  note: 'Florales secos + iluminación cálida' },
    { cat: 'Fotografía',   score: 9.6, price: 'S/ 4,800',  note: 'Reportaje + 2 cámaras · video 6 min' },
    { cat: 'Música',       score: 8.9, price: 'S/ 7,500',  note: 'Banda 5 piezas + DJ post-cena' },
    { cat: 'Coordinación', score: 9.3, price: 'S/ 3,200',  note: 'Coordinador líder + 2 asistentes' },
    { cat: 'Locación',     score: 9.0, price: 'S/ 6,000',  note: 'Casa Hacienda · 12 horas exclusividad' },
  ];

  return (
    <div className="mesh" style={{ minHeight: '100%', width: '100%', padding: '32px 40px 64px' }}>
      <span className="mesh-blob"/>

      {/* Top header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-secondary btn-sm">← Volver</button>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>COTIZACIÓN #INR-2847</span>
          <span className="badge badge-success"><span style={{ width: 5, height: 5, borderRadius: 99, background: '#34C759' }}/>Lista para enviar</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm">Compartir</button>
          <button className="btn btn-secondary btn-sm">Editar</button>
          <button className="btn btn-primary btn-sm"><Icon.Download size={14} /> Descargar PDF</button>
        </div>
      </div>

      {/* Title row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 32 }}>
        <div className="glass-raised" style={{ padding: 32 }}>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 10 }}>
            BODA · 14 JUN 2026
          </div>
          <h1 className="font-display" style={{ fontSize: 44, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.02 }}>
            Sofía & Mateo
          </h1>
          <p style={{ marginTop: 8, fontSize: 15, color: 'var(--text-secondary)' }}>
            Casa Hacienda, Pachacámac · 120 invitados · estilo elegante relajado
          </p>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { l: 'Aforo',       v: '120',     m: 'invitados' },
              { l: 'Duración',    v: '8h',      m: '18:00 → 02:00' },
              { l: 'Proveedores', v: '6',       m: 'asignados' },
              { l: 'Total',       v: 'S/ 48.2k',m: 'IGV incluido', mono: true },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.l}</div>
                <div className={s.mono ? 'font-mono' : 'font-display'} style={{ fontSize: 22, fontWeight: 700, letterSpacing: s.mono ? '-0.01em' : '-0.02em' }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.m}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality ring card */}
        <div className="glass-raised" style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 24 }}>
          <QualityRing score={9.2} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score de calidad</div>
            <div className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginTop: 4 }}>
              Excelente match
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 14px', lineHeight: 1.5 }}>
              Promedio ponderado en 6 ejes de evaluación.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { l: 'Calidad', v: 9.4 }, { l: 'Estética', v: 9.0 }, { l: 'Logística', v: 9.1 },
              ].map(b => (
                <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 64 }}>{b.l}</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(26,23,20,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: (b.v * 10) + '%', height: '100%', background: 'linear-gradient(90deg, #E8572A, #FF9500)', borderRadius: 99 }}/>
                  </div>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', width: 28, textAlign: 'right' }}>{b.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two proposals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 36 }}>
        <ProposalCard
          tier="Básica"
          price="38,400"
          highlights="esencial · curado"
          features={[
            'Catering peruano contemporáneo · 4 estaciones',
            'Decoración floral seca + iluminación cálida',
            'Fotografía · 1 cámara, 4h cobertura',
            'DJ profesional con setlist personalizado',
            'Coordinación general el día del evento',
            'Locación 8h con exclusividad',
          ]}
        />
        <ProposalCard
          tier="Premium"
          price="48,200"
          highlights="todo + sello inari"
          premium
          features={[
            'Catering peruano contemporáneo · 6 estaciones + barra de autor',
            'Diseño floral en vivo + escenografía completa',
            'Fotografía + video · 2 cámaras, reportaje + film 6 min',
            'Banda en vivo de 5 piezas + DJ post-cena',
            'Coordinador líder + 2 asistentes durante todo el evento',
            'Locación 12h exclusiva + suite para los novios',
          ]}
        />
      </div>

      {/* Provider list (anonymized) */}
      <div className="glass" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Proveedores propuestos
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Los nombres se revelan al confirmar la propuesta.
            </p>
          </div>
          <span className="badge"><Icon.Lock size={11} /> Identidad protegida</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {providers.map((p, i) => (
            <div key={i} style={{
              padding: 16,
              background: 'rgba(255,255,255,0.55)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{p.cat}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                  <Icon.Star size={12} /> {p.score}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{p.note}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Subtotal</span>
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>{p.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
        <button className="btn btn-primary btn-lg" style={{ padding: '18px 40px', fontSize: 15 }}>
          <Icon.Download size={16} /> Descargar propuesta en PDF
        </button>
      </div>
    </div>
  );
}

window.IG_Result = Result;

/* ============================================================
   INARI GROUP — Landing
   ============================================================ */

const Icon = window.IG_Icon;

function Logo({ inverse = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className="logo-mark">I</span>
      <span className="logo-text" style={inverse ? { color: '#F2EFE9' } : {}}>
        INARI<br/><span className="sub" style={inverse ? { color: 'rgba(242,239,233,0.6)' } : {}}>GROUP</span>
      </span>
    </div>
  );
}

function Navbar() {
  const links = ['Servicios', 'Proceso', 'Tecnología', 'Contacto'];
  return (
    <header
      className="glass-frost"
      style={{
        position: 'sticky', top: 16, zIndex: 50,
        margin: '16px 24px 0',
        padding: '10px 14px 10px 18px',
        borderRadius: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'var(--inner-spec), 0 4px 20px rgba(26,23,20,0.05)',
      }}
    >
      <Logo />
      <nav style={{ display: 'flex', gap: 28 }}>
        {links.map(l => (
          <a key={l} href="#" style={{
            fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
            textDecoration: 'none', transition: 'color 180ms',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >{l}</a>
        ))}
      </nav>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm">Ingresar</button>
        <button className="btn btn-primary btn-sm">
          Cotizar <Icon.Arrow size={14} />
        </button>
      </div>
    </header>
  );
}

function HeroFloatingCard() {
  // a "live cotización" preview that renders the actual app UI
  return (
    <div
      className="glass-raised"
      style={{
        width: 420, padding: 18,
        transform: 'rotate(2.5deg)',
        boxShadow: 'var(--inner-spec), 0 30px 80px rgba(26,23,20,0.18), 0 8px 24px rgba(232,87,42,0.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="badge badge-accent"><span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--accent)', display: 'inline-block', boxShadow: '0 0 0 4px rgba(232,87,42,0.18)' }}/>Cotización en proceso</span>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>#INR-2847</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div className="font-display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.15, marginBottom: 4 }}>
          Boda · Sofía & Mateo
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          120 invitados · Casa Hacienda, Pachacámac
        </div>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14,
      }}>
        <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Calidad</div>
          <div className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>9.2<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>/10</span></div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
          <div className="font-mono" style={{ fontSize: 18, fontWeight: 600 }}>S/ 48,200</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Catering · Almendariz', pct: 100 },
          { label: 'Decoración · Estudio Lúa', pct: 100 },
          { label: 'Fotografía · seleccionando…', pct: 62 },
          { label: 'Música', pct: 28 },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>{row.label}</div>
              <div style={{ height: 4, borderRadius: 99, background: 'rgba(26,23,20,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: row.pct + '%',
                  background: row.pct === 100 ? 'var(--ok)' : 'linear-gradient(90deg, #E8572A, #FF9500)',
                  borderRadius: 99, transition: 'width 400ms',
                }}/>
              </div>
            </div>
            {row.pct === 100
              ? <Icon.Check size={14} style={{ color: 'var(--ok)' }} />
              : <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.pct}%</span>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section style={{ padding: '72px 64px 96px', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 40, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <span className="badge badge-accent"><Icon.Sparkles size={12} /> Plataforma con IA</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Lima · Perú</span>
          </div>
          <h1 className="font-display" style={{
            fontSize: 80, fontWeight: 800, lineHeight: 0.98,
            margin: 0, letterSpacing: '-0.035em',
          }}>
            Eventos<br/>
            <span className="text-gradient">inolvidables</span>,<br/>
            sin esfuerzo.
          </h1>
          <p style={{
            marginTop: 28, maxWidth: 480,
            fontSize: 18, lineHeight: 1.55, color: 'var(--text-secondary)',
          }}>
            Cotizamos, coordinamos y orquestamos cada detalle de tu evento — bodas, corporativos, quinceañeras —
            con una red curada de 43 proveedores en Lima.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
            <button className="btn btn-primary btn-lg">
              Cotizar mi evento <Icon.Arrow size={16} />
            </button>
            <button className="btn btn-secondary btn-lg">
              <Icon.Eye size={15} /> Ver demo en vivo
            </button>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 36, alignItems: 'center' }}>
            <div style={{ display: 'flex' }}>
              {['SM','JR','LP','VC'].map((i, k) => (
                <div key={k} style={{
                  width: 32, height: 32, borderRadius: 99,
                  background: ['#E8572A','#1A1714','#FF9500','#6E6E73'][k],
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                  border: '2px solid var(--bg)',
                  marginLeft: k === 0 ? 0 : -8,
                }}>{i}</div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>+500 eventos</strong> coordinados desde 2018
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: 540 }}>
          <div style={{ position: 'absolute', top: 20, left: 30, transform: 'rotate(-6deg)', opacity: 0.85 }}>
            <div className="glass" style={{ padding: 14, width: 220, boxShadow: 'var(--inner-spec), 0 20px 40px rgba(26,23,20,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.Heart size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirmado</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Boda · 14 Jun</div>
                </div>
              </div>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>S/ 48,200</div>
            </div>
          </div>
          <HeroFloatingCard />
          <div style={{ position: 'absolute', bottom: 30, right: 0, transform: 'rotate(-3deg)' }}>
            <div className="glass" style={{ padding: 14, width: 200, boxShadow: 'var(--inner-spec), 0 20px 40px rgba(26,23,20,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Icon.Sparkles size={14} style={{ color: 'var(--accent)' }} />
                <div style={{ fontSize: 12, fontWeight: 600 }}>IA en acción</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Comparando 12 catering según presupuesto y aforo…
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { value: '+500', label: 'eventos coordinados' },
    { value: '8',    label: 'años en Lima' },
    { value: '43',   label: 'proveedores curados' },
    { value: '6',    label: 'tipos de evento' },
  ];
  return (
    <section style={{ padding: '0 64px' }}>
      <div className="glass" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        padding: '28px 12px',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: '0 32px',
            borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div className="font-display" style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Services() {
  const items = [
    { icon: <Icon.Heart size={20} />,    title: 'Bodas',          desc: 'Desde la pedida hasta el último brindis. Curaduría completa.' },
    { icon: <Icon.Briefcase size={20}/>, title: 'Corporativos',   desc: 'Aniversarios, lanzamientos, fines de año. Logística sin fricción.' },
    { icon: <Icon.Cake size={20}/>,      title: 'Quinceañeras',   desc: 'Celebraciones modernas con sello familiar.' },
    { icon: <Icon.Music size={20}/>,     title: 'Producción',     desc: 'Audio, luces, escenario. Técnica de nivel internacional.' },
    { icon: <Icon.Users size={20}/>,     title: 'Sociales',       desc: 'Cumpleaños, bautizos, reuniones íntimas o de gran formato.' },
    { icon: <Icon.Building size={20}/>,  title: 'Lanzamientos',   desc: 'Marca, prensa y experiencia integradas en una sola noche.' },
  ];
  return (
    <section style={{ padding: '120px 64px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 48 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>— Servicios</div>
          <h2 className="font-display" style={{ fontSize: 52, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
            Seis formatos.<br/>Una sola obsesión.
          </h2>
        </div>
        <p style={{ maxWidth: 360, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          No vendemos paquetes. Diseñamos cada evento desde cero, apoyados por una red exclusiva de proveedores que hemos auditado año tras año.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {items.map((it, i) => (
          <div key={i} className="glass card-hover" style={{ padding: 28, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(232,87,42,0.10)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(232,87,42,0.18)',
              marginBottom: 24,
            }}>{it.icon}</div>
            <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{it.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0, flex: 1 }}>{it.desc}</p>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>
              Ver detalles <Icon.Arrow size={13} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhyUs() {
  const features = [
    { title: 'Red curada', desc: '43 proveedores auditados, no un marketplace abierto.' },
    { title: 'Precio justo', desc: 'Cotizamos al costo real, sin sobrecargos invisibles.' },
    { title: 'Coordinación 24/7', desc: 'Un único contacto desde la firma hasta el cierre.' },
    { title: 'Calidad medida', desc: 'Score de 1 a 10 en cada proveedor según 6 ejes.' },
  ];
  return (
    <section style={{ padding: '80px 64px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 56, alignItems: 'start' }}>
        <div style={{ position: 'sticky', top: 120 }}>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>— Por qué Inari</div>
          <h2 className="font-display" style={{ fontSize: 60, fontWeight: 800, margin: 0, letterSpacing: '-0.035em', lineHeight: 0.98 }}>
            La diferencia<br/>está en lo que <span className="text-gradient">no</span><br/>se ve.
          </h2>
          <p style={{ marginTop: 28, fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 440 }}>
            Cualquier agencia puede contratar un catering. Nosotros nos obsesionamos con los 1,200 detalles invisibles que hacen que un evento no se olvide.
          </p>
          <button className="btn btn-primary btn-lg" style={{ marginTop: 28 }}>
            Conocer al equipo <Icon.Arrow size={16} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} className="glass card-hover" style={{
              padding: 28,
              minHeight: 220,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              transform: i % 2 === 1 ? 'translateY(32px)' : 'none',
            }}>
              <div className="font-display" style={{ fontSize: 64, fontWeight: 800, color: 'rgba(232,87,42,0.16)', lineHeight: 1, letterSpacing: '-0.04em' }}>0{i+1}</div>
              <div>
                <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    { n: '01', title: 'Cuéntanos tu evento', desc: 'Una descripción libre — fecha, aforo, estilo. La IA estructura los datos.' },
    { n: '02', title: 'Cotización inteligente', desc: 'Comparamos 43 proveedores y generamos dos propuestas: básica y premium.' },
    { n: '03', title: 'Producción end-to-end', desc: 'Coordinamos cada proveedor, contrato y cronograma hasta el día del evento.' },
  ];
  return (
    <section style={{ padding: '80px 64px' }}>
      <div style={{ marginBottom: 56, maxWidth: 720 }}>
        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>— Proceso</div>
        <h2 className="font-display" style={{ fontSize: 56, fontWeight: 800, margin: 0, letterSpacing: '-0.035em', lineHeight: 1 }}>
          Tres pasos. Cero fricción.
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, position: 'relative' }}>
        {steps.map((s, i) => (
          <div key={i} className="glass card-hover" style={{ padding: 32, position: 'relative', overflow: 'hidden', minHeight: 240 }}>
            <div className="font-display" style={{
              position: 'absolute', right: 16, top: -8,
              fontSize: 140, fontWeight: 800,
              color: 'rgba(232,87,42,0.08)',
              lineHeight: 1, letterSpacing: '-0.06em',
              userSelect: 'none', pointerEvents: 'none',
            }}>{s.n}</div>
            <div style={{ position: 'relative' }}>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 16 }}>PASO {s.n}</div>
              <h3 className="font-display" style={{ fontSize: 26, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.02em', maxWidth: 220 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0, maxWidth: 280 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TechCallout() {
  return (
    <section style={{ padding: '80px 64px' }}>
      <div className="glass-raised" style={{
        position: 'relative',
        padding: '56px 56px',
        borderLeft: '3px solid var(--accent)',
        display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -120, top: -120, width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,87,42,0.16), rgba(232,87,42,0) 70%)',
          filter: 'blur(20px)', pointerEvents: 'none',
        }}/>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span className="badge badge-accent"><Icon.Cpu size={12} /> AI nativo</span>
          </div>
          <h2 className="font-display" style={{ fontSize: 44, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
            Tecnología que entiende cómo planificas un evento.
          </h2>
          <p style={{ marginTop: 20, fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 480 }}>
            Describes en una frase. El sistema extrae estructura, propone proveedores, calcula calidad y precio. Tú decides.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
            {['Parsing en lenguaje natural','Score de calidad multi-eje','Comparativa básica vs premium'].map(t => (
              <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-primary)' }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: 'var(--accent-light)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.Check size={11} />
                </span>{t}
              </div>
            ))}
          </div>
        </div>
        <div className="glass" style={{ padding: 18, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#FF3B30', opacity: 0.7 }}/>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#FF9500', opacity: 0.7 }}/>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#34C759', opacity: 0.7 }}/>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>{'>'} input</div>
          <div style={{ color: 'var(--text-primary)', marginBottom: 14 }}>"Boda 120 personas en Pachacámac, mediados de junio, presupuesto S/50k"</div>
          <div style={{ color: 'var(--text-muted)' }}>{'>'} parsed</div>
          <div style={{ color: 'var(--accent)' }}>type: <span style={{ color: 'var(--text-primary)' }}>boda</span></div>
          <div style={{ color: 'var(--accent)' }}>guests: <span style={{ color: 'var(--text-primary)' }}>120</span></div>
          <div style={{ color: 'var(--accent)' }}>venue: <span style={{ color: 'var(--text-primary)' }}>"Pachacámac"</span></div>
          <div style={{ color: 'var(--accent)' }}>budget: <span style={{ color: 'var(--text-primary)' }}>50000 PEN</span></div>
          <div style={{ color: 'var(--accent)' }}>date: <span style={{ color: 'var(--text-primary)' }}>2026-06-mid</span></div>
          <div style={{ color: 'var(--ok)', marginTop: 8 }}>✓ matched 14 proveedores</div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section style={{ padding: '120px 64px 80px', textAlign: 'center' }}>
      <h2 className="font-display" style={{
        fontSize: 88, fontWeight: 800, margin: '0 auto', letterSpacing: '-0.04em',
        lineHeight: 0.95, maxWidth: 920,
      }}>
        Tu próximo evento empieza con <span className="text-gradient">una frase</span>.
      </h2>
      <p style={{ marginTop: 32, fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
        Cotización gratuita en menos de 60 segundos. Sin compromiso, sin formulario interminable.
      </p>
      <button className="btn btn-primary btn-lg" style={{ marginTop: 36, padding: '18px 32px', fontSize: 16 }}>
        Empezar mi cotización <Icon.Arrow size={16} />
      </button>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: '0 64px 32px' }}>
      <div className="glass-frost" style={{
        padding: '24px 28px',
        borderRadius: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Logo />
          <div style={{ height: 28, width: 1, background: 'var(--border)' }}/>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <Icon.Pin size={12} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
            Av. La Paz 1075, Miraflores · Lima
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Servicios</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contacto</a>
          <span className="font-mono" style={{ color: 'var(--text-muted)' }}>© 2026</span>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="mesh" style={{ minHeight: '100%', width: '100%', paddingBottom: 16 }}>
      <span className="mesh-blob"/>
      <Navbar />
      <Hero />
      <StatsBar />
      <Services />
      <WhyUs />
      <Process />
      <TechCallout />
      <FinalCTA />
      <Footer />
    </div>
  );
}

window.IG_Landing = Landing;

import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Heart, Briefcase, Mic, Users,
  MapPin, Zap, CheckCircle,
  Sparkles, Eye, Crown, KeyRound,
} from 'lucide-react'

const SERVICES = [
  { icon: Heart,    title: 'Bodas',       desc: 'Desde la pedida hasta el último brindis. Curaduría completa.' },
  { icon: Briefcase,title: 'Corporativos',desc: 'Aniversarios, lanzamientos, fines de año. Logística sin fricción.' },
  { icon: Crown,    title: 'Quinceañeras',desc: 'Celebraciones modernas con sello familiar.' },
  { icon: Mic,      title: 'Producción',  desc: 'Audio, luces, escenario. Técnica de nivel internacional.' },
  { icon: Users,    title: 'Sociales',    desc: 'Cumpleaños, bautizos, reuniones íntimas o de gran formato.' },
  { icon: Briefcase,title: 'Lanzamientos',desc: 'Marca, prensa y experiencia integradas en una sola noche.' },
]

const WHY_US = [
  { title: 'Red curada',       desc: '43 proveedores auditados, no un marketplace abierto.' },
  { title: 'Precio justo',     desc: 'Cotizamos al costo real, sin sobrecargos invisibles.' },
  { title: 'Coordinación 24/7',desc: 'Un único contacto desde la firma hasta el cierre.' },
  { title: 'Calidad medida',   desc: 'Score de 1 a 10 en cada proveedor según 6 ejes.' },
]

const STATS = [
  { value: '+500', label: 'eventos coordinados' },
  { value: '8',    label: 'años en Lima' },
  { value: '43',   label: 'proveedores curados' },
  { value: '6',    label: 'tipos de evento' },
]

const PROCESS = [
  { n: '01', title: 'Cuéntanos tu evento',   desc: 'Una descripción libre — fecha, aforo, estilo. La IA estructura los datos.' },
  { n: '02', title: 'Cotización inteligente', desc: 'Comparamos 43 proveedores y generamos dos propuestas: básica y premium.' },
  { n: '03', title: 'Producción end-to-end',  desc: 'Coordinamos cada proveedor, contrato y cronograma hasta el día del evento.' },
]

const AVATARS = ['#E8572A', '#1A1714', '#FF9500', '#6E6E73']
const AVATAR_LABELS = ['SM', 'JR', 'LP', 'VC']

const NAV_LINKS = ['Servicios', 'Proceso', 'Tecnología', 'Contacto']

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="mesh" style={{ minHeight: '100vh', paddingBottom: 16 }}>
      <div className="mesh-blob" />

      {/* ── Navbar ── */}
      <header
        className="glass-frost"
        style={{
          position: 'sticky', top: 16, zIndex: 50,
          margin: '16px 24px 0',
          padding: '10px 14px 10px 18px',
          borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.85), 0 4px 20px rgba(26,23,20,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="logo-mark">I</span>
          <span style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 800,
            fontSize: 13, letterSpacing: '0.18em', lineHeight: 1.1,
          }}>
            INARI<br/><span style={{ color: '#6E6E73', fontWeight: 600 }}>GROUP</span>
          </span>
        </div>
        <nav style={{ display: 'flex', gap: 28 }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              fontSize: 14, fontWeight: 500, color: '#6E6E73',
              textDecoration: 'none', transition: 'color 180ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1D1D1F')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6E6E73')}
            >{l}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Ingresar</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/cotizar')}>
            Cotizar <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ padding: '72px 64px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <span className="badge badge-accent"><Sparkles size={12} /> Plataforma con IA</span>
              <span style={{ fontSize: 13, color: '#6E6E73' }}>Lima · Perú</span>
            </div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 80, fontWeight: 800,
              lineHeight: 0.98, margin: 0, letterSpacing: '-0.035em', color: '#1D1D1F',
            }}>
              Eventos<br/>
              <span className="text-gradient">inolvidables</span>,<br/>
              sin esfuerzo.
            </h1>
            <p style={{ marginTop: 28, maxWidth: 480, fontSize: 18, lineHeight: 1.55, color: '#6E6E73' }}>
              Cotizamos, coordinamos y orquestamos cada detalle de tu evento con una red curada de 43 proveedores en Lima.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/cotizar')}>
                Cotizar mi evento <ArrowRight size={16} />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
                <Eye size={15} /> Ver demo en vivo
              </button>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 36, alignItems: 'center' }}>
              <div style={{ display: 'flex' }}>
                {AVATARS.map((bg, k) => (
                  <div key={k} style={{
                    width: 32, height: 32, borderRadius: 99,
                    background: bg, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600,
                    border: '2px solid #F2EFE9',
                    marginLeft: k === 0 ? 0 : -8,
                  }}>
                    {AVATAR_LABELS[k]}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#6E6E73' }}>
                <strong style={{ color: '#1D1D1F' }}>+500 eventos</strong> coordinados desde 2018
              </div>
            </div>
          </div>

          {/* Hero floating cards */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: 540 }}>
            {/* Satellite card top-left */}
            <div style={{ position: 'absolute', top: 20, left: 0, transform: 'rotate(-6deg)', opacity: 0.9, zIndex: 1 }}>
              <div className="glass" style={{ padding: 14, width: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF0EB', color: '#E8572A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#AEAEB2', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Confirmado</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Boda · 14 Jun</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#6E6E73' }}>S/ 48,200</div>
              </div>
            </div>

            {/* Main floating card */}
            <div className="glass-raised" style={{
              width: 400, padding: 18,
              transform: 'rotate(2.5deg)', zIndex: 2,
              boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.85), 0 30px 80px rgba(26,23,20,0.18), 0 8px 24px rgba(232,87,42,0.10)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span className="badge badge-accent">
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: '#E8572A', boxShadow: '0 0 0 4px rgba(232,87,42,0.18)' }} />
                  Cotización en proceso
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#AEAEB2' }}>#INR-2847</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 700, lineHeight: 1.15, marginBottom: 4 }}>
                  Boda · Sofía & Mateo
                </div>
                <div style={{ fontSize: 13, color: '#6E6E73' }}>120 invitados · Casa Hacienda, Pachacámac</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { l: 'Calidad', v: '9.2', sub: '/10', isMono: false },
                  { l: 'Total',   v: 'S/ 48,200', sub: '', isMono: true },
                ].map(s => (
                  <div key={s.l} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(26,23,20,0.08)', borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 10, color: '#AEAEB2', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{s.l}</div>
                    <div style={{ fontFamily: s.isMono ? 'JetBrains Mono, monospace' : 'Cormorant Garamond, Georgia, serif', fontSize: s.isMono ? 16 : 22, fontWeight: 700, marginTop: 2 }}>
                      {s.v}{s.sub && <span style={{ fontSize: 12, color: '#AEAEB2', fontWeight: 500 }}>{s.sub}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {[
                { label: 'Catering · Almendariz', pct: 100 },
                { label: 'Decoración · Estudio Lúa', pct: 100 },
                { label: 'Fotografía · seleccionando…', pct: 62 },
                { label: 'Música', pct: 28 },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{row.label}</div>
                    <div style={{ height: 4, borderRadius: 99, background: 'rgba(26,23,20,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${row.pct}%`,
                        background: row.pct === 100 ? '#34C759' : 'linear-gradient(90deg, #E8572A, #FF9500)',
                        borderRadius: 99,
                      }} />
                    </div>
                  </div>
                  {row.pct === 100
                    ? <CheckCircle size={14} style={{ color: '#34C759', flexShrink: 0 }} />
                    : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#AEAEB2' }}>{row.pct}%</span>}
                </div>
              ))}
            </div>

            {/* Satellite card bottom-right */}
            <div style={{ position: 'absolute', bottom: 30, right: -10, transform: 'rotate(-3deg)', zIndex: 1 }}>
              <div className="glass" style={{ padding: 14, width: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Sparkles size={14} style={{ color: '#E8572A' }} />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>IA en acción</div>
                </div>
                <div style={{ fontSize: 11, color: '#6E6E73', lineHeight: 1.4 }}>
                  Comparando 12 catering según presupuesto y aforo…
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ padding: '0 64px' }}>
        <div className="glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '28px 12px' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '0 32px',
              borderLeft: i === 0 ? 'none' : '1px solid rgba(26,23,20,0.08)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: '#1D1D1F' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: '#6E6E73' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section id="servicios" style={{ padding: '120px 64px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <div style={{ fontSize: 12, color: '#E8572A', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 12 }}>— Servicios</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 52, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1, color: '#1D1D1F' }}>
              Seis formatos.<br/>Una sola obsesión.
            </h2>
          </div>
          <p style={{ maxWidth: 360, fontSize: 15, color: '#6E6E73', lineHeight: 1.55, margin: 0 }}>
            No vendemos paquetes. Diseñamos cada evento desde cero, apoyados por una red exclusiva de proveedores.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {SERVICES.map((s) => (
            <div key={s.title} className="glass card-hover" style={{ padding: 28, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(232,87,42,0.10)', color: '#E8572A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(232,87,42,0.18)',
                marginBottom: 24, flexShrink: 0,
              }}>
                <s.icon size={20} />
              </div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 24, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 14, color: '#6E6E73', lineHeight: 1.55, margin: 0, flex: 1 }}>{s.desc}</p>
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#E8572A' }}>
                Ver detalles <ArrowRight size={13} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why us ── */}
      <section id="nosotros" style={{ padding: '80px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 56, alignItems: 'start' }}>
          <div style={{ position: 'sticky', top: 120 }}>
            <div style={{ fontSize: 12, color: '#E8572A', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 14 }}>— Por qué Inari</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 60, fontWeight: 800, margin: 0, letterSpacing: '-0.035em', lineHeight: 0.98, color: '#1D1D1F' }}>
              La diferencia<br/>está en lo que <span className="text-gradient">no</span><br/>se ve.
            </h2>
            <p style={{ marginTop: 28, fontSize: 16, color: '#6E6E73', lineHeight: 1.6, maxWidth: 440 }}>
              Cualquier agencia puede contratar un catering. Nosotros nos obsesionamos con los 1,200 detalles invisibles que hacen que un evento no se olvide.
            </p>
            <button className="btn btn-primary btn-lg" style={{ marginTop: 28 }} onClick={() => navigate('/cotizar')}>
              Conocer al equipo <ArrowRight size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {WHY_US.map((f, i) => (
              <div key={f.title} className="glass card-hover" style={{
                padding: 28, minHeight: 220,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transform: i % 2 === 1 ? 'translateY(32px)' : 'none',
              }}>
                <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 64, fontWeight: 800, color: 'rgba(232,87,42,0.16)', lineHeight: 1, letterSpacing: '-0.04em' }}>
                  0{i + 1}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#6E6E73', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section id="proceso" style={{ padding: '80px 64px' }}>
        <div style={{ marginBottom: 56, maxWidth: 720 }}>
          <div style={{ fontSize: 12, color: '#E8572A', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 14 }}>— Proceso</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 56, fontWeight: 800, margin: 0, letterSpacing: '-0.035em', lineHeight: 1, color: '#1D1D1F' }}>
            Tres pasos. Cero fricción.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {PROCESS.map((p) => (
            <div key={p.n} className="glass card-hover" style={{ padding: 32, position: 'relative', overflow: 'hidden', minHeight: 240 }}>
              <div style={{
                position: 'absolute', right: 16, top: -8,
                fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 140, fontWeight: 800,
                color: 'rgba(232,87,42,0.08)', lineHeight: 1, letterSpacing: '-0.06em',
                userSelect: 'none' as const, pointerEvents: 'none' as const,
              }}>
                {p.n}
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#E8572A', letterSpacing: '0.1em', marginBottom: 16 }}>
                  PASO {p.n}
                </div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 26, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.02em', maxWidth: 220, color: '#1D1D1F' }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: 14, color: '#6E6E73', lineHeight: 1.55, margin: 0, maxWidth: 280 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech callout ── */}
      <section id="tecnologia" style={{ padding: '80px 64px' }}>
        <div className="glass-raised" style={{
          position: 'relative', padding: '56px 56px',
          borderLeft: '3px solid #E8572A',
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -120, top: -120,
            width: 360, height: 360, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,87,42,0.16), rgba(232,87,42,0) 70%)',
            filter: 'blur(20px)', pointerEvents: 'none' as const,
          }} />
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span className="badge badge-accent"><Zap size={12} /> AI nativo</span>
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 44, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.05, color: '#1D1D1F' }}>
              Tecnología que entiende cómo planificas un evento.
            </h2>
            <p style={{ marginTop: 20, fontSize: 16, color: '#6E6E73', lineHeight: 1.6, maxWidth: 480 }}>
              Describes en una frase. El sistema extrae estructura, propone proveedores, calcula calidad y precio. Tú decides.
            </p>
            <div style={{ display: 'flex', gap: 20, marginTop: 28, flexWrap: 'wrap' as const }}>
              {['Parsing en lenguaje natural', 'Score de calidad multi-eje', 'Comparativa básica vs premium'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 99,
                    background: '#FEF0EB', color: '#E8572A',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CheckCircle size={11} />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="glass" style={{ padding: 18, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: '#FF3B30', opacity: 0.7 }} />
              <span style={{ width: 10, height: 10, borderRadius: 99, background: '#FF9500', opacity: 0.7 }} />
              <span style={{ width: 10, height: 10, borderRadius: 99, background: '#34C759', opacity: 0.7 }} />
            </div>
            <div style={{ color: '#AEAEB2' }}>&gt; input</div>
            <div style={{ color: '#1D1D1F', marginBottom: 14 }}>"Boda 120 personas en Pachacámac, mediados de junio, presupuesto S/50k"</div>
            <div style={{ color: '#AEAEB2' }}>&gt; parsed</div>
            <div style={{ color: '#E8572A' }}>type: <span style={{ color: '#1D1D1F' }}>boda</span></div>
            <div style={{ color: '#E8572A' }}>guests: <span style={{ color: '#1D1D1F' }}>120</span></div>
            <div style={{ color: '#E8572A' }}>budget: <span style={{ color: '#1D1D1F' }}>50000 PEN</span></div>
            <div style={{ color: '#34C759', marginTop: 8 }}>✓ matched 14 proveedores</div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '120px 64px 80px', textAlign: 'center' as const }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 88, fontWeight: 800, margin: '0 auto', letterSpacing: '-0.04em', lineHeight: 0.95, maxWidth: 920, color: '#1D1D1F' }}>
          Tu próximo evento empieza con <span className="text-gradient">una frase</span>.
        </h2>
        <p style={{ marginTop: 32, fontSize: 18, color: '#6E6E73', maxWidth: 560, margin: '32px auto 0' }}>
          Cotización gratuita en menos de 60 segundos. Sin compromiso, sin formulario interminable.
        </p>
        <button className="btn btn-primary btn-lg" style={{ marginTop: 36, padding: '18px 32px', fontSize: 16 }} onClick={() => navigate('/cotizar')}>
          Empezar mi cotización <ArrowRight size={16} />
        </button>
      </section>

      {/* ── Demo credentials ── */}
      <section style={{ padding: '0 64px 40px' }}>
        <div className="glass-raised" style={{ padding: '36px 40px', borderRadius: 20, borderLeft: '3px solid #E8572A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#FEF0EB', color: '#E8572A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <KeyRound size={18} />
            </div>
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1D1D1F' }}>
                Explora la plataforma
              </div>
              <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 1 }}>
                Acceso de prueba — tres roles disponibles
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, margin: '24px 0 24px' }}>
            {[
              { rol: 'Admin',     email: 'admin@inari.pe',     pass: 'admin123',  desc: 'Configura proveedores y reglas' },
              { rol: 'Ejecutivo', email: 'ejecutivo@inari.pe', pass: 'exec123',   desc: 'Genera y gestiona cotizaciones' },
              { rol: 'Cliente',   email: 'cliente@inari.pe',   pass: 'demo123',   desc: 'Solicita y revisa propuestas' },
            ].map(u => (
              <div key={u.rol} className="glass" style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 11, color: '#E8572A', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.10em', marginBottom: 8 }}>{u.rol}</div>
                <div style={{ fontSize: 12, color: '#6E6E73', marginBottom: 10, lineHeight: 1.4 }}>{u.desc}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#1D1D1F', marginBottom: 2 }}>{u.email}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#AEAEB2' }}>{u.pass}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
            Ingresar a la plataforma <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '0 64px 32px' }}>
        <div className="glass-frost" style={{
          padding: '24px 28px', borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="logo-mark" style={{ width: 32, height: 32, fontSize: 16 }}>I</span>
              <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.18em' }}>
                INARI<br/><span style={{ color: '#6E6E73', fontWeight: 600 }}>GROUP</span>
              </span>
            </div>
            <div style={{ height: 28, width: 1, background: 'rgba(26,23,20,0.08)' }} />
            <div style={{ fontSize: 13, color: '#6E6E73' }}>
              <MapPin size={12} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
              Av. La Paz 1075, Miraflores · Lima
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#6E6E73', flexWrap: 'wrap' as const }}>
            <a href="#servicios" style={{ color: 'inherit', textDecoration: 'none' }}>Servicios</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contacto</a>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#AEAEB2' }}>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

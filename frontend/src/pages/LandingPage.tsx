import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Heart, Briefcase, Mic, Users,
  MapPin, Zap, CheckCircle, Sparkles, Crown, Play,
} from 'lucide-react'

/* ── Data ─────────────────────────────────────────────── */
const SERVICES = [
  { icon: Heart,     title: 'Bodas',        desc: 'Desde la pedida hasta el último brindis. Curaduría completa.', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80' },
  { icon: Briefcase, title: 'Corporativos',  desc: 'Aniversarios, lanzamientos, fines de año. Logística sin fricción.', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80' },
  { icon: Crown,     title: 'Quinceañeras',  desc: 'Celebraciones modernas con sello familiar.', img: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80' },
  { icon: Mic,       title: 'Producción',    desc: 'Audio, luces, escenario. Técnica de nivel internacional.', img: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80' },
  { icon: Users,     title: 'Sociales',      desc: 'Cumpleaños, bautizos, reuniones íntimas o de gran formato.', img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80' },
  { icon: Briefcase, title: 'Lanzamientos',  desc: 'Marca, prensa y experiencia integradas en una sola noche.', img: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&q=80' },
]

const GALLERY = [
  { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=85', span: 'col-span-2 row-span-2', h: 480 },
  { src: 'https://images.unsplash.com/photo-1578874691223-64558a3ca096?w=600&q=85', span: 'col-span-1 row-span-1', h: 228 },
  { src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=85', span: 'col-span-1 row-span-1', h: 228 },
  { src: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=85', span: 'col-span-1 row-span-1', h: 228 },
  { src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=85', span: 'col-span-1 row-span-1', h: 228 },
]

const STATS = [
  { value: 500, suffix: '+', label: 'eventos coordinados' },
  { value: 8,   suffix: '',  label: 'años en Lima' },
  { value: 43,  suffix: '',  label: 'proveedores curados' },
  { value: 98,  suffix: '%', label: 'clientes satisfechos' },
]

const PROCESS = [
  { n: '01', title: 'Cuéntanos tu evento',    desc: 'Una descripción libre — fecha, aforo, estilo. La IA estructura los datos en segundos.' },
  { n: '02', title: 'Cotización inteligente',  desc: 'Comparamos 43 proveedores y generamos dos propuestas: básica y premium con precios reales.' },
  { n: '03', title: 'Producción end-to-end',   desc: 'Coordinamos cada proveedor, contrato y cronograma hasta el día del evento.' },
]

const NAV_LINKS = ['Servicios', 'Galería', 'Proceso', 'Tecnología']
const AVATARS = ['#E8572A', '#1A1714', '#FF9500', '#6E6E73']
const AVATAR_LABELS = ['SM', 'JR', 'LP', 'VC']

/* ── Hooks ─────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0.12 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

function useCountUp(target: number, triggered: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!triggered) return
    const duration = 1600
    const startTime = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [triggered, target])
  return count
}

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [triggered, setTriggered] = useState(false)
  const count = useCountUp(value, triggered)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTriggered(true); obs.disconnect() } }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ padding: '0 32px', borderLeft: '1px solid rgba(26,23,20,0.08)' }}>
      <div className="stat-value" style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '0.02em', color: '#1D1D1F' }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 6 }}>{label}</div>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate()
  useReveal()

  return (
    <div className="mesh" style={{ minHeight: '100vh', paddingBottom: 16 }}>
      <div className="mesh-blob" />

      {/* ── Navbar ── */}
      <header className="glass-frost" style={{
        position: 'sticky', top: 16, zIndex: 50,
        margin: '16px 24px 0', padding: '10px 14px 10px 18px', borderRadius: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.85), 0 4px 20px rgba(26,23,20,0.05)',
      }}>
        <img src="/logo.png" alt="INARI GROUP SAC" style={{ height: 52, width: 'auto' }} />
        <nav style={{ display: 'flex', gap: 28 }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 14, fontWeight: 500, color: '#6E6E73', textDecoration: 'none', transition: 'color 180ms' }}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems: 'center' }}>

          {/* Left */}
          <div>
            <div className="reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <span className="badge badge-accent"><Sparkles size={12} /> Plataforma con IA</span>
              <span style={{ fontSize: 13, color: '#6E6E73' }}>Lima · Perú</span>
            </div>
            <h1 className="reveal reveal-d1" style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 80, fontWeight: 800, lineHeight: 0.98, margin: 0, letterSpacing: '0.02em', color: '#1D1D1F' }}>
              Eventos<br/>
              <span className="text-gradient">inolvidables</span>,<br/>
              sin esfuerzo.
            </h1>
            <p className="reveal reveal-d2" style={{ marginTop: 28, maxWidth: 480, fontSize: 18, lineHeight: 1.55, color: '#6E6E73' }}>
              Cotizamos, coordinamos y orquestamos cada detalle de tu evento con una red curada de 43 proveedores en Lima.
            </p>
            <div className="reveal reveal-d3" style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/cotizar')}>
                Cotizar mi evento <ArrowRight size={16} />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
                <Play size={15} /> Ver demo
              </button>
            </div>
            <div className="reveal reveal-d4" style={{ display: 'flex', gap: 24, marginTop: 36, alignItems: 'center' }}>
              <div style={{ display: 'flex' }}>
                {AVATARS.map((bg, k) => (
                  <div key={k} style={{ width: 32, height: 32, borderRadius: 99, background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, border: '2px solid #F2EFE9', marginLeft: k === 0 ? 0 : -8 }}>
                    {AVATAR_LABELS[k]}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#6E6E73' }}>
                <strong style={{ color: '#1D1D1F' }}>+500 eventos</strong> coordinados desde 2018
              </div>
            </div>
          </div>

          {/* Right — hero visual with real photo + animated cards */}
          <div style={{ position: 'relative', minHeight: 560 }}>

            {/* Background photo */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 100px rgba(26,23,20,0.18)' }}>
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=85"
                alt="Evento elegante"
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)', transition: 'transform 8s ease' }}
                onLoad={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(26,23,20,0.35) 0%, rgba(26,23,20,0.05) 60%)' }} />
            </div>

            {/* Floating card — top left */}
            <div className="float-a" style={{ position: 'absolute', top: 24, left: -32, zIndex: 10 }}>
              <div className="glass" style={{ padding: 14, width: 200, backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF0EB', color: '#E8572A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirmado</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Boda · 14 Jun</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#E8572A' }}>S/ 48,200</div>
              </div>
            </div>

            {/* Floating card — main */}
            <div className="float-main" style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%) rotate(2.5deg)', zIndex: 10, width: 320 }}>
              <div className="glass-raised" style={{ padding: 18, backdropFilter: 'blur(24px)', boxShadow: '0 24px 60px rgba(26,23,20,0.22)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="badge badge-accent" style={{ fontSize: 11 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: '#E8572A', animation: 'pulseSoft 1.6s ease-in-out infinite' }} />
                    &nbsp;Cotización activa
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#AEAEB2' }}>#INR-2847</span>
                </div>
                <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Sofía & Mateo · 120 invitados</div>
                <div style={{ fontSize: 12, color: '#6E6E73', marginBottom: 12 }}>Casa Hacienda, Pachacámac</div>
                {[
                  { label: 'Catering', pct: 100 },
                  { label: 'Decoración', pct: 100 },
                  { label: 'Fotografía', pct: 72 },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 12, color: '#6E6E73', width: 80, flexShrink: 0 }}>{row.label}</div>
                    <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(26,23,20,0.07)' }}>
                      <div style={{ width: `${row.pct}%`, height: '100%', borderRadius: 99, background: row.pct === 100 ? '#34C759' : 'linear-gradient(90deg,#E8572A,#FF9500)', transition: 'width 1s ease' }} />
                    </div>
                    {row.pct === 100 ? <CheckCircle size={12} style={{ color: '#34C759', flexShrink: 0 }} /> : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#AEAEB2' }}>{row.pct}%</span>}
                  </div>
                ))}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(26,23,20,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#6E6E73' }}>Total premium</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1D1D1F' }}>S/ 48,200</span>
                </div>
              </div>
            </div>

            {/* Floating card — bottom right */}
            <div className="float-b" style={{ position: 'absolute', top: 40, right: -20, zIndex: 10 }}>
              <div className="glass" style={{ padding: 14, width: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Sparkles size={14} style={{ color: '#E8572A' }} />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>IA activa</div>
                </div>
                <div style={{ fontSize: 11, color: '#6E6E73', lineHeight: 1.5 }}>
                  Comparando 12 caterings según presupuesto…
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: '0 64px 80px' }}>
        <div className="glass reveal" style={{ display: 'grid', gridTemplateColumns: `repeat(${STATS.length}, 1fr)`, padding: '32px 8px' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ borderLeft: i === 0 ? 'none' : undefined }}>
              <StatCard {...s} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="galería" style={{ padding: '40px 64px 80px' }}>
        <div className="reveal" style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: '#E8572A', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>— Galería</div>
          <h2 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 52, fontWeight: 800, margin: 0, letterSpacing: '0.02em', lineHeight: 1, color: '#1D1D1F' }}>
            Eventos que<br/>hemos hecho realidad.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 228px)', gap: 14 }}>
          {/* Large image — first */}
          <div className="gallery-item reveal" style={{ gridColumn: 'span 2', gridRow: 'span 2', height: 480 }}>
            <img src={GALLERY[0].src} alt="Evento" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {/* Smaller images */}
          {GALLERY.slice(1).map((g, i) => (
            <div key={i} className={`gallery-item reveal reveal-d${i + 1}`} style={{ height: 228 }}>
              <img src={g.src} alt="Evento" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
        <div className="reveal" style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/cotizar')}>
            Ver todos los eventos <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="servicios" style={{ padding: '40px 64px 80px' }}>
        <div className="reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <div style={{ fontSize: 12, color: '#E8572A', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>— Servicios</div>
            <h2 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 52, fontWeight: 800, margin: 0, letterSpacing: '0.02em', lineHeight: 1, color: '#1D1D1F' }}>
              Seis formatos.<br/>Una sola obsesión.
            </h2>
          </div>
          <p style={{ maxWidth: 360, fontSize: 15, color: '#6E6E73', lineHeight: 1.55, margin: 0 }}>
            No vendemos paquetes. Diseñamos cada evento desde cero, apoyados por una red exclusiva de proveedores.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {SERVICES.map((s, i) => (
            <div key={s.title} className={`reveal reveal-d${(i % 3) + 1}`} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', minHeight: 280, cursor: 'pointer' }}
              onMouseEnter={e => { const img = e.currentTarget.querySelector('img'); if (img) (img as HTMLImageElement).style.transform = 'scale(1.06)' }}
              onMouseLeave={e => { const img = e.currentTarget.querySelector('img'); if (img) (img as HTMLImageElement).style.transform = 'scale(1.0)' }}
            >
              <img src={s.img} alt={s.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,23,20,0.85) 0%, rgba(26,23,20,0.2) 50%, transparent 100%)' }} />
              <div style={{ position: 'relative', padding: 28, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid rgba(255,255,255,0.2)' }}>
                  <s.icon size={18} />
                </div>
                <h3 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Process ── */}
      <section id="proceso" style={{ padding: '40px 64px 80px' }}>
        <div className="reveal" style={{ marginBottom: 56, maxWidth: 720 }}>
          <div style={{ fontSize: 12, color: '#E8572A', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>— Proceso</div>
          <h2 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 56, fontWeight: 800, margin: 0, letterSpacing: '0.02em', lineHeight: 1, color: '#1D1D1F' }}>
            Tres pasos. Cero fricción.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {PROCESS.map((p, i) => (
            <div key={p.n} className={`glass card-hover reveal reveal-d${i + 1}`} style={{ padding: 32, position: 'relative', overflow: 'hidden', minHeight: 240 }}>
              <div style={{ position: 'absolute', right: 16, top: -8, fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 140, fontWeight: 800, color: 'rgba(232,87,42,0.07)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
                {p.n}
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#E8572A', letterSpacing: '0.1em', marginBottom: 16 }}>PASO {p.n}</div>
                <h3 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 26, fontWeight: 700, margin: '0 0 12px', letterSpacing: '0.02em', maxWidth: 220, color: '#1D1D1F' }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: '#6E6E73', lineHeight: 1.55, margin: 0, maxWidth: 280 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech callout ── */}
      <section id="tecnología" style={{ padding: '40px 64px 80px' }}>
        <div className="glass-raised reveal" style={{ position: 'relative', padding: '56px 56px', borderLeft: '3px solid #E8572A', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -120, top: -120, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,87,42,0.14), transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span className="badge badge-accent"><Zap size={12} /> AI nativo</span>
            </div>
            <h2 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 44, fontWeight: 800, margin: 0, letterSpacing: '0.02em', lineHeight: 1.05, color: '#1D1D1F' }}>
              Tecnología que entiende cómo planificas un evento.
            </h2>
            <p style={{ marginTop: 20, fontSize: 16, color: '#6E6E73', lineHeight: 1.6, maxWidth: 480 }}>
              Describes en una frase. El sistema extrae estructura, propone proveedores, calcula calidad y precio. Tú decides.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
              {['Parsing en lenguaje natural', 'Score de calidad multi-eje', 'Comparativa básica vs premium', 'Optimización algorítmica de presupuesto'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 99, background: '#FEF0EB', color: '#E8572A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={12} />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="glass" style={{ padding: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.8, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {['#FF3B30','#FF9500','#34C759'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: 99, background: c, opacity: 0.8 }} />)}
            </div>
            <div style={{ color: '#AEAEB2' }}>&gt; input</div>
            <div style={{ color: '#1D1D1F', marginBottom: 14, lineHeight: 1.5 }}>"Boda 120 personas Pachacámac,<br/>junio, presupuesto S/50k"</div>
            <div style={{ color: '#AEAEB2' }}>&gt; parsed</div>
            <div><span style={{ color: '#E8572A' }}>type:</span> <span style={{ color: '#1D1D1F' }}>boda</span></div>
            <div><span style={{ color: '#E8572A' }}>guests:</span> <span style={{ color: '#1D1D1F' }}>120</span></div>
            <div><span style={{ color: '#E8572A' }}>budget:</span> <span style={{ color: '#1D1D1F' }}>50000 PEN</span></div>
            <div style={{ color: '#34C759', marginTop: 10, fontWeight: 600 }}>✓ 14 proveedores matched</div>
            <div style={{ color: '#34C759' }}>✓ 2 propuestas generadas en 2.1s</div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '80px 64px 80px', textAlign: 'center' }}>
        <div className="reveal">
          <h2 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 88, fontWeight: 800, margin: '0 auto', letterSpacing: '0.02em', lineHeight: 0.95, maxWidth: 920, color: '#1D1D1F' }}>
            Tu próximo evento empieza con <span className="text-gradient">una frase</span>.
          </h2>
          <p style={{ marginTop: 32, fontSize: 18, color: '#6E6E73', maxWidth: 520, margin: '32px auto 0' }}>
            Cotización gratuita en menos de 60 segundos. Sin compromiso, sin formulario interminable.
          </p>
          <button className="btn btn-primary btn-lg" style={{ marginTop: 40, padding: '18px 40px', fontSize: 16 }} onClick={() => navigate('/cotizar')}>
            Empezar mi cotización gratis <ArrowRight size={16} />
          </button>
          <div style={{ marginTop: 16, fontSize: 13, color: '#AEAEB2' }}>Sin tarjeta de crédito · Sin registro previo</div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '0 64px 32px' }}>
        <div className="glass-frost" style={{ padding: '24px 28px', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <img src="/logo.png" alt="INARI GROUP SAC" style={{ height: 56, width: 'auto' }} />
            <div style={{ height: 28, width: 1, background: 'rgba(26,23,20,0.08)' }} />
            <div style={{ fontSize: 13, color: '#6E6E73' }}>
              <MapPin size={12} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6 }} />
              Av. La Paz 1075, Miraflores · Lima
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#6E6E73', flexWrap: 'wrap' }}>
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

import { useNavigate } from 'react-router-dom'
import {
  Star, ArrowRight, CheckCircle, Heart, Briefcase,
  Cake, Mic, Users, Award, MapPin, Zap, Shield,
  Calendar, ChevronRight, Crown,
} from 'lucide-react'

const SERVICES = [
  {
    icon: Heart,
    title: 'Bodas',
    desc: 'Ceremonias civiles y religiosas, recepción, decoración floral, catering y fotografía. Cada detalle cuidado para el día más especial.',
    color: 'bg-rose-50 text-rose-500',
  },
  {
    icon: Briefcase,
    title: 'Eventos Corporativos',
    desc: 'Lanzamientos de producto, cenas de gala, team building y conferencias. Imagen profesional que eleva tu marca.',
    color: 'bg-blue-50 text-blue-500',
  },
  {
    icon: Crown,
    title: 'Quinceañeras',
    desc: 'Celebraciones únicas con vals, decoración temática, iluminación profesional y momentos que perduran toda la vida.',
    color: 'bg-purple-50 text-purple-500',
  },
  {
    icon: Mic,
    title: 'Conferencias & Congresos',
    desc: 'Gestión de ponentes, equipos audiovisuales, ambientación y logística integral para eventos de alto impacto.',
    color: 'bg-indigo-50 text-indigo-500',
  },
  {
    icon: Cake,
    title: 'Cumpleaños',
    desc: 'Desde íntimas reuniones familiares hasta grandes celebraciones. Temáticas personalizadas para toda la familia.',
    color: 'bg-amber-50 text-amber-500',
  },
  {
    icon: Users,
    title: 'Eventos Sociales',
    desc: 'Reuniones privadas, aniversarios, graduaciones y todo tipo de celebración que merece ser recordada.',
    color: 'bg-emerald-50 text-emerald-500',
  },
]

const WHY_US = [
  {
    icon: Award,
    title: 'Experiencia comprobada',
    desc: 'Más de 8 años organizando eventos en Lima y provincias. Más de 500 eventos exitosos respaldan nuestro trabajo.',
  },
  {
    icon: Users,
    title: 'Equipo especializado',
    desc: 'Coordinadores, diseñadores y proveedores cuidadosamente seleccionados para garantizar la calidad en cada detalle.',
  },
  {
    icon: Shield,
    title: 'Transparencia total',
    desc: 'Propuestas detalladas con costos claros desde el primer contacto. Sin sorpresas ni cobros ocultos.',
  },
  {
    icon: MapPin,
    title: 'Lima y provincias',
    desc: 'Operamos en todo el Perú. Red de proveedores en Lima Metropolitana, Cusco, Arequipa y más ciudades.',
  },
]

const STATS = [
  { value: '+500', label: 'Eventos realizados' },
  { value: '8+', label: 'Años de experiencia' },
  { value: '43', label: 'Proveedores premium' },
  { value: '6', label: 'Tipos de evento' },
]

const PROCESS = [
  {
    step: '01',
    title: 'Cuéntanos tu visión',
    desc: 'Comparte tu idea, el tipo de evento, la fecha y el presupuesto aproximado. Con o sin imagen de referencia.',
    icon: Calendar,
  },
  {
    step: '02',
    title: 'Recibe tu propuesta',
    desc: 'Nuestro sistema genera en minutos una cotización optimizada con los mejores proveedores para tu presupuesto.',
    icon: Zap,
  },
  {
    step: '03',
    title: 'Coordinamos todo',
    desc: 'Te asignamos un coordinador dedicado que gestiona proveedores, tiempos y logística de principio a fin.',
    icon: CheckCircle,
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-primary-500/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-xs">I</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Inari Group</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/60 font-medium">
            <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
            <a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a>
            <a href="#proceso" className="hover:text-white transition-colors">Cómo trabajamos</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors px-3 py-1.5"
            >
              Ingresar
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all hover:shadow-md hover:shadow-accent-500/20 active:scale-[0.98]"
            >
              Solicitar cotización
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 pt-32 pb-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(233,69,96,0.12),_transparent_60%)]" />
        <div className="max-w-4xl mx-auto relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-white/80 text-sm mb-8 backdrop-blur-sm">
            <MapPin size={13} className="text-accent-400" />
            Lima, Perú · Operamos en todo el país
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Creamos eventos
            <span className="block text-accent-400 mt-1">que se recuerdan</span>
          </h1>

          <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Empresa peruana especializada en la organización integral de eventos sociales y corporativos.
            Desde bodas íntimas hasta grandes congresos, transformamos tu visión en realidad.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="btn-primary px-8 py-4 text-lg font-bold hover:scale-105 shadow-lg shadow-accent-500/25 flex items-center justify-center gap-2"
            >
              Cotizar mi evento
              <ArrowRight size={20} />
            </button>
            <a
              href="#servicios"
              className="bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              Ver servicios
              <ChevronRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-primary-600 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-extrabold text-accent-400 mb-1 tracking-tight">{s.value}</div>
              <div className="text-white/50 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section id="servicios" className="py-24 px-6 bg-surface-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Nuestros servicios</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Organizamos todo tipo de eventos con la misma atención al detalle y compromiso con la excelencia.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="card-hover p-6 cursor-default group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${s.color}`}>
                  <s.icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section id="nosotros" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                ¿Por qué elegir<br />
                <span className="text-accent-500">Inari Group?</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Somos más que una empresa de eventos. Somos el equipo que se encarga de cada detalle
                para que tú solo te preocupes de disfrutar.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary px-6 py-3 font-bold hover:scale-105 inline-flex items-center gap-2"
              >
                Comenzar ahora
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {WHY_US.map((w) => (
                <div key={w.title} className="p-5 rounded-2xl bg-surface-50 border border-gray-100/80 hover:shadow-soft transition-all duration-300">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mb-4">
                    <w.icon size={18} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">{w.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Process / Tech highlight ── */}
      <section id="proceso" className="py-24 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Cómo trabajamos
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Proceso simple, tecnología de punta. Recibes tu propuesta en minutos, no días.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 mb-16">
            {PROCESS.map((p) => (
              <div key={p.step} className="card p-8 hover:shadow-soft-lg transition-all duration-300 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="bg-accent-50 rounded-xl p-3 group-hover:bg-accent-100 transition-colors">
                    <p.icon size={24} className="text-accent-500" />
                  </div>
                  <span className="text-5xl font-black text-gray-100/80 leading-none select-none">{p.step}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Tech callout */}
          <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(233,69,96,0.15),_transparent_60%)]" />
            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-white/70 text-xs mb-4 backdrop-blur-sm">
                  <Zap size={12} className="text-accent-400" />
                  Tecnología propia
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
                  Cotizaciones en minutos,<br />
                  <span className="text-accent-400">no en días</span>
                </h3>
                <p className="text-white/60 text-base leading-relaxed mb-6">
                  Nuestro módulo de propuestas usa inteligencia artificial y algoritmos de optimización
                  para generar cotizaciones precisas al instante. Subes una imagen de referencia y
                  recibes una propuesta básica y premium con el mejor mix de proveedores.
                </p>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  {['< 3 min por cotización', 'Básica + Premium automática', 'PDF listo para cliente'].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-sm">
                      <CheckCircle size={11} className="text-accent-400" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary px-8 py-4 text-base font-bold hover:scale-105 shadow-lg shadow-accent-500/25 flex items-center gap-2 whitespace-nowrap"
                >
                  Probar el cotizador
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Star className="text-accent-500" size={28} fill="currentColor" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Haz que tu evento sea inolvidable
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Únete a cientos de familias y empresas que confían en Inari Group
            para sus momentos más importantes.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary px-10 py-4 text-lg font-bold hover:scale-105 shadow-lg shadow-accent-500/25 inline-flex items-center gap-2"
          >
            Crear cuenta y cotizar
            <ArrowRight size={20} />
          </button>
          <p className="text-gray-300 text-sm mt-4">
            Crea tu cuenta gratis · Sin compromisos
          </p>
        </div>
      </section>

      {/* ── Demo credentials ── */}
      <section className="py-12 px-6 bg-surface-50 border-t border-gray-100/80">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-400 text-sm mb-5">
            <span className="font-medium text-gray-700">Demo del sistema</span> · Usa estas cuentas para explorar la plataforma
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { rol: 'Admin', email: 'admin@inari.pe', pass: 'admin123', color: 'border-accent-200 bg-accent-50/50' },
              { rol: 'Ejecutivo', email: 'ejecutivo@inari.pe', pass: 'exec123', color: 'border-primary-100 bg-primary-50/50' },
              { rol: 'Cliente', email: 'cliente@inari.pe', pass: 'demo123', color: 'border-gray-200 bg-white' },
            ].map((u) => (
              <div key={u.rol} className={`rounded-xl border p-4 text-left transition-shadow hover:shadow-soft ${u.color}`}>
                <div className="font-semibold text-gray-900 text-sm mb-2">{u.rol}</div>
                <div className="text-gray-500 text-xs font-mono">{u.email}</div>
                <div className="text-gray-300 text-xs font-mono">{u.pass}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/login')}
            className="mt-5 btn-secondary text-sm inline-flex items-center gap-2"
          >
            <CheckCircle size={14} />
            Ir al inicio de sesión
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gradient-to-r from-primary-500 to-primary-600 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-[10px]">I</span>
            </div>
            <span className="text-white font-bold">Inari Group</span>
            <span className="text-white/30 text-sm">· Organización de Eventos · Lima, Perú</span>
          </div>
          <div className="text-white/30 text-sm">
            TSP · Ingeniería de Software · UPC · 2026
          </div>
        </div>
      </footer>
    </div>
  )
}

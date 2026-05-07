/**
 * Página de resultado de cotización para visitantes no autenticados.
 * Muestra el preview (sin guardar) y ofrece registro para enviar a INARI.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, Star, Send, ChevronDown, ChevronUp, X, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import RegisterWithQuotationModal from '../components/RegisterWithQuotationModal'
import { authApi, quotationsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import type { AuthToken } from '../types'

const EVENT_LABELS: Record<string, string> = {
  boda: 'Boda', corporativo: 'Corporativo', cumpleanos: 'Cumpleaños',
  quinceanos: 'Quinceañera', conferencia: 'Conferencia', otro: 'Evento especial',
}

interface PreviewDetalle {
  servicio: string
  costo: number
  es_obligatorio: boolean
  quality_index: number
}

interface PreviewNivel {
  factible: boolean
  costo_total: number
  quality_score: number
  detalles: PreviewDetalle[]
}

interface PreviewResult {
  basica: PreviewNivel
  premium: PreviewNivel
  basica_factible: boolean
  premium_factible: boolean
  num_invitados: number
  evento_tipo: string
  evento_fecha: string
  presupuesto_maximo: number
  estilo: string | null
  descripcion: string | null
  image_inferred_services: string[]
}

interface FormData {
  evento_tipo: string
  evento_fecha: string
  num_invitados: number
  presupuesto_maximo: number
  estilo?: string
  descripcion?: string
}

type ActiveNivel = 'basica' | 'premium'

interface LoginModalProps {
  onClose: () => void
  onSuccess: () => void
}

function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const { loginWithToken } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await authApi.login(email, password)
      loginWithToken(data as AuthToken)
      onSuccess()
    } catch {
      setError('Credenciales incorrectas.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,23,20,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="glass-raised rounded-2xl animate-slide-up w-full mx-4"
        style={{ maxWidth: 400, padding: 32 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold">Inicia sesión</h2>
            <p className="text-text-secondary text-sm mt-1">Tu cotización se guardará automáticamente.</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="alert alert-danger">{error}</div>}

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                className="input w-full" style={{ paddingLeft: '2.2rem' }}
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                className="input w-full" style={{ paddingLeft: '2.2rem' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ marginTop: 4 }}>
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Ingresando...</>
              : <><ArrowRight size={15} /> Ingresar y guardar cotización</>}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default function GuestResultPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const state = location.state as { result: PreviewResult; formData: FormData; styleFiles?: File[] } | null

  const [showModal, setShowModal]           = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [activeNivel, setActiveNivel]       = useState<ActiveNivel>('premium' as ActiveNivel)
  const [showBasicDetails, setShowBasicDetails] = useState(false)

  if (!state?.result) {
    return (
      <div className="mesh min-h-screen flex items-center justify-center">
        <div className="glass p-12 text-center max-w-md">
          <p className="font-semibold mb-2">Cotización no disponible</p>
          <p className="text-text-secondary text-sm mb-6">Esta propuesta expiró o fue accedida directamente.</p>
          <button className="btn btn-primary" onClick={() => navigate('/cotizar')}>
            Generar nueva cotización
          </button>
        </div>
      </div>
    )
  }

  const { result, formData, styleFiles = [] } = state
  const active = result[activeNivel]
  const eventLabel = EVENT_LABELS[result.evento_tipo] ?? result.evento_tipo
  const fecha = new Date(result.evento_fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })

  const handleRegistered = (quotationId: number) => {
    navigate(`/quotations/${quotationId}`)
  }

  const handleLoginSuccess = async () => {
    setShowLoginModal(false)
    try {
      toast.info('Guardando tu cotización...')
      const fd = new FormData()
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== undefined && v !== '') fd.append(k, String(v))
      })
      styleFiles.forEach(f => fd.append('style_images', f))
      const res = await quotationsApi.generate(fd)
      const targetId = res.basica_factible ? res.quotation_basica_id : res.quotation_premium_id
      toast.success('¡Cotización guardada!')
      navigate(`/quotations/${targetId}`, { state: { result: res } })
    } catch {
      toast.error('No se pudo guardar la cotización. Créala desde el dashboard.')
      navigate('/dashboard')
    }
  }

  return (
    <div className="mesh min-h-screen">
      <div className="mesh-blob" />

      {/* Header */}
      <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(26,23,20,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="INARI GROUP SAC" style={{ height: 48, width: "auto" }} />
        </div>
        <button
          style={{ fontSize: 13, color: '#6E6E73', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={() => setShowLoginModal(true)}
        >
          ¿Ya tienes cuenta? <span style={{ color: '#E8572A', fontWeight: 600 }}>Inicia sesión</span>
        </button>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">

        {/* Encabezado resultado */}
        <div className="glass p-8 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-ok" />
            <span className="text-sm font-semibold text-ok">¡Tu propuesta está lista!</span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tighter mb-2">
            {eventLabel} · {result.num_invitados} personas
          </h1>
          <p className="text-text-secondary">{fecha}{result.estilo ? ` · ${result.estilo}` : ''}</p>
        </div>

        {/* Selector básica / premium */}
        {result.basica_factible && result.premium_factible && (
          <div className="flex gap-3 mb-6">
            {(['premium', 'basica'] as ActiveNivel[]).map(nivel => (
              <button
                key={nivel}
                onClick={() => setActiveNivel(nivel)}
                className={`flex-1 glass p-5 text-left rounded-2xl transition-all ${activeNivel === nivel ? 'border-2 border-accent' : 'border border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`badge ${nivel === 'premium' ? 'badge-accent' : 'badge-neutral'}`}>
                    {nivel === 'premium' ? '★ Premium' : 'Básica'}
                  </span>
                  {activeNivel === nivel && <CheckCircle size={15} className="text-accent" />}
                </div>
                <div className="font-mono text-xl font-bold">
                  S/ {result[nivel].costo_total.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-text-muted flex items-center gap-1 mt-1">
                  <Star size={10} /> {(result[nivel].quality_score * 100).toFixed(0)}% calidad
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Servicios */}
        <div className="glass p-7 mb-6">
          <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-4">
            Servicios incluidos · propuesta {activeNivel}
          </p>

          {active.detalles.filter(d => d.es_obligatorio).length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Principales</p>
              {active.detalles.filter(d => d.es_obligatorio).map((d, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <span className="font-semibold text-sm capitalize">{d.servicio}</span>
                    <span className="ml-2 badge badge-accent text-[10px]">Incluido</span>
                  </div>
                  <span className="font-mono text-sm font-semibold">S/ {d.costo.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          )}

          {active.detalles.filter(d => !d.es_obligatorio).length > 0 && (
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Adicionales</p>
              {active.detalles.filter(d => !d.es_obligatorio).map((d, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <span className="font-semibold text-sm capitalize">{d.servicio}</span>
                    <span className="ml-2 badge badge-neutral text-[10px]">Adicional</span>
                  </div>
                  <span className="font-mono text-sm font-semibold">S/ {d.costo.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          )}

          {result.image_inferred_services.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-muted mb-2">✨ Detectamos según tus imágenes:</p>
              <div className="flex flex-wrap gap-2">
                {result.image_inferred_services.map(s => (
                  <span key={s} className="badge badge-accent text-xs capitalize">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="mt-5 pt-5 border-t-2 border-text-primary flex items-center justify-between">
            <span className="font-semibold">Total {activeNivel}</span>
            <span className="font-mono text-2xl font-bold">
              S/ {active.costo_total.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Comparación básica si aplica */}
        {result.basica_factible && result.premium_factible && activeNivel === 'premium' && (
          <div className="glass mb-6">
            <button
              className="w-full flex items-center justify-between p-5 text-left"
              onClick={() => setShowBasicDetails(s => !s)}
            >
              <span className="text-sm text-text-secondary">Ver propuesta básica (S/ {result.basica.costo_total.toLocaleString('es-PE', { maximumFractionDigits: 0 })})</span>
              {showBasicDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {showBasicDetails && (
              <div className="px-5 pb-5">
                {result.basica.detalles.map((d: { servicio: string; costo: number }, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                    <span className="capitalize text-text-secondary">{d.servicio}</span>
                    <span className="font-mono text-text-secondary">S/ {d.costo.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA principal */}
        <div className="glass p-8 text-center">
          <h2 className="font-display text-2xl font-bold mb-2">¿Te interesa esta propuesta?</h2>
          <p className="text-text-secondary text-sm mb-6 max-w-sm mx-auto">
            Regístrate y el equipo de INARI GROUP te contactará por WhatsApp para coordinar los detalles.
          </p>
          <button className="btn btn-primary btn-lg px-10 mb-3" onClick={() => setShowModal(true)}>
            <Send size={16} /> Enviar propuesta a INARI GROUP
          </button>
          <div className="mt-3">
            <button className="btn btn-ghost text-sm" onClick={() => navigate('/cotizar')}>
              Generar otra cotización
            </button>
          </div>
          <p className="text-xs text-text-muted mt-4">
            Sin compromisos. INARI te contactará para afinar los detalles.
          </p>
        </div>

      </div>

      {showModal && (
        <RegisterWithQuotationModal
          eventoData={{
            evento_tipo: formData.evento_tipo,
            evento_fecha: formData.evento_fecha,
            num_invitados: formData.num_invitados,
            presupuesto_maximo: formData.presupuesto_maximo,
            estilo: formData.estilo,
            descripcion: formData.descripcion,
          }}
          styleFiles={styleFiles}
          onSuccess={handleRegistered}
          onClose={() => setShowModal(false)}
        />
      )}

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />
      )}
    </div>
  )
}

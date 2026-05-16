/**
 * Página pública de propuesta — accedida via link firmado /p/:token.
 * Sin login, sin navegación interna. Solo muestra la cotización al cliente.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  Calendar,
  Users,
  Sparkles,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  Loader2,
  ChevronRight,
  Download,
  History,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchPublicQuotation,
  fetchPublicRequests,
  createPublicRequest,
  type PublicQuotation,
  type ServicioExterno,
  type SolicitudAjuste,
} from '../services/publicApi'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  boda: 'Boda',
  corporativo: 'Evento Corporativo',
  cumpleanos: 'Cumpleaños',
  quinceanos: 'Quinceañera',
  conferencia: 'Conferencia',
  otro: 'Evento Especial',
}

const CATEGORY_LABELS: Record<string, string> = {
  catering: 'Catering & Banquetes',
  decoracion: 'Decoración',
  fotografia: 'Fotografía & Video',
  musica: 'Música & Entretenimiento',
  iluminacion: 'Iluminación',
  flores: 'Flores & Arreglos',
  otro: 'Servicios Adicionales',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function groupByCategory(
  servicios: ServicioExterno[],
): Record<string, ServicioExterno[]> {
  return servicios.reduce<Record<string, ServicioExterno[]>>((acc, s) => {
    const key = s.categoria.toLowerCase()
    return { ...acc, [key]: [...(acc[key] ?? []), s] }
  }, {})
}

// ─── State type ───────────────────────────────────────────────────────────────

type PageState =
  | { kind: 'loading' }
  | { kind: 'success'; data: PublicQuotation }
  | { kind: 'expired' }
  | { kind: 'cancelled' }
  | { kind: 'notfound' }
  | { kind: 'error'; message: string }

// ─── Sub-components ───────────────────────────────────────────────────────────

function StateScreen({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="min-h-screen bg flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-12 text-center max-w-sm w-full animate-fade-in">
        <div className="flex justify-center mb-5">{icon}</div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-2">{title}</h2>
        <p className="text-text-secondary text-sm leading-relaxed">{subtitle}</p>
        <p className="mt-6 text-text-muted text-xs">
          ¿Necesitas ayuda? Contacta a tu ejecutivo INARI GROUP.
        </p>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PublicQuotationPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<PageState>({ kind: 'loading' })

  // ── Historial y solicitudes (cargados post-éxito) ─────────────────────────
  const [historialOpen, setHistorialOpen]   = useState(false)
  const [ajustesOpen, setAjustesOpen]       = useState(false)
  const [requests, setRequests]             = useState<SolicitudAjuste[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [mensaje, setMensaje]               = useState('')
  const [sending, setSending]               = useState(false)
  const [sent, setSent]                     = useState(false)

  const charCount = mensaje.length
  const charOk    = charCount >= 200 && charCount <= 1000

  const loadRequests = async () => {
    if (!token) return
    setLoadingRequests(true)
    try {
      const data = await fetchPublicRequests(token)
      setRequests(data)
    } catch {
      // silencioso — no bloquea UI
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleAjustesOpen = () => {
    if (!ajustesOpen) loadRequests()
    setAjustesOpen(o => !o)
  }

  const handleSend = async () => {
    if (!token || !charOk || sending) return
    setSending(true)
    try {
      const req = await createPublicRequest(token, mensaje)
      setRequests(prev => [...prev, req])
      setMensaje('')
      setSent(true)
      toast.success('Solicitud enviada correctamente')
    } catch {
      toast.error('No se pudo enviar la solicitud. Inténtalo de nuevo.')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setState({ kind: 'notfound' })
      return
    }

    fetchPublicQuotation(token)
      .then((data) => setState({ kind: 'success', data }))
      .catch((err: unknown) => {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status
          if (status === 401) return setState({ kind: 'expired' })
          if (status === 403) return setState({ kind: 'cancelled' })
          if (status === 404) return setState({ kind: 'notfound' })
        }
        setState({ kind: 'error', message: 'No se pudo cargar la propuesta.' })
      })
  }, [token])

  if (state.kind === 'loading') {
    return (
      <div className="min-h-screen bg flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    )
  }

  if (state.kind === 'expired') {
    return (
      <StateScreen
        icon={<Clock size={48} className="text-text-muted" />}
        title="Este enlace ha expirado"
        subtitle="El período de validez de tu propuesta ha concluido. Solicita un nuevo enlace a tu ejecutivo."
      />
    )
  }

  if (state.kind === 'cancelled') {
    return (
      <StateScreen
        icon={<Ban size={48} className="text-text-muted" />}
        title="Propuesta no disponible"
        subtitle="Esta cotización ha sido cancelada o reemplazada. Comunícate con tu ejecutivo para más detalles."
      />
    )
  }

  if (state.kind === 'notfound') {
    return (
      <StateScreen
        icon={<AlertTriangle size={48} className="text-text-muted" />}
        title="Propuesta no encontrada"
        subtitle="El enlace no corresponde a ninguna cotización. Verifica que sea el enlace correcto."
      />
    )
  }

  if (state.kind === 'error') {
    return (
      <StateScreen
        icon={<AlertTriangle size={48} className="text-accent" />}
        title="Error al cargar"
        subtitle={state.message}
      />
    )
  }

  // ── Success state ────────────────────────────────────────────────────────

  const { data } = state
  const { evento, condiciones_pago, servicios_externos, paquete_base, narrativa } = data
  const grouped = groupByCategory(servicios_externos)
  const expiresDate = formatDate(data.expires_at)
  const eventLabel = EVENT_LABELS[evento.tipo] ?? evento.tipo

  const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
  const pdfUrl = `${API_BASE}/public/quotations/by-token/pdf?token=${encodeURIComponent(token ?? '')}`

  return (
    <div className="min-h-screen bg">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="glass-frost border-b border-border sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <span className="font-display text-lg font-bold tracking-tight text-text-primary shrink-0">
            INARI GROUP
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="badge badge-neutral text-xs flex items-center gap-1.5">
              <Clock size={10} />
              Válido hasta {expiresDate}
            </span>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
              style={{ textDecoration: 'none' }}
            >
              <Download size={12} />
              Descargar PDF
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5 animate-fade-in">

        {/* ── Event header ──────────────────────────────────────────── */}
        <section className="glass rounded-2xl p-7">
          <p className="text-[10px] font-semibold tracking-widest text-accent uppercase mb-3">
            Tu propuesta personalizada
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tighter text-text-primary mb-4">
            {eventLabel}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-accent" />
              {formatDate(evento.fecha)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-accent" />
              {evento.num_invitados} invitados
            </span>
            {evento.estilo && (
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-accent" />
                Estilo {evento.estilo}
              </span>
            )}
          </div>
        </section>

        {/* ── Narrativa ─────────────────────────────────────────────── */}
        {narrativa && (
          <section className="glass rounded-2xl p-7">
            <p className="text-sm leading-relaxed text-text-secondary italic">
              "{narrativa}"
            </p>
          </section>
        )}

        {/* ── Paquete base ──────────────────────────────────────────── */}
        {paquete_base && (
          <section className="glass rounded-2xl p-7">
            <div className="flex items-start gap-3 mb-4">
              <Package size={18} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold tracking-widest text-accent uppercase mb-0.5">
                  Paquete base
                </p>
                <h2 className="font-display text-xl font-bold text-text-primary">
                  {paquete_base.nombre}
                </h2>
              </div>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {paquete_base.contenido}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs text-text-muted">Incluido en tu propuesta</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(paquete_base.costo)}
              </span>
            </div>
          </section>
        )}

        {/* ── Servicios externos ────────────────────────────────────── */}
        {servicios_externos.length > 0 && (
          <section className="glass rounded-2xl overflow-hidden">
            <div className="px-7 pt-6 pb-3">
              <p className="text-[10px] font-semibold tracking-widest text-accent uppercase mb-0.5">
                Servicios incluidos
              </p>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Equipo de proveedores seleccionados
              </h2>
            </div>

            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="px-7 pb-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  {CATEGORY_LABELS[cat] ?? cat}
                </p>
                <div className="space-y-2">
                  {items.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2
                          size={14}
                          className={s.es_obligatorio ? 'text-accent shrink-0' : 'text-ok shrink-0'}
                        />
                        <span className="text-sm text-text-primary truncate">
                          {s.descripcion}
                        </span>
                        {s.es_obligatorio && (
                          <span className="badge badge-accent text-[10px] shrink-0">
                            Incluido
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-text-primary ml-3 shrink-0">
                        {formatCurrency(s.costo)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Costo total ───────────────────────────────────────────── */}
        <section className="glass-raised rounded-2xl p-8 text-center">
          <p className="text-[10px] font-semibold tracking-widest text-accent uppercase mb-3">
            Inversión total
          </p>
          <div className="font-display text-6xl font-bold text-text-primary tracking-tighter mb-1">
            {data.costo_total != null ? formatCurrency(data.costo_total) : '—'}
          </div>
          {data.presupuesto_cliente != null && (
            <p className="text-xs text-text-muted mt-2">
              Tu presupuesto estimado:{' '}
              <span className="text-text-secondary">
                {formatCurrency(data.presupuesto_cliente)}
              </span>
            </p>
          )}
        </section>

        {/* ── Condiciones de pago ───────────────────────────────────── */}
        <section className="glass rounded-2xl p-7">
          <p className="text-[10px] font-semibold tracking-widest text-accent uppercase mb-1">
            Condiciones de pago
          </p>
          <h2 className="font-display text-xl font-bold text-text-primary mb-5">
            Plan de pagos
          </h2>

          <div className="space-y-3">
            {/* Separación */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                <span className="text-accent font-bold text-xs">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Separación del evento</p>
                <p className="text-xs text-text-secondary">Al confirmar la propuesta</p>
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {formatCurrency(condiciones_pago.separacion)}
              </span>
            </div>

            <ChevronRight size={12} className="text-text-muted mx-auto rotate-90" />

            {/* Primer pago */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                <span className="text-accent font-bold text-xs">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Primer pago</p>
                <p className="text-xs text-text-secondary">
                  {condiciones_pago.primer_pago_porcentaje}% del total · 30 días antes del evento
                </p>
              </div>
              {data.costo_total != null && (
                <span className="text-sm font-semibold text-text-primary">
                  {formatCurrency(data.costo_total * condiciones_pago.primer_pago_porcentaje / 100)}
                </span>
              )}
            </div>

            <ChevronRight size={12} className="text-text-muted mx-auto rotate-90" />

            {/* Segundo pago */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                <span className="text-accent font-bold text-xs">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Segundo pago</p>
                <p className="text-xs text-text-secondary">
                  {condiciones_pago.segundo_pago_porcentaje}% del total · 7 días antes del evento
                </p>
              </div>
              {data.costo_total != null && (
                <span className="text-sm font-semibold text-text-primary">
                  {formatCurrency(data.costo_total * condiciones_pago.segundo_pago_porcentaje / 100)}
                </span>
              )}
            </div>

            <ChevronRight size={12} className="text-text-muted mx-auto rotate-90" />

            {/* Tercer pago */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                <span className="text-accent font-bold text-xs">4</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Pago final</p>
                <p className="text-xs text-text-secondary">
                  {condiciones_pago.tercer_pago_porcentaje}% del total · El día del evento
                </p>
              </div>
              {data.costo_total != null && (
                <span className="text-sm font-semibold text-text-primary">
                  {formatCurrency(data.costo_total * condiciones_pago.tercer_pago_porcentaje / 100)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Historial de propuestas ───────────────────────────────── */}
        {data.versiones_anteriores.length > 0 && (
          <section className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => setHistorialOpen(o => !o)}
              className="w-full flex items-center justify-between px-7 py-5 text-left"
            >
              <div className="flex items-center gap-2.5">
                <History size={16} className="text-accent shrink-0" />
                <span className="font-display text-lg font-bold text-text-primary">
                  Historial de propuestas
                </span>
                <span className="badge badge-neutral text-[10px]">
                  {data.versiones_anteriores.length} versión{data.versiones_anteriores.length > 1 ? 'es' : ''}
                </span>
              </div>
              {historialOpen ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
            </button>
            {historialOpen && (
              <div className="px-7 pb-5 space-y-2 animate-fade-in">
                {data.versiones_anteriores.map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <span className="text-sm text-text-primary font-medium">Versión {v.version}</span>
                      <span className="text-xs text-text-muted ml-2">
                        {v.created_at ? new Date(v.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      {v.costo_total != null ? formatCurrency(v.costo_total) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Solicitud de ajustes ──────────────────────────────────── */}
        <section className="glass rounded-2xl overflow-hidden">
          <button
            onClick={handleAjustesOpen}
            className="w-full flex items-center justify-between px-7 py-5 text-left"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare size={16} className="text-accent shrink-0" />
              <span className="font-display text-lg font-bold text-text-primary">
                ¿Necesitas ajustes?
              </span>
              {requests.length > 0 && (
                <span className="badge badge-accent text-[10px]">{requests.length}</span>
              )}
            </div>
            {ajustesOpen ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </button>

          {ajustesOpen && (
            <div className="px-7 pb-6 animate-fade-in space-y-5">

              {/* Formulario */}
              {!sent ? (
                <div>
                  <p className="text-sm text-text-secondary mb-3">
                    Cuéntanos qué te gustaría cambiar. Nuestro equipo te contactará en las próximas 24 horas.
                  </p>
                  <div className="relative">
                    <textarea
                      rows={5}
                      className="input w-full resize-none text-sm leading-relaxed"
                      placeholder="Describe los cambios que necesitas (mínimo 200 caracteres)…"
                      value={mensaje}
                      onChange={e => setMensaje(e.target.value)}
                    />
                    <span
                      className={`absolute bottom-2 right-3 text-[11px] font-mono ${
                        charCount > 1000 ? 'text-danger' : charOk ? 'text-ok' : 'text-text-muted'
                      }`}
                    >
                      {charCount}/1000
                    </span>
                  </div>
                  {charCount > 0 && charCount < 200 && (
                    <p className="text-xs text-warn mt-1">Mínimo {200 - charCount} caracteres más.</p>
                  )}
                  {charCount > 1000 && (
                    <p className="text-xs text-danger mt-1">Máximo 1000 caracteres.</p>
                  )}
                  <button
                    onClick={handleSend}
                    disabled={!charOk || sending}
                    className="btn btn-primary w-full mt-3 flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {sending ? 'Enviando…' : 'Enviar solicitud'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-ok/10 border border-ok/20">
                  <CheckCircle2 size={18} className="text-ok shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-ok">Solicitud enviada</p>
                    <p className="text-xs text-text-secondary">Nuestro equipo la revisará pronto.</p>
                  </div>
                </div>
              )}

              {/* Solicitudes anteriores */}
              {loadingRequests ? (
                <div className="flex justify-center py-3">
                  <Loader2 size={16} className="animate-spin text-text-muted" />
                </div>
              ) : requests.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
                    Solicitudes anteriores
                  </p>
                  <div className="space-y-2">
                    {requests.map(r => (
                      <div key={r.id} className="p-3.5 rounded-xl border border-border bg-bg/40">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-text-muted">
                            {new Date(r.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={`badge text-[10px] ${
                            r.estado === 'resuelto'    ? 'badge-success' :
                            r.estado === 'en_revision' ? 'badge-accent'  : 'badge-neutral'
                          }`}>
                            {r.estado === 'en_revision' ? 'En revisión' :
                             r.estado === 'resuelto'    ? 'Resuelto'    : 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{r.mensaje}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Expiry notice ─────────────────────────────────────────── */}
        <p className="text-center text-xs text-text-muted pb-4">
          Este enlace expira el{' '}
          <span className="text-text-secondary font-medium">{expiresDate}</span>
          . Comunícate con tu ejecutivo INARI GROUP si tienes consultas.
        </p>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-text-muted">
          © INARI GROUP — Sistema Inteligente de Propuestas de Eventos
        </p>
      </footer>
    </div>
  )
}

/**
 * Vista de resultado de cotización. CU-01 paso 10 + CU-02 ajuste/reproceso.
 */
import { useState, useMemo, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Download, CheckCircle, XCircle, Loader2, RefreshCw,
  ChevronDown, ChevronUp, AlertCircle, TrendingDown,
  Minus, History, ChevronRight, ArrowRight, Sparkles,
  Star, LockKeyhole, Package, TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { quotationsApi } from '../services/api'
import type { GenerateQuotationResult, AlternativeProvider } from '../types'
import ConfirmModal from '../components/shared/ConfirmModal'
import QualityBar from '../components/shared/QualityBar'
import { useAuth } from '../context/AuthContext'

const EVENT_LABELS: Record<string, string> = {
  boda: 'Boda', corporativo: 'Corporativo', cumpleanos: 'Cumpleaños',
  quinceanos: 'Quinceañera', conferencia: 'Conferencia', otro: 'Otro',
}

function DeltaBadge({ value, unit = '' }: { value: number; unit?: string }) {
  if (Math.abs(value) < 0.001) return <span className="text-text-muted text-xs flex items-center gap-0.5"><Minus size={10} />igual</span>
  if (value > 0) return <span className="text-danger text-xs font-medium">+{unit}{value.toLocaleString('es-PE')}</span>
  return <span className="text-ok text-xs font-medium flex items-center gap-0.5"><TrendingDown size={10} />{unit}{Math.abs(value).toLocaleString('es-PE')}</span>
}

function AlternativesPanel({
  quotationId, detalleId, currentProviderName, onSwap, isSwapping,
}: {
  quotationId: number; detalleId: number; currentProviderName: string
  onSwap: (detalleId: number, newProviderId: number) => void; isSwapping: boolean
}) {
  const [confirmAlt, setConfirmAlt] = useState<AlternativeProvider | null>(null)
  const { data: alternatives, isLoading } = useQuery({
    queryKey: ['alternatives', quotationId, detalleId],
    queryFn: () => quotationsApi.getAlternatives(quotationId, detalleId),
  })

  if (isLoading) return (
    <div className="flex items-center gap-2 py-4 text-text-secondary text-sm">
      <Loader2 size={13} className="animate-spin" /> Buscando alternativas...
    </div>
  )
  if (!alternatives?.length) return (
    <p className="text-text-secondary text-sm py-4 text-center">Sin alternativas para este servicio</p>
  )

  return (
    <>
      <div className="space-y-1">
        {alternatives.map((alt: AlternativeProvider) => (
          <div key={alt.id} className="flex items-center justify-between hover:bg-accent-light rounded-xl p-3 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary text-sm truncate">{alt.nombre}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-text-secondary text-xs tabular-nums">S/. {alt.costo.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span>
                <DeltaBadge value={alt.delta_costo} unit="S/. " />
                <span className="text-border">|</span>
                <span className="text-text-secondary text-xs">{(alt.indice_calidad * 100).toFixed(0)}%</span>
                <DeltaBadge value={Number((alt.delta_quality * 100).toFixed(1))} unit="%" />
              </div>
            </div>
            <button onClick={() => setConfirmAlt(alt)} disabled={isSwapping} className="ml-4 btn-ghost text-xs">
              {isSwapping ? <Loader2 size={11} className="animate-spin" /> : 'Seleccionar'}
            </button>
          </div>
        ))}
      </div>
      <ConfirmModal
        open={confirmAlt !== null}
        title="Cambiar proveedor"
        message={`¿Reemplazar "${currentProviderName}" por "${confirmAlt?.nombre}"?`}
        confirmLabel="Cambiar proveedor"
        onConfirm={() => { if (confirmAlt) onSwap(detalleId, confirmAlt.id); setConfirmAlt(null) }}
        onCancel={() => setConfirmAlt(null)}
      />
    </>
  )
}

const reprocessSchema = z.object({
  presupuesto_maximo: z.number({ coerce: true }).min(100, 'Mínimo S/. 100'),
  incluir_opcionales: z.boolean(),
})
type ReprocessForm = z.infer<typeof reprocessSchema>

export default function QuotationResultPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { role } = useAuth()
  const canSeeProviders = role === 'ejecutivo' || role === 'admin'
  const _generationResult = location.state?.result as GenerateQuotationResult | undefined
  void _generationResult

  const [showReprocess, setShowReprocess]         = useState(false)
  const [narrativa, setNarrativa]                 = useState<string>('')
  const [narrativaGuardada, setNarrativaGuardada] = useState<string>('')
  const [editandoNarrativa, setEditandoNarrativa] = useState(false)
  const [narrativaError, setNarrativaError]       = useState(false)
  const [reprocessError, setReprocessError]       = useState<string | null>(null)
  const [openAlternativesId, setOpenAlternativesId] = useState<number | null>(null)
  const [showHistory, setShowHistory]             = useState(false)
  const [pendingReprocessData, setPendingReprocessData] = useState<ReprocessForm | null>(null)

  const { data: quotation, isLoading, error } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationsApi.getById(Number(id)),
    enabled: !!id,
    refetchInterval: (q) => q.state.data?.estado === 'procesando' ? 2000 : false,
  })

  const { data: pair } = useQuery({
    queryKey: ['pair', id],
    queryFn: () => quotationsApi.getPair(Number(id)),
    enabled: !!id && quotation?.estado === 'completado',
  })

  const { data: allQuotations } = useQuery({
    queryKey: ['quotations'],
    queryFn: quotationsApi.list,
    enabled: !!quotation,
  })

  const versionHistory = useMemo(() => {
    if (!allQuotations || !quotation) return []
    return allQuotations
      .filter(q => q.evento_id === quotation.evento_id && q.id !== Number(id))
      .sort((a, b) => b.version - a.version || (a.nivel === 'premium' ? 1 : -1))
  }, [allQuotations, quotation, id])

  const { register, handleSubmit, formState: { errors } } = useForm<ReprocessForm>({
    resolver: zodResolver(reprocessSchema),
    defaultValues: { incluir_opcionales: true },
  })

  const reprocessMutation = useMutation({
    mutationFn: (data: ReprocessForm) => quotationsApi.reprocess(quotation!.evento_id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Nueva versión creada')
      const targetId = result.basica_factible ? result.quotation_basica_id : result.quotation_premium_id
      navigate(`/quotations/${targetId}`, { state: { result } })
    },
    onError: () => {
      setReprocessError('Error al reprocesar. Verifica el presupuesto.')
      toast.error('Error al reprocesar')
    },
  })

  const swapMutation = useMutation({
    mutationFn: ({ detalleId, newProviderId }: { detalleId: number; newProviderId: number }) =>
      quotationsApi.swap(Number(id), detalleId, newProviderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] })
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['pair', id] })
      setOpenAlternativesId(null)
      toast.success('Proveedor actualizado')
    },
    onError: () => toast.error('Error al cambiar proveedor'),
  })

  const handleDownloadPdf = async () => {
    try {
      await quotationsApi.downloadPdf(Number(id))
      toast.success('Propuesta lista')
    } catch {
      toast.error('Error al generar el documento')
    }
  }

  const QualityRing = ({ score }: { score: number }) => {
    const r = 56, c = 2 * Math.PI * r
    return (
      <div className="relative w-[140px] h-[140px] flex-shrink-0">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <defs>
            <linearGradient id="qg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E8572A" /><stop offset="100%" stopColor="#FF9500" />
            </linearGradient>
          </defs>
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(26,23,20,0.08)" strokeWidth="10" />
          <circle cx="70" cy="70" r={r} fill="none" stroke="url(#qg)" strokeWidth="10"
            strokeLinecap="round" strokeDasharray={`${c * score} ${c}`} transform="rotate(-90 70 70)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-4xl font-extrabold tracking-tightest leading-none">
            {(score * 10).toFixed(1)}
          </div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">de 10</div>
        </div>
      </div>
    )
  }

  if (isLoading) return (
    <div className="mesh min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={32} className="text-accent animate-spin mx-auto mb-3" />
        <p className="text-sm text-text-secondary">Cargando propuesta...</p>
      </div>
    </div>
  )

  if (error || !quotation) return (
    <div className="mesh min-h-screen p-10">
      <div className="glass p-16 text-center">
        <XCircle size={28} className="text-danger mx-auto mb-4" />
        <p className="font-semibold mb-1.5">No se pudo cargar la cotización</p>
        <p className="text-sm text-text-secondary">Intenta nuevamente o regresa al dashboard</p>
      </div>
    </div>
  )

  const isComplete = quotation.estado === 'completado'

  useEffect(() => {
    if ((quotation as unknown as { narrativa?: string })?.narrativa) {
      const n = (quotation as unknown as { narrativa: string }).narrativa
      setNarrativa(n)
      setNarrativaGuardada(n)
    } else if (isComplete) {
      setNarrativaError(true)
    }
  }, [quotation?.id, isComplete])  // eslint-disable-line react-hooks/exhaustive-deps
  const sibling    = pair?.sibling ?? null
  const [basic, premium] = quotation.nivel === 'basico' ? [quotation, sibling] : [sibling, quotation]
  const savings = (basic?.costo_total != null && premium?.costo_total != null)
    ? premium.costo_total - basic.costo_total : null
  const S = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`

  const pkg = quotation.package_selected ?? null

  return (
    <div className="mesh min-h-screen px-10 pt-8 pb-16">
      <div className="mesh-blob" />

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3.5">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
            ← Volver
          </button>
          <span className="font-mono text-xs text-text-muted">
            COTIZACIÓN #{quotation.id} · v{quotation.version}
          </span>
          {isComplete
            ? <span className="badge badge-success"><span className="w-1.5 h-1.5 rounded-full bg-ok" /> Lista para enviar</span>
            : quotation.estado === 'error'
              ? <span className="badge badge-error"><XCircle size={10} /> Sin factibilidad</span>
              : <span className="badge badge-warning"><Loader2 size={10} className="animate-spin" /> Procesando...</span>}
        </div>
        <div className="flex gap-2.5">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowReprocess(!showReprocess)}>
            <RefreshCw size={14} /> Ajustar
          </button>
          {isComplete && (
            <button className="btn btn-primary btn-sm" onClick={handleDownloadPdf}>
              <Download size={14} /> Descargar PDF
            </button>
          )}
        </div>
      </div>

      {/* ── Reprocess panel ── */}
      {showReprocess && (
        <div className="glass-raised animate-fade-in p-8 mb-6 border-l-4 border-accent">
          <h3 className="font-display text-xl font-bold tracking-tight mb-1.5">Ajustar presupuesto</h3>
          <p className="text-sm text-text-secondary mb-6">Se generará una nueva versión. La actual se conserva en el historial.</p>
          <form onSubmit={handleSubmit(data => { setReprocessError(null); setPendingReprocessData(data) })}>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="label">Nuevo presupuesto (S/.)</label>
                <input type="number" {...register('presupuesto_maximo')} className="input" min={100} step={500}
                  placeholder={quotation.presupuesto_maximo ? `Actual: S/ ${quotation.presupuesto_maximo.toLocaleString()}` : 'ej. 18000'} />
                {errors.presupuesto_maximo && <p className="text-danger text-xs mt-1.5">{errors.presupuesto_maximo.message}</p>}
              </div>
              <div className="flex items-center gap-2.5 pt-7">
                <input type="checkbox" id="incluir_opcionales" {...register('incluir_opcionales')}
                  className="w-4 h-4 accent-accent" />
                <label htmlFor="incluir_opcionales" className="text-sm text-text-secondary cursor-pointer">
                  Incluir servicios opcionales
                </label>
              </div>
            </div>
            {reprocessError && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm mb-4"
                style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.18)', color: '#b3271e' }}>
                <AlertCircle size={14} /> {reprocessError}
              </div>
            )}
            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary" disabled={reprocessMutation.isPending}>
                {reprocessMutation.isPending
                  ? <><Loader2 size={14} className="animate-spin" /> Procesando...</>
                  : <><Sparkles size={14} /> Generar nueva versión</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Title row ── */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-6 mb-7">
        <div className="glass-raised p-8">
          <p className="font-mono text-[11px] text-accent tracking-widest uppercase mb-2.5">
            {quotation.evento_tipo?.toUpperCase() ?? 'EVENTO'}
            {quotation.evento_fecha ? ` · ${new Date(quotation.evento_fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}` : ''}
          </p>
          <h1 className="font-display text-5xl font-extrabold tracking-tightest leading-none mb-2">
            {EVENT_LABELS[quotation.evento_tipo ?? ''] ?? 'Propuesta de evento'}
          </h1>
          {(quotation.num_invitados || quotation.estilo) && (
            <p className="text-text-secondary text-sm mt-2">
              {[quotation.num_invitados && `${quotation.num_invitados} invitados`, quotation.estilo].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { l: 'Proveedores', v: String(quotation.detalles?.length ?? '—'), m: 'seleccionados' },
              { l: 'Calidad',     v: quotation.quality_score != null ? `${(quotation.quality_score*100).toFixed(0)}%` : '—', m: 'promedio' },
              { l: 'Total',       v: quotation.costo_total != null ? `S/${(quotation.costo_total/1000).toFixed(1)}k` : '—', m: 'IGV incluido', mono: true },
            ].map(s => (
              <div key={s.l}>
                <div className="text-[11px] text-text-muted uppercase tracking-wide mb-1">{s.l}</div>
                <div className={`text-xl font-bold tracking-tight ${s.mono ? 'font-mono' : 'font-display'}`}>{s.v}</div>
                <div className="text-[11px] text-text-muted mt-0.5">{s.m}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-raised p-7 flex items-center gap-6">
          <QualityRing score={quotation.quality_score ?? 0} />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-text-muted uppercase tracking-wide">Score de calidad</div>
            <div className="font-display text-xl font-bold tracking-tight mt-1 leading-tight">
              {(quotation.quality_score ?? 0) >= 0.85 ? 'Excelente match' : (quotation.quality_score ?? 0) >= 0.7 ? 'Buen match' : 'Match aceptable'}
            </div>
            <p className="text-xs text-text-secondary mt-1.5 mb-3 leading-relaxed">Promedio ponderado de todos los proveedores.</p>
            <div className="flex flex-col gap-2">
              {quotation.detalles?.slice(0, 3).map(d => (
                <div key={d.id} className="flex items-center gap-2.5">
                  <span className="text-[11px] text-text-secondary w-20 capitalize truncate">{d.servicio}</span>
                  <div className="flex-1">
                    <QualityBar value={d.indice_calidad} showLabel={false} />
                  </div>
                  <span className="font-mono text-[11px] text-text-muted w-7 text-right">{(d.indice_calidad * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Propuestas básica / premium ── */}
      {isComplete && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[
            { q: basic,   nivel: 'Básica',  isPremium: false },
            { q: premium, nivel: 'Premium', isPremium: true },
          ].map(({ q, nivel, isPremium }) => {
            const isActive = q?.id === quotation.id
            return (
              <div
                key={nivel}
                onClick={() => q && !isActive && navigate(`/quotations/${q.id}`, { state: location.state })}
                className="glass-raised rounded-2xl p-8 relative transition-all duration-200 cursor-pointer"
                style={{
                  border: isPremium ? '1px solid rgba(232,87,42,0.30)' : '1px solid rgba(26,23,20,0.08)',
                  boxShadow: isPremium
                    ? 'inset 0 0 0 0.5px rgba(255,255,255,0.85), 0 16px 48px rgba(232,87,42,0.14)'
                    : undefined,
                  cursor: !isActive && q ? 'pointer' : 'default',
                }}
                onMouseEnter={e => { if (!isActive && q) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
              >
                {/* Header con nivel + badge Premium en línea */}
                <div className="flex items-center gap-3 mb-1" style={{ marginTop: 0 }}>
                  <h3 className="font-display text-2xl font-bold tracking-tight">{nivel}</h3>
                  {isPremium && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase text-white"
                      style={{ background: 'linear-gradient(145deg,#E8572A,#C94A1F)', boxShadow: '0 4px 12px rgba(232,87,42,0.28)' }}>
                      <Sparkles size={11} /> Premium
                    </span>
                  )}
                  {isActive && <span className="text-[11px] text-text-muted uppercase tracking-wide ml-auto">viendo</span>}
                </div>

                {q?.estado === 'completado' ? (
                  <>
                    <div className="mt-4 mb-1">
                      <span className="font-mono text-[11px] text-text-muted mr-1">S/</span>
                      <span className="font-display text-5xl font-extrabold tracking-tightest leading-none">
                        {q.costo_total?.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mb-1">todo incluido · IGV incluido</div>
                    {savings != null && (
                      <p className={`text-xs mb-4 flex items-center gap-1 ${isPremium ? 'text-text-secondary' : 'text-ok'}`}>
                        {isPremium
                          ? `+${S(savings)} vs básica`
                          : <><TrendingDown size={12} /> {S(savings)} menos que premium</>}
                      </p>
                    )}

                    <div className="h-px bg-black/8 mb-4" />

                    <ul className="space-y-2.5">
                      {q.detalles.slice(0, isPremium ? 6 : 5).map(d => (
                        <li key={d.id} className="flex gap-2.5 items-start text-sm">
                          <span className={`flex-shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center ${isPremium ? 'bg-accent-light text-accent' : 'bg-black/6 text-text-secondary'}`}>
                            <CheckCircle size={10} />
                          </span>
                          <span className="leading-relaxed text-text-primary capitalize">
                            {d.servicio}
                            <span className="font-mono text-xs text-text-secondary ml-2">
                              S/ {d.costo.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full mt-6 ${isPremium ? 'btn btn-primary' : 'btn btn-secondary'}`}
                      onClick={e => { e.stopPropagation(); if (!isActive && q) navigate(`/quotations/${q.id}`, { state: location.state }) }}
                    >
                      {isActive ? `Esta es tu propuesta ${nivel}` : `Ver propuesta ${nivel}`}
                      {!isActive && <ArrowRight size={14} />}
                    </button>
                  </>
                ) : q?.estado === 'error' ? (
                  <div className="flex items-center gap-2 text-danger text-sm mt-4">
                    <XCircle size={16} /> Presupuesto insuficiente
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-text-secondary text-sm mt-4">
                    <Loader2 size={14} className="animate-spin" /> Procesando...
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Paquete base INARI GROUP ── */}
      {isComplete && pkg && (
        <div className="glass mb-6 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
              <Package size={18} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-lg font-bold tracking-tight">
                  Paquete base: {pkg.name}
                </h3>
                <span className="font-mono font-semibold text-accent">
                  S/ {pkg.cost.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{
                /* content viene del backend cuando lo guardemos — mientras mostramos el nombre */
                'Infraestructura propia de INARI GROUP incluida en el total de la propuesta.'
              }</p>
            </div>
          </div>
          {pkg.exceeds_max_range && (
            <div className="flex items-center gap-2.5 mt-4 px-4 py-3 rounded-xl text-sm bg-warn/10 border border-warn/24 text-amber-700">
              <TriangleAlert size={15} className="flex-shrink-0 text-warn" />
              El número de invitados supera el rango máximo configurado. Se asignó el paquete más grande disponible. Consulta con el administrador para ampliar la capacidad.
            </div>
          )}
        </div>
      )}

      {/* ── Narrativa de propuesta (HU-03) ── */}
      {isComplete && (
        <div className="glass mb-6 p-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Sparkles size={15} className="text-accent" />
              <h3 className="font-display text-lg font-bold tracking-tight">Narrativa de propuesta</h3>
              {!editandoNarrativa && narrativa && (
                <span className="badge text-[10px]">Generada por IA</span>
              )}
            </div>
            {narrativa && !editandoNarrativa && (
              <button
                className="btn btn-ghost btn-sm text-xs flex items-center gap-1.5"
                onClick={() => setEditandoNarrativa(true)}
              >
                ✏️ Editar
              </button>
            )}
          </div>

          {narrativaError && !narrativa && (
            <div className="flex items-center gap-2.5 text-sm text-text-secondary py-2">
              <AlertCircle size={14} className="text-warn flex-shrink-0" />
              La narrativa no pudo generarse automáticamente. Puedes escribirla manualmente.
              <button
                className="btn btn-ghost btn-sm ml-auto text-xs"
                onClick={() => { setNarrativaError(false); setEditandoNarrativa(true) }}
              >
                Escribir narrativa
              </button>
            </div>
          )}

          {!editandoNarrativa && narrativa && (
            <p className="text-sm text-text-secondary leading-relaxed border-l-2 border-accent/30 pl-4 italic">
              {narrativa}
            </p>
          )}

          {editandoNarrativa && (
            <div className="animate-fade-in">
              <p className="text-xs text-text-secondary mb-3">Edita el texto de la propuesta:</p>
              <textarea
                className="input w-full resize-y text-sm leading-relaxed"
                rows={5}
                value={narrativa}
                onChange={e => setNarrativa(e.target.value)}
                placeholder="Escribe aquí la narrativa personalizada del evento..."
              />
              <div className="flex justify-end gap-2.5 mt-3">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setNarrativa(narrativaGuardada); setEditandoNarrativa(false) }}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setNarrativaGuardada(narrativa); setEditandoNarrativa(false); toast.success('Narrativa guardada') }}
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Proveedores (grid 2 columnas) ── */}
      {isComplete && quotation.detalles.length > 0 && (
        <div className="glass p-7 mb-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-2xl font-bold tracking-tight">Proveedores propuestos</h3>
              <p className="text-xs text-text-secondary mt-1">
                {canSeeProviders ? 'Puedes ver y cambiar proveedores.' : 'Los nombres se revelan al confirmar la propuesta.'}
              </p>
            </div>
            {!canSeeProviders && <span className="badge"><LockKeyhole size={11} /> Identidad protegida</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {quotation.detalles.map(d => (
              <div key={d.id}>
                <div className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(26,23,20,0.08)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide">{d.servicio}</span>
                    <span className="flex items-center gap-1 text-xs text-accent font-semibold">
                      <Star size={11} /> {(d.indice_calidad * 10).toFixed(1)}
                    </span>
                  </div>

                  <div className="text-sm text-text-secondary">
                    {canSeeProviders
                      ? d.proveedor
                      : <span className="text-text-muted italic">Proveedor seleccionado</span>}
                  </div>

                  <QualityBar value={d.indice_calidad} />

                  <div className="flex items-center justify-between border-t border-black/6 pt-2.5">
                    <span className="text-[11px] text-text-muted">Subtotal</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        S/ {d.costo.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                      </span>
                      {canSeeProviders && (
                        <button
                          onClick={() => setOpenAlternativesId(openAlternativesId === d.id ? null : d.id)}
                          className="p-1 rounded-md text-accent hover:bg-accent-light transition-colors"
                        >
                          <RefreshCw size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {canSeeProviders && openAlternativesId === d.id && (
                  <div className="glass p-4 mt-2 rounded-xl animate-slide-up">
                    <p className="font-display text-sm font-semibold mb-3">Alternativas · {d.servicio}</p>
                    <AlternativesPanel
                      quotationId={quotation.id}
                      detalleId={d.id}
                      currentProviderName={d.proveedor}
                      onSwap={(did, pid) => swapMutation.mutate({ detalleId: did, newProviderId: pid })}
                      isSwapping={swapMutation.isPending}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center border-t border-black/8 mt-5 pt-5">
            <p className="text-[11px] text-text-muted uppercase tracking-wide">
              Total propuesta {quotation.nivel}
            </p>
            <p className="font-display text-4xl font-extrabold tracking-tightest text-accent">
              {quotation.costo_total != null ? S(quotation.costo_total) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {quotation.estado === 'error' && (
        <div className="glass p-6 mb-6 border border-danger/20 bg-danger/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
              <XCircle size={18} />
            </div>
            <div>
              <p className="font-semibold mb-1">Presupuesto insuficiente</p>
              <p className="text-sm text-text-secondary">El presupuesto no cubre los servicios obligatorios. Usa "Ajustar" para modificarlo.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Historial ── */}
      {versionHistory.length > 0 && (
        <div className="glass p-6 mb-7">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <History size={15} className="text-accent" />
              <span className="font-semibold text-sm">Historial de versiones</span>
              <span className="badge badge-accent">{versionHistory.length} más</span>
            </div>
            {showHistory
              ? <ChevronUp size={15} className="text-text-secondary" />
              : <ChevronDown size={15} className="text-text-secondary" />}
          </button>

          {showHistory && (
            <div className="mt-4 flex flex-col gap-1 animate-fade-in">
              {versionHistory.map(q => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/quotations/${q.id}`)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer hover:bg-white/50 transition-colors"
                >
                  <span className="font-mono text-xs text-text-muted">v{q.version}</span>
                  {q.nivel === 'premium'
                    ? <span className="badge badge-accent">Premium</span>
                    : <span className="badge">Básica</span>}
                  <span className={`badge ${q.estado === 'completado' ? 'badge-success' : q.estado === 'error' ? 'badge-error' : 'badge-warning'}`}>
                    {q.estado === 'completado' ? 'Completado' : q.estado === 'error' ? 'Sin factibilidad' : 'Procesando'}
                  </span>
                  <div className="flex-1" />
                  {q.costo_total != null && (
                    <span className="font-mono font-semibold text-sm">{S(q.costo_total)}</span>
                  )}
                  <ChevronRight size={13} className="text-text-muted" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CTA final ── */}
      {isComplete && (
        <div className="flex justify-center mt-9">
          <button className="btn btn-primary btn-lg px-10" onClick={handleDownloadPdf}>
            <Download size={16} /> Descargar propuesta en PDF
          </button>
        </div>
      )}

      <ConfirmModal
        open={pendingReprocessData !== null}
        title="Crear nueva versión"
        message="Se generará una nueva versión con el presupuesto ajustado. La actual se conservará en el historial."
        confirmLabel="Crear nueva versión"
        onConfirm={() => { if (pendingReprocessData) reprocessMutation.mutate(pendingReprocessData); setPendingReprocessData(null) }}
        onCancel={() => setPendingReprocessData(null)}
      />
    </div>
  )
}

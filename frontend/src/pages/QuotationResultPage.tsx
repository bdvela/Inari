/**
 * Vista de resultado de cotización. CU-01 paso 10 + CU-02 ajuste/reproceso.
 */
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
import type { GenerateQuotationResult, AlternativeProvider, ChangeLogEntry } from '../types'
import ConfirmModal from '../components/shared/ConfirmModal'
import QualityBar from '../components/shared/QualityBar'
import { useAuth } from '../context/AuthContext'

const EVENT_LABELS: Record<string, string> = {
  boda: 'Boda', corporativo: 'Corporativo', cumpleanos: 'Cumpleaños',
  quinceanos: 'Quinceañera', conferencia: 'Conferencia', otro: 'Otro',
}

import type { StyleAnalysisResult as StyleAnalysis } from '../types'

const LUXURY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Muy sencillo',  color: '#8A8680' },
  2: { label: 'Económico',     color: '#6E6E73' },
  3: { label: 'Intermedio',    color: '#E8572A' },
  4: { label: 'Premium',       color: '#C94A1F' },
  5: { label: 'Ultra lujo',    color: '#a83010' },
}

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: { url: string; nombre: string }[]
  initialIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(initialIndex)
  const total = images.length
  const prev = () => setIdx(i => (i - 1 + total) % total)
  const next = () => setIdx(i => (i + 1) % total)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const img = images[idx]

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Cerrar */}
      <button
        onClick={onClose}
        style={{ position: 'fixed', top: 20, right: 24, zIndex: 10000 }}
        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl font-light transition-colors"
        aria-label="Cerrar"
      >
        ×
      </button>

      {/* Contador */}
      {total > 1 && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10000 }}
          className="text-white/50 text-xs tracking-widest"
        >
          {idx + 1} / {total}
        </div>
      )}

      {/* Flecha izquierda */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); prev() }}
          style={{ position: 'fixed', left: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 10000 }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl transition-colors"
          aria-label="Anterior"
        >
          ‹
        </button>
      )}

      {/* Imagen */}
      <div className="relative px-20" onClick={e => e.stopPropagation()}>
        <img
          key={img.url}
          src={img.url}
          alt={img.nombre}
          style={{ maxWidth: '80vw', maxHeight: '82vh' }}
          className="rounded-2xl object-contain shadow-2xl"
        />
        <p className="text-center text-white/40 text-xs mt-3 truncate">{img.nombre}</p>
      </div>

      {/* Flecha derecha */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); next() }}
          style={{ position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 10000 }}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl transition-colors"
          aria-label="Siguiente"
        >
          ›
        </button>
      )}
    </div>,
    document.body
  )
}

function StyleAnalysisCard({
  analysis,
  images = [],
}: {
  analysis: StyleAnalysis
  images?: { url: string; nombre: string }[]
}) {
  const lux = LUXURY_LABELS[analysis.luxury_level] ?? LUXURY_LABELS[3]
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  return (
    <div className="glass mb-6 p-7">
      {lightboxIdx !== null && (
        <ImageLightbox images={images} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      <div className="flex items-center gap-2.5 mb-5">
        <Sparkles size={15} className="text-accent" />
        <h3 className="font-display text-lg font-bold tracking-tight">Análisis de referencias de estilo</h3>
        <span className="badge text-[10px] ml-auto">
          Confianza {Math.round(analysis.confidence * 100)}%
        </span>
      </div>

      {/* Thumbnails de imágenes subidas */}
      {images.length > 0 && (
        <div className="flex gap-3 mb-5">
          {images.map((img, i) => (
            <button
              key={i}
              className="relative group cursor-zoom-in focus:outline-none"
              onClick={() => setLightboxIdx(i)}
              title="Ver en grande"
            >
              <img
                src={img.url}
                alt={img.nombre}
                className="w-24 h-24 rounded-xl object-cover border border-black/8 transition-transform group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium transition-opacity drop-shadow">⊕</span>
              </div>
            </button>
          ))}
          <div className="flex items-end pb-1">
            <span className="text-xs text-text-muted">
              {images.length} imagen{images.length > 1 ? 'es' : ''} analizada{images.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Izquierda: estilo + nivel + colores */}
        <div className="space-y-4">
          <div>
            <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2">Estilo detectado</p>
            <div className="flex items-center gap-3">
              <span className="font-display text-xl font-bold capitalize">{analysis.aesthetic_style}</span>
              <span className="badge text-[11px] font-semibold" style={{ color: lux.color, background: `${lux.color}15`, borderColor: `${lux.color}30` }}>
                {'★'.repeat(analysis.luxury_level)} {lux.label}
              </span>
            </div>
          </div>

          {analysis.dominant_colors.length > 0 && (
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2">Paleta de colores</p>
              <div className="flex flex-wrap gap-2">
                {analysis.dominant_colors.map(color => (
                  <span key={color} className="flex items-center gap-1.5 text-xs text-text-secondary px-2.5 py-1 rounded-lg border border-black/8 bg-white/60">
                    <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                      style={{ background: color.toLowerCase().includes('blanco') ? '#f8f6f0'
                        : color.toLowerCase().includes('negro') ? '#1a1714'
                        : color.toLowerCase().includes('dorado') ? '#C9A84C'
                        : color.toLowerCase().includes('rosado') || color.toLowerCase().includes('rosa') ? '#f4a0b0'
                        : color.toLowerCase().includes('verde') ? '#6a9e6a'
                        : color.toLowerCase().includes('azul') ? '#6a8ab0'
                        : color.toLowerCase().includes('rojo') ? '#c94a4a'
                        : color.toLowerCase().includes('crema') || color.toLowerCase().includes('marfil') ? '#f2efe9'
                        : color.toLowerCase().includes('gris') ? '#9a9590'
                        : '#E8572A' }} />
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.style_keywords.length > 0 && (
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2">Palabras clave</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.style_keywords.map(kw => (
                  <span key={kw} className="badge badge-neutral text-[11px]">{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Derecha: elementos + servicios */}
        <div className="space-y-4">
          {analysis.visual_elements.length > 0 && (
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2">Elementos decorativos detectados</p>
              <ul className="space-y-1.5">
                {analysis.visual_elements.map(el => (
                  <li key={el} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-accent mt-0.5 flex-shrink-0">◆</span> {el}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.suggested_services.length > 0 && (
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2">Servicios inferidos</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.suggested_services.map(svc => (
                  <span key={svc} className="badge badge-accent text-[11px] capitalize">{svc}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InferredServicesCard({
  inferred,
  styleAnalysis,
}: {
  inferred: string[]
  styleAnalysis: import('../types').StyleAnalysisResult | null
}) {
  const hasImages = (styleAnalysis?.confidence ?? 0) > 0

  return (
    <div className="glass mb-6 p-7">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-base">📷</span>
        <h3 className="font-display text-lg font-bold tracking-tight">Servicios detectados visualmente</h3>
        <span className="badge text-[10px] ml-auto">
          Inferidos de imágenes de referencia
        </span>
      </div>

      {!hasImages ? (
        <p className="text-sm text-text-secondary">
          El cliente no subió imágenes de referencia. Los servicios provienen únicamente
          de la descripción de texto y las reglas de negocio.
        </p>
      ) : (
        <div className="space-y-4">
          {inferred.length > 0 ? (
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-3">
                Añadidos al optimizer como opcionales
              </p>
              <div className="flex flex-wrap gap-2">
                {inferred.map(svc => (
                  <span key={svc} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(52,199,89,0.10)', color: '#1f7a3a', border: '1px solid rgba(52,199,89,0.24)' }}>
                    ✅ {svc}
                  </span>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-3">
                Confianza del análisis visual: {Math.round((styleAnalysis?.confidence ?? 0) * 100)}% · Umbral aplicado: 60%
              </p>
            </div>
          ) : (
            <div className="text-sm text-text-secondary space-y-1">
              <p>Se analizaron las imágenes pero no se añadieron servicios adicionales.</p>
              <p className="text-text-muted text-xs">
                Posibles razones: los servicios inferidos ya estaban declarados en texto,
                confianza {'<'} 60%, o sin proveedores disponibles.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
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

const ACCION_LABELS: Record<string, string> = {
  cotizacion_creada:  'Cotización creada',
  presupuesto_ajustado: 'Presupuesto ajustado',
  proveedor_cambiado: 'Proveedor cambiado',
  narrativa_editada:  'Narrativa editada',
  reproceso:          'Reproceso',
}

function ChangelogPanel({ entries }: { entries: ChangeLogEntry[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass mb-6 p-7">
      <button
        className="flex items-center gap-2.5 w-full text-left"
        onClick={() => setOpen(o => !o)}
      >
        <History size={15} className="text-accent" />
        <span className="font-display text-lg font-bold tracking-tight flex-1">Historial de cambios</span>
        <span className="text-xs text-text-muted">{entries.length} entrada{entries.length !== 1 ? 's' : ''}</span>
        {open ? <ChevronUp size={15} className="text-text-muted" /> : <ChevronDown size={15} className="text-text-muted" />}
      </button>

      {open && (
        <div className="mt-5 space-y-3">
          {entries.map(e => (
            <div key={e.id} className="flex gap-3 text-sm border-l-2 border-accent/20 pl-4 py-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-text-primary">{ACCION_LABELS[e.accion] ?? e.accion}</span>
                  <span className="badge text-[10px]">{e.usuario_rol}</span>
                </div>
                <p className="text-text-secondary text-xs">{e.usuario_nombre}</p>
                {(e.valor_anterior || e.valor_nuevo) && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-text-muted font-mono">
                    {e.valor_anterior && <span className="line-through opacity-60">{e.valor_anterior}</span>}
                    {e.valor_anterior && e.valor_nuevo && <ArrowRight size={10} />}
                    {e.valor_nuevo && <span className="text-ok font-semibold">{e.valor_nuevo}</span>}
                  </div>
                )}
              </div>
              <div className="text-xs text-text-muted whitespace-nowrap pt-0.5">
                {new Date(e.created_at).toLocaleString('es-PE', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
  const [pdfLoading, setPdfLoading]   = useState<'ejecutivo' | 'cliente' | null>(null)
  const [clientNivel, setClientNivel] = useState<'basico' | 'premium' | null>(null)

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

  const { data: changelog } = useQuery({
    queryKey: ['changelog', id],
    queryFn: () => quotationsApi.getChangelog(Number(id)),
    enabled: !!id && canSeeProviders,
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

  // useEffect DEBE estar antes de los early returns para no violar Rules of Hooks
  useEffect(() => {
    if (!quotation) return
    const isComp = quotation.estado === 'completado'
    if ((quotation as unknown as { narrativa?: string }).narrativa) {
      const n = (quotation as unknown as { narrativa: string }).narrativa
      setNarrativa(n)
      setNarrativaGuardada(n)
    } else if (isComp) {
      setNarrativaError(true)
    }
  }, [quotation?.id, quotation?.estado])  // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleDownloadPdf = async (version: 'ejecutivo' | 'cliente' = 'ejecutivo') => {
    setPdfLoading(version)
    try {
      await quotationsApi.downloadPdf(Number(id), version)
      toast.success(version === 'cliente' ? 'Versión cliente lista' : 'Propuesta lista')
    } catch {
      toast.error('Error al generar el documento')
    } finally {
      setPdfLoading(null)
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

  if (error || !quotation) {
    const is403 = (error as { response?: { status?: number } })?.response?.status === 403
    return (
      <div className="mesh min-h-screen p-10">
        <div className="glass p-16 text-center">
          <XCircle size={28} className="text-danger mx-auto mb-4" />
          <p className="font-semibold mb-1.5">
            {is403 ? 'No tienes acceso a esta cotización' : 'No se pudo cargar la cotización'}
          </p>
          <p className="text-sm text-text-secondary mb-6">
            {is403
              ? 'Esta propuesta pertenece a otro cliente.'
              : 'Intenta nuevamente o regresa al dashboard'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  const isComplete = quotation.estado === 'completado'
  const sibling    = pair?.sibling ?? null
  const [basic, premium] = quotation.nivel === 'basico' ? [quotation, sibling] : [sibling, quotation]
  const savings = (basic?.costo_total != null && premium?.costo_total != null)
    ? premium.costo_total - basic.costo_total : null
  const S = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`

  const pkg = quotation.package_selected ?? null

  // ── CLIENT VIEW ──────────────────────────────────────────────
  if (!canSeeProviders) {
    const activeNivel  = (clientNivel ?? quotation.nivel) as 'basico' | 'premium'
    const displayedQ   = (activeNivel === quotation.nivel ? quotation : sibling) ?? quotation
    const hasBoth      = basic?.estado === 'completado' && premium?.estado === 'completado'
    const services     = displayedQ.detalles ?? []
    const qNarrativa   = (displayedQ as unknown as { narrativa?: string }).narrativa ?? narrativa
    const costPerGuest = (displayedQ.costo_total && quotation.num_invitados)
      ? Math.round(displayedQ.costo_total / quotation.num_invitados) : null
    const styleInfo    = quotation.style_analysis
    const refImages    = quotation.imagenes_referencia ?? []
    const hasStyle     = styleInfo && (styleInfo.confidence ?? 0) > 0.2
    const obligatorios = services.filter(d => d.es_obligatorio)
    const adicionales  = services.filter(d => !d.es_obligatorio)
    const savingsDiff  = hasBoth && basic?.costo_total && premium?.costo_total
      ? premium.costo_total - basic.costo_total : null

    return (
      <div className="mesh min-h-screen" style={{ padding: 'clamp(16px,4vw,48px) clamp(12px,4vw,40px) 64px' }}>
        <div className="mesh-blob" />

        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: 24 }}>
          ← Mis propuestas
        </button>

        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Hero */}
          <div className="glass-raised animate-fade-in" style={{ borderRadius: 24, padding: 'clamp(24px,4vw,40px)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#E8572A,#FF8C42)' }} />
            <div className="flex items-start justify-between gap-3 flex-wrap" style={{ marginBottom: 4 }}>
              <p className="page-eyebrow" style={{ margin: 0 }}>
                {EVENT_LABELS[quotation.evento_tipo ?? ''] ?? 'Evento'}
                {quotation.evento_fecha ? ` · ${new Date(quotation.evento_fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
              </p>
              {isComplete && <span className="badge badge-success"><CheckCircle size={10} /> Lista</span>}
            </div>
            <h1 className="font-display font-bold tracking-tight text-text-primary"
              style={{ fontSize: 'clamp(36px,7vw,56px)', lineHeight: 1, margin: '4px 0 8px' }}>
              {EVENT_LABELS[quotation.evento_tipo ?? ''] ?? 'Tu evento'}
            </h1>
            {(quotation.num_invitados || quotation.estilo) && (
              <p className="text-text-secondary" style={{ fontSize: 15, marginBottom: 24 }}>
                {[quotation.num_invitados && `${quotation.num_invitados} invitados`, quotation.estilo].filter(Boolean).join(' · ')}
              </p>
            )}
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
              onClick={() => handleDownloadPdf('cliente')} disabled={!!pdfLoading || !isComplete}>
              {pdfLoading === 'cliente'
                ? <><Loader2 size={16} className="animate-spin" /> Generando propuesta...</>
                : <><Download size={16} /> Descargar propuesta en PDF</>}
            </button>
          </div>

          {/* Metric mini-cards */}
          {isComplete && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
              {[
                { label: 'Servicios', value: String(services.length + (pkg ? 1 : 0)), sub: 'incluidos' },
                ...(costPerGuest ? [{ label: 'Por invitado', value: `S/ ${costPerGuest.toLocaleString('es-PE')}`, sub: 'estimado' }] : []),
                ...(quotation.presupuesto_maximo ? [{ label: 'Tu presupuesto', value: `S/ ${Math.round(quotation.presupuesto_maximo / 1000)}k`, sub: 'indicado' }] : []),
              ].map(s => (
                <div key={s.label} className="glass" style={{ borderRadius: 14, padding: 'clamp(10px,2vw,16px) clamp(12px,2vw,18px)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--color-text-muted)', margin: '0 0 5px' }}>{s.label}</p>
                  <p className="font-mono font-bold text-text-primary" style={{ fontSize: 20, lineHeight: 1, margin: '0 0 3px' }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{s.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Style & images */}
          {isComplete && (hasStyle || refImages.length > 0) && (
            <div className="glass" style={{ borderRadius: 18, padding: 'clamp(16px,3vw,22px)' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                <Sparkles size={13} className="text-accent" />
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--color-text-muted)', margin: 0 }}>
                  Análisis de estilo · IA
                </p>
              </div>
              {refImages.length > 0 && (
                <div className="flex flex-wrap gap-2" style={{ marginBottom: hasStyle ? 12 : 0 }}>
                  {refImages.map((img, i) => (
                    <img key={i} src={img.url} alt={img.nombre}
                      style={{ width: 'clamp(56px,14vw,76px)', height: 'clamp(56px,14vw,76px)', borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(26,23,20,0.08)', flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ))}
                </div>
              )}
              {hasStyle && (
                <div className="flex items-center flex-wrap gap-2">
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{styleInfo!.aesthetic_style}</span>
                  {styleInfo!.style_keywords.slice(0, 4).map(kw => (
                    <span key={kw} className="badge badge-neutral" style={{ fontSize: 11, textTransform: 'capitalize' }}>{kw}</span>
                  ))}
                </div>
              )}
              {(quotation.image_inferred_services ?? []).length > 0 && (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 10, marginBottom: 0 }}>
                  ✨ Detectamos y agregamos: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{quotation.image_inferred_services.join(', ')}</span>
                </p>
              )}
            </div>
          )}

          {/* Nivel toggle */}
          {isComplete && hasBoth && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
              {(['basico', 'premium'] as const).map(nivel => {
                const q = nivel === 'basico' ? basic : premium
                if (!q || q.estado !== 'completado') return null
                const isActive = activeNivel === nivel
                return (
                  <button key={nivel} onClick={() => setClientNivel(nivel)} className="glass text-left"
                    style={{ flex: '1 1 140px', borderRadius: 16, padding: 'clamp(14px,2vw,20px) clamp(16px,2vw,22px)',
                      border: `2px solid ${isActive ? 'rgba(232,87,42,0.45)' : 'transparent'}`,
                      background: isActive ? 'rgba(232,87,42,0.05)' : undefined, transition: 'all 0.15s' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: 0, color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                        {nivel === 'premium' ? '★ Premium' : 'Básica'}
                      </p>
                      {isActive && <CheckCircle size={13} className="text-accent flex-shrink-0" />}
                    </div>
                    <p className="font-mono font-bold text-text-primary" style={{ fontSize: 'clamp(18px,4vw,24px)', lineHeight: 1, margin: '0 0 6px' }}>
                      S/ {q.costo_total?.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                    </p>
                    {savingsDiff != null && (
                      <p style={{ fontSize: 11, margin: 0, lineHeight: 1.3, color: nivel === 'basico' ? '#1f7a3a' : 'var(--color-text-muted)' }}>
                        {nivel === 'basico' ? `Ahorras S/ ${savingsDiff.toLocaleString('es-PE', { minimumFractionDigits: 0 })}` : `+S/ ${savingsDiff.toLocaleString('es-PE', { minimumFractionDigits: 0 })} vs Básica`}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Error */}
          {quotation.estado === 'error' && (
            <div className="glass" style={{ borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(255,59,48,0.2)', background: 'rgba(255,59,48,0.04)' }}>
              <p className="font-semibold" style={{ marginBottom: 6 }}>Presupuesto insuficiente</p>
              <p className="text-text-secondary" style={{ fontSize: 14, margin: 0 }}>No fue posible cubrir todos los servicios. Contacta al equipo de INARI.</p>
            </div>
          )}

          {/* Services */}
          {isComplete && services.length > 0 && (
            <div className="glass" style={{ borderRadius: 20, padding: 'clamp(16px,4vw,26px)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--color-text-muted)', margin: '0 0 16px' }}>
                Desglose de servicios
              </p>

              {obligatorios.length > 0 && (
                <>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--color-text-muted)', margin: '0 0 6px' }}>Principales</p>
                  {obligatorios.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3"
                      style={{ padding: '10px 0', borderBottom: i < obligatorios.length - 1 ? '1px solid var(--color-border)' : undefined }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: 'rgba(232,87,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={11} className="text-accent" />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: 'var(--color-text-primary)' }}>{d.servicio}</span>
                      <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, flexShrink: 0, color: 'var(--color-text-secondary)' }}>S/ {d.costo.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </>
              )}

              {adicionales.length > 0 && (
                <div style={{ marginTop: obligatorios.length > 0 ? 14 : 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--color-text-muted)', margin: '0 0 6px' }}>Adicionales</p>
                  {adicionales.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3"
                      style={{ padding: '10px 0', borderBottom: i < adicionales.length - 1 ? '1px solid var(--color-border)' : undefined }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: 'rgba(26,23,20,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={11} className="text-text-muted" />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 400, textTransform: 'capitalize', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: 'var(--color-text-secondary)' }}>{d.servicio}</span>
                      <span className="font-mono" style={{ fontSize: 13, flexShrink: 0, color: 'var(--color-text-muted)' }}>S/ {d.costo.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              )}

              {pkg && (
                <div className="flex items-center gap-3" style={{ padding: '10px 0', borderTop: '1px solid var(--color-border)', marginTop: 4 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: 'rgba(232,87,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={11} className="text-accent" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, flex: 1, color: 'var(--color-text-primary)' }}>Infraestructura INARI GROUP</span>
                  <span className="badge badge-accent" style={{ fontSize: 10 }}>Incluido</span>
                </div>
              )}

              <div className="flex items-center justify-between" style={{ borderTop: '2px solid var(--color-text-primary)', marginTop: 18, paddingTop: 18 }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '0 0 2px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600 }}>
                    Total {activeNivel === 'premium' ? 'Premium' : 'Básica'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>IGV incluido</p>
                </div>
                <span className="font-mono font-bold text-text-primary" style={{ fontSize: 30, lineHeight: 1 }}>
                  S/ {displayedQ.costo_total?.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}

          {/* Narrative */}
          {isComplete && qNarrativa && (
            <div className="glass" style={{ borderRadius: 18, padding: 'clamp(16px,4vw,24px)' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                <Sparkles size={13} className="text-accent" />
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--color-text-muted)', margin: 0 }}>
                  Descripción de tu propuesta
                </p>
              </div>
              <p className="text-text-secondary" style={{ fontSize: 14, lineHeight: 1.75, margin: 0, borderLeft: '3px solid rgba(232,87,42,0.35)', paddingLeft: 14, fontStyle: 'italic' }}>
                {qNarrativa}
              </p>
            </div>
          )}

        </div>

        <ConfirmModal
          open={pendingReprocessData !== null}
          title="Crear nueva versión"
          message="Se generará una nueva versión con el presupuesto ajustado."
          confirmLabel="Crear nueva versión"
          onConfirm={() => { if (pendingReprocessData) reprocessMutation.mutate(pendingReprocessData); setPendingReprocessData(null) }}
          onCancel={() => setPendingReprocessData(null)}
        />
      </div>
    )
  }

  // ── STAFF VIEW ───────────────────────────────────────────────
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
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleDownloadPdf(canSeeProviders ? 'ejecutivo' : 'cliente')}
              disabled={!!pdfLoading}
            >
              {pdfLoading ? <><Loader2 size={13} className="animate-spin" /> Generando...</> : <><Download size={14} /> Descargar PDF</>}
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

      {/* ── Mensaje cliente: servicios detectados de imágenes ── */}
      {isComplete && !canSeeProviders && (quotation.image_inferred_services ?? []).length > 0 && (
        <div className="glass mb-6 px-6 py-4 flex items-start gap-3 animate-fade-in"
          style={{ border: '1px solid rgba(52,199,89,0.24)', background: 'rgba(52,199,89,0.06)' }}>
          <span className="text-ok text-lg flex-shrink-0">✨</span>
          <div>
            <p className="text-sm font-semibold text-ok mb-1">Personalizamos tu propuesta según tus imágenes</p>
            <p className="text-sm text-text-secondary">
              Detectamos que podrías necesitar:{' '}
              <span className="font-medium text-text-primary capitalize">
                {quotation.image_inferred_services.join(', ')}
              </span>.
              {' '}Estos servicios fueron incluidos según disponibilidad y presupuesto.
            </p>
          </div>
        </div>
      )}

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

      {/* ── Análisis de estilo visual ── */}
      {isComplete && quotation.style_analysis && (quotation.style_analysis.confidence ?? 0) > 0.2 && (
        <StyleAnalysisCard
          analysis={quotation.style_analysis}
          images={quotation.imagenes_referencia ?? []}
        />
      )}

      {/* ── Servicios detectados visualmente (ejecutivo) ── */}
      {isComplete && canSeeProviders && (
        <InferredServicesCard
          inferred={quotation.image_inferred_services ?? []}
          styleAnalysis={quotation.style_analysis}
        />
      )}

      {/* ── Narrativa de propuesta (HU-03) — solo visible si existe narrativa guardada ── */}
      {isComplete && (narrativa || editandoNarrativa) && (
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

      {/* ── Historial de cambios (solo ejecutivo/admin) ── */}
      {isComplete && canSeeProviders && changelog && changelog.length > 0 && (
        <ChangelogPanel entries={changelog} />
      )}

      {/* ── CTA final ── */}
      {isComplete && (
        <div className="flex justify-center gap-3 mt-9">
          {canSeeProviders ? (
            <>
              <button
                className="btn btn-primary btn-lg px-8"
                onClick={() => handleDownloadPdf('ejecutivo')}
                disabled={!!pdfLoading}
              >
                {pdfLoading === 'ejecutivo'
                  ? <><Loader2 size={16} className="animate-spin" /> Generando...</>
                  : <><Download size={16} /> PDF interno</>}
              </button>
              <button
                className="btn btn-ghost btn-lg px-8"
                onClick={() => handleDownloadPdf('cliente')}
                disabled={!!pdfLoading}
              >
                {pdfLoading === 'cliente'
                  ? <><Loader2 size={16} className="animate-spin" /> Generando...</>
                  : <><Download size={16} /> PDF para cliente</>}
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary btn-lg px-10"
              onClick={() => handleDownloadPdf('cliente')}
              disabled={!!pdfLoading}
            >
              {pdfLoading
                ? <><Loader2 size={16} className="animate-spin" /> Generando propuesta...</>
                : <><Download size={16} /> Descargar propuesta en PDF</>}
            </button>
          )}
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

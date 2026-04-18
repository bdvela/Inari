/**
 * Vista de resultado de cotización. CU-01 paso 10 + CU-02 ajuste/reproceso.
 * Incluye: swap interactivo de proveedores, comparación básica/premium, descarga PDF.
 */
import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import React from 'react'
import {
  Download, CheckCircle, XCircle, Star, DollarSign,
  Loader2, RefreshCw, ChevronDown, ChevronUp, AlertCircle,
  ArrowUpDown, TrendingUp, TrendingDown, Minus, BarChart2,
} from 'lucide-react'
import { toast } from 'sonner'
import { quotationsApi } from '../services/api'
import type { GenerateQuotationResult, AlternativeProvider } from '../types'

function QualityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-orange-400'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-700 w-12 text-right tabular-nums">{pct}%</span>
    </div>
  )
}

function DeltaBadge({ value, unit = '' }: { value: number; unit?: string }) {
  if (Math.abs(value) < 0.001) return <span className="text-gray-300 text-xs flex items-center gap-0.5"><Minus size={10} /> igual</span>
  if (value > 0) return (
    <span className="text-red-500 text-xs flex items-center gap-0.5 font-medium">
      <TrendingUp size={10} /> +{unit}{value.toLocaleString('es-PE')}
    </span>
  )
  return (
    <span className="text-emerald-600 text-xs flex items-center gap-0.5 font-medium">
      <TrendingDown size={10} /> {unit}{value.toLocaleString('es-PE')}
    </span>
  )
}

function AlternativesPanel({
  quotationId,
  detalleId,
  onSwap,
  isSwapping,
}: {
  quotationId: number
  detalleId: number
  onSwap: (detalleId: number, newProviderId: number) => void
  isSwapping: boolean
}) {
  const { data: alternatives, isLoading } = useQuery({
    queryKey: ['alternatives', quotationId, detalleId],
    queryFn: () => quotationsApi.getAlternatives(quotationId, detalleId),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-gray-400 text-sm">
        <Loader2 size={14} className="animate-spin" />
        Buscando alternativas...
      </div>
    )
  }

  if (!alternatives || alternatives.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No hay proveedores alternativos para este servicio
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alternatives.map((alt: AlternativeProvider) => (
        <div
          key={alt.id}
          className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-accent-200 hover:shadow-sm transition-all duration-200"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{alt.nombre}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-gray-500 text-xs tabular-nums">
                S/. {alt.costo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
              <DeltaBadge value={alt.delta_costo} unit="S/. " />
              <span className="text-gray-200">|</span>
              <span className="text-gray-400 text-xs">{(alt.indice_calidad * 100).toFixed(0)}% calidad</span>
              <DeltaBadge value={Number((alt.delta_quality * 100).toFixed(1))} unit="%" />
            </div>
          </div>
          <button
            onClick={() => onSwap(detalleId, alt.id)}
            disabled={isSwapping}
            className="ml-4 flex-shrink-0 btn-primary px-4 py-2 text-xs"
          >
            {isSwapping ? <Loader2 size={12} className="animate-spin" /> : 'Seleccionar'}
          </button>
        </div>
      ))}
    </div>
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
  const generationResult = location.state?.result as GenerateQuotationResult | undefined

  const [showReprocess, setShowReprocess] = useState(false)
  const [reprocessError, setReprocessError] = useState<string | null>(null)
  const [openAlternativesId, setOpenAlternativesId] = useState<number | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  const { data: quotation, isLoading, error } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationsApi.getById(Number(id)),
    enabled: !!id,
    refetchInterval: (q) =>
      q.state.data?.estado === 'procesando' ? 2000 : false,
  })

  const { data: pair, isLoading: pairLoading } = useQuery({
    queryKey: ['pair', id],
    queryFn: () => quotationsApi.getPair(Number(id)),
    enabled: !!id && showComparison,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReprocessForm>({
    resolver: zodResolver(reprocessSchema),
    defaultValues: { incluir_opcionales: true },
  })

  const reprocessMutation = useMutation({
    mutationFn: (data: ReprocessForm) =>
      quotationsApi.reprocess(quotation!.evento_id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Cotización reprocesada — nueva versión creada')
      const targetId = result.basica_factible
        ? result.quotation_basica_id
        : result.quotation_premium_id
      navigate(`/quotations/${targetId}`, { state: { result } })
    },
    onError: () => {
      const msg = 'Error al reprocesar. Verifica el presupuesto e intenta nuevamente.'
      setReprocessError(msg)
      toast.error(msg)
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
      toast.success('Proveedor actualizado correctamente')
    },
    onError: () => toast.error('Error al cambiar proveedor'),
  })

  const handleDownloadPdf = async () => {
    try {
      await quotationsApi.downloadPdf(Number(id))
      toast.success('PDF descargado')
    } catch {
      toast.error('Error al descargar el PDF')
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin text-accent-500 mx-auto mb-3" size={36} />
          <p className="text-sm text-gray-400">Cargando cotización...</p>
        </div>
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <div className="p-8">
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-red-400" size={28} />
          </div>
          <p className="text-gray-600 font-medium">No se pudo cargar la cotización</p>
          <p className="text-gray-400 text-sm mt-1">Intenta nuevamente o regresa al dashboard</p>
        </div>
      </div>
    )
  }

  const isComplete = quotation.estado === 'completado'

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="section-title">
              Cotización #{quotation.id}
            </h1>
            {quotation.nivel === 'premium' ? (
              <span className="badge-premium">Premium</span>
            ) : (
              <span className="badge-info">Básica</span>
            )}
            {isComplete ? (
              <span className="badge-success">
                <CheckCircle size={11} />
                Completado
              </span>
            ) : quotation.estado === 'error' ? (
              <span className="badge-error">
                <XCircle size={11} />
                Error
              </span>
            ) : (
              <span className="badge-warning">Procesando</span>
            )}
          </div>
          <p className="text-gray-400 text-sm">Versión {quotation.version}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isComplete && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <BarChart2 size={15} />
              {showComparison ? 'Ocultar' : 'Comparar'}
            </button>
          )}
          <button
            onClick={() => setShowReprocess(!showReprocess)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={15} />
            Ajustar
          </button>
          {isComplete && (
            <button onClick={handleDownloadPdf} className="btn-primary flex items-center gap-2 text-sm">
              <Download size={16} />
              PDF
            </button>
          )}
        </div>
      </div>

      {/* Reprocess panel */}
      {showReprocess && (
        <div className="card mb-6 border border-accent-100 bg-accent-50/20 animate-slide-up">
          <h3 className="font-semibold text-gray-900 mb-1">Ajustar presupuesto</h3>
          <p className="text-sm text-gray-400 mb-5">
            Crea una nueva versión con parámetros ajustados. La versión anterior se conserva.
          </p>
          <form
            onSubmit={handleSubmit((data) => {
              setReprocessError(null)
              reprocessMutation.mutate(data)
            })}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nuevo presupuesto (S/.)</label>
                <input
                  type="number"
                  {...register('presupuesto_maximo')}
                  className="input-field"
                  min={100}
                  step={500}
                  placeholder="ej. 18000"
                />
                {errors.presupuesto_maximo && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.presupuesto_maximo.message}</p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="incluir_opcionales"
                  {...register('incluir_opcionales')}
                  className="w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500"
                />
                <label htmlFor="incluir_opcionales" className="text-sm text-gray-600">
                  Incluir servicios opcionales
                </label>
              </div>
            </div>

            {reprocessError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100">
                <AlertCircle size={16} />
                {reprocessError}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={reprocessMutation.isPending}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {reprocessMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Reprocesando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Generar nueva versión
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary cards */}
      {isComplete && (
        <div className="grid grid-cols-2 gap-5 mb-8">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center">
                <DollarSign className="text-accent-500" size={22} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Costo Total</p>
                <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                  S/. {quotation.costo_total?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Star className="text-emerald-500" size={22} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Score de Calidad</p>
                <QualityBar score={quotation.quality_score ?? 0} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pair comparison */}
      {showComparison && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <BarChart2 size={16} className="text-gray-400" />
            Comparación Básica vs Premium
          </h3>
          {pairLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : pair?.sibling ? (
            <div className="grid grid-cols-2 gap-4">
              {[pair.current, pair.sibling]
                .sort((a) => (a.nivel === 'basico' ? -1 : 1))
                .map((q) => {
                  const isCurrent = q.id === quotation.id
                  return (
                    <div
                      key={q.id}
                      onClick={() => !isCurrent && navigate(`/quotations/${q.id}`)}
                      className={`p-5 rounded-2xl border-2 transition-all duration-200 ${
                        isCurrent
                          ? q.nivel === 'premium'
                            ? 'border-amber-300 bg-amber-50/50'
                            : 'border-blue-300 bg-blue-50/50'
                          : 'border-gray-100 hover:border-gray-200 cursor-pointer hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        {q.nivel === 'premium' ? <span className="badge-premium">Premium</span> : <span className="badge-info">Básica</span>}
                        {isCurrent && <span className="text-[10px] text-gray-400 font-medium">(actual)</span>}
                      </div>
                      {q.estado === 'completado' ? (
                        <>
                          <p className="text-2xl font-bold text-gray-900 mb-1 tabular-nums">
                            S/. {q.costo_total?.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Star size={12} className="text-amber-400" fill="currentColor" />
                            {((q.quality_score ?? 0) * 100).toFixed(0)}% calidad
                          </div>
                          {q.detalles.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                              {q.detalles.slice(0, 4).map((d) => (
                                <div key={d.id} className="flex justify-between text-xs">
                                  <span className="truncate capitalize text-gray-500">{d.servicio}</span>
                                  <span className="ml-2 flex-shrink-0 font-medium text-gray-700 tabular-nums">
                                    S/. {d.costo.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                                  </span>
                                </div>
                              ))}
                              {q.detalles.length > 4 && (
                                <p className="text-xs text-gray-300">+{q.detalles.length - 4} más</p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                          <XCircle size={14} />
                          Presupuesto insuficiente
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              No se encontró la cotización complementaria
            </div>
          )}
        </div>
      )}

      {/* Generation result links */}
      {generationResult && !showComparison && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Versiones generadas</h3>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => navigate(`/quotations/${generationResult.quotation_basica_id}`, { state: { result: generationResult } })}
              className={`p-4 rounded-xl border-2 cursor-pointer hover:shadow-sm transition-all ${
                quotation.nivel === 'basico' ? 'border-blue-300 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {generationResult.basica_factible
                  ? <CheckCircle size={16} className="text-emerald-500" />
                  : <XCircle size={16} className="text-red-400" />}
                <span className="text-sm font-semibold">Básica</span>
              </div>
              {generationResult.basica_costo != null ? (
                <p className="text-lg font-bold text-gray-900 tabular-nums">
                  S/. {generationResult.basica_costo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              ) : (
                <p className="text-xs text-red-500">Presupuesto insuficiente</p>
              )}
            </div>

            <div
              onClick={() => navigate(`/quotations/${generationResult.quotation_premium_id}`, { state: { result: generationResult } })}
              className={`p-4 rounded-xl border-2 cursor-pointer hover:shadow-sm transition-all ${
                quotation.nivel === 'premium' ? 'border-amber-300 bg-amber-50/50' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {generationResult.premium_factible
                  ? <CheckCircle size={16} className="text-emerald-500" />
                  : <XCircle size={16} className="text-red-400" />}
                <span className="text-sm font-semibold">Premium</span>
              </div>
              {generationResult.premium_costo != null ? (
                <p className="text-lg font-bold text-gray-900 tabular-nums">
                  S/. {generationResult.premium_costo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              ) : (
                <p className="text-xs text-red-500">Presupuesto insuficiente</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Services table with swap */}
      {isComplete && quotation.detalles.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100/80 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Servicios seleccionados</h3>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <ArrowUpDown size={11} />
              Haz clic en "Alternativas" para cambiar un proveedor
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100/80 bg-surface-50/50">
                <th className="text-left px-6 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Servicio</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Proveedor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Tipo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Calidad</th>
                <th className="text-right px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Costo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {quotation.detalles.map((d) => (
                <React.Fragment key={d.id}>
                  <tr className="border-b border-gray-50 hover:bg-surface-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium capitalize text-gray-900">{d.servicio}</td>
                    <td className="px-4 py-3.5 text-gray-600">{d.proveedor}</td>
                    <td className="px-4 py-3.5">
                      {d.es_obligatorio ? (
                        <span className="badge-error text-[10px]">Obligatorio</span>
                      ) : (
                        <span className="badge bg-gray-50 text-gray-500 border border-gray-100 text-[10px]">Opcional</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs text-gray-500 tabular-nums font-medium">
                        {(d.indice_calidad * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900 tabular-nums">
                      S/. {d.costo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setOpenAlternativesId(openAlternativesId === d.id ? null : d.id)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 font-medium ${
                          openAlternativesId === d.id
                            ? 'bg-accent-50 border-accent-200 text-accent-600'
                            : 'border-gray-200 text-gray-400 hover:border-accent-200 hover:text-accent-500'
                        }`}
                      >
                        <RefreshCw size={11} />
                        {openAlternativesId === d.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </td>
                  </tr>
                  {openAlternativesId === d.id && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <div className="mx-4 mb-3 mt-1 p-4 bg-surface-50 rounded-xl border border-gray-100 animate-slide-up">
                          <p className="text-[10px] font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                            Alternativas para {d.servicio}
                          </p>
                          <AlternativesPanel
                            quotationId={quotation.id}
                            detalleId={d.id}
                            onSwap={(detalleId, newProviderId) =>
                              swapMutation.mutate({ detalleId, newProviderId })
                            }
                            isSwapping={swapMutation.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-surface-50/30">
                <td colSpan={4} className="px-6 py-4 font-bold text-gray-900">Total</td>
                <td className="px-4 py-4 text-right font-bold text-xl text-accent-500 tabular-nums">
                  S/. {quotation.costo_total?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Error state */}
      {quotation.estado === 'error' && (
        <div className="card border border-red-100 bg-red-50/30 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <XCircle className="text-red-400" size={22} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Presupuesto insuficiente</p>
              <p className="text-sm text-gray-500 mt-0.5">
                El presupuesto no cubre los servicios obligatorios. Usa "Ajustar" para aumentarlo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

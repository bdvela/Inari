/**
 * Inspección de logs del motor de optimización — solo ADMIN.
 * Tabla paginada con filtros + modal de detalle con JSON completo.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Loader2, Search, ChevronLeft, ChevronRight,
  X, Copy, Check, FileJson, Zap, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminApi, type LogFilters } from '../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function AlgoBadge({ algo }: { algo: string }) {
  const isILP = algo === 'ILP'
  return (
    <span
      className={`badge text-[10px] font-semibold ${
        isILP ? 'badge-accent' : 'badge-neutral'
      }`}
    >
      {algo}
    </span>
  )
}

function FeasibleBadge({ ok }: { ok: boolean }) {
  return ok
    ? <span className="badge badge-success text-[10px]">Factible</span>
    : <span className="badge badge-error text-[10px]">Infeasible</span>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function JsonBlock({ label, data }: { label: string; data: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false)
  const text = JSON.stringify(data, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success(`${label} copiado`)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
          {label}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          {copied ? <Check size={12} className="text-ok" /> : <Copy size={12} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre
        className="flex-1 overflow-auto text-xs leading-relaxed rounded-xl p-4 bg-bg-deep text-text-cream font-mono"
        style={{ maxHeight: 340 }}
      >
        {text}
      </pre>
    </div>
  )
}

function DetailModal({
  logId,
  onClose,
}: {
  logId: number
  onClose: () => void
}) {
  const { data: log, isLoading } = useQuery({
    queryKey: ['log-detail', logId],
    queryFn: () => adminApi.getLogDetail(logId),
  })

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      className="flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-raised rounded-2xl flex flex-col animate-slide-up"
        style={{ width: '100%', maxWidth: 860, maxHeight: '90vh', padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-0.5">
              Log de optimización
            </p>
            <h2 className="font-display text-xl font-bold">#{logId}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/8 text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        ) : log ? (
          <>
            {/* Metadata chips */}
            <div className="flex flex-wrap gap-2 mb-5 shrink-0">
              <AlgoBadge algo={log.algoritmo_usado} />
              <FeasibleBadge ok={log.es_factible} />
              <span className="badge badge-neutral text-[10px]">
                <Zap size={9} /> {log.duracion_ms} ms
              </span>
              <span className="badge badge-neutral text-[10px]">{formatDate(log.created_at)}</span>
            </div>

            {/* JSON panels */}
            <div className="flex gap-4 min-h-0 flex-1 overflow-hidden">
              <JsonBlock label="Input" data={log.input_json} />
              <JsonBlock label="Output" data={log.output_json} />
            </div>
          </>
        ) : (
          <p className="text-text-secondary text-sm">No se pudo cargar el log.</p>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function AdminOptimizationLogsPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<LogFilters>({ page: 1, page_size: PAGE_SIZE })
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null)

  // Local filter state (applied on submit)
  const [algFilter, setAlgFilter]   = useState('')
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')
  const [cotIdInput, setCotIdInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['optimization-logs', filters],
    queryFn: () => adminApi.getLogs(filters),
  })

  const applyFilters = () => {
    const next: LogFilters = { page: 1, page_size: PAGE_SIZE }
    if (algFilter)    next.algoritmo     = algFilter
    if (dateFrom)     next.fecha_desde   = `${dateFrom}T00:00:00`
    if (dateTo)       next.fecha_hasta   = `${dateTo}T23:59:59`
    if (cotIdInput)   next.cotizacion_id = parseInt(cotIdInput)
    setFilters(next)
  }

  const clearFilters = () => {
    setAlgFilter(''); setDateFrom(''); setDateTo(''); setCotIdInput('')
    setFilters({ page: 1, page_size: PAGE_SIZE })
  }

  const goPage = (p: number) => setFilters(f => ({ ...f, page: p }))

  const currentPage = filters.page ?? 1
  const totalPages  = data?.pages ?? 1

  return (
    <div className="pt-10 px-8 pb-12 max-w-[1100px] mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-8">
        <p className="text-accent/70 text-[10px] uppercase tracking-widest font-semibold mb-1">
          Administración
        </p>
        <h1 className="font-display text-3xl text-text-primary font-bold flex items-center gap-3">
          <FileJson size={26} className="text-accent" />
          Logs de optimización
        </h1>
        <p className="section-subtitle mt-1.5">
          {data ? `${data.total} logs totales` : 'Historial de ejecuciones del motor de optimización.'}
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[140px]">
          <label className="label">Algoritmo</label>
          <select
            className="input-field"
            value={algFilter}
            onChange={e => setAlgFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="ILP">ILP</option>
            <option value="GREEDY">GREEDY</option>
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="label">Desde</label>
          <input
            type="date" className="input-field"
            value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="label">Hasta</label>
          <input
            type="date" className="input-field"
            value={dateTo} onChange={e => setDateTo(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="label">Cotización ID</label>
          <input
            type="number" className="input-field"
            placeholder="ej. 42"
            value={cotIdInput} onChange={e => setCotIdInput(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={applyFilters} className="btn-primary flex items-center gap-1.5">
            <Search size={14} /> Filtrar
          </button>
          <button onClick={clearFilters} className="btn-secondary flex items-center gap-1.5">
            <X size={14} /> Limpiar
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-accent" size={28} />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="card text-center py-20">
          <FileJson size={32} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">No hay logs que coincidan con los filtros.</p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg/80 border-b border-border">
                  {['ID', 'Cotización', 'Algoritmo', 'Factible', 'Duración', 'Fecha', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-text-secondary font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map(log => (
                  <tr
                    key={log.id}
                    className="border-b border-border last:border-0 hover:bg-accent-light/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLogId(log.id)}
                  >
                    <td className="px-5 py-3.5 font-mono text-text-muted text-xs">#{log.id}</td>
                    <td className="px-5 py-3.5">
                      <button
                        className="flex items-center gap-1 text-accent hover:underline text-xs font-medium"
                        onClick={e => { e.stopPropagation(); navigate(`/quotations/${log.cotizacion_id}`) }}
                      >
                        #{log.cotizacion_id} <ExternalLink size={10} />
                      </button>
                    </td>
                    <td className="px-5 py-3.5"><AlgoBadge algo={log.algoritmo_usado} /></td>
                    <td className="px-5 py-3.5"><FeasibleBadge ok={log.es_factible} /></td>
                    <td className="px-5 py-3.5 font-mono text-xs text-text-secondary">
                      {log.duracion_ms} ms
                    </td>
                    <td className="px-5 py-3.5 text-xs text-text-secondary">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver detalle →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>{data.total} logs · página {currentPage} de {totalPages}</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => goPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="btn-secondary p-2 disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, currentPage - 2) + i
                if (p > totalPages) return null
                return (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-accent text-white'
                        : 'btn-ghost'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => goPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="btn-secondary p-2 disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedLogId !== null && (
        <DetailModal logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
      )}
    </div>
  )
}

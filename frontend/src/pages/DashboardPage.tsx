/**
 * Panel ejecutivo — lista de cotizaciones del usuario con métricas.
 */
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  PlusCircle, FileText, Loader2, AlertCircle, TrendingUp,
  CheckCircle, Clock, BarChart2, Star, ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { quotationsApi } from '../services/api'
import type { QuotationSummary } from '../types'

function StatusBadge({ estado }: { estado: QuotationSummary['estado'] }) {
  const config = {
    completado: { style: 'badge-success', icon: <CheckCircle size={12} />, label: 'Completado' },
    procesando: { style: 'badge-warning', icon: <Clock size={12} />, label: 'Procesando' },
    error: { style: 'badge-error', icon: <AlertCircle size={12} />, label: 'Error' },
  }
  const c = config[estado]
  return (
    <span className={c.style}>
      {c.icon}
      {c.label}
    </span>
  )
}

function LevelBadge({ nivel }: { nivel: QuotationSummary['nivel'] }) {
  return nivel === 'premium' ? (
    <span className="badge-premium">Premium</span>
  ) : (
    <span className="badge bg-gray-50 text-gray-600 border border-gray-200/50">Básica</span>
  )
}

function EventTypeBadge({ tipo }: { tipo: string }) {
  const labels: Record<string, string> = {
    boda: 'Boda',
    corporativo: 'Corporativo',
    cumpleanos: 'Cumpleaños',
    quinceanos: 'Quinceañera',
    conferencia: 'Conferencia',
    otro: 'Otro',
  }
  return <span className="text-gray-500 text-sm">{labels[tipo] ?? tipo}</span>
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { role, nombre } = useAuth()

  const { data: quotations, isLoading, isError } = useQuery({
    queryKey: ['quotations'],
    queryFn: quotationsApi.list,
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: quotationsApi.getStats,
  })

  return (
    <div className="p-8 max-w-[1200px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="section-title text-[28px]">
            {nombre ? `Hola, ${nombre.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="section-subtitle mt-1">
            {role === 'admin' ? 'Vista administrador · todas las cotizaciones' : 'Gestión de cotizaciones y propuestas'}
          </p>
        </div>
        <button
          onClick={() => navigate('/quotations/new')}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle size={18} />
          Nueva cotización
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-5 mb-10">
          {[
            {
              icon: BarChart2,
              value: stats.total,
              label: 'Total cotizaciones',
              iconBg: 'bg-blue-50',
              iconColor: 'text-blue-500',
            },
            {
              icon: CheckCircle,
              value: stats.completadas,
              label: 'Completadas',
              iconBg: 'bg-emerald-50',
              iconColor: 'text-emerald-500',
            },
            {
              icon: Star,
              value: stats.quality_score_promedio != null
                ? `${(stats.quality_score_promedio * 100).toFixed(0)}%`
                : '—',
              label: 'Calidad promedio',
              iconBg: 'bg-amber-50',
              iconColor: 'text-amber-500',
            },
            {
              icon: TrendingUp,
              value: stats.costo_promedio != null
                ? `S/${(stats.costo_promedio / 1000).toFixed(1)}k`
                : '—',
              label: 'Costo promedio',
              iconBg: 'bg-accent-50',
              iconColor: 'text-accent-500',
            },
          ].map((s) => (
            <div key={s.label} className="card py-5 px-5">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 ${s.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={s.iconColor} size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="card flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="animate-spin text-accent-500 mx-auto mb-3" size={32} />
            <p className="text-sm text-gray-400">Cargando cotizaciones...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="card flex items-center gap-3 py-8 text-red-600">
          <AlertCircle size={20} />
          <span className="text-sm">Error al cargar cotizaciones. Intenta nuevamente.</span>
        </div>
      )}

      {/* Empty state */}
      {quotations && quotations.length === 0 && (
        <div className="card text-center py-24">
          <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FileText className="text-gray-300" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay cotizaciones aún</h3>
          <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
            Crea tu primera cotización subiendo una imagen de referencia o configurando tu evento
          </p>
          <button
            onClick={() => navigate('/quotations/new')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusCircle size={18} />
            Crear cotización
          </button>
        </div>
      )}

      {/* Table */}
      {quotations && quotations.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-100/80">
            <h3 className="font-semibold text-gray-900">Cotizaciones recientes</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100/80 bg-surface-50/50">
                <th className="text-left px-6 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Evento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Nivel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Costo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Calidad</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => navigate(`/quotations/${q.id}`)}
                  className="border-b border-gray-50 hover:bg-surface-50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{q.evento_nombre}</td>
                  <td className="px-4 py-4">
                    <EventTypeBadge tipo={q.evento_tipo} />
                  </td>
                  <td className="px-4 py-4">
                    <LevelBadge nivel={q.nivel} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge estado={q.estado} />
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900 tabular-nums">
                    {q.costo_total != null
                      ? `S/ ${q.costo_total.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`
                      : '—'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {q.quality_score != null ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold tabular-nums">
                        {(q.quality_score * 100).toFixed(0)}%
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">
                    {new Date(q.created_at).toLocaleDateString('es-PE', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-4">
                    <ArrowUpRight size={16} className="text-gray-300 group-hover:text-accent-500 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

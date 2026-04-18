/**
 * CU-03: Panel de administración de proveedores.
 * CRUD completo — solo rol admin.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusCircle, Pencil, Trash2, X, Check, AlertCircle,
  Loader2, Package, Star,
} from 'lucide-react'
import { providersApi } from '../services/api'
import type { Provider } from '../types'

const EVENT_TYPES = ['boda', 'corporativo', 'cumpleanos', 'quinceanos', 'conferencia', 'otro']

const EVENT_LABELS: Record<string, string> = {
  boda: 'Boda',
  corporativo: 'Corporativo',
  cumpleanos: 'Cumpleaños',
  quinceanos: 'Quinceañera',
  conferencia: 'Conferencia',
  otro: 'Otro',
}

function QualityDot({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 80 ? 'text-emerald-600 bg-emerald-50' :
    pct >= 50 ? 'text-amber-600 bg-amber-50' :
    'text-red-600 bg-red-50'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${color}`}>
      <Star size={10} fill="currentColor" />
      {pct}%
    </span>
  )
}

function ProviderForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<Provider>
  onSave: (data: Omit<Provider, 'id' | 'is_active'>) => void
  onCancel: () => void
  isSaving?: boolean
}) {
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    servicio_id: initial?.servicio_id ?? 1,
    costo_base: initial?.costo_base ?? 0,
    indice_calidad: initial?.indice_calidad ?? 0.5,
    tipos_evento_compatibles: initial?.tipos_evento_compatibles ?? [],
  })

  const toggleEvent = (et: string) => {
    setForm((f) => ({
      ...f,
      tipos_evento_compatibles: f.tipos_evento_compatibles.includes(et)
        ? f.tipos_evento_compatibles.filter((x) => x !== et)
        : [...f.tipos_evento_compatibles, et],
    }))
  }

  return (
    <div className="bg-surface-50 rounded-xl p-5 space-y-4 border border-gray-100/80 animate-slide-up">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label text-xs">Nombre</label>
          <input
            className="input-field text-sm"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Nombre del proveedor"
          />
        </div>
        <div>
          <label className="label text-xs">ID Servicio</label>
          <input
            type="number"
            className="input-field text-sm"
            value={form.servicio_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, servicio_id: parseInt(e.target.value) }))
            }
          />
        </div>
        <div>
          <label className="label text-xs">Costo base (S/.)</label>
          <input
            type="number"
            className="input-field text-sm"
            value={form.costo_base}
            onChange={(e) =>
              setForm((f) => ({ ...f, costo_base: parseFloat(e.target.value) }))
            }
          />
        </div>
        <div>
          <label className="label text-xs">Índice de calidad (0-1)</label>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            className="input-field text-sm"
            value={form.indice_calidad}
            onChange={(e) =>
              setForm((f) => ({ ...f, indice_calidad: parseFloat(e.target.value) }))
            }
          />
        </div>
      </div>

      <div>
        <label className="label text-xs">Tipos de evento compatibles</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {EVENT_TYPES.map((et) => (
            <button
              key={et}
              type="button"
              onClick={() => toggleEvent(et)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                form.tipos_evento_compatibles.includes(et)
                  ? 'bg-accent-500 text-white shadow-sm shadow-accent-500/20'
                  : 'bg-surface-200 text-gray-500 hover:bg-surface-100 hover:text-gray-700'
              }`}
            >
              {EVENT_LABELS[et] ?? et}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-ghost text-sm flex items-center gap-1.5">
          <X size={14} />
          Cancelar
        </button>
        <button
          onClick={() => onSave(form as Omit<Provider, 'id' | 'is_active'>)}
          disabled={isSaving}
          className="btn-primary text-sm py-2 flex items-center gap-1.5"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Guardar
        </button>
      </div>
    </div>
  )
}

export default function AdminProvidersPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: providersApi.list,
  })

  const createMutation = useMutation({
    mutationFn: providersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      setShowCreate(false)
      setMutationError(null)
    },
    onError: () => setMutationError('Error al crear proveedor. Verifica los datos.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Provider> }) =>
      providersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      setEditingId(null)
      setMutationError(null)
    },
    onError: () => setMutationError('Error al actualizar proveedor.'),
  })

  const deleteMutation = useMutation({
    mutationFn: providersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      setMutationError(null)
    },
    onError: () => setMutationError('Error al eliminar proveedor.'),
  })

  const handleDelete = (id: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="p-8 max-w-[1100px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="section-title text-[28px]">Catálogo de Proveedores</h1>
          <p className="section-subtitle mt-1">
            {providers.length} proveedores activos en el sistema
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditingId(null) }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle size={18} />
          Agregar proveedor
        </button>
      </div>

      {/* Error alert */}
      {mutationError && (
        <div className="mb-6 flex items-center gap-2.5 bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{mutationError}</span>
          <button
            onClick={() => setMutationError(null)}
            className="p-1 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PlusCircle size={16} className="text-accent-500" />
            Nuevo proveedor
          </h3>
          <ProviderForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setShowCreate(false)}
            isSaving={createMutation.isPending}
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="card flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="animate-spin text-accent-500 mx-auto mb-3" size={32} />
            <p className="text-sm text-gray-400">Cargando proveedores...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && providers.length === 0 && (
        <div className="card text-center py-24">
          <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Package className="text-gray-300" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay proveedores registrados</h3>
          <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
            Agrega tu primer proveedor para comenzar a generar cotizaciones optimizadas
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusCircle size={18} />
            Agregar proveedor
          </button>
        </div>
      )}

      {/* Providers table */}
      {!isLoading && providers.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-100/80">
            <h3 className="font-semibold text-gray-900">Proveedores registrados</h3>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100/80 bg-surface-50/50">
                <th className="text-left px-6 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Proveedor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Servicio</th>
                <th className="text-right px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Costo base</th>
                <th className="text-center px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Calidad</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Eventos</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-surface-50 transition-colors group">
                  {editingId === p.id ? (
                    <td colSpan={6} className="px-6 py-4">
                      <ProviderForm
                        initial={p}
                        onSave={(data) => updateMutation.mutate({ id: p.id, data })}
                        onCancel={() => setEditingId(null)}
                        isSaving={updateMutation.isPending}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{p.nombre}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="badge bg-gray-50 text-gray-600 border border-gray-200/50">
                          #{p.servicio_id}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900 tabular-nums">
                        S/ {p.costo_base.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <QualityDot value={p.indice_calidad} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {p.tipos_evento_compatibles.map((et) => (
                            <span
                              key={et}
                              className="badge-info text-[10px] px-1.5 py-0.5"
                            >
                              {EVENT_LABELS[et] ?? et}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button
                            onClick={() => { setEditingId(p.id); setShowCreate(false) }}
                            className="p-2 text-gray-400 hover:text-accent-500 hover:bg-accent-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.nombre)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusCircle, Pencil, Trash2, X, Check, AlertCircle, Loader2, Package,
} from 'lucide-react'
import { providersApi, rulesApi } from '../services/api'
import type { Provider, ServiceOption } from '../types'

const EVENT_TYPES  = ['boda', 'corporativo', 'cumpleanos', 'quinceanos', 'conferencia', 'otro']
const EVENT_LABELS: Record<string, string> = {
  boda: 'Boda', corporativo: 'Corporativo', cumpleanos: 'Cumpleaños',
  quinceanos: 'Quinceañera', conferencia: 'Conferencia', otro: 'Otro',
}

function QualityBar({ value }: { value: number }) {
  const pct  = Math.round(value * 100)
  const fill = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-accent' : 'bg-orange-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-border/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-text-secondary tabular-nums">{pct}%</span>
    </div>
  )
}

function ProviderForm({
  initial, onSave, onCancel, isSaving, services,
}: {
  initial?: Partial<Provider>
  onSave: (data: Omit<Provider, 'id' | 'is_active'>) => void
  onCancel: () => void
  isSaving?: boolean
  services: ServiceOption[]
}) {
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    servicio_id: initial?.servicio_id ?? (services[0]?.id ?? 1),
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
    <div className="card animate-slide-up space-y-5">
      <h2 className="font-display text-xl text-text-primary font-bold">
        {initial?.nombre ? 'Editar proveedor' : 'Nuevo proveedor'}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre</label>
          <input
            className="input-field"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Nombre del proveedor"
          />
        </div>
        <div>
          <label className="label">Servicio</label>
          <select
            className="input-field"
            value={form.servicio_id}
            onChange={(e) => setForm((f) => ({ ...f, servicio_id: parseInt(e.target.value) }))}
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Costo base (S/.)</label>
          <input
            type="number"
            className="input-field"
            value={form.costo_base}
            onChange={(e) => setForm((f) => ({ ...f, costo_base: parseFloat(e.target.value) }))}
          />
        </div>
        <div>
          <label className="label">Índice de calidad (0–1)</label>
          <input
            type="number"
            step="0.05" min="0" max="1"
            className="input-field"
            value={form.indice_calidad}
            onChange={(e) => setForm((f) => ({ ...f, indice_calidad: parseFloat(e.target.value) }))}
          />
        </div>
      </div>

      <div>
        <label className="label">Tipos de evento compatibles</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {EVENT_TYPES.map((et) => (
            <button
              key={et}
              type="button"
              onClick={() => toggleEvent(et)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                form.tipos_evento_compatibles.includes(et)
                  ? 'bg-accent-light text-text-primary shadow-glow'
                  : 'bg-surface-raised text-text-secondary hover:bg-surface-raised'
              }`}
            >
              {EVENT_LABELS[et]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary flex items-center gap-1.5">
          <X size={14} /> Cancelar
        </button>
        <button
          onClick={() => onSave(form as Omit<Provider, 'id' | 'is_active'>)}
          disabled={isSaving}
          className="btn-primary flex items-center gap-1.5"
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

  const { data: services = [] } = useQuery({
    queryKey: ['rules-services'],
    queryFn: rulesApi.listServices,
  })

  const serviceNameById = (id: number) =>
    services.find(s => s.id === id)?.nombre ?? `#${id}`

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
    <div className="pt-10 px-8 pb-12 max-w-[1100px] mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-accent/70 text-[10px] uppercase tracking-widest font-semibold mb-1">
            Administración
          </p>
          <h1 className="font-display text-3xl text-text-primary font-bold">Proveedores</h1>
          <p className="section-subtitle mt-1.5">{providers.length} proveedores activos en el sistema</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditingId(null) }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle size={16} />
          Nuevo proveedor
        </button>
      </div>

      {/* Error alert */}
      {mutationError && (
        <div className="card mb-6 border border-red-100 bg-red-50/50 flex items-center gap-3 py-4">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <span className="flex-1 text-sm text-red-600">{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="btn-ghost py-1 px-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="mb-6">
          <ProviderForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setShowCreate(false)}
            isSaving={createMutation.isPending}
            services={services}
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-accent" size={28} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && providers.length === 0 && (
        <div className="card text-center py-20">
          <Package size={32} className="text-text-muted mx-auto" />
          <div className="w-12 h-px bg-accent-light/30 mx-auto mt-4 mb-6" />
          <h3 className="font-display text-xl text-text-primary/70 mb-3">Sin proveedores</h3>
          <p className="text-text-secondary text-sm max-w-xs mx-auto mb-8 leading-relaxed">
            Agrega tu primer proveedor para comenzar a generar cotizaciones optimizadas.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Agregar proveedor
          </button>
        </div>
      )}

      {/* Table */}
      {!isLoading && providers.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-display text-lg text-text-primary">Catálogo de proveedores</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg/80 border-b border-border">
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Proveedor</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Servicio</th>
                <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Costo base</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Calidad</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Eventos</th>
                <th className="text-center px-5 py-3 text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Estado</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent-light transition-colors duration-150 group">
                  {editingId === p.id ? (
                    <td colSpan={7} className="px-5 py-4">
                      <ProviderForm
                        initial={p}
                        onSave={(data) => updateMutation.mutate({ id: p.id, data })}
                        onCancel={() => setEditingId(null)}
                        isSaving={updateMutation.isPending}
                        services={services}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-5 py-4 font-medium text-text-primary">{p.nombre}</td>
                      <td className="px-5 py-4">
                        <span className="badge bg-surface-raised text-text-secondary border border-border">
                          {serviceNameById(p.servicio_id)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-text-primary tabular-nums">
                        S/ {p.costo_base.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-5 py-4">
                        <QualityBar value={p.indice_calidad} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {p.tipos_evento_compatibles.map((et) => (
                            <span key={et} className="badge bg-surface-raised text-text-secondary/70 border border-border text-[10px]">
                              {EVENT_LABELS[et] ?? et}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {p.is_active
                          ? <span className="badge-success">Activo</span>
                          : <span className="badge bg-surface-raised text-text-secondary border border-border">Inactivo</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button
                            onClick={() => { setEditingId(p.id); setShowCreate(false) }}
                            className="p-2 text-text-muted hover:text-accent hover:bg-accent-light rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.nombre)}
                            className="p-2 text-text-muted hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
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

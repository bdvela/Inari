import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusCircle, Pencil, Trash2, X, Check, AlertCircle, Loader2, Package,
} from 'lucide-react'
import { packagesApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { ServicePackageModel } from '../types'

interface PackageFormData {
  name: string
  content: string
  cost: string
  min_guests: string
  max_guests: string
}

function PackageForm({
  initial, onSave, onCancel, isSaving,
}: {
  initial?: Partial<ServicePackageModel>
  onSave: (data: PackageFormData) => void
  onCancel: () => void
  isSaving?: boolean
}) {
  const [form, setForm] = useState<PackageFormData>({
    name: initial?.name ?? '',
    content: initial?.content ?? '',
    cost: String(initial?.cost ?? ''),
    min_guests: String(initial?.min_guests ?? ''),
    max_guests: String(initial?.max_guests ?? ''),
  })

  const field = (key: keyof PackageFormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <div className="card animate-slide-up space-y-5">
      <h2 className="font-display text-xl text-text-primary font-bold">
        {initial?.id ? 'Editar paquete' : 'Nuevo paquete'}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nombre del paquete</label>
          <input className="input-field" placeholder="Ej: Paquete Oro" {...field('name')} />
        </div>

        <div>
          <label className="label">Mín. invitados</label>
          <input type="number" min="1" className="input-field" placeholder="1" {...field('min_guests')} />
        </div>
        <div>
          <label className="label">Máx. invitados</label>
          <input type="number" min="1" className="input-field" placeholder="200" {...field('max_guests')} />
        </div>

        <div>
          <label className="label">Costo (S/)</label>
          <input type="number" min="0" step="0.01" className="input-field" placeholder="0.00" {...field('cost')} />
        </div>

        <div className="col-span-2">
          <label className="label">Contenido del paquete</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Ej: Carpas premium, sillas, mesas, mantelería, sonido básico"
            {...field('content')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-secondary flex items-center gap-1.5">
          <X size={14} /> Cancelar
        </button>
        <button
          onClick={() => onSave(form)}
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

export default function AdminPackagesPage() {
  const queryClient = useQueryClient()
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: packagesApi.list,
  })

  const buildPayload = (form: PackageFormData) => ({
    name: form.name,
    content: form.content,
    cost: parseFloat(form.cost),
    min_guests: parseInt(form.min_guests),
    max_guests: parseInt(form.max_guests),
  })

  const createMutation = useMutation({
    mutationFn: (form: PackageFormData) => packagesApi.create(buildPayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      setShowCreate(false)
      setMutationError(null)
    },
    onError: (err: { response?: { data?: { detail?: string } } }) =>
      setMutationError(err?.response?.data?.detail ?? 'Error al crear paquete.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: number; form: PackageFormData }) =>
      packagesApi.update(id, buildPayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      setEditingId(null)
      setMutationError(null)
    },
    onError: () => setMutationError('Error al actualizar paquete.'),
  })

  const deleteMutation = useMutation({
    mutationFn: packagesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      setMutationError(null)
    },
    onError: () => setMutationError('Error al eliminar paquete.'),
  })

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar el paquete "${name}"? Esta acción no se puede deshacer.`)) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="pt-10 px-8 pb-12 max-w-[1100px] mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-accent/70 text-[10px] uppercase tracking-widest font-semibold mb-1">
            Configuración
          </p>
          <h1 className="font-display text-3xl text-text-primary font-bold">Paquetes de servicios</h1>
          <p className="section-subtitle mt-1.5">
            Infraestructura propia de INARI GROUP · selección automática por número de invitados · {packages.length} paquetes
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowCreate(true); setEditingId(null) }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Nuevo paquete
          </button>
        )}
      </div>

      {/* Error */}
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
          <PackageForm
            onSave={(form) => createMutation.mutate(form)}
            onCancel={() => setShowCreate(false)}
            isSaving={createMutation.isPending}
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
      {!isLoading && packages.length === 0 && (
        <div className="card text-center py-20">
          <Package size={32} className="text-text-muted mx-auto" />
          <div className="w-12 h-px bg-accent-light/30 mx-auto mt-4 mb-6" />
          <h3 className="font-display text-xl text-text-primary/70 mb-3">Sin paquetes configurados</h3>
          <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
            Configura los paquetes de infraestructura para que el sistema los asigne automáticamente según el número de invitados.
          </p>
        </div>
      )}

      {/* Lista de paquetes ordenada por rango */}
      {!isLoading && packages.length > 0 && (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div key={pkg.id}>
              {editingId === pkg.id ? (
                <PackageForm
                  initial={pkg}
                  onSave={(form) => updateMutation.mutate({ id: pkg.id, form })}
                  onCancel={() => setEditingId(null)}
                  isSaving={updateMutation.isPending}
                />
              ) : (
                <div className="card-hover p-4 flex items-center gap-4 group">
                  {/* Rango badge */}
                  <div className="flex-shrink-0 text-center bg-accent-light rounded-lg px-3 py-2 min-w-[80px]">
                    <div className="text-xs text-accent font-semibold">{pkg.min_guests}–{pkg.max_guests}</div>
                    <div className="text-[10px] text-text-secondary">invitados</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-text-primary text-sm">{pkg.name}</span>
                      <span className="badge-accent">S/ {pkg.cost.toLocaleString('es-PE')}</span>
                      {!pkg.is_active && (
                        <span className="badge bg-surface-raised text-text-secondary border border-border">Inactivo</span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1 truncate">{pkg.content}</p>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(pkg.id); setShowCreate(false) }}
                        className="p-2 text-text-muted hover:text-accent hover:bg-accent-light rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id, pkg.name)}
                        className="p-2 text-text-muted hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

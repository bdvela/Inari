import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusCircle, Pencil, Trash2, X, Check, AlertCircle, Loader2, ShieldCheck,
} from 'lucide-react'
import { rulesApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { BusinessRule } from '../types'

const EVENT_LABELS: Record<string, string> = {
  boda: 'Boda', corporativo: 'Corporativo', cumpleanos: 'Cumpleaños',
  quinceanos: 'Quinceañera', conferencia: 'Conferencia', otro: 'Otro',
}

interface RuleFormData {
  tipo_evento: string
  servicio_id: number
  es_obligatorio: boolean
  condicion_min_invitados: string
  descripcion: string
}

function RuleForm({
  initial, onSave, onCancel, isSaving, eventTypes, services,
}: {
  initial?: Partial<BusinessRule>
  onSave: (data: RuleFormData) => void
  onCancel: () => void
  isSaving?: boolean
  eventTypes: { value: string; label: string }[]
  services: { id: number; nombre: string }[]
}) {
  const [form, setForm] = useState<RuleFormData>({
    tipo_evento: initial?.tipo_evento ?? eventTypes[0]?.value ?? 'boda',
    servicio_id: initial?.servicio_id ?? (services[0]?.id ?? 1),
    es_obligatorio: initial?.es_obligatorio ?? true,
    condicion_min_invitados: String(
      (initial?.condicion as { min_invitados?: number } | null)?.min_invitados ?? ''
    ),
    descripcion: initial?.descripcion ?? '',
  })

  return (
    <div className="card animate-slide-up space-y-5">
      <h2 className="font-display text-xl text-text-primary font-bold">
        {initial?.id ? 'Editar regla' : 'Nueva regla'}
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Tipo de evento</label>
          <select
            className="input-field"
            value={form.tipo_evento}
            onChange={(e) => setForm((f) => ({ ...f, tipo_evento: e.target.value }))}
            disabled={!!initial?.id}
          >
            {eventTypes.map((et) => (
              <option key={et.value} value={et.value}>{et.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Servicio</label>
          <select
            className="input-field"
            value={form.servicio_id}
            onChange={(e) => setForm((f) => ({ ...f, servicio_id: parseInt(e.target.value) }))}
            disabled={!!initial?.id}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Mín. invitados (condición opcional)</label>
          <input
            type="number" min="0"
            className="input-field"
            placeholder="Sin condición"
            value={form.condicion_min_invitados}
            onChange={(e) => setForm((f) => ({ ...f, condicion_min_invitados: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Descripción</label>
          <input
            className="input-field"
            placeholder="Opcional"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>
      </div>

      {/* Toggle es_obligatorio */}
      <div className="flex items-center gap-3">
        <label className="label mb-0">Obligatorio</label>
        <button
          type="button"
          role="switch"
          aria-checked={form.es_obligatorio}
          onClick={() => setForm((f) => ({ ...f, es_obligatorio: !f.es_obligatorio }))}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
            form.es_obligatorio ? 'bg-accent-light' : 'bg-border'
          }`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            form.es_obligatorio ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
        <span className="text-sm text-text-secondary">
          {form.es_obligatorio ? 'Servicio obligatorio' : 'Servicio opcional'}
        </span>
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

export default function AdminRulesPage() {
  const queryClient = useQueryClient()
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: rulesApi.list,
  })

  const { data: services = [] } = useQuery({
    queryKey: ['rules-services'],
    queryFn: rulesApi.listServices,
  })

  const { data: eventTypes = [] } = useQuery({
    queryKey: ['event-types'],
    queryFn: rulesApi.listEventTypes,
  })

  const buildPayload = (form: RuleFormData) => {
    const condicion = form.condicion_min_invitados
      ? { min_invitados: parseInt(form.condicion_min_invitados) }
      : null
    return {
      tipo_evento: form.tipo_evento,
      servicio_id: form.servicio_id,
      es_obligatorio: form.es_obligatorio,
      condicion,
      descripcion: form.descripcion || null,
    }
  }

  const createMutation = useMutation({
    mutationFn: (form: RuleFormData) => rulesApi.create(buildPayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      setShowCreate(false)
      setMutationError(null)
    },
    onError: (err: { response?: { data?: { detail?: string } } }) =>
      setMutationError(err?.response?.data?.detail ?? 'Error al crear regla.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: number; form: RuleFormData }) => {
      const condicion = form.condicion_min_invitados
        ? { min_invitados: parseInt(form.condicion_min_invitados) }
        : null
      return rulesApi.update(id, {
        es_obligatorio: form.es_obligatorio,
        condicion,
        descripcion: form.descripcion || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      setEditingId(null)
      setMutationError(null)
    },
    onError: () => setMutationError('Error al actualizar regla.'),
  })

  const deleteMutation = useMutation({
    mutationFn: rulesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      setMutationError(null)
    },
    onError: () => setMutationError('Error al eliminar regla.'),
  })

  const handleDelete = (id: number, label: string) => {
    if (!window.confirm(`¿Eliminar la regla "${label}"? Esta acción no se puede deshacer.`)) return
    deleteMutation.mutate(id)
  }

  const grouped = rules.reduce<Record<string, BusinessRule[]>>((acc, r) => {
    const key = r.tipo_evento
    acc[key] = [...(acc[key] ?? []), r]
    return acc
  }, {})

  return (
    <div className="pt-10 px-8 pb-12 max-w-[1100px] mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-accent/70 text-[10px] uppercase tracking-widest font-semibold mb-1">
            Configuración
          </p>
          <h1 className="font-display text-3xl text-text-primary font-bold">Reglas de negocio</h1>
          <p className="section-subtitle mt-1.5">
            Servicios obligatorios y opcionales por tipo de evento · {rules.length} reglas
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowCreate(true); setEditingId(null) }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Nueva regla
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
          <RuleForm
            onSave={(form) => createMutation.mutate(form)}
            onCancel={() => setShowCreate(false)}
            isSaving={createMutation.isPending}
            eventTypes={eventTypes}
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
      {!isLoading && rules.length === 0 && (
        <div className="card text-center py-20">
          <ShieldCheck size={32} className="text-text-muted mx-auto" />
          <div className="w-12 h-px bg-accent-light/30 mx-auto mt-4 mb-6" />
          <h3 className="font-display text-xl text-text-primary/70 mb-3">Sin reglas configuradas</h3>
          <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
            El sistema usará los defaults predefinidos por tipo de evento hasta que se configuren reglas aquí.
          </p>
        </div>
      )}

      {/* Grupos por tipo de evento */}
      {!isLoading && Object.entries(grouped).map(([tipo, tipoRules]) => (
        <div key={tipo} className="mb-8">
          {/* Título de grupo */}
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-display text-lg text-text-primary/80 font-bold whitespace-nowrap">
              {EVENT_LABELS[tipo] ?? tipo}
            </h2>
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-text-secondary">{tipoRules.length} reglas</span>
          </div>

          <div className="space-y-3">
            {tipoRules.map((r) => (
              <div key={r.id}>
                {editingId === r.id ? (
                  <RuleForm
                    initial={r}
                    onSave={(form) => updateMutation.mutate({ id: r.id, form })}
                    onCancel={() => setEditingId(null)}
                    isSaving={updateMutation.isPending}
                    eventTypes={eventTypes}
                    services={services}
                  />
                ) : (
                  <div className="card-hover p-4 flex items-center gap-4 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-text-primary text-sm">{r.servicio_nombre}</span>
                        {r.es_obligatorio ? (
                          <span className="badge-accent">Obligatorio</span>
                        ) : (
                          <span className="badge bg-surface-raised text-text-secondary border border-border">Opcional</span>
                        )}
                        {r.condicion && (
                          <span className="text-xs text-text-secondary">
                            Mín. {(r.condicion as { min_invitados?: number }).min_invitados ?? '?'} invitados
                          </span>
                        )}
                      </div>
                      {r.descripcion && (
                        <p className="text-xs text-text-secondary mt-1">{r.descripcion}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => { setEditingId(r.id); setShowCreate(false) }}
                          className="p-2 text-text-muted hover:text-accent hover:bg-accent-light rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(
                            r.id,
                            `${EVENT_LABELS[r.tipo_evento] ?? r.tipo_evento} / ${r.servicio_nombre}`
                          )}
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
        </div>
      ))}
    </div>
  )
}

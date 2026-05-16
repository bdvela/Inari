/**
 * Configuración del sistema — solo ADMIN.
 * Permite ajustar quality_weight del optimizer en tiempo real.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save, Info, Sliders } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function qualityLabel(v: number): string {
  if (v === 0)      return 'Solo precio (ignora calidad)'
  if (v < 0.7)     return 'Precio primero'
  if (v < 1.3)     return 'Equilibrado (recomendado)'
  if (v < 2.5)     return 'Calidad preferida'
  if (v < 4.0)     return 'Calidad alta'
  return 'Calidad máxima'
}

function qualityColor(v: number): string {
  if (v < 0.5)  return '#AEAEB2'
  if (v < 1.3)  return '#34C759'
  if (v < 2.5)  return '#E8572A'
  return '#C94A1F'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSystemConfigPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['optimizer-config'],
    queryFn: adminApi.getOptimizerConfig,
  })

  const [localValue, setLocalValue] = useState<number | null>(null)
  const currentValue = localValue ?? data?.quality_weight ?? 1.0

  const mutation = useMutation({
    mutationFn: adminApi.updateOptimizerConfig,
    onSuccess: (updated) => {
      queryClient.setQueryData(['optimizer-config'], updated)
      setLocalValue(null)
      toast.success('Configuración guardada')
    },
    onError: () => toast.error('Error al guardar la configuración'),
  })

  const handleSave = () => mutation.mutate(currentValue)
  const isDirty = localValue !== null && localValue !== data?.quality_weight

  return (
    <div className="pt-10 px-8 pb-12 max-w-[720px] mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-10">
        <p className="text-accent/70 text-[10px] uppercase tracking-widest font-semibold mb-1">
          Administración
        </p>
        <h1 className="font-display text-3xl text-text-primary font-bold flex items-center gap-3">
          <Sliders size={26} className="text-accent" />
          Configuración del sistema
        </h1>
        <p className="section-subtitle mt-1.5">Ajusta parámetros del motor de optimización.</p>
      </div>

      {isLoading ? (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-accent" size={28} />
        </div>
      ) : (
        <div className="card space-y-8">

          {/* Quality weight section */}
          <div>
            <div className="flex items-start gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(232,87,42,0.10)' }}
              >
                <Sliders size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-text-primary">
                  Peso de calidad (quality_weight)
                </h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  Controla cuánto favorece el optimizer la calidad vs el precio al elegir proveedores.
                </p>
              </div>
            </div>

            {/* Valor actual */}
            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="font-display text-5xl font-extrabold tracking-tighter"
                style={{ color: qualityColor(currentValue) }}
              >
                {currentValue.toFixed(1)}
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: qualityColor(currentValue) }}
              >
                {qualityLabel(currentValue)}
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-2 mb-6">
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={currentValue}
                onChange={(e) => setLocalValue(parseFloat(e.target.value))}
                className="w-full accent-accent h-2 cursor-pointer"
                data-testid="quality-weight-slider"
              />
              <div className="flex justify-between text-[11px] text-text-muted">
                <span>0.0 — Solo precio</span>
                <span>1.0 — Equilibrado</span>
                <span>5.0 — Máx. calidad</span>
              </div>
            </div>

            {/* Leyenda */}
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
              style={{ background: 'rgba(232,87,42,0.05)', border: '1px solid rgba(232,87,42,0.14)' }}
            >
              <Info size={14} className="text-accent mt-0.5 shrink-0" />
              <div className="text-text-secondary leading-relaxed">
                <strong className="text-text-primary">Cómo funciona:</strong> el optimizer multiplica el
                índice de calidad de cada proveedor por este valor antes de comparar opciones.{' '}
                <strong className="text-text-primary">1.0</strong> = comportamiento estándar.{' '}
                <strong className="text-text-primary">{'> 1.0'}</strong> = favorece proveedores con mayor
                calidad aunque sean más caros.{' '}
                <strong className="text-text-primary">{'< 1.0'}</strong> = prioriza precio.
                El análisis de imágenes de estilo puede sobreescribir este valor por cotización.
              </div>
            </div>
          </div>

          {/* Última actualización */}
          {data?.updated_at && (
            <div className="pt-4 border-t border-border text-xs text-text-muted space-y-1">
              <p>
                Última modificación:{' '}
                <span className="text-text-secondary">
                  {new Date(data.updated_at).toLocaleString('es-PE', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </p>
              {data.updated_by_email && (
                <p>
                  Por:{' '}
                  <span className="text-text-secondary font-medium">{data.updated_by_email}</span>
                </p>
              )}
            </div>
          )}

          {/* Guardar */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={mutation.isPending || !isDirty}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-40"
            >
              {mutation.isPending ? (
                <><Loader2 size={14} className="animate-spin" /> Guardando...</>
              ) : (
                <><Save size={14} /> Guardar cambios</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

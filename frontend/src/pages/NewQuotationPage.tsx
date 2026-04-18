/**
 * CU-01: Wizard de generación de cotización desde imagen referencial.
 * Pasos: 1. Subir imagen → 2. Configurar evento → 3. Procesando → 4. Resultado
 */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, ChevronRight, Loader2, Image, X, CheckCircle, Sparkles, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { quotationsApi } from '../services/api'

const eventSchema = z.object({
  evento_tipo: z.enum(['boda', 'corporativo', 'cumpleanos', 'quinceanos', 'conferencia', 'otro']),
  evento_fecha: z.string().min(1, 'Fecha requerida'),
  num_invitados: z.number({ coerce: true }).int().min(1, 'Mínimo 1 invitado'),
  presupuesto_maximo: z.number({ coerce: true }).min(100, 'Mínimo S/. 100'),
  estilo: z.string().optional(),
  descripcion: z.string().optional(),
})

type EventForm = z.infer<typeof eventSchema>

const EVENT_TYPE_LABELS: Record<string, string> = {
  boda: 'Boda',
  corporativo: 'Corporativo',
  cumpleanos: 'Cumpleaños',
  quinceanos: 'Quinceaños',
  conferencia: 'Conferencia',
  otro: 'Otro',
}

const STEP_LABELS = ['Imagen', 'Configurar', 'Resultado']

export default function NewQuotationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: { evento_tipo: 'boda' },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setStep(2)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setStep(1)
  }

  const onSubmit = async (data: EventForm) => {
    setIsSubmitting(true)
    setError(null)
    setStep(3)

    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          formData.append(key, String(val))
        }
      })
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const result = await quotationsApi.generate(formData)

      toast.success('¡Cotización generada con éxito!')
      const targetId = result.basica_factible
        ? result.quotation_basica_id
        : result.quotation_premium_id

      navigate(`/quotations/${targetId}`, {
        state: { result },
      })
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Error al generar la cotización'
      const msg = message ?? 'Error desconocido'
      setError(msg)
      toast.error(msg)
      setStep(2)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">Nueva Cotización</h1>
        <p className="section-subtitle">
          Sube una imagen de referencia y configura tu evento
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-10">
        {STEP_LABELS.map((label, i) => {
          const s = i + 1
          const isActive = step >= s
          const isCurrent = step === s
          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className="flex items-center gap-2.5 flex-1">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-accent-500 text-white shadow-sm shadow-accent-500/20'
                      : 'bg-surface-200 text-gray-400'
                  }`}
                >
                  {isActive && step > s ? <CheckCircle size={14} /> : s}
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  isCurrent ? 'text-gray-900' : isActive ? 'text-gray-500' : 'text-gray-300'
                }`}>
                  {label}
                </span>
              </div>
              {s < 3 && (
                <div className={`h-0.5 flex-1 rounded-full transition-colors ${
                  step > s ? 'bg-accent-500' : 'bg-surface-200'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1: Image upload */}
      {step === 1 && (
        <div className="card animate-slide-up">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Imagen de referencia</h2>
          <p className="text-sm text-gray-400 mb-6">
            Sube una foto de inspiración para tu evento. El sistema analizará el estilo y
            los servicios necesarios. También puedes continuar sin imagen.
          </p>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-accent-500 bg-accent-50 scale-[1.01]'
                : 'border-gray-200 hover:border-accent-400 hover:bg-surface-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${
              isDragActive ? 'bg-accent-100' : 'bg-surface-100'
            }`}>
              <Upload className={`transition-colors ${isDragActive ? 'text-accent-500' : 'text-gray-400'}`} size={28} />
            </div>
            <p className="text-gray-700 font-semibold mb-1">
              {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
            </p>
            <p className="text-gray-400 text-sm">JPG, PNG o WEBP · Máx 10 MB</p>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="btn-ghost text-sm flex items-center gap-1"
            >
              Continuar sin imagen
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Event config form */}
      {(step === 2 || (step === 3 && !isSubmitting)) && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-slide-up">
          {/* Image preview */}
          {imagePreview && (
            <div className="card p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Referencia"
                    className="w-20 h-20 rounded-xl object-cover border border-gray-100"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-lg p-1 hover:bg-red-500 transition-colors shadow-sm"
                  >
                    <X size={10} />
                  </button>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Image size={14} className="text-accent-500" />
                    {imageFile?.name}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Datos del evento</h2>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="label">Tipo de evento</label>
                <select {...register('evento_tipo')} className="input-field">
                  {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Fecha del evento</label>
                <input
                  type="date"
                  {...register('evento_fecha')}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.evento_fecha && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.evento_fecha.message}</p>
                )}
              </div>

              <div>
                <label className="label">Número de invitados</label>
                <input
                  type="number"
                  {...register('num_invitados')}
                  className="input-field"
                  min={1}
                  placeholder="ej. 150"
                />
                {errors.num_invitados && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.num_invitados.message}</p>
                )}
              </div>

              <div>
                <label className="label">Presupuesto máximo (S/.)</label>
                <input
                  type="number"
                  {...register('presupuesto_maximo')}
                  className="input-field"
                  min={100}
                  step={100}
                  placeholder="ej. 15000"
                />
                {errors.presupuesto_maximo && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.presupuesto_maximo.message}</p>
                )}
              </div>

              <div>
                <label className="label">Estilo (opcional)</label>
                <input
                  type="text"
                  {...register('estilo')}
                  className="input-field"
                  placeholder="ej. rústico, moderno, elegante"
                />
              </div>

              <div>
                <label className="label">Descripción adicional (opcional)</label>
                <input
                  type="text"
                  {...register('descripcion')}
                  className="input-field"
                  placeholder="Detalles especiales..."
                />
              </div>
            </div>

            {error && (
              <div className="mt-5 bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 flex items-center gap-2">
                <X size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-ghost flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                Atrás
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generando propuesta...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generar cotización
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Step 3: Processing */}
      {step === 3 && isSubmitting && (
        <div className="card text-center py-20 animate-slide-up">
          <div className="w-20 h-20 bg-accent-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="text-accent-500 animate-spin" size={36} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Procesando tu cotización</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto mb-8">
            Nuestro sistema está analizando tu solicitud y optimizando la selección de proveedores
          </p>
          <div className="flex items-center justify-center gap-8 text-xs text-gray-400">
            {['Análisis visual', 'Reglas de negocio', 'Optimización', 'Propuesta'].map((label) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse-soft" />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

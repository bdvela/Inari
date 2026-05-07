/**
 * Wizard de cotización para visitantes no autenticados.
 * Usa guestApi.preview (sin guardar en BD) y navega a GuestResultPage.
 */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sparkles, ChevronRight, Loader2, X, CheckCircle, XCircle,
  ArrowLeft, AlertCircle, ImagePlus, Wand2,
} from 'lucide-react'
import { toast } from 'sonner'
import { quotationsApi, guestApi } from '../services/api'
import type { ParsedDescription } from '../types'
import EventTypeSelect from '../components/shared/EventTypeSelect'
import DateInput from '../components/shared/DateInput'

const eventSchema = z.object({
  evento_tipo: z.enum(['boda', 'corporativo', 'cumpleanos', 'quinceanos', 'conferencia', 'otro']),
  evento_fecha: z.string().min(1, 'Fecha requerida'),
  num_invitados: z.number({ coerce: true }).int().min(1, 'Mínimo 1 invitado'),
  presupuesto_maximo: z.number({ coerce: true }).min(100, 'Mínimo S/. 100'),
  estilo: z.string().optional(),
  descripcion: z.string().optional(),
})
type EventForm = z.infer<typeof eventSchema>

const EVENT_TYPE_OPTIONS = [
  { value: 'boda',        label: 'Boda' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'cumpleanos',  label: 'Cumpleaños' },
  { value: 'quinceanos',  label: 'Quinceañera' },
  { value: 'conferencia', label: 'Conferencia' },
  { value: 'otro',        label: 'Otro' },
]
const EVENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map(o => [o.value, o.label])
)
const TODAY = new Date().toISOString().split('T')[0]

interface StyleImageItem { file: File; preview: string }

export default function GuestWizardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [descText, setDescText]     = useState('')
  const [isParsing, setIsParsing]   = useState(false)
  const [parsed, setParsed]         = useState<ParsedDescription | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const [styleImages, setStyleImages] = useState<StyleImageItem[]>([])
  const [_isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [loadingPhase, setLoadingPhase] = useState<'visual' | 'rules' | 'optimizer' | null>(null)

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: { evento_tipo: 'boda' },
  })

  const onDropStyle = useCallback((acceptedFiles: File[]) => {
    const remaining = 3 - styleImages.length
    const toAdd = acceptedFiles.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setStyleImages(prev => [...prev, ...toAdd])
  }, [styleImages.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropStyle,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    disabled: styleImages.length >= 3,
  })

  const removeStyleImage = (idx: number) => {
    setStyleImages(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleParseDescription = async () => {
    if (!descText.trim() || descText.trim().length < 10) {
      setParseError('Por favor escribe una descripción más detallada de tu evento.')
      return
    }
    setIsParsing(true)
    setParseError(null)
    setParsed(null)
    try {
      const result = await quotationsApi.parseDescription(descText)
      if (!result.parseable) {
        setParseError(result.message || 'No pude entender bien. Vuelve a intentarlo con más detalles.')
        setStep(2)
        return
      }
      if (result.event_type) setValue('evento_tipo', result.event_type as EventForm['evento_tipo'])
      if (result.guest_count) setValue('num_invitados', result.guest_count)
      if (result.max_budget)  setValue('presupuesto_maximo', result.max_budget)
      if (result.style_hints?.length) setValue('estilo', result.style_hints.join(', '))
      if (result.approximate_date && /^\d{4}-\d{2}-\d{2}$/.test(result.approximate_date)) {
        setValue('evento_fecha', result.approximate_date)
      }
      setParsed(result)
      setStep(2)
    } catch {
      setParseError('Error de conexión. Puedes completar el formulario directamente.')
      setStep(2)
    } finally {
      setIsParsing(false)
    }
  }

  const onSubmit = async (data: EventForm) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setStep(3)
    setLoadingPhase('visual')
    const t1 = setTimeout(() => setLoadingPhase('rules'), 4000)
    const t2 = setTimeout(() => setLoadingPhase('optimizer'), 8000)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== '') formData.append(k, String(v))
      })
      styleImages.forEach(item => formData.append('style_images', item.file))

      const result = await guestApi.preview(formData)

      if (!result.basica_factible && !result.premium_factible) {
        setSubmitError('El presupuesto no cubre los servicios mínimos. Considera aumentarlo o cambiar el tipo de evento.')
        setStep(2)
        return
      }

      navigate('/propuesta', { state: { result, formData: data } })
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined
      setSubmitError(msg ?? 'Error de conexión. Intenta nuevamente.')
      toast.error(msg ?? 'Error al generar la cotización')
      setStep(2)
    } finally {
      clearTimeout(t1)
      clearTimeout(t2)
      setIsSubmitting(false)
      setLoadingPhase(null)
    }
  }

  return (
    <div className="mesh min-h-screen">
      <div className="mesh-blob" />

      {/* Header minimal */}
      <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(26,23,20,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="logo-mark" style={{ width: 32, height: 32, fontSize: 14 }}>I</span>
          <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.18em', color: '#1D1D1F' }}>
            INARI GROUP
          </span>
        </div>
        <a href="/login" style={{ fontSize: 13, color: '#6E6E73', textDecoration: 'none' }}>
          ¿Ya tienes cuenta? <span style={{ color: '#E8572A', fontWeight: 600 }}>Inicia sesión</span>
        </a>
      </div>

      <div className="max-w-[760px] mx-auto px-6 py-10">

        {/* PASO 1 */}
        {step === 1 && (
          <div className="animate-fade-in">
            <p className="font-mono text-[11px] text-accent tracking-widest uppercase mb-3">Paso 01 · Cuéntanos tu evento</p>
            <h1 className="font-display text-5xl font-bold tracking-tighter leading-tight mb-3 text-text-primary">
              Genera tu propuesta<br />
              <span className="text-accent">sin registrarte.</span>
            </h1>
            <p className="text-text-secondary text-sm mb-8 leading-relaxed">
              Describe tu evento y en minutos tendrás una propuesta detallada. Solo si te interesa, dejas tus datos para que te contactemos.
            </p>

            <div className="glass-raised p-8">
              <label className="label">Describe tu evento</label>
              <textarea
                className="input w-full resize-none mb-4"
                rows={4}
                placeholder='Ej: "Quiero organizar una boda para 80 personas en agosto, presupuesto de 15,000 soles, estilo jardín romántico"'
                value={descText}
                onChange={e => setDescText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleParseDescription() } }}
              />
              {parseError && (
                <div className="flex items-center gap-2 text-sm text-danger mb-4">
                  <AlertCircle size={14} /> {parseError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleParseDescription}
                  disabled={isParsing}
                >
                  {isParsing
                    ? <><Loader2 size={15} className="animate-spin" /> Analizando...</>
                    : <><Wand2 size={15} /> Analizar con IA</>}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setParsed(null); setStep(2) }}
                >
                  Completar manualmente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 animate-fade-in">

            {parseError && !parsed && (
              <div className="glass-raised p-8 border border-danger/20">
                <div className="flex items-center gap-3 mb-4">
                  <XCircle size={18} className="text-danger" />
                  <p className="font-semibold">No pudimos identificar los datos. Completa el formulario.</p>
                </div>
                <button className="btn btn-ghost text-sm" onClick={() => { setParseError(null); setStep(1) }}>
                  ← Volver
                </button>
              </div>
            )}

            {parsed?.parseable && (
              <div className="rounded-2xl px-5 py-4 animate-fade-in"
                style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.24)' }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <CheckCircle size={15} className="text-ok" />
                  <span className="text-sm font-semibold text-ok">Datos extraídos de tu descripción.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsed.event_type       && <span className="badge badge-accent">★ {EVENT_TYPE_LABELS[parsed.event_type] ?? parsed.event_type}</span>}
                  {parsed.guest_count      && <span className="badge badge-accent">★ {parsed.guest_count} invitados</span>}
                  {parsed.max_budget       && <span className="badge badge-accent">★ S/ {parsed.max_budget.toLocaleString()}</span>}
                  {parsed.approximate_date && <span className="badge badge-accent">★ {parsed.approximate_date}</span>}
                </div>
              </div>
            )}

            {submitError && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.18)', color: '#b3271e' }}>
                <AlertCircle size={15} className="flex-shrink-0" /> {submitError}
              </div>
            )}

            <div className="glass-raised p-10">
              <p className="font-mono text-[11px] text-accent tracking-widest uppercase mb-3">Paso 02 · Confirma los datos</p>
              <h2 className="font-display text-4xl font-bold tracking-tighter text-text-primary leading-tight mb-7">
                Datos de tu evento
              </h2>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label">Tipo de evento</label>
                  <Controller name="evento_tipo" control={control}
                    render={({ field }) => (
                      <EventTypeSelect value={field.value} onChange={field.onChange} options={EVENT_TYPE_OPTIONS} isAiDetected={!!parsed?.event_type} />
                    )}
                  />
                </div>
                <div>
                  <label className="label">Fecha del evento</label>
                  <Controller name="evento_fecha" control={control}
                    render={({ field }) => (
                      <DateInput value={field.value ?? ''} onChange={field.onChange} isAiDetected={!!parsed?.approximate_date} min={TODAY} />
                    )}
                  />
                  {errors.evento_fecha && <p className="text-danger text-xs mt-1.5">{errors.evento_fecha.message}</p>}
                </div>
                <div>
                  <label className="label">Número de invitados</label>
                  <input type="number" {...register('num_invitados')} className="input" min={1} placeholder="ej. 100" />
                  {errors.num_invitados && <p className="text-danger text-xs mt-1.5">{errors.num_invitados.message}</p>}
                </div>
                <div>
                  <label className="label">Presupuesto máximo (S/.)</label>
                  <input type="number" {...register('presupuesto_maximo')} className="input font-mono" min={100} step={100} placeholder="ej. 20000" />
                  {errors.presupuesto_maximo && <p className="text-danger text-xs mt-1.5">{errors.presupuesto_maximo.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="label">Estilo deseado <span className="text-text-muted text-xs font-normal">(opcional)</span></label>
                  <input type="text" {...register('estilo')} className="input" placeholder="ej. romántico, moderno, elegante..." />
                </div>
              </div>
            </div>

            {/* Imágenes de referencia */}
            <div className="glass-raised p-8">
              <div className="flex items-center gap-2.5 mb-2">
                <ImagePlus size={16} className="text-accent" />
                <h3 className="font-display text-xl font-bold tracking-tight">
                  Referencias de estilo <span className="text-sm font-normal text-text-muted">(opcional)</span>
                </h3>
              </div>
              <p className="text-sm text-text-secondary mb-5">
                Sube hasta 3 fotos — decoración, colores, ambiente. El sistema personalizará la propuesta.
              </p>

              {styleImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {styleImages.map((item, idx) => (
                    <div key={idx} className="relative group">
                      <img src={item.preview} alt={`Ref ${idx + 1}`} className="w-full h-28 rounded-xl object-cover border border-black/8" />
                      <button type="button" onClick={() => removeStyleImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-md bg-danger text-white flex items-center justify-center border-none cursor-pointer shadow-sm">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {styleImages.length < 3 && (
                    <div {...getRootProps()} className={`h-28 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}>
                      <input {...getInputProps()} />
                      <ImagePlus size={20} className="text-text-muted" />
                    </div>
                  )}
                </div>
              ) : (
                <div {...getRootProps()} className={`h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${isDragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}>
                  <input {...getInputProps()} />
                  <ImagePlus size={22} className="text-text-muted" />
                  <p className="text-sm text-text-muted">Arrastra fotos o haz click</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={14} /> Volver
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                <Sparkles size={15} /> Generar propuesta gratuita
              </button>
            </div>
          </form>
        )}

        {/* PASO 3 — Cargando */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
            <div className="glass-raised p-12 text-center max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 size={28} className="text-accent animate-spin" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">
                {loadingPhase === 'visual' ? 'Analizando referencias...' : loadingPhase === 'rules' ? 'Aplicando reglas...' : 'Optimizando propuesta...'}
              </h2>
              <p className="text-text-secondary text-sm">
                {styleImages.length > 0 ? `Personalizando según ${styleImages.length} imagen${styleImages.length > 1 ? 'es' : ''} de referencia.` : 'Calculando la mejor combinación de servicios.'}
              </p>
              <div className="mt-6 flex justify-center gap-1.5">
                {(['visual', 'rules', 'optimizer'] as const).map(phase => (
                  <div key={phase} className={`h-1 rounded-full transition-all duration-500 ${loadingPhase === phase ? 'w-8 bg-accent' : 'w-2 bg-border'}`} />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

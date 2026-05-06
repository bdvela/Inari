/**
 * CU-01: Wizard conversacional de cotización.
 * Paso 1: Descripción libre → Gemini extrae parámetros
 * Paso 2: Confirmar/corregir form + imágenes de estilo opcionales
 * Paso 3: Procesando
 */
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sparkles, ChevronRight, Loader2, X, CheckCircle, XCircle,
  ArrowLeft, AlertCircle, ImagePlus, Wand2, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { quotationsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { ParsedDescription, StyleAnalysisResult } from '../types'
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

interface StyleImageItem { file: File; preview: string }

export default function NewQuotationPage() {
  const navigate = useNavigate()
  const { role } = useAuth()

  useEffect(() => {
    if (role === 'admin') navigate('/admin/providers', { replace: true })
  }, [role, navigate])

  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1
  const [descText, setDescText]     = useState('')
  const [isParsing, setIsParsing]   = useState(false)
  const [parsed, setParsed]         = useState<ParsedDescription | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Step 2
  const [styleImages, setStyleImages] = useState<StyleImageItem[]>([])
  const [_styleAnalysis, setStyleAnalysis] = useState<StyleAnalysisResult | null>(null)
  void _styleAnalysis

  // Step 3
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    setStyleAnalysis(null)
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
    setStyleAnalysis(null)
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
        // NO setParsed — así parsed queda null y el bloque de error aparece en paso 2
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

      const result = await quotationsApi.generate(formData)
      if ((result as { style_detected?: StyleAnalysisResult }).style_detected) {
        setStyleAnalysis((result as { style_detected?: StyleAnalysisResult }).style_detected ?? null)
      }
      if (!result.basica_factible && !result.premium_factible) {
        setSubmitError(
          'El presupuesto no cubre los servicios mínimos. Considera aumentarlo o cambiar el tipo de evento.'
        )
        setStep(2)
        return
      }
      toast.success('¡Cotización generada!')
      const targetId = result.basica_factible ? result.quotation_basica_id : result.quotation_premium_id
      navigate(`/quotations/${targetId}`, { state: { result } })
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

  const STEPS = [
    { n: 1, label: 'Describe' },
    { n: 2, label: 'Confirma' },
    { n: 3, label: 'Generamos' },
  ]

  const PHASES = [
    { label: styleImages.length > 0 ? 'Análisis de estilo' : 'Configuración', phase: 'visual' as const },
    { label: 'Reglas de negocio',  phase: 'rules' as const },
    { label: 'Optimización IA',    phase: 'optimizer' as const },
  ]

  const TODAY = new Date().toISOString().split('T')[0]

  return (
    <div className="mesh min-h-screen px-8 py-10 pb-20">
      <div className="mesh-blob" />

      {/* ── Header ── */}
      <div className="max-w-[800px] mx-auto flex items-center justify-between mb-10">
        <div>
          <p className="text-xs font-semibold text-accent tracking-widest uppercase mb-1.5">Nueva solicitud</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-text-primary">Cotizar evento</h1>
        </div>
        <span className="font-mono text-xs text-text-muted">
          #INR-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 9000) + 1000)}
        </span>
      </div>

      {/* ── Stepper ── */}
      <div className="max-w-[800px] mx-auto flex items-center justify-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <div className="flex items-center gap-3.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm font-semibold transition-all duration-200 ${
                step > s.n
                  ? 'bg-accent text-white'
                  : step === s.n
                    ? 'bg-accent text-white shadow-accent'
                    : 'bg-white/70 text-text-muted border border-black/8'
              }`}>
                {step > s.n ? <CheckCircle size={15} /> : `0${s.n}`}
              </div>
              <span className={`text-sm font-medium transition-colors ${step >= s.n ? 'text-text-primary' : 'text-text-muted'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-20 h-px mx-4 transition-colors duration-200 ${step > s.n ? 'bg-accent' : 'bg-black/8'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── PASO 1 ── */}
      {step === 1 && (
        <div className="glass-raised animate-fade-in p-10 max-w-[760px] mx-auto">
          <p className="font-mono text-[11px] text-accent tracking-widest uppercase mb-3">Paso 01 · Descripción libre</p>
          <h2 className="font-display text-4xl font-bold tracking-tighter text-text-primary leading-tight mb-3">
            Cuéntanos sobre el evento.
          </h2>
          <p className="text-text-secondary text-sm mb-7 max-w-[540px] leading-relaxed">
            Descríbelo con tus propias palabras. No te preocupes por los detalles técnicos, nosotros los identificamos.
          </p>

          <div className="relative">
            <textarea
              className="input w-full resize-y"
              rows={7}
              placeholder={`Ej: "Quiero organizar el cumpleaños de mi hija de 15 años para unas 80 personas.\nMe gustaría una temática de flores y colores pastel.\nEl evento sería en julio y tengo un presupuesto de S/ 5,000."`}
              value={descText}
              onChange={e => { setDescText(e.target.value); setParseError(null) }}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleParseDescription() }}
              style={{ fontSize: 15, lineHeight: 1.6, padding: '16px 18px', paddingBottom: 36 }}
            />
            <span className="absolute bottom-3 right-3.5 font-mono text-[11px] text-text-muted">
              {descText.length} / 1200
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted mr-1">Sugerencias:</span>
            {['Boda 100 personas', 'Quinceañera moderna', 'Aniversario corporativo', 'Lanzamiento de marca'].map(s => (
              <button
                key={s}
                className="btn btn-sm text-text-secondary"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(26,23,20,0.08)', fontSize: 12 }}
                onClick={() => setDescText(prev => prev + (prev ? ', ' : '') + s.toLowerCase())}
              >
                + {s}
              </button>
            ))}
          </div>

          {parseError && (
            <div className="flex items-center gap-2.5 mt-4 px-3.5 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.20)', color: '#a85d00' }}>
              <AlertCircle size={15} className="flex-shrink-0" />
              {parseError}
            </div>
          )}

          <div className="flex items-center justify-between mt-9">
            <button className="btn btn-ghost text-sm" onClick={() => { setParsed(null); setStep(2) }}>
              Completar formulario directamente <ChevronRight size={14} />
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleParseDescription}
              disabled={isParsing || descText.trim().length < 10}
            >
              {isParsing
                ? <><Loader2 size={15} className="animate-spin" /> Analizando...</>
                : <><Wand2 size={15} /> Analizar mi evento</>}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 2 ── */}
      {step === 2 && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-[760px] mx-auto flex flex-col gap-5 animate-fade-in"
        >
          {/* Error: parseable=false — sin datos útiles */}
          {parseError && !parsed && (
            <div className="glass-raised p-8 animate-fade-in border border-danger/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
                  <XCircle size={18} className="text-danger" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">No pudimos identificar los datos de tu evento</p>
                  <p className="text-sm text-text-secondary">Intenta ser más específico en tu descripción</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-text-secondary mb-5">
                {[
                  '¿Qué tipo de evento es? (cumpleaños, boda, quinceañera...)',
                  '¿Para cuándo lo tienes planeado?',
                  '¿Cuántas personas asistirán?',
                  '¿Cuál es tu presupuesto aproximado en soles?',
                ].map(hint => (
                  <li key={hint} className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span> {hint}
                  </li>
                ))}
              </ul>
              <button className="btn btn-ghost text-sm" onClick={() => { setParseError(null); setStep(1) }}>
                ← Volver a describir el evento
              </button>
            </div>
          )}

          {/* Banner éxito: datos encontrados */}
          {parsed?.parseable && (
            <div className="rounded-2xl px-5 py-4 animate-fade-in"
              style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.24)' }}>
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle size={15} className="text-ok" />
                <span className="text-sm font-semibold text-ok">
                  Encontramos estos datos en tu descripción.
                </span>
                <span className="text-xs text-text-secondary ml-auto">
                  Confianza: {(parsed.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-3">
                Revisa y ajusta si es necesario. Los campos marcados con ★ fueron completados automáticamente.
              </p>
              <div className="flex flex-wrap gap-2">
                {parsed.event_type        && <span className="badge badge-accent">★ {EVENT_TYPE_LABELS[parsed.event_type] ?? parsed.event_type}</span>}
                {parsed.guest_count       && <span className="badge badge-accent">★ {parsed.guest_count} invitados</span>}
                {parsed.max_budget        && <span className="badge badge-accent">★ S/ {parsed.max_budget.toLocaleString()}</span>}
                {parsed.approximate_date  && <span className="badge badge-accent">★ {parsed.approximate_date}</span>}
                {parsed.style_hints?.map(s => <span key={s} className="badge badge-accent">★ {s}</span>)}
              </div>
            </div>
          )}

          {/* Alerta campos no detectados */}
          {parsed?.parseable && (() => {
            const missing: string[] = []
            if (!parsed.event_type)       missing.push('tipo de evento')
            if (!parsed.approximate_date) missing.push('fecha')
            if (!parsed.guest_count)      missing.push('número de invitados')
            if (!parsed.max_budget)       missing.push('presupuesto')
            if (missing.length === 0) return null
            return (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm animate-fade-in"
                style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.20)', color: '#a85d00' }}>
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>
                  No pudimos detectar: <strong>{missing.join(', ')}</strong>. Completa esos campos antes de continuar.
                </span>
              </div>
            )
          })()}

          {submitError && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.18)', color: '#b3271e' }}>
              <AlertCircle size={15} className="flex-shrink-0" />
              {submitError}
            </div>
          )}

          {/* Form card */}
          <div className="glass-raised p-10">
            <p className="font-mono text-[11px] text-accent tracking-widest uppercase mb-3">Paso 02 · Confirma los datos</p>
            <h2 className="font-display text-4xl font-bold tracking-tighter text-text-primary leading-tight mb-2">
              Esto es lo que entendimos.
            </h2>
            <p className="text-text-secondary text-sm mb-7 leading-relaxed">
              Edita cualquier campo. Los datos en{' '}
              <span className="text-accent font-semibold">naranja</span> fueron extraídos automáticamente.
            </p>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Tipo de evento</label>
                  {parsed?.event_type && (
                    <span className="text-[10px] font-semibold text-accent tracking-wide uppercase flex items-center gap-1">
                      <Sparkles size={9} /> Auto-completado
                    </span>
                  )}
                </div>
                <Controller
                  name="evento_tipo"
                  control={control}
                  render={({ field }) => (
                    <EventTypeSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={EVENT_TYPE_OPTIONS}
                      isAiDetected={!!parsed?.event_type}
                    />
                  )}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Fecha del evento</label>
                  {parsed?.approximate_date && (
                    <span className="text-[10px] font-semibold text-accent tracking-wide uppercase flex items-center gap-1">
                      <Sparkles size={9} /> Auto-completado
                    </span>
                  )}
                </div>
                <Controller
                  name="evento_fecha"
                  control={control}
                  render={({ field }) => (
                    <DateInput
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      isAiDetected={!!parsed?.approximate_date}
                      min={TODAY}
                    />
                  )}
                />
                {errors.evento_fecha && (
                  <p className="text-danger text-xs mt-1.5">{errors.evento_fecha.message}</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Número de invitados</label>
                  {parsed?.guest_count && (
                    <span className="text-[10px] font-semibold text-accent tracking-wide uppercase flex items-center gap-1">
                      <Sparkles size={9} /> Auto-completado
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  {...register('num_invitados')}
                  className="input"
                  min={1}
                  placeholder="ej. 150"
                  style={parsed?.guest_count ? {
                    background: 'rgba(232,87,42,0.04)',
                    borderColor: 'rgba(232,87,42,0.20)',
                    color: '#C94A1F',
                    fontWeight: 500,
                  } : {}}
                />
                {errors.num_invitados && (
                  <p className="text-danger text-xs mt-1.5">{errors.num_invitados.message}</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Presupuesto máximo (S/.)</label>
                  {parsed?.max_budget && (
                    <span className="text-[10px] font-semibold text-accent tracking-wide uppercase flex items-center gap-1">
                      <Sparkles size={9} /> Auto-completado
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  {...register('presupuesto_maximo')}
                  className="input font-mono"
                  min={100}
                  step={100}
                  placeholder="ej. 25000"
                  style={parsed?.max_budget ? {
                    background: 'rgba(232,87,42,0.04)',
                    borderColor: 'rgba(232,87,42,0.20)',
                    color: '#C94A1F',
                    fontWeight: 500,
                  } : {}}
                />
                {errors.presupuesto_maximo && (
                  <p className="text-danger text-xs mt-1.5">{errors.presupuesto_maximo.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="label mb-0">Estilo deseado (opcional)</label>
                  {parsed?.style_hints?.length ? (
                    <span className="text-[10px] font-semibold text-accent tracking-wide uppercase flex items-center gap-1">
                      <Sparkles size={9} /> Auto-completado
                    </span>
                  ) : null}
                </div>
                <input
                  type="text"
                  {...register('estilo')}
                  className="input"
                  placeholder="ej. romántico, minimalista, elegante clásico..."
                  style={parsed?.style_hints?.length ? {
                    background: 'rgba(232,87,42,0.04)',
                    borderColor: 'rgba(232,87,42,0.20)',
                    color: '#C94A1F',
                    fontWeight: 500,
                  } : {}}
                />
              </div>
            </div>
          </div>

          {/* Style images */}
          <div className="glass-raised p-8">
            <div className="flex items-center gap-2.5 mb-2">
              <ImagePlus size={16} className="text-accent" />
              <h3 className="font-display text-xl font-bold tracking-tight text-text-primary">
                Referencias de estilo{' '}
                <span className="text-sm font-normal text-text-muted">(opcional)</span>
              </h3>
            </div>
            <p className="text-sm text-text-secondary mb-5 leading-relaxed">
              Sube hasta 3 imágenes — decoración, colores, ambiente. El sistema detectará el estilo y personalizará la propuesta.
            </p>

            {styleImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {styleImages.map((item, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={item.preview}
                      alt={`Ref ${idx + 1}`}
                      className="w-full h-28 rounded-xl object-cover border border-black/8"
                    />
                    <button
                      type="button"
                      onClick={() => removeStyleImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-md bg-danger text-white flex items-center justify-center border-none cursor-pointer shadow-sm"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {styleImages.length < 3 && (
                  <div
                    {...getRootProps()}
                    className="h-28 rounded-xl border-2 border-dashed border-black/12 flex items-center justify-center cursor-pointer hover:border-accent/40 transition-colors"
                  >
                    <input {...getInputProps()} />
                    <ImagePlus size={20} className="text-text-muted" />
                  </div>
                )}
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? 'border-accent bg-accent/5'
                    : 'border-black/12 hover:border-accent/30'
                }`}
              >
                <input {...getInputProps()} />
                <ImagePlus size={28} className={`mx-auto mb-3 ${isDragActive ? 'text-accent' : 'text-text-muted'}`} />
                <p className="text-sm text-text-secondary">
                  {isDragActive
                    ? 'Suelta aquí'
                    : 'Arrastra imágenes o haz clic · hasta 3 · JPG, PNG, WEBP'}
                </p>
              </div>
            )}
          </div>

          {/* Nav */}
          <div className="flex justify-between">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setStep(1); setSubmitError(null); setParseError(null) }}
            >
              <ArrowLeft size={14} /> Reescribir descripción
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
              {isSubmitting
                ? <><Loader2 size={15} className="animate-spin" /> Generando...</>
                : <><Sparkles size={15} /> Generar cotización</>}
            </button>
          </div>
        </form>
      )}

      {/* ── PASO 3 ── */}
      {step === 3 && isSubmitting && (
        <div className="glass-raised animate-fade-in p-14 max-w-[760px] mx-auto text-center">
          <div className="relative w-22 h-22 mx-auto mb-7">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent-hover text-white flex items-center justify-center shadow-accent mx-auto">
              <Zap size={36} />
            </div>
            <div className="absolute inset-[-10px] rounded-full border-2 border-accent/30 animate-pulse-soft" />
          </div>

          <p className="font-mono text-[11px] text-accent tracking-widest uppercase mb-3">Paso 03 · Generando</p>
          <h2 className="font-display text-4xl font-bold tracking-tighter text-text-primary leading-tight mb-3">
            {loadingPhase === 'visual'    ? 'Analizando referencias de estilo…'
              : loadingPhase === 'rules' ? 'Aplicando reglas de negocio…'
              : 'Optimizando selección de proveedores…'}
          </h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-9 leading-relaxed">
            {styleImages.length > 0
              ? `Personalizando según ${styleImages.length} imagen${styleImages.length > 1 ? 'es' : ''} de referencia.`
              : 'Comparando proveedores compatibles según presupuesto, aforo y estilo.'}
          </p>

          <div className="flex flex-col gap-3.5 text-left">
            {PHASES.map(({ label, phase }) => {
              const order = ['visual', 'rules', 'optimizer']
              const ci = order.indexOf(loadingPhase ?? 'visual')
              const ti = order.indexOf(phase)
              const pct = ti < ci ? 100 : ti === ci
                ? (loadingPhase === 'visual' ? 62 : loadingPhase === 'rules' ? 45 : 20)
                : 0
              return (
                <div key={phase}>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className={`font-medium flex items-center gap-1.5 ${pct === 0 ? 'text-text-muted' : 'text-text-primary'}`}>
                      {pct === 100 && <CheckCircle size={13} className="text-ok" />}
                      {label}
                    </span>
                    <span className="font-mono text-xs text-text-muted">
                      {pct === 100 ? 'OK' : pct > 0 ? `${pct}%` : '—'}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-black/6 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-600"
                      style={{
                        width: `${pct}%`,
                        background: pct === 100 ? '#34C759' : 'linear-gradient(90deg,#E8572A,#FF9500)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Modal de registro para visitantes que quieren enviar su cotización a INARI.
 * Crea cuenta + guarda la cotización en un solo paso.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Send, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { AuthToken } from '../types'

const schema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  telefono_whatsapp: z
    .string()
    .regex(/^9\d{8}$/, 'Teléfono peruano inválido (9 dígitos, empieza en 9)'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  mensaje: z.string().max(500, 'Máximo 500 caracteres').optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  eventoData: {
    evento_tipo: string
    evento_fecha: string
    num_invitados: number
    presupuesto_maximo: number
    estilo?: string
    descripcion?: string
  }
  onSuccess: (quotationId: number) => void
  onClose: () => void
}

export default function RegisterWithQuotationModal({ eventoData, onSuccess, onClose }: Props) {
  const { loginWithToken } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    try {
      const result = await authApi.registerAndQuote({
        ...data,
        ...eventoData,
      })
      // Autenticar al usuario
      loginWithToken(result as unknown as AuthToken)
      // Navegar a la cotización guardada
      const targetId = result.basica_factible
        ? result.quotation_basica_id
        : result.quotation_premium_id
      onSuccess(targetId ?? 0)
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined
      setServerError(msg ?? 'Error al crear la cuenta. Intenta nuevamente.')
    }
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,23,20,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="glass-raised rounded-2xl shadow-lg w-full mx-4 animate-slide-up"
        style={{ maxWidth: 480, padding: '32px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="logo-mark" style={{ width: 28, height: 28, fontSize: 12 }}>I</span>
              <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', color: '#1D1D1F' }}>INARI GROUP</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Envía tu propuesta</h2>
            <p className="text-text-secondary text-sm mt-1">
              Crea tu cuenta y el equipo te contactará por WhatsApp.
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 -mr-1 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          {serverError && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.18)', color: '#b3271e' }}>
              {serverError}
            </div>
          )}

          <div>
            <label className="label">Nombre completo</label>
            <input {...register('nombre')} className="input w-full" placeholder="María García López" />
            {errors.nombre && <p className="text-danger text-xs mt-1.5">{errors.nombre.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input w-full" placeholder="maria@email.com" />
              {errors.email && <p className="text-danger text-xs mt-1.5">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input {...register('telefono_whatsapp')} type="tel" className="input w-full font-mono" placeholder="987654321" maxLength={9} />
              {errors.telefono_whatsapp && <p className="text-danger text-xs mt-1.5">{errors.telefono_whatsapp.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="input w-full"
                placeholder="Mínimo 8 caracteres"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#AEAEB2', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-danger text-xs mt-1.5">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label">
              Mensaje para INARI <span className="text-text-muted text-xs font-normal">(opcional)</span>
            </label>
            <textarea
              {...register('mensaje')}
              className="input w-full resize-none"
              rows={3}
              placeholder="¿Tienes alguna consulta, solicitud de descuento o detalle especial? Cuéntanos..."
            />
            {errors.mensaje && <p className="text-danger text-xs mt-1.5">{errors.mensaje.message}</p>}
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting} style={{ marginTop: 4 }}>
            {isSubmitting
              ? <><Loader2 size={15} className="animate-spin" /> Enviando propuesta...</>
              : <><Send size={15} /> Enviar a INARI GROUP</>}
          </button>

          <p className="text-center text-xs text-text-muted">
            Al registrarte aceptas que INARI GROUP te contacte por WhatsApp.
          </p>
        </form>
      </div>
    </div>,
    document.body
  )
}

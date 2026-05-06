import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null)
      await registerUser({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        telefono: data.telefono,
      })
      navigate('/')
    } catch {
      setError('No se pudo crear la cuenta. El email puede estar en uso.')
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — decorativo oscuro ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-bg relative overflow-hidden flex-col">
        {/* Círculo difuso dorado */}
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span
              className="font-display text-2xl font-bold text-accent"
              style={{ textShadow: '0 0 20px rgba(201,168,76,0.4)' }}
            >
              IG
            </span>
            <div className="leading-none">
              <div className="font-display font-bold tracking-widest text-white text-sm">INARI</div>
              <div className="text-[9px] tracking-[0.3em] text-accent/60 uppercase">GROUP</div>
            </div>
          </div>

          {/* Contenido central */}
          <div>
            <p className="text-accent/70 text-xs uppercase tracking-widest font-semibold mb-3">
              Cotización inteligente
            </p>
            <h2 className="font-display text-4xl font-bold text-white leading-tight mb-5">
              Tu evento,<br />
              <span className="text-accent">perfecto</span>
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Sube una imagen de referencia y recibe en menos de 3 minutos una propuesta básica y premium
              optimizada por inteligencia artificial para tu presupuesto.
            </p>
          </div>

          {/* Micro-stats */}
          <div className="flex items-center gap-3 text-white/25 text-xs">
            <span>+500 eventos</span>
            <span className="text-accent/30">·</span>
            <span>8 años</span>
            <span className="text-accent/30">·</span>
            <span>Lima, Perú</span>
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario claro ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg">
        <div className="bg-surface border border-border rounded-2xl shadow-lg p-8 max-w-[420px] w-full animate-fade-in">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="font-display text-xl font-bold text-accent">IG</span>
            <div className="leading-none">
              <div className="font-display font-bold tracking-widest text-text-primary text-xs">INARI</div>
              <div className="text-[8px] tracking-[0.3em] text-accent/60 uppercase">GROUP</div>
            </div>
          </div>

          <p className="text-accent/70 text-[10px] uppercase tracking-widest font-semibold mb-1">
            Crear cuenta
          </p>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Únete a Inari</h2>
          <p className="text-text-secondary text-sm mb-8">Completa tus datos para comenzar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Nombre completo</label>
              <input
                type="text"
                {...register('nombre')}
                className="input-field"
                placeholder="Tu nombre"
              />
              {errors.nombre && (
                <p className="text-danger text-xs mt-1.5">{errors.nombre.message}</p>
              )}
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                {...register('email')}
                className="input-field"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="text-danger text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Teléfono (opcional)</label>
              <input
                type="tel"
                {...register('telefono')}
                className="input-field"
                placeholder="9XXXXXXXX"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Contraseña</label>
                <input
                  type="password"
                  {...register('password')}
                  className="input-field"
                  placeholder="Mín. 6 caracteres"
                />
                {errors.password && (
                  <p className="text-danger text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="label">Confirmar</label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="input-field"
                  placeholder="Repetir"
                />
                {errors.confirmPassword && (
                  <p className="text-danger text-xs mt-1.5">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isSubmitting ? (
                <span className="animate-pulse-soft">Creando cuenta...</span>
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-secondary">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="text-accent font-semibold hover:text-accent transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

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
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(233,69,96,0.15),_transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent-500 rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-sm">I</span>
            </div>
            <span className="text-white font-bold text-lg">Inari Group</span>
          </div>

          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Únete y organiza<br />
              <span className="text-accent-400">eventos memorables</span>
            </h2>
            <p className="text-white/60 text-base max-w-md leading-relaxed">
              Crea tu cuenta para acceder al cotizador inteligente y gestionar tus eventos desde un solo lugar.
            </p>
          </div>

          <p className="text-white/30 text-xs">
            Inari Group · Lima, Perú · 2026
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-12 h-12 bg-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-glow">
              <span className="text-white font-black text-lg">I</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Inari Group</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h2>
          <p className="text-gray-500 text-sm mb-8">Completa tus datos para comenzar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Nombre completo</label>
              <input
                type="text"
                {...register('nombre')}
                className="input-field"
                placeholder="Tu nombre"
              />
              {errors.nombre && <p className="text-red-500 text-xs mt-1.5">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                {...register('email')}
                className="input-field"
                placeholder="tu@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
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
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
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
                  <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-100">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
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

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-accent-500 font-semibold hover:text-accent-600 transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const schema = z.object({
  nombre:          z.string().min(2, 'Mínimo 2 caracteres'),
  email:           z.string().email('Email inválido'),
  telefono:        z.string().optional(),
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})
type RegisterForm = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError]             = useState<string | null>(null)
  const [showPassword, setShowPw]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<RegisterForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null)
      await registerUser({ nombre: data.nombre, email: data.email, password: data.password, telefono: data.telefono })
      navigate('/dashboard')
    } catch {
      setError('No se pudo crear la cuenta. El email puede estar en uso.')
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', minHeight: '100vh' }}>

      {/* ── Izquierda — mesh dark ── */}
      <div
        className="mesh-dark hidden lg:flex flex-col justify-between"
        style={{ padding: '48px 56px' }}
      >
        <img src="/logo.png" alt="INARI GROUP SAC" style={{ width: 120, height: 120, objectFit: 'contain', alignSelf: 'flex-start', filter: 'brightness(0) invert(1)' }} />

        <div>
          <div style={{
            fontSize: 12, color: 'rgba(232,87,42,0.85)',
            fontWeight: 600, letterSpacing: '0.16em',
            textTransform: 'uppercase', marginBottom: 22,
          }}>
            — Empieza gratis
          </div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 800,
            fontSize: 72, lineHeight: 0.98,
            margin: 0, color: '#F2EFE9', letterSpacing: '-0.035em',
          }}>
            Tu evento,<br/><span className="text-gradient">perfecto.</span>
          </h1>
          <p style={{
            marginTop: 26, fontSize: 16, lineHeight: 1.6,
            color: 'rgba(242,239,233,0.65)', maxWidth: 420,
          }}>
            Genera cotizaciones personalizadas con inteligencia artificial. Básica y premium en menos de 3 minutos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {[{ v: '+500', l: 'eventos' }, { v: '43', l: 'proveedores' }, { v: '<3min', l: 'por cotización' }].map(s => (
            <div key={s.l} className="glass-dark" style={{ flex: 1, padding: '18px 20px' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, fontWeight: 800, color: '#F2EFE9', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {s.v}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(242,239,233,0.55)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Derecha — form ── */}
      <div className="mesh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div className="mesh-blob" />

        <div className="glass-raised animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 40 }}>

          {/* Logo mobile */}
          <div className="lg:hidden" style={{ marginBottom: 32 }}>
            <img src="/logo.png" alt="INARI GROUP SAC" style={{ height: 60, width: 'auto' }} />
          </div>

          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#E8572A', letterSpacing: '0.14em', marginBottom: 14 }}>
            NUEVA CUENTA
          </div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 34, fontWeight: 700, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05, color: '#1D1D1F' }}>
            Crea tu cuenta.
          </h2>
          <p style={{ marginTop: 10, marginBottom: 28, fontSize: 14, color: '#6E6E73' }}>
            Completa tus datos para empezar.
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Nombre completo</label>
              <input {...register('nombre')} type="text" className="input" placeholder="María García" autoComplete="name" />
              {errors.nombre && <p style={{ color: '#FF3B30', fontSize: 12, marginTop: 6 }}>{errors.nombre.message}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="tu@email.com" autoComplete="email" />
              {errors.email && <p style={{ color: '#FF3B30', fontSize: 12, marginTop: 6 }}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Teléfono <span style={{ color: '#AEAEB2', fontWeight: 400 }}>(opcional)</span></label>
              <input {...register('telefono')} type="tel" className="input font-mono" placeholder="9XXXXXXXX" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="label">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input" placeholder="Mín. 8 chars" style={{ paddingRight: 40 }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#AEAEB2', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p style={{ color: '#FF3B30', fontSize: 12, marginTop: 6 }}>{errors.password.message}</p>}
              </div>
              <div>
                <label className="label">Confirmar</label>
                <div style={{ position: 'relative' }}>
                  <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} className="input" placeholder="Repetir" style={{ paddingRight: 40 }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#AEAEB2', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirmPassword && <p style={{ color: '#FF3B30', fontSize: 12, marginTop: 6 }}>{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.18)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#b3271e' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {isSubmitting ? 'Creando cuenta...' : (<>Crear cuenta <ArrowRight size={15} /></>)}
            </button>
          </form>

          <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid rgba(26,23,20,0.08)', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#6E6E73' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: '#E8572A', fontWeight: 600, textDecoration: 'none' }}>
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

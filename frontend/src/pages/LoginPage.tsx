import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type LoginForm = z.infer<typeof loginSchema>

const STATS = [
  { v: '+500', l: 'eventos' },
  { v: '43',   l: 'proveedores' },
  { v: '9.2',  l: 'NPS interno' },
]

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null)
      await login(data.email, data.password)
      const role = localStorage.getItem('user_role')
      navigate(role === 'admin' ? '/admin/providers' : '/dashboard')
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', minHeight: '100vh' }}>

      {/* ── Izquierda — mesh dark ── */}
      <div
        className="mesh-dark hidden lg:flex flex-col justify-between"
        style={{ padding: '48px 56px' }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="logo-mark">I</span>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 13, letterSpacing: '0.18em', lineHeight: 1.1, color: '#F2EFE9',
          }}>
            INARI<br/>
            <span style={{ color: 'rgba(242,239,233,0.55)', fontWeight: 600 }}>GROUP</span>
          </span>
        </div>

        {/* Headline */}
        <div>
          <div style={{
            fontSize: 12, color: 'rgba(232,87,42,0.85)',
            fontWeight: 600, letterSpacing: '0.16em',
            textTransform: 'uppercase', marginBottom: 22,
          }}>
            — Inari Group · Lima
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 78, lineHeight: 0.98,
            margin: 0, color: '#F2EFE9', letterSpacing: '-0.035em',
          }}>
            Eventos<br/>que <span className="text-gradient">trascienden</span>.
          </h1>
          <p style={{
            marginTop: 26, fontSize: 17, lineHeight: 1.55,
            color: 'rgba(242,239,233,0.65)', maxWidth: 460,
          }}>
            La plataforma interna de coordinación de Inari. Cotiza, asigna proveedores
            y produce eventos sin fricción.
          </p>
        </div>

        {/* Micro-stats */}
        <div style={{ display: 'flex', gap: 12 }}>
          {STATS.map((s) => (
            <div key={s.l} className="glass-dark" style={{ flex: 1, padding: '18px 20px' }}>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800,
                color: '#F2EFE9', letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {s.v}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(242,239,233,0.55)' }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Derecha — mesh claro con form ── */}
      <div className="mesh" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 48,
      }}>
        <div className="mesh-blob" />

        {/* Card glass-raised */}
        <div className="glass-raised animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: 40 }}>

          {/* Logo mobile */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <span className="logo-mark">I</span>
            <span style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800,
              fontSize: 13, letterSpacing: '0.18em', lineHeight: 1.1,
            }}>
              INARI<br/><span style={{ color: '#6E6E73', fontWeight: 600 }}>GROUP</span>
            </span>
          </div>

          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#E8572A', letterSpacing: '0.14em', marginBottom: 14 }}>
            ACCESO INTERNO
          </div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 700,
            margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05, color: '#1D1D1F',
          }}>
            Bienvenido<br/>de vuelta.
          </h2>
          <p style={{ marginTop: 12, marginBottom: 32, fontSize: 14, color: '#6E6E73' }}>
            Ingresa con tu cuenta de equipo Inari.
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label className="label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#AEAEB2', pointerEvents: 'none' }} />
                <input
                  {...register('email')}
                  type="email"
                  className="input"
                  placeholder="nombre@inari.pe"
                  autoComplete="email"
                  style={{ paddingLeft: 40 }}
                />
              </div>
              {errors.email && (
                <p style={{ color: '#FF3B30', fontSize: 12, marginTop: 6 }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 10 }}>
              <label className="label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#AEAEB2', pointerEvents: 'none' }} />
                <input
                  {...register('password')}
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingLeft: 40 }}
                />
              </div>
              {errors.password && (
                <p style={{ color: '#FF3B30', fontSize: 12, marginTop: 6 }}>{errors.password.message}</p>
              )}
            </div>

            {/* Remember + forgot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#6E6E73', cursor: 'pointer' }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: '#E8572A', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                Recordarme
              </label>
              <span style={{ fontSize: 13, color: '#AEAEB2' }}>
                ¿Olvidaste tu clave?
              </span>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.18)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                fontSize: 13, color: '#b3271e',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Ingresando...' : (<>Ingresar <ArrowRight size={15} /></>)}
            </button>
          </form>

          {/* Create account */}
          <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: '#6E6E73' }}>
            ¿Aún no tienes acceso?{' '}
            <Link to="/register" style={{ color: '#E8572A', textDecoration: 'none', fontWeight: 600 }}>
              Solicítalo a tu administrador
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}

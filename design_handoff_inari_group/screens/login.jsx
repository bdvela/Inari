/* ============================================================
   INARI GROUP — Login
   ============================================================ */

const Icon = window.IG_Icon;

function LoginLogo({ inverse }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className="logo-mark">I</span>
      <span className="logo-text" style={inverse ? { color: '#F2EFE9' } : {}}>
        INARI<br/>
        <span className="sub" style={inverse ? { color: 'rgba(242,239,233,0.55)' } : {}}>GROUP</span>
      </span>
    </div>
  );
}

function Login() {
  const [email, setEmail] = React.useState('');
  const [pwd, setPwd] = React.useState('');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', minHeight: '100%', width: '100%' }}>
      {/* LEFT: dark mesh */}
      <div className="mesh-dark" style={{ padding: '48px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 900 }}>
        <LoginLogo inverse />

        <div>
          <div style={{ fontSize: 12, color: 'rgba(232,87,42,0.85)', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 22 }}>
            — Inari Group · Lima
          </div>
          <h1 className="font-display" style={{
            fontSize: 78, fontWeight: 800, lineHeight: 0.98,
            margin: 0, color: 'var(--text-cream)', letterSpacing: '-0.035em',
          }}>
            Eventos<br/>que <span className="text-gradient">trascienden</span>.
          </h1>
          <p style={{
            marginTop: 26, fontSize: 17, lineHeight: 1.55,
            color: 'rgba(242,239,233,0.65)', maxWidth: 460,
          }}>
            La plataforma interna de coordinación de Inari. Cotiza, asigna proveedores y produce eventos sin fricción.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { v: '+500', l: 'eventos' },
            { v: '43',   l: 'proveedores' },
            { v: '9.2',  l: 'NPS interno' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '18px 20px', borderRadius: 14,
              background: 'rgba(242,239,233,0.06)',
              border: '1px solid rgba(242,239,233,0.10)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            }}>
              <div className="font-display" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-cream)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.v}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(242,239,233,0.55)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: cream form */}
      <div className="mesh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, minHeight: 900 }}>
        <span className="mesh-blob"/>
        <div className="glass-raised" style={{
          width: '100%', maxWidth: 420, padding: 40,
          background: 'rgba(255,255,255,0.85)',
        }}>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 14 }}>
            ACCESO INTERNO
          </div>
          <h2 className="font-display" style={{ fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Bienvenido<br/>de vuelta.
          </h2>
          <p style={{ marginTop: 12, marginBottom: 32, fontSize: 14, color: 'var(--text-secondary)' }}>
            Ingresa con tu cuenta de equipo Inari.
          </p>

          <div style={{ marginBottom: 18 }}>
            <label className="label">Email</label>
            <div style={{ position: 'relative' }}>
              <Icon.Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
              <input
                className="input" type="email" placeholder="nombre@inari.pe"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label className="label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Icon.Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
              <input
                className="input" type="password" placeholder="••••••••"
                value={pwd} onChange={e => setPwd(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Icon.Check size={11} />
              </span>
              Recordarme
            </label>
            <a href="#" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>¿Olvidaste tu clave?</a>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Ingresar <Icon.Arrow size={15} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>O</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%' }}>
            <Icon.Globe size={15} /> Continuar con Google
          </button>

          <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
            ¿Aún no eres parte del equipo?{' '}
            <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Crear cuenta</a>
          </div>
        </div>
      </div>
    </div>
  );
}

window.IG_Login = Login;

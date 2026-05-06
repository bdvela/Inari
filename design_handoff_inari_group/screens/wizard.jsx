/* ============================================================
   INARI GROUP — New Quotation Wizard
   ============================================================ */

const Icon = window.IG_Icon;

function StepBar({ step }) {
  const steps = [
    { n: 1, label: 'Describe' },
    { n: 2, label: 'Confirma' },
    { n: 3, label: 'Generamos' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'center', marginBottom: 56 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 99,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13, fontWeight: 600,
              background: step > s.n ? 'var(--accent)' : step === s.n ? 'linear-gradient(145deg, #E8572A, #C94A1F)' : 'rgba(255,255,255,0.7)',
              color: step >= s.n ? '#fff' : 'var(--text-muted)',
              border: '1px solid ' + (step >= s.n ? 'transparent' : 'var(--border)'),
              boxShadow: step === s.n ? 'var(--shadow-accent)' : 'none',
              transition: 'all 220ms',
            }}>
              {step > s.n ? <Icon.Check size={15} /> : '0' + s.n}
            </div>
            <div style={{
              fontSize: 13, fontWeight: step === s.n ? 600 : 500,
              color: step >= s.n ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>{s.label}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 80, height: 1, margin: '0 18px',
              background: step > s.n ? 'var(--accent)' : 'var(--border)',
              transition: 'background 220ms',
            }}/>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Step1({ onNext }) {
  const [val, setVal] = React.useState('Boda de 120 invitados a mediados de junio en Casa Hacienda en Pachacámac. Estilo elegante pero relajado. Presupuesto S/ 50,000. Importante: catering peruano contemporáneo y banda en vivo.');
  return (
    <div className="glass-raised" style={{ padding: 40, maxWidth: 760, margin: '0 auto' }}>
      <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 12 }}>
        PASO 01 · DESCRIPCIÓN LIBRE
      </div>
      <h2 className="font-display" style={{ fontSize: 38, fontWeight: 700, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
        Cuéntanos sobre el evento.
      </h2>
      <p style={{ marginTop: 12, fontSize: 15, color: 'var(--text-secondary)', maxWidth: 540 }}>
        En lenguaje natural — fecha, número de invitados, locación, presupuesto, estilo. La IA extrae los datos.
      </p>

      <div style={{ marginTop: 28, position: 'relative' }}>
        <textarea
          value={val}
          onChange={e => setVal(e.target.value)}
          rows={7}
          className="input"
          style={{ fontSize: 16, lineHeight: 1.55, resize: 'vertical', padding: 18, fontFamily: 'inherit' }}
        />
        <div style={{
          position: 'absolute', bottom: 12, right: 14,
          fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace",
        }}>{val.length} / 1200</div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 6 }}>Sugerencias:</span>
        {['Boda 100 personas', 'Quinceañera moderna', 'Aniversario corporativo', 'Lanzamiento de marca'].map(s => (
          <button key={s} className="btn btn-sm" style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 12, fontWeight: 500,
          }}>+ {s}</button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36 }}>
        <button className="btn btn-ghost">Cancelar</button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>
          Continuar <Icon.Arrow size={15} />
        </button>
      </div>
    </div>
  );
}

function Step2({ onBack, onNext }) {
  return (
    <div className="glass-raised" style={{ padding: 40, maxWidth: 760, margin: '0 auto' }}>
      <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 12 }}>
        PASO 02 · CONFIRMA LOS DATOS
      </div>
      <h2 className="font-display" style={{ fontSize: 38, fontWeight: 700, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
        Esto es lo que entendimos.
      </h2>
      <p style={{ marginTop: 12, fontSize: 15, color: 'var(--text-secondary)' }}>
        Edita cualquier campo. Los datos en <span style={{ color: 'var(--accent)', fontWeight: 600 }}>naranja</span> fueron extraídos automáticamente.
      </p>

      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {[
          { label: 'Tipo de evento',  value: 'Boda',                       extracted: true },
          { label: 'Aforo estimado',  value: '120 invitados',              extracted: true },
          { label: 'Fecha tentativa', value: '14 / 06 / 2026',             extracted: true },
          { label: 'Locación',        value: 'Casa Hacienda · Pachacámac', extracted: true },
          { label: 'Presupuesto',     value: 'S/ 50,000',                  extracted: true,  mono: true },
          { label: 'Estilo',          value: 'Elegante relajado',          extracted: true },
        ].map((f, i) => (
          <div key={i}>
            <label className="label">{f.label}</label>
            <input
              className="input"
              defaultValue={f.value}
              style={{
                fontFamily: f.mono ? "'JetBrains Mono', monospace" : 'inherit',
                color: f.extracted ? 'var(--accent-hover)' : 'var(--text-primary)',
                fontWeight: 500,
                background: f.extracted ? 'rgba(232,87,42,0.04)' : 'rgba(255,255,255,0.7)',
                borderColor: f.extracted ? 'rgba(232,87,42,0.20)' : 'var(--border)',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <label className="label">Solicitudes especiales</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Catering peruano contemporáneo', 'Banda en vivo', 'Coreografía de entrada'].map(t => (
            <span key={t} className="badge badge-accent" style={{ padding: '8px 14px', fontSize: 13, textTransform: 'none', letterSpacing: 'normal', fontWeight: 500 }}>
              {t}
              <Icon.Plus size={12} style={{ transform: 'rotate(45deg)', marginLeft: 4, opacity: 0.6, cursor: 'pointer' }} />
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36 }}>
        <button className="btn btn-ghost" onClick={onBack}>← Anterior</button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>
          Generar cotización <Icon.Sparkles size={15} />
        </button>
      </div>
    </div>
  );
}

function Step3() {
  const phases = [
    { label: 'Datos estructurados',    pct: 100 },
    { label: 'Matching con proveedores', pct: 100 },
    { label: 'Comparativa de precios',  pct: 78 },
    { label: 'Score de calidad',        pct: 24 },
    { label: 'Propuestas finales',      pct: 0 },
  ];
  return (
    <div className="glass-raised" style={{ padding: 56, maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        margin: '0 auto 28px', width: 88, height: 88, borderRadius: 99,
        background: 'linear-gradient(145deg, #E8572A, #C94A1F)',
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-accent)',
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute', inset: -10, borderRadius: 99,
          border: '2px solid rgba(232,87,42,0.30)',
          animation: 'pulse 1.6s ease-in-out infinite',
        }}/>
        <Icon.Zap size={36} />
      </div>
      <style>{`@keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.6 } 50% { transform: scale(1.18); opacity: 0 } }`}</style>

      <div className="font-mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 12 }}>
        PASO 03 · GENERANDO
      </div>
      <h2 className="font-display" style={{ fontSize: 40, fontWeight: 700, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
        Diseñando tu cotización…
      </h2>
      <p style={{ marginTop: 14, fontSize: 15, color: 'var(--text-secondary)', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
        Comparando 14 proveedores compatibles según presupuesto, aforo y estilo. Esto toma menos de 60 segundos.
      </p>

      <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        {phases.map((p, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: p.pct === 0 ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 500 }}>
                {p.pct === 100 && <Icon.Check size={13} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 6, color: 'var(--ok)' }} />}
                {p.label}
              </span>
              <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {p.pct === 100 ? 'OK' : p.pct + '%'}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(26,23,20,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: p.pct + '%',
                background: p.pct === 100 ? 'var(--ok)' : 'linear-gradient(90deg, #E8572A, #FF9500)',
                borderRadius: 99,
                transition: 'width 600ms ease-out',
              }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Wizard() {
  const [step, setStep] = React.useState(2);
  return (
    <div className="mesh" style={{ minHeight: '100%', width: '100%', padding: '40px 32px 80px' }}>
      <span className="mesh-blob"/>

      {/* slim header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="logo-mark">I</span>
          <span className="logo-text">INARI<br/><span className="sub">GROUP</span></span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Cotización <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>#INR-2848</span>
        </div>
      </div>

      <StepBar step={step} />

      {step === 1 && <Step1 onNext={() => setStep(2)} />}
      {step === 2 && <Step2 onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <Step3 />}

      {/* dev step toggles */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
        {[1,2,3].map(n => (
          <button key={n}
            className="btn btn-sm"
            onClick={() => setStep(n)}
            style={{
              background: step === n ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
              color: step === n ? '#fff' : 'var(--text-secondary)',
              border: '1px solid ' + (step === n ? 'transparent' : 'var(--border)'),
              minWidth: 80,
            }}>Vista paso {n}</button>
        ))}
      </div>
    </div>
  );
}

window.IG_Wizard = Wizard;

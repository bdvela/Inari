import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  PlusCircle, AlertCircle, CheckCircle, Clock,
  BarChart2, Star, TrendingUp, Search, ArrowUpRight,
  Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { quotationsApi } from '../services/api'
import type { QuotationSummary } from '../types'
import QualityBar from '../components/shared/QualityBar'

// ── Sub-components ─────────────────────────────────────────────

function StatusBadge({ estado }: { estado: QuotationSummary['estado'] }) {
  const config = {
    completado: { cls: 'badge-success', icon: <CheckCircle size={11} />, label: 'Completado' },
    procesando: { cls: 'badge-warning', icon: <Clock size={11} />,        label: 'Procesando' },
    error:      { cls: 'badge-error',   icon: <AlertCircle size={11} />,  label: 'Error'      },
  }
  const c = config[estado]
  return <span className={`badge ${c.cls}`}>{c.icon}{c.label}</span>
}

function LevelBadge({ nivel }: { nivel: QuotationSummary['nivel'] }) {
  return nivel === 'premium'
    ? <span className="badge badge-accent">Premium</span>
    : <span className="badge badge-neutral">Básica</span>
}

function EventLabel({ tipo }: { tipo: string }) {
  const labels: Record<string, string> = {
    boda: 'Boda', corporativo: 'Corporativo', cumpleanos: 'Cumpleaños',
    quinceanos: 'Quinceañera', conferencia: 'Conferencia', otro: 'Otro',
  }
  return <span style={{ fontSize: 14, color: '#6E6E73' }}>{labels[tipo] ?? tipo}</span>
}

function StatCard({
  label, value, suffix, icon: Icon, accent = false,
}: {
  label: string; value: string | number; suffix?: string
  icon: React.ElementType; accent?: boolean
}) {
  return (
    <div className="glass card-hover" style={{ padding: 24, position: 'relative', minHeight: 132 }}>
      <div style={{
        position: 'absolute', top: 18, right: 18,
        width: 38, height: 38, borderRadius: 10,
        background: accent ? 'rgba(232,87,42,0.10)' : 'rgba(26,23,20,0.05)',
        color: accent ? '#E8572A' : '#6E6E73',
        border: `1px solid ${accent ? 'rgba(232,87,42,0.18)' : 'rgba(26,23,20,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} />
      </div>
      <div style={{
        fontSize: 12, color: '#6E6E73', fontWeight: 500,
        letterSpacing: '0.04em', textTransform: 'uppercase' as const,
      }}>
        {label}
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 44,
          fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: '#1D1D1F',
        }}>
          {value}
        </span>
        {suffix && (
          <span style={{ fontSize: 14, color: '#AEAEB2', fontWeight: 500 }}>{suffix}</span>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

const FILTERS = ['Todas', 'Boda', 'Corporativo', 'Quinceañera', 'Otros']

export default function DashboardPage() {
  const navigate = useNavigate()
  const { role, nombre } = useAuth()
  const isStaff = role === 'ejecutivo' || role === 'admin'

  const [search, setSearch]         = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState('Todas')

  const { data: quotations, isLoading, isError, refetch } = useQuery({
    queryKey: ['quotations'],
    queryFn:  quotationsApi.list,
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn:  quotationsApi.getStats,
  })

  const filtered = useMemo(() => {
    if (!quotations) return []
    return quotations.filter((q) => {
      const matchSearch = !search ||
        q.evento_nombre.toLowerCase().includes(search.toLowerCase()) ||
        (isStaff && q.cliente_nombre?.toLowerCase().includes(search.toLowerCase()))
      const matchEstado = !filterEstado || q.estado === filterEstado
      return matchSearch && matchEstado
    })
  }, [quotations, search, filterEstado, isStaff])

  const qualityPct = stats?.quality_score_promedio != null
    ? stats.quality_score_promedio * 100
    : 0

  const firstName = nombre ? nombre.split(' ')[0] : 'equipo'

  return (
    <div className="mesh" style={{ minHeight: '100vh', padding: '40px 48px 64px' }}>
      <div className="mesh-blob" />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <div style={{
            fontSize: 12, color: '#E8572A', fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 10,
          }}>
            {isStaff ? `Panel ${role}` : 'Mi panel'}
          </div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 44, fontWeight: 800,
            margin: 0, letterSpacing: '-0.03em', lineHeight: 1, color: '#1D1D1F',
          }}>
            Hola, {firstName}.
          </h1>
          <p style={{ marginTop: 10, fontSize: 15, color: '#6E6E73' }}>
            {isStaff ? 'Todas las cotizaciones del sistema' : 'Mis eventos y propuestas'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {role !== 'admin' && (
            <button className="btn btn-primary" onClick={() => navigate('/quotations/new')}>
              <PlusCircle size={15} /> Nueva cotización
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total cotizaciones" value={stats.total} icon={BarChart2} />
          <StatCard label="Completadas" value={stats.completadas} suffix={`/ ${stats.total}`} icon={CheckCircle} />
          <StatCard
            label="Calidad promedio"
            value={stats.quality_score_promedio != null ? `${qualityPct.toFixed(0)}%` : '—'}
            icon={Star}
            accent
          />
          <StatCard
            label="Costo promedio"
            value={stats.costo_promedio != null ? `S/${(stats.costo_promedio / 1000).toFixed(1)}k` : '—'}
            icon={TrendingUp}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="glass" style={{ padding: 24, height: 132 }}>
              <div style={{ height: 12, borderRadius: 6, background: 'rgba(26,23,20,0.06)', width: '60%', marginBottom: 14 }} />
              <div style={{ height: 40, borderRadius: 8, background: 'rgba(26,23,20,0.06)', width: '40%' }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="glass" style={{ padding: 24 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid rgba(26,23,20,0.04)' }}>
              {[120,200,120,80,120,100,120].map((w, j) => (
                <div key={j} style={{ height: 14, borderRadius: 4, background: 'rgba(26,23,20,0.06)', width: w }} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="glass" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <AlertCircle size={20} style={{ color: '#FF3B30', flexShrink: 0 }} />
          <p style={{ fontSize: 14, color: '#1D1D1F', flex: 1, margin: 0 }}>
            No se pudieron cargar las cotizaciones.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Reintentar</button>
        </div>
      )}

      {/* ── Empty ── */}
      {quotations && quotations.length === 0 && (
        <div className="glass" style={{ padding: 64, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(232,87,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <BarChart2 size={28} style={{ color: '#E8572A' }} />
          </div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 26, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {isStaff ? 'No hay cotizaciones aún' : 'Aún no tienes cotizaciones'}
          </h3>
          <p style={{ fontSize: 14, color: '#6E6E73', maxWidth: 360, margin: '0 auto 28px', lineHeight: 1.6 }}>
            {isStaff
              ? 'Las cotizaciones generadas por clientes aparecerán aquí.'
              : 'Describe tu evento y recibe una propuesta personalizada en minutos.'}
          </p>
          {role !== 'admin' && (
            <button className="btn btn-primary" onClick={() => navigate('/quotations/new')}>
              <PlusCircle size={15} /> {isStaff ? 'Crear cotización' : 'Crear mi primera cotización'}
            </button>
          )}
        </div>
      )}

      {/* ── Filtros + tabla ── */}
      {quotations && quotations.length > 0 && (
        <>
          {/* Filter bar */}
          <div className="glass" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#AEAEB2', pointerEvents: 'none' }} />
              <input
                className="input"
                placeholder={isStaff ? 'Buscar por cliente, evento...' : 'Buscar evento...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className="btn btn-sm"
                  onClick={() => setActiveFilter(f)}
                  style={{
                    background: activeFilter === f ? 'rgba(232,87,42,0.10)' : 'transparent',
                    color: activeFilter === f ? '#E8572A' : '#6E6E73',
                    border: activeFilter === f ? '1px solid rgba(232,87,42,0.20)' : '1px solid transparent',
                    fontWeight: activeFilter === f ? 600 : 500,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <select
              className="input"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              style={{ maxWidth: 160 }}
            >
              <option value="">Todos los estados</option>
              <option value="completado">Completado</option>
              <option value="procesando">Procesando</option>
              <option value="error">Error</option>
            </select>
            {filtered.length !== quotations.length && (
              <span style={{ fontSize: 12, color: '#AEAEB2', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {filtered.length} de {quotations.length}
              </span>
            )}
          </div>

          {/* Table */}
          <div className="glass" style={{ overflow: 'hidden', padding: 0 }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isStaff
                ? '1.4fr 1fr 1fr 1fr 1fr 1fr 140px 32px'
                : '1.4fr 1fr 1fr 1fr 1fr 140px 32px',
              padding: '14px 22px',
              fontSize: 11, fontWeight: 600, color: '#AEAEB2',
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              borderBottom: '1px solid rgba(26,23,20,0.06)',
            }}>
              <div>Evento</div>
              {isStaff && <div>Cliente</div>}
              <div>Tipo</div>
              <div>Nivel</div>
              <div>Estado</div>
              <div style={{ textAlign: 'right' as const }}>Costo</div>
              <div style={{ textAlign: 'right' as const }}>Calidad</div>
              <div>Fecha</div>
              <div />
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: '48px 22px', textAlign: 'center' as const, fontSize: 14, color: '#6E6E73' }}>
                Sin resultados para los filtros seleccionados
              </div>
            ) : filtered.map((q, i) => (
              <div
                key={q.id}
                onClick={() => navigate(`/quotations/${q.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isStaff
                    ? '1.4fr 1fr 1fr 1fr 1fr 1fr 140px 32px'
                    : '1.4fr 1fr 1fr 1fr 1fr 140px 32px',
                  padding: '16px 22px',
                  alignItems: 'center',
                  fontSize: 14,
                  background: i % 2 === 1 ? 'rgba(255,255,255,0.40)' : 'transparent',
                  borderBottom: i === filtered.length - 1 ? 'none' : '1px solid rgba(26,23,20,0.04)',
                  cursor: 'pointer',
                  transition: 'background 180ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(232,87,42,0.05)'
                  const arrow = e.currentTarget.querySelector('.row-arrow') as HTMLElement | null
                  if (arrow) { arrow.style.opacity = '1'; arrow.style.transform = 'translateX(2px)' }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = i % 2 === 1 ? 'rgba(255,255,255,0.40)' : 'transparent'
                  const arrow = e.currentTarget.querySelector('.row-arrow') as HTMLElement | null
                  if (arrow) { arrow.style.opacity = '0'; arrow.style.transform = 'translateX(0)' }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(26,23,20,0.06)', color: '#1D1D1F',
                    fontSize: 11, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {q.evento_nombre.split(' ').map((s: string) => s[0]).slice(0,2).join('')}
                  </div>
                  <span style={{ fontWeight: 500, color: '#1D1D1F' }}>{q.evento_nombre}</span>
                </div>
                {isStaff && (
                  <div style={{ fontSize: 13, color: '#6E6E73' }}>{q.cliente_nombre ?? '—'}</div>
                )}
                <EventLabel tipo={q.evento_tipo} />
                <div><LevelBadge nivel={q.nivel} /></div>
                <div><StatusBadge estado={q.estado} /></div>
                <div style={{ textAlign: 'right' as const, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#1D1D1F' }}>
                  {q.costo_total != null
                    ? `S/ ${q.costo_total.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`
                    : <span style={{ color: '#AEAEB2', fontWeight: 400 }}>—</span>}
                </div>
                <div className="w-24">
                  {q.quality_score != null
                    ? <QualityBar value={q.quality_score} />
                    : <span style={{ color: '#AEAEB2' }}>—</span>}
                </div>
                <div style={{ fontSize: 12, color: '#AEAEB2' }}>
                  {new Date(q.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div className="row-arrow" style={{ color: '#E8572A', opacity: 0, transition: 'opacity 180ms, transform 180ms', display: 'flex', justifyContent: 'flex-end' }}>
                  <ArrowUpRight size={15} />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13, color: '#6E6E73' }}>
            <div>Mostrando <strong style={{ color: '#1D1D1F' }}>{filtered.length}</strong> de <strong style={{ color: '#1D1D1F' }}>{quotations.length}</strong></div>
            {isStaff && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <Lock size={12} style={{ color: '#AEAEB2' }} />
                <span style={{ color: '#AEAEB2' }}>Identidad de proveedores protegida</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

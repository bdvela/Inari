import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  PlusCircle, AlertCircle, CheckCircle, Clock,
  BarChart2, Star, TrendingUp, Search, ArrowUpRight,
  Lock, RefreshCw, Calendar, ChevronRight, LayoutGrid, List,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { quotationsApi } from '../services/api'
import type { QuotationSummary } from '../types'
import QualityBar from '../components/shared/QualityBar'

// ── Sub-components ────────────────────────────────────────────

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

const EVENT_LABELS: Record<string, string> = {
  boda: 'Boda', corporativo: 'Corporativo', cumpleanos: 'Cumpleaños',
  quinceanos: 'Quinceañera', conferencia: 'Conferencia', otro: 'Otro',
}

function StatCard({
  label, value, suffix, icon: Icon, accent = false,
}: {
  label: string; value: string | number; suffix?: string
  icon: React.ElementType; accent?: boolean
}) {
  return (
    <div className="glass card-hover card-lift p-6 relative" style={{ minHeight: 128 }}>
      <div className={`absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center border ${
        accent
          ? 'bg-accent/10 text-accent border-accent/18'
          : 'bg-text-primary/5 text-text-secondary border-border'
      }`}>
        <Icon size={17} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-3">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-bold tracking-tight leading-none text-text-primary">
          {value}
        </span>
        {suffix && <span className="text-sm text-text-muted font-medium">{suffix}</span>}
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="glass p-6" style={{ minHeight: 128 }}>
      <div className="skeleton h-3 w-2/5 mb-4 rounded" />
      <div className="skeleton h-10 w-1/3 rounded" />
    </div>
  )
}

function QuotationCard({ q, isStaff, onClick }: { q: QuotationSummary; isStaff: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="glass card-hover p-4 rounded-xl cursor-pointer border border-transparent hover:border-accent/15 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-text-primary/6 flex items-center justify-center text-[11px] font-semibold text-text-primary flex-shrink-0">
            {q.evento_nombre.split(' ').map((s: string) => s[0]).slice(0,2).join('')}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-text-primary truncate">{q.evento_nombre}</p>
            {isStaff && q.cliente_nombre && (
              <p className="text-xs text-text-muted truncate">{q.cliente_nombre}</p>
            )}
          </div>
        </div>
        <ArrowUpRight size={14} className="text-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge estado={q.estado} />
        <LevelBadge nivel={q.nivel} />
        <span className="text-xs text-text-muted">{EVENT_LABELS[q.evento_tipo] ?? q.evento_tipo}</span>
      </div>
      {q.costo_total != null && (
        <p className="font-mono text-sm font-semibold text-text-primary mt-2">
          S/ {q.costo_total.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
        </p>
      )}
    </div>
  )
}

// ── Client event helpers ──────────────────────────────────────

const EVENT_ICONS: Record<string, string> = {
  boda: '💍', corporativo: '🏢', cumpleanos: '🎂',
  quinceanos: '👑', conferencia: '🎤', otro: '✨',
}

interface EventGroup {
  evento_id: number
  evento_tipo: string
  evento_fecha: string | null
  created_at: string
  basica: QuotationSummary | null
  premium: QuotationSummary | null
}

function groupByEvent(quotations: QuotationSummary[]): EventGroup[] {
  const map = new Map<number, EventGroup>()
  for (const q of quotations) {
    if (!map.has(q.evento_id)) {
      map.set(q.evento_id, {
        evento_id: q.evento_id,
        evento_tipo: q.evento_tipo,
        evento_fecha: q.evento_fecha ?? null,
        created_at: q.created_at,
        basica: null,
        premium: null,
      })
    }
    const g = map.get(q.evento_id)!
    if (q.nivel === 'premium') g.premium = q
    else g.basica = q
  }
  return Array.from(map.values())
}

function eventFecha(g: EventGroup) {
  const raw = g.evento_fecha ? g.evento_fecha + 'T12:00:00' : g.created_at
  return new Date(raw).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function costRange(g: EventGroup): string {
  const costs = [g.basica?.costo_total, g.premium?.costo_total].filter((c): c is number => c != null)
  if (!costs.length) return '—'
  if (costs.length === 1) return `S/ ${costs[0].toLocaleString('es-PE', { minimumFractionDigits: 0 })}`
  return `S/ ${Math.min(...costs).toLocaleString('es-PE', { minimumFractionDigits: 0 })} — S/ ${Math.max(...costs).toLocaleString('es-PE', { minimumFractionDigits: 0 })}`
}

function overallStatus(g: EventGroup): QuotationSummary['estado'] {
  if (g.premium?.estado === 'completado' || g.basica?.estado === 'completado') return 'completado'
  if (g.premium?.estado === 'procesando' || g.basica?.estado === 'procesando') return 'procesando'
  return 'error'
}

function navigateTarget(g: EventGroup): number {
  return (g.premium ?? g.basica)!.id
}

// Card view
function ClientEventCard({ group, onNavigate }: { group: EventGroup; onNavigate: (id: number) => void }) {
  const label  = EVENT_LABELS[group.evento_tipo] ?? group.evento_tipo
  const icon   = EVENT_ICONS[group.evento_tipo]  ?? '✨'
  const hasBoth = !!(group.basica && group.premium)

  return (
    <button
      onClick={() => onNavigate(navigateTarget(group))}
      className="glass text-left group border border-transparent hover:border-accent/25 transition-all w-full"
      style={{ borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* Accent top bar */}
      <div style={{ height: 3, flexShrink: 0, background: 'linear-gradient(90deg, #E8572A, #FF8C42)' }} />

      <div style={{ padding: '20px 22px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Row 1: big emoji */}
        <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 12 }}>{icon}</div>

        {/* Row 2: event label */}
        <p className="font-display font-bold text-text-primary" style={{ fontSize: 22, lineHeight: 1.1, marginBottom: 6 }}>
          {label}
        </p>

        {/* Row 3: date */}
        <div className="flex items-center gap-1.5" style={{ marginBottom: 16 }}>
          <Calendar size={11} className="text-text-muted flex-shrink-0" />
          <span className="text-xs text-text-muted" style={{ whiteSpace: 'nowrap' }}>{eventFecha(group)}</span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: 14 }} />

        {/* Row 4: cost label */}
        <p className="text-text-muted font-semibold uppercase" style={{ fontSize: 10, letterSpacing: '0.1em', marginBottom: 4 }}>
          {hasBoth ? 'Rango de inversión' : 'Inversión estimada'}
        </p>

        {/* Row 5: cost value */}
        <p className="font-mono font-bold text-text-primary" style={{ fontSize: 17, lineHeight: 1, marginBottom: 14, whiteSpace: 'nowrap' }}>
          {costRange(group)}
        </p>

        {/* Row 6: status + arrow */}
        <div className="flex items-center justify-between gap-2" style={{ marginTop: 'auto' }}>
          <StatusBadge estado={overallStatus(group)} />
          <ChevronRight size={14} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

      </div>
    </button>
  )
}

// Row view
function ClientEventRow({ group, onNavigate }: { group: EventGroup; onNavigate: (id: number) => void }) {
  const label = EVENT_LABELS[group.evento_tipo] ?? group.evento_tipo
  const icon  = EVENT_ICONS[group.evento_tipo]  ?? '✨'

  return (
    <button
      onClick={() => onNavigate(navigateTarget(group))}
      className="w-full text-left flex items-center gap-4 border-b border-border last:border-0 hover:bg-text-primary/3 transition-colors group"
      style={{ padding: '14px 20px' }}
    >
      {/* emoji */}
      <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, width: 32, textAlign: 'center' }}>{icon}</span>

      {/* name + date — always visible */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-semibold text-text-primary" style={{ fontSize: 14 }}>{label}</p>
        <p className="text-text-muted" style={{ fontSize: 12, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {eventFecha(group)}
        </p>
      </div>

      {/* nivel badges — hide on mobile */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        {group.basica  && <span className="badge badge-neutral" style={{ fontSize: 10 }}>Básica</span>}
        {group.premium && <span className="badge badge-accent"  style={{ fontSize: 10 }}>★ Premium</span>}
      </div>

      {/* cost — hide on small */}
      <p className="font-mono font-bold text-text-primary hidden md:block flex-shrink-0" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
        {costRange(group)}
      </p>

      {/* status */}
      <div className="flex-shrink-0 hidden sm:block">
        <StatusBadge estado={overallStatus(group)} />
      </div>

      <ChevronRight size={14} className="text-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────

const FILTERS = ['Todas', 'Boda', 'Corporativo', 'Quinceañera', 'Otros']
const GRID_STAFF = '1.6fr 1fr 0.9fr 0.9fr 0.9fr 1.1fr 140px 32px'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { role, nombre } = useAuth()
  const isStaff = role === 'ejecutivo' || role === 'admin'

  const [search, setSearch]             = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [viewMode, setViewMode]         = useState<'card' | 'row'>('card')

  const { data: quotations, isLoading, isError, refetch } = useQuery({
    queryKey: ['quotations'],
    queryFn:  quotationsApi.list,
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn:  quotationsApi.getStats,
    enabled:  isStaff,
  })

  const filtered = useMemo(() => {
    if (!quotations) return []
    return quotations.filter((q) => {
      const matchSearch = !search ||
        q.evento_nombre.toLowerCase().includes(search.toLowerCase()) ||
        (isStaff && q.cliente_nombre?.toLowerCase().includes(search.toLowerCase()))
      const matchEstado = !filterEstado || q.estado === filterEstado
      const matchFilter = activeFilter === 'Todas' ||
        (activeFilter === 'Boda' && q.evento_tipo === 'boda') ||
        (activeFilter === 'Corporativo' && q.evento_tipo === 'corporativo') ||
        (activeFilter === 'Quinceañera' && q.evento_tipo === 'quinceanos') ||
        (activeFilter === 'Otros' && !['boda','corporativo','quinceanos'].includes(q.evento_tipo))
      return matchSearch && matchEstado && matchFilter
    })
  }, [quotations, search, filterEstado, activeFilter, isStaff])

  const qualityPct = stats?.quality_score_promedio != null ? stats.quality_score_promedio * 100 : 0
  const firstName  = nombre ? nombre.split(' ')[0] : 'equipo'

  // ── CLIENT VIEW ──────────────────────────────────────────────
  const eventGroups = useMemo(() => groupByEvent(quotations ?? []), [quotations])

  if (!isStaff) {
    return (
      <div className="mesh" style={{ minHeight: '100vh', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 40px) 64px' }}>
        <div className="mesh-blob" />

        {/* Header */}
        <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
          <div>
            <p className="page-eyebrow">Mi panel</p>
            <h1 className="font-display text-5xl font-bold tracking-tight leading-none text-text-primary">
              Hola, {firstName}.
            </h1>
            <p className="mt-2.5 text-[15px] text-text-secondary">
              {eventGroups.length
                ? `${eventGroups.length} evento${eventGroups.length !== 1 ? 's' : ''} cotizado${eventGroups.length !== 1 ? 's' : ''}.`
                : 'Genera tu primera propuesta gratis.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* view toggle — only show when there's content */}
            {eventGroups.length > 0 && (
              <div className="flex items-center glass rounded-xl p-1 gap-0.5">
                <button
                  onClick={() => setViewMode('card')}
                  title="Vista tarjetas"
                  className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-accent/12 text-accent' : 'text-text-muted hover:text-text-primary'}`}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('row')}
                  title="Vista lista"
                  className={`p-2 rounded-lg transition-all ${viewMode === 'row' ? 'bg-accent/12 text-accent' : 'text-text-muted hover:text-text-primary'}`}
                >
                  <List size={15} />
                </button>
              </div>
            )}
            <button className="btn btn-primary" onClick={() => navigate('/quotations/new')}>
              <PlusCircle size={15} /> Nueva cotización
            </button>
          </div>
        </div>

        {/* Error */}
        {isError && (
          <div className="alert alert-danger mb-6">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span className="flex-1">No se pudieron cargar tus propuestas.</span>
            <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
              <RefreshCw size={13} /> Reintentar
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass" style={{ borderRadius: 18, overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 3 }} />
                <div style={{ padding: '20px 22px 18px' }}>
                  <div className="skeleton rounded" style={{ width: 36, height: 36, marginBottom: 12 }} />
                  <div className="skeleton rounded" style={{ width: '55%', height: 22, marginBottom: 8 }} />
                  <div className="skeleton rounded" style={{ width: '70%', height: 12, marginBottom: 18 }} />
                  <div className="skeleton" style={{ height: 1, marginBottom: 14 }} />
                  <div className="skeleton rounded" style={{ width: '40%', height: 10, marginBottom: 6 }} />
                  <div className="skeleton rounded" style={{ width: '75%', height: 20, marginBottom: 16 }} />
                  <div className="flex gap-2">
                    <div className="skeleton rounded-full" style={{ width: 52, height: 20 }} />
                    <div className="skeleton rounded-full" style={{ width: 68, height: 20 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && eventGroups.length === 0 && (
          <div className="glass p-16 text-center" style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>✨</div>
            <h3 className="font-display text-2xl font-bold tracking-tight mb-3">
              Tu primera propuesta en minutos
            </h3>
            <p className="text-sm text-text-secondary max-w-xs mx-auto mb-8 leading-relaxed">
              Cuéntanos sobre tu evento y recibirás una propuesta personalizada con proveedores reales y precios reales.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/quotations/new')}>
              <PlusCircle size={16} /> Crear cotización
            </button>
          </div>
        )}

        {/* Card view */}
        {!isLoading && eventGroups.length > 0 && viewMode === 'card' && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
            {eventGroups.map(group => (
              <ClientEventCard
                key={group.evento_id}
                group={group}
                onNavigate={(id) => navigate(`/quotations/${id}`)}
              />
            ))}
          </div>
        )}

        {/* Row view */}
        {!isLoading && eventGroups.length > 0 && viewMode === 'row' && (
          <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
            {eventGroups.map(group => (
              <ClientEventRow
                key={group.evento_id}
                group={group}
                onNavigate={(id) => navigate(`/quotations/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── STAFF VIEW ───────────────────────────────────────────────
  return (
    <div className="mesh" style={{ minHeight: '100vh', padding: '40px 48px 64px' }}>
      <div className="mesh-blob" />

      {/* Header */}
      <div className="flex items-end justify-between mb-9">
        <div>
          <p className="page-eyebrow">Panel {role}</p>
          <h1 className="font-display text-5xl font-bold tracking-tight leading-none text-text-primary">
            Hola, {firstName}.
          </h1>
          <p className="mt-2.5 text-[15px] text-text-secondary">
            Todas las cotizaciones del sistema
          </p>
        </div>
        {role !== 'admin' && (
          <button className="btn btn-primary" onClick={() => navigate('/quotations/new')}>
            <PlusCircle size={15} /> Nueva cotización
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats ? (
          <>
            <StatCard label="Total cotizaciones" value={stats.total} icon={BarChart2} />
            <StatCard label="Completadas" value={stats.completadas} suffix={`/ ${stats.total}`} icon={CheckCircle} />
            <StatCard
              label="Calidad promedio"
              value={stats.quality_score_promedio != null ? `${qualityPct.toFixed(0)}%` : '—'}
              icon={Star} accent
            />
            <StatCard
              label="Costo promedio"
              value={stats.costo_promedio != null ? `S/${(stats.costo_promedio / 1000).toFixed(1)}k` : '—'}
              icon={TrendingUp}
            />
          </>
        ) : (
          [1,2,3,4].map(i => <StatCardSkeleton key={i} />)
        )}
      </div>

      {/* Error */}
      {isError && (
        <div className="alert alert-danger mb-6">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1">No se pudieron cargar las cotizaciones.</span>
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="table-container">
          <div className="table-header" style={{ gridTemplateColumns: GRID_STAFF }}>
            {['Evento','Cliente','Tipo','Nivel','Estado','Costo','Calidad',''].map((h,i) =>
              <div key={i}>{h}</div>
            )}
          </div>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="table-row" style={{ gridTemplateColumns: GRID_STAFF }}>
              <div className="flex items-center gap-2.5">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="skeleton h-3.5 w-32 rounded" />
              </div>
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-3 w-24 rounded ml-auto" />
              <div className="skeleton h-2 w-full rounded-full" />
              <div />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && quotations?.length === 0 && (
        <div className="glass p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/8 flex items-center justify-center mx-auto mb-5">
            <BarChart2 size={28} className="text-accent" />
          </div>
          <h3 className="font-display text-2xl font-bold tracking-tight mb-2">No hay cotizaciones aún</h3>
          <p className="text-sm text-text-secondary max-w-xs mx-auto mb-7 leading-relaxed">
            Las cotizaciones generadas por clientes aparecerán aquí.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/quotations/new')}>
            <PlusCircle size={15} /> Crear cotización
          </button>
        </div>
      )}

      {/* Lista */}
      {quotations && quotations.length > 0 && (
        <>
          {/* Filter bar */}
          <div className="glass flex items-center gap-3 p-3.5 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                className="input w-full"
                style={{ paddingLeft: '2rem' }}
                placeholder="Buscar por cliente, evento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`btn btn-sm transition-all ${
                    activeFilter === f
                      ? 'bg-accent/10 text-accent border border-accent/20 font-semibold'
                      : 'bg-transparent text-text-secondary border border-transparent hover:text-text-primary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <select
              className="input"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              style={{ maxWidth: 164 }}
            >
              <option value="">Todos los estados</option>
              <option value="completado">Completado</option>
              <option value="procesando">Procesando</option>
              <option value="error">Error</option>
            </select>

            {filtered.length !== quotations.length && (
              <span className="text-xs text-text-muted ml-auto whitespace-nowrap">
                {filtered.length} de {quotations.length}
              </span>
            )}
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-text-secondary py-12">Sin resultados</p>
            ) : filtered.map(q => (
              <QuotationCard key={q.id} q={q} isStaff={true} onClick={() => navigate(`/quotations/${q.id}`)} />
            ))}
          </div>

          {/* Desktop table */}
          <div className="table-container hidden md:block">
            <div className="table-header" style={{ gridTemplateColumns: GRID_STAFF }}>
              <div>Evento</div>
              <div>Cliente</div>
              <div>Tipo</div>
              <div>Nivel</div>
              <div>Estado</div>
              <div className="text-right">Costo</div>
              <div>Calidad</div>
              <div>Fecha</div>
              <div />
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-secondary">
                Sin resultados para los filtros seleccionados
              </div>
            ) : filtered.map((q) => (
              <div
                key={q.id}
                className="table-row group"
                style={{ gridTemplateColumns: GRID_STAFF }}
                onClick={() => navigate(`/quotations/${q.id}`)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-text-primary/6 flex items-center justify-center text-[11px] font-semibold text-text-primary flex-shrink-0">
                    {q.evento_nombre.split(' ').map((s: string) => s[0]).slice(0,2).join('')}
                  </div>
                  <span className="font-medium text-sm text-text-primary truncate">{q.evento_nombre}</span>
                </div>
                <span className="text-[13px] text-text-secondary truncate">{q.cliente_nombre ?? '—'}</span>
                <span className="text-[13px] text-text-secondary">{EVENT_LABELS[q.evento_tipo] ?? q.evento_tipo}</span>
                <div><LevelBadge nivel={q.nivel} /></div>
                <div><StatusBadge estado={q.estado} /></div>
                <div className="text-right font-mono text-sm font-semibold text-text-primary">
                  {q.costo_total != null
                    ? `S/ ${q.costo_total.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`
                    : <span className="text-text-muted font-normal">—</span>}
                </div>
                <div className="w-24">
                  {q.quality_score != null
                    ? <QualityBar value={q.quality_score} />
                    : <span className="text-text-muted">—</span>}
                </div>
                <div className="text-xs text-text-muted">
                  {new Date(q.created_at).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })}
                </div>
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={14} className="text-accent" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 text-[13px] text-text-secondary">
            <span>
              Mostrando <strong className="text-text-primary">{filtered.length}</strong> de{' '}
              <strong className="text-text-primary">{quotations.length}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-text-muted text-xs">
              <Lock size={11} /> Identidad de proveedores protegida para clientes
            </span>
          </div>
        </>
      )}
    </div>
  )
}

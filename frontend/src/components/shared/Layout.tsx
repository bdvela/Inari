import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LogOut, LayoutDashboard, PlusCircle, ShieldCheck,
  Settings, Users, Package,
} from 'lucide-react'

function getInitials(nombre: string | null): string {
  if (!nombre) return '?'
  return nombre.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function Layout() {
  const { logout, role, nombre } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  const roleLabel: Record<string, string> = {
    cliente: 'Cliente', ejecutivo: 'Ejecutivo', admin: 'Admin',
  }

  const navItemStyle = (isActive: boolean) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 12,
    padding: '10px 14px',
    borderRadius: 10,
    color: isActive ? '#1D1D1F' : '#6E6E73',
    fontSize: 14,
    fontWeight: isActive ? 600 : 500,
    textDecoration: 'none' as const,
    background: isActive ? 'rgba(232,87,42,0.08)' : 'transparent',
    borderLeft: isActive ? '2px solid #E8572A' : '2px solid transparent',
    transition: 'background 180ms, color 180ms',
    cursor: 'pointer' as const,
  })

  const iconStyle = (isActive: boolean) => ({
    color: isActive ? '#E8572A' : '#AEAEB2',
    flexShrink: 0 as const,
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ── */}
      <aside
        className="glass-frost"
        style={{
          width: 240,
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          borderRight: '1px solid rgba(26,23,20,0.08)',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="logo-mark">I</span>
          <span style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 800,
            fontSize: 13, letterSpacing: '0.18em', lineHeight: 1.1, color: '#1D1D1F',
          }}>
            INARI<br/>
            <span style={{ color: '#6E6E73', fontWeight: 600 }}>GROUP</span>
          </span>
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>

          {/* ── Cliente / Ejecutivo ── */}
          {role !== 'admin' && (
            <>
              <div style={{
                fontSize: 11, color: '#AEAEB2',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.10em',
                padding: '8px 12px 4px',
              }}>
                General
              </div>

              <NavLink to="/dashboard" end style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (
                  <>
                    <LayoutDashboard size={17} style={iconStyle(isActive)} />
                    Dashboard
                  </>
                )}
              </NavLink>

              <NavLink to="/quotations/new" style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (
                  <>
                    <PlusCircle size={17} style={iconStyle(isActive)} />
                    Nueva cotización
                  </>
                )}
              </NavLink>

              <div style={{
                fontSize: 11, color: '#AEAEB2',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.10em',
                padding: '16px 12px 4px',
              }}>
                Cuenta
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                style={{ ...navItemStyle(false), border: 'none', background: 'transparent', width: '100%', textAlign: 'left' as const }}
              >
                <Settings size={17} style={iconStyle(false)} />
                Ajustes
              </button>
            </>
          )}

          {/* ── Admin ── */}
          {role === 'admin' && (
            <>
              <div style={{
                fontSize: 11, color: '#AEAEB2',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.10em',
                padding: '8px 12px 4px',
              }}>
                Administración
              </div>

              <NavLink to="/admin/providers" style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (
                  <>
                    <Users size={17} style={iconStyle(isActive)} />
                    Proveedores
                  </>
                )}
              </NavLink>

              <NavLink to="/admin/rules" style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (
                  <>
                    <ShieldCheck size={17} style={iconStyle(isActive)} />
                    Reglas de negocio
                  </>
                )}
              </NavLink>

              <NavLink to="/admin/packages" style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (
                  <>
                    <Package size={17} style={iconStyle(isActive)} />
                    Paquetes
                  </>
                )}
              </NavLink>
            </>
          )}

        </div>

        {/* User card */}
        <div className="glass" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(145deg, #1A1714, #3a3530)',
            color: '#F2EFE9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600,
          }}>
            {getInitials(nombre)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#1D1D1F',
              whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const,
            }}>
              {nombre ?? 'Usuario'}
            </div>
            <div style={{ fontSize: 11, color: '#AEAEB2' }}>
              {roleLabel[role ?? ''] ?? role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#AEAEB2', padding: 6, borderRadius: 6,
              display: 'flex', alignItems: 'center',
              transition: 'color 180ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3B30')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#AEAEB2')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, marginLeft: 240, minHeight: '100vh', background: '#F2EFE9' }}>
        <Outlet />
      </main>
    </div>
  )
}

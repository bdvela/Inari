import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LogOut, LayoutDashboard, PlusCircle, ShieldCheck,
  Users, Package, Menu, X, Sliders, FileJson,
} from 'lucide-react'

function getInitials(nombre: string | null): string {
  if (!nombre) return '?'
  return nombre.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function Layout() {
  const { logout, role, nombre } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = () => { logout(); navigate('/') }

  const roleLabel: Record<string, string> = {
    cliente: 'Cliente', ejecutivo: 'Ejecutivo', admin: 'Admin',
  }

  const navItemStyle = (isActive: boolean) => ({
    display: 'flex' as const, alignItems: 'center' as const, gap: 12,
    padding: '10px 14px', borderRadius: 10,
    color: isActive ? '#1D1D1F' : '#6E6E73',
    fontSize: 14, fontWeight: isActive ? 600 : 500,
    textDecoration: 'none' as const,
    background: isActive ? 'rgba(232,87,42,0.08)' : 'transparent',
    borderLeft: isActive ? '2px solid #E8572A' : '2px solid transparent',
    transition: 'background 180ms, color 180ms',
    cursor: 'pointer' as const,
  })

  const iconStyle = (isActive: boolean) => ({
    color: isActive ? '#E8572A' : '#AEAEB2', flexShrink: 0 as const,
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`glass-frost fixed top-0 left-0 bottom-0 z-40 overflow-y-auto transition-transform duration-250 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{
          width: 240, padding: '24px 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
          borderRight: '1px solid rgba(26,23,20,0.08)',
        }}
      >
        {/* Logo + close */}
        <div style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/logo.png" alt="INARI GROUP SAC" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          <button
            className="md:hidden"
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#6E6E73', borderRadius: 8 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>

          {role !== 'admin' && (
            <>
              <div style={{ fontSize: 11, color: '#AEAEB2', textTransform: 'uppercase' as const, letterSpacing: '0.10em', padding: '8px 12px 4px' }}>
                General
              </div>
              <NavLink to="/dashboard" end style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (<><LayoutDashboard size={17} style={iconStyle(isActive)} /> Dashboard</>)}
              </NavLink>
              <NavLink to="/quotations/new" style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (<><PlusCircle size={17} style={iconStyle(isActive)} /> Nueva cotización</>)}
              </NavLink>
            </>
          )}

          {role === 'admin' && (
            <>
              <div style={{ fontSize: 11, color: '#AEAEB2', textTransform: 'uppercase' as const, letterSpacing: '0.10em', padding: '8px 12px 4px' }}>
                Administración
              </div>
              <NavLink to="/admin/providers" style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (<><Users size={17} style={iconStyle(isActive)} /> Proveedores</>)}
              </NavLink>
              <NavLink to="/admin/rules" style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (<><ShieldCheck size={17} style={iconStyle(isActive)} /> Reglas de negocio</>)}
              </NavLink>
              <NavLink to="/admin/packages" style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (<><Package size={17} style={iconStyle(isActive)} /> Paquetes</>)}
              </NavLink>
              <NavLink to="/admin/system-config" style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (<><Sliders size={17} style={iconStyle(isActive)} /> Sistema</>)}
              </NavLink>
              <NavLink to="/admin/optimization-logs" style={({ isActive }) => navItemStyle(isActive)}>
                {({ isActive }) => (<><FileJson size={17} style={iconStyle(isActive)} /> Logs optimizer</>)}
              </NavLink>
            </>
          )}

        </div>

        {/* User card */}
        <div className="glass" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(145deg, #1A1714, #3a3530)',
            color: '#F2EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600,
          }}>
            {getInitials(nombre)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {nombre ?? 'Usuario'}
            </div>
            <div style={{ fontSize: 11, color: '#AEAEB2' }}>{roleLabel[role ?? ''] ?? role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AEAEB2', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 180ms' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FF3B30')}
            onMouseLeave={e => (e.currentTarget.style.color = '#AEAEB2')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="md:ml-60 flex-1 min-h-screen" style={{ background: '#F2EFE9' }}>

        {/* Mobile top bar */}
        <div
          className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: 'rgba(242,239,233,0.92)', backdropFilter: 'blur(12px)', borderColor: 'rgba(26,23,20,0.08)' }}
        >
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg text-text-primary"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
          >
            <Menu size={20} />
          </button>
          <img src="/logo.png" alt="INARI GROUP SAC" style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
        </div>

        <Outlet />
      </main>
    </div>
  )
}

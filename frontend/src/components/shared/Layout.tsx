import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut, LayoutDashboard, PlusCircle, Settings, User, ChevronRight } from 'lucide-react'

export default function Layout() {
  const { logout, role, nombre } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white/15 text-white shadow-sm shadow-white/5'
        : 'text-white/60 hover:bg-white/8 hover:text-white/90'
    }`

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Sidebar */}
      <aside className="w-[260px] bg-gradient-to-b from-primary-500 via-primary-600 to-primary-700 text-white flex flex-col fixed inset-y-0 left-0 z-40">
        {/* Brand */}
        <div className="px-6 py-7">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-sm">I</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">Inari Group</h1>
              <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase mt-0.5">Gestión de Eventos</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-4 mb-3">
            Menu
          </p>

          <NavLink to="/dashboard" end className={navClass}>
            <LayoutDashboard size={18} strokeWidth={1.8} />
            <span className="flex-1">Dashboard</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>

          <NavLink to="/quotations/new" className={navClass}>
            <PlusCircle size={18} strokeWidth={1.8} />
            <span className="flex-1">Nueva Cotización</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>

          {role === 'admin' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-4">
                  Admin
                </p>
              </div>
              <NavLink to="/admin/providers" className={navClass}>
                <Settings size={18} strokeWidth={1.8} />
                <span className="flex-1">Proveedores</span>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
              </NavLink>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 mx-3 mb-4 rounded-2xl bg-white/5 border border-white/8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <User size={16} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">{nombre ?? 'Usuario'}</p>
              <p className="text-white/40 text-xs capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/8"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[260px] overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

/**
 * Auth context global — estado de usuario compartido en toda la app.
 * El hook useAuth() anterior rompía al navegar porque cada componente
 * creaba su propio useState desde localStorage.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { authApi } from '../services/api'
import type { AuthToken, UserRole } from '../types'

interface AuthState {
  isAuthenticated: boolean
  userId: number | null
  role: UserRole | null
  nombre: string | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  loginWithToken: (data: AuthToken) => void
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  nombre: string
  email: string
  password: string
  telefono?: string
}

function readStorage(): AuthState {
  const token = localStorage.getItem('access_token')
  const role = localStorage.getItem('user_role') as UserRole | null
  const userId = localStorage.getItem('user_id')
  const nombre = localStorage.getItem('user_nombre')
  return {
    isAuthenticated: !!token,
    userId: userId ? parseInt(userId) : null,
    role,
    nombre,
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readStorage)

  const persistToken = (data: AuthToken & { nombre?: string }) => {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user_role', data.role)
    localStorage.setItem('user_id', String(data.user_id))
    if (data.nombre) localStorage.setItem('user_nombre', data.nombre)
    setState({
      isAuthenticated: true,
      userId: data.user_id,
      role: data.role,
      nombre: data.nombre ?? null,
    })
  }

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    persistToken(data)
  }, [])

  const loginWithToken = useCallback((data: AuthToken) => {
    persistToken(data)
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const result = await authApi.register(data)
    persistToken({ ...result, nombre: data.nombre })
  }, [])

  const logout = useCallback(() => {
    localStorage.clear()
    setState({ isAuthenticated: false, userId: null, role: null, nombre: null })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithToken, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

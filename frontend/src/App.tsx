import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import NewQuotationPage from './pages/NewQuotationPage'
import ChatQuotationPage from './pages/ChatQuotationPage'
import QuotationResultPage from './pages/QuotationResultPage'
import AdminProvidersPage from './pages/AdminProvidersPage'
import AdminRulesPage from './pages/AdminRulesPage'
import AdminPackagesPage from './pages/AdminPackagesPage'
import AdminSystemConfigPage from './pages/AdminSystemConfigPage'
import AdminOptimizationLogsPage from './pages/AdminOptimizationLogsPage'
import PublicQuotationPage from './pages/PublicQuotationPage'
import Layout from './components/shared/Layout'

function ProtectedRoute({ children, requiredRole }: {
  children: React.ReactNode
  requiredRole?: 'ejecutivo' | 'admin'
}) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requiredRole && role !== requiredRole && role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />
        {/* Legacy guest routes — redirected to landing */}
        <Route path="/cotizar" element={<Navigate to="/" replace />} />
        <Route path="/propuesta" element={<Navigate to="/" replace />} />
        {/* Client proposal link — public, no auth guard */}
        <Route path="/p/:token" element={<PublicQuotationPage />} />

        {/* Protected — inside Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/quotations/new" element={<ChatQuotationPage />} />
          <Route path="/quotations/new/classic" element={<NewQuotationPage />} />
          <Route path="/quotations/:id" element={<QuotationResultPage />} />
          <Route
            path="/admin/providers"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProvidersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rules"
            element={
              <ProtectedRoute requiredRole="ejecutivo">
                <AdminRulesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/packages"
            element={
              <ProtectedRoute requiredRole="ejecutivo">
                <AdminPackagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system-config"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSystemConfigPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/optimization-logs"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminOptimizationLogsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

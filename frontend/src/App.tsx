import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import NewQuotationPage from './pages/NewQuotationPage'
import QuotationResultPage from './pages/QuotationResultPage'
import AdminProvidersPage from './pages/AdminProvidersPage'
import AdminRulesPage from './pages/AdminRulesPage'
import AdminPackagesPage from './pages/AdminPackagesPage'
import GuestWizardPage from './pages/GuestWizardPage'
import GuestResultPage from './pages/GuestResultPage'
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
        {/* Guest quotation flow — public, no sidebar */}
        <Route
          path="/cotizar"
          element={isAuthenticated ? <Navigate to="/quotations/new" replace /> : <GuestWizardPage />}
        />
        <Route path="/propuesta" element={<GuestResultPage />} />

        {/* Protected — inside Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
<Route path="/quotations/new" element={<NewQuotationPage />} />
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

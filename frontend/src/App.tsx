import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getRoleHomePath } from './utils/roleRoutes'
import ProtectedRoute from './components/ProtectedRoute'
import { LoadingScreen } from './components/ui'

// Auth pages
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Role dashboards
import PatientDashboard   from './pages/patient/PatientDashboard'
import DoctorDashboard    from './pages/doctor/DoctorDashboard'
import AssistantDashboard from './pages/assistant/AssistantDashboard'
import AdminDashboard     from './pages/admin/AdminDashboard'

// ── Smart home redirect ───────────────────────────────────────────────────────
const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={getRoleHomePath(user.role)} replace />
}

// ── Unauthorized page ─────────────────────────────────────────────────────────
const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <p className="text-6xl mb-4">🚫</p>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
      <p className="text-slate-500 mb-6">You don't have permission to view this page.</p>
      <a href="/" className="btn-primary inline-flex">Go to dashboard</a>
    </div>
  </div>
)

const App: React.FC = () => (
  <Routes>
    {/* Public */}
    <Route path="/login"    element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />

    {/* Root → smart redirect */}
    <Route path="/" element={<HomeRedirect />} />

    {/* Patient */}
    <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
      <Route path="/patient/*" element={<PatientDashboard />} />
    </Route>

    {/* Doctor */}
    <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
      <Route path="/doctor/*" element={<DoctorDashboard />} />
    </Route>

    {/* Assistant */}
    <Route element={<ProtectedRoute allowedRoles={['assistant']} />}>
      <Route path="/assistant/*" element={<AssistantDashboard />} />
    </Route>

    {/* Admin & Super Admin */}
    <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
      <Route path="/admin/*" element={<AdminDashboard />} />
    </Route>

    {/* 404 */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

export default App

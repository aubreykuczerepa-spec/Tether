import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Landing    from './pages/Landing'
import Signup     from './pages/Signup'
import Login      from './pages/Login'
import Connect    from './pages/Connect'
import Onboarding from './pages/Onboarding'
import Timeline   from './pages/Timeline'
import NewEntry   from './pages/NewEntry'
import Lockbox    from './pages/Lockbox'
import LittleThings from './pages/LittleThings'

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }} />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RequireCouple({ children }) {
  const { hasCouple, loading } = useAuth()
  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }} />
  if (!hasCouple) return <Navigate to="/connect" replace />
  return children
}

function RequireOnboarding({ children }) {
  const { onboardingComplete, hasCouple, loading } = useAuth()
  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }} />
  if (!hasCouple) return <Navigate to="/connect" replace />
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />
  return children
}

function AppRoutes() {
  const { isAuthenticated, hasCouple, onboardingComplete, loading } = useAuth()

  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }} />

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={
        isAuthenticated
          ? (hasCouple
              ? (onboardingComplete ? <Navigate to="/timeline" replace /> : <Navigate to="/onboarding" replace />)
              : <Navigate to="/connect" replace />)
          : <Landing />
      } />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/login"  element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      {/* Needs auth */}
      <Route path="/connect" element={
        <RequireAuth>
          {hasCouple ? <Navigate to="/" replace /> : <Connect />}
        </RequireAuth>
      } />

      <Route path="/onboarding" element={
        <RequireAuth>
          <RequireCouple>
            {onboardingComplete ? <Navigate to="/timeline" replace /> : <Onboarding />}
          </RequireCouple>
        </RequireAuth>
      } />

      {/* Needs auth + couple + onboarding */}
      <Route path="/timeline" element={
        <RequireAuth><RequireOnboarding><Timeline /></RequireOnboarding></RequireAuth>
      } />
      <Route path="/new-entry" element={
        <RequireAuth><RequireOnboarding><NewEntry /></RequireOnboarding></RequireAuth>
      } />
      <Route path="/lockbox" element={
        <RequireAuth><Lockbox /></RequireAuth>
      } />
      <Route path="/little-things" element={
        <RequireAuth><RequireOnboarding><LittleThings /></RequireOnboarding></RequireAuth>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

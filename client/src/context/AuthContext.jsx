import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

function saveSession(session, user) {
  localStorage.setItem('tether_token', session.access_token)
  localStorage.setItem('tether_refresh', session.refresh_token)
  localStorage.setItem('tether_user', JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem('tether_token')
  localStorage.removeItem('tether_refresh')
  localStorage.removeItem('tether_user')
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // users row
  const [couple, setCouple]   = useState(null)   // couples row
  const [partner, setPartner] = useState(null)   // partner users row
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    try {
      const data = await api.me()
      setUser(data.user)
      setCouple(data.couple)
      setPartner(data.partner)
    } catch (err) {
      // Token likely expired — try refresh
      const refresh = localStorage.getItem('tether_refresh')
      if (refresh) {
        try {
          const refreshed = await api.refresh(refresh)
          localStorage.setItem('tether_token', refreshed.session.access_token)
          localStorage.setItem('tether_refresh', refreshed.session.refresh_token)
          const data = await api.me()
          setUser(data.user)
          setCouple(data.couple)
          setPartner(data.partner)
        } catch {
          clearSession()
        }
      } else {
        clearSession()
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('tether_token')
    if (token) {
      loadMe()
    } else {
      setLoading(false)
    }
  }, [loadMe])

  async function login(email, password) {
    const data = await api.login({ email, password })
    saveSession(data.session, data.user)
    setUser(data.user)
    await loadMe()
    return data
  }

  async function signup(name, email, password) {
    const data = await api.signup({ name, email, password })
    saveSession(data.session, data.user)
    setUser(data.user)
    await loadMe()
    return data
  }

  async function logout() {
    try { await api.logout() } catch (_) {}
    clearSession()
    setUser(null)
    setCouple(null)
    setPartner(null)
  }

  async function refreshCouple() {
    await loadMe()
  }

  return (
    <AuthContext.Provider value={{
      user, couple, partner, loading,
      login, signup, logout, refreshCouple,
      isAuthenticated: !!user,
      hasCouple: !!couple,
      onboardingComplete: couple?.onboarding_complete ?? false
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

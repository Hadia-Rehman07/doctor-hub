import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, AuthState } from '../types'
import { authApi } from '../api'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('dh_token'),
    loading: true,
  })

  const logout = useCallback(() => {
    localStorage.removeItem('dh_token')
    localStorage.removeItem('dh_user')
    setState({ user: null, token: null, loading: false })
  }, [])

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.profile()
      const user: User = res.data.user
      localStorage.setItem('dh_user', JSON.stringify(user))
      setState((s) => ({ ...s, user, loading: false }))
    } catch {
      logout()
    }
  }, [logout])

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('dh_token')
    if (!token) { setState((s) => ({ ...s, loading: false })); return }
    const cached = localStorage.getItem('dh_user')
    if (cached) {
      setState({ user: JSON.parse(cached), token, loading: false })
    } else {
      refreshProfile()
    }
  }, [refreshProfile])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    const { token, user } = res.data
    localStorage.setItem('dh_token', token)
    localStorage.setItem('dh_user', JSON.stringify(user))
    setState({ user, token, loading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

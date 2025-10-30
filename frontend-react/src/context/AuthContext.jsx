import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.getCurrentUser().then(setUser).catch(() => {
      api.logout()
    }).finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    await api.login(username, password)
    const me = await api.getCurrentUser()
    setUser(me)
    navigate('/')
  }

  const logout = () => {
    api.logout()
    setUser(null)
    navigate('/login')
  }

  const value = useMemo(() => ({ user, isAuthenticated: !!user, login, logout, loading }), [user, loading])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)


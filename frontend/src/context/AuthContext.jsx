import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, unwrap } from '../lib/api'
import { clearSession, getStoredSession, persistSession } from '../lib/storage'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const bootstrap = useCallback(async () => {
    const session = getStoredSession()
    if (!session) {
      setLoading(false)
      return
    }

    setToken(session.token)
    try {
      const response = await api.get('/auth/me')
      const me = unwrap(response)
      setUser(me)
    } catch (error) {
      clearSession()
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    const handler = () => logout(true)
    window.addEventListener('mts:unauthorized', handler)
    return () => window.removeEventListener('mts:unauthorized', handler)
  })

  const login = useCallback(async (payload) => {
    const response = await api.post('/auth/login', payload)
    const data = unwrap(response)
    setUser(data.user)
    setToken(data.token)
    persistSession({ token: data.token, user: data.user, expiresAt: data.expiresIn ? Date.now() + data.expiresIn * 1000 : undefined })
  }, [])

  const registerTenant = useCallback(async (payload) => {
    await api.post('/auth/register-tenant', payload)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!token) return
    const response = await api.get('/auth/me')
    const data = unwrap(response)
    setUser(data)
    const session = getStoredSession()
    if (session) persistSession({ token: session.token, user: data, expiresAt: session.expiresAt })
  }, [token])

  const logout = useCallback(
    (redirect = false) => {
      clearSession()
      setUser(null)
      setToken(null)
      if (redirect) navigate('/login', { replace: true })
    },
    [navigate],
  )

  const value = useMemo(
    () => ({ user, token, loading, login, registerTenant, logout, refreshUser }),
    [user, token, loading, login, registerTenant, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext

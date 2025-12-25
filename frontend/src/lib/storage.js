const TOKEN_KEY = 'mts_token'
const USER_KEY = 'mts_user'

export const persistSession = ({ token, user, expiresAt }) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify({ ...user, cachedAt: Date.now() }))
  if (expiresAt) {
    localStorage.setItem(`${TOKEN_KEY}_exp`, String(expiresAt))
  }
}

export const getStoredSession = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  const rawUser = localStorage.getItem(USER_KEY)
  if (!token || !rawUser) return null

  try {
    const user = JSON.parse(rawUser)
    const expiresRaw = localStorage.getItem(`${TOKEN_KEY}_exp`)
    return {
      token,
      user,
      expiresAt: expiresRaw ? Number(expiresRaw) : undefined,
    }
  } catch (error) {
    clearSession()
    return null
  }
}

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(`${TOKEN_KEY}_exp`)
}

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY)

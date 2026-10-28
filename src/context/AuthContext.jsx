import { useEffect, useState } from 'react'
import { apiRequest } from '../utils/api.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/auth/me')
      .then(({ user }) => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function register(userDetails) {
    const { user } = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userDetails),
    })
    setCurrentUser(user)
    return user
  }

  async function login(email, password, role = 'patient') {
    const endpoint = role === 'doctor' ? '/auth/doctor-login' : '/auth/login'
    const { user } = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setCurrentUser(user)
    return user
  }

  async function logout() {
    await apiRequest('/auth/logout', { method: 'POST' })
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

import { createContext, useContext, useState, useEffect } from 'react'

const SESSION_KEY = 'smartcare_current_user'
const AuthContext = createContext(null)

// Wraps the whole app (see App.jsx) so ANY component — Navbar, Register,
// future pages — can read "who is logged in" via useAuth(), instead of
// each page keeping its own separate copy of that state.
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)

  // Restore session on first load
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY)
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved))
      } catch {
        setCurrentUser(null)
      }
    }
  }, [])

  function login(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    setCurrentUser(user)
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Convenience hook: const { currentUser, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
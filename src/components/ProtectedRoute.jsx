import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export default function ProtectedRoute({ children, role }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <p className="container py-5 text-secondary">Checking your session...</p>
  }

  if (!currentUser) {
    return <Navigate to={role === 'doctor' ? '/doctor/login' : '/register'} replace />
  }

  if (role && currentUser.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}

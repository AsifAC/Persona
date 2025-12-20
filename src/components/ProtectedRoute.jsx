// Protected Route Component - Redirects to login if not authenticated
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}


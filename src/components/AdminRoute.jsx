// Admin Route Component - Only allows admin users
import { Navigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from '../contexts/useAuth'
import { isAdmin } from '../utils/admin'
import LoadingScreen from './LoadingScreen'

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin(user)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <button onClick={() => globalThis.history.back()}>Go Back</button>
      </div>
    )
  }

  return children
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
}


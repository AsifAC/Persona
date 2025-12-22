// Main App Component with Routing
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './pages/Dashboard'
import SearchResults from './pages/SearchResults'
import SearchHistory from './pages/SearchHistory'
import Favorites from './pages/Favorites'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import AdminRoute from './components/AdminRoute'
import AddPersonInfo from './pages/AddPersonInfo'
import LandingPage from './pages/LandingPage'
import Support from './pages/Support'
import BackgroundScene from './components/BackgroundScene'
import './App.css'

function TitleManager() {
  const location = useLocation()

  useEffect(() => {
    const titles = {
      '/': 'Persona',
      '/login': 'Login - Persona',
      '/register': 'Register - Persona',
      '/dashboard': 'Dashboard - Persona',
      '/results': 'Search Results - Persona',
      '/history': 'Search History - Persona',
      '/favorites': 'Favorites - Persona',
      '/profile': 'Profile - Persona',
      '/add-info': 'Add Info - Persona',
      '/support': 'Support - Persona',
      '/admin': 'Admin - Persona',
    }

    document.title = titles[location.pathname] || 'Persona'
  }, [location.pathname])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <TitleManager />
          <BackgroundScene />
          <div className="app-shell">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results"
                element={
                  <ProtectedRoute>
                    <SearchResults />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <SearchHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-info"
                element={
                  <ProtectedRoute>
                    <AddPersonInfo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute>
                    <Support />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route path="/" element={<LandingPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

// Dashboard Page
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SearchForm from '../components/SearchForm'
import { searchService } from '../services/searchService'
import { useState } from 'react'
import './Dashboard.css'

export default function Dashboard() {
  const { user, signOut, isGuest } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (query) => {
    setLoading(true)
    setError('')

    try {
      const result = await searchService.searchPerson(query)
      // Navigate to results page with the search result
      navigate('/results', { state: { result } })
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h1>Persona</h1>
        </div>
        <div className="nav-links">
          <button onClick={() => navigate('/history')} className="nav-button">
            Search History
          </button>
          <button onClick={() => navigate('/favorites')} className="nav-button">
            Favorites
          </button>
          <button onClick={() => navigate('/profile')} className="nav-button">
            Profile
          </button>
          <button onClick={handleSignOut} className="nav-button sign-out">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!</h2>
          <p>Search for public information about any person</p>
          {isGuest && (
            <div className="guest-banner">
              <span>👤 Guest Mode</span> - Your data is saved locally on this device
            </div>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <SearchForm onSearch={handleSearch} loading={loading} />
      </div>
    </div>
  )
}


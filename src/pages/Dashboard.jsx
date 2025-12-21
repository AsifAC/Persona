// Dashboard Page
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import SearchForm from '../components/SearchForm'
import { searchService } from '../services/searchService'
import { userService } from '../services/userService'
import { isAdmin } from '../utils/admin'
import { useState, useEffect, useRef } from 'react'
import './Dashboard.css'

export default function Dashboard() {
  const { user, signOut, isGuest } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Load user profile to get full name
  useEffect(() => {
    const loadProfile = async () => {
      if (!isGuest && user) {
        try {
          const profile = await userService.getProfile()
          setUserProfile(profile)
        } catch (error) {
          console.error('Error loading user profile:', error)
          // If profile fetch fails, we'll use user_metadata as fallback
        }
      }
    }
    loadProfile()
  }, [user, isGuest])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

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
        <div className="nav-menu" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="menu-button"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            Menu
          </button>
          {menuOpen && (
            <div className="menu-dropdown" role="menu">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/history')
                }}
                className="menu-item"
                role="menuitem"
              >
                Search History
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/favorites')
                }}
                className="menu-item"
                role="menuitem"
              >
                Favorites
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/add-info')
                }}
                className="menu-item"
                role="menuitem"
              >
                Add Person Info
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/support')
                }}
                className="menu-item"
                role="menuitem"
              >
                Support
              </button>
              {isAdmin(user) && (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/admin')
                  }}
                  className="menu-item admin-link"
                  role="menuitem"
                >
                  Admin
                </button>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false)
                  handleSignOut()
                }}
                className="menu-item sign-out"
                role="menuitem"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>
            {(() => {
              // Priority: profile data > user_metadata > email username
              const firstName = userProfile?.first_name || user?.user_metadata?.first_name
              const lastName = userProfile?.last_name || user?.user_metadata?.last_name
              
              if (firstName && lastName) {
                return `Welcome back, ${firstName} ${lastName}!`
              } else if (firstName) {
                return `Welcome back, ${firstName}!`
              } else if (user?.email) {
                return `Welcome back, ${user.email.split('@')[0]}!`
              } else {
                return 'Welcome back!'
              }
            })()}
          </h2>
          <p>Search for public information about any person</p>
          {isGuest && (
            <div className="guest-banner">
              <span>👤 Guest Mode</span> - Your data is saved locally on this device
            </div>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <SearchForm onSearch={handleSearch} loading={loading} />
        <div className="api-warning">
          EnformionGO keys are not configured in Supabase, so real-time search data is unavailable.
        </div>
      </div>
    </div>
  )
}


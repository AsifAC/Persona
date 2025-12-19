// Search Results Page
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PersonCard from '../components/PersonCard'
import DataSection from '../components/DataSection'
import { userService } from '../services/userService'
import './SearchResults.css'

export default function SearchResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const [result, setResult] = useState(location.state?.result || null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!result) {
      navigate('/dashboard')
      return
    }

    // Check if search is favorited
    const checkFavorite = async () => {
      try {
        const searchQueryId = result.searchQuery?.id || result.searchQueryId
        if (searchQueryId) {
          const favorited = await userService.isFavorited(searchQueryId)
          setIsFavorited(favorited)
        }
      } catch (error) {
        console.error('Error checking favorite status:', error)
      }
    }

    checkFavorite()
  }, [result, navigate])

  const handleToggleFavorite = async () => {
    if (!result) return

    setLoading(true)
    try {
      if (isFavorited) {
        // Remove from favorites - we'd need the favorite ID for this
        // For now, just show a message
        alert('To remove from favorites, go to the Favorites page')
      } else {
        const searchQueryId = result.searchQuery?.id || result.searchQueryId
        if (searchQueryId) {
          await userService.addToFavorites(searchQueryId)
          setIsFavorited(true)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Failed to update favorite status')
    } finally {
      setLoading(false)
    }
  }

  if (!result) {
    return (
      <div className="results-container">
        <div className="no-results">
          <p>No results found. Please try another search.</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  const personProfile = result.personProfile || result.person_profile
  const confidenceScore = result.confidenceScore || result.confidence_score || result.searchResult?.confidence_score

  return (
    <div className="results-container">
      <div className="results-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
        <button
          onClick={handleToggleFavorite}
          disabled={loading}
          className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
        >
          {isFavorited ? '★ Favorited' : '☆ Add to Favorites'}
        </button>
      </div>

      <PersonCard person={personProfile} confidenceScore={confidenceScore} />

      <DataSection
        title="Addresses"
        data={result.addresses || []}
        emptyMessage="No address information available"
      />

      <DataSection
        title="Phone Numbers"
        data={result.phoneNumbers || []}
        emptyMessage="No phone number information available"
      />

      <DataSection
        title="Social Media Profiles"
        data={result.socialMedia || []}
        emptyMessage="No social media profiles found"
      />

      <DataSection
        title="Criminal Records"
        data={result.criminalRecords || []}
        emptyMessage="No criminal records found"
      />

      <DataSection
        title="Known Relatives"
        data={result.relatives || []}
        emptyMessage="No relative information available"
      />
    </div>
  )
}


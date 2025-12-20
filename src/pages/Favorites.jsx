// Favorites Page
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/userService'
import './Favorites.css'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingLabel, setEditingLabel] = useState(null)
  const [labelValue, setLabelValue] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const data = await userService.getFavorites()
      setFavorites(data)
    } catch (error) {
      console.error('Error loading favorites:', error)
      alert('Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (favoriteId) => {
    if (!confirm('Remove this search from favorites?')) return

    try {
      await userService.removeFromFavorites(favoriteId)
      await loadFavorites()
    } catch (error) {
      console.error('Error removing favorite:', error)
      alert('Failed to remove favorite')
    }
  }

  const handleEditLabel = (favorite) => {
    setEditingLabel(favorite.id)
    setLabelValue(favorite.label || '')
  }

  const handleSaveLabel = async (favoriteId) => {
    try {
      await userService.updateFavoriteLabel(favoriteId, labelValue)
      setEditingLabel(null)
      setLabelValue('')
      await loadFavorites()
    } catch (error) {
      console.error('Error updating label:', error)
      alert('Failed to update label')
    }
  }

  const handleCancelEdit = () => {
    setEditingLabel(null)
    setLabelValue('')
  }

  const handleViewResult = async (searchQuery) => {
    if (!searchQuery?.id) return

    try {
      const result = await userService.getSearchResultByQueryId(searchQuery.id)
      if (result) {
        navigate('/results', { state: { result } })
        return
      }
      navigate('/dashboard')
    } catch (error) {
      console.error('Error loading result:', error)
      navigate('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="favorites-container">
        <div className="loading">Loading favorites...</div>
      </div>
    )
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <h1>Favorite Searches</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <p>No favorite searches yet. Add searches to favorites to see them here.</p>
          <button onClick={() => navigate('/dashboard')}>Start Searching</button>
        </div>
      ) : (
        <div className="favorites-list">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="favorite-item">
              <div className="favorite-info">
                <h3>
                  {favorite.search_queries?.first_name} {favorite.search_queries?.last_name}
                </h3>
                {editingLabel === favorite.id ? (
                  <div className="label-edit">
                    <input
                      type="text"
                      value={labelValue}
                      onChange={(e) => setLabelValue(e.target.value)}
                      placeholder="Enter label"
                      className="label-input"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveLabel(favorite.id)}
                      className="save-label-button"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="cancel-label-button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="label-display">
                    {favorite.label ? (
                      <span className="favorite-label">{favorite.label}</span>
                    ) : (
                      <span className="no-label">No label</span>
                    )}
                    <button
                      onClick={() => handleEditLabel(favorite)}
                      className="edit-label-button"
                      title="Edit label"
                    >
                      ✏️
                    </button>
                  </div>
                )}
                <p className="favorite-details">
                  {favorite.search_queries?.age && `Age: ${favorite.search_queries.age} • `}
                  {favorite.search_queries?.location && `Location: ${favorite.search_queries.location} • `}
                  Favorited: {new Date(favorite.favorited_at).toLocaleString()}
                </p>
              </div>
              <div className="favorite-actions">
                <button
                  onClick={() => handleViewResult(favorite.search_queries)}
                  className="view-button"
                >
                  View Results
                </button>
                <button
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  className="remove-button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


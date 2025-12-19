// Search History Page
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/userService'
import './SearchHistory.css'

export default function SearchHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await userService.getSearchHistory()
      setHistory(data)
    } catch (error) {
      console.error('Error loading history:', error)
      alert('Failed to load search history')
    } finally {
      setLoading(false)
    }
  }

  const handleViewResult = async (searchQuery) => {
    if (!searchQuery?.id) return
    
    try {
      // Try to get the result from guest service or fetch it
      const { guestService } = await import('../services/guestService')
      if (guestService.isGuestMode()) {
        const result = guestService.getSearchResultByQueryId(searchQuery.id)
        if (result) {
          navigate('/results', { state: { result } })
          return
        }
      }
      
      // For authenticated users, navigate to dashboard
      // In a full implementation, you'd fetch the result from the database
      navigate('/dashboard')
    } catch (error) {
      console.error('Error loading result:', error)
      navigate('/dashboard')
    }
  }

  const handleDeleteHistory = async (historyId) => {
    if (!confirm('Are you sure you want to delete this search from your history?')) {
      return
    }

    try {
      await userService.deleteSearchHistory(historyId)
      await loadHistory() // Reload the list
    } catch (error) {
      console.error('Error deleting history:', error)
      alert('Failed to delete search history')
    }
  }

  const handleDeleteSearch = async (searchQueryId) => {
    if (!confirm('Are you sure you want to delete this search? This will also delete associated results and history.')) {
      return
    }

    try {
      await userService.deleteSearchQuery(searchQueryId)
      await loadHistory() // Reload the list
    } catch (error) {
      console.error('Error deleting search:', error)
      alert('Failed to delete search')
    }
  }

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading">Loading search history...</div>
      </div>
    )
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Search History</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
      </div>

      {history.length === 0 ? (
        <div className="empty-history">
          <p>No search history yet. Start searching to see your history here.</p>
          <button onClick={() => navigate('/dashboard')}>Start Searching</button>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-info">
                <h3>
                  {item.search_queries?.first_name} {item.search_queries?.last_name}
                </h3>
                <p className="search-details">
                  {item.search_queries?.age && `Age: ${item.search_queries.age} • `}
                  {item.search_queries?.location && `Location: ${item.search_queries.location} • `}
                  Searched: {new Date(item.searched_at).toLocaleString()}
                </p>
              </div>
              <div className="history-actions">
                <button
                  onClick={() => handleViewResult(item.search_queries)}
                  className="view-button"
                >
                  View Results
                </button>
                <button
                  onClick={() => handleDeleteHistory(item.id)}
                  className="delete-button"
                  title="Delete from history"
                >
                  Delete
                </button>
                {item.search_queries?.id && (
                  <button
                    onClick={() => handleDeleteSearch(item.search_queries.id)}
                    className="delete-button delete-all"
                    title="Delete search and all related data"
                  >
                    Delete All
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


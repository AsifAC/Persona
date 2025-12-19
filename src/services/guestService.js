// Guest Service - Handles local storage for guest users
const GUEST_STORAGE_KEY = 'persona_guest_data'
const GUEST_USER_KEY = 'persona_guest_user'

export const guestService = {
  // Check if user is in guest mode
  isGuestMode() {
    return localStorage.getItem(GUEST_USER_KEY) === 'true'
  },

  // Enable guest mode
  enableGuestMode() {
    localStorage.setItem(GUEST_USER_KEY, 'true')
    this.initializeGuestData()
  },

  // Disable guest mode (when user logs in)
  disableGuestMode() {
    localStorage.removeItem(GUEST_USER_KEY)
    localStorage.removeItem(GUEST_STORAGE_KEY)
  },

  // Initialize guest data structure
  initializeGuestData() {
    const existing = this.getGuestData()
    if (!existing) {
      const initialData = {
        profile: {
          id: `guest_${Date.now()}`,
          email: 'guest@persona.local',
          first_name: 'Guest',
          last_name: 'User',
          created_at: new Date().toISOString(),
        },
        searchHistory: [],
        favorites: [],
        searchQueries: [],
        searchResults: [],
      }
      this.saveGuestData(initialData)
    }
  },

  // Get all guest data
  getGuestData() {
    try {
      const data = localStorage.getItem(GUEST_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error reading guest data:', error)
      return null
    }
  },

  // Save guest data
  saveGuestData(data) {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving guest data:', error)
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        alert('Local storage is full. Please clear some data or log in to save to cloud.')
      }
    }
  },

  // Get guest profile
  getProfile() {
    const data = this.getGuestData()
    return data?.profile || null
  },

  // Update guest profile
  updateProfile(updates) {
    const data = this.getGuestData()
    if (data) {
      data.profile = {
        ...data.profile,
        ...updates,
        updated_at: new Date().toISOString(),
      }
      this.saveGuestData(data)
      return data.profile
    }
    return null
  },

  // Add search query
  addSearchQuery(query) {
    const data = this.getGuestData()
    if (data) {
      const searchQuery = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: data.profile.id,
        first_name: query.firstName,
        last_name: query.lastName,
        age: query.age || null,
        location: query.location || null,
        created_at: new Date().toISOString(),
      }
      data.searchQueries.push(searchQuery)
      this.saveGuestData(data)
      return searchQuery
    }
    return null
  },

  // Add search result
  addSearchResult(searchQueryId, personProfile, confidenceScore, relatedData) {
    const data = this.getGuestData()
    if (data) {
      const result = {
        id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        search_query_id: searchQueryId,
        person_profile_id: personProfile.id,
        confidence_score: confidenceScore,
        created_at: new Date().toISOString(),
        personProfile,
        ...relatedData,
      }
      data.searchResults.push(result)
      this.saveGuestData(data)
      return result
    }
    return null
  },

  // Add to search history
  addToHistory(searchQueryId) {
    const data = this.getGuestData()
    if (data) {
      const historyItem = {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: data.profile.id,
        search_query_id: searchQueryId,
        searched_at: new Date().toISOString(),
      }
      data.searchHistory.push(historyItem)
      this.saveGuestData(data)
      return historyItem
    }
    return null
  },

  // Get search history
  getSearchHistory(limit = 50) {
    const data = this.getGuestData()
    if (!data) return []

    const history = data.searchHistory
      .sort((a, b) => new Date(b.searched_at) - new Date(a.searched_at))
      .slice(0, limit)
      .map(item => {
        const query = data.searchQueries.find(q => q.id === item.search_query_id)
        const result = data.searchResults.find(r => r.search_query_id === item.search_query_id)
        return {
          ...item,
          search_queries: query,
          search_results: result ? [result] : [],
        }
      })

    return history
  },

  // Add to favorites
  addToFavorites(searchQueryId, label = null) {
    const data = this.getGuestData()
    if (data) {
      // Check if already favorited
      const existing = data.favorites.find(f => f.search_query_id === searchQueryId)
      if (existing) {
        return existing
      }

      const favorite = {
        id: `favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: data.profile.id,
        search_query_id: searchQueryId,
        label: label,
        favorited_at: new Date().toISOString(),
      }
      data.favorites.push(favorite)
      this.saveGuestData(data)
      return favorite
    }
    return null
  },

  // Remove from favorites
  removeFromFavorites(favoriteId) {
    const data = this.getGuestData()
    if (data) {
      data.favorites = data.favorites.filter(f => f.id !== favoriteId)
      this.saveGuestData(data)
      return { success: true }
    }
    return { success: false }
  },

  // Update favorite label
  updateFavoriteLabel(favoriteId, label) {
    const data = this.getGuestData()
    if (data) {
      const favorite = data.favorites.find(f => f.id === favoriteId)
      if (favorite) {
        favorite.label = label
        this.saveGuestData(data)
        return favorite
      }
    }
    return null
  },

  // Get favorites
  getFavorites() {
    const data = this.getGuestData()
    if (!data) return []

    return data.favorites
      .sort((a, b) => new Date(b.favorited_at) - new Date(a.favorited_at))
      .map(favorite => {
        const query = data.searchQueries.find(q => q.id === favorite.search_query_id)
        const result = data.searchResults.find(r => r.search_query_id === favorite.search_query_id)
        return {
          ...favorite,
          search_queries: query,
          search_results: result ? [result] : [],
        }
      })
  },

  // Check if favorited
  isFavorited(searchQueryId) {
    const data = this.getGuestData()
    if (!data) return false
    return data.favorites.some(f => f.search_query_id === searchQueryId)
  },

  // Delete search history item
  deleteSearchHistory(historyId) {
    const data = this.getGuestData()
    if (data) {
      data.searchHistory = data.searchHistory.filter(h => h.id !== historyId)
      this.saveGuestData(data)
      return { success: true }
    }
    return { success: false }
  },

  // Delete search query
  deleteSearchQuery(searchQueryId) {
    const data = this.getGuestData()
    if (data) {
      // Delete query
      data.searchQueries = data.searchQueries.filter(q => q.id !== searchQueryId)
      // Delete related results
      data.searchResults = data.searchResults.filter(r => r.search_query_id !== searchQueryId)
      // Delete related history
      data.searchHistory = data.searchHistory.filter(h => h.search_query_id !== searchQueryId)
      // Delete related favorites
      data.favorites = data.favorites.filter(f => f.search_query_id !== searchQueryId)
      this.saveGuestData(data)
      return { success: true }
    }
    return { success: false }
  },

  // Get search result by query ID
  getSearchResultByQueryId(searchQueryId) {
    const data = this.getGuestData()
    if (!data) return null

    const result = data.searchResults.find(r => r.search_query_id === searchQueryId)
    if (result) {
      const query = data.searchQueries.find(q => q.id === searchQueryId)
      return {
        ...result,
        searchQuery: query,
      }
    }
    return null
  },
}


// User Service - Handles user profile, search history, and favorites
import { supabase } from '../config/supabase'
import { guestService } from './guestService'

// Helper to check if in guest mode
const isGuestMode = () => {
  return guestService.isGuestMode()
}

export const userService = {
  // Get user profile
  async getProfile() {
    if (isGuestMode()) {
      return guestService.getProfile()
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      throw error
    }
  },

  // Update user profile
  async updateProfile(updates) {
    if (isGuestMode()) {
      return guestService.updateProfile(updates)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },

  // Get search history
  async getSearchHistory(limit = 50) {
    if (isGuestMode()) {
      return guestService.getSearchHistory(limit)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('search_history')
        .select(`
          *,
          search_queries (*)
        `)
        .eq('user_id', user.id)
        .order('searched_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching search history:', error)
      throw error
    }
  },

  // Add search to favorites
  async addToFavorites(searchQueryId, label = null) {
    if (isGuestMode()) {
      return guestService.addToFavorites(searchQueryId, label)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('favorite_searches')
        .insert({
          user_id: user.id,
          search_query_id: searchQueryId,
          label: label,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  },

  // Remove search from favorites
  async removeFromFavorites(favoriteId) {
    if (isGuestMode()) {
      return guestService.removeFromFavorites(favoriteId)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('favorite_searches')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', user.id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  },

  // Get favorite searches
  async getFavorites() {
    if (isGuestMode()) {
      return guestService.getFavorites()
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('favorite_searches')
        .select(`
          *,
          search_queries (*)
        `)
        .eq('user_id', user.id)
        .order('favorited_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching favorites:', error)
      throw error
    }
  },

  // Check if search is favorited
  async isFavorited(searchQueryId) {
    if (isGuestMode()) {
      return guestService.isFavorited(searchQueryId)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('favorite_searches')
        .select('id')
        .eq('user_id', user.id)
        .eq('search_query_id', searchQueryId)
        .maybeSingle()

      if (error) throw error
      return !!data
    } catch (error) {
      console.error('Error checking favorite status:', error)
      return false
    }
  },

  // Update favorite label
  async updateFavoriteLabel(favoriteId, label) {
    if (isGuestMode()) {
      return guestService.updateFavoriteLabel(favoriteId, label)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('favorite_searches')
        .update({ label })
        .eq('id', favoriteId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating favorite label:', error)
      throw error
    }
  },

  // Delete search history item
  async deleteSearchHistory(historyId) {
    if (isGuestMode()) {
      return guestService.deleteSearchHistory(historyId)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', historyId)
        .eq('user_id', user.id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting search history:', error)
      throw error
    }
  },

  // Get search result by search query ID
  async getSearchResultByQueryId(searchQueryId) {
    if (isGuestMode()) {
      return guestService.getSearchResultByQueryId(searchQueryId)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('search_results')
        .select(`
          *,
          search_queries (*),
          person_profiles (
            *,
            addresses (*),
            phone_numbers (*),
            social_media (*),
            criminal_records (*),
            relatives (*)
          )
        `)
        .eq('search_query_id', searchQueryId)
        .single()

      if (error) throw error

      const personProfile = data.person_profiles
      const propertyRecords = personProfile?.metadata?.propertyRecords || []

      return {
        searchQuery: data.search_queries,
        searchQueryId: data.search_queries?.id,
        searchResult: data,
        personProfile,
        confidenceScore: data.confidence_score,
        addresses: personProfile?.addresses || [],
        phoneNumbers: personProfile?.phone_numbers || [],
        socialMedia: personProfile?.social_media || [],
        criminalRecords: personProfile?.criminal_records || [],
        relatives: personProfile?.relatives || [],
        propertyRecords,
      }
    } catch (error) {
      console.error('Error fetching search result:', error)
      throw error
    }
  },

  // Delete all search history items
  async deleteAllSearchHistory() {
    if (isGuestMode()) {
      return guestService.deleteAllSearchHistory()
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting all search history:', error)
      throw error
    }
  },

  // Delete search query (and associated results/history)
  async deleteSearchQuery(searchQueryId) {
    if (isGuestMode()) {
      return guestService.deleteSearchQuery(searchQueryId)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // First verify the search query belongs to the user
      const { data: query, error: queryError } = await supabase
        .from('search_queries')
        .select('id')
        .eq('id', searchQueryId)
        .eq('user_id', user.id)
        .single()

      if (queryError || !query) {
        throw new Error('Search query not found or access denied')
      }

      // Delete the search query (cascade will handle related records)
      const { error } = await supabase
        .from('search_queries')
        .delete()
        .eq('id', searchQueryId)
        .eq('user_id', user.id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting search query:', error)
      throw error
    }
  },

  // Delete user account
  async deleteAccount() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Delete user profile (cascade will handle related records)
      // This will delete: search_queries, search_history, favorite_searches
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) throw profileError

      // Sign out the user
      // Note: To fully delete the auth user, you need Supabase Admin API
      // For now, we delete the profile data and sign out
      // The auth user can be deleted manually through Supabase dashboard if needed
      await supabase.auth.signOut()

      return { success: true }
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  },
}


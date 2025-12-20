// EnformionGO API Configuration
// EnformionGO provides comprehensive people search data including:
// - People Search, Contact Enrichment, Address History
// - Phone Numbers, Email Addresses
// - Social Media Profiles
// - Criminal Records
// - Property Records, Relatives, and more

import { supabase } from './supabase'

export const API_CONFIG = {
  // EnformionGO API Configuration
  // Documentation: https://enformiongo.readme.io/reference/overview
  ENFORMIONGO: {
    PROXY_URL: import.meta.env.VITE_ENFORMIONGO_PROXY_URL,
    // Search types for galaxy-search-type header
    // See: https://enformiongo.readme.io/reference/overview
    SEARCH_TYPES: {
      PEOPLE_SEARCH: 'PersonSearch',
      CONTACT_ENRICHMENT: 'DevAPIContactEnrich',
      CONTACT_ENRICHMENT_PLUS: 'DevAPIContactEnrichPlus',
      REVERSE_PHONE: 'ReversePhoneSearch',
      CRIMINAL_RECORDS: 'CriminalSearchV2',
      PROPERTY_RECORDS: 'PropertySearchV2',
      // Note: These may need to be verified against actual API documentation
      ADDRESS_SEARCH: 'AddressID',
      RELATIVES: 'PersonSearch', // May need separate endpoint
      SOCIAL_MEDIA: 'PersonSearch', // May need separate endpoint
    }
  }
}

// Helper function to make EnformionGO API requests
// Uses header-based authentication as per: https://enformiongo.readme.io/reference/overview
export const makeEnformionGORequest = async (searchType, body = {}) => {
  try {
    const { PROXY_URL } = API_CONFIG.ENFORMIONGO
    const proxyUrl = PROXY_URL || (import.meta.env.VITE_SUPABASE_URL
      ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enformion-proxy`
      : '')
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!anonKey) {
      throw new Error('Supabase anon key not configured. Please set VITE_SUPABASE_ANON_KEY in .env file.')
    }
    
    // Check if proxy URL is configured
    if (!proxyUrl || proxyUrl.includes('placeholder')) {
      console.warn('EnformionGO proxy URL not configured. Using fallback behavior.')
      throw new Error('EnformionGO proxy URL not configured. Please set VITE_ENFORMIONGO_PROXY_URL or VITE_SUPABASE_URL in .env file.')
    }

    const { data: { session } } = await supabase.auth.getSession()
    const authToken = session?.access_token || anonKey
    
    // Requests are routed through a Supabase Edge Function proxy to avoid CORS.
    const url = proxyUrl
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        searchType,
        body,
      }),
    })

    const contentType = response.headers.get('content-type') || ''

    if (!response.ok) {
      const errorText = await response.text()
      console.error('EnformionGO API error:', response.status, errorText)
      throw new Error(`EnformionGO API request failed: ${response.status} ${response.statusText}`)
    }

    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error('EnformionGO API returned non-JSON response:', text.slice(0, 200))
      throw new Error('EnformionGO API returned non-JSON response. Check ENFORMIONGO_BASE_URL and upstream behavior.')
    }

    return await response.json()
  } catch (error) {
    // If it's a network error (domain not found), provide helpful message
    if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
      console.error('EnformionGO API network error - domain may be incorrect:', error)
      throw new Error('EnformionGO proxy endpoint not reachable. Please verify your Supabase project URL and Edge Function deployment.')
    }
    console.error('EnformionGO API request error:', error)
    throw error
  }
}

// Legacy helper function for backward compatibility
export const makeAPIRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}


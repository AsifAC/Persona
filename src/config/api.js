// EnformionGO API Configuration
// EnformionGO provides comprehensive people search data including:
// - People Search, Contact Enrichment, Address History
// - Phone Numbers, Email Addresses
// - Social Media Profiles
// - Criminal Records
// - Property Records, Relatives, and more

export const API_CONFIG = {
  // EnformionGO API Configuration
  ENFORMIONGO: {
    API_KEY_NAME: import.meta.env.VITE_ENFORMIONGO_API_KEY_NAME || 'fe41ff8ada4e49e99a6f5c6d16ea7ab3',
    API_KEY_PASSWORD: import.meta.env.VITE_ENFORMIONGO_API_KEY_PASSWORD || '6927a7dd1e16494eae1b74c41427e239',
    BASE_URL: import.meta.env.VITE_ENFORMIONGO_BASE_URL || 'https://api.enformiongo.com/v1',
    ENDPOINTS: {
      PEOPLE_SEARCH: '/people/search',
      CONTACT_ENRICHMENT: '/contact/enrichment',
      ADDRESS_SEARCH: '/address/search',
      PHONE_SEARCH: '/phone/search',
      CRIMINAL_RECORDS: '/criminal/records',
      PROPERTY_RECORDS: '/property/records',
      RELATIVES: '/relatives/search',
      SOCIAL_MEDIA: '/social/search',
    }
  }
}

// Helper function to make EnformionGO API requests with Basic Auth
export const makeEnformionGORequest = async (endpoint, body = {}) => {
  try {
    const { API_KEY_NAME, API_KEY_PASSWORD, BASE_URL } = API_CONFIG.ENFORMIONGO
    
    // Create Basic Auth header
    const credentials = btoa(`${API_KEY_NAME}:${API_KEY_PASSWORD}`)
    
    const url = `${BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('EnformionGO API error:', response.status, errorText)
      throw new Error(`EnformionGO API request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
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


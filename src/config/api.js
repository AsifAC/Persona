// External API Configuration
// Replace these with your actual API keys and endpoints
// Example services: WhitePages, PeopleFinder, BeenVerified, TruthFinder, etc.

export const API_CONFIG = {
  // People Data API Configuration
  // TODO: Replace with your actual API key and base URL
  // Example: WhitePages API, PeopleFinder API, etc.
  PEOPLE_DATA: {
    API_KEY: import.meta.env.VITE_PEOPLE_DATA_API_KEY || 'YOUR_PEOPLE_DATA_API_KEY_HERE',
    BASE_URL: import.meta.env.VITE_PEOPLE_DATA_API_URL || 'https://api.example.com/v1',
    // Example endpoints - adjust based on your API provider
    ENDPOINTS: {
      SEARCH: '/people/search',
      DETAILS: '/people/details',
    }
  },

  // Criminal Records API Configuration (if using separate service)
  // TODO: Replace with your actual API key and base URL
  CRIMINAL_RECORDS: {
    API_KEY: import.meta.env.VITE_CRIMINAL_RECORDS_API_KEY || 'YOUR_CRIMINAL_RECORDS_API_KEY_HERE',
    BASE_URL: import.meta.env.VITE_CRIMINAL_RECORDS_API_URL || 'https://api.criminalrecords.com/v1',
    ENDPOINTS: {
      SEARCH: '/records/search',
    }
  },

  // Social Media API Configuration (if using separate service)
  // TODO: Replace with your actual API key and base URL
  SOCIAL_MEDIA: {
    API_KEY: import.meta.env.VITE_SOCIAL_MEDIA_API_KEY || 'YOUR_SOCIAL_MEDIA_API_KEY_HERE',
    BASE_URL: import.meta.env.VITE_SOCIAL_MEDIA_API_URL || 'https://api.socialmedia.com/v1',
    ENDPOINTS: {
      SEARCH: '/social/search',
    }
  }
}

// Helper function to make API requests
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


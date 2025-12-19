// Search Service - Handles person search and data aggregation
import { supabase } from '../config/supabase'
import { API_CONFIG, makeAPIRequest } from '../config/api'
import { guestService } from './guestService'

// Helper to check if in guest mode
const isGuestMode = () => {
  return guestService.isGuestMode()
}

export const searchService = {
  // Main search function - aggregates data from multiple sources
  async searchPerson(query) {
    try {
      const { firstName, lastName, age, location } = query

      // Validate required fields
      if (!firstName || !lastName) {
        throw new Error('First name and last name are required')
      }

      // Step 1: Save search query (database or localStorage)
      let searchQuery
      if (isGuestMode()) {
        // Guest mode: save to localStorage
        searchQuery = guestService.addSearchQuery(query)
        if (!searchQuery) {
          throw new Error('Failed to save search query in guest mode')
        }
      } else {
        // Authenticated mode: save to database
        const { data: currentUser } = await supabase.auth.getUser()
        if (!currentUser?.user) {
          throw new Error('User must be authenticated to search')
        }

        const { data: queryData, error: queryError } = await supabase
          .from('search_queries')
          .insert({
            user_id: currentUser.user.id,
            first_name: firstName,
            last_name: lastName,
            age: age || null,
            location: location || null,
          })
          .select()
          .single()

        if (queryError) throw queryError
        searchQuery = queryData
      }

      // TODO: Replace these API calls with your actual data provider APIs
      // Example providers: WhitePages, PeopleFinder, BeenVerified, TruthFinder, etc.
      
      const [personData, addresses, phoneNumbers, socialMedia, criminalRecords, relatives] = 
        await Promise.allSettled([
          this.fetchPersonData(query),
          this.fetchAddresses(query),
          this.fetchPhoneNumbers(query),
          this.fetchSocialMedia(query),
          this.fetchCriminalRecords(query),
          this.fetchRelatives(query),
        ])

      // Step 3: Create or update person profile
      let personProfile
      if (isGuestMode()) {
        // Guest mode: create simple profile object
        personProfile = {
          id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          first_name: firstName,
          last_name: lastName,
          age: age || null,
          last_updated: new Date().toISOString(),
          metadata: personData.status === 'fulfilled' ? personData.value : {},
        }
      } else {
        // Authenticated mode: save to database
        personProfile = await this.createOrUpdatePersonProfile({
          firstName,
          lastName,
          age,
          personData: personData.status === 'fulfilled' ? personData.value : null,
          addresses: addresses.status === 'fulfilled' ? addresses.value : [],
          phoneNumbers: phoneNumbers.status === 'fulfilled' ? phoneNumbers.value : [],
          socialMedia: socialMedia.status === 'fulfilled' ? socialMedia.value : [],
          criminalRecords: criminalRecords.status === 'fulfilled' ? criminalRecords.value : [],
          relatives: relatives.status === 'fulfilled' ? relatives.value : [],
        })
      }

      // Step 4: Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore({
        personData: personData.status === 'fulfilled' ? personData.value : null,
        addresses: addresses.status === 'fulfilled' ? addresses.value : [],
        phoneNumbers: phoneNumbers.status === 'fulfilled' ? phoneNumbers.value : [],
        socialMedia: socialMedia.status === 'fulfilled' ? socialMedia.value : [],
        criminalRecords: criminalRecords.status === 'fulfilled' ? criminalRecords.value : [],
        relatives: relatives.status === 'fulfilled' ? relatives.value : [],
      })

      // Step 5: Save search result
      let searchResult
      if (isGuestMode()) {
        // Guest mode: save to localStorage
        const relatedData = {
          addresses: addresses.status === 'fulfilled' ? addresses.value : [],
          phoneNumbers: phoneNumbers.status === 'fulfilled' ? phoneNumbers.value : [],
          socialMedia: socialMedia.status === 'fulfilled' ? socialMedia.value : [],
          criminalRecords: criminalRecords.status === 'fulfilled' ? criminalRecords.value : [],
          relatives: relatives.status === 'fulfilled' ? relatives.value : [],
        }
        
        searchResult = guestService.addSearchResult(
          searchQuery.id,
          personProfile,
          confidenceScore,
          relatedData
        )
        
        // Save to search history
        guestService.addToHistory(searchQuery.id)
      } else {
        // Authenticated mode: save to database
        const { data: resultData, error: resultError } = await supabase
          .from('search_results')
          .insert({
            search_query_id: searchQuery.id,
            person_profile_id: personProfile.id,
            confidence_score: confidenceScore,
          })
          .select()
          .single()

        if (resultError) throw resultError
        searchResult = resultData

        // Save to search history
        const { data: currentUser } = await supabase.auth.getUser()
        await supabase
          .from('search_history')
          .insert({
            user_id: currentUser.user.id,
            search_query_id: searchQuery.id,
          })
      }

      // Step 7: Return complete result
      return {
        searchQuery,
        searchResult,
        personProfile: {
          ...personProfile,
          addresses: addresses.status === 'fulfilled' ? addresses.value : [],
          phoneNumbers: phoneNumbers.status === 'fulfilled' ? phoneNumbers.value : [],
          socialMedia: socialMedia.status === 'fulfilled' ? socialMedia.value : [],
          criminalRecords: criminalRecords.status === 'fulfilled' ? criminalRecords.value : [],
          relatives: relatives.status === 'fulfilled' ? relatives.value : [],
        },
        confidenceScore,
      }
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  },

  // Fetch person data from external API
  // TODO: Replace with your actual API implementation
  async fetchPersonData(query) {
    try {
      // Example API call - replace with your actual API endpoint
      const url = `${API_CONFIG.PEOPLE_DATA.BASE_URL}${API_CONFIG.PEOPLE_DATA.ENDPOINTS.SEARCH}`
      
      const response = await makeAPIRequest(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.PEOPLE_DATA.API_KEY}`,
        },
        body: JSON.stringify({
          first_name: query.firstName,
          last_name: query.lastName,
          age: query.age,
          location: query.location,
        }),
      })

      return response
    } catch (error) {
      console.error('Error fetching person data:', error)
      // Return mock data for development if API is not configured
      if (API_CONFIG.PEOPLE_DATA.API_KEY === 'YOUR_PEOPLE_DATA_API_KEY_HERE') {
        return {
          firstName: query.firstName,
          lastName: query.lastName,
          age: query.age,
          location: query.location,
        }
      }
      throw error
    }
  },

  // Fetch addresses from external API
  // TODO: Replace with your actual API implementation
  async fetchAddresses(query) {
    try {
      // Example API call - replace with your actual API endpoint
      const url = `${API_CONFIG.PEOPLE_DATA.BASE_URL}/addresses/search`
      
      const response = await makeAPIRequest(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.PEOPLE_DATA.API_KEY}`,
        },
        body: JSON.stringify({
          first_name: query.firstName,
          last_name: query.lastName,
          location: query.location,
        }),
      })

      return Array.isArray(response) ? response : response.addresses || []
    } catch (error) {
      console.error('Error fetching addresses:', error)
      // Return empty array if API fails
      return []
    }
  },

  // Fetch phone numbers from external API
  // TODO: Replace with your actual API implementation
  async fetchPhoneNumbers(query) {
    try {
      const url = `${API_CONFIG.PEOPLE_DATA.BASE_URL}/phones/search`
      
      const response = await makeAPIRequest(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.PEOPLE_DATA.API_KEY}`,
        },
        body: JSON.stringify({
          first_name: query.firstName,
          last_name: query.lastName,
          location: query.location,
        }),
      })

      return Array.isArray(response) ? response : response.phones || []
    } catch (error) {
      console.error('Error fetching phone numbers:', error)
      return []
    }
  },

  // Fetch social media profiles from external API
  // TODO: Replace with your actual API implementation
  async fetchSocialMedia(query) {
    try {
      const url = `${API_CONFIG.SOCIAL_MEDIA.BASE_URL}${API_CONFIG.SOCIAL_MEDIA.ENDPOINTS.SEARCH}`
      
      const response = await makeAPIRequest(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.SOCIAL_MEDIA.API_KEY}`,
        },
        body: JSON.stringify({
          first_name: query.firstName,
          last_name: query.lastName,
          location: query.location,
        }),
      })

      return Array.isArray(response) ? response : response.socialMedia || []
    } catch (error) {
      console.error('Error fetching social media:', error)
      return []
    }
  },

  // Fetch criminal records from external API
  // TODO: Replace with your actual API implementation
  async fetchCriminalRecords(query) {
    try {
      const url = `${API_CONFIG.CRIMINAL_RECORDS.BASE_URL}${API_CONFIG.CRIMINAL_RECORDS.ENDPOINTS.SEARCH}`
      
      const response = await makeAPIRequest(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.CRIMINAL_RECORDS.API_KEY}`,
        },
        body: JSON.stringify({
          first_name: query.firstName,
          last_name: query.lastName,
          location: query.location,
        }),
      })

      return Array.isArray(response) ? response : response.records || []
    } catch (error) {
      console.error('Error fetching criminal records:', error)
      return []
    }
  },

  // Fetch relatives from external API
  // TODO: Replace with your actual API implementation
  async fetchRelatives(query) {
    try {
      const url = `${API_CONFIG.PEOPLE_DATA.BASE_URL}/relatives/search`
      
      const response = await makeAPIRequest(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_CONFIG.PEOPLE_DATA.API_KEY}`,
        },
        body: JSON.stringify({
          first_name: query.firstName,
          last_name: query.lastName,
          location: query.location,
        }),
      })

      return Array.isArray(response) ? response : response.relatives || []
    } catch (error) {
      console.error('Error fetching relatives:', error)
      return []
    }
  },

  // Create or update person profile in database
  async createOrUpdatePersonProfile(data) {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('person_profiles')
        .select('*')
        .eq('first_name', data.firstName)
        .eq('last_name', data.lastName)
        .maybeSingle()

      let profileId

      if (existingProfile) {
        // Update existing profile
        const { data: updatedProfile, error } = await supabase
          .from('person_profiles')
          .update({
            age: data.age || existingProfile.age,
            last_updated: new Date().toISOString(),
            metadata: data.personData || existingProfile.metadata,
          })
          .eq('id', existingProfile.id)
          .select()
          .single()

        if (error) throw error
        profileId = updatedProfile.id
      } else {
        // Create new profile
        const { data: newProfile, error } = await supabase
          .from('person_profiles')
          .insert({
            first_name: data.firstName,
            last_name: data.lastName,
            age: data.age || null,
            metadata: data.personData || {},
          })
          .select()
          .single()

        if (error) throw error
        profileId = newProfile.id
      }

      // Save addresses
      if (data.addresses && data.addresses.length > 0) {
        const addressesToInsert = data.addresses.map(addr => ({
          person_profile_id: profileId,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          zip_code: addr.zipCode || addr.zip_code,
          country: addr.country || 'USA',
          is_current: addr.isCurrent || addr.is_current || false,
          start_date: addr.startDate || addr.start_date,
          end_date: addr.endDate || addr.end_date,
        }))

        await supabase.from('addresses').insert(addressesToInsert)
      }

      // Save phone numbers
      if (data.phoneNumbers && data.phoneNumbers.length > 0) {
        const phonesToInsert = data.phoneNumbers.map(phone => ({
          person_profile_id: profileId,
          number: phone.number || phone.phone,
          type: phone.type || 'mobile',
          is_current: phone.isCurrent || phone.is_current !== false,
          last_verified: phone.lastVerified || phone.last_verified,
        }))

        await supabase.from('phone_numbers').insert(phonesToInsert)
      }

      // Save social media
      if (data.socialMedia && data.socialMedia.length > 0) {
        const socialToInsert = data.socialMedia.map(social => ({
          person_profile_id: profileId,
          platform: social.platform,
          username: social.username,
          url: social.url,
          last_active: social.lastActive || social.last_active,
        }))

        await supabase.from('social_media').insert(socialToInsert)
      }

      // Save criminal records
      if (data.criminalRecords && data.criminalRecords.length > 0) {
        const recordsToInsert = data.criminalRecords.map(record => ({
          person_profile_id: profileId,
          case_number: record.caseNumber || record.case_number,
          charge: record.charge,
          status: record.status,
          record_date: record.date || record.record_date,
          jurisdiction: record.jurisdiction,
        }))

        await supabase.from('criminal_records').insert(recordsToInsert)
      }

      // Save relatives
      if (data.relatives && data.relatives.length > 0) {
        const relativesToInsert = data.relatives.map(relative => ({
          person_profile_id: profileId,
          first_name: relative.firstName || relative.first_name,
          last_name: relative.lastName || relative.last_name,
          relationship: relative.relationship,
          age: relative.age,
        }))

        await supabase.from('relatives').insert(relativesToInsert)
      }

      // Fetch complete profile
      const { data: completeProfile, error: fetchError } = await supabase
        .from('person_profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (fetchError) throw fetchError

      return completeProfile
    } catch (error) {
      console.error('Error creating/updating person profile:', error)
      throw error
    }
  },

  // Calculate confidence score based on available data
  calculateConfidenceScore(data) {
    let score = 0
    let maxScore = 0

    // Person data match (30 points)
    maxScore += 30
    if (data.personData) score += 30

    // Addresses (20 points)
    maxScore += 20
    if (data.addresses && data.addresses.length > 0) {
      score += Math.min(20, data.addresses.length * 5)
    }

    // Phone numbers (20 points)
    maxScore += 20
    if (data.phoneNumbers && data.phoneNumbers.length > 0) {
      score += Math.min(20, data.phoneNumbers.length * 5)
    }

    // Social media (15 points)
    maxScore += 15
    if (data.socialMedia && data.socialMedia.length > 0) {
      score += Math.min(15, data.socialMedia.length * 3)
    }

    // Criminal records (10 points)
    maxScore += 10
    if (data.criminalRecords && data.criminalRecords.length > 0) {
      score += 10
    }

    // Relatives (5 points)
    maxScore += 5
    if (data.relatives && data.relatives.length > 0) {
      score += Math.min(5, data.relatives.length * 1)
    }

    return Math.round((score / maxScore) * 100)
  },

  // Get search result by ID
  async getSearchResult(resultId) {
    try {
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
        .eq('id', resultId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching search result:', error)
      throw error
    }
  },
}


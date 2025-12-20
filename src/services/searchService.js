// Search Service - Handles person search and data aggregation
import { supabase } from '../config/supabase'
import { API_CONFIG, makeEnformionGORequest } from '../config/api'
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

      // Fetch all available data from EnformionGO API
      const [personData, addresses, phoneNumbers, socialMedia, criminalRecords, relatives, propertyRecords, contactEnrichment] = 
        await Promise.allSettled([
          this.fetchPersonData(query),
          this.fetchAddresses(query),
          this.fetchPhoneNumbers(query),
          this.fetchSocialMedia(query),
          this.fetchCriminalRecords(query),
          this.fetchRelatives(query),
          this.fetchPropertyRecords(query),
          this.fetchContactEnrichment(query),
        ])

      // Step 3: Create or update person profile
      let personProfile
      if (isGuestMode()) {
        // Guest mode: create simple profile object
        // Merge contact enrichment data into personData if available
        const enrichedPersonData = personData.status === 'fulfilled' ? personData.value : {}
        if (contactEnrichment.status === 'fulfilled' && contactEnrichment.value) {
          Object.assign(enrichedPersonData, contactEnrichment.value)
        }

        personProfile = {
          id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          first_name: firstName,
          last_name: lastName,
          age: age || null,
          last_updated: new Date().toISOString(),
          metadata: {
            ...enrichedPersonData,
            propertyRecords: propertyRecords.status === 'fulfilled' ? propertyRecords.value : [],
          },
        }
      } else {
        // Authenticated mode: save to database
        // Merge contact enrichment data into personData if available
        const enrichedPersonData = personData.status === 'fulfilled' ? personData.value : {}
        if (contactEnrichment.status === 'fulfilled' && contactEnrichment.value) {
          Object.assign(enrichedPersonData, contactEnrichment.value)
        }

        personProfile = await this.createOrUpdatePersonProfile({
          firstName,
          lastName,
          age,
          personData: enrichedPersonData,
          addresses: addresses.status === 'fulfilled' ? addresses.value : [],
          phoneNumbers: phoneNumbers.status === 'fulfilled' ? phoneNumbers.value : [],
          socialMedia: socialMedia.status === 'fulfilled' ? socialMedia.value : [],
          criminalRecords: criminalRecords.status === 'fulfilled' ? criminalRecords.value : [],
          relatives: relatives.status === 'fulfilled' ? relatives.value : [],
          propertyRecords: propertyRecords.status === 'fulfilled' ? propertyRecords.value : [],
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
        propertyRecords: propertyRecords.status === 'fulfilled' ? propertyRecords.value : [],
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
          propertyRecords: propertyRecords.status === 'fulfilled' ? propertyRecords.value : [],
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
          propertyRecords: propertyRecords.status === 'fulfilled' ? propertyRecords.value : [],
        },
        confidenceScore,
      }
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  },

  // Fetch person data from EnformionGO API
  async fetchPersonData(query) {
    try {
      const response = await makeEnformionGORequest(API_CONFIG.ENFORMIONGO.ENDPOINTS.PEOPLE_SEARCH, {
        first_name: query.firstName,
        last_name: query.lastName,
        age: query.age || null,
        location: query.location || null,
      })

      // Map EnformionGO response to our data structure
      // EnformionGO typically returns an array of matches or a single result
      const result = Array.isArray(response) ? response[0] : response
      
      return {
        firstName: result.first_name || result.firstName || query.firstName,
        lastName: result.last_name || result.lastName || query.lastName,
        middleName: result.middle_name || result.middleName || null,
        age: result.age || query.age || null,
        dateOfBirth: result.date_of_birth || result.dateOfBirth || null,
        location: result.location || query.location || null,
        city: result.city || null,
        state: result.state || null,
        zipCode: result.zip_code || result.zipCode || null,
        email: result.email || null,
        gender: result.gender || null,
        // Additional EnformionGO fields
        fullName: result.full_name || result.fullName || null,
        aliases: result.aliases || [],
        education: result.education || [],
        employment: result.employment || [],
        licenses: result.licenses || [],
        // Store raw response in metadata for future use
        _raw: result,
      }
    } catch (error) {
      console.error('Error fetching person data from EnformionGO:', error)
      // Return basic data structure if API fails
      return {
        firstName: query.firstName,
        lastName: query.lastName,
        age: query.age || null,
        location: query.location || null,
      }
    }
  },

  // Fetch addresses from EnformionGO API
  async fetchAddresses(query) {
    try {
      const response = await makeEnformionGORequest(API_CONFIG.ENFORMIONGO.ENDPOINTS.ADDRESS_SEARCH, {
        first_name: query.firstName,
        last_name: query.lastName,
        location: query.location || null,
      })

      // EnformionGO returns address history
      const addresses = Array.isArray(response) ? response : (response.addresses || response.address_history || [])
      
      return addresses.map(addr => ({
        street: addr.street || addr.street_address || addr.address_line_1 || '',
        city: addr.city || '',
        state: addr.state || addr.state_code || '',
        zipCode: addr.zip_code || addr.zip || addr.postal_code || '',
        country: addr.country || 'USA',
        isCurrent: addr.is_current || addr.current || false,
        startDate: addr.start_date || addr.date_from || null,
        endDate: addr.end_date || addr.date_to || addr.date_until || null,
        addressType: addr.type || addr.address_type || 'residential',
        // Additional EnformionGO fields
        county: addr.county || null,
        latitude: addr.latitude || addr.lat || null,
        longitude: addr.longitude || addr.lng || null,
        _raw: addr,
      }))
    } catch (error) {
      console.error('Error fetching addresses from EnformionGO:', error)
      return []
    }
  },

  // Fetch phone numbers from EnformionGO API
  async fetchPhoneNumbers(query) {
    try {
      const response = await makeEnformionGORequest(API_CONFIG.ENFORMIONGO.ENDPOINTS.PHONE_SEARCH, {
        first_name: query.firstName,
        last_name: query.lastName,
        location: query.location || null,
      })

      // EnformionGO returns phone number history
      const phones = Array.isArray(response) ? response : (response.phones || response.phone_numbers || [])
      
      return phones.map(phone => ({
        number: phone.number || phone.phone || phone.phone_number || '',
        type: phone.type || phone.phone_type || phone.line_type || 'mobile',
        isCurrent: phone.is_current || phone.current || true,
        lastVerified: phone.last_verified || phone.verified_date || phone.date_verified || null,
        carrier: phone.carrier || phone.phone_carrier || null,
        // Additional EnformionGO fields
        countryCode: phone.country_code || null,
        areaCode: phone.area_code || null,
        _raw: phone,
      }))
    } catch (error) {
      console.error('Error fetching phone numbers from EnformionGO:', error)
      return []
    }
  },

  // Fetch social media profiles from EnformionGO API
  async fetchSocialMedia(query) {
    try {
      const response = await makeEnformionGORequest(API_CONFIG.ENFORMIONGO.ENDPOINTS.SOCIAL_MEDIA, {
        first_name: query.firstName,
        last_name: query.lastName,
        location: query.location || null,
      })

      // EnformionGO returns social media profiles
      const socialProfiles = Array.isArray(response) ? response : (response.social_media || response.profiles || [])
      
      return socialProfiles.map(profile => ({
        platform: profile.platform || profile.network || profile.site || '',
        username: profile.username || profile.handle || profile.user_id || '',
        url: profile.url || profile.profile_url || profile.link || null,
        lastActive: profile.last_active || profile.last_seen || profile.activity_date || null,
        followers: profile.followers || profile.follower_count || null,
        // Additional EnformionGO fields
        verified: profile.verified || false,
        bio: profile.bio || profile.description || null,
        _raw: profile,
      }))
    } catch (error) {
      console.error('Error fetching social media from EnformionGO:', error)
      return []
    }
  },

  // Fetch criminal records from EnformionGO API
  async fetchCriminalRecords(query) {
    try {
      const response = await makeEnformionGORequest(API_CONFIG.ENFORMIONGO.ENDPOINTS.CRIMINAL_RECORDS, {
        first_name: query.firstName,
        last_name: query.lastName,
        location: query.location || null,
      })

      // EnformionGO returns criminal records
      const records = Array.isArray(response) ? response : (response.records || response.criminal_records || [])
      
      return records.map(record => ({
        caseNumber: record.case_number || record.caseNumber || record.docket_number || '',
        charge: record.charge || record.offense || record.crime || '',
        status: record.status || record.case_status || record.disposition || 'unknown',
        recordDate: record.date || record.record_date || record.case_date || record.date_filed || null,
        jurisdiction: record.jurisdiction || record.court || record.county || record.state || '',
        // Additional EnformionGO fields
        sentence: record.sentence || null,
        fine: record.fine || null,
        description: record.description || record.details || null,
        courtName: record.court_name || record.court || null,
        _raw: record,
      }))
    } catch (error) {
      console.error('Error fetching criminal records from EnformionGO:', error)
      return []
    }
  },

  // Fetch relatives from EnformionGO API
  async fetchRelatives(query) {
    try {
      const response = await makeEnformionGORequest(API_CONFIG.ENFORMIONGO.ENDPOINTS.RELATIVES, {
        first_name: query.firstName,
        last_name: query.lastName,
        location: query.location || null,
      })

      // EnformionGO returns relative associations
      const relatives = Array.isArray(response) ? response : (response.relatives || response.associates || [])
      
      return relatives.map(relative => ({
        firstName: relative.first_name || relative.firstName || '',
        lastName: relative.last_name || relative.lastName || '',
        relationship: relative.relationship || relative.relation || relative.type || 'unknown',
        age: relative.age || null,
        // Additional EnformionGO fields
        middleName: relative.middle_name || relative.middleName || null,
        city: relative.city || null,
        state: relative.state || null,
        _raw: relative,
      }))
    } catch (error) {
      console.error('Error fetching relatives from EnformionGO:', error)
      return []
    }
  },

  // Fetch property records from EnformionGO API
  async fetchPropertyRecords(query) {
    try {
      const response = await makeEnformionGORequest(API_CONFIG.ENFORMIONGO.ENDPOINTS.PROPERTY_RECORDS, {
        first_name: query.firstName,
        last_name: query.lastName,
        location: query.location || null,
      })

      // EnformionGO returns property ownership records
      const properties = Array.isArray(response) ? response : (response.properties || response.property_records || [])
      
      return properties.map(property => ({
        address: property.address || property.property_address || '',
        city: property.city || '',
        state: property.state || property.state_code || '',
        zipCode: property.zip_code || property.zip || '',
        propertyType: property.property_type || property.type || 'residential',
        ownershipType: property.ownership_type || property.tenure || null,
        purchaseDate: property.purchase_date || property.date_purchased || null,
        purchasePrice: property.purchase_price || property.price || null,
        assessedValue: property.assessed_value || property.value || null,
        // Additional EnformionGO fields
        county: property.county || null,
        lotSize: property.lot_size || property.acres || null,
        yearBuilt: property.year_built || null,
        squareFootage: property.square_footage || property.sqft || null,
        _raw: property,
      }))
    } catch (error) {
      console.error('Error fetching property records from EnformionGO:', error)
      return []
    }
  },

  // Fetch contact enrichment data from EnformionGO API
  async fetchContactEnrichment(query) {
    try {
      const response = await makeEnformionGORequest(API_CONFIG.ENFORMIONGO.ENDPOINTS.CONTACT_ENRICHMENT, {
        first_name: query.firstName,
        last_name: query.lastName,
        location: query.location || null,
      })

      // EnformionGO contact enrichment provides additional contact details
      const enrichment = response || {}
      
      return {
        email: enrichment.email || enrichment.email_address || null,
        emails: enrichment.emails || enrichment.email_addresses || [],
        phone: enrichment.phone || enrichment.phone_number || null,
        // Additional enrichment fields
        occupation: enrichment.occupation || enrichment.job_title || null,
        employer: enrichment.employer || enrichment.company || null,
        education: enrichment.education || enrichment.schools || [],
        income: enrichment.income || enrichment.estimated_income || null,
        vehicles: enrichment.vehicles || enrichment.vehicle_registrations || [],
        licenses: enrichment.licenses || enrichment.license_records || [],
        _raw: enrichment,
      }
    } catch (error) {
      console.error('Error fetching contact enrichment from EnformionGO:', error)
      return null
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

    // Person data match (25 points)
    maxScore += 25
    if (data.personData) score += 25

    // Addresses (20 points)
    maxScore += 20
    if (data.addresses && data.addresses.length > 0) {
      score += Math.min(20, data.addresses.length * 5)
    }

    // Phone numbers (15 points)
    maxScore += 15
    if (data.phoneNumbers && data.phoneNumbers.length > 0) {
      score += Math.min(15, data.phoneNumbers.length * 5)
    }

    // Social media (10 points)
    maxScore += 10
    if (data.socialMedia && data.socialMedia.length > 0) {
      score += Math.min(10, data.socialMedia.length * 3)
    }

    // Criminal records (10 points)
    maxScore += 10
    if (data.criminalRecords && data.criminalRecords.length > 0) {
      score += 10
    }

    // Property records (10 points)
    maxScore += 10
    if (data.propertyRecords && data.propertyRecords.length > 0) {
      score += Math.min(10, data.propertyRecords.length * 5)
    }

    // Relatives (10 points)
    maxScore += 10
    if (data.relatives && data.relatives.length > 0) {
      score += Math.min(10, data.relatives.length * 2)
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


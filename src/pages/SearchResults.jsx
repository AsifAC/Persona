// Search Results Page
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PersonCard from '../components/PersonCard'
import DataSection from '../components/DataSection'
import { userService } from '../services/userService'
import { submissionService } from '../services/submissionService'
import './SearchResults.css'

export default function SearchResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result || null
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifiedInfo, setVerifiedInfo] = useState({
    addresses: [],
    phoneNumbers: [],
    socialMedia: [],
    criminalRecords: [],
    relatives: [],
    pastNames: [],
  })
  const [verifiedLoading, setVerifiedLoading] = useState(false)

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

  useEffect(() => {
    if (!result) return

    const loadVerifiedInfo = async () => {
      try {
        setVerifiedLoading(true)
        const personProfile = result.personProfile || result.person_profile
        const submissions = await submissionService.getApprovedSubmissions({
          personProfileId: personProfile?.id,
          firstName: personProfile?.first_name || result.searchQuery?.first_name,
          lastName: personProfile?.last_name || result.searchQuery?.last_name,
        })

        const stripSubmissionId = (item) => {
          if (!item) return item
          const { submission_id: _submissionId, ...rest } = item
          return rest
        }

        const addresses = submissions.flatMap((sub) => (sub.person_info_addresses || []).map(stripSubmissionId))
        const phoneNumbers = submissions.flatMap((sub) => (sub.person_info_phone_numbers || []).map(stripSubmissionId))
        const socialMedia = submissions.flatMap((sub) => (sub.person_info_social_media || []).map(stripSubmissionId))
        const criminalRecords = submissions.flatMap((sub) => (sub.person_info_criminal_records || []).map(stripSubmissionId))
        const relatives = submissions.flatMap((sub) => (sub.person_info_relatives || []).map(stripSubmissionId))
        const pastNames = submissions.flatMap((sub) =>
          (sub.person_info_past_names || []).map((name) => ({ name: name.name }))
        )

        setVerifiedInfo({
          addresses,
          phoneNumbers,
          socialMedia,
          criminalRecords,
          relatives,
          pastNames,
        })
      } catch (error) {
        console.error('Error loading verified info:', error)
      } finally {
        setVerifiedLoading(false)
      }
    }

    loadVerifiedInfo()
  }, [result])

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

      <DataSection
        title="Property Records"
        data={result.propertyRecords || personProfile?.metadata?.propertyRecords || []}
        emptyMessage="No property records found"
      />

      <DataSection
        title="Verified Addresses"
        data={verifiedInfo.addresses}
        emptyMessage={verifiedLoading ? 'Loading verified addresses...' : 'No verified addresses'}
      />

      <DataSection
        title="Verified Phone Numbers"
        data={verifiedInfo.phoneNumbers}
        emptyMessage={verifiedLoading ? 'Loading verified phone numbers...' : 'No verified phone numbers'}
      />

      <DataSection
        title="Verified Social Media"
        data={verifiedInfo.socialMedia}
        emptyMessage={verifiedLoading ? 'Loading verified social media...' : 'No verified social media'}
      />

      <DataSection
        title="Verified Criminal Records"
        data={verifiedInfo.criminalRecords}
        emptyMessage={verifiedLoading ? 'Loading verified criminal records...' : 'No verified criminal records'}
      />

      <DataSection
        title="Verified Relatives"
        data={verifiedInfo.relatives}
        emptyMessage={verifiedLoading ? 'Loading verified relatives...' : 'No verified relatives'}
      />

      <DataSection
        title="Verified Past Names"
        data={verifiedInfo.pastNames}
        emptyMessage={verifiedLoading ? 'Loading verified past names...' : 'No verified past names'}
      />
    </div>
  )
}


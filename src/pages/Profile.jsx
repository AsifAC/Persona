// Profile Page
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/userService'
import './Profile.css'

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await userService.getProfile()
      setProfile(data)
      setFormData({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      alert('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await userService.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
      })
      setEditing(false)
      await loadProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmMessage = 'Are you sure you want to delete your account? This action cannot be undone and will delete all your data including search history and favorites.'
    if (!confirm(confirmMessage)) {
      return
    }

    const doubleConfirm = prompt('Type "DELETE" to confirm account deletion:')
    if (doubleConfirm !== 'DELETE') {
      alert('Account deletion cancelled')
      return
    }

    try {
      await userService.deleteAccount()
      alert('Account deleted successfully. You will be signed out.')
      navigate('/login')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please contact support if the issue persists.')
    }
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-section">
          <h2>Account Information</h2>
          <div className="profile-field">
            <label>Email</label>
            <div className="field-value">{user?.email || profile?.email}</div>
          </div>
          <div className="profile-field">
            <label>First Name</label>
            {editing ? (
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="edit-input"
              />
            ) : (
              <div className="field-value">{profile?.first_name || 'Not set'}</div>
            )}
          </div>
          <div className="profile-field">
            <label>Last Name</label>
            {editing ? (
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="edit-input"
              />
            ) : (
              <div className="field-value">{profile?.last_name || 'Not set'}</div>
            )}
          </div>
          <div className="profile-field">
            <label>Member Since</label>
            <div className="field-value">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : 'N/A'}
            </div>
          </div>
        </div>

        <div className="profile-actions">
          {editing ? (
            <>
              <button onClick={handleSave} className="save-button">
                Save Changes
              </button>
              <button onClick={() => {
                setEditing(false)
                loadProfile()
              }} className="cancel-button">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="edit-button">
              Edit Profile
            </button>
          )}
        </div>

        <div className="danger-zone">
          <h3>Danger Zone</h3>
          <p>Permanently delete your account and all associated data.</p>
          <button onClick={handleDeleteAccount} className="delete-account-button">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}


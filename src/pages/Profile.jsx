// Profile Page
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/userService'
import { authService } from '../services/authService'
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
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

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

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)

    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await authService.signIn(user.email, passwordData.currentPassword)
      if (signInError) {
        setPasswordError('Current password is incorrect')
        setChangingPassword(false)
        return
      }

      // Update password
      const { error } = await authService.updatePassword(passwordData.newPassword)
      if (error) {
        // Handle leaked password errors from Have I Been Pwned (HIBP)
        const errorMessage = error.message || 'Failed to update password'
        if (errorMessage.toLowerCase().includes('pwned') || 
            errorMessage.toLowerCase().includes('breach') ||
            errorMessage.toLowerCase().includes('compromised') ||
            errorMessage.toLowerCase().includes('common password') ||
            errorMessage.toLowerCase().includes('too common')) {
          setPasswordError('This password was found in a known data breach. Please choose a different, more secure password.')
        } else {
          setPasswordError(errorMessage)
        }
      } else {
        setPasswordSuccess('Password updated successfully')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        // Clear success message after 3 seconds
        setTimeout(() => setPasswordSuccess(''), 3000)
      }
    } catch (err) {
      setPasswordError('An unexpected error occurred')
    } finally {
      setChangingPassword(false)
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

        <div className="profile-section">
          <h2>Change Password</h2>
          {passwordSuccess && (
            <div className="success-message" style={{ color: 'green', marginBottom: '1rem' }}>
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
              {passwordError}
            </div>
          )}
          <form onSubmit={handlePasswordChange}>
            <div className="profile-field">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="edit-input"
                required
                disabled={changingPassword}
              />
            </div>
            <div className="profile-field">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="edit-input"
                required
                minLength={6}
                disabled={changingPassword}
              />
              <small style={{ display: 'block', marginTop: '0.25rem', color: '#666' }}>
                Must be at least 6 characters. Avoid passwords found in data breaches.
              </small>
            </div>
            <div className="profile-field">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="edit-input"
                required
                minLength={6}
                disabled={changingPassword}
              />
            </div>
            <button 
              type="submit" 
              className="save-button"
              disabled={changingPassword}
            >
              {changingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
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


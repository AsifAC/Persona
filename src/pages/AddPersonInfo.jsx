import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { submissionService } from '../services/submissionService'
import './AddPersonInfo.css'

const emptyAddress = () => ({ street: '', city: '', state: '', zipCode: '', country: 'USA', isCurrent: false })
const emptyPhone = () => ({ number: '', type: 'mobile', isCurrent: true })
const emptySocial = () => ({ platform: '', username: '', url: '' })
const emptyRecord = () => ({ caseNumber: '', charge: '', status: '', recordDate: '', jurisdiction: '' })
const emptyRelative = () => ({ firstName: '', lastName: '', relationship: '', age: '' })
const relationshipOptions = [
  'Parent',
  'Child',
  'Sibling',
  'Spouse',
  'Partner',
  'Grandparent',
  'Grandchild',
  'Aunt',
  'Uncle',
  'Cousin',
  'Niece',
  'Nephew',
  'Stepparent',
  'Stepchild',
  'Stepsibling',
  'In-law',
  'Guardian',
  'Other',
]

export default function AddPersonInfo() {
  const navigate = useNavigate()
  const { isGuest } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    pastNames: [''],
    addresses: [emptyAddress()],
    phoneNumbers: [emptyPhone()],
    socialMedia: [emptySocial()],
    criminalRecords: [emptyRecord()],
    relatives: [emptyRelative()],
    proofFiles: [],
  })

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const updateListItem = (key, index, patch) => {
    setForm((prev) => {
      const updated = [...prev[key]]
      updated[index] = { ...updated[index], ...patch }
      return { ...prev, [key]: updated }
    })
  }

  const updatePastName = (index, value) => {
    setForm((prev) => {
      const updated = [...prev.pastNames]
      updated[index] = value
      return { ...prev, pastNames: updated }
    })
  }

  const addListItem = (key, factory) => {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], factory()] }))
  }

  const removeListItem = (key, index) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, idx) => idx !== index),
    }))
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    updateField('proofFiles', files)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (isGuest) {
      setError('Guest mode cannot submit verified information. Please sign in.')
      return
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.')
      return
    }

    if (!form.proofFiles.length) {
      setError('Please upload at least one proof document.')
      return
    }

    setLoading(true)
    try {
      await submissionService.createSubmission({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        age: form.age ? Number(form.age) : null,
        pastNames: form.pastNames.filter((name) => name.trim().length > 0),
        addresses: form.addresses.filter((addr) => addr.street || addr.city || addr.state || addr.zipCode),
        phoneNumbers: form.phoneNumbers.filter((phone) => phone.number.trim().length > 0),
        socialMedia: form.socialMedia.filter((social) => social.platform || social.username || social.url),
        criminalRecords: form.criminalRecords.filter((record) => record.charge || record.caseNumber),
        relatives: form.relatives.filter((relative) => relative.firstName || relative.lastName || relative.relationship),
        proofFiles: form.proofFiles,
      })
      setSuccess('Submission received. It will be reviewed for verification.')
      setForm({
        firstName: '',
        lastName: '',
        age: '',
        pastNames: [''],
        addresses: [emptyAddress()],
        phoneNumbers: [emptyPhone()],
        socialMedia: [emptySocial()],
        criminalRecords: [emptyRecord()],
        relatives: [emptyRelative()],
        proofFiles: [],
      })
    } catch (err) {
      setError(err.message || 'Failed to submit information.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-info-container">
      <div className="add-info-header">
        <h1>Add Person Info</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
      </div>

      <div className="add-info-card">
        <p className="add-info-note">
          Submissions require document proof and will be reviewed before becoming verified.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                min="0"
                value={form.age}
                onChange={(e) => updateField('age', e.target.value)}
              />
            </div>
          </div>

          <section className="form-section">
            <h2>Past Names</h2>
            {form.pastNames.map((name, index) => (
              <div key={`past-name-${index}`} className="inline-row">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updatePastName(index, e.target.value)}
                  placeholder="Past name"
                />
                {form.pastNames.length > 1 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeListItem('pastNames', index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-button" onClick={() => addListItem('pastNames', () => '')}>
              Add Past Name
            </button>
          </section>

          <section className="form-section">
            <h2>Addresses</h2>
            {form.addresses.map((addr, index) => (
              <div key={`address-${index}`} className="section-card">
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Street"
                    value={addr.street}
                    onChange={(e) => updateListItem('addresses', index, { street: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={addr.city}
                    onChange={(e) => updateListItem('addresses', index, { city: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={addr.state}
                    onChange={(e) => updateListItem('addresses', index, { state: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Zip"
                    value={addr.zipCode}
                    onChange={(e) => updateListItem('addresses', index, { zipCode: e.target.value })}
                  />
                </div>
                <div className="inline-row">
                  <input
                    type="text"
                    placeholder="Country"
                    value={addr.country}
                    onChange={(e) => updateListItem('addresses', index, { country: e.target.value })}
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={addr.isCurrent}
                      onChange={(e) => updateListItem('addresses', index, { isCurrent: e.target.checked })}
                    />
                    Current
                  </label>
                  {form.addresses.length > 1 && (
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeListItem('addresses', index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="add-button" onClick={() => addListItem('addresses', emptyAddress)}>
              Add Address
            </button>
          </section>

          <section className="form-section">
            <h2>Phone Numbers</h2>
            {form.phoneNumbers.map((phone, index) => (
              <div key={`phone-${index}`} className="inline-row">
                <input
                  type="text"
                  placeholder="Phone number"
                  value={phone.number}
                  onChange={(e) => updateListItem('phoneNumbers', index, { number: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Type"
                  value={phone.type}
                  onChange={(e) => updateListItem('phoneNumbers', index, { type: e.target.value })}
                />
                {form.phoneNumbers.length > 1 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeListItem('phoneNumbers', index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-button" onClick={() => addListItem('phoneNumbers', emptyPhone)}>
              Add Phone
            </button>
          </section>

          <section className="form-section">
            <h2>Social Media</h2>
            {form.socialMedia.map((social, index) => (
              <div key={`social-${index}`} className="inline-row">
                <input
                  type="text"
                  placeholder="Platform"
                  value={social.platform}
                  onChange={(e) => updateListItem('socialMedia', index, { platform: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={social.username}
                  onChange={(e) => updateListItem('socialMedia', index, { username: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="URL"
                  value={social.url}
                  onChange={(e) => updateListItem('socialMedia', index, { url: e.target.value })}
                />
                {form.socialMedia.length > 1 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeListItem('socialMedia', index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-button" onClick={() => addListItem('socialMedia', emptySocial)}>
              Add Social
            </button>
          </section>

          <section className="form-section">
            <h2>Criminal Records</h2>
            {form.criminalRecords.map((record, index) => (
              <div key={`record-${index}`} className="section-card">
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Case number"
                    value={record.caseNumber}
                    onChange={(e) => updateListItem('criminalRecords', index, { caseNumber: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Charge"
                    value={record.charge}
                    onChange={(e) => updateListItem('criminalRecords', index, { charge: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Status"
                    value={record.status}
                    onChange={(e) => updateListItem('criminalRecords', index, { status: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <input
                    type="date"
                    value={record.recordDate}
                    onChange={(e) => updateListItem('criminalRecords', index, { recordDate: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Jurisdiction"
                    value={record.jurisdiction}
                    onChange={(e) => updateListItem('criminalRecords', index, { jurisdiction: e.target.value })}
                  />
                </div>
                {form.criminalRecords.length > 1 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeListItem('criminalRecords', index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-button" onClick={() => addListItem('criminalRecords', emptyRecord)}>
              Add Record
            </button>
          </section>

          <section className="form-section">
            <h2>Relatives</h2>
            {form.relatives.map((relative, index) => (
              <div key={`relative-${index}`} className="inline-row">
                <input
                  type="text"
                  placeholder="First name"
                  value={relative.firstName}
                  onChange={(e) => updateListItem('relatives', index, { firstName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={relative.lastName}
                  onChange={(e) => updateListItem('relatives', index, { lastName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Relationship"
                  value={relative.relationship}
                  onChange={(e) => updateListItem('relatives', index, { relationship: e.target.value })}
                  list="relative-relationship-options"
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={relative.age}
                  onChange={(e) => updateListItem('relatives', index, { age: e.target.value })}
                />
                {form.relatives.length > 1 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeListItem('relatives', index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-button" onClick={() => addListItem('relatives', emptyRelative)}>
              Add Relative
            </button>
            <datalist id="relative-relationship-options">
              {relationshipOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </section>

          <section className="form-section">
            <h2>Proof Documents</h2>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleFileChange} />
            <p className="helper-text">Upload documents that support the information above.</p>
          </section>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </form>
      </div>
    </div>
  )
}

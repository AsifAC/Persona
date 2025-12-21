// Search Form Component
import { useState } from 'react'
import './SearchForm.css'

export default function SearchForm({ onSearch, loading = false }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    location: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName) {
      alert('First name and last name are required')
      return
    }
    onSearch({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      age: formData.age ? parseInt(formData.age) : null,
      location: formData.location.trim() || null,
    })
  }

  return (
    <div className="search-form-container">
      <h2>Search for a Person</h2>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">
              First Name <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="John"
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">
              Last Name <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Doe"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="age">Age (Optional)</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              disabled={loading}
              min="1"
              max="120"
              placeholder="35"
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location (Optional)</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              disabled={loading}
              placeholder="New York, NY"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="search-button">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  )
}


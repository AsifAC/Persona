// Data Section Component - Reusable component for displaying lists of data
import './DataSection.css'

export default function DataSection({ title, data, emptyMessage = 'No data available' }) {
  if (!data || data.length === 0) {
    return (
      <div className="data-section">
        <h3>{title}</h3>
        <p className="empty-message">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="data-section">
      <h3>{title}</h3>
      <div className="data-list">
        {data.map((item, index) => (
          <div key={item.id || index} className="data-item">
            {Object.entries(item).map(([key, value]) => {
              // Skip id and person_profile_id fields
              if (key === 'id' || key === 'person_profile_id') return null
              // Skip null or empty values
              if (value === null || value === '') return null
              return (
                <div key={key} className="data-field">
                  <span className="field-label">{key.replace(/_/g, ' ')}:</span>
                  <span className="field-value">{String(value)}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}


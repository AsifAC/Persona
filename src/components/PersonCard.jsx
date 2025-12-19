// Person Card Component - Displays person information
import './PersonCard.css'

export default function PersonCard({ person, confidenceScore }) {
  if (!person) return null

  return (
    <div className="person-card">
      <div className="person-header">
        <h2>
          {person.first_name} {person.last_name}
        </h2>
        {person.age && <span className="age">Age: {person.age}</span>}
        {confidenceScore !== undefined && (
          <div className="confidence-score">
            <span className="score-label">Confidence:</span>
            <span className="score-value">{confidenceScore}%</span>
          </div>
        )}
      </div>
      {person.metadata && Object.keys(person.metadata).length > 0 && (
        <div className="person-metadata">
          <h3>Additional Information</h3>
          <pre>{JSON.stringify(person.metadata, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}


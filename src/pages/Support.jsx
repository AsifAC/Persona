import { useNavigate } from 'react-router-dom'
import './Support.css'

export default function Support() {
  const navigate = useNavigate()

  return (
    <div className="support-container">
      <header className="support-header">
        <h1>Support</h1>
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <section className="support-card">
        <h2>How can we help?</h2>
        <p>
          If you are running into issues or have suggestions, we are happy to help. Please share clear
          steps to reproduce, relevant screenshots, and any error messages so we can respond quickly.
        </p>
        <p className="support-email">
          Contact support: <a href="mailto:ca.asif19@gmail.com">ca.asif19@gmail.com</a>
        </p>

        <div className="support-actions">
          <a
            className="support-link"
            href="https://github.com/AsifAC/Persona"
            target="_blank"
            rel="noreferrer"
          >
            Propose a fix or improvement on GitHub
          </a>
        </div>

        <div className="support-note">
          We welcome thoughtful contributions and professional, well-documented pull requests.
        </div>
      </section>
    </div>
  )
}

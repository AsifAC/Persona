import { Link } from 'react-router-dom'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="brand">Persona</div>
        <div className="nav-actions">
          <Link to="/login" className="nav-button ghost">Login</Link>
          <Link to="/register" className="nav-button solid">Sign Up</Link>
        </div>
      </header>

      <main className="landing-hero">
        <div className="hero-text">
          <p className="eyebrow">Welcome to Persona</p>
          <h1>Precision people search for serious decisions.</h1>
          <p className="hero-description">
            Persona unifies public records, contact intelligence, and relational insights into one fast,
            trustworthy profile. Search once, verify faster, and act with confidence.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-button primary">Create your account</Link>
            <Link to="/login" className="hero-button secondary">Sign in</Link>
          </div>
          <div className="powered-by">
            <span>Powered by</span>
            <div className="powered-tags">
              <span>EnformionGO</span>
              <span>Supabase</span>
            </div>
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <h3>Instant signal, fewer false positives</h3>
            <p>
              Our blend of multi-source enrichment and verification workflows keeps profiles accurate,
              current, and easy to trust.
            </p>
            <div className="panel-stats">
              <div>
                <span className="stat-number">6+</span>
                <span className="stat-label">Data lanes</span>
              </div>
              <div>
                <span className="stat-number">98%</span>
                <span className="stat-label">Match confidence</span>
              </div>
              <div>
                <span className="stat-number">24/7</span>
                <span className="stat-label">Live updates</span>
              </div>
            </div>
          </div>
          <div className="panel-card subtle">
            <h4>Secure by design</h4>
            <p>Row-level security, audit trails, and controlled verification keep sensitive actions protected.</p>
          </div>
        </div>
      </main>

      <section className="landing-reviews">
        <h2>Customer reviews</h2>
        <div className="review-grid">
          <article className="review-card">
            <p>
              "Persona cut our verification time in half. The profile confidence scores are a game changer."
            </p>
            <div className="reviewer">Morgan K. · Compliance Director</div>
          </article>
          <article className="review-card">
            <p>
              "The EnformionGO data stream is clean and the UI makes it instantly usable for our team."
            </p>
            <div className="reviewer">Avery T. · Ops Lead</div>
          </article>
          <article className="review-card">
            <p>
              "Fast, focused, and reliable. Persona feels like a modern investigative cockpit."
            </p>
            <div className="reviewer">Jordan M. · Risk Analyst</div>
          </article>
        </div>
      </section>
    </div>
  )
}

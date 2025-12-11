import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-title">
          <h1>ERT</h1>
          <span className="landing-subtitle">Exam Readiness Tracker</span>
        </div>
        <nav className="landing-nav">
          <button
            onClick={() => navigate('/auth')}
            className="btn-secondary"
          >
            Sign In
          </button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <h2>Master Professional Certifications with Adaptive Learning</h2>
            <p>
              Track your progress, focus on weak areas, and achieve certification success 
              with our intelligent quiz system.
            </p>
            
            <div className="cta-buttons">
              <button
                onClick={() => navigate('/demo')}
                className="btn-primary btn-large"
              >
                Try Demo (5 Questions)
              </button>
              <button
                onClick={() => navigate('/story')}
                className="btn-secondary btn-large"
              >
                How It Was Built
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="btn-secondary btn-large"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </section>

        <section className="features-preview">
          <h3>Why Choose ERT?</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>🎯 Adaptive Learning</h4>
              <p>Skip questions you've mastered, focus on areas that need work</p>
            </div>
            <div className="feature-card">
              <h4>📊 Progress Tracking</h4>
              <p>Detailed analytics across all AWS certification domains</p>
            </div>
            <div className="feature-card">
              <h4>🔄 Real-time Feedback</h4>
              <p>Immediate explanations help you learn from every question</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>Built with modern cloud technologies • React • TypeScript</p>
      </footer>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  initializeDemoSession, 
  getDemoSession, 
  clearDemoSession,
  DemoSession 
} from '../utils/demoMode';

export default function DemoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingSession, setExistingSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    // Check if there's an existing demo session
    const session = getDemoSession();
    setExistingSession(session);
  }, []);

  const startNewDemo = async () => {
    setLoading(true);
    try {
      // Clear any existing session
      clearDemoSession();
      
      // Initialize new demo session
      await initializeDemoSession();
      
      // Navigate to demo app dashboard
      navigate('/demo/app/dashboard');
    } catch (error) {
      console.error('Error starting demo:', error);
      alert('Sorry, there was an error starting the demo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const continueDemo = () => {
    navigate('/demo/app/dashboard');
  };

  const restartDemo = async () => {
    clearDemoSession();
    await startNewDemo();
  };

  return (
    <div className="demo-page">
      <header className="demo-header">
        <div className="demo-title">
          <h1>ERT Demo</h1>
          <span className="demo-badge">Demo Mode</span>
        </div>
        <nav className="demo-nav">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="btn-primary"
          >
            Sign Up
          </button>
        </nav>
      </header>

      <main className="demo-main">
        <div className="demo-content">
          <h2>Professional Certification Quiz Demo</h2>
          <p>
            Experience our adaptive learning system with 5 sample professional certification questions.
            No signup required!
          </p>
          
          <div className="demo-info">
            <div className="demo-feature">
              <strong>What you'll experience:</strong>
              <ul>
                <li>Real professional certification-style questions</li>
                <li>Immediate feedback with explanations</li>
                <li>Score tracking and results summary</li>
                <li>Mobile-responsive interface</li>
              </ul>
            </div>
          </div>

          {existingSession && !existingSession.completed ? (
            <div className="demo-session-actions">
              <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
                You have an existing demo session in progress 
                (Question {existingSession.currentIndex + 1} of {existingSession.questions.length})
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={continueDemo}
                  className="btn-primary btn-large"
                >
                  Continue Demo
                </button>
                <button 
                  onClick={restartDemo}
                  className="btn-secondary btn-large"
                  disabled={loading}
                >
                  Start Over
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={startNewDemo}
              className="btn-primary btn-large demo-start-btn"
              disabled={loading}
            >
              {loading ? 'Starting Demo...' : 'Start Demo Quiz'}
            </button>
          )}

          <div className="demo-disclaimer">
            <p>
              <em>Demo includes 5 questions. Full version has hundreds of questions 
              with progress tracking across all professional certification domains.</em>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
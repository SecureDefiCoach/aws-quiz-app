import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '../contexts/DemoModeContext';

export default function DemoQuizBuilder() {
  const navigate = useNavigate();
  const { startNewSession, state } = useDemoMode();
  
  // Demo form state - mimics the real quiz builder
  const [examNumber, setExamNumber] = useState('DEMO');
  const [selectedSubdomains, setSelectedSubdomains] = useState<string[]>(['ALL']);
  const [selectedStates, setSelectedStates] = useState<string[]>(['New']);
  const [maxQuestions, setMaxQuestions] = useState('5');
  const [loading, setLoading] = useState(false);

  // Demo data - simulates what would come from the API
  const demoExams = [
    { number: 'DEMO', name: 'Professional Certification Demo', display: 'Professional Certification Demo' }
  ];

  const demoSubdomains = [
    { num: 1, name: 'Database Services' },
    { num: 2, name: 'Compute Services' },
    { num: 3, name: 'Application Integration' },
    { num: 4, name: 'Security & Identity' }
  ];

  const handleSubdomainChange = (subdomain: string) => {
    if (subdomain === 'ALL') {
      setSelectedSubdomains(['ALL']);
    } else {
      const newSelection = selectedSubdomains.includes('ALL') 
        ? [subdomain]
        : selectedSubdomains.includes(subdomain)
          ? selectedSubdomains.filter(s => s !== subdomain)
          : [...selectedSubdomains.filter(s => s !== 'ALL'), subdomain];
      
      setSelectedSubdomains(newSelection.length === 0 ? ['ALL'] : newSelection);
    }
  };

  const handleStateChange = (state: string) => {
    const newSelection = selectedStates.includes(state)
      ? selectedStates.filter(s => s !== state)
      : [...selectedStates, state];
    
    setSelectedStates(newSelection.length === 0 ? ['New'] : newSelection);
  };

  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      // Initialize or restart the demo session
      await startNewSession();
      
      // Navigate to the quiz
      navigate('/demo/app/quiz/take');
    } catch (error) {
      console.error('Error starting demo quiz:', error);
      alert('Sorry, there was an error starting the quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionCount = () => {
    // In demo mode, always show 5 questions available
    return 5;
  };

  return (
    <div className="quiz-builder">
      {/* Demo Info Banner */}
      <div className="demo-info-banner">
        <h2>🎯 Demo Quiz Builder</h2>
        <p>
          This is the same interface used in the full app! In demo mode, you'll get 5 carefully 
          selected professional certification questions. The full version has hundreds of questions with real progress tracking.
        </p>
      </div>

      <div className="card">
        <h2>Build Your Demo Quiz</h2>
        
        <div className="form-group">
          <label htmlFor="exam-select">Select Exam:</label>
          <select
            id="exam-select"
            value={examNumber}
            onChange={(e) => setExamNumber(e.target.value)}
            disabled
          >
            {demoExams.map((exam) => (
              <option key={exam.number} value={exam.number}>
                {exam.display}
              </option>
            ))}
          </select>
          <div className="demo-note">
            <small>💡 Full version supports multiple professional certifications (AWS, ISACA, Google, etc.)</small>
          </div>
        </div>

        <div className="form-group">
          <label>Select Subdomains:</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedSubdomains.includes('ALL')}
                onChange={() => handleSubdomainChange('ALL')}
              />
              All Domains
            </label>
            {demoSubdomains.map((subdomain) => (
              <label key={subdomain.num} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedSubdomains.includes(subdomain.num.toString())}
                  onChange={() => handleSubdomainChange(subdomain.num.toString())}
                />
                {subdomain.num}. {subdomain.name}
              </label>
            ))}
          </div>
          <div className="demo-note">
            <small>💡 Full version has detailed subdomain breakdown for each certification</small>
          </div>
        </div>

        <div className="form-group">
          <label>Question States:</label>
          <div className="checkbox-group">
            {['New', 'Wrong', 'Right'].map((state) => (
              <label key={state} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedStates.includes(state)}
                  onChange={() => handleStateChange(state)}
                />
                {state}
              </label>
            ))}
          </div>
          <div className="demo-note">
            <small>💡 Full version tracks your progress and lets you focus on areas that need work</small>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="max-questions">Maximum Questions:</label>
          <select
            id="max-questions"
            value={maxQuestions}
            onChange={(e) => setMaxQuestions(e.target.value)}
            disabled
          >
            <option value="5">5 (Demo Limit)</option>
          </select>
          <div className="question-count">
            Available questions: {getQuestionCount()}
          </div>
          <div className="demo-note">
            <small>💡 Full version lets you choose from 10, 25, 50, or all available questions</small>
          </div>
        </div>

        <button
          onClick={handleStartQuiz}
          disabled={loading || getQuestionCount() === 0}
          className="btn-primary"
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: '600' }}
        >
          {loading ? 'Starting Demo Quiz...' : 'Start Demo Quiz (5 Questions)'}
        </button>

        {getQuestionCount() === 0 && (
          <div className="error">
            No questions available with the selected criteria.
          </div>
        )}
      </div>

      {/* Demo Features Highlight */}
      <div className="demo-features-card">
        <h3>What you'll experience in this demo:</h3>
        <ul>
          <li>✅ Real professional certification-style questions</li>
          <li>✅ Immediate feedback with detailed explanations</li>
          <li>✅ Progress tracking and scoring</li>
          <li>✅ Mobile-responsive quiz interface</li>
          <li>✅ Question marking and review system</li>
        </ul>
        <p>
          <strong>Ready for more?</strong> The full version includes hundreds of questions, 
          adaptive learning, and detailed analytics across multiple professional certifications.
        </p>
        <button 
          onClick={() => navigate('/auth')}
          className="btn-secondary"
          style={{ marginTop: '1rem' }}
        >
          Sign Up for Full Access
        </button>
      </div>
    </div>
  );
}
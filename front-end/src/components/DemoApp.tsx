import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import DemoDashboard from './DemoDashboard';
import DemoQuizBuilder from './DemoQuizBuilder';
import DemoQuizCard from './DemoQuizCard';
import { useDemoMode } from '../contexts/DemoModeContext';

type DemoView = 'dashboard' | 'quiz' | 'taking-quiz';

export default function DemoApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useDemoMode();

  const getCurrentView = (): DemoView => {
    const path = location.pathname;
    if (path.includes('/quiz/take')) return 'taking-quiz';
    if (path.includes('/quiz')) return 'quiz';
    return 'dashboard';
  };

  const currentView = getCurrentView();

  const handleExitDemo = () => {
    navigate('/');
  };

  const handleSignUp = () => {
    navigate('/auth');
  };

  return (
    <div className="app demo-app">
      <header className="app-header demo-app-header">
        <div className="app-title">
          <h1>ERT</h1>
          <span className="app-subtitle">Exam Readiness Tracker</span>
          <span className="demo-badge-header">DEMO MODE</span>
        </div>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/demo/app/dashboard')}
            className={currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1rem' }}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/demo/app/quiz')}
            className={currentView === 'quiz' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1rem' }}
          >
            Start Quiz
          </button>
        </nav>
        <div className="user-info">
          <span>Demo User</span>
          <button onClick={handleSignUp} className="btn-primary">Sign Up</button>
          <button onClick={handleExitDemo} className="btn-secondary">Exit Demo</button>
        </div>
      </header>
      
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/demo/app/dashboard" replace />} />
          <Route path="/dashboard" element={<DemoDashboard />} />
          <Route path="/quiz" element={<DemoQuizBuilder />} />
          <Route path="/quiz/take" element={<DemoQuizCard />} />
        </Routes>
      </main>
      
      {/* Demo Mode Indicator */}
      <div className="demo-mode-indicator">
        <div className="demo-indicator-content">
          <span className="demo-indicator-text">
            🎯 Demo Mode - Limited to 5 questions
          </span>
          <button 
            onClick={handleSignUp}
            className="demo-upgrade-btn"
          >
            Unlock Full Version
          </button>
        </div>
      </div>
    </div>
  );
}
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import QuizBuilder from './QuizBuilder';
import AdminPanel from './AdminPanel';

const ADMIN_EMAIL = 'tristanmarvin@outlook.com';

interface AuthenticatedAppProps {
  signOut: () => void;
  user: any;
}

export default function AuthenticatedApp({ signOut, user }: AuthenticatedAppProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = user?.signInDetails?.loginId || user?.username || '';
  const isAdmin = userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Redirect to dashboard if on auth page after authentication
  useEffect(() => {
    if (location.pathname === '/auth') {
      navigate('/dashboard');
    }
  }, [location.pathname, navigate]);

  const getCurrentView = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/quiz') return 'quiz';
    if (path === '/admin') return 'admin';
    return 'dashboard';
  };

  const currentView = getCurrentView();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>ERT</h1>
          <span className="app-subtitle">Exam Readiness Tracker</span>
        </div>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className={currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1rem' }}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/quiz')}
            className={currentView === 'quiz' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1rem' }}
          >
            Start Quiz
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className={currentView === 'admin' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 1rem' }}
            >
              Admin
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Home
          </button>
        </nav>
        <div className="user-info">
          <span>Welcome, {userEmail.split('@')[0] || 'User'}</span>
          <button onClick={signOut} className="btn-secondary">Sign Out</button>
        </div>
      </header>
      <main className="app-main">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'quiz' && <QuizBuilder />}
        {currentView === 'admin' && isAdmin && <AdminPanel />}
      </main>
    </div>
  );
}
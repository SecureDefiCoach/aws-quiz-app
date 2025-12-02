import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import Dashboard from './components/Dashboard';
import QuizBuilder from './components/QuizBuilder';
import AdminPanel from './components/AdminPanel';

type View = 'dashboard' | 'quiz' | 'admin';

const ADMIN_EMAIL = 'tristanmarvin@outlook.com';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <Authenticator>
      {({ signOut, user }) => {
        const userEmail = user?.signInDetails?.loginId || user?.username || '';
        const isAdmin = userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        
        return (
        <div className="app">
          <header className="app-header">
            <div className="app-title">
              <h1>ERT</h1>
              <span className="app-subtitle">Exam Readiness Tracker</span>
            </div>
            <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.5rem 1rem' }}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('quiz')}
                className={currentView === 'quiz' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.5rem 1rem' }}
              >
                Start Quiz
              </button>
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={currentView === 'admin' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Admin
                </button>
              )}
            </nav>
            <div className="user-info">
              <a 
                href="https://github.com/SecureDefiCoach/aws-quiz-app/blob/main/docs/USER_GUIDE.md" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ marginRight: '1rem', color: '#3b82f6', textDecoration: 'none' }}
              >
                Help
              </a>
              <span>Welcome, {user?.username || user?.signInDetails?.loginId || 'User'}</span>
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
      }}
    </Authenticator>
  );
}

export default App;

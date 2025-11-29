import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import Dashboard from './components/Dashboard';
import QuizBuilder from './components/QuizBuilder';

type View = 'dashboard' | 'quiz';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <Authenticator>
      {({ signOut, user }) => (
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
                Quiz
              </button>
            </nav>
            <div className="user-info">
              <span>Welcome, {user?.signInDetails?.loginId}</span>
              <button onClick={signOut} className="btn-secondary">Sign Out</button>
            </div>
          </header>
          <main className="app-main">
            {currentView === 'dashboard' ? (
              <Dashboard onStartQuiz={() => setCurrentView('quiz')} />
            ) : (
              <QuizBuilder />
            )}
          </main>
        </div>
      )}
    </Authenticator>
  );
}

export default App;

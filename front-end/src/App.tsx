import { Authenticator } from '@aws-amplify/ui-react';
import QuizBuilder from './components/QuizBuilder';

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="app">
          <header className="app-header">
            <div className="app-title">
              <h1>ERT</h1>
              <span className="app-subtitle">Exam Readiness Tracker</span>
            </div>
            <div className="user-info">
              <span>Welcome, {user?.signInDetails?.loginId}</span>
              <button onClick={signOut} className="btn-secondary">Sign Out</button>
            </div>
          </header>
          <main className="app-main">
            <QuizBuilder />
          </main>
        </div>
      )}
    </Authenticator>
  );
}

export default App;

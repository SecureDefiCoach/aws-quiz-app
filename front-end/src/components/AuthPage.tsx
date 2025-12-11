import { Authenticator } from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import AuthenticatedApp from './AuthenticatedApp';

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <Authenticator>
        {({ signOut, user }) => {
          // Redirect to dashboard once authenticated
          return <AuthenticatedApp signOut={signOut} user={user} />;
        }}
      </Authenticator>
      
      <div className="auth-footer">
        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
          style={{ marginTop: '1rem' }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
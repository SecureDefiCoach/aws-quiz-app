import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DemoPage from './components/DemoPage';
import DemoApp from './components/DemoApp';
import StoryPage from './components/StoryPage';
import AuthPage from './components/AuthPage';
import { DemoModeProvider } from './contexts/DemoModeContext';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/demo/app/*" element={
          <DemoModeProvider>
            <DemoApp />
          </DemoModeProvider>
        } />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<AuthPage />} />
        <Route path="/quiz" element={<AuthPage />} />
        <Route path="/admin" element={<AuthPage />} />
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

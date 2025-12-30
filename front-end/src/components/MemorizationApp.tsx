import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import MemorizationDashboard from './MemorizationDashboard';
import StudyCollectionList from './StudyCollectionList';
import StudySession from './StudySession';
import CollectionDetail from './CollectionDetail';

interface MemorizationAppProps {
  // Props can be extended as needed
}

export default function MemorizationApp({}: MemorizationAppProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getCurrentMemorizationView = () => {
    const path = location.pathname;
    if (path === '/memorization' || path === '/memorization/') return 'dashboard';
    if (path === '/memorization/collections') return 'collections';
    if (path.startsWith('/memorization/collection/')) return 'collection';
    if (path.startsWith('/memorization/study/')) return 'study';
    return 'dashboard';
  };

  const currentView = getCurrentMemorizationView();

  return (
    <div className="memorization-app">
      {/* Offline Status Indicator */}
      {isOffline && (
        <div className="offline-banner" style={{
          backgroundColor: '#f39c12',
          color: 'white',
          padding: '0.5rem',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          📱 Offline Mode - Your progress will sync when connection is restored
        </div>
      )}

      {/* Memorization Navigation */}
      <div className="memorization-nav" style={{
        borderBottom: '1px solid #ddd',
        padding: '1rem',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>Memorization</h2>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => navigate('/memorization')}
              className={currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/memorization/collections')}
              className={currentView === 'collections' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
            >
              Collections
            </button>
          </nav>
          
          {/* Online/Offline Status */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isOffline ? '#e74c3c' : '#27ae60'
            }}></span>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              {isOffline ? 'Offline' : 'Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="memorization-content" style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<MemorizationDashboard isOffline={isOffline} />} />
          <Route path="/collections" element={<StudyCollectionList isOffline={isOffline} />} />
          <Route path="/collection/:collectionId" element={<CollectionDetail isOffline={isOffline} />} />
          <Route path="/study/:contentId" element={<StudySession isOffline={isOffline} />} />
        </Routes>
      </div>
    </div>
  );
}
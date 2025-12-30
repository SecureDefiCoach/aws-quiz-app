import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LevelNavigator from './LevelNavigator';

interface DeletedWord {
  position: number;
  originalWord: string;
  isKeyTerm: boolean;
}

interface DeletionLevel {
  level: number;
  text: string;
  deletedWords: DeletedWord[];
  deletionCount: number;
  deletionPercentage: number;
}

interface ContentItem {
  _id: string;
  collectionId: {
    _id: string;
    name: string;
    category: string;
  };
  title: string;
  originalText: string;
  deletionLevels: DeletionLevel[];
  wordCount: number;
  metadata: {
    source?: string;
    questionNumber?: string;
    examNumber?: string;
    tags?: string[];
  };
}

interface StudySessionProps {
  isOffline: boolean;
}

interface RevealedWords {
  [position: number]: boolean;
}

export default function StudySession({ isOffline }: StudySessionProps) {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  
  const [content, setContent] = useState<ContentItem | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedWords, setRevealedWords] = useState<RevealedWords>({});
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [studyTime, setStudyTime] = useState<number>(0);

  // Fetch content data
  useEffect(() => {
    const fetchContent = async () => {
      if (!contentId) {
        setError('Content ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/memorization/content/${contentId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch content');
        }

        if (!result.data.deletionLevels || result.data.deletionLevels.length === 0) {
          throw new Error('Content does not have deletion levels generated');
        }

        setContent(result.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [contentId]);

  // Track study time
  useEffect(() => {
    const interval = setInterval(() => {
      setStudyTime(Date.now() - sessionStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Reset revealed words when level changes
  useEffect(() => {
    setRevealedWords({});
  }, [currentLevel]);

  // Handle level change from LevelNavigator
  const handleLevelChange = useCallback((newLevel: number) => {
    if (newLevel >= 1 && newLevel <= 15) {
      setCurrentLevel(newLevel);
    }
  }, []);

  // Handle word reveal
  const handleWordReveal = useCallback((position: number) => {
    setRevealedWords(prev => ({
      ...prev,
      [position]: true
    }));
  }, []);

  // Format study time
  const formatStudyTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render text with blanks and click-to-reveal functionality
  const renderTextWithBlanks = (deletionLevel: DeletionLevel): React.ReactElement => {
    const { text, deletedWords } = deletionLevel;
    const words = text.split(/(\s+)/); // Split on whitespace but keep the whitespace
    let wordIndex = 0;
    
    return (
      <div className="study-text">
        {words.map((word, index) => {
          // Skip whitespace
          if (/^\s+$/.test(word)) {
            return <span key={index}>{word}</span>;
          }

          const currentWordIndex = wordIndex++;
          const deletedWord = deletedWords.find(dw => dw.position === currentWordIndex);
          
          if (deletedWord) {
            const isRevealed = revealedWords[currentWordIndex];
            return (
              <span key={index}>
                {isRevealed ? (
                  <span className="revealed-word" style={{
                    backgroundColor: '#fff3cd',
                    padding: '0.1rem 0.2rem',
                    borderRadius: '3px',
                    border: '1px solid #ffeaa7',
                    cursor: 'default'
                  }}>
                    {deletedWord.originalWord}
                  </span>
                ) : (
                  <span
                    className="blank-word"
                    onClick={() => handleWordReveal(currentWordIndex)}
                    style={{
                      backgroundColor: '#e9ecef',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '3px',
                      border: '1px solid #ced4da',
                      cursor: 'pointer',
                      display: 'inline-block',
                      minWidth: '3rem',
                      textAlign: 'center',
                      margin: '0 0.1rem'
                    }}
                    title="Click to reveal word"
                  >
                    _____
                  </span>
                )}
              </span>
            );
          }

          return <span key={index}>{word}</span>;
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="study-session loading">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="study-session error">
        <div className="card">
          <div className="error">
            <h3>Error Loading Content</h3>
            <p>{error}</p>
            <button 
              onClick={() => navigate('/memorization/collections')}
              className="btn-primary"
            >
              Back to Collections
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="study-session">
        <div className="card">
          <p>Content not found</p>
        </div>
      </div>
    );
  }

  const currentDeletionLevel = content.deletionLevels.find(level => level.level === currentLevel);
  
  if (!currentDeletionLevel) {
    return (
      <div className="study-session">
        <div className="card">
          <p>Deletion level {currentLevel} not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="study-session">
      {/* Session Header */}
      <div className="session-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#2c3e50' }}>
            {content.title}
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
            {content.collectionId.name} • Level {currentLevel} of 15
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Study Time</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
              {formatStudyTime(studyTime)}
            </div>
          </div>
          
          {isOffline && (
            <div style={{
              backgroundColor: '#f39c12',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              OFFLINE
            </div>
          )}
        </div>
      </div>

      {/* Content Card */}
      <div className="card">
        {/* Level Navigation */}
        <LevelNavigator
          currentLevel={currentLevel}
          totalLevels={15}
          onLevelChange={handleLevelChange}
          disabled={loading}
        />

        {/* Level Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #eee'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
              {currentDeletionLevel.deletionCount} words hidden ({currentDeletionLevel.deletionPercentage.toFixed(1)}%)
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              Revealed: {Object.keys(revealedWords).length} / {currentDeletionLevel.deletionCount}
            </span>
          </div>
        </div>

        {/* Study Text */}
        <div style={{
          fontSize: '1.1rem',
          lineHeight: '1.8',
          color: '#333',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#fafafa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          {renderTextWithBlanks(currentDeletionLevel)}
        </div>

        {/* Instructions */}
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #bbdefb',
          marginBottom: '1.5rem'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1565c0' }}>
            💡 <strong>Instructions:</strong> Click on any blank (____) to reveal the hidden word. 
            Try to recall the word before revealing it to improve memorization.
          </p>
        </div>

        {/* Metadata */}
        {content.metadata && Object.keys(content.metadata).length > 0 && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginTop: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
              Content Information
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              {content.metadata.source && (
                <div>Source: {content.metadata.source}</div>
              )}
              {content.metadata.examNumber && (
                <div>Exam: {content.metadata.examNumber}</div>
              )}
              {content.metadata.questionNumber && (
                <div>Question: {content.metadata.questionNumber}</div>
              )}
              {content.metadata.tags && content.metadata.tags.length > 0 && (
                <div>Tags: {content.metadata.tags.join(', ')}</div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #eee'
        }}>
          <button
            onClick={() => navigate('/memorization/collections')}
            className="btn-secondary"
          >
            Back to Collections
          </button>
        </div>
      </div>
    </div>
  );
}
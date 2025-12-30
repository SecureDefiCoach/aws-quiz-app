import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Collection {
  _id: string;
  name: string;
  description: string;
  category: 'quiz-explanations' | 'interview-responses' | 'custom';
  totalItems: number;
  masteredItems: number;
  isOfflineAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StudyCollectionListProps {
  isOffline: boolean;
}

export default function StudyCollectionList({ isOffline }: StudyCollectionListProps) {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    category: 'custom' as const
  });
  const [importExam, setImportExam] = useState('SCS-C02');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/memorization/collections');
      const result = await response.json();
      
      if (result.success) {
        setCollections(result.data);
      } else {
        console.error('Failed to load collections:', result.message);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async () => {
    if (!newCollection.name.trim()) return;

    try {
      const response = await fetch('/api/memorization/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCollection)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCollections([result.data, ...collections]);
        setNewCollection({ name: '', description: '', category: 'custom' });
        setShowCreateForm(false);
      } else {
        alert('Failed to create collection: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Error creating collection');
    }
  };

  const importQuizExplanations = async () => {
    try {
      const response = await fetch('/api/memorization/import/quiz-explanations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examNumber: importExam })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Successfully imported ${result.data.totalImported} explanations from ${importExam}`);
        loadCollections(); // Refresh the list
        setShowImportForm(false);
      } else {
        alert('Failed to import explanations: ' + result.message);
      }
    } catch (error) {
      console.error('Error importing explanations:', error);
      alert('Error importing explanations');
    }
  };

  const deleteCollection = async (collectionId: string, collectionName: string) => {
    if (!confirm(`Are you sure you want to delete "${collectionName}" and all its content?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/memorization/collections/${collectionId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCollections(collections.filter(c => c._id !== collectionId));
      } else {
        alert('Failed to delete collection: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Error deleting collection');
    }
  };

  const getProgressPercentage = (mastered: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((mastered / total) * 100);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'quiz-explanations': return '📚';
      case 'interview-responses': return '💼';
      case 'custom': return '📝';
      default: return '📄';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'quiz-explanations': return '#3498db';
      case 'interview-responses': return '#e74c3c';
      case 'custom': return '#2ecc71';
      default: return '#95a5a6';
    }
  };
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading collections...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>Study Collections</h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            disabled={isOffline}
          >
            + New Collection
          </button>
          <button
            onClick={() => setShowImportForm(true)}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            disabled={isOffline}
          >
            📚 Import Quiz Explanations
          </button>
        </div>
      </div>

      {/* Create Collection Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Create New Collection</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Collection Name *
            </label>
            <input
              type="text"
              value={newCollection.name}
              onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
              placeholder="Enter collection name"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              value={newCollection.description}
              onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Category
            </label>
            <select
              value={newCollection.category}
              onChange={(e) => setNewCollection({ ...newCollection, category: e.target.value as any })}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              <option value="custom">Custom</option>
              <option value="interview-responses">Interview Responses</option>
              <option value="quiz-explanations">Quiz Explanations</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={createCollection}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem' }}
              disabled={!newCollection.name.trim()}
            >
              Create Collection
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewCollection({ name: '', description: '', category: 'custom' });
              }}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Import Quiz Explanations Form */}
      {showImportForm && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Import Quiz Explanations</h3>
          <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
            Import explanations from existing quiz questions to create a memorization collection.
          </p>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Exam Number
            </label>
            <select
              value={importExam}
              onChange={(e) => setImportExam(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              <option value="SCS-C02">SCS-C02 (Security Specialty)</option>
              <option value="SAA-C03">SAA-C03 (Solutions Architect)</option>
              <option value="DVA-C02">DVA-C02 (Developer Associate)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={importQuizExplanations}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem' }}
            >
              Import Explanations
            </button>
            <button
              onClick={() => setShowImportForm(false)}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ color: '#666', marginBottom: '1rem' }}>No Collections Yet</h3>
          <p style={{ color: '#888', marginBottom: '1.5rem' }}>
            Create your first collection or import quiz explanations to get started with memorization.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem' }}
            disabled={isOffline}
          >
            Create Your First Collection
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {collections.map((collection) => (
            <div
              key={collection._id}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #ddd',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              {/* Collection Header */}
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #eee',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>
                    {getCategoryIcon(collection.category)}
                  </span>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '1.1rem', 
                    color: '#2c3e50',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {collection.name}
                  </h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    backgroundColor: getCategoryColor(collection.category),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '500'
                  }}>
                    {collection.category.replace('-', ' ')}
                  </span>
                  
                  {collection.isOfflineAvailable && (
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '500'
                    }}>
                      📱 Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Collection Content */}
              <div style={{ padding: '1rem' }}>
                {collection.description && (
                  <p style={{
                    margin: '0 0 1rem 0',
                    color: '#666',
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {collection.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Progress</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#2c3e50' }}>
                      {collection.masteredItems}/{collection.totalItems} items
                    </span>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${getProgressPercentage(collection.masteredItems, collection.totalItems)}%`,
                      height: '100%',
                      backgroundColor: '#28a745',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  
                  <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    <span style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#28a745'
                    }}>
                      {getProgressPercentage(collection.masteredItems, collection.totalItems)}% Complete
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to collection content view
                      navigate(`/memorization/collection/${collection._id}`);
                    }}
                    className="btn-primary"
                    style={{ 
                      flex: 1, 
                      padding: '0.5rem',
                      fontSize: '0.9rem'
                    }}
                  >
                    📖 Study
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(collection._id, collection.name);
                    }}
                    className="btn-secondary"
                    style={{ 
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.9rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: '1px solid #dc3545'
                    }}
                    disabled={isOffline}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Collection Footer */}
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #eee',
                fontSize: '0.75rem',
                color: '#666'
              }}>
                Created: {new Date(collection.createdAt).toLocaleDateString()}
                {collection.updatedAt !== collection.createdAt && (
                  <span style={{ marginLeft: '0.5rem' }}>
                    • Updated: {new Date(collection.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offline Notice */}
      {isOffline && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          color: '#856404'
        }}>
          <strong>📱 Offline Mode:</strong> You can study downloaded collections, but creating new collections 
          and importing content requires an internet connection.
        </div>
      )}
    </div>
  );
}
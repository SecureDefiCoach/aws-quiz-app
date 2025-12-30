import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface ContentItem {
  _id: string;
  title: string;
  wordCount: number;
  createdAt: string;
}

interface Collection {
  _id: string;
  name: string;
  description: string;
  category: string;
  contentItems: ContentItem[];
  totalItems: number;
  masteredItems: number;
  createdAt: string;
  updatedAt: string;
}

interface CollectionDetailProps {
  isOffline: boolean;
}

export default function CollectionDetail({ isOffline }: CollectionDetailProps) {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newContent, setNewContent] = useState({
    title: '',
    originalText: '',
    source: '',
    tags: ''
  });

  useEffect(() => {
    const fetchCollection = async () => {
      if (!collectionId) {
        setError('Collection ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/memorization/collections/${collectionId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch collection');
        }

        setCollection(result.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError(err instanceof Error ? err.message : 'Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId]);

  const addContent = async () => {
    if (!newContent.title.trim() || !newContent.originalText.trim()) {
      alert('Title and text content are required');
      return;
    }

    try {
      const metadata = {
        source: newContent.source || undefined,
        tags: newContent.tags ? newContent.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined
      };

      const response = await fetch('/api/memorization/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collectionId,
          title: newContent.title,
          originalText: newContent.originalText,
          metadata
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add content');
      }

      // Generate deletion levels for the new content
      const levelsResponse = await fetch(`/api/memorization/content/${result.data._id}/generate-levels`, {
        method: 'POST'
      });

      if (!levelsResponse.ok) {
        console.warn('Failed to generate deletion levels, but content was created');
      }

      // Refresh the collection to show the new content
      const refreshResponse = await fetch(`/api/memorization/collections/${collectionId}`);
      const refreshResult = await refreshResponse.json();
      
      if (refreshResponse.ok) {
        setCollection(refreshResult.data);
      }

      // Reset form
      setNewContent({ title: '', originalText: '', source: '', tags: '' });
      setShowAddForm(false);

    } catch (err) {
      console.error('Error adding content:', err);
      alert('Failed to add content: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
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
      <div className="collection-detail loading">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collection-detail error">
        <div className="card">
          <div className="error">
            <h3>Error Loading Collection</h3>
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

  if (!collection) {
    return (
      <div className="collection-detail">
        <div className="card">
          <p>Collection not found</p>
          <button 
            onClick={() => navigate('/memorization/collections')}
            className="btn-primary"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-detail" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Collection Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            fontSize: '2rem',
            padding: '0.5rem',
            backgroundColor: getCategoryColor(collection.category),
            borderRadius: '8px',
            color: 'white'
          }}>
            {getCategoryIcon(collection.category)}
          </div>
          
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
              {collection.name}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <span style={{
                padding: '0.2rem 0.5rem',
                backgroundColor: getCategoryColor(collection.category),
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}>
                {collection.category.replace('-', ' ')}
              </span>
              
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                {collection.totalItems} item{collection.totalItems !== 1 ? 's' : ''}
              </span>
              
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                {collection.masteredItems} mastered
              </span>
            </div>
            
            {collection.description && (
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                {collection.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Overall Progress</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2c3e50' }}>
              {Math.round((collection.masteredItems / collection.totalItems) * 100)}% Complete
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: '#e9ecef',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(collection.masteredItems / collection.totalItems) * 100}%`,
              height: '100%',
              backgroundColor: '#28a745',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => navigate('/memorization/collections')}
            className="btn-secondary"
          >
            ← Back to Collections
          </button>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
            disabled={isOffline}
          >
            + Add Content
          </button>
        </div>
      </div>

      {/* Add Content Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Add New Content</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Title *
            </label>
            <input
              type="text"
              value={newContent.title}
              onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
              placeholder="Enter content title"
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
              Text Content *
            </label>
            <textarea
              value={newContent.originalText}
              onChange={(e) => setNewContent({ ...newContent, originalText: e.target.value })}
              placeholder="Enter the text you want to memorize..."
              rows={8}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
              Word count: {newContent.originalText.trim().split(/\s+/).filter(word => word).length}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Source (optional)
            </label>
            <input
              type="text"
              value={newContent.source}
              onChange={(e) => setNewContent({ ...newContent, source: e.target.value })}
              placeholder="e.g., AWS Documentation, Interview Guide"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Tags (optional)
            </label>
            <input
              type="text"
              value={newContent.tags}
              onChange={(e) => setNewContent({ ...newContent, tags: e.target.value })}
              placeholder="e.g., security, best-practices, interview (comma-separated)"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={addContent}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem' }}
              disabled={!newContent.title.trim() || !newContent.originalText.trim()}
            >
              Add Content
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewContent({ title: '', originalText: '', source: '', tags: '' });
              }}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content Items */}
      <div className="card">
        <h2 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Content Items</h2>
        
        {collection.contentItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#666'
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No content items in this collection yet.</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              Add your first content item to start memorizing!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
              disabled={isOffline}
            >
              + Add Your First Content
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {collection.contentItems.map((item) => (
              <div
                key={item._id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                  e.currentTarget.style.borderColor = '#bbb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fafafa';
                  e.currentTarget.style.borderColor = '#ddd';
                }}
                onClick={() => navigate(`/memorization/study/${item._id}`)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '1.1rem',
                      color: '#2c3e50'
                    }}>
                      {item.title}
                    </h3>
                    
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      fontSize: '0.8rem',
                      color: '#666'
                    }}>
                      <span>{item.wordCount} words</span>
                      <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <button
                    className="btn-primary"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/memorization/study/${item._id}`);
                    }}
                  >
                    Study →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offline Notice */}
      {isOffline && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          color: '#856404'
        }}>
          <strong>📱 Offline Mode:</strong> You can study downloaded content, but some features may be limited.
        </div>
      )}
    </div>
  );
}
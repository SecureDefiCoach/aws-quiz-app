import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Statistics {
  overview: {
    totalItems: number;
    totalStudyTime: number;
    averageStudyTimePerItem: number;
    totalCollections: number;
  };
  mastery: {
    fullyMastered: number;
    nearlyMastered: number;
    partiallyMastered: number;
    started: number;
    notStarted: number;
  };
  collections: Array<{
    collectionId: string;
    name: string;
    category: string;
    totalItems: number;
    masteredItems: number;
    masteryPercentage: number;
    totalStudyTime: number;
    averageStudyTimePerItem: number;
  }>;
  recentActivity: {
    itemsStudied: number;
    studyTime: number;
    averageDailyStudyTime: number;
  };
}

interface PracticeRecommendation {
  contentId: string;
  title: string;
  masteryLevel: number;
  totalStudyTime: number;
  lastStudiedAt: string | null;
  nextRecommendedLevel: number;
  urgencyScore: number;
}

interface MemorizationDashboardProps {
  isOffline: boolean;
}

export default function MemorizationDashboard({ isOffline }: MemorizationDashboardProps) {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recommendations, setRecommendations] = useState<PracticeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load statistics and recommendations in parallel
      const [statsResponse, recommendationsResponse] = await Promise.all([
        fetch('/api/memorization/progress/statistics'),
        fetch('/api/memorization/progress/practice-recommendations?limit=5')
      ]);

      const [statsResult, recommendationsResult] = await Promise.all([
        statsResponse.json(),
        recommendationsResponse.json()
      ]);

      if (statsResult.success) {
        setStatistics(statsResult.data);
      }

      if (recommendationsResult.success) {
        setRecommendations(recommendationsResult.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatTimeDetailed = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getMasteryColor = (level: number): string => {
    if (level >= 15) return '#28a745'; // Green - fully mastered
    if (level >= 10) return '#ffc107'; // Yellow - nearly mastered
    if (level >= 5) return '#fd7e14';  // Orange - partially mastered
    if (level > 0) return '#6c757d';   // Gray - started
    return '#dc3545';                  // Red - not started
  };

  const getUrgencyColor = (score: number): string => {
    if (score >= 80) return '#dc3545'; // High urgency - red
    if (score >= 50) return '#fd7e14'; // Medium urgency - orange
    return '#28a745';                  // Low urgency - green
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Welcome to Memorization!</h3>
        <p>Create your first collection to get started.</p>
        <button
          onClick={() => navigate('/memorization/collections')}
          className="btn-primary"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          Get Started
        </button>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontSize: '2rem' }}>
            {statistics.overview.totalCollections}
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Collections</p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontSize: '2rem' }}>
            {statistics.overview.totalItems}
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Items</p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontSize: '2rem' }}>
            {formatTimeDetailed(statistics.overview.totalStudyTime)}
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Study Time</p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontSize: '2rem' }}>
            {statistics.mastery.fullyMastered}
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Fully Mastered</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Mastery Breakdown */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>Mastery Breakdown</h3>
          </div>
          
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%' }}></span>
                  Fully Mastered
                </span>
                <span style={{ fontWeight: '600' }}>{statistics.mastery.fullyMastered}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#ffc107', borderRadius: '50%' }}></span>
                  Nearly Mastered
                </span>
                <span style={{ fontWeight: '600' }}>{statistics.mastery.nearlyMastered}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#fd7e14', borderRadius: '50%' }}></span>
                  Partially Mastered
                </span>
                <span style={{ fontWeight: '600' }}>{statistics.mastery.partiallyMastered}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#6c757d', borderRadius: '50%' }}></span>
                  Started
                </span>
                <span style={{ fontWeight: '600' }}>{statistics.mastery.started}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#dc3545', borderRadius: '50%' }}></span>
                  Not Started
                </span>
                <span style={{ fontWeight: '600' }}>{statistics.mastery.notStarted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>Recent Activity (7 days)</h3>
          </div>
          
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '600', color: '#2c3e50', marginBottom: '0.25rem' }}>
                  {statistics.recentActivity.itemsStudied}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Items Studied</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '600', color: '#2c3e50', marginBottom: '0.25rem' }}>
                  {formatTimeDetailed(statistics.recentActivity.studyTime)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Study Time</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '600', color: '#2c3e50', marginBottom: '0.25rem' }}>
                  {formatTime(statistics.recentActivity.averageDailyStudyTime)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>Daily Average</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Practice Recommendations */}
      {recommendations.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>🎯 Recommended Practice</h3>
            <button
              onClick={() => navigate('/memorization/collections')}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              View All
            </button>
          </div>
          
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recommendations.map((item) => (
                <div
                  key={item.contentId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border: '1px solid #eee',
                    borderRadius: '6px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onClick={() => navigate(`/memorization/study/${item.contentId}`)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', color: '#2c3e50', marginBottom: '0.25rem' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Level {item.masteryLevel}/15 • {formatTime(item.totalStudyTime)} studied
                      {item.lastStudiedAt && (
                        <span> • Last: {new Date(item.lastStudiedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Mastery Level Indicator */}
                    <div style={{
                      width: '40px',
                      height: '6px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(item.masteryLevel / 15) * 100}%`,
                        height: '100%',
                        backgroundColor: getMasteryColor(item.masteryLevel)
                      }} />
                    </div>
                    
                    {/* Urgency Indicator */}
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getUrgencyColor(item.urgencyScore)
                    }} />
                    
                    <button
                      className="btn-primary"
                      style={{ 
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/memorization/study/${item.contentId}?level=${item.nextRecommendedLevel}`);
                      }}
                    >
                      Study Level {item.nextRecommendedLevel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collections Overview */}
      {statistics.collections.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>📚 Collections Overview</h3>
            <button
              onClick={() => navigate('/memorization/collections')}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              Manage Collections
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600' }}>
                    Collection
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600' }}>
                    Items
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600' }}>
                    Mastered
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600' }}>
                    Progress
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600' }}>
                    Study Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {statistics.collections.map((collection, index) => (
                  <tr
                    key={collection.collectionId}
                    style={{
                      borderBottom: '1px solid #eee',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/memorization/collection/${collection.collectionId}`)}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500', color: '#2c3e50' }}>
                        {collection.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'capitalize' }}>
                        {collection.category.replace('-', ' ')}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
                      {collection.totalItems}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
                      {collection.masteredItems}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '60px',
                          height: '6px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${collection.masteryPercentage}%`,
                            height: '100%',
                            backgroundColor: '#28a745'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                          {collection.masteryPercentage}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.9rem' }}>
                      {formatTimeDetailed(collection.totalStudyTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => navigate('/memorization/collections')}
          className="btn-primary"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          📚 Browse Collections
        </button>
        
        {!isOffline && (
          <button
            onClick={() => navigate('/memorization/collections')}
            className="btn-secondary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            ➕ Create Collection
          </button>
        )}
      </div>
    </div>
  );
}
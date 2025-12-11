import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '../contexts/DemoModeContext';

export default function DemoDashboard() {
  const navigate = useNavigate();
  const { state, getScore } = useDemoMode();
  
  // Demo stats - simulated data to show what the full app looks like
  const demoStats = {
    examName: "Professional Certification Demo",
    subdomains: [
      {
        subDomain: "1.1",
        domainName: "Database Services",
        new: 1,
        right: 0,
        wrong: 0,
        mastered: 0,
        total: 1
      },
      {
        subDomain: "2.1", 
        domainName: "Compute Services",
        new: 2,
        right: 0,
        wrong: 0,
        mastered: 0,
        total: 2
      },
      {
        subDomain: "3.1",
        domainName: "Application Integration", 
        new: 1,
        right: 0,
        wrong: 0,
        mastered: 0,
        total: 1
      },
      {
        subDomain: "4.1",
        domainName: "Security & Identity",
        new: 1,
        right: 0,
        wrong: 0,
        mastered: 0,
        total: 1
      }
    ],
    totals: {
      new: 5,
      right: 0,
      wrong: 0,
      mastered: 0,
      total: 5
    }
  };

  // Update stats based on actual demo progress if available
  const getUpdatedStats = () => {
    if (!state.session) return demoStats;
    
    const score = getScore();
    const updatedStats = { ...demoStats };
    
    // Create a map of subdomain to question answers
    const subdomainAnswers: { [key: string]: { correct: number; wrong: number; total: number } } = {};
    
    // Initialize subdomain tracking
    state.session.questions.forEach(question => {
      const subDomain = question.subDomain;
      if (!subdomainAnswers[subDomain]) {
        subdomainAnswers[subDomain] = { correct: 0, wrong: 0, total: 0 };
      }
    });
    
    // Count answers by subdomain
    state.session.answers.forEach(answer => {
      const question = state.session!.questions.find(q => q.id === answer.questionId);
      if (question) {
        const subDomain = question.subDomain;
        subdomainAnswers[subDomain].total++;
        if (answer.isCorrect) {
          subdomainAnswers[subDomain].correct++;
        } else {
          subdomainAnswers[subDomain].wrong++;
        }
      }
    });
    
    // Update subdomain stats
    updatedStats.subdomains = updatedStats.subdomains.map(subdomain => {
      const domainAnswers = subdomainAnswers[subdomain.domainName];
      if (domainAnswers) {
        return {
          ...subdomain,
          new: Math.max(0, subdomain.total - domainAnswers.total),
          right: domainAnswers.correct,
          wrong: domainAnswers.wrong
        };
      }
      return subdomain;
    });
    
    // Update totals based on actual answers
    updatedStats.totals.new = Math.max(0, 5 - score.total);
    updatedStats.totals.right = score.correct;
    updatedStats.totals.wrong = score.total - score.correct;
    
    return updatedStats;
  };

  const stats = getUpdatedStats();

  const getProgressPercentage = (mastered: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((mastered / total) * 100);
  };

  const getDomainNumber = (subDomain: string): number => {
    const match = subDomain.match(/^(\d+)\./);
    return match ? parseInt(match[1]) : 0;
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Demo Welcome Message */}
      <div className="demo-welcome-card">
        <h2>Welcome to the ERT Demo! 🎯</h2>
        <p>
          You're experiencing the full dashboard interface with sample professional certification data. 
          In the full version, this would show your actual progress across hundreds of questions.
        </p>
        <div className="demo-features-highlight">
          <div className="demo-feature-item">
            <strong>📊 Progress Tracking:</strong> See your mastery across all domains
          </div>
          <div className="demo-feature-item">
            <strong>🎯 Adaptive Learning:</strong> Focus on areas that need work
          </div>
          <div className="demo-feature-item">
            <strong>📈 Detailed Analytics:</strong> Track improvement over time
          </div>
        </div>
      </div>

      {/* Exam Filter - Demo Version */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'inline-block', 
          marginRight: '0.5rem',
          fontWeight: '500',
          fontSize: '0.875rem'
        }}>
          Filter by Exam:
        </label>
        <select
          value="DEMO"
          disabled
          style={{
            padding: '0.5rem',
            fontSize: '0.875rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#f9fafb',
            opacity: 0.7
          }}
        >
          <option value="DEMO">AWS Demo Questions</option>
        </select>
        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
          (Full version supports multiple exams)
        </span>
      </div>

      {/* Subdomain Breakdown */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        marginBottom: '1.5rem',
        display: 'inline-block',
        minWidth: 'auto'
      }}>
        <div style={{ 
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{stats.examName}</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: 'auto', 
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#ff9900', color: 'white' }}>
                <th style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  width: '60px',
                  minWidth: '60px',
                  maxWidth: '60px'
                }}>
                  ID
                </th>
                <th style={{ 
                  padding: '0.4rem 0.5rem', 
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  width: '200px'
                }}>
                  Domain
                </th>
                <th style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  width: '60px',
                  minWidth: '60px',
                  maxWidth: '60px'
                }}>
                  New
                </th>
                <th style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  width: '60px',
                  minWidth: '60px',
                  maxWidth: '60px'
                }}>
                  Right
                </th>
                <th style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  width: '60px',
                  minWidth: '60px',
                  maxWidth: '60px'
                }}>
                  Wrong
                </th>
                <th style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  width: '60px',
                  minWidth: '60px',
                  maxWidth: '60px'
                }}>
                  Mastered
                </th>
                <th style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  width: '70px',
                  minWidth: '70px',
                  maxWidth: '70px'
                }}>
                  Complete
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.subdomains.map((subdomain: any, index: number) => {
                const currentDomain = getDomainNumber(subdomain.subDomain);
                const prevDomain = index > 0 ? getDomainNumber(stats.subdomains[index - 1].subDomain) : currentDomain;
                const isNewDomain = currentDomain !== prevDomain;
                
                return (
                  <tr 
                    key={subdomain.subDomain}
                    style={{ 
                      borderBottom: '1px solid #e5e7eb',
                      borderTop: isNewDomain ? '2px solid #9ca3af' : 'none',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                    }}
                  >
                    <td style={{ 
                      padding: '0.25rem 0.2rem', 
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '0.7rem'
                    }}>
                      {subdomain.subDomain}
                    </td>
                    <td style={{ 
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.7rem',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {subdomain.domainName}
                    </td>
                    <td style={{ 
                      padding: '0.25rem 0.2rem', 
                      textAlign: 'center',
                      fontSize: '0.7rem'
                    }}>
                      {subdomain.new}
                    </td>
                    <td style={{ 
                      padding: '0.25rem 0.2rem', 
                      textAlign: 'center',
                      fontSize: '0.7rem'
                    }}>
                      {subdomain.right}
                    </td>
                    <td style={{ 
                      padding: '0.25rem 0.2rem', 
                      textAlign: 'center',
                      fontSize: '0.7rem'
                    }}>
                      {subdomain.wrong}
                    </td>
                    <td style={{ 
                      padding: '0.25rem 0.2rem', 
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '0.7rem'
                    }}>
                      {subdomain.mastered}
                    </td>
                    <td style={{ 
                      padding: '0.25rem 0.2rem', 
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '0.7rem',
                      backgroundColor: '#e5e7eb'
                    }}>
                      {getProgressPercentage(subdomain.mastered, subdomain.total)}%
                    </td>
                  </tr>
                );
              })}
              
              {/* Totals Row */}
              <tr style={{ 
                backgroundColor: '#9ca3af',
                fontWeight: '700',
                borderTop: '2px solid #374151'
              }}>
                <td colSpan={2} style={{ 
                  padding: '0.4rem 0.5rem',
                  fontSize: '0.7rem'
                }}>
                  Totals
                </td>
                <td style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontSize: '0.7rem'
                }}>
                  {stats.totals.new}
                </td>
                <td style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontSize: '0.7rem'
                }}>
                  {stats.totals.right}
                </td>
                <td style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontSize: '0.7rem'
                }}>
                  {stats.totals.wrong}
                </td>
                <td style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontSize: '0.7rem'
                }}>
                  {stats.totals.mastered}
                </td>
                <td style={{ 
                  padding: '0.4rem 0.2rem', 
                  textAlign: 'center',
                  fontSize: '0.7rem'
                }}>
                  {getProgressPercentage(stats.totals.mastered, stats.totals.total)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Call to Action */}
      <div className="demo-cta-card">
        <h3>Ready to unlock the full experience?</h3>
        <p>
          The full version includes hundreds of questions across multiple professional certifications, 
          detailed progress tracking, and personalized learning paths.
        </p>
        <button 
          onClick={() => navigate('/auth')}
          className="btn-primary btn-large"
        >
          Sign Up Free
        </button>
      </div>
    </div>
  );
}
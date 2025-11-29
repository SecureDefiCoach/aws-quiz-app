import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export default function Dashboard() {
  const [examNumber, setExamNumber] = useState<string>(() => {
    return localStorage.getItem('lastExamNumber') || 'ALL';
  });
  const [exams, setExams] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load available exams
  useEffect(() => {
    loadExams();
  }, []);

  // Load stats when exam filter changes
  useEffect(() => {
    if (examNumber) {
      loadStats();
      localStorage.setItem('lastExamNumber', examNumber);
    }
  }, [examNumber]);

  const loadExams = async () => {
    try {
      const { data } = await client.queries.getExams();
      setExams(data || []);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data } = await client.queries.getDashboardStats({
        examNumber: examNumber === 'ALL' ? undefined : examNumber
      });
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (mastered: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((mastered / total) * 100);
  };

  const getDomainNumber = (subDomain: string): number => {
    const match = subDomain.match(/^(\d+)\./);
    return match ? parseInt(match[1]) : 0;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Exam Filter */}
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
          value={examNumber}
          onChange={(e) => setExamNumber(e.target.value)}
          style={{
            padding: '0.5rem',
            fontSize: '0.875rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: 'white'
          }}
        >
          <option value="ALL">All Exams</option>
          {exams.map((exam) => (
            <option key={exam.number} value={exam.number}>
              {exam.display}
            </option>
          ))}
        </select>
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
              <tr style={{ backgroundColor: '#ef4444', color: 'white' }}>
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
                      {subdomain.domainName.length > 40 
                        ? subdomain.domainName.substring(0, 40) + '...' 
                        : subdomain.domainName}
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
    </div>
  );
}

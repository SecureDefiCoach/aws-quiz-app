import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface DashboardProps {
  onStartQuiz: () => void;
}

export default function Dashboard({ onStartQuiz }: DashboardProps) {
  const [examNumber, setExamNumber] = useState<string>('ALL');
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

  const getStateColor = (state: string) => {
    switch (state) {
      case 'new': return '#94a3b8';
      case 'right': return '#22c55e';
      case 'wrong': return '#ef4444';
      case 'mastered': return '#3b82f6';
      default: return '#64748b';
    }
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0 }}>Progress Dashboard</h1>
        <button
          onClick={onStartQuiz}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Start Quiz
        </button>
      </div>

      {/* Exam Filter */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem',
          fontWeight: '500'
        }}>
          Filter by Exam:
        </label>
        <select
          value={examNumber}
          onChange={(e) => setExamNumber(e.target.value)}
          style={{
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            width: '300px',
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

      {/* Overall Progress */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>{stats.examName}</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Total Questions
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {stats.totals.total}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Mastered
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {stats.totals.mastered}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Progress
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {getProgressPercentage(stats.totals.mastered, stats.totals.total)}%
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${getProgressPercentage(stats.totals.mastered, stats.totals.total)}%`,
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Subdomain Breakdown */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: 0 }}>Subdomain Breakdown</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ 
                  padding: '0.75rem 1rem', 
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Subdomain
                </th>
                <th style={{ 
                  padding: '0.75rem 1rem', 
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Domain Name
                </th>
                <th style={{ 
                  padding: '0.75rem 1rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#94a3b8'
                }}>
                  New
                </th>
                <th style={{ 
                  padding: '0.75rem 1rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#22c55e'
                }}>
                  Right
                </th>
                <th style={{ 
                  padding: '0.75rem 1rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#ef4444'
                }}>
                  Wrong
                </th>
                <th style={{ 
                  padding: '0.75rem 1rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#3b82f6'
                }}>
                  Mastered
                </th>
                <th style={{ 
                  padding: '0.75rem 1rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Total
                </th>
                <th style={{ 
                  padding: '0.75rem 1rem', 
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.subdomains.map((subdomain: any, index: number) => (
                <tr 
                  key={subdomain.subDomain}
                  style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>
                    {subdomain.subDomain}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {subdomain.domainName}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {subdomain.new}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {subdomain.right}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {subdomain.wrong}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '600' }}>
                    {subdomain.mastered}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '600' }}>
                    {subdomain.total}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#eff6ff',
                      color: '#3b82f6',
                      fontWeight: '600'
                    }}>
                      {getProgressPercentage(subdomain.mastered, subdomain.total)}%
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr style={{ 
                backgroundColor: '#f3f4f6',
                fontWeight: '600'
              }}>
                <td colSpan={2} style={{ padding: '0.75rem 1rem' }}>
                  TOTALS
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  {stats.totals.new}
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  {stats.totals.right}
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  {stats.totals.wrong}
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  {stats.totals.mastered}
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  {stats.totals.total}
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    fontWeight: '600'
                  }}>
                    {getProgressPercentage(stats.totals.mastered, stats.totals.total)}%
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

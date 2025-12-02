import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface CognitoUser {
  username: string;
  email: string;
  status: string;
  createdDate: string;
}

function AdminPanel() {
  const [pendingUsers, setPendingUsers] = useState<CognitoUser[]>([]);
  const [allUsers, setAllUsers] = useState<CognitoUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const loadPendingUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, errors } = await client.queries.listPendingUsers();
      if (errors) {
        throw new Error(errors[0].message);
      }
      setPendingUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, errors } = await client.queries.listAllUsers();
      if (errors) {
        throw new Error(errors[0].message);
      }
      setAllUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUser = async (username: string) => {
    if (!confirm(`Approve user: ${username}?`)) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, errors } = await client.mutations.confirmUser({ username });
      if (errors) {
        throw new Error(errors[0].message);
      }
      if (data) {
        alert('User approved successfully!');
        loadPendingUsers();
        if (activeTab === 'all') loadAllUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (username: string, email: string) => {
    if (!confirm(`Delete user: ${email}?\n\nThis action cannot be undone.`)) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, errors } = await client.mutations.deleteUser({ username });
      if (errors) {
        throw new Error(errors[0].message);
      }
      if (data) {
        alert('User deleted successfully!');
        loadPendingUsers();
        if (activeTab === 'all') loadAllUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingUsers();
    } else {
      loadAllUsers();
    }
  }, [activeTab]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      CONFIRMED: '#10b981',
      UNCONFIRMED: '#f59e0b',
      FORCE_CHANGE_PASSWORD: '#3b82f6',
    };
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: colors[status] || '#6b7280',
        color: 'white',
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Admin Panel</h2>
          <p style={{ color: '#666', margin: 0 }}>
            Manage user registrations and approvals
          </p>
        </div>
        <div>
          <a 
            href="https://github.com/SecureDefiCoach/aws-quiz-app/blob/main/docs/ADMIN_GUIDE.md" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              padding: '0.5rem 1rem',
              marginRight: '0.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          >
            Admin Guide
          </a>
          <a 
            href="https://github.com/SecureDefiCoach/aws-quiz-app/blob/main/docs/TROUBLESHOOTING.md" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          >
            Troubleshooting
          </a>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#991b1b',
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'pending' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'pending' ? 600 : 400,
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          Pending Approvals ({pendingUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'all' ? '2px solid #3b82f6' : 'none',
            color: activeTab === 'all' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'all' ? 600 : 400,
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          All Users ({allUsers.length})
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {activeTab === 'pending' && !loading && (
        <div>
          {pendingUsers.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              No pending users
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.username} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem' }}>{getStatusBadge(user.status)}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatDate(user.createdDate)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleConfirmUser(user.username)}
                        disabled={loading}
                        style={{
                          padding: '0.5rem 1rem',
                          marginRight: '0.5rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.username, user.email)}
                        disabled={loading}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'all' && !loading && (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.username} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>{user.email}</td>
                  <td style={{ padding: '0.75rem' }}>{getStatusBadge(user.status)}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {formatDate(user.createdDate)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {user.status === 'UNCONFIRMED' && (
                      <button
                        onClick={() => handleConfirmUser(user.username)}
                        disabled={loading}
                        style={{
                          padding: '0.5rem 1rem',
                          marginRight: '0.5rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user.username, user.email)}
                      disabled={loading}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;

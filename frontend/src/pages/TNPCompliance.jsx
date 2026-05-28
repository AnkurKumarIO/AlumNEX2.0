import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';

export default function TNPCompliance({ token }) {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('banned'); // 'banned', 'flagged'

  const fetchBanned = async () => {
    setLoading(true);
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/users/banned`, { headers });
      const data = await res.json();
      setBannedUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch banned users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanned();
  }, []);

  const handleUnban = async (userId) => {
    if (!window.confirm('Are you sure you want to restore access for this user?')) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/users/ban`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userId, isBanned: false })
      });
      if (res.ok) fetchBanned();
    } catch (err) {
      alert('Failed to unban user');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#dae2fd' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Compliance & Moderation</h2>
        <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>
          Monitor platform integrity, manage suspended accounts, and review flagged content.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => setActiveTab('banned')}
          style={{
            padding: '0.6rem 1.25rem', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
            background: activeTab === 'banned' ? '#ffb4ab' : '#131b2e',
            color: activeTab === 'banned' ? '#690005' : '#c7c4d8',
            transition: 'all 0.2s'
          }}
        >
          Suspended Users ({bannedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('flagged')}
          style={{
            padding: '0.6rem 1.25rem', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
            background: activeTab === 'flagged' ? '#ffb95f' : '#131b2e',
            color: activeTab === 'flagged' ? '#452b00' : '#c7c4d8',
            transition: 'all 0.2s'
          }}
        >
          Flagged Sessions (0)
        </button>
      </div>

      <div style={{ background: '#131b2e', borderRadius: 20, padding: '1.5rem', border: '1px solid rgba(255,180,171,0.1)' }}>
        {activeTab === 'banned' ? (
          <>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: '#ffb4ab', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined">block</span>
              Suspended Accounts
            </h3>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#c7c4d8' }}>Loading...</div>
            ) : bannedUsers.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(70,69,85,0.3)' }}>
                 <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#4edea3', marginBottom: 12, display: 'block' }}>gpp_good</span>
                 <div style={{ fontWeight: 700, fontSize: '1rem' }}>No users are currently suspended.</div>
                 <p style={{ fontSize: '0.8rem', color: '#c7c4d8', marginTop: 6 }}>The platform environment is currently healthy.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bannedUsers.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'rgba(255,180,171,0.05)', border: '1px solid rgba(255,180,171,0.1)', borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ffb4ab', color: '#690005', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{u.name?.[0] || '?'}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{u.email} • {u.role}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnban(u.id)}
                      style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(78,222,163,0.1)', color: '#4edea3', border: '1px solid rgba(78,222,163,0.2)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      Restore Access
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#ffb95f', marginBottom: 12, display: 'block' }}>flag</span>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>No sessions have been flagged.</div>
            <p style={{ fontSize: '0.8rem', color: '#c7c4d8', marginTop: 6 }}>Reports from students or alumni will appear here for review.</p>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,180,171,0.05)', padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(255,180,171,0.15)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <span className="material-symbols-outlined" style={{ color: '#ffb4ab', marginTop: 2 }}>info</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffb4ab', marginBottom: 4 }}>Administrative Policy</div>
          <p style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.5, margin: 0 }}>
            Suspended users cannot log in to the platform. All their data remains intact but their access is immediately revoked.
            You can suspend users directly from the <strong>User Directory</strong> tab by clicking the "Ban" button on their profile.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';

export default function TNPLiveSessions({ token }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLive = async () => {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/stats/live-sessions`, { headers });
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch live sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 20000); // Refresh every 20s
    return () => clearInterval(interval);
  }, []);

  const handleJoin = (roomId) => {
    // TNP joins as a silent observer
    navigate(`/interview/${roomId}?name=TNP_Observer`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#dae2fd' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Live Session Monitoring</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>
            Real-time overview of active mentorship rooms. Join as a silent observer for quality assurance.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#171f33', padding: '0.5rem 1rem', borderRadius: 12, border: '1px solid rgba(70,69,85,0.2)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4edea3', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Feed Active</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#c7c4d8' }}>Loading live data...</div>
      ) : sessions.length === 0 ? (
        <div style={{ background: '#131b2e', borderRadius: 20, padding: '4rem', textAlign: 'center', border: '1px dashed rgba(70,69,85,0.3)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#464555', marginBottom: 16 }}>videocam_off</span>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No sessions are live right now.</div>
          <p style={{ fontSize: '0.85rem', color: '#c7c4d8', marginTop: 8 }}>Active rooms will automatically appear here when they start.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {sessions.map(s => (
            <div key={s.request_id} style={{ background: '#131b2e', borderRadius: 20, padding: '1.5rem', border: '1px solid rgba(195,192,255,0.1)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#4edea3' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'rgba(78,222,163,0.1)', color: '#4edea3', padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Progress</span>
                <span style={{ fontSize: '0.7rem', color: '#c7c4d8', fontWeight: 600 }}>{new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#c3c0ff', color: '#1d00a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>S</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{s.student?.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#c7c4d8' }}>Student</div>
                  </div>
                </div>

                <div style={{ paddingLeft: 16, borderLeft: '2px dashed rgba(70,69,85,0.4)', margin: '4px 0 4px 18px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#c3c0ff', fontWeight: 600 }}>Topic: {s.topic}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4edea3', color: '#0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>A</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{s.alumni?.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#c7c4d8' }}>{s.alumni?.department} Alumni</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleJoin(s.room_id)}
                style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: 12, background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                Observe Session
              </button>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }`}</style>
    </div>
  );
}

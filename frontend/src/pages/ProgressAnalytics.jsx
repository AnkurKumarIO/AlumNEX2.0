import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';

export default function ProgressAnalytics() {
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    api.getUserFeedback(user.id).then(data => {
      if (Array.isArray(data)) setSessions(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  // Derive stats
  const myRole = user?.role || 'STUDENT';
  const myRatings = sessions
    .map(s => myRole === 'STUDENT' ? s.alumni_rating : s.student_rating)
    .filter(r => r != null && r > 0);
  const avgRating = myRatings.length ? (myRatings.reduce((a, b) => a + b, 0) / myRatings.length).toFixed(1) : '—';
  const totalSessions = sessions.length;

  // Chart — last 8 ratings received
  const chartRatings = myRatings.slice(-8);
  const chartPoints = chartRatings.map((r, i) => [
    i * (1200 / Math.max(chartRatings.length - 1, 1)),
    260 - ((r / 5) * 240),
  ]);
  const pathD = chartPoints.length > 1
    ? `M ${chartPoints.map(p => p.join(' ')).join(' L ')}`
    : null;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#c7c4d8', gap: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 28, opacity: 0.4, animation: 'spin 1s linear infinite' }}>progress_activity</span>
      Loading session history...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 12 }}>
          Session <span style={{ background: 'linear-gradient(135deg,#c3c0ff,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>History</span>
        </h1>
        <p style={{ fontSize: '1rem', color: '#c7c4d8', lineHeight: 1.6 }}>Track your mock interview sessions, feedback received, and ratings over time.</p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Average Rating', val: avgRating !== '—' ? `${avgRating} ★` : '—', color: '#ffb95f' },
          { label: 'Total Sessions', val: String(totalSessions), sub: 'Completed', color: '#c3c0ff' },
          { label: 'Latest Feedback', val: sessions[0] ? (myRole === 'STUDENT' ? sessions[0].alumni_feedback : sessions[0].student_feedback) || 'No feedback' : 'No sessions yet', highlight: true },
        ].map((m, i) => (
          <div key={i} style={{ background: '#171f33', borderRadius: 12, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)', position: 'relative', overflow: 'hidden' }}>
            {m.highlight && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#c3c0ff' }} />}
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 8 }}>{m.label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: m.highlight ? '1rem' : '2.5rem', fontWeight: 900, color: m.color || '#ffb95f', lineHeight: m.highlight ? 1.5 : 1 }}>{m.val}</span>
              {m.sub && <span style={{ fontSize: '0.8rem', color: '#c7c4d8', marginBottom: 6 }}>{m.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Past Sessions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ background: '#131b2e', borderRadius: 12, padding: '2rem', border: '1px solid rgba(70,69,85,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Rating Trend</h2>
            <span style={{ padding: '0.25rem 0.75rem', background: '#2d3449', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>Feedback Rating</span>
          </div>
          <div style={{ position: 'relative', height: 280 }}>
            {/* Grid lines */}
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 25}%`, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: -24, fontSize: '0.55rem', color: 'rgba(199,196,216,0.3)', fontWeight: 700 }}>{5 - i}</span>
              </div>
            ))}
            {pathD ? (
              <svg width="100%" height="260" viewBox="0 0 1200 260" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ratingGrad" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="#ffb95f" />
                    <stop offset="100%" stopColor="#c3c0ff" />
                  </linearGradient>
                </defs>
                <path d={pathD} fill="none" stroke="url(#ratingGrad)" strokeWidth="4" strokeLinecap="round" />
                {chartPoints.map(([x, y], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r="6" fill="#ffb95f" stroke="#0b1326" strokeWidth="2" />
                    <text x={x} y={y - 14} textAnchor="middle" fill="#ffb95f" fontSize="12" fontWeight="700">{chartRatings[i]}★</text>
                  </g>
                ))}
              </svg>
            ) : chartPoints.length === 1 ? (
              <svg width="100%" height="260" viewBox="0 0 1200 260" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
                <circle cx={600} cy={chartPoints[0][1]} r="8" fill="#ffb95f" stroke="#0b1326" strokeWidth="2">
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x={600} y={chartPoints[0][1] - 18} textAnchor="middle" fill="#ffb95f" fontSize="14" fontWeight="700">{chartRatings[0]}★</text>
              </svg>
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c7c4d8', fontSize: '0.875rem', opacity: 0.5 }}>
                Complete sessions and receive feedback to see your trend
              </div>
            )}
            {chartRatings.length > 0 && (
              <div style={{ position: 'absolute', bottom: -24, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>
                {chartRatings.map((_, i) => <span key={i}>Session {i + 1}</span>)}
              </div>
            )}
          </div>
        </div>

        <div style={{ background: '#222a3d', borderRadius: 12, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.1)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Past Sessions</h2>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#c7c4d8', opacity: 0.5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>videocam_off</span>
              <p style={{ fontSize: '0.8rem' }}>No sessions yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessions.map(s => {
                const peerName = myRole === 'STUDENT' ? s.alumni_name : s.student_name;
                const ratingReceived = myRole === 'STUDENT' ? s.alumni_rating : s.student_rating;
                const feedbackReceived = myRole === 'STUDENT' ? s.alumni_feedback : s.student_feedback;
                const ratingGiven = myRole === 'STUDENT' ? s.student_rating : s.alumni_rating;
                const isExpanded = expanded === s.id;
                return (
                  <div key={s.id} style={{ background: isExpanded ? '#171f33' : '#131b2e', borderRadius: 12, overflow: 'hidden', border: isExpanded ? '1px solid rgba(195,192,255,0.2)' : '1px solid transparent' }}>
                    <button onClick={() => setExpanded(isExpanded ? null : s.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#dae2fd' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{peerName || 'Unknown'}</div>
                        <div style={{ fontSize: '0.65rem', color: '#c7c4d8', marginTop: 2 }}>{s.topic || 'Mock Interview'}</div>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(199,196,216,0.4)', marginTop: 2 }}>
                          {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {ratingReceived && <span style={{ color: '#ffb95f', fontWeight: 700, fontSize: '0.85rem' }}>{'★'.repeat(ratingReceived)}</span>}
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c7c4d8' }}>{isExpanded ? 'expand_less' : 'expand_more'}</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div style={{ padding: '0 1rem 1rem' }}>
                        {ratingReceived && (
                          <div style={{ background: 'rgba(255,185,95,0.06)', border: '1px solid rgba(255,185,95,0.15)', borderRadius: 10, padding: '0.75rem', marginBottom: 8 }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffb95f', marginBottom: 4 }}>Rating Received</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffb95f' }}>{ratingReceived}/5</span>
                              <span style={{ color: '#ffb95f' }}>{'★'.repeat(ratingReceived)}{'☆'.repeat(5 - ratingReceived)}</span>
                            </div>
                            {feedbackReceived && <p style={{ fontSize: '0.75rem', color: '#c7c4d8', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>"{feedbackReceived}"</p>}
                          </div>
                        )}
                        {ratingGiven && (
                          <div style={{ background: 'rgba(195,192,255,0.06)', border: '1px solid rgba(195,192,255,0.15)', borderRadius: 10, padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c3c0ff', marginBottom: 4 }}>Your Rating</div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c3c0ff' }}>{ratingGiven}/5 ★</span>
                          </div>
                        )}
                        {!ratingReceived && !ratingGiven && (
                          <p style={{ fontSize: '0.75rem', color: '#c7c4d8', opacity: 0.5 }}>No feedback exchanged yet for this session.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

  // Chart — last 10 rated sessions with date labels (matches alumni chart style)
  const ratedSessions = sessions
    .filter(s => (myRole === 'STUDENT' ? s.alumni_rating : s.student_rating) != null &&
                 (myRole === 'STUDENT' ? s.alumni_rating : s.student_rating) > 0)
    .slice(-10);

  const chartW = 800, chartH = 220, padL = 40, padR = 20, padT = 20, padB = 40;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const n = ratedSessions.length;

  const getX = (i) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const getY = (rating) => padT + innerH - ((rating / 5) * innerH);

  const makePath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const cp1x = (pts[i - 1][0] + pts[i][0]) / 2;
      const cp1y = pts[i - 1][1];
      const cp2x = (pts[i - 1][0] + pts[i][0]) / 2;
      const cp2y = pts[i][1];
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${pts[i][0]} ${pts[i][1]}`;
    }
    return d;
  };

  const pts = ratedSessions.map((s, i) => {
    const r = myRole === 'STUDENT' ? s.alumni_rating : s.student_rating;
    return [getX(i), getY(r)];
  });
  const linePath = makePath(pts);
  const areaPath = pts.length > 0
    ? `${linePath} L ${pts[pts.length - 1][0]} ${padT + innerH} L ${pts[0][0]} ${padT + innerH} Z`
    : '';

  const fmtLabel = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  // Keep legacy vars for metrics section
  const chartRatings = myRatings.slice(-8);

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Rating Trend</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {avgRating !== '—' && (
                <div style={{ background: 'rgba(255,185,95,0.1)', border: '1px solid rgba(255,185,95,0.2)', borderRadius: 10, padding: '0.35rem 0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffb95f' }}>{avgRating}</span>
                  <span style={{ color: '#ffb95f', fontSize: '0.85rem' }}>★</span>
                  <span style={{ fontSize: '0.6rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg</span>
                </div>
              )}
              <span style={{ padding: '0.25rem 0.75rem', background: '#2d3449', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>Feedback Rating</span>
            </div>
          </div>

          {ratedSessions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, opacity: 0.5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#c7c4d8' }}>bar_chart</span>
              <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Complete sessions and receive feedback to see your trend</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', minWidth: 300 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffb95f" />
                    <stop offset="100%" stopColor="#c3c0ff" />
                  </linearGradient>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffb95f" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#ffb95f" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y-axis grid lines and labels */}
                {[1,2,3,4,5].map(rating => {
                  const y = getY(rating);
                  return (
                    <g key={rating}>
                      <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray={rating === 5 ? '0' : '4 4'} />
                      <text x={padL - 8} y={y + 4} textAnchor="end" fill="rgba(199,196,216,0.5)" fontSize="11" fontWeight="600">{rating}★</text>
                    </g>
                  );
                })}

                {/* Area fill */}
                {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

                {/* Line */}
                {linePath && <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                {/* Data points */}
                {pts.map(([x, y], i) => {
                  const s = ratedSessions[i];
                  const r = myRole === 'STUDENT' ? s.alumni_rating : s.student_rating;
                  const label = fmtLabel(s.createdAt || s.created_at);
                  return (
                    <g key={i}>
                      <line x1={x} y1={padT + innerH} x2={x} y2={padT + innerH + 5} stroke="rgba(199,196,216,0.3)" strokeWidth="1" />
                      <text x={x} y={chartH - 4} textAnchor="middle" fill="rgba(199,196,216,0.45)" fontSize="10" fontWeight="600">{label}</text>
                      <circle cx={x} cy={y} r="8" fill="rgba(255,185,95,0.12)" />
                      <circle cx={x} cy={y} r="5" fill="#ffb95f" stroke="#0b1326" strokeWidth="2" />
                      <text x={x} y={y - 12} textAnchor="middle" fill="#ffb95f" fontSize="11" fontWeight="800">{r}★</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
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
                          {new Date(s.createdAt).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' })}
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

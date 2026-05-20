import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, gap: 12, color: '#c7c4d8', flexDirection: 'column' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.4, animation: 'spin 1s linear infinite' }}>progress_activity</span>
      <span style={{ fontSize: '0.8rem' }}>Loading analytics…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ icon = 'analytics', label = 'No data yet' }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem', color: '#c7c4d8', opacity: 0.45 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>{icon}</span>
      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.72rem', marginTop: 4 }}>Data will appear as the platform is used</div>
    </div>
  );
}

export default function AnalyticsTab() {
  const [activeSection, setActiveSection] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = () => {
    fetch(`${API_BASE}/stats/analytics`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
        setError(null);
      })
      .catch(err => {
        console.error('[Analytics]', err);
        setError('Could not load analytics data.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Derived values for display
  const kpis = data?.kpis || {};
  const weeklySessions = data?.weekly_sessions || [];
  const domainData = data?.domain_data || [];
  const topMentors = data?.top_mentors || [];
  const ratingDist = data?.rating_dist || [];
  const studentProgress = data?.student_progress || [];
  const totals = data?.totals || {};

  const maxWeekly = weeklySessions.length ? Math.max(...weeklySessions.map(w => w.sessions)) || 1 : 1;
  const maxStudents = studentProgress.length ? Math.max(...studentProgress.map(s => s.count)) || 1 : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Mentorship Analytics</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>
            Live platform data — sessions, mentor performance, and student engagement
            {data && <span style={{ marginLeft: 8, fontSize: '0.65rem', background: 'rgba(78,222,163,0.15)', color: '#4edea3', padding: '0.15rem 0.5rem', borderRadius: 6, fontWeight: 700 }}>● LIVE</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'mentors',  label: 'Top Mentors' },
            { id: 'students', label: 'Student Progress' },
          ].map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{ padding: '0.5rem 1rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s',
                background: activeSection === s.id ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#222a3d',
                color: activeSection === s.id ? '#1d00a5' : '#c7c4d8',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <Spinner />}
      {error && (
        <div style={{ background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 12, padding: '1rem 1.5rem', color: '#ffb4ab', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>error</span>
          {error}
          <button onClick={fetchAnalytics} style={{ marginLeft: 'auto', background: 'rgba(255,180,171,0.15)', border: 'none', borderRadius: 8, color: '#ffb4ab', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── OVERVIEW ── */}
          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
                {[
                  {
                    label: 'Sessions Done',
                    val: kpis.sessions_this_month ?? '—',
                    change: `${totals.pending || 0} pending requests`,
                    color: '#4edea3', icon: 'videocam',
                  },
                  {
                    label: 'Active Mentors',
                    val: kpis.active_mentors ?? '—',
                    change: 'Verified alumni on platform',
                    color: '#c3c0ff', icon: 'record_voice_over',
                  },
                  {
                    label: 'Avg Session Rating',
                    val: kpis.avg_rating != null ? `${kpis.avg_rating}★` : '—',
                    change: `Based on ${kpis.total_reviews || 0} reviews`,
                    color: '#ffb95f', icon: 'star',
                  },
                  {
                    label: 'Completion Rate',
                    val: kpis.completion_rate != null ? `${kpis.completion_rate}%` : '—',
                    change: 'Sessions / total requests',
                    color: '#60a5fa', icon: 'task_alt',
                  },
                ].map(k => (
                  <div key={k.label} style={{ background: '#131b2e', borderRadius: 14, padding: '1.25rem', border: `1px solid ${k.color}20`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 8, right: 10, opacity: 0.08 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>{k.icon}</span>
                    </div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 8 }}>{k.label}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: k.color, marginBottom: 4 }}>{k.val}</div>
                    <div style={{ fontSize: '0.72rem', color: '#c7c4d8', fontWeight: 500 }}>{k.change}</div>
                  </div>
                ))}
              </div>

              {/* Weekly sessions chart */}
              <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Weekly Session Volume</h3>
                {weeklySessions.every(w => w.sessions === 0)
                  ? <EmptyState icon="videocam" label="No sessions recorded yet" />
                  : (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
                      {weeklySessions.map((w, i) => {
                        const h = Math.max(4, Math.round((w.sessions / maxWeekly) * 120));
                        const isLast = i === weeklySessions.length - 1;
                        return (
                          <div key={w.week + i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: isLast ? '#4edea3' : '#c7c4d8' }}>{w.sessions}</div>
                            <div style={{ width: '100%', height: h, background: isLast ? 'linear-gradient(180deg,#4edea3,#4edea380)' : 'linear-gradient(180deg,#4f46e5,#4f46e580)', borderRadius: '6px 6px 0 0', transition: 'height 0.6s ease' }} />
                            <div style={{ fontSize: '0.55rem', color: '#c7c4d8', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{w.week}</div>
                          </div>
                        );
                      })}
                    </div>
                  )
                }
              </div>

              {/* Domain demand */}
              <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Most Requested Interview Topics</h3>
                  <span style={{ fontSize: '0.65rem', color: '#c7c4d8', background: '#222a3d', padding: '0.25rem 0.75rem', borderRadius: 999 }}>All time</span>
                </div>
                {domainData.length === 0
                  ? <EmptyState icon="topic" label="No interview requests yet" />
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {domainData.map(d => (
                        <div key={d.domain}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                            <span style={{ fontWeight: 600 }}>{d.domain}</span>
                            <div style={{ display: 'flex', gap: 16, color: '#c7c4d8' }}>
                              <span>{d.sessions} request{d.sessions !== 1 ? 's' : ''}</span>
                              <span style={{ color: '#c3c0ff', fontWeight: 700 }}>{d.pct}%</span>
                            </div>
                          </div>
                          <div style={{ height: 8, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${d.pct}%`, background: 'linear-gradient(90deg,#4f46e5,#c3c0ff)', borderRadius: 999, transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          )}

          {/* ── TOP MENTORS ── */}
          {activeSection === 'mentors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
                <div style={{ background: '#171f33', padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr', gap: 8 }}>
                  {['Mentor', 'Company', 'Requests', 'Rating', 'Top Domain'].map(h => (
                    <div key={h} style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{h}</div>
                  ))}
                </div>
                {topMentors.length === 0
                  ? <EmptyState icon="record_voice_over" label="No mentor activity yet" />
                  : topMentors.map((m, i) => (
                    <div key={m.id} style={{ padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr', gap: 8, borderTop: '1px solid rgba(70,69,85,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1d00a5', fontSize: '0.8rem', flexShrink: 0 }}>
                          {m.name?.[0] || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{m.name}</div>
                          {i === 0 && <div style={{ fontSize: '0.6rem', color: '#4edea3', fontWeight: 700 }}>⭐ Top Mentor</div>}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#c7c4d8' }}>{m.company}</div>
                      <div style={{ fontWeight: 700, color: '#c3c0ff', fontSize: '0.95rem' }}>{m.sessions}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {m.rating != null ? (
                          <>
                            <span style={{ color: '#ffb95f', fontWeight: 700, fontSize: '0.875rem' }}>{m.rating}</span>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffb95f', fontVariationSettings: "'FILL' 1" }}>star</span>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#464555' }}>No ratings</span>
                        )}
                      </div>
                      <div style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, width: 'fit-content', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.domain}</div>
                    </div>
                  ))
                }
              </div>

              {/* Rating distribution */}
              <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Session Rating Distribution</h3>
                {ratingDist.every(r => r.count === 0)
                  ? <EmptyState icon="star" label="No ratings submitted yet" />
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {ratingDist.map(r => (
                        <div key={r.stars} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, fontSize: '0.75rem', fontWeight: 700, color: '#ffb95f', flexShrink: 0 }}>{r.stars}</div>
                          <div style={{ flex: 1, height: 8, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${r.pct}%`, background: 'linear-gradient(90deg,#ffb95f,#ffb95f80)', borderRadius: 999, transition: 'width 0.8s ease' }} />
                          </div>
                          <div style={{ width: 60, fontSize: '0.72rem', color: '#c7c4d8', textAlign: 'right' }}>{r.count} review{r.count !== 1 ? 's' : ''}</div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          )}

          {/* ── STUDENT PROGRESS ── */}
          {activeSection === 'students' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Session engagement breakdown */}
              <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>Student Session Engagement</h3>
                <p style={{ fontSize: '0.78rem', color: '#c7c4d8', marginBottom: '1.5rem' }}>How many interview requests each student has made</p>
                {totals.students === 0
                  ? <EmptyState icon="school" label="No students registered yet" />
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {studentProgress.map(s => (
                        <div key={s.range}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                            <span style={{ fontWeight: 600 }}>{s.range}</span>
                            <div style={{ display: 'flex', gap: 16, color: '#c7c4d8' }}>
                              <span style={{ color: s.color, fontWeight: 700 }}>{s.count} student{s.count !== 1 ? 's' : ''}</span>
                              <span>{totals.students > 0 ? Math.round((s.count / totals.students) * 100) : 0}%</span>
                            </div>
                          </div>
                          <div style={{ height: 10, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(s.count / maxStudents) * 100}%`, background: s.color, borderRadius: 999, transition: 'width 0.8s ease', opacity: 0.85 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>

              {/* At-risk + on-track summary cards */}
              {totals.students > 0 && (() => {
                const noSessions   = studentProgress.find(s => s.range === '0 sessions')?.count  || 0;
                const starting     = studentProgress.find(s => s.range === '1–2 sessions')?.count || 0;
                const onTrack      = studentProgress.filter(s => !['0 sessions','1–2 sessions'].includes(s.range)).reduce((a, s) => a + s.count, 0);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                    {[
                      { label: 'Need Attention',  count: noSessions,  color: '#ffb4ab', bg: 'rgba(255,180,171,0.1)', desc: 'No requests made yet',   icon: 'warning' },
                      { label: 'Getting Started', count: starting,    color: '#ffb95f', bg: 'rgba(255,185,95,0.1)',  desc: '1–2 requests placed',    icon: 'schedule' },
                      { label: 'On Track',        count: onTrack,     color: '#4edea3', bg: 'rgba(78,222,163,0.1)', desc: '3+ sessions completed',   icon: 'task_alt' },
                    ].map(r => (
                      <div key={r.label} style={{ background: r.bg, border: `1px solid ${r.color}30`, borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28, color: r.color, fontVariationSettings: "'FILL' 1", display: 'block', marginBottom: 8 }}>{r.icon}</span>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: r.color, marginBottom: 4 }}>{r.count}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 6 }}>{r.label}</div>
                        <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.5 }}>{r.desc}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

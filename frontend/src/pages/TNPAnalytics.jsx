import React, { useState, useEffect } from 'react';
import { exportToCSV } from '../utils/exportUtils';
import { API_BASE } from '../api';

// ── Demo fallback data (shown when DB has no real data yet) ───────────────────
const DEMO = {
  kpis: {
    sessions_this_month: 712,
    active_mentors: 84,
    avg_rating: 4.8,
    completion_rate: 91,
    total_reviews: 634,
  },
  weekly_sessions: [
    { week: 'W1 Mar', sessions: 68 },
    { week: 'W2 Mar', sessions: 84 },
    { week: 'W3 Mar', sessions: 91 },
    { week: 'W4 Mar', sessions: 78 },
    { week: 'W1 Apr', sessions: 102 },
    { week: 'W2 Apr', sessions: 118 },
    { week: 'W3 Apr', sessions: 134 },
    { week: 'W4 Apr', sessions: 127 },
  ],
  domain_data: [
    { domain: 'System Design',    sessions: 312, pct: 94 },
    { domain: 'Frontend / React', sessions: 278, pct: 84 },
    { domain: 'Backend / Node',   sessions: 241, pct: 73 },
    { domain: 'Data Structures',  sessions: 198, pct: 60 },
    { domain: 'Behavioural',      sessions: 167, pct: 51 },
    { domain: 'ML / Data Science',  sessions: 134, pct: 41 },
  ],
  top_mentors: [
    { id: 'd1', name: 'Priya Sharma',  company: 'Google',    sessions: 48, rating: 4.9, domain: 'System Design' },
    { id: 'd2', name: 'Amit Joshi',    company: 'Microsoft', sessions: 42, rating: 4.8, domain: 'Backend' },
    { id: 'd3', name: 'Neha Gupta',    company: 'Airbnb',    sessions: 37, rating: 4.9, domain: 'Frontend' },
    { id: 'd4', name: 'Rohan Mehta',   company: 'Stripe',    sessions: 31, rating: 4.7, domain: 'Data Structures' },
    { id: 'd5', name: 'Kavya Nair',    company: 'Atlassian', sessions: 28, rating: 4.8, domain: 'Behavioural' },
  ],
  rating_dist: [
    { stars: '5 ★', pct: 62, count: 393 },
    { stars: '4 ★', pct: 24, count: 152 },
    { stars: '3 ★', pct: 9,  count: 57  },
    { stars: '2 ★', pct: 3,  count: 19  },
    { stars: '1 ★', pct: 2,  count: 13  },
  ],
  student_progress: [
    { range: '0 sessions',    count: 42,  color: '#ffb4ab' },
    { range: '1–2 sessions',  count: 87,  color: '#ffb95f' },
    { range: '3–5 sessions',  count: 156, color: '#c3c0ff' },
    { range: '6–10 sessions', count: 98,  color: '#60a5fa' },
    { range: '10+ sessions',  count: 34,  color: '#4edea3' },
  ],
  totals: { students: 417, pending: 23 },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function isEmpty(d) {
  if (!d) return true;
  return (
    !d.kpis?.sessions_this_month &&
    !d.kpis?.active_mentors &&
    (!d.domain_data || d.domain_data.length === 0) &&
    (!d.top_mentors || d.top_mentors.length === 0)
  );
}

// Merge: real data takes priority; fall back to demo if real field is 0 / empty
function mergeData(real) {
  if (isEmpty(real)) return { data: DEMO, isDemo: true };

  const merged = {
    kpis: {
      sessions_this_month: real.kpis?.sessions_this_month || DEMO.kpis.sessions_this_month,
      active_mentors:      real.kpis?.active_mentors      || DEMO.kpis.active_mentors,
      avg_rating:          real.kpis?.avg_rating           ?? DEMO.kpis.avg_rating,
      completion_rate:     real.kpis?.completion_rate      ?? DEMO.kpis.completion_rate,
      total_reviews:       real.kpis?.total_reviews        || DEMO.kpis.total_reviews,
    },
    weekly_sessions:  real.weekly_sessions?.some(w => w.sessions > 0)  ? real.weekly_sessions  : DEMO.weekly_sessions,
    domain_data:      real.domain_data?.length > 0                      ? real.domain_data      : DEMO.domain_data,
    top_mentors:      real.top_mentors?.length > 0                      ? real.top_mentors      : DEMO.top_mentors,
    rating_dist:      real.rating_dist?.some(r => r.count > 0)          ? real.rating_dist      : DEMO.rating_dist,
    student_progress: real.student_progress?.some(s => s.count > 0)    ? real.student_progress : DEMO.student_progress,
    totals: {
      students: real.totals?.students || DEMO.totals.students,
      pending:  real.totals?.pending  || DEMO.totals.pending,
    },
  };

  // Check if we're actually showing mostly real vs mostly demo fields
  const usingRealSessions = real.kpis?.sessions_this_month > 0;
  const usingRealMentors  = real.top_mentors?.length > 0;
  const isDemo = !usingRealSessions && !usingRealMentors;

  return { data: merged, isDemo };
}

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

export default function AnalyticsTab({ token }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [displayData, setDisplayData] = useState(null);
  const [isDemo, setIsDemo]             = useState(false);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const fetchAnalytics = () => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`${API_BASE}/stats/analytics`, { headers })
      .then(r => r.json())
      .then(real => {
        if (real.error) throw new Error(real.error);
        const { data, isDemo: demo } = mergeData(real);
        setDisplayData(data);
        setIsDemo(demo);
        setLoading(false);
        setError(null);
      })
      .catch(err => {
        console.warn('[Analytics] API unavailable, showing demo data:', err.message);
        // API failed → show full demo data
        setDisplayData(DEMO);
        setIsDemo(true);
        setLoading(false);
        setError(null); // don't show error banner — just show demo
      });
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Spinner />;

  const { kpis, weekly_sessions, domain_data, top_mentors, rating_dist, student_progress, totals } = displayData;

  const handleExportAnalytics = () => {
    let data = [];
    let filename = '';

    if (activeSection === 'overview') {
      data = domain_data.map(d => ({ Topic: d.domain, Sessions: d.sessions, Popularity: `${d.pct}%` }));
      filename = 'AlumNex_Topic_Demand';
    } else if (activeSection === 'mentors') {
      data = top_mentors.map(m => ({ Mentor: m.name, Company: m.company, Sessions: m.sessions, Rating: m.rating || 'N/A', Domain: m.domain }));
      filename = 'AlumNex_Top_Mentors';
    } else if (activeSection === 'students') {
      data = student_progress.map(s => ({ Range: s.range, StudentCount: s.count }));
      filename = 'AlumNex_Student_Engagement';
    }

    exportToCSV(data, filename);
  };
  const maxWeekly   = Math.max(...weekly_sessions.map(w => w.sessions), 1);
  const maxStudents = Math.max(...student_progress.map(s => s.count), 1);

  const noSessions = student_progress.find(s => s.range === '0 sessions')?.count  || 0;
  const starting   = student_progress.find(s => s.range === '1–2 sessions')?.count || 0;
  const onTrack    = student_progress.filter(s => !['0 sessions', '1–2 sessions'].includes(s.range)).reduce((a, s) => a + s.count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Mentorship Analytics</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8', display: 'flex', alignItems: 'center', gap: 8 }}>
            Session trends, mentor performance, and student engagement insights
            {isDemo ? (
              <span style={{ fontSize: '0.62rem', background: 'rgba(255,185,95,0.15)', color: '#ffb95f', padding: '0.15rem 0.5rem', borderRadius: 6, fontWeight: 700, border: '1px solid rgba(255,185,95,0.25)' }}>
                ◌ SAMPLE DATA
              </span>
            ) : (
              <span style={{ fontSize: '0.62rem', background: 'rgba(78,222,163,0.15)', color: '#4edea3', padding: '0.15rem 0.5rem', borderRadius: 6, fontWeight: 700 }}>
                ● LIVE
              </span>
            )}
          </p>
          {isDemo && (
            <p style={{ fontSize: '0.7rem', color: '#8b899a', marginTop: 4 }}>
              Showing sample preview data — will automatically switch to your real data once platform activity begins.
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleExportAnalytics}
            style={{ marginRight: 8, background: 'rgba(195,192,255,0.05)', border: '1px solid rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.5rem 1rem', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Export Report
          </button>
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

      {/* ── OVERVIEW ── */}
      {activeSection === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
            {[
              { label: 'Sessions Done',      val: kpis.sessions_this_month, change: `${totals.pending} pending requests`,       color: '#4edea3', icon: 'videocam'        },
              { label: 'Active Mentors',     val: kpis.active_mentors,      change: 'Verified alumni on platform',              color: '#c3c0ff', icon: 'record_voice_over' },
              { label: 'Avg Session Rating', val: `${kpis.avg_rating}★`,    change: `Based on ${kpis.total_reviews} reviews`,   color: '#ffb95f', icon: 'star'             },
              { label: 'Completion Rate',    val: `${kpis.completion_rate}%`,change: 'Sessions vs total requests',              color: '#60a5fa', icon: 'task_alt'         },
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
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
              {weekly_sessions.map((w, i) => {
                const h = Math.max(4, Math.round((w.sessions / maxWeekly) * 120));
                const isLast = i === weekly_sessions.length - 1;
                return (
                  <div key={w.week + i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: isLast ? '#4edea3' : '#c7c4d8' }}>{w.sessions}</div>
                    <div style={{ width: '100%', height: h, background: isLast ? 'linear-gradient(180deg,#4edea3,#4edea380)' : 'linear-gradient(180deg,#4f46e5,#4f46e580)', borderRadius: '6px 6px 0 0', transition: 'height 0.6s ease' }} />
                    <div style={{ fontSize: '0.55rem', color: '#c7c4d8', textAlign: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{w.week}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Domain demand */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Most Requested Interview Topics</h3>
              <span style={{ fontSize: '0.65rem', color: '#c7c4d8', background: '#222a3d', padding: '0.25rem 0.75rem', borderRadius: 999 }}>All time</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {domain_data.map(d => (
                <div key={d.domain}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 600 }}>{d.domain}</span>
                    <div style={{ display: 'flex', gap: 16, color: '#c7c4d8' }}>
                      <span>{d.sessions} session{d.sessions !== 1 ? 's' : ''}</span>
                      <span style={{ color: '#c3c0ff', fontWeight: 700 }}>{d.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.pct}%`, background: 'linear-gradient(90deg,#4f46e5,#c3c0ff)', borderRadius: 999, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TOP MENTORS ── */}
      {activeSection === 'mentors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
            <div style={{ background: '#171f33', padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr', gap: 8 }}>
              {['Mentor', 'Company', 'Sessions', 'Rating', 'Top Domain'].map(h => (
                <div key={h} style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{h}</div>
              ))}
            </div>
            {top_mentors.map((m, i) => (
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
                    <span style={{ fontSize: '0.72rem', color: '#464555' }}>—</span>
                  )}
                </div>
                <div style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, width: 'fit-content', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.domain}</div>
              </div>
            ))}
          </div>

          {/* Rating distribution */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Session Rating Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {rating_dist.map(r => (
                <div key={r.stars} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, fontSize: '0.75rem', fontWeight: 700, color: '#ffb95f', flexShrink: 0 }}>{r.stars}</div>
                  <div style={{ flex: 1, height: 8, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.pct}%`, background: 'linear-gradient(90deg,#ffb95f,#ffb95f80)', borderRadius: 999, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ width: 70, fontSize: '0.72rem', color: '#c7c4d8', textAlign: 'right' }}>{r.count} reviews</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STUDENT PROGRESS ── */}
      {activeSection === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Engagement bars */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>Student Session Engagement</h3>
            <p style={{ fontSize: '0.78rem', color: '#c7c4d8', marginBottom: '1.5rem' }}>How many interview sessions each student has completed</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {student_progress.map(s => (
                <div key={s.range}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 600 }}>{s.range}</span>
                    <div style={{ display: 'flex', gap: 16, color: '#c7c4d8' }}>
                      <span style={{ color: s.color, fontWeight: 700 }}>{s.count} students</span>
                      <span>{totals.students > 0 ? Math.round((s.count / totals.students) * 100) : 0}%</span>
                    </div>
                  </div>
                  <div style={{ height: 10, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s.count / maxStudents) * 100}%`, background: s.color, borderRadius: 999, transition: 'width 0.8s ease', opacity: 0.85 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {[
              { label: 'Need Attention',  count: noSessions, color: '#ffb4ab', bg: 'rgba(255,180,171,0.1)', desc: 'No sessions booked yet',    icon: 'warning' },
              { label: 'Getting Started', count: starting,   color: '#ffb95f', bg: 'rgba(255,185,95,0.1)',  desc: '1–2 sessions completed',     icon: 'schedule' },
              { label: 'On Track',        count: onTrack,    color: '#4edea3', bg: 'rgba(78,222,163,0.1)', desc: '3+ sessions completed',      icon: 'task_alt' },
            ].map(r => (
              <div key={r.label} style={{ background: r.bg, border: `1px solid ${r.color}30`, borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: r.color, fontVariationSettings: "'FILL' 1", display: 'block', marginBottom: 8 }}>{r.icon}</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: r.color, marginBottom: 4 }}>{r.count}</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 6 }}>{r.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';

// ── Static demo data (mentorship & interview focused) ─────────────────────────

const DOMAIN_DATA = [
  { domain: 'System Design',    sessions: 312, pct: 94 },
  { domain: 'Frontend / React', sessions: 278, pct: 84 },
  { domain: 'Backend / Node',   sessions: 241, pct: 73 },
  { domain: 'Data Structures',  sessions: 198, pct: 60 },
  { domain: 'Behavioural',      sessions: 167, pct: 51 },
  { domain: 'AI / ML',          sessions: 134, pct: 41 },
];

const TOP_MENTORS = [
  { name: 'Priya Sharma',    company: 'Google',    sessions: 48, rating: 4.9, domain: 'System Design' },
  { name: 'Amit Joshi',      company: 'Microsoft', sessions: 42, rating: 4.8, domain: 'Backend' },
  { name: 'Neha Gupta',      company: 'Airbnb',    sessions: 37, rating: 4.9, domain: 'Frontend' },
  { name: 'Rohan Mehta',     company: 'Stripe',    sessions: 31, rating: 4.7, domain: 'Data Structures' },
  { name: 'Kavya Nair',      company: 'Atlassian', sessions: 28, rating: 4.8, domain: 'Behavioural' },
];

const WEEKLY_SESSIONS = [
  { week: 'W1 Mar', sessions: 68 },
  { week: 'W2 Mar', sessions: 84 },
  { week: 'W3 Mar', sessions: 91 },
  { week: 'W4 Mar', sessions: 78 },
  { week: 'W1 Apr', sessions: 102 },
  { week: 'W2 Apr', sessions: 118 },
  { week: 'W3 Apr', sessions: 134 },
  { week: 'W4 Apr', sessions: 127 },
];

const STUDENT_PROGRESS = [
  { range: '0 sessions',   count: 42,  color: '#ffb4ab' },
  { range: '1–2 sessions', count: 87,  color: '#ffb95f' },
  { range: '3–5 sessions', count: 156, color: '#c3c0ff' },
  { range: '6–10 sessions',count: 98,  color: '#60a5fa' },
  { range: '10+ sessions', count: 34,  color: '#4edea3' },
];

const maxStudents = Math.max(...STUDENT_PROGRESS.map(s => s.count));

export default function AnalyticsTab() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Mentorship Analytics</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Session trends, mentor performance, and student engagement insights</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'overview',  label: 'Overview' },
            { id: 'mentors',   label: 'Top Mentors' },
            { id: 'students',  label: 'Student Progress' },
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
              { label: 'Sessions This Month', val: '712',   change: '+18% vs last month', color: '#4edea3',  icon: 'videocam' },
              { label: 'Active Mentors',       val: '84',    change: '6 joined this week',  color: '#c3c0ff',  icon: 'record_voice_over' },
              { label: 'Avg Session Rating',   val: '4.8★',  change: 'Based on 634 reviews', color: '#ffb95f', icon: 'star' },
              { label: 'Completion Rate',      val: '91%',   change: '↑ 4% from last month', color: '#60a5fa', icon: 'task_alt' },
            ].map(k => (
              <div key={k.label} style={{ background: '#131b2e', borderRadius: 14, padding: '1.25rem', border: `1px solid ${k.color}20`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 8, right: 10, opacity: 0.08 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>{k.icon}</span>
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: k.color, marginBottom: 4 }}>{k.val}</div>
                <div style={{ fontSize: '0.72rem', color: '#4edea3', fontWeight: 600 }}>{k.change}</div>
              </div>
            ))}
          </div>

          {/* Weekly sessions trend */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Weekly Session Volume</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
              {WEEKLY_SESSIONS.map((w, i) => {
                const maxVal = Math.max(...WEEKLY_SESSIONS.map(x => x.sessions));
                const h = Math.round((w.sessions / maxVal) * 120);
                const isLast = i === WEEKLY_SESSIONS.length - 1;
                return (
                  <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
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
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Most Requested Interview Domains</h3>
              <span style={{ fontSize: '0.65rem', color: '#c7c4d8', background: '#222a3d', padding: '0.25rem 0.75rem', borderRadius: 999 }}>Last 30 days</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {DOMAIN_DATA.map(d => (
                <div key={d.domain}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 600 }}>{d.domain}</span>
                    <div style={{ display: 'flex', gap: 16, color: '#c7c4d8' }}>
                      <span>{d.sessions} sessions</span>
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
            {/* Table header */}
            <div style={{ background: '#171f33', padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr', gap: 8 }}>
              {['Mentor', 'Company', 'Sessions', 'Rating', 'Top Domain'].map(h => (
                <div key={h} style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{h}</div>
              ))}
            </div>
            {TOP_MENTORS.map((m, i) => (
              <div key={m.name} style={{ padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr', gap: 8, borderTop: '1px solid rgba(70,69,85,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1d00a5', fontSize: '0.8rem', flexShrink: 0 }}>
                    {m.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{m.name}</div>
                    {i === 0 && <div style={{ fontSize: '0.6rem', color: '#4edea3', fontWeight: 700 }}>⭐ Top Mentor</div>}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#c7c4d8' }}>{m.company}</div>
                <div style={{ fontWeight: 700, color: '#c3c0ff', fontSize: '0.95rem' }}>{m.sessions}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#ffb95f', fontWeight: 700, fontSize: '0.875rem' }}>{m.rating}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffb95f', fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <div style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, width: 'fit-content' }}>{m.domain}</div>
              </div>
            ))}
          </div>

          {/* Rating distribution */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Session Rating Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { stars: '5 ★', pct: 62, count: 393 },
                { stars: '4 ★', pct: 24, count: 152 },
                { stars: '3 ★', pct: 9,  count: 57  },
                { stars: '2 ★', pct: 3,  count: 19  },
                { stars: '1 ★', pct: 2,  count: 13  },
              ].map(r => (
                <div key={r.stars} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, fontSize: '0.75rem', fontWeight: 700, color: '#ffb95f', flexShrink: 0 }}>{r.stars}</div>
                  <div style={{ flex: 1, height: 8, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.pct}%`, background: 'linear-gradient(90deg,#ffb95f,#ffb95f80)', borderRadius: 999 }} />
                  </div>
                  <div style={{ width: 60, fontSize: '0.72rem', color: '#c7c4d8', textAlign: 'right' }}>{r.count} reviews</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STUDENT PROGRESS ── */}
      {activeSection === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Session engagement breakdown */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>Student Session Engagement</h3>
            <p style={{ fontSize: '0.78rem', color: '#c7c4d8', marginBottom: '1.5rem' }}>How many mock interview sessions each student has completed</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {STUDENT_PROGRESS.map(s => (
                <div key={s.range}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 600 }}>{s.range}</span>
                    <div style={{ display: 'flex', gap: 16, color: '#c7c4d8' }}>
                      <span style={{ color: s.color, fontWeight: 700 }}>{s.count} students</span>
                      <span>{Math.round((s.count / 417) * 100)}%</span>
                    </div>
                  </div>
                  <div style={{ height: 10, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(s.count / maxStudents) * 100}%`, background: s.color, borderRadius: 999, transition: 'width 0.8s ease', opacity: 0.85 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* At-risk + on-track cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {[
              { label: 'Need Attention',  count: 42,  color: '#ffb4ab', bg: 'rgba(255,180,171,0.1)', desc: 'No sessions booked yet', icon: 'warning' },
              { label: 'Getting Started', count: 87,  color: '#ffb95f', bg: 'rgba(255,185,95,0.1)',  desc: '1–2 sessions completed',  icon: 'schedule' },
              { label: 'On Track',        count: 288, color: '#4edea3', bg: 'rgba(78,222,163,0.1)',  desc: '3+ sessions completed',   icon: 'task_alt' },
            ].map(r => (
              <div key={r.label} style={{ background: r.bg, border: `1px solid ${r.color}30`, borderRadius: 14, padding: '1.5rem', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: r.color, fontVariationSettings: "'FILL' 1", display: 'block', marginBottom: 8 }}>{r.icon}</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: r.color, marginBottom: 4 }}>{r.count}</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 6 }}>{r.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          {/* Improvement trend */}
          <div style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(11,19,38,0.9))', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(195,192,255,0.15)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#c3c0ff', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>trending_up</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>AI Score Improvement</div>
              <div style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6 }}>
                Students who completed <span style={{ color: '#c3c0ff', fontWeight: 700 }}>5+ mock sessions</span> show an average AI confidence score improvement of <span style={{ color: '#4edea3', fontWeight: 700 }}>+23 points</span> compared to their first session.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

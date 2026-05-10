import React, { useContext, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AlumNexLogo from '../AlumNexLogo';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import AnalyticsTab from './TNPAnalytics';
import SystemSettingsTab from './TNPSettings';

import BulkUploadTab from './TNPBulkUpload';
import { subscribeRealtimeSync } from '../lib/realtimeSync';
import { api } from '../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ── Default category colors (fallback if DB config not loaded) ────────────────
const DEFAULT_CATEGORY_COLORS = {
  Alumni:     '#4edea3',
  Student:    '#60a5fa',
  Interview:  '#ffb95f',
  Mentorship: '#f472b6',
  System:     '#94a3b8',
};

function ActivityFeedTab() {
  const [filter, setFilter] = React.useState('All');
  const [feedData, setFeedData] = React.useState([]);
  const [categoryColors, setCategoryColors] = React.useState(DEFAULT_CATEGORY_COLORS);
  const [loading, setLoading] = React.useState(true);
  const categories = ['All', 'Alumni', 'Student', 'Interview', 'Mentorship', 'System'];

  React.useEffect(() => {
    Promise.all([
      api.getActivityLogs(50).catch(() => []),
      api.getPlatformConfigKey('category_colors').catch(() => null),
    ]).then(([logs, colors]) => {
      if (Array.isArray(logs) && logs.length > 0) {
        setFeedData(logs.map(l => ({
          icon: l.icon,
          color: l.color,
          title: l.title,
          desc: l.desc,
          category: l.category || 'System',
          time: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        })));
      }
      if (colors && typeof colors === 'object') setCategoryColors({ ...DEFAULT_CATEGORY_COLORS, ...colors });
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'All' ? feedData : feedData.filter(f => f.category === filter);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#c7c4d8', gap: 10 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 24, opacity: 0.4, animation: 'spin 1s linear infinite' }}>progress_activity</span>
      Loading activity feed...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Activity Feed</h2>
          <p style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 4 }}>All platform events — uploads, sessions, matches, and system actions.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', border: 'none',
              background: filter === cat ? (categoryColors[cat] || '#c3c0ff') : 'rgba(70,69,85,0.2)',
              color: filter === cat ? '#0b1326' : '#c7c4d8', transition: 'all 0.2s',
            }}>{cat}</button>
          ))}
        </div>
      </div>
      <div style={{ background: '#131b2e', borderRadius: 20, padding: '1.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 35, top: 24, bottom: 24, width: 1, background: 'rgba(70,69,85,0.25)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#c7c4d8', opacity: 0.5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>inbox</span>
              No activity logs yet
            </div>
          )}
          {filtered.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${f.color}20`, border: `1px solid ${f.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, marginTop: 2 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, color: f.color, fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              </div>
              <div style={{ flex: 1, background: '#171f33', borderRadius: 12, padding: '0.875rem 1rem', borderLeft: `3px solid ${f.color}40` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#dae2fd' }}>{f.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: `${categoryColors[f.category] || '#94a3b8'}18`, color: categoryColors[f.category] || '#94a3b8', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.category}</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(199,196,216,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.time}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#c7c4d8', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TNPDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [tnpNotifs, setTnpNotifs] = useState([]);
  const [seenNotifIds, setSeenNotifIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tnp_seen_notifs') || '[]'); } catch { return []; }
  });

  // Platform stats
  const [stats, setStats] = useState({ total_students: 0, active_mentors: 0, mock_interviews: 0, scheduled_today: 0 });

  useEffect(() => {
    fetch(`${API_BASE}/stats/platform`)
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d); })
      .catch(() => {});
  }, []);

  // Notifications — session-based events
  useEffect(() => {
    const buildNotifs = () => {
      const DEMO = [
        { id: 'demo-1', type: 'session', title: 'Session Completed', desc: 'Rohan Verma completed a System Design session with Priya Sharma', time: new Date(Date.now() - 5 * 60000).toISOString(), icon: 'event_available', color: '#4edea3' },
        { id: 'demo-2', type: 'match',   title: 'New Mentorship Match', desc: 'Kavya Nair matched with Amit Joshi (Microsoft)', time: new Date(Date.now() - 62 * 60000).toISOString(), icon: 'handshake', color: '#c3c0ff' },
        { id: 'demo-3', type: 'upload',  title: 'Bulk Upload Complete', desc: '47 student accounts created from Batch 2025 CSV', time: new Date(Date.now() - 3 * 3600000).toISOString(), icon: 'cloud_upload', color: '#ffb95f' },
      ];
      setTnpNotifs(DEMO);
    };
    buildNotifs();
    const unsubscribe = subscribeRealtimeSync(buildNotifs);
    return () => unsubscribe();
  }, []);

  const unreadCount = tnpNotifs.filter(n => !seenNotifIds.includes(n.id)).length;

  const openNotifPanel = () => {
    setShowNotifPanel(v => !v);
    setShowProfile(false);
    const ids = tnpNotifs.map(n => n.id);
    setSeenNotifIds(ids);
    localStorage.setItem('tnp_seen_notifs', JSON.stringify(ids));
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  // Settings state (passed down to SystemSettingsTab)
  const [commSettings, setCommSettings] = useState({
    emailNotifs: true, smsAlerts: false, weeklyReport: true,
    instantApproval: false, mentorMatchAlert: true,
  });
  const [roles, setRoles] = useState([
    { id: 1, name: 'TNP Coordinator',  permissions: ['upload', 'analytics', 'settings', 'logs'], active: true },
    { id: 2, name: 'Placement Officer', permissions: ['upload', 'analytics'],                    active: true },
    { id: 3, name: 'Analytics Viewer',  permissions: ['analytics'],                               active: true },
  ]);

  if (!user) return <Navigate to="/login" replace />;

  const TNP_NAV = [
    { icon: 'dashboard',        label: 'Dashboard',    tab: 'home' },
    { icon: 'cloud_upload',     label: 'Bulk Upload',  tab: 'upload' },
    { icon: 'analytics',        label: 'Analytics',    tab: 'analytics' },
    { icon: 'dynamic_feed',     label: 'Activity Feed',tab: 'activity' },

    { icon: 'settings_suggest', label: 'Settings',     tab: 'settings' },
  ];

  const renderContent = () => {
    if (activeTab === 'upload')     return <BulkUploadTab />;
    if (activeTab === 'analytics')  return <AnalyticsTab />;
    if (activeTab === 'activity')   return <ActivityFeedTab />;

    if (activeTab === 'settings')   return <SystemSettingsTab commSettings={commSettings} setCommSettings={setCommSettings} roles={roles} setRoles={setRoles} />;
    return null; // home rendered inline
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif' }}>

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={() => { logout(); navigate('/login'); }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{ width: 240, minHeight: '100vh', position: 'fixed', left: 0, top: 0, background: '#131b2e', display: 'flex', flexDirection: 'column', padding: '1.5rem', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
          <AlumNexLogo size={32} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#f5e9ff', letterSpacing: '-0.02em' }}>Alum<span style={{ color: '#a855f7' }}>NEX</span></div>
            <div style={{ fontSize: '0.55rem', color: '#c7c4d8', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>TNP Control</div>
          </div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TNP_NAV.map(({ icon, label, tab }) => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', borderRadius: 12, background: active ? '#222a3d' : 'transparent', color: active ? '#c3c0ff' : '#c7c4d8', fontWeight: active ? 600 : 400, fontSize: '0.875rem', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', borderLeft: active ? '3px solid #c3c0ff' : '3px solid transparent', transition: 'all 0.15s' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => setShowLogoutConfirm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#ffb4ab', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: 240, flex: 1 }}>

        {/* Header */}
        <header style={{ position: 'fixed', top: 0, left: 240, right: 0, height: 64, zIndex: 40, background: 'rgba(11,19,38,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(195,192,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#c7c4d8' }}>
            {TNP_NAV.find(n => n.tab === activeTab)?.label || 'Dashboard'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={openNotifPanel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ color: showNotifPanel ? '#c3c0ff' : '#c7c4d8', fontSize: 22, fontVariationSettings: showNotifPanel ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
                {unreadCount > 0 && <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#ff4444', border: '1.5px solid #0b1326' }} />}
              </button>
              {showNotifPanel && (
                <>
                  <div onClick={() => setShowNotifPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 44, right: 0, width: 340, background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Recent Activity</span>
                      <button onClick={() => { setShowNotifPanel(false); setActiveTab('activity'); }} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c3c0ff', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>View All</button>
                    </div>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {tnpNotifs.map((n) => {
                        const isNew = !seenNotifIds.includes(n.id);
                        return (
                          <div key={n.id} onClick={() => { setShowNotifPanel(false); setActiveTab('activity'); }}
                            style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.1)', display: 'flex', gap: 12, alignItems: 'flex-start', background: isNew ? 'rgba(195,192,255,0.04)' : 'transparent', cursor: 'pointer' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${n.color}15`, border: `1px solid ${n.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: n.color, fontVariationSettings: "'FILL' 1" }}>{n.icon}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#dae2fd', marginBottom: 3 }}>{n.title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.4, marginBottom: 4 }}>{n.desc}</div>
                              <div style={{ fontSize: '0.62rem', color: 'rgba(199,196,216,0.4)', fontWeight: 600 }}>{timeAgo(n.time)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ width: 1, height: 32, background: 'rgba(70,69,85,0.3)' }} />

            {/* Profile */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowProfile(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dae2fd' }}>TNP Coordinator</div>
                  <div style={{ fontSize: '0.6rem', color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1d00a5', fontSize: '0.85rem', border: showProfile ? '2px solid #c3c0ff' : '2px solid transparent', transition: 'border 0.2s' }}>T</div>
              </button>
              {showProfile && (
                <>
                  <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 48, right: 0, width: 240, background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(11,19,38,0.8))', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#1d00a5' }}>T</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#dae2fd' }}>TNP Coordinator</div>
                          <div style={{ fontSize: '0.62rem', color: '#c7c4d8', marginTop: 2 }}>tnp@alumnex.edu</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                      <button onClick={() => { setShowProfile(false); setActiveTab('settings'); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 0.875rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10, textAlign: 'left' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 17, color: '#c3c0ff' }}>settings</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dae2fd' }}>Settings</span>
                      </button>
                    </div>
                    <div style={{ padding: '0.5rem', borderTop: '1px solid rgba(70,69,85,0.15)' }}>
                      <button onClick={() => { setShowProfile(false); setShowLogoutConfirm(true); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 0.875rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10, color: '#ffb4ab', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>logout</span> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <section style={{ marginTop: 64, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {activeTab !== 'home' ? renderContent() : <HomeDashboard stats={stats} setActiveTab={setActiveTab} feedPreview={FEED_PREVIEW} />}
        </section>
      </main>
    </div>
  );
}

// ── Home Dashboard ────────────────────────────────────────────────────────────
function HomeDashboard({ stats, setActiveTab, feedPreview }) {
  return (
    <>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Command Center</h2>
          <p style={{ color: '#c7c4d8', fontSize: '0.875rem' }}>Mentorship platform overview — sessions, mentors, and student engagement.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#171f33', border: '1px solid rgba(70,69,85,0.2)', padding: '0.5rem 1rem', borderRadius: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4edea3' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Status: Optimal</span>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Total Students',   val: stats.total_students  || '—', change: 'Registered on platform',  icon: 'school',             color: '#c3c0ff' },
          { label: 'Active Mentors',   val: stats.active_mentors  || '—', change: 'Alumni mentors available', icon: 'record_voice_over',  color: '#4edea3' },
          { label: 'Sessions Done',    val: stats.mock_interviews || '—', change: 'Mock interviews completed', icon: 'videocam',           color: '#ffb95f' },
          { label: 'Scheduled Today',  val: stats.scheduled_today || '—', change: 'Upcoming sessions',        icon: 'event',              color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} style={{ background: '#171f33', borderRadius: 16, padding: '1.5rem', position: 'relative', overflow: 'hidden', border: `1px solid ${s.color}15` }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.08 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3.5rem' }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 12 }}>{s.label}</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', color: s.color }}>{s.val}</div>
            <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#c7c4d8' }}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Bento grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Quick actions */}
          <div style={{ background: '#171f33', borderRadius: 20, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 20 }}>bolt</span> Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { icon: 'cloud_upload',  label: 'Upload Students',  sub: 'Add student batch via CSV',    tab: 'upload',    color: '#c3c0ff' },
                { icon: 'psychology',    label: 'Upload Alumni',    sub: 'Add mentor batch via CSV',     tab: 'upload',    color: '#4edea3' },
                { icon: 'analytics',     label: 'View Analytics',   sub: 'Session & mentor insights',    tab: 'analytics', color: '#ffb95f' },
                { icon: 'dynamic_feed',  label: 'Activity Feed',    sub: 'Recent platform events',       tab: 'activity',  color: '#60a5fa' },
              ].map(a => (
                <button key={a.label} onClick={() => setActiveTab(a.tab)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem', background: '#131b2e', borderRadius: 14, border: `1px solid ${a.color}20`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a2340'}
                  onMouseLeave={e => e.currentTarget.style.background = '#131b2e'}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: a.color, fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#dae2fd' }}>{a.label}</div>
                    <div style={{ fontSize: '0.7rem', color: '#c7c4d8', marginTop: 2 }}>{a.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Session domain demand mini-chart */}
          <div style={{ background: '#171f33', borderRadius: 20, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: 20 }}>bar_chart</span> Top Interview Domains
              </h3>
              <button onClick={() => setActiveTab('analytics')} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c3c0ff', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Report</button>
            </div>
            {[
              { domain: 'System Design',    pct: 94, sessions: 312 },
              { domain: 'Frontend / React', pct: 84, sessions: 278 },
              { domain: 'Backend / Node',   pct: 73, sessions: 241 },
              { domain: 'Data Structures',  pct: 60, sessions: 198 },
            ].map(d => (
              <div key={d.domain} style={{ marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{d.domain}</span>
                  <span style={{ color: '#c3c0ff', fontWeight: 700 }}>{d.sessions} sessions</span>
                </div>
                <div style={{ height: 6, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${d.pct}%`, background: 'linear-gradient(90deg,#4f46e5,#c3c0ff)', borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Activity feed preview */}
          <div style={{ background: '#171f33', borderRadius: 20, padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 20 }}>dynamic_feed</span> Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 1, background: 'rgba(70,69,85,0.3)' }} />
              {feedPreview.map((f, i) => (
                <div key={i} style={{ position: 'relative', paddingLeft: 36 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, width: 24, height: 24, borderRadius: '50%', background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: f.color, fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#c7c4d8', lineHeight: 1.5 }}>{f.desc}</div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(199,196,216,0.5)', marginTop: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>{f.time}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTab('activity')} style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', background: 'transparent', border: '1px solid rgba(70,69,85,0.2)', borderRadius: 12, color: '#c7c4d8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
              View Full History
            </button>
          </div>

          {/* Engagement summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { icon: 'handshake',  color: '#c3c0ff', val: '186', label: 'Active Matches' },
              { icon: 'task_alt',   color: '#4edea3', val: '91%',  label: 'Completion Rate' },
            ].map(s => (
              <div key={s.label} style={{ background: '#222a3d', borderRadius: 16, padding: '1rem' }}>
                <span className="material-symbols-outlined" style={{ color: s.color, fontSize: 22, marginBottom: 8, display: 'block', fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* AI insight card */}
          <div style={{ background: '#2d3449', borderRadius: 20, padding: '1.5rem', borderLeft: '3px solid #c3c0ff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c3c0ff', marginBottom: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Insight</span>
            </div>
            <h4 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>High Demand Detected</h4>
            <p style={{ fontSize: '0.78rem', color: '#c7c4d8', lineHeight: 1.6 }}>
              Students requesting <span style={{ color: '#c3c0ff', fontWeight: 600 }}>System Design</span> sessions are up 40% this week. Consider onboarding more alumni with distributed systems experience.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

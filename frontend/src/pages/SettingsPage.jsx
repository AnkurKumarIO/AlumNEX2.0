import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateUserProfile } from '../lib/db';
import { api } from '../api';

const NOTIF_ITEMS = [
  { key: 'interview_requests', label: 'Interview Requests', desc: 'When a student sends you a booking request' },
  { key: 'session_reminders', label: 'Session Reminders', desc: '30 minutes before a scheduled session' },
  { key: 'messages',          label: 'New Messages',       desc: 'When you receive a direct message' },
  { key: 'platform_updates',  label: 'Platform Updates',   desc: 'New features and announcements' },
  { key: 'weekly_digest',     label: 'Weekly Digest',      desc: 'Summary of your activity every Monday' },
];

export default function SettingsPage({ role }) {
  const { user, login } = useContext(AuthContext);
  const resumeInputRef = useRef(null);
  const userRole = role || user?.role || 'STUDENT';
  const isAlumni = userRole === 'ALUMNI';

  const savedProfile = JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
  const savedNotifs  = JSON.parse(localStorage.getItem('alumnex_notifs')  || '{}');

  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Google Calendar OAuth state
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleDisconnecting, setGoogleDisconnecting] = useState(false);
  const [googleStatusMsg, setGoogleStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // Check Google Calendar connection status on mount (alumni only)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleStatus = params.get('google_status');
    if (googleStatus === 'success') {
      setGoogleStatusMsg({ type: 'success', text: 'Google Calendar connected successfully!' });
      // Clean up URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (googleStatus === 'error') {
      const msg = params.get('message') || 'Connection failed. Please try again.';
      setGoogleStatusMsg({ type: 'error', text: msg });
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Auto-dismiss status message after 5 seconds
    if (googleStatus) {
      setTimeout(() => setGoogleStatusMsg(null), 5000);
    }

    if (isAlumni && user?.id) {
      api.googleCalendarStatus(user.id)
        .then(data => {
          setGoogleConnected(data.connected === true);
          if (data.googleEmail) setGoogleEmail(data.googleEmail);
        })
        .catch(() => setGoogleConnected(false))
        .finally(() => setGoogleLoading(false));
    } else {
      setGoogleLoading(false);
    }
  }, [isAlumni, user?.id]);

  const handleGoogleDisconnect = async () => {
    if (!user?.id) return;
    setGoogleDisconnecting(true);
    try {
      await api.googleCalendarDisconnect(user.id);
      setGoogleConnected(false);
      setGoogleEmail('');
      setGoogleStatusMsg({ type: 'success', text: 'Google Calendar disconnected.' });
      setTimeout(() => setGoogleStatusMsg(null), 3000);
    } catch (err) {
      setGoogleStatusMsg({ type: 'error', text: 'Failed to disconnect. Try again.' });
      setTimeout(() => setGoogleStatusMsg(null), 4000);
    }
    setGoogleDisconnecting(false);
  };

  const [profile, setProfile] = useState({
    name:       user?.name       || savedProfile.name       || '',
    email:      user?.email      || savedProfile.email      || '',
    phone:      savedProfile.phone      || '',
    department: user?.department || savedProfile.department || '',
    bio:        savedProfile.bio        || '',
    linkedin:   savedProfile.linkedin   || '',
    github:     savedProfile.github     || '',
    portfolio:  savedProfile.portfolio  || '',
    skills:     savedProfile.skills     || [],
    cgpa:       savedProfile.cgpa       || '',
    college:    savedProfile.college    || '',
    year:       savedProfile.year       || '',
    resumeName: savedProfile.resumeName || '',
    resumeUrl:  savedProfile.resumeUrl  || '',
    // Alumni-specific fields
    company:      savedProfile.company      || '',
    currentTitle: savedProfile.currentTitle || savedProfile.title || '',
    passOutYear:  savedProfile.passOutYear  || '',
    experience:   savedProfile.experience   || '',
    domain:       savedProfile.domain       || '',
  });

  const [notifs, setNotifs] = useState({
    interview_requests: savedNotifs.interview_requests ?? true,
    session_reminders:  savedNotifs.session_reminders  ?? true,
    messages:           savedNotifs.messages           ?? true,
    platform_updates:   savedNotifs.platform_updates   ?? false,
    weekly_digest:      savedNotifs.weekly_digest      ?? true,
  });

  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !profile.skills.includes(s)) {
      setProfile(p => ({ ...p, skills: [...p.skills, s] }));
    }
    setSkillInput('');
  };

  const removeSkill = (s) => setProfile(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const toDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Please upload a PDF resume.'); return; }
    try {
      const dataUrl = await toDataUrl(file);
      setProfile(p => ({ ...p, resumeName: file.name, resumeUrl: dataUrl }));
    } catch { alert('Could not read resume file.'); }
    finally { if (e.target) e.target.value = ''; }
  };

  const saveProfile = async () => {
    const updated = { ...savedProfile, ...profile };
    localStorage.setItem('alumnex_profile', JSON.stringify(updated));
    const updatedUser = { ...user, name: profile.name, department: profile.department };
    login(updatedUser, localStorage.getItem('alumnex_token'));
    if (user?.id && !user.id.startsWith('stu-') && !user.id.startsWith('alm-')) {
      await updateUserProfile(user.id, profile).catch(err => console.warn('Profile save:', err.message));
    }
    flashSaved();
  };

  const saveNotifs = () => { localStorage.setItem('alumnex_notifs', JSON.stringify(notifs)); flashSaved(); };
  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const inp = {
    width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)',
    borderRadius: 10, padding: '0.65rem 0.875rem', color: '#dae2fd',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  };
  const lbl = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 };

  const SECTIONS = [
    { id: 'profile',       icon: 'person',         label: 'Edit Profile'  },
    { id: 'notifications', icon: 'notifications',  label: 'Notifications' },
    { id: 'account',       icon: 'manage_accounts', label: 'Account'      },
  ];

  // Account items — no export for alumni
  const accountItems = [
    { icon: 'key', label: 'Change Password', desc: 'Update your login password', color: '#c3c0ff', action: () => setShowPwModal(true) },
    { icon: 'delete_forever', label: 'Delete Account', desc: 'Permanently remove your account and data', color: '#ffb4ab', action: () => setShowDeleteModal(true) },
  ];

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

      {/* Sidebar nav */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.875rem 1.25rem', background: activeSection === s.id ? '#222a3d' : 'transparent', color: activeSection === s.id ? '#c3c0ff' : '#c7c4d8', border: 'none', borderLeft: activeSection === s.id ? '3px solid #c3c0ff' : '3px solid transparent', cursor: 'pointer', fontSize: '0.875rem', fontWeight: activeSection === s.id ? 600 : 400, textAlign: 'left', transition: 'all 0.2s' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: activeSection === s.id ? "'FILL' 1" : "'FILL' 0" }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>

        {/* Save toast */}
        {saved && (
          <div style={{ position: 'fixed', top: 80, right: 24, background: 'rgba(78,222,163,0.15)', border: '1px solid rgba(78,222,163,0.3)', borderRadius: 12, padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: 8, zIndex: 100, animation: 'slideIn 0.3s ease' }}>
            <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4edea3' }}>Changes saved!</span>
          </div>
        )}

        {/* ── EDIT PROFILE ── */}
        {activeSection === 'profile' && (
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.75rem' }}>Edit Profile</h3>

            {/* Common fields: Name, Email, Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your name" style={inp} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" type="email" style={inp} />
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" style={inp} />
              </div>
              <div>
                <label style={lbl}>Department / Branch</label>
                <input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Computer Science" style={inp} />
              </div>
            </div>

            {/* Alumni-specific fields */}
            {isAlumni && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={lbl}>Current Position / Title</label>
                  <input value={profile.currentTitle} onChange={e => setProfile(p => ({ ...p, currentTitle: e.target.value }))} placeholder="e.g. Senior Software Engineer" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Company / Organization</label>
                  <input value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Google" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Domain / Expertise</label>
                  <input value={profile.domain} onChange={e => setProfile(p => ({ ...p, domain: e.target.value }))} placeholder="e.g. Backend Engineering" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Years of Experience</label>
                  <input value={profile.experience} onChange={e => setProfile(p => ({ ...p, experience: e.target.value }))} placeholder="e.g. 8 years" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Pass-out Year (Batch)</label>
                  <input type="number" min="1990" max="2030" value={profile.passOutYear} onChange={e => setProfile(p => ({ ...p, passOutYear: e.target.value }))} placeholder="e.g. 2018" style={inp} />
                </div>
                <div>
                  <label style={lbl}>College / University</label>
                  <input value={profile.college} onChange={e => setProfile(p => ({ ...p, college: e.target.value }))} placeholder="e.g. IIT Bombay" style={inp} />
                </div>
              </div>
            )}

            {/* Student-specific fields */}
            {!isAlumni && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={lbl}>College / University</label>
                  <input value={profile.college} onChange={e => setProfile(p => ({ ...p, college: e.target.value }))} placeholder="e.g. IIT Bombay" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Year of Study</label>
                  <select value={profile.year} onChange={e => setProfile(p => ({ ...p, year: e.target.value }))} style={inp}>
                    <option value="">Select year</option>
                    {['1st Year','2nd Year','3rd Year','4th Year','Postgraduate'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>CGPA</label>
                  <input type="number" min="0" max="10" step="0.1" value={profile.cgpa} onChange={e => setProfile(p => ({ ...p, cgpa: e.target.value }))} placeholder="e.g. 8.5" style={inp} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={lbl}>Bio</label>
              <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder={isAlumni ? "Tell students about your expertise and mentoring style..." : "Tell mentors about yourself..."} rows={3} style={{ ...inp, resize: 'none' }} />
            </div>

            {/* Links — LinkedIn for everyone, GitHub/Portfolio only for students */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={lbl}>LinkedIn URL</label>
                <input value={profile.linkedin} onChange={e => setProfile(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." style={inp} />
              </div>
              {!isAlumni && (
                <>
                  <div>
                    <label style={lbl}>GitHub URL</label>
                    <input value={profile.github} onChange={e => setProfile(p => ({ ...p, github: e.target.value }))} placeholder="https://github.com/..." style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Portfolio</label>
                    <input value={profile.portfolio} onChange={e => setProfile(p => ({ ...p, portfolio: e.target.value }))} placeholder="https://yoursite.com" style={inp} />
                  </div>
                </>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={lbl}>Skills</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {profile.skills.map(s => (
                  <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.6rem', background: 'rgba(195,192,255,0.12)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 999, fontSize: '0.75rem', color: '#c3c0ff' }}>
                    {s}
                    <button onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c3c0ff', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="Add a skill and press Enter..." style={{ ...inp, flex: 1 }} />
                <button onClick={addSkill} style={{ padding: '0.65rem 1rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Add</button>
              </div>
            </div>

            {/* Resume — students only */}
            {!isAlumni && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={lbl}>Resume (PDF)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => resumeInputRef.current?.click()} style={{ padding: '0.65rem 1rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Upload Resume</button>
                  {profile.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noreferrer" style={{ padding: '0.65rem 1rem', background: 'rgba(78,222,163,0.12)', border: '1px solid rgba(78,222,163,0.25)', borderRadius: 10, color: '#4edea3', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>View Resume</a>}
                  {profile.resumeUrl && <button onClick={() => setProfile(p => ({ ...p, resumeName: '', resumeUrl: '' }))} style={{ padding: '0.65rem 1rem', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.25)', borderRadius: 10, color: '#ffb4ab', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Remove</button>}
                </div>
                {profile.resumeName && <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#c7c4d8' }}>Current: {profile.resumeName}</div>}
                <input ref={resumeInputRef} type="file" accept="application/pdf,.pdf" onChange={handleResumeUpload} style={{ display: 'none' }} />
              </div>
            )}

            <button onClick={saveProfile} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              Save Changes
            </button>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeSection === 'notifications' && (
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Notifications</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8', marginBottom: '1.75rem' }}>Choose what you want to be notified about.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {NOTIF_ITEMS.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#171f33', borderRadius: 12, border: `1px solid ${notifs[item.key] ? 'rgba(195,192,255,0.15)' : 'rgba(70,69,85,0.15)'}`, transition: 'border-color 0.2s' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{item.desc}</div>
                  </div>
                  <div onClick={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key] }))}
                    style={{ width: 44, height: 24, borderRadius: 999, background: notifs[item.key] ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#2d3449', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: notifs[item.key] ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '1rem 1.25rem', background: '#222a3d', borderRadius: 12, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 3 }}>Turn Off All Notifications</div>
                <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>Disable all notifications at once</div>
              </div>
              <button onClick={() => setNotifs(Object.fromEntries(NOTIF_ITEMS.map(i => [i.key, false])))} style={{ padding: '0.4rem 1rem', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Turn Off All</button>
            </div>
            <button onClick={saveNotifs} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Save Preferences</button>
          </div>
        )}

        {/* ── ACCOUNT ── */}
        {activeSection === 'account' && (
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.75rem' }}>Account Settings</h3>
            
            {/* Google Meet Integration — Dynamic Status */}
            <div style={{ marginBottom: '2rem', padding: '1.25rem', background: googleConnected ? 'rgba(78,222,163,0.04)' : 'rgba(66, 133, 244, 0.05)', border: `1px solid ${googleConnected ? 'rgba(78,222,163,0.25)' : 'rgba(66, 133, 244, 0.2)'}`, borderRadius: 12, transition: 'all 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: googleConnected ? '#00a572' : '#4285f4', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s', position: 'relative' }}>
                    <img src="https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v1/web-96dp/logo_meet_2020q4_color_2x_web_96dp.png" alt="Meet" style={{ width: 24 }} />
                    {googleConnected && (
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#4edea3', border: '2px solid #131b2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 8, fontWeight: 900, color: '#003d29' }}>✓</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Google Meet Integration</div>
                    <div style={{ fontSize: '0.8rem', color: '#c7c4d8' }}>
                      {googleLoading ? 'Checking connection...' : googleConnected ? 'Connected — meetings created as you (Host)' : 'Connect to generate professional meeting links'}
                    </div>
                  </div>
                </div>
                {googleConnected && (
                  <div style={{ padding: '0.2rem 0.6rem', background: 'rgba(78,222,163,0.15)', border: '1px solid rgba(78,222,163,0.3)', borderRadius: 999, fontSize: '0.6rem', fontWeight: 700, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Connected</div>
                )}
              </div>
              
              {/* Status message (from OAuth callback or disconnect action) */}
              {googleStatusMsg && (
                <div style={{ marginBottom: 12, padding: '0.5rem 1rem', background: googleStatusMsg.type === 'success' ? 'rgba(78,222,163,0.1)' : 'rgba(255,180,171,0.1)', border: `1px solid ${googleStatusMsg.type === 'success' ? 'rgba(78,222,163,0.3)' : 'rgba(255,180,171,0.3)'}`, borderRadius: 8, color: googleStatusMsg.type === 'success' ? '#4edea3' : '#ffb4ab', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, animation: 'slideIn 0.3s ease' }}>
                  {googleStatusMsg.type === 'success' ? '✅' : '❌'} {googleStatusMsg.text}
                </div>
              )}

              {googleLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(195,192,255,0.2)', borderTop: '2px solid #c3c0ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: '0.8rem', color: '#c7c4d8' }}>Checking Google status...</span>
                </div>
              ) : googleConnected ? (
                <div>
                  {/* Connected state — show email and disconnect */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#171f33', borderRadius: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.91c1.68-1.55 2.68-3.83 2.68-6.63z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33C2.43 15.89 5.5 18 9 18z" fill="#34A853"/><path d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.95a8.99 8.99 0 0 0 0 8.08l3.01-2.33z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.5 0 2.43 2.11.95 5.14l3.01 2.33c.71-2.13 2.7-3.71 5.04-3.71z" fill="#EA4335"/></svg>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dae2fd' }}>{googleEmail || 'Google Account'}</div>
                        <div style={{ fontSize: '0.65rem', color: '#c7c4d8' }}>Calendar connected • You are the Host for meetings</div>
                      </div>
                    </div>
                    <button 
                      onClick={handleGoogleDisconnect} 
                      disabled={googleDisconnecting}
                      style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.25)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.7rem', fontWeight: 700, cursor: googleDisconnecting ? 'not-allowed' : 'pointer', opacity: googleDisconnecting ? 0.6 : 1, whiteSpace: 'nowrap' }}
                    >
                      {googleDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(199,196,216,0.5)', lineHeight: 1.5 }}>
                    When students join your interview sessions, real Google Meet links are auto-generated with you as the Host. You can admit students directly.
                  </div>
                </div>
              ) : (
                <div>
                  {/* Disconnected state — show connect button */}
                  <div style={{ fontSize: '0.75rem', color: '#c7c4d8', marginBottom: 12, lineHeight: 1.6 }}>
                    Connect your Google Calendar to create real Google Meet links for interview sessions. You'll be the meeting Host, so you can admit students directly — no waiting room issues.
                  </div>
                  <button 
                    onClick={() => {
                      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                      window.location.href = `${apiBase}/auth/google/url?userId=${user?.id}`;
                    }}
                    style={{ width: '100%', padding: '0.75rem', background: 'white', color: '#3c4043', border: '1px solid #dadce0', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.91c1.68-1.55 2.68-3.83 2.68-6.63z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33C2.43 15.89 5.5 18 9 18z" fill="#34A853"/><path d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.95a8.99 8.99 0 0 0 0 8.08l3.01-2.33z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.5 0 2.43 2.11.95 5.14l3.01 2.33c.71-2.13 2.7-3.71 5.04-3.71z" fill="#EA4335"/></svg>
                    Connect Google Calendar
                  </button>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(199,196,216,0.4)', marginTop: 8, textAlign: 'center' }}>
                    Without Google Calendar, interview sessions will use Jitsi Meet as a fallback.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {accountItems.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#171f33', borderRadius: 12, border: '1px solid rgba(70,69,85,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ color: item.color, fontSize: 20 }}>{item.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{item.desc}</div>
                    </div>
                  </div>
                  <button onClick={item.action} style={{ padding: '0.4rem 0.875rem', background: 'transparent', border: `1px solid ${item.color}40`, borderRadius: 8, color: item.color, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                    {item.label === 'Delete Account' ? 'Delete' : 'Manage'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPwModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#171f33', borderRadius: 16, padding: '2rem', width: 400, border: '1px solid rgba(195,192,255,0.15)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Change Password</h3>
              <div style={{ marginBottom: '1rem' }}><label style={lbl}>Current Password</label><input type="password" placeholder="••••••••" style={inp} /></div>
              <div style={{ marginBottom: '1rem' }}><label style={lbl}>New Password</label><input type="password" placeholder="••••••••" style={inp} /></div>
              <div style={{ marginBottom: '1.5rem' }}><label style={lbl}>Confirm New Password</label><input type="password" placeholder="••••••••" style={inp} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowPwModal(false); flashSaved(); }} style={{ flex: 1, padding: '0.65rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Update Password</button>
                <button onClick={() => setShowPwModal(false)} style={{ flex: 1, padding: '0.65rem', background: 'transparent', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 10, color: '#c7c4d8', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#171f33', borderRadius: 16, padding: '2rem', width: 400, border: '1px solid rgba(255,180,171,0.25)' }}>
              <h3 style={{ fontWeight: 700, color: '#ffb4ab', marginBottom: '0.5rem' }}>Delete Account?</h3>
              <p style={{ fontSize: '0.875rem', color: '#c7c4d8', marginBottom: '1.5rem', lineHeight: 1.6 }}>This action is permanent and cannot be undone. All your data, sessions, and profile information will be deleted.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '0.65rem', background: 'transparent', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 10, color: '#c7c4d8', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => { setShowDeleteModal(false); alert('Account deletion request submitted. Contact support for confirmation.'); }} style={{ flex: 1, padding: '0.65rem', background: 'rgba(255,180,171,0.15)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 10, color: '#ffb4ab', fontWeight: 700, cursor: 'pointer' }}>Delete Account</button>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

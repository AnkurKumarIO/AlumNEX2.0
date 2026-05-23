import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { updateUserProfile } from '../lib/db';
import { api } from '../api';
import { emitRealtimeSync } from '../lib/realtimeSync';

const STEPS = ['Personal Info', 'Skills & Academics', 'Resume & Projects', 'Career Goals', 'Review'];
const DEPTS = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'MBA', 'Other'];

function TagInput({ tags, onChange, placeholder }) {
  const [val, setVal] = useState('');
  const add = () => {
    const t = val.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setVal('');
  };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tags.map(t => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.6rem', background: 'rgba(195,192,255,0.12)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 999, fontSize: '0.75rem', color: '#c3c0ff' }}>
            {t}
            <button onClick={() => onChange(tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c3c0ff', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder} style={{ flex: 1, background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.6rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none' }} />
        <button onClick={add} style={{ padding: '0.6rem 1rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Add</button>
      </div>
    </div>
  );
}

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  const [step, setStep] = useState(0);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [profile, setProfile] = useState(() => {
    const pending = JSON.parse(localStorage.getItem('alumnex_pending_profile') || localStorage.getItem('alumniconnect_pending_profile') || '{}');
    const getFieldVal = (key) => {
      if (pending[key]) return pending[key];
      if (user?.profile_data && user.profile_data[key]) return user.profile_data[key];
      if (user && user[key]) return user[key];
      if (key === 'rollNo') {
        if (pending.studentId) return pending.studentId;
        if (user?.profile_data?.studentId) return user.profile_data.studentId;
      }
      return '';
    };

    return {
      bio: '', linkedin: '', github: '', portfolio: '',
      department: getFieldVal('department'),
      skills: [], cgpa: '',
      resumeName: '', resumeUrl: '', projects: [{ title: '', desc: '', stack: '', link: '' }],
      targetRoles: [], preferredCompanies: [], openTo: [], gradMonth: '', gradYear: '',
      name: getFieldVal('name'),
      email: getFieldVal('email'),
      rollNo: getFieldVal('rollNo'),
      college: getFieldVal('college'),
      year: getFieldVal('year'),
    };
  });

  // Sync state if user loads later
  useEffect(() => {
    if (user) {
      setProfile(p => {
        const pending = JSON.parse(localStorage.getItem('alumnex_pending_profile') || localStorage.getItem('alumniconnect_pending_profile') || '{}');
        const getFieldVal = (key) => {
          if (pending[key]) return pending[key];
          if (user?.profile_data && user.profile_data[key]) return user.profile_data[key];
          if (user && user[key]) return user[key];
          if (key === 'rollNo') {
            if (pending.studentId) return pending.studentId;
            if (user?.profile_data?.studentId) return user.profile_data.studentId;
          }
          return '';
        };
        return {
          ...p,
          department: p.department || getFieldVal('department'),
          name: p.name || getFieldVal('name'),
          email: p.email || getFieldVal('email'),
          rollNo: p.rollNo || getFieldVal('rollNo'),
          college: p.college || getFieldVal('college'),
          year: p.year || getFieldVal('year'),
        };
      });
    }
  }, [user]);

  // ── Guard: if profile is already complete, go straight to dashboard ──────────
  useEffect(() => {
    try {
      const p1 = JSON.parse(localStorage.getItem('alumnex_profile') || 'null');
      const p2 = JSON.parse(localStorage.getItem('alumniconnect_profile') || 'null');
      const saved = p1 || p2;
      if (saved && (saved.profileComplete === true || (saved.skills && saved.skills.length > 0))) {
        navigate('/dashboard', { replace: true });
      }
    } catch {}
  }, []);

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  // Calculate profile completion %
  const calcCompletion = () => {
    const checks = [
      !!photoPreview,
      !!profile.bio.trim(),
      !!profile.linkedin.trim(),
      !!profile.github.trim(),
      profile.skills.length > 0,
      !!profile.cgpa,
      !!profile.resumeName,
      profile.projects.some(p => p.title.trim()),
      profile.targetRoles.length > 0,
      profile.openTo.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };
  const completion = calcCompletion();

  const inp = { width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.65rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };
  const lbl = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 };
  const section = { display: 'flex', flexDirection: 'column', gap: '1.25rem' };

  const handlePhotoChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setPhotoFile(f);
      setPhotoPreview(URL.createObjectURL(f));
    }
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const steps = [
    // Step 0 — Personal Info
    <div style={section}>
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 0.75rem' }}>
          <div
            onClick={() => document.getElementById('photo-input').click()}
            style={{ width: 96, height: 96, borderRadius: '50%', background: photoPreview ? 'transparent' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(195,192,255,0.3)' }}
          >
            {photoPreview
              ? <img src={photoPreview} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span className="material-symbols-outlined" style={{ color: '#1d00a5', fontSize: 36 }}>add_a_photo</span>}
          </div>
          {/* Change / Remove overlay buttons */}
          {photoPreview && (
            <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, whiteSpace: 'nowrap' }}>
              <button
                onClick={() => document.getElementById('photo-input').click()}
                style={{ padding: '0.15rem 0.5rem', fontSize: '0.6rem', fontWeight: 700, background: 'rgba(195,192,255,0.15)', border: '1px solid rgba(195,192,255,0.3)', borderRadius: 6, color: '#c3c0ff', cursor: 'pointer' }}
              >Change</button>
              <button
                onClick={handleRemovePhoto}
                style={{ padding: '0.15rem 0.5rem', fontSize: '0.6rem', fontWeight: 700, background: 'rgba(255,180,171,0.12)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 6, color: '#ffb4ab', cursor: 'pointer' }}
              >Remove</button>
            </div>
          )}
        </div>
        <input id="photo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
        <p style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: photoPreview ? 14 : 0 }}>
          {photoPreview ? 'Profile photo set' : 'Click to upload profile photo'}{' '}
          <span style={{ opacity: 0.55 }}>(optional)</span>
        </p>
      </div>
      <div>
        <label style={lbl}>About / Bio</label>
        <textarea value={profile.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell mentors about yourself, your interests, and goals..." rows={3} style={{ ...inp, resize: 'none' }} />
      </div>
      {[['linkedin', 'LinkedIn URL', 'https://linkedin.com/in/yourname'], ['github', 'GitHub URL', 'https://github.com/yourname'], ['portfolio', 'Portfolio / Website', 'https://yourportfolio.com']].map(([key, label, ph]) => (
        <div key={key}>
          <label style={lbl}>{label} <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
          <input value={profile[key]} onChange={e => set(key, e.target.value)} placeholder={ph} style={inp} />
        </div>
      ))}
    </div>,

    // Step 1 — Skills & Academics
    <div style={section}>
      <div>
        <label style={lbl}>Current CGPA</label>
        <input type="number" min="0" max="10" step="0.1" value={profile.cgpa} onChange={e => set('cgpa', e.target.value)} placeholder="e.g. 8.5" style={{ ...inp, width: 160 }} />
      </div>
      <div>
        <label style={lbl}>Skills <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(press Enter or click Add)</span></label>
        <TagInput tags={profile.skills} onChange={v => set('skills', v)} placeholder="e.g. React, Python, SQL..." />
      </div>
    </div>,

    // Step 2 — Resume & Projects
    <div style={section}>
      <div>
        <label style={lbl}>
          Resume (PDF){' '}
          <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => document.getElementById('resume-input').click()}
            style={{ padding: '0.65rem 1.25rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>
            {profile.resumeName ? 'Change Resume' : 'Upload Resume'}
          </button>
          {profile.resumeName && (
            <>
              <span style={{ fontSize: '0.8rem', color: '#4edea3' }}>✓ {profile.resumeName}</span>
              <button
                onClick={() => { set('resumeName', ''); set('resumeUrl', ''); }}
                style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.25)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >Remove</button>
            </>
          )}
        </div>
        <input
          id="resume-input"
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            set('resumeName', file.name);
            const reader = new FileReader();
            reader.onload = () => set('resumeUrl', reader.result);
            reader.readAsDataURL(file);
            e.target.value = '';
          }}
        />
      </div>
      <div>
        <label style={lbl}>Projects <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(up to 3, optional)</span></label>
        {profile.projects.map((p, i) => (
          <div key={i} style={{ background: '#131b2e', borderRadius: 12, padding: '1rem', marginBottom: '0.75rem', border: '1px solid rgba(70,69,85,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project {i + 1}</span>
              {i > 0 && <button onClick={() => set('projects', profile.projects.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffb4ab', fontSize: '0.7rem' }}>Remove</button>}
            </div>
            {[['title', 'Project Title', 'e.g. E-Commerce Platform'], ['desc', 'Description', 'What does it do?'], ['stack', 'Tech Stack', 'React, Node.js, MongoDB'], ['link', 'GitHub Link', 'https://github.com/...']].map(([key, label, ph]) => (
              <div key={key} style={{ marginBottom: '0.5rem' }}>
                <label style={{ ...lbl, marginBottom: 4 }}>{label}</label>
                <input value={p[key]} onChange={e => { const updated = [...profile.projects]; updated[i] = { ...updated[i], [key]: e.target.value }; set('projects', updated); }} placeholder={ph} style={{ ...inp, marginBottom: 0 }} />
              </div>
            ))}
          </div>
        ))}
        {profile.projects.length < 3 && (
          <button onClick={() => set('projects', [...profile.projects, { title: '', desc: '', stack: '', link: '' }])} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px dashed rgba(195,192,255,0.3)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
            + Add Another Project
          </button>
        )}
      </div>
    </div>,

    // Step 3 — Career Goals
    <div style={section}>
      <div>
        <label style={lbl}>Target Roles</label>
        <TagInput tags={profile.targetRoles} onChange={v => set('targetRoles', v)} placeholder="e.g. Software Engineer, Data Scientist..." />
      </div>
      <div>
        <label style={lbl}>Preferred Companies <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
        <TagInput tags={profile.preferredCompanies} onChange={v => set('preferredCompanies', v)} placeholder="e.g. Google, Stripe, Startup..." />
      </div>
      <div>
        <label style={lbl}>Open To</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {['Full-time', 'Internship', 'Remote', 'Hybrid', 'On-site'].map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '0.5rem 1rem', background: profile.openTo.includes(opt) ? 'rgba(195,192,255,0.12)' : '#222a3d', border: `1px solid ${profile.openTo.includes(opt) ? 'rgba(195,192,255,0.3)' : 'rgba(70,69,85,0.3)'}`, borderRadius: 10, fontSize: '0.8rem', color: profile.openTo.includes(opt) ? '#c3c0ff' : '#c7c4d8', transition: 'all 0.2s' }}>
              <input type="checkbox" checked={profile.openTo.includes(opt)} onChange={e => set('openTo', e.target.checked ? [...profile.openTo, opt] : profile.openTo.filter(x => x !== opt))} style={{ display: 'none' }} />
              {profile.openTo.includes(opt) && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#c3c0ff' }}>check</span>}
              {opt}
            </label>
          ))}
        </div>
      </div>
    </div>,

    // Step 4 — Review
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Photo preview in review */}
      {photoPreview && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <img src={photoPreview} alt="Profile" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(195,192,255,0.3)' }} />
        </div>
      )}
      {[
        { label: 'Bio', val: profile.bio || '—' },
        { label: 'Department', val: profile.department || '—' },
        { label: 'CGPA', val: profile.cgpa || '—' },
        { label: 'Skills', val: profile.skills.length ? profile.skills.join(', ') : '—' },
        { label: 'Resume', val: profile.resumeName || 'Not uploaded (optional)' },
        { label: 'Projects', val: profile.projects.filter(p => p.title).map(p => p.title).join(', ') || '—' },
        { label: 'Target Roles', val: profile.targetRoles.length ? profile.targetRoles.join(', ') : '—' },
        { label: 'Open To', val: profile.openTo.length ? profile.openTo.join(', ') : '—' },
        { label: 'Pass-out Year', val: profile.year || '—' },
      ].map(({ label, val }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 1rem', background: '#131b2e', borderRadius: 10, gap: 16 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', flexShrink: 0 }}>{label}</span>
          <span style={{ fontSize: '0.8rem', color: '#dae2fd', textAlign: 'right' }}>{val}</span>
        </div>
      ))}
    </div>,
  ];

  const handleComplete = async () => {
    const pending = JSON.parse(localStorage.getItem('alumnex_pending_profile') || localStorage.getItem('alumniconnect_pending_profile') || '{}');
    
    const getFieldVal = (key) => {
      if (pending[key]) return pending[key];
      if (user?.profile_data && user.profile_data[key]) return user.profile_data[key];
      if (user && user[key]) return user[key];
      if (key === 'rollNo') {
        if (pending.studentId) return pending.studentId;
        if (user?.profile_data?.studentId) return user.profile_data.studentId;
      }
      return profile[key] || '';
    };

    const finalName = getFieldVal('name');
    const finalEmail = getFieldVal('email');
    const finalRollNo = getFieldVal('rollNo');
    const finalDepartment = getFieldVal('department');
    const finalCollege = getFieldVal('college');
    const finalYear = getFieldVal('year');

    const fullProfile = {
      ...pending,
      ...profile,
      name: finalName,
      email: finalEmail,
      rollNo: finalRollNo,
      department: finalDepartment,
      college: finalCollege,
      year: finalYear,
      photoPreview,
      profileComplete: true,
    };
    localStorage.setItem('alumnex_profile', JSON.stringify(fullProfile));
    localStorage.setItem('alumniconnect_profile', JSON.stringify(fullProfile));

    const userId = pending.id || user?.id;
    const profilePayload = {
      ...profile,
      name: finalName,
      email: finalEmail,
      rollNo: finalRollNo,
      department: finalDepartment,
      college: finalCollege,
      year: finalYear,
      profileComplete: true,
      profileCompletedAt: new Date().toISOString(),
    };

    // Save to DB — try backend API first (Prisma), fall back to Supabase direct
    if (userId) {
      if (!userId.startsWith('stu-') && !userId.startsWith('alm-')) {
        try {
          await api.saveProfile(userId, profilePayload);
        } catch (err) {
          console.warn('Profile save via API failed, trying Supabase direct:', err.message);
          await updateUserProfile(userId, profilePayload).catch(e => console.warn('Profile save failed:', e));
        }
      } else {
        await updateUserProfile(userId, profilePayload).catch(err =>
          console.warn('Profile save failed:', err)
        );
      }
    }

    const userData = {
      id:              userId || `stu-${Date.now()}`,
      name:            finalName || 'Student',
      role:            'STUDENT',
      department:      finalDepartment,
      profileComplete: true,
    };

    // Update pending profile to mark as complete
    const updatedPending = {
      ...pending,
      name: finalName,
      email: finalEmail,
      rollNo: finalRollNo,
      department: finalDepartment,
      college: finalCollege,
      year: finalYear,
      profileComplete: true,
    };
    localStorage.setItem('alumnex_pending_profile', JSON.stringify(updatedPending));
    localStorage.setItem('alumniconnect_pending_profile', JSON.stringify(updatedPending));
    emitRealtimeSync({ type: 'tnp_notifications_updated' });

    login(userData, localStorage.getItem('alumnex_token') || `token-${Date.now()}`);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 560, border: '1px solid rgba(70,69,85,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Step {step + 1} of {STEPS.length}</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>{STEPS[step]}</h2>

          {/* Profile completion */}
          <div style={{ background: '#222a3d', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>Profile Completion</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: completion >= 80 ? '#4edea3' : completion >= 50 ? '#ffb95f' : '#c3c0ff' }}>{completion}%</span>
              </div>
              <div style={{ height: 6, background: '#131b2e', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${completion}%`, background: completion >= 80 ? 'linear-gradient(90deg,#00a572,#4edea3)' : completion >= 50 ? 'linear-gradient(90deg,#e07b00,#ffb95f)' : 'linear-gradient(90deg,#4f46e5,#c3c0ff)', borderRadius: 999, transition: 'width 0.5s ease' }} />
              </div>
            </div>
            <div style={{ fontSize: '0.65rem', color: completion >= 80 ? '#4edea3' : '#c7c4d8', fontWeight: 600, flexShrink: 0 }}>
              {completion >= 80 ? '🌟 Almost done!' : completion >= 50 ? '👍 Good progress' : '📝 Keep going'}
            </div>
          </div>

          {/* Step progress bar */}
          <div style={{ height: 4, background: '#222a3d', borderRadius: 999, overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: 'linear-gradient(90deg,#4f46e5,#c3c0ff)', borderRadius: 999, transition: 'width 0.4s ease' }} />
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? '#c3c0ff' : 'rgba(70,69,85,0.3)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div style={{ minHeight: 320, marginBottom: '2rem' }}>
          {steps[step]}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, padding: '0.875rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} style={{ flex: 2, padding: '0.875rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              Next →
            </button>
          ) : (
            <button onClick={handleComplete} style={{ flex: 2, padding: '0.875rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
              Complete Profile & Enter Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

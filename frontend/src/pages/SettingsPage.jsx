import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateUserProfile } from '../lib/db';
import { api } from '../api';
import { emitRealtimeSync } from '../lib/realtimeSync';
import { saveProfileToStorage, loadProfileFromStorage, verifyProfileIntegrity } from '../lib/profilePersistence';
import { uploadProfileAsset, getProfileAsset, compressImageFile } from '../lib/profileAssetsAPI';
import ErrorBoundary from '../components/ErrorBoundary';

const NOTIF_ITEMS = [
  { key: 'interview_requests', label: 'Interview Requests', desc: 'When a student sends you a booking request' },
  { key: 'session_reminders', label: 'Session Reminders', desc: '30 minutes before a scheduled session' },
  { key: 'messages',          label: 'New Messages',       desc: 'When you receive a direct message' },
  { key: 'platform_updates',  label: 'Platform Updates',   desc: 'New features and announcements' },
];

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
        <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder} style={{ flex: 1, background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.65rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none' }} />
        <button onClick={add} style={{ padding: '0.65rem 1rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Add</button>
      </div>
    </div>
  );
}

export default function SettingsPage({ role }) {
  const { user, login } = useContext(AuthContext);
  const resumeInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const userRole = role || user?.role || 'STUDENT';
  const isAlumni = userRole === 'ALUMNI';

  const savedProfile = loadProfileFromStorage();
  const savedNotifs  = JSON.parse(localStorage.getItem('alumnex_notifs')  || '{}');

  // Verify profile integrity on mount
  useEffect(() => {
    const integrity = verifyProfileIntegrity();
    if (!integrity.hasData) {
      console.warn('[SettingsPage] No profile data found in storage');
    }
    if (integrity.hasPhoto && !integrity.photoIsBase64) {
      console.warn('[SettingsPage] Photo exists but is not base64 - may be corrupted');
    }
  }, []);

  // Photo state — loaded from savedProfile with logging
  const [photoPreview, setPhotoPreview] = useState(() => {
    const saved = savedProfile.photoPreview;
    console.log('[SettingsPage] Initial photo from localStorage:', saved ? `${saved.substring(0, 50)}...` : 'none');
    return saved || null;
  });

  // Add effect to reload photo/resume when user changes
  useEffect(() => {
    async function loadAssetsFromDatabase() {
      if (!user?.id) return;
      
      try {
        console.log('[SettingsPage] Loading assets from database for user:', user.id);
        
        // Load photo — prefer assetUrl (Supabase Storage), fall back to fileData (base64)
        const photoAsset = await getProfileAsset(user.id, 'photo');
        const photoSrc = photoAsset?.assetUrl || photoAsset?.fileData || null;
        if (photoSrc) {
          console.log('[SettingsPage] ✓ Photo loaded from database');
          setPhotoPreview(photoSrc);
        }
        
        // Load resume — prefer assetUrl (Supabase Storage), fall back to fileData (base64)
        const resumeAsset = await getProfileAsset(user.id, 'resume');
        const resumeSrc = resumeAsset?.assetUrl || resumeAsset?.fileData || null;
        if (resumeSrc) {
          console.log('[SettingsPage] ✓ Resume loaded from database');
          setProfile(p => ({ 
            ...p, 
            resumeUrl: resumeSrc,
            resumeName: resumeAsset.fileName || 'resume.pdf'
          }));
        }
        
      } catch (err) {
        console.error('[SettingsPage] Error loading assets from database:', err);
        // Fallback to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
          if (saved.photoPreview && saved.photoPreview !== photoPreview && saved.photoPreview !== '__stored_in_database__') {
            console.log('[SettingsPage] Fallback: Loading photo from localStorage');
            setPhotoPreview(saved.photoPreview);
          }
          if (saved.resumeUrl && saved.resumeUrl !== profile.resumeUrl && saved.resumeUrl !== '__stored_in_database__') {
            console.log('[SettingsPage] Fallback: Loading resume from localStorage');
            setProfile(p => ({ ...p, resumeUrl: saved.resumeUrl, resumeName: saved.resumeName }));
          }
        } catch (localErr) {
          console.error('[SettingsPage] localStorage fallback also failed:', localErr);
        }
      }
    }
    
    loadAssetsFromDatabase();
  }, [user?.id]); // Reload when user changes

  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Change-password modal state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

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

  // Instrumentation: log active section and whether backdrop exists
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      console.log('[SettingsPage] activeSection ->', activeSection);
      const bd = document.querySelector('.sidebar-backdrop');
      if (bd) {
        const bg = window.getComputedStyle(bd).backgroundColor;
        console.log('[SettingsPage] sidebar-backdrop present, bg=', bg, 'zIndex=', window.getComputedStyle(bd).zIndex);
      } else {
        console.log('[SettingsPage] sidebar-backdrop not present');
      }
    } catch (e) {
      // ignore
    }
  }, [activeSection]);

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
    college:    user?.profile_data?.college || savedProfile.college    || '',
    year:       user?.profile_data?.year    || savedProfile.year       || '',
    rollNo:     user?.profile_data?.rollNo  || user?.profile_data?.studentId || savedProfile.rollNo || savedProfile.studentId || '',
    resumeName: savedProfile.resumeName || '',
    resumeUrl:  savedProfile.resumeUrl  || '',
    // Alumni-specific fields
    company:      savedProfile.company      || '',
    currentTitle: savedProfile.currentTitle || savedProfile.jobTitle || savedProfile.title || '',
    passOutYear:  savedProfile.passOutYear  || savedProfile.batchYear || '',
    experience:   savedProfile.experience   || '',
    domain:       savedProfile.domain       || '',
    sector:       savedProfile.sector       || '',
    // Student setup fields
    projects:           savedProfile.projects           || [{ title: '', desc: '', stack: '', link: '' }],
    targetRoles:        savedProfile.targetRoles        || [],
    preferredCompanies: savedProfile.preferredCompanies || [],
    openTo:             savedProfile.openTo             || [],
    gradMonth:          savedProfile.gradMonth          || '',
    gradYear:           savedProfile.gradYear           || '',
  });

  // Sync state if user loads later
  useEffect(() => {
    if (user) {
      setProfile(p => {
        const profileData = user.profile_data || {};
        return {
          ...p,
          name: user.name || p.name,
          email: user.email || p.email,
          department: user.department || p.department,
          college: profileData.college || p.college,
          year: profileData.year || p.year,
          rollNo: profileData.rollNo || profileData.studentId || p.rollNo,
          // Alumni-specific fields
          company: profileData.company || p.company,
          currentTitle: profileData.currentTitle || profileData.jobTitle || profileData.title || p.currentTitle,
          passOutYear: profileData.passOutYear || profileData.batchYear || p.passOutYear,
          sector: profileData.sector || p.sector,
        };
      });
    }
  }, [user]);

  const [notifs, setNotifs] = useState({
    interview_requests: savedNotifs.interview_requests ?? true,
    session_reminders:  savedNotifs.session_reminders  ?? true,
    messages:           savedNotifs.messages           ?? true,
    platform_updates:   savedNotifs.platform_updates   ?? false,
    weekly_digest:      savedNotifs.weekly_digest      ?? true,
  });

  // Hydrate notification preferences from DB profile_data if available
  useEffect(() => {
    const dbPrefs = user?.profile_data?.notification_preferences;
    if (dbPrefs && typeof dbPrefs === 'object') {
      setNotifs(p => ({ ...p, ...dbPrefs }));
      localStorage.setItem('alumnex_notifs', JSON.stringify({ ...savedNotifs, ...dbPrefs }));
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !profile.skills.includes(s)) {
      setProfile(p => ({ ...p, skills: [...p.skills, s] }));
    }
    setSkillInput('');
  };

  const removeSkill = (s) => setProfile(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Please upload a PDF resume.'); return; }
    try {
      console.log('[SettingsPage] Uploading resume to Supabase Storage...');
      const { url } = await uploadProfileAsset(user?.id, 'resume', file);
      setProfile(p => ({ ...p, resumeName: file.name, resumeUrl: url }));
      console.log('[SettingsPage] ✓ Resume uploaded:', url);
    } catch (err) {
      console.error('[SettingsPage] Resume upload error:', err);
      alert('Could not upload resume: ' + err.message);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const saveProfile = async () => {
    if (!user?.id) {
      setSaveError('Not logged in — please refresh and try again.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      // Read localStorage fresh at save time
      let currentSaved = {};
      try { currentSaved = JSON.parse(localStorage.getItem('alumnex_profile') || '{}'); } catch {}

      // Convert blob URL photo to persistent data URL before saving
      let finalPhotoPreview = photoPreview;
      if (photoPreview && photoPreview.startsWith('blob:')) {
        try {
          const blobRes = await fetch(photoPreview);
          const blob = await blobRes.blob();
          finalPhotoPreview = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          setPhotoPreview(finalPhotoPreview);
        } catch {
          // keep blob URL as fallback
        }
      }

      // Build merged profile — only plain serialisable values
      const merged = {
        name:               user?.name       || currentSaved.name       || profile.name       || '',
        email:              user?.email      || currentSaved.email      || profile.email      || '',
        department:         user?.department || currentSaved.department || profile.department || '',
        phone:              profile.phone        || currentSaved.phone        || '',
        bio:                profile.bio          || currentSaved.bio          || '',
        linkedin:           profile.linkedin     || currentSaved.linkedin     || '',
        github:             profile.github       || currentSaved.github       || '',
        portfolio:          profile.portfolio    || currentSaved.portfolio    || '',
        skills:             profile.skills       || currentSaved.skills       || [],
        cgpa:               profile.cgpa         || currentSaved.cgpa         || '',
        college:            user?.profile_data?.college     || currentSaved.college     || profile.college     || '',
        year:               user?.profile_data?.year        || currentSaved.year        || profile.year        || '',
        rollNo:             user?.profile_data?.rollNo      || user?.profile_data?.studentId || currentSaved.rollNo || profile.rollNo || '',
        resumeName:         profile.resumeName   || currentSaved.resumeName   || '',
        resumeUrl:          profile.resumeUrl    || currentSaved.resumeUrl    || '',
        company:            user?.profile_data?.company      || currentSaved.company      || profile.company      || '',
        currentTitle:       user?.profile_data?.currentTitle || user?.profile_data?.jobTitle || currentSaved.currentTitle || profile.currentTitle || '',
        passOutYear:        user?.profile_data?.passOutYear  || user?.profile_data?.batchYear || currentSaved.passOutYear  || profile.passOutYear  || '',
        sector:             user?.profile_data?.sector       || currentSaved.sector       || profile.sector       || '',
        experience:         profile.experience   || currentSaved.experience   || '',
        domain:             profile.domain       || currentSaved.domain       || '',
        projects:           profile.projects     || currentSaved.projects     || [],
        targetRoles:        profile.targetRoles        || currentSaved.targetRoles        || [],
        preferredCompanies: profile.preferredCompanies || currentSaved.preferredCompanies || [],
        openTo:             profile.openTo       || currentSaved.openTo       || [],
        gradMonth:          profile.gradMonth    || currentSaved.gradMonth    || '',
        gradYear:           profile.gradYear     || currentSaved.gradYear     || '',
        photoPreview:       finalPhotoPreview    || '',
      };

      console.log('[SettingsPage] Saving profile with photo:', merged.photoPreview ? `${merged.photoPreview.substring(0, 50)}...` : 'none');

      // DB payload: strip base64 blobs (too large) but keep Supabase Storage URLs
      const dbPayload = { ...merged };
      if (dbPayload.resumeUrl && dbPayload.resumeUrl.startsWith('data:')) {
        dbPayload.resumeUrl = '';
        dbPayload.resumeStoredLocally = true;
      }
      // Only replace photo with placeholder if it's a raw base64 blob
      // Supabase Storage URLs (https://...) are fine to store in DB
      if (dbPayload.photoPreview && dbPayload.photoPreview.startsWith('data:')) {
        dbPayload.photoPreview = '__stored_in_database__';
      }

      console.log('[SettingsPage] Saving profile (text data only, no binary)');

      // 1. Save profile to localStorage — keep the actual URL/base64 for photo
      //    but strip large base64 blobs (resume) to avoid quota issues
      const lightweightProfile = {
        ...merged,
        // Keep photo URL (Supabase public URL is small); only strip base64 data URIs
        photoPreview: (merged.photoPreview && merged.photoPreview.startsWith('data:'))
          ? '__stored_in_database__'
          : (merged.photoPreview || ''),
        resumeUrl: '__stored_in_database__', // Resume base64 is always too large for localStorage
      };
      
      try {
        localStorage.setItem('alumnex_profile', JSON.stringify(lightweightProfile));
        localStorage.setItem('alumniconnect_profile', JSON.stringify(lightweightProfile));
        console.log('[SettingsPage] ✓ Lightweight profile saved to localStorage');
      } catch (storageErr) {
        console.warn('[SettingsPage] localStorage save failed (non-critical):', storageErr);
        // Continue anyway - data is in database
      }

      // 2. Update auth context with lightweight fields only (no base64 blobs)
      login(
        {
          ...user,
          name: merged.name,
          department: merged.department,
          profile_data: {
            ...(user?.profile_data || {}),
            bio: merged.bio, phone: merged.phone, linkedin: merged.linkedin,
            github: merged.github, portfolio: merged.portfolio, skills: merged.skills,
            cgpa: merged.cgpa, college: merged.college, year: merged.year,
            rollNo: merged.rollNo, company: merged.company, currentTitle: merged.currentTitle,
            passOutYear: merged.passOutYear, sector: merged.sector, experience: merged.experience, domain: merged.domain,
            projects: merged.projects, targetRoles: merged.targetRoles,
            preferredCompanies: merged.preferredCompanies, openTo: merged.openTo,
            gradMonth: merged.gradMonth, gradYear: merged.gradYear, resumeName: merged.resumeName,
          },
        },
        localStorage.getItem('alumnex_token')
      );
      emitRealtimeSync({ type: 'profile_updated' });

      // 3. Persist to DB — backend first, Supabase direct as fallback
      let dbSaved = false;
      let lastError = '';

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/users/${user.id}/profile`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbPayload),
            signal: controller.signal,
          }
        );
        clearTimeout(timer);
        if (res.ok) {
          dbSaved = true;
          console.log('[SettingsPage] Saved via backend ✓');
        } else {
          const errBody = await res.json().catch(() => ({}));
          lastError = `Backend ${res.status}: ${errBody.error || errBody.message || 'unknown'}`;
          console.warn('[SettingsPage]', lastError);
        }
      } catch (fetchErr) {
        lastError = `Backend unreachable: ${fetchErr.message}`;
        console.warn('[SettingsPage]', lastError);
      }

      if (!dbSaved) {
        try {
          await updateUserProfile(user.id, dbPayload);
          dbSaved = true;
          console.log('[SettingsPage] Saved via Supabase ✓');
        } catch (supaErr) {
          lastError = `Supabase: ${supaErr.message}`;
          console.error('[SettingsPage]', lastError);
          setSaveError(`Saved locally only — server error: ${lastError}`);
        }
      }

      if (dbSaved) flashSaved();

    } catch (unexpectedErr) {
      console.error('[SettingsPage] saveProfile crash:', unexpectedErr);
      setSaveError(`Error: ${unexpectedErr.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveNotifs = async () => {
    localStorage.setItem('alumnex_notifs', JSON.stringify(notifs));
    // Also persist to DB so preferences sync across devices
    // Save for all users (removed mock user check)
    if (user?.id) {
      try {
        await api.saveProfile(user.id, {
          ...JSON.parse(localStorage.getItem('alumnex_profile') || '{}'),
          notification_preferences: notifs,
        });
      } catch (e) {
        console.warn('saveNotifs: DB sync failed, preferences saved locally only:', e.message);
      }
    }
    flashSaved();
  };
  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const inp = {
    width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)',
    borderRadius: 10, padding: '0.65rem 0.875rem', color: '#dae2fd',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  };
  const lbl = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 };
  const btnOutline = { padding: '0.6rem 1rem', background: 'transparent', border: '1px solid rgba(195,192,255,0.12)', borderRadius: 10, color: '#c3c0ff', fontWeight: 700, cursor: 'pointer' };

  const SECTIONS = [
    { id: 'profile',       icon: 'person',         label: 'Edit Profile'  },
    ...(isAlumni ? [{ id: 'mentorship', icon: 'diversity_3', label: 'Mentorship' }] : []),
    { id: 'notifications', icon: 'notifications',  label: 'Notifications' },
    { id: 'account',       icon: 'manage_accounts', label: 'Account'      },
  ];

  // Mentorship settings state
  const [mentorship, setMentorship] = useState({
    maxInterviews: 3,
    slots: [],
    defaultDuration: 60,
    defaultBuffer: 15
  });

  useEffect(() => {
    if (isAlumni && user?.id) {
      api.get(`/alumni/${user.id}/availability`)
        .then(res => {
          const slots = res.availability || [];
          const firstSlot = slots[0];
          setMentorship({
            maxInterviews: res.max_interviews_per_week || 3,
            slots: slots,
            defaultDuration: firstSlot?.slot_duration || 60,
            defaultBuffer: firstSlot?.buffer_time !== undefined ? firstSlot.buffer_time : 15
          });
        })
        .catch(err => console.error('Fetch availability error:', err));
    }
  }, [isAlumni, user?.id]);

  const saveMentorship = async () => {
    try {
      setSaving(true);
      await api.post(`/alumni/${user.id}/availability`, { slots: mentorship.slots });
      await api.post(`/alumni/${user.id}/settings`, { max_interviews_per_week: mentorship.maxInterviews });
      flashSaved();
    } catch (err) {
      console.error('Save mentorship error:', err);
      setSaveError('Failed to save mentorship settings');
    } finally {
      setSaving(false);
    }
  };

  // Account items — no delete for students
  const accountItems = [
    { icon: 'key', label: 'Change Password', desc: 'Update your login password', color: '#c3c0ff', action: () => setShowPwModal(true) },
    ...(isAlumni ? [{ icon: 'delete_forever', label: 'Delete Account', desc: 'Permanently remove your account and data', color: '#ffb4ab', action: () => setShowDeleteModal(true) }] : []),
  ];

  return (
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

      {/* Sidebar nav */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
          {SECTIONS.map(s => {
            const isActive = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => { try { console.log('[SettingsPage] section click:', s.id); } catch(e){}; setActiveSection(s.id); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0.875rem 1.25rem',
                  background: isActive ? 'linear-gradient(90deg, rgba(79,70,229,0.25), rgba(124,58,237,0.18))' : 'transparent',
                  color: isActive ? '#e0e7ff' : '#c7c4d8',
                  border: 'none',
                  borderLeft: isActive ? '4px solid #8b5cf6' : '4px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 400,
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 0 0 1px rgba(124,58,237,0.16)' : 'none',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <ErrorBoundary>
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
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>Edit Profile</h3>

            {/* Locked fields notice */}
            <div style={{ background: 'rgba(195,192,255,0.03)', border: '1px solid rgba(195,192,255,0.15)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 18 }}>lock</span>
              <div style={{ fontSize: '0.78rem', color: '#c7c4d8', lineHeight: 1.5 }}>
                {isAlumni ? (
                  <>
                    Verified profile details (such as <strong style={{ color: '#dae2fd' }}>Name, Email, Department, Company, Job Title, Sector, and Batch Year</strong>) are managed by your institution's placement office and cannot be changed here. Contact your coordinator if you need to update them.
                  </>
                ) : (
                  <>
                    Verified profile details (such as <strong style={{ color: '#dae2fd' }}>Name, Email, Department, Roll Number, College, and Pass-out Year</strong>) are managed by your institution's placement office and cannot be changed here. Contact your coordinator if you need to update them.
                  </>
                )}
              </div>
            </div>

            {/* Profile Photo */}
            <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                <div
                  style={{ width: 80, height: 80, borderRadius: '50%', background: photoPreview ? 'transparent' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(195,192,255,0.25)', cursor: 'pointer' }}
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoPreview
                    ? <img src={photoPreview} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span className="material-symbols-outlined" style={{ color: '#1d00a5', fontSize: 30 }}>person</span>}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c7c4d8', marginBottom: 8 }}>Profile Photo <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => photoInputRef.current?.click()} style={{ padding: '0.4rem 0.875rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 8, color: '#c3c0ff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {photoPreview && (
                    <button onClick={() => setPhotoPreview(null)} style={{ padding: '0.4rem 0.875rem', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.25)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                  )}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => { 
                  const f = e.target.files?.[0]; 
                  if (f) {
                    setPhotoPreview(URL.createObjectURL(f)); // optimistic preview
                    try {
                      const fileToUpload = f.size > 500 * 1024 ? await compressImageFile(f, 800, 0.8) : f;
                      const { url } = await uploadProfileAsset(user?.id, 'photo', fileToUpload);
                      setPhotoPreview(url); // replace blob URL with persistent Supabase URL
                      console.log('[SettingsPage] ✓ Photo uploaded:', url);
                    } catch (err) {
                      console.error('[SettingsPage] Photo upload error:', err);
                      alert('Could not upload photo: ' + err.message);
                    }
                  }
                  e.target.value = ''; 
                }} />
              </div>
            </div>

            {/* Common fields: Name, Email, Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input
                  value={profile.name}
                  placeholder="Your name"
                  disabled
                  style={{ ...inp, opacity: 0.65, cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input
                  value={profile.email}
                  placeholder="your@email.com"
                  type="email"
                  disabled
                  style={{ ...inp, opacity: 0.65, cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Department / Branch</label>
                <input
                  value={profile.department}
                  placeholder="e.g. Computer Science"
                  disabled
                  style={{ ...inp, opacity: 0.65, cursor: 'not-allowed' }}
                />
              </div>
            </div>

            {/* Alumni-specific fields */}
            {isAlumni && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={lbl}>Current Position / Title</label>
                  <input
                    value={profile.currentTitle}
                    placeholder="e.g. Senior Software Engineer"
                    disabled
                    style={{ ...inp, opacity: 0.65, cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <label style={lbl}>Company / Organization</label>
                  <input
                    value={profile.company}
                    placeholder="e.g. Google"
                    disabled
                    style={{ ...inp, opacity: 0.65, cursor: 'not-allowed' }}
                  />
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
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={profile.passOutYear}
                    disabled
                    placeholder="e.g. 2018"
                    style={{ ...inp, opacity: 0.65, cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <label style={lbl}>Sector</label>
                  <input
                    value={profile.sector}
                    placeholder="e.g. Technology, Finance"
                    disabled
                    style={{ ...inp, opacity: 0.65, cursor: 'not-allowed' }}
                  />
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
                  <input
                    value={profile.college}
                    placeholder="e.g. IIT Bombay"
                    disabled
                    style={{ ...inp, opacity: 0.65, cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <label style={lbl}>Roll Number / Student ID</label>
                  <input
                    value={profile.rollNo}
                    placeholder="Roll Number"
                    disabled
                    style={{ ...inp, opacity: 0.65, cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <label style={lbl}>Pass-out Year</label>
                  <input
                    value={profile.year}
                    placeholder="e.g. 2025"
                    disabled
                    style={{ ...inp, opacity: 0.65, cursor: 'not-allowed' }}
                  />
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
                {(() => {
                  const resumeUrl = (profile.resumeUrl && profile.resumeUrl !== '__stored_in_database__' && profile.resumeUrl !== '__stored_locally__') ? profile.resumeUrl : null;
                  const openResume = () => {
                    if (!resumeUrl) return;
                    if (resumeUrl.startsWith('http')) {
                      window.open(resumeUrl, '_blank', 'noopener,noreferrer');
                    } else if (resumeUrl.startsWith('data:')) {
                      try {
                        const byteString = atob(resumeUrl.split(',')[1]);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                        const blob = new Blob([ab], { type: 'application/pdf' });
                        window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
                      } catch (e) { console.error('Resume open failed:', e); }
                    }
                  };
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => resumeInputRef.current?.click()} style={{ padding: '0.65rem 1rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                        {resumeUrl ? 'Replace Resume' : 'Upload Resume'}
                      </button>
                      {resumeUrl && (
                        <button onClick={openResume} style={{ padding: '0.65rem 1rem', background: 'rgba(78,222,163,0.12)', border: '1px solid rgba(78,222,163,0.25)', borderRadius: 10, color: '#4edea3', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                          View
                        </button>
                      )}
                      {resumeUrl && (
                        <button
                          onClick={() => {
                            if (resumeUrl.startsWith('http')) {
                              // For Storage URLs, fetch and trigger download
                              fetch(resumeUrl)
                                .then(r => r.blob())
                                .then(blob => {
                                  const a = document.createElement('a');
                                  a.href = URL.createObjectURL(blob);
                                  a.download = profile.resumeName || 'resume.pdf';
                                  a.click();
                                })
                                .catch(() => window.open(resumeUrl, '_blank'));
                            } else if (resumeUrl.startsWith('data:')) {
                              const a = document.createElement('a');
                              a.href = resumeUrl;
                              a.download = profile.resumeName || 'resume.pdf';
                              a.click();
                            }
                          }}
                          style={{ padding: '0.65rem 1rem', background: 'rgba(195,192,255,0.08)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Download
                        </button>
                      )}
                      {resumeUrl && (
                        <button
                          onClick={async () => {
                            setProfile(p => ({ ...p, resumeName: '', resumeUrl: '' }));
                            if (user?.id) {
                              try {
                                const { deleteProfileAsset } = await import('../lib/profileAssetsAPI');
                                await deleteProfileAsset(user.id, 'resume');
                              } catch (e) {
                                console.warn('[SettingsPage] Resume delete failed:', e.message);
                              }
                            }
                          }}
                          style={{ padding: '0.65rem 1rem', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.25)', borderRadius: 10, color: '#ffb4ab', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })()}
                {profile.resumeName && (profile.resumeUrl && profile.resumeUrl !== '__stored_in_database__') && (
                  <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#c7c4d8' }}>Current: {profile.resumeName}</div>
                )}
                <input ref={resumeInputRef} type="file" accept="application/pdf,.pdf" onChange={handleResumeUpload} style={{ display: 'none' }} />
              </div>
            )}

            {!isAlumni && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={lbl}>Target Roles</label>
                    <TagInput tags={profile.targetRoles} onChange={v => setProfile(p => ({ ...p, targetRoles: v }))} placeholder="e.g. Software Engineer, Data Scientist..." />
                  </div>
                  <div>
                    <label style={lbl}>Preferred Companies <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                    <TagInput tags={profile.preferredCompanies} onChange={v => setProfile(p => ({ ...p, preferredCompanies: v }))} placeholder="e.g. Google, Stripe, Startup..." />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={lbl}>Open To</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {['Full-time', 'Internship', 'Remote', 'Hybrid', 'On-site'].map(opt => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '0.5rem 1rem', background: profile.openTo.includes(opt) ? 'rgba(195,192,255,0.12)' : '#222a3d', border: `1px solid ${profile.openTo.includes(opt) ? 'rgba(195,192,255,0.3)' : 'rgba(70,69,85,0.3)'}`, borderRadius: 10, fontSize: '0.8rem', color: profile.openTo.includes(opt) ? '#c3c0ff' : '#c7c4d8', transition: 'all 0.2s' }}>
                        <input type="checkbox" checked={profile.openTo.includes(opt)} onChange={e => setProfile(p => ({ ...p, openTo: e.target.checked ? [...profile.openTo, opt] : profile.openTo.filter(x => x !== opt) }))} style={{ display: 'none' }} />
                        {profile.openTo.includes(opt) && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#c3c0ff' }}>check</span>}
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={lbl}>Projects <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(up to 3, optional)</span></label>
                  {profile.projects.map((p, i) => (
                    <div key={i} style={{ background: '#171f33', borderRadius: 12, padding: '1rem', marginBottom: '0.75rem', border: '1px solid rgba(70,69,85,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project {i + 1}</span>
                        {profile.projects.length > 1 && (
                          <button onClick={() => setProfile(prev => ({ ...prev, projects: prev.projects.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffb4ab', fontSize: '0.7rem' }}>Remove</button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ ...lbl, fontSize: '0.65rem', marginBottom: 4 }}>Project Title</label>
                          <input value={p.title} onChange={e => { const updated = [...profile.projects]; updated[i] = { ...updated[i], title: e.target.value }; setProfile(prev => ({ ...prev, projects: updated })); }} placeholder="e.g. E-Commerce Platform" style={inp} />
                        </div>
                        <div>
                          <label style={{ ...lbl, fontSize: '0.65rem', marginBottom: 4 }}>Tech Stack</label>
                          <input value={p.stack} onChange={e => { const updated = [...profile.projects]; updated[i] = { ...updated[i], stack: e.target.value }; setProfile(prev => ({ ...prev, projects: updated })); }} placeholder="React, Node.js, MongoDB" style={inp} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ ...lbl, fontSize: '0.65rem', marginBottom: 4 }}>Description</label>
                          <input value={p.desc} onChange={e => { const updated = [...profile.projects]; updated[i] = { ...updated[i], desc: e.target.value }; setProfile(prev => ({ ...prev, projects: updated })); }} placeholder="What does it do?" style={inp} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ ...lbl, fontSize: '0.65rem', marginBottom: 4 }}>GitHub Link</label>
                          <input value={p.link} onChange={e => { const updated = [...profile.projects]; updated[i] = { ...updated[i], link: e.target.value }; setProfile(prev => ({ ...prev, projects: updated })); }} placeholder="https://github.com/..." style={inp} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {profile.projects.length < 3 && (
                    <button onClick={() => setProfile(prev => ({ ...prev, projects: [...prev.projects, { title: '', desc: '', stack: '', link: '' }] }))} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px dashed rgba(195,192,255,0.3)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                      + Add Another Project
                    </button>
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {saveError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1rem', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 10 }}>
                  <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: 18 }}>error</span>
                  <span style={{ fontSize: '0.8rem', color: '#ffb4ab' }}>{saveError}</span>
                </div>
              )}
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{ padding: '0.75rem 2rem', background: saving ? 'rgba(195,192,255,0.2)' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: saving ? '#c3c0ff' : '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', transition: 'all 0.2s' }}
              >
                {saving && <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span>}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ── MENTORSHIP SETTINGS ── */}
        {activeSection === 'mentorship' && isAlumni && (
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Mentorship Settings</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8', marginBottom: '1.75rem' }}>Set your weekly capacity and availability windows.</p>

            <div style={{ marginBottom: '2rem' }}>
              <label style={lbl}>Max Interviews Per Week</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <select
                  value={mentorship.maxInterviews}
                  onChange={e => setMentorship(m => ({ ...m, maxInterviews: parseInt(e.target.value) }))}
                  style={{ ...inp, width: 120 }}
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ fontSize: '0.8rem', color: '#c7c4d8' }}>Once you reach this limit, you'll be shown as "Fully Booked".</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={lbl}>Default Meeting Duration</label>
                <select
                  value={mentorship.defaultDuration}
                  onChange={e => setMentorship(m => ({ ...m, defaultDuration: parseInt(e.target.value) }))}
                  style={inp}
                >
                  {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Default Buffer Time</label>
                <select
                  value={mentorship.defaultBuffer}
                  onChange={e => setMentorship(m => ({ ...m, defaultBuffer: parseInt(e.target.value) }))}
                  style={inp}
                >
                  {[0, 5, 10, 15, 20, 30].map(b => <option key={b} value={b}>{b} minutes</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={lbl}>Weekly Availability Windows</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {mentorship.slots.map((slot, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#171f33', padding: '0.75rem 1rem', borderRadius: 12, border: '1px solid rgba(70,69,85,0.2)' }}>
                    <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: '#dae2fd', textTransform: 'capitalize' }}>{slot.day_of_week}</div>
                    <div style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>{slot.start_time} – {slot.end_time} ({slot.slot_duration || 60}m duration, {slot.buffer_time !== undefined ? slot.buffer_time : 15}m buffer)</div>
                    <button
                      onClick={() => setMentorship(m => ({ ...m, slots: m.slots.filter((_, j) => j !== i) }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffb4ab' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(195,192,255,0.03)', padding: '1.25rem', borderRadius: 12, border: '1px dashed rgba(195,192,255,0.2)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ ...lbl, fontSize: '0.65rem' }}>Day</label>
                    <select id="new-slot-day" style={{ ...inp, fontSize: '0.75rem' }}>
                      {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => (
                        <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...lbl, fontSize: '0.65rem' }}>Start Time</label>
                    <input id="new-slot-start" type="time" style={{ ...inp, fontSize: '0.75rem' }} defaultValue="17:00" />
                  </div>
                  <div>
                    <label style={{ ...lbl, fontSize: '0.65rem' }}>End Time</label>
                    <input id="new-slot-end" type="time" style={{ ...inp, fontSize: '0.75rem' }} defaultValue="19:00" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const day = document.getElementById('new-slot-day').value;
                    const start = document.getElementById('new-slot-start').value;
                    const end = document.getElementById('new-slot-end').value;
                    if (day && start && end) {
                      setMentorship(m => ({ ...m, slots: [...m.slots, { day_of_week: day, start_time: start, end_time: end, slot_duration: m.defaultDuration, buffer_time: m.defaultBuffer }] }));
                    }
                  }}
                  style={{ ...btnOutline, width: '100%', padding: '0.6rem' }}
                >
                  + Add Availability Window
                </button>
              </div>
            </div>

            <button onClick={saveMentorship} disabled={saving} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save Mentorship Settings'}
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
                    <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>
                      {item.key === 'interview_requests'
                        ? (isAlumni ? 'When a student sends you a booking request' : 'When an alumni updates your interview request status')
                        : item.desc}
                    </div>
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
            {isAlumni && (
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
                      onClick={async () => {
                        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                        try {
                          const res = await fetch(`${apiBase}/auth/google/url?userId=${user?.id}`);
                          const data = await res.json();
                          if (data.url) {
                            window.location.href = data.url;
                          }
                        } catch (e) {
                          console.error('Failed to get Google OAuth URL:', e);
                        }
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
            )}

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
            <div style={{ background: '#171f33', borderRadius: 16, padding: '2rem', width: 420, border: '1px solid rgba(195,192,255,0.15)' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Change Password</h3>

              {/* Error message */}
              {pwError && (
                <div style={{ marginBottom: '1rem', padding: '0.6rem 1rem', background: 'rgba(255,180,171,0.12)', border: '1px solid rgba(255,180,171,0.35)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.82rem', fontWeight: 600 }}>
                  {pwError}
                </div>
              )}

              {/* Success message */}
              {pwSuccess && (
                <div style={{ marginBottom: '1rem', padding: '0.6rem 1rem', background: 'rgba(78,222,163,0.12)', border: '1px solid rgba(78,222,163,0.3)', borderRadius: 8, color: '#4edea3', fontSize: '0.82rem', fontWeight: 600 }}>
                  {pwSuccess}
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={lbl}>Current Password</label>
                <input
                  id="pw-current"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.current}
                  onChange={e => { setPwForm(f => ({ ...f, current: e.target.value })); setPwError(''); }}
                  style={inp}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={lbl}>New Password</label>
                <input
                  id="pw-new"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.newPw}
                  onChange={e => { setPwForm(f => ({ ...f, newPw: e.target.value })); setPwError(''); }}
                  style={inp}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={lbl}>Confirm New Password</label>
                <input
                  id="pw-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.confirm}
                  onChange={e => { setPwForm(f => ({ ...f, confirm: e.target.value })); setPwError(''); }}
                  style={inp}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  id="pw-submit"
                  disabled={pwLoading}
                  onClick={async () => {
                    setPwError('');
                    setPwSuccess('');

                    // Bug #3 — all fields mandatory
                    if (!pwForm.current.trim() || !pwForm.newPw.trim() || !pwForm.confirm.trim()) {
                      setPwError('All fields are required.');
                      return;
                    }

                    // Bug #2 — new and confirm must match
                    if (pwForm.newPw !== pwForm.confirm) {
                      setPwError('New and confirm new password do not match.');
                      return;
                    }

                    // Bug #1 & #4 — verify current password and persist update
                    setPwLoading(true);
                    try {
                      await api.changePassword(user?.id, pwForm.current, pwForm.newPw);
                      setPwSuccess('Password updated successfully!');
                      setPwForm({ current: '', newPw: '', confirm: '' });
                      setTimeout(() => { setShowPwModal(false); setPwSuccess(''); }, 1800);
                    } catch (err) {
                      setPwError(err.message || 'Failed to update password.');
                    } finally {
                      setPwLoading(false);
                    }
                  }}
                  style={{ flex: 1, padding: '0.65rem', background: pwLoading ? 'rgba(79,70,229,0.5)' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, cursor: pwLoading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
                >
                  {pwLoading ? 'Updating…' : 'Update Password'}
                </button>
                <button
                  onClick={() => { setShowPwModal(false); setPwForm({ current: '', newPw: '', confirm: '' }); setPwError(''); setPwSuccess(''); }}
                  style={{ flex: 1, padding: '0.65rem', background: 'transparent', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 10, color: '#c7c4d8', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
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

      <style>{`@keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </ErrorBoundary>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { exportToCSV } from '../utils/exportUtils';
import { API_BASE } from '../api';

// ── Sortable header helper ────────────────────────────────────────────────────
function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <div
      onClick={() => onSort(field)}
      style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: active ? '#c3c0ff' : '#c7c4d8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, userSelect: 'none' }}
    >
      {label}
      {active && (
        <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#c3c0ff' }}>
          {sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
        </span>
      )}
    </div>
  );
}

// ── User detail modal ─────────────────────────────────────────────────────────
function UserDetailModal({ userId, onClose, token }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`${API_BASE}/stats/directory/user/${userId}`, { headers })
      .then(r => r.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 998, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '95%', maxWidth: 800, height: '90vh', background: '#0b1326', borderRadius: 24, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c7c4d8' }}>
             <span className="material-symbols-outlined" style={{ fontSize: 40, animation: 'spin 1s linear infinite' }}>progress_activity</span>
          </div>
        ) : !user ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb4ab' }}>User not found</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#131b2e,#0b1326)', padding: '1.5rem 2rem', borderBottom: '1px solid rgba(195,192,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem', color: '#1d00a5', boxShadow: '0 8px 20px rgba(79,70,229,0.3)' }}>
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#dae2fd', letterSpacing: '-0.02em' }}>{user.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#c3c0ff', opacity: 0.8 }}>{user.email}</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c7c4d8', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: 24, padding: '0 2rem', borderBottom: '1px solid rgba(195,192,255,0.08)', background: '#131b2e' }}>
              {[
                { id: 'profile', label: 'Overview', icon: 'person' },
                { id: 'sessions', label: 'Session History', icon: 'history' },
                { id: 'assets', label: 'Documents & Assets', icon: 'folder_open' }
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === t.id ? '2px solid #c3c0ff' : '2px solid transparent', color: activeTab === t.id ? '#c3c0ff' : '#c7c4d8', fontWeight: activeTab === t.id ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   {/* Info Cards */}
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                    {[
                      { label: 'Role', value: user.role, icon: user.role === 'STUDENT' ? 'school' : 'psychology' },
                      { label: 'Department', value: user.department, icon: 'account_tree' },
                      { label: user.role === 'STUDENT' ? 'Roll Number' : 'Company', value: user.role === 'STUDENT' ? (user.profile_data?.rollNo || user.username) : user.profile_data?.company, icon: 'badge' },
                      { label: user.role === 'STUDENT' ? 'Year' : 'Batch', value: user.role === 'STUDENT' ? user.profile_data?.year : user.profile_data?.batchYear, icon: 'calendar_month' },
                      { label: 'Account Status', value: user.verification_status, icon: 'verified_user', color: user.verification_status === 'VERIFIED' ? '#4edea3' : '#ffb95f' },
                      { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString(), icon: 'history' },
                    ].map(i => (
                      <div key={i.label} style={{ background: '#171f33', padding: '1.25rem', borderRadius: 16, border: '1px solid rgba(195,192,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#c7c4d8', opacity: 0.7 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{i.icon}</span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{i.label}</span>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: i.color || '#dae2fd' }}>{i.value || 'N/A'}</div>
                      </div>
                    ))}
                  </div>

                  {/* Bio / About */}
                  <div style={{ background: '#171f33', padding: '1.5rem', borderRadius: 16, border: '1px solid rgba(195,192,255,0.05)' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c3c0ff', marginBottom: 12 }}>About User</h4>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#c7c4d8', margin: 0 }}>{user.profile_data?.bio || 'No bio provided.'}</p>
                  </div>

                  {/* Skills */}
                  {user.role === 'STUDENT' && user.profile_data?.skills?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c3c0ff', marginBottom: 12 }}>Technical Skills</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {user.profile_data.skills.map(s => (
                          <span key={s} style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(195,192,255,0.1)' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sessions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c3c0ff', marginBottom: 8 }}>Unified Session Log</h4>
                  {user.unified_sessions?.length === 0 && user.unified_interviews?.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', background: '#171f33', borderRadius: 16, color: '#c7c4d8', opacity: 0.6 }}>No sessions recorded yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Sessions from feedback table */}
                      {user.unified_sessions?.map(s => (
                        <details key={s.id} style={{ background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.05)', overflow: 'hidden' }}>
                          <summary style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', listStyle: 'none' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {s.topic || 'General Interview'}
                                <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(78,222,163,0.1)', color: '#4edea3' }}>FEEDBACK</span>
                              </div>
                              <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: '#c7c4d8' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span> {new Date(s.createdAt).toLocaleDateString()}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span> {s.duration_minutes || '—'} mins</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ffb95f', fontWeight: 700, fontSize: '0.9rem' }}>
                                  {s.student_rating ? <><span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>star</span> {s.student_rating}/5</> : 'No rating'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#4edea3', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{s.status}</div>
                              </div>
                              <span className="material-symbols-outlined" style={{ color: '#c7c4d8', opacity: 0.5 }}>expand_more</span>
                            </div>
                          </summary>
                          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(195,192,255,0.05)', background: 'rgba(0,0,0,0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#c3c0ff', textTransform: 'uppercase', marginBottom: 8 }}>Student Feedback</div>
                              <div style={{ fontSize: '0.85rem', color: '#dae2fd', background: '#0b1326', padding: '0.75rem', borderRadius: 10 }}>{s.student_feedback || 'No feedback provided by student.'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#4edea3', textTransform: 'uppercase', marginBottom: 8 }}>Alumni Feedback</div>
                              <div style={{ fontSize: '0.85rem', color: '#dae2fd', background: '#0b1326', padding: '0.75rem', borderRadius: 10 }}>{s.alumni_feedback || 'No feedback provided by alumni.'}</div>
                            </div>
                          </div>
                        </details>
                      ))}

                      {/* Interviews from records table (AI Transcripts) */}
                      {user.unified_interviews?.map(i => (
                        <details key={i.interview_id} style={{ background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.05)', overflow: 'hidden' }}>
                           <summary style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', listStyle: 'none' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                Mentorship Session
                                <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>AI INSIGHTS</span>
                              </div>
                              <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: '#c7c4d8' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span> {new Date(i.createdAt).toLocaleDateString()}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span> {user.role === 'STUDENT' ? i.alumni?.name : i.student?.name}</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase' }}>{i.status}</span>
                              <span className="material-symbols-outlined" style={{ color: '#c7c4d8', opacity: 0.5 }}>expand_more</span>
                            </div>
                          </summary>
                          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(195,192,255,0.05)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#c3c0ff', textTransform: 'uppercase', marginBottom: 8 }}>AI Analysis & Action Items</div>
                              <div style={{ fontSize: '0.85rem', color: '#dae2fd', background: '#0b1326', padding: '1rem', borderRadius: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{i.ai_action_items || 'Analysis in progress...'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Full Transcript</div>
                              <div style={{ fontSize: '0.8rem', color: '#c7c4d8', background: '#0b1326', padding: '1rem', borderRadius: 12, maxHeight: '200px', overflowY: 'auto', fontStyle: 'italic', lineHeight: 1.6 }}>{i.transcript || 'No transcript available for this session.'}</div>
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'assets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c3c0ff', marginBottom: 8 }}>Documents & Portfolio</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Resume */}
                    <div style={{ background: '#171f33', padding: '1.5rem', borderRadius: 20, border: '1px solid rgba(195,192,255,0.05)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,87,34,0.1)', color: '#ff5722', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>description</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Professional Resume</div>
                          <div style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>PDF Document</div>
                        </div>
                      </div>
                      {user.profile_assets?.find(a => a.asset_type === 'resume') ? (
                        <a href={user.profile_assets.find(a => a.asset_type === 'resume').asset_url} target="_blank" rel="noreferrer" style={{ width: '100%', marginTop: 8, padding: '0.75rem', borderRadius: 10, background: '#4f46e5', color: '#fff', textAlign: 'center', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, display: 'block' }}>View Resume</a>
                      ) : (
                        <div style={{ marginTop: 8, padding: '0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.03)', color: '#c7c4d8', textAlign: 'center', fontSize: '0.8rem', opacity: 0.5 }}>No resume uploaded</div>
                      )}
                    </div>

                    {/* LinkedIn / Portfolio */}
                    <div style={{ background: '#171f33', padding: '1.5rem', borderRadius: 20, border: '1px solid rgba(195,192,255,0.05)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(10,102,194,0.1)', color: '#0a66c2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>link</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Social & Portfolio</div>
                          <div style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>External Links</div>
                        </div>
                      </div>
                      {user.profile_data?.linkedin ? (
                        <a href={user.profile_data.linkedin.startsWith('http') ? user.profile_data.linkedin : `https://${user.profile_data.linkedin}`} target="_blank" rel="noreferrer" style={{ width: '100%', marginTop: 8, padding: '0.75rem', borderRadius: 10, background: '#0a66c2', color: '#fff', textAlign: 'center', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, display: 'block' }}>Visit LinkedIn</a>
                      ) : (
                        <div style={{ marginTop: 8, padding: '0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.03)', color: '#c7c4d8', textAlign: 'center', fontSize: '0.8rem', opacity: 0.5 }}>No links provided</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Actions */}
            <div style={{ padding: '1.25rem 2rem', background: '#131b2e', borderTop: '1px solid rgba(195,192,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <button
                 onClick={async () => {
                    const action = user.is_banned ? 'Restore Access' : 'Suspend Account';
                    if(!window.confirm(`Are you sure you want to ${action.toLowerCase()} for ${user.name}?`)) return;
                    try {
                      const headers = { 'Content-Type': 'application/json' };
                      if (token) headers['Authorization'] = `Bearer ${token}`;

                      const res = await fetch(`${API_BASE}/users/ban`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ userId: user.id, isBanned: !user.is_banned })
                      });
                      if (res.ok) {
                        onClose();
                        // Trigger a re-fetch of the directory instead of reload
                        if (typeof window.refreshTNPDirectory === 'function') {
                          window.refreshTNPDirectory();
                        }
                      }
                    } catch(err) { alert('Failed to update status'); }
                 }}
                 style={{ padding: '0.6rem 1.25rem', borderRadius: 10, background: user.is_banned ? 'rgba(78,222,163,0.1)' : 'rgba(255,180,171,0.1)', color: user.is_banned ? '#4edea3' : '#ffb4ab', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
               >
                 {user.is_banned ? 'Restore Account' : 'Suspend Account'}
               </button>
               <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: 12, background: 'rgba(195,192,255,0.05)', color: '#dae2fd', border: '1px solid rgba(195,192,255,0.1)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Close Inspector</button>
            </div>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}

// ── Main Directory Component ──────────────────────────────────────────────────
export default function DirectoryTab({ token }) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [alumni, setAlumni]     = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [search, setSearch]     = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir]     = useState('asc');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [isDeleting, setIsDeleting]     = useState(false);
  const [error, setError]       = useState('');

  const fetchDirectory = () => {
    setLoading(true);
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`${API_BASE}/stats/directory`, { headers })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setStudents(data.students || []);
        setAlumni(data.alumni || []);
        setError('');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  // Expose fetch globally for the modal to call
  useEffect(() => {
    window.refreshTNPDirectory = fetchDirectory;
    return () => { delete window.refreshTNPDirectory; };
  }, [token]);

  // Fetch directory data
  useEffect(() => {
    fetchDirectory();
  }, [token]);

  // Auto-refresh every 30s for live sync
  useEffect(() => {
    const interval = setInterval(() => {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      fetch(`${API_BASE}/stats/directory`, { headers })
        .then(r => r.json())
        .then(data => {
          if (!data.error) {
            setStudents(data.students || []);
            setAlumni(data.alumni || []);
          }
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const currentList = activeTab === 'students' ? students : alumni;

  const filtered = useMemo(() => {
    let list = [...currentList];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        (u.rollNo || '').toLowerCase().includes(q) ||
        (u.company || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [currentList, search, sortField, sortDir]);

  const studentCols = [
    { field: 'name',       label: 'Name',       width: '2fr' },
    { field: 'email',      label: 'Email',      width: '2fr' },
    { field: 'rollNo',     label: 'Roll No',    width: '1.2fr' },
    { field: 'department', label: 'Department',  width: '1.5fr' },
    { field: 'year',       label: 'Year',       width: '0.7fr' },
    { field: 'sessions',   label: 'Requests',   width: '0.8fr' },
  ];

  const alumniCols = [
    { field: 'name',       label: 'Name',       width: '2fr' },
    { field: 'email',      label: 'Email',      width: '2fr' },
    { field: 'company',    label: 'Company',    width: '1.5fr' },
    { field: 'department', label: 'Department',  width: '1.2fr' },
    { field: 'batchYear',  label: 'Batch',      width: '0.7fr' },
    { field: 'sessions',   label: 'Requests',   width: '0.8fr' },
  ];

  const cols = activeTab === 'students' ? studentCols : alumniCols;
  const gridTemplate = '40px ' + cols.map(c => c.width).join(' ') + ' 60px';

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(u => u.id)));
    }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleExport = () => {
    const dataToExport = filtered.map(u => ({
      Name: u.name,
      Email: u.email,
      Department: u.department,
      [activeTab === 'students' ? 'Roll No' : 'Company']: activeTab === 'students' ? u.rollNo : u.company,
      [activeTab === 'students' ? 'Year' : 'Batch']: activeTab === 'students' ? u.year : u.batchYear,
      Role: u.role,
      Requests: u.sessions,
      Interviews: u.interviews,
      Registered: new Date(u.createdAt).toLocaleDateString()
    }));
    exportToCSV(dataToExport, `AlumNex_${activeTab}_Directory`);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} selected ${activeTab}? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/users/bulk`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Update local state instantly
      const idsToDelete = Array.from(selectedIds);
      if (activeTab === 'students') setStudents(s => s.filter(u => !idsToDelete.includes(u.id)));
      else setAlumni(a => a.filter(u => !idsToDelete.includes(u.id)));
      
      setSelectedIds(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      {selectedUserId && <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} token={token} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>User Directory</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>
            Live view of all registered students and alumni mentors. Data syncs automatically.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4edea3', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>Live Sync</span>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[
          { label: 'Students', val: students.length, color: '#c3c0ff', icon: 'school' },
          { label: 'Alumni Mentors', val: alumni.length, color: '#4edea3', icon: 'psychology' },
          { label: 'Total Users', val: students.length + alumni.length, color: '#ffb95f', icon: 'group' },
        ].map(s => (
          <div key={s.label} style={{ background: '#131b2e', borderRadius: 14, padding: '1.25rem', border: `1px solid ${s.color}20`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'students', label: 'Students', icon: 'school', count: students.length },
            { id: 'alumni',   label: 'Alumni',   icon: 'psychology', count: alumni.length },
          ].map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSearch(''); setSortField('name'); setSelectedIds(new Set()); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1.25rem', borderRadius: 12, border: activeTab === t.id ? '2px solid #c3c0ff' : '2px solid rgba(70,69,85,0.3)', background: activeTab === t.id ? 'rgba(195,192,255,0.1)' : '#131b2e', color: activeTab === t.id ? '#c3c0ff' : '#c7c4d8', fontWeight: activeTab === t.id ? 700 : 400, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: activeTab === t.id ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
              {t.label}
              <span style={{ padding: '1px 6px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, background: activeTab === t.id ? '#c3c0ff' : '#222a3d', color: activeTab === t.id ? '#1d00a5' : '#c7c4d8' }}>{t.count}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {selectedIds.size > 0 && (
            <button onClick={handleDeleteSelected} disabled={isDeleting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.6rem 1rem', borderRadius: 10, border: 'none', background: 'rgba(255,180,171,0.15)', color: '#ffb4ab', fontSize: '0.8rem', fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{isDeleting ? 'hourglass_empty' : 'delete'}</span>
              Delete Selected ({selectedIds.size})
            </button>
          )}
          <button
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.6rem 1rem', borderRadius: 10, border: '1px solid rgba(195,192,255,0.2)', background: 'rgba(195,192,255,0.05)', color: '#c3c0ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Export CSV
          </button>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#464555' }}>search</span>
            <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}…`}
            style={{ background: '#131b2e', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 10, padding: '0.6rem 0.875rem 0.6rem 2.5rem', color: '#dae2fd', fontSize: '0.8rem', outline: 'none', width: 220, fontFamily: 'Inter, sans-serif' }}
          />
        </div>
      </div>
    </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 10, padding: '0.75rem 1rem', color: '#ffb4ab', fontSize: '0.8rem' }}>{error}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ background: '#131b2e', borderRadius: 20, padding: '3rem', textAlign: 'center', border: '1px solid rgba(70,69,85,0.15)' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(195,192,255,0.2)', borderTop: '3px solid #c3c0ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Loading directory…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#131b2e', borderRadius: 20, padding: '3rem', textAlign: 'center', border: '1px solid rgba(70,69,85,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#464555', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>
            {search ? 'search_off' : 'group_off'}
          </span>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>
            {search ? 'No results found' : `No ${activeTab} registered yet`}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#c7c4d8' }}>
            {search ? 'Try a different search term' : 'Use Bulk Upload to add users'}
          </div>
        </div>
      ) : (
        /* Table */
        <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
          {/* Header */}
          <div style={{ background: '#171f33', padding: '0.875rem 1.5rem', display: 'grid', gridTemplateColumns: gridTemplate, gap: 8, position: 'sticky', top: 0, zIndex: 1, alignItems: 'center' }}>
            <div onClick={toggleSelectAll} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 16, height: 16, border: '2px solid #60a5fa', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedIds.size > 0 && selectedIds.size === filtered.length ? '#60a5fa' : 'transparent' }}>
                {selectedIds.size > 0 && selectedIds.size === filtered.length && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#131b2e', fontWeight: 900 }}>check</span>}
              </div>
            </div>
            {cols.map(c => (
              <SortHeader key={c.field} label={c.label} field={c.field} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            ))}
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}></div>
          </div>
          {/* Rows */}
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {filtered.map((user, i) => (
              <div key={user.id} style={{ padding: '0.75rem 1.5rem', display: 'grid', gridTemplateColumns: gridTemplate, gap: 8, borderTop: '1px solid rgba(70,69,85,0.08)', background: selectedIds.has(user.id) ? 'rgba(96,165,250,0.08)' : (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'), alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => !selectedIds.has(user.id) && (e.currentTarget.style.background = 'rgba(195,192,255,0.04)')}
                onMouseLeave={e => !selectedIds.has(user.id) && (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                onClick={() => setSelectedUserId(user.id)}
              >
                <div onClick={e => toggleSelect(user.id, e)} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #60a5fa', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedIds.has(user.id) ? '#60a5fa' : 'transparent' }}>
                    {selectedIds.has(user.id) && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#131b2e', fontWeight: 900 }}>check</span>}
                  </div>
                </div>
                {cols.map(c => (
                  <div key={c.field} style={{ fontSize: '0.8rem', color: user.is_banned ? '#ffb4ab' : (c.field === 'name' ? '#dae2fd' : '#c7c4d8'), fontWeight: c.field === 'name' ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: user.is_banned ? 0.7 : 1 }}>
                    {c.field === 'name' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: user.is_banned ? '#ffb4ab' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: user.is_banned ? '#690005' : '#1d00a5', fontSize: '0.7rem', flexShrink: 0 }}>
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {user.name}
                          {user.is_banned && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffb4ab' }} title="Suspended">block</span>}
                        </span>
                      </div>
                    ) : (
                      user[c.field] || <span style={{ color: '#464555' }}>—</span>
                    )}
                  </div>
                ))}
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedUserId(user.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c3c0ff' }}>open_in_new</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid rgba(70,69,85,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#171f33' }}>
            <span style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>
              Showing {filtered.length} of {currentList.length} {activeTab}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(199,196,216,0.4)', fontWeight: 600 }}>
              Click row for details · Auto-refreshes every 30s
            </span>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </div>
  );
}

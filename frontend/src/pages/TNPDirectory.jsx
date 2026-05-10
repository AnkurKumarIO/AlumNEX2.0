import React, { useState, useEffect, useMemo } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
function UserDetailModal({ user, onClose }) {
  if (!user) return null;
  const profile = user.profile || {};
  const isStudent = !user.company && !user.jobTitle;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 998 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '90%', maxWidth: 540, maxHeight: '80vh', overflowY: 'auto', background: '#171f33', borderRadius: 20, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', zIndex: 999, padding: 0 }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(11,19,38,0.9))', padding: '1.5rem 2rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', color: '#1d00a5', flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#dae2fd' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2 }}>{user.email}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, background: isStudent ? 'rgba(195,192,255,0.15)' : 'rgba(78,222,163,0.15)', color: isStudent ? '#c3c0ff' : '#4edea3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {isStudent ? 'Student' : 'Alumni'}
                </span>
                {user.department && (
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.6rem', fontWeight: 600, background: '#222a3d', color: '#c7c4d8' }}>{user.department}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <span className="material-symbols-outlined" style={{ color: '#c7c4d8', fontSize: 20 }}>close</span>
          </button>
        </div>
        {/* Details */}
        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Username', value: user.username },
              { label: isStudent ? 'Roll No' : 'Company', value: isStudent ? user.rollNo : user.company },
              { label: isStudent ? 'College' : 'Job Title', value: isStudent ? user.college : user.jobTitle },
              { label: isStudent ? 'Year' : 'Batch', value: isStudent ? user.year : user.batchYear },
              { label: 'Sessions', value: user.sessions || 0 },
              { label: 'Interviews', value: user.interviews || 0 },
            ].filter(i => i.value !== undefined && i.value !== '').map(item => (
              <div key={item.label} style={{ background: '#131b2e', borderRadius: 10, padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c7c4d8', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#dae2fd' }}>{item.value}</div>
              </div>
            ))}
          </div>
          {/* Skills */}
          {isStudent && Array.isArray(profile.skills) && profile.skills.length > 0 && (
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c7c4d8', marginBottom: 8 }}>Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile.skills.map(s => (
                  <span key={s} style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', border: '1px solid rgba(195,192,255,0.2)' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {/* Bio */}
          {profile.bio && (
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c7c4d8', marginBottom: 6 }}>Bio</div>
              <div style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6, background: '#131b2e', borderRadius: 10, padding: '0.75rem 1rem' }}>{profile.bio}</div>
            </div>
          )}
          {/* Rating (alumni) */}
          {!isStudent && user.averageRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>star</span>
              <span style={{ fontWeight: 700, color: '#ffb95f', fontSize: '1rem' }}>{user.averageRating}</span>
              <span style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>({user.totalRatings} reviews)</span>
            </div>
          )}
          <div style={{ fontSize: '0.65rem', color: 'rgba(199,196,216,0.4)', textAlign: 'right', marginTop: 4 }}>
            Registered {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            {user.updatedAt && user.updatedAt !== user.createdAt && ` · Updated ${new Date(user.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Directory Component ──────────────────────────────────────────────────
export default function DirectoryTab() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [alumni, setAlumni]     = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [search, setSearch]     = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir]     = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [isDeleting, setIsDeleting]     = useState(false);
  const [error, setError]       = useState('');

  // Fetch directory data
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/stats/directory`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setStudents(data.students || []);
        setAlumni(data.alumni || []);
        setError('');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Auto-refresh every 30s for live sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_BASE}/stats/directory`)
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

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} selected ${activeTab}? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/users/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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
      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

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
                onClick={() => setSelectedUser(user)}
              >
                <div onClick={e => toggleSelect(user.id, e)} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #60a5fa', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedIds.has(user.id) ? '#60a5fa' : 'transparent' }}>
                    {selectedIds.has(user.id) && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#131b2e', fontWeight: 900 }}>check</span>}
                  </div>
                </div>
                {cols.map(c => (
                  <div key={c.field} style={{ fontSize: '0.8rem', color: c.field === 'name' ? '#dae2fd' : '#c7c4d8', fontWeight: c.field === 'name' ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.field === 'name' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1d00a5', fontSize: '0.7rem', flexShrink: 0 }}>
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    ) : (
                      user[c.field] || <span style={{ color: '#464555' }}>—</span>
                    )}
                  </div>
                ))}
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedUser(user); }}
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

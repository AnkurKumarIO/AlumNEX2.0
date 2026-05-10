import React, { useState, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

// ── Field maps ────────────────────────────────────────────────────────────────
const STUDENT_FIELDS = ['name', 'email', 'department', 'college', 'year', 'studentId'];
const ALUMNI_FIELDS  = ['name', 'email', 'department', 'company', 'jobTitle', 'batchYear'];

const FIELD_LABELS = {
  name: 'Full Name', email: 'Email', department: 'Department',
  college: 'College', year: 'Year', studentId: 'Student ID',
  company: 'Company', jobTitle: 'Job Title', batchYear: 'Batch Year',
};

function validateRow(row, type) {
  const errors = [];
  if (!row.name?.trim()) errors.push('Name is required');
  if (!row.email?.trim()) errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Invalid email');
  return errors;
}

// ── Upload result summary ─────────────────────────────────────────────────────
function UploadResult({ result, onReset }) {
  const { summary, results } = result;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem' }}>
        {[
          { label: 'Total',       val: summary.total,      color: '#c3c0ff' },
          { label: 'Created',     val: summary.created,    color: '#4edea3' },
          { label: 'Skipped',     val: summary.skipped,    color: '#ffb95f' },
          { label: 'Failed',      val: summary.failed,     color: '#ffb4ab' },
          { label: 'Emails Queued', val: summary.emailsSent || 0, color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} style={{ background: '#131b2e', borderRadius: 14, padding: '1.25rem', border: `1px solid ${s.color}20`, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Created accounts with passwords */}
      {results.created.length > 0 && (
        <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(78,222,163,0.2)' }}>
          <div style={{ background: 'rgba(78,222,163,0.08)', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(78,222,163,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#4edea3' }}>Accounts Created — Save These Credentials</span>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr', gap: 0, background: '#171f33', padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.15)' }}>
              {['Name', 'Email', 'Temp Password'].map(h => (
                <div key={h} style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{h}</div>
              ))}
            </div>
            {results.created.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr', gap: 0, padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dae2fd' }}>{r.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#c7c4d8' }}>{r.email}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#c3c0ff', fontWeight: 700 }}>{r.password}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed rows */}
      {results.failed.length > 0 && (
        <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,180,171,0.2)' }}>
          <div style={{ background: 'rgba(255,180,171,0.08)', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,180,171,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>error</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffb4ab' }}>Failed Rows</span>
          </div>
          {results.failed.map((r, i) => (
            <div key={i} style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#dae2fd' }}>{r.email}</span>
              <span style={{ fontSize: '0.75rem', color: '#ffb4ab' }}>{r.reason}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={onReset} style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', background: '#222a3d', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 12, color: '#c7c4d8', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
        ← Upload Another File
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BulkUploadTab() {
  const [type, setType]           = useState('students'); // 'students' | 'alumni'
  const [step, setStep]           = useState('upload');   // 'upload' | 'preview' | 'uploading' | 'done'
  const [parsed, setParsed]       = useState(null);       // { headers, rows }
  const [validRows, setValidRows] = useState([]);
  const [rowErrors, setRowErrors] = useState({});         // index → [errors]
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError]         = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef();

  const fields = type === 'students' ? STUDENT_FIELDS : ALUMNI_FIELDS;

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setError('Please upload a .csv file.'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target.result);
      if (rows.length === 0) { setError('CSV is empty or has no data rows.'); return; }

      // Validate each row
      const errors = {};
      rows.forEach((row, i) => {
        const errs = validateRow(row, type);
        if (errs.length) errors[i] = errs;
      });

      const valid = rows.filter((_, i) => !errors[i]);
      setParsed({ headers, rows });
      setValidRows(valid);
      setRowErrors(errors);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    setStep('uploading');
    try {
      const endpoint = type === 'students' ? '/register/bulk-students' : '/register/bulk-alumni';
      const body = type === 'students' ? { students: validRows } : { alumni: validRows };
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadResult(data);
      setStep('done');
    } catch (err) {
      setError(err.message);
      setStep('preview');
    }
  };

  const reset = () => {
    setStep('upload'); setParsed(null); setValidRows([]); setRowErrors({});
    setUploadResult(null); setError('');
  };

  const downloadTemplate = () => {
    window.open(`${API_BASE}/register/template/${type}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Bulk Upload</h2>
        <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Upload a CSV to create student or alumni accounts in bulk. Accounts are auto-verified and credentials are generated.</p>
      </div>

      {step === 'done' && uploadResult ? (
        <UploadResult result={uploadResult} onReset={reset} />
      ) : (
        <>
          {/* Type selector */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { id: 'students', label: 'Students', icon: 'school' },
              { id: 'alumni',   label: 'Alumni Mentors', icon: 'psychology' },
            ].map(t => (
              <button key={t.id} onClick={() => { setType(t.id); reset(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1.5rem', borderRadius: 12, border: type === t.id ? '2px solid #c3c0ff' : '2px solid rgba(70,69,85,0.3)', background: type === t.id ? 'rgba(195,192,255,0.1)' : '#131b2e', color: type === t.id ? '#c3c0ff' : '#c7c4d8', fontWeight: type === t.id ? 700 : 400, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: type === t.id ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Required fields info */}
          <div style={{ background: '#131b2e', borderRadius: 14, padding: '1rem 1.5rem', border: '1px solid rgba(70,69,85,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 8 }}>CSV Columns ({type === 'students' ? 'Students' : 'Alumni'})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {fields.map(f => (
                  <span key={f} style={{ padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, background: (f === 'name' || f === 'email') ? 'rgba(195,192,255,0.15)' : '#222a3d', color: (f === 'name' || f === 'email') ? '#c3c0ff' : '#c7c4d8', border: (f === 'name' || f === 'email') ? '1px solid rgba(195,192,255,0.3)' : 'none' }}>
                    {FIELD_LABELS[f]}{(f === 'name' || f === 'email') ? ' *' : ''}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.6rem 1.2rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
              Download Template
            </button>
          </div>

          {/* Drop zone */}
          {step === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{ background: dragOver ? 'rgba(195,192,255,0.08)' : '#131b2e', border: `2px dashed ${dragOver ? '#c3c0ff' : 'rgba(70,69,85,0.4)'}`, borderRadius: 20, padding: '3rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: dragOver ? '#c3c0ff' : '#464555', display: 'block', marginBottom: 12, fontVariationSettings: "'FILL' 1" }}>upload_file</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: dragOver ? '#c3c0ff' : '#dae2fd' }}>Drop your CSV here or click to browse</div>
              <div style={{ fontSize: '0.78rem', color: '#c7c4d8' }}>Supports .csv files up to 500 rows</div>
            </div>
          )}

          {/* Preview table */}
          {step === 'preview' && parsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Stats bar */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total rows',   val: parsed.rows.length,                    color: '#c3c0ff' },
                  { label: 'Valid',        val: validRows.length,                       color: '#4edea3' },
                  { label: 'With errors',  val: Object.keys(rowErrors).length,          color: '#ffb4ab' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#131b2e', borderRadius: 10, padding: '0.5rem 1rem', display: 'flex', gap: 8, alignItems: 'center', border: `1px solid ${s.color}20` }}>
                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: s.color }}>{s.val}</span>
                    <span style={{ fontSize: '0.72rem', color: '#c7c4d8', fontWeight: 600 }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)', maxHeight: 400, overflowY: 'auto' }}>
                <div style={{ background: '#171f33', padding: '0.75rem 1.25rem', display: 'grid', gridTemplateColumns: `repeat(${fields.length},1fr) 80px`, gap: 8, position: 'sticky', top: 0, zIndex: 1 }}>
                  {fields.map(f => (
                    <div key={f} style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{FIELD_LABELS[f]}</div>
                  ))}
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>Status</div>
                </div>
                {parsed.rows.map((row, i) => {
                  const errs = rowErrors[i];
                  return (
                    <div key={i} style={{ padding: '0.75rem 1.25rem', display: 'grid', gridTemplateColumns: `repeat(${fields.length},1fr) 80px`, gap: 8, borderTop: '1px solid rgba(70,69,85,0.08)', background: errs ? 'rgba(255,180,171,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', alignItems: 'center' }}>
                      {fields.map(f => (
                        <div key={f} style={{ fontSize: '0.75rem', color: '#dae2fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[f] || <span style={{ color: '#464555' }}>—</span>}</div>
                      ))}
                      <div>
                        {errs ? (
                          <span title={errs.join(', ')} style={{ background: 'rgba(255,180,171,0.15)', color: '#ffb4ab', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, cursor: 'help' }}>✗ Error</span>
                        ) : (
                          <span style={{ background: 'rgba(78,222,163,0.12)', color: '#4edea3', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700 }}>✓ Valid</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div style={{ background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 10, padding: '0.75rem 1rem', color: '#ffb4ab', fontSize: '0.8rem' }}>{error}</div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={reset} style={{ padding: '0.75rem 1.5rem', background: '#222a3d', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 12, color: '#c7c4d8', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                  ← Back
                </button>
                <button
                  onClick={handleUpload}
                  disabled={validRows.length === 0}
                  style={{ padding: '0.75rem 2rem', background: validRows.length === 0 ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: validRows.length === 0 ? '#464555' : '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: validRows.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cloud_upload</span>
                  Create {validRows.length} Account{validRows.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {/* Uploading state */}
          {step === 'uploading' && (
            <div style={{ background: '#131b2e', borderRadius: 20, padding: '3rem', textAlign: 'center', border: '1px solid rgba(70,69,85,0.15)' }}>
              <div style={{ width: 48, height: 48, border: '3px solid rgba(195,192,255,0.2)', borderTop: '3px solid #c3c0ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Creating accounts…</div>
              <div style={{ fontSize: '0.78rem', color: '#c7c4d8' }}>This may take a moment for large uploads</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { api } from '../api';

export default function TNPMeetingTools() {
  const [title, setTitle] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Generate a unique room ID if not provided
    const finalRoomId = roomId.trim() || `tnp-${Date.now()}`;

    try {
      // POST to /meet/create
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/meet/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: finalRoomId,
          title: title || 'AlumNEX Centralized Meeting',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create meeting link');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result && result.meetLink) {
      navigator.clipboard.writeText(result.meetLink);
      alert('Meeting link copied to clipboard!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Meeting Tools</h2>
        <p style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 4 }}>
          Generate Google Meet links for placement drives, orientations, or general use.
          Hosted by the centralized AlumNEX platform account.
        </p>
      </div>

      <div style={{ background: '#131b2e', borderRadius: 20, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.2)' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: '#c3c0ff' }}>video_call</span>
          Create Instant Meeting
        </h3>

        <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 400 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#c7c4d8', marginBottom: 6 }}>Meeting Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pre-Placement Talk"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, background: '#171f33', border: '1px solid rgba(70,69,85,0.3)', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#c7c4d8', marginBottom: 6 }}>Custom Room ID (Optional)</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Leave blank for auto-generated ID"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, background: '#171f33', border: '1px solid rgba(70,69,85,0.3)', color: '#fff' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              background: loading ? '#4f46e580' : '#4f46e5',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>autorenew</span>
            ) : (
              <span className="material-symbols-outlined">add_circle</span>
            )}
            {loading ? 'Generating...' : 'Generate Link'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.875rem' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Error</div>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#171f33', border: '1px solid #4edea350', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4edea3', fontWeight: 600, marginBottom: '1rem' }}>
              <span className="material-symbols-outlined">check_circle</span>
              Meeting Created Successfully
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              <span style={{ color: '#c7c4d8' }}>Meeting Title:</span>
              <span style={{ fontWeight: 600 }}>{result.title}</span>
              
              <span style={{ color: '#c7c4d8' }}>Room ID:</span>
              <span style={{ fontFamily: 'monospace', background: 'rgba(70,69,85,0.2)', padding: '2px 6px', borderRadius: 4 }}>{result.roomId}</span>
              
              <span style={{ color: '#c7c4d8' }}>Meeting Link:</span>
              <a href={result.meetLink} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', wordBreak: 'break-all' }}>
                {result.meetLink}
              </a>

              <span style={{ color: '#c7c4d8' }}>Provider:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {result.isGoogleMeet ? (
                  <><span className="material-symbols-outlined" style={{ fontSize: 16, color: '#4edea3' }}>videocam</span> Google Meet</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ffb95f' }}>videocam</span> Jitsi Fallback</>
                )}
              </span>
            </div>

            <button
              onClick={copyToClipboard}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 6,
                background: 'rgba(70,69,85,0.2)',
                border: '1px solid rgba(70,69,85,0.3)',
                color: '#fff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
              Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

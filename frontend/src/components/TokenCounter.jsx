import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function TokenCounter({ studentId, refreshTick }) {
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    api.get(`/requests/tokens/${studentId}`)
      .then(res => {
        setTokens(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch tokens error:', err);
        setLoading(false);
      });
  }, [studentId, refreshTick]);

  if (loading || !tokens) return null;

  const { remaining, max, resetsAt } = tokens;
  const resetDate = new Date(resetsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(34, 42, 61, 0.5) 0%, rgba(19, 27, 46, 0.5) 100%)',
      borderRadius: 12,
      padding: '0.875rem 1rem',
      border: '1px solid rgba(195, 192, 255, 0.08)',
      marginBottom: 12,
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#c3c0ff', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#ffb95f' }}>toll</span>
          Request Balance
        </span>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#dae2fd' }}>
          <strong style={{ fontSize: '0.9rem', color: remaining > 0 ? '#4edea3' : '#ffb4ab' }}>{remaining}</strong>
          <span style={{ color: 'rgba(199, 196, 216, 0.4)', margin: '0 2px' }}>/</span>
          {max}
        </span>
      </div>

      {/* Progress Glowing Pills */}
      <div style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: max }).map((_, i) => {
          const active = i < remaining;
          return (
            <div key={i} style={{
              flex: 1,
              height: 5,
              borderRadius: 2.5,
              background: active ? 'linear-gradient(90deg, #4f46e5, #c3c0ff)' : 'rgba(70, 69, 85, 0.3)',
              boxShadow: 'none',
              transition: 'all 0.3s ease'
            }} />
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#c7c4d8', opacity: 0.85 }}>
        <span>Weekly tokens</span>
        <span>Resets {resetDate}</span>
      </div>
    </div>
  );
}

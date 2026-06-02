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
    <div style={{ background: '#222a3d', borderRadius: 12, padding: '1rem', border: '1px solid rgba(195,192,255,0.15)', marginBottom: 12 }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#c7c4d8', marginBottom: 8, letterSpacing: '0.05em' }}>
        Weekly Request Tokens
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            width: 24, height: 24, borderRadius: 6,
            background: i < remaining ? 'rgba(195,192,255,0.2)' : 'rgba(70,69,85,0.2)',
            border: `1px solid ${i < remaining ? 'rgba(195,192,255,0.4)' : 'rgba(70,69,85,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: i < remaining ? '#c3c0ff' : '#464555'
          }}>
            {i < remaining ? '●' : '○'}
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#c7c4d8' }}>
        {remaining}/{max} tokens left • Resets {resetDate}
      </div>
    </div>
  );
}

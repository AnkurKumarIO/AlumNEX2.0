import React from 'react';

export default function PremiumPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      fontFamily: 'Inter, sans-serif',
      color: '#dae2fd',
      textAlign: 'center',
      padding: '3rem',
    }}>
      <div style={{
        width: 80, height: 80,
        borderRadius: '50%',
        background: 'linear-gradient(135deg,rgba(195,192,255,0.15),rgba(79,70,229,0.1))',
        border: '2px solid rgba(195,192,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '2rem',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#c3c0ff', fontVariationSettings: "'FILL' 1" }}>
          rocket_launch
        </span>
      </div>

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '0.3rem 1rem',
        background: 'rgba(195,192,255,0.06)',
        border: '1px solid rgba(195,192,255,0.15)',
        borderRadius: 999, marginBottom: '1.5rem',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c3c0ff', display: 'inline-block' }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Mentorship
        </span>
      </div>

      <h1 style={{
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        fontWeight: 900,
        letterSpacing: '-0.04em',
        marginBottom: '1rem',
        lineHeight: 1.1,
      }}>
        Coming{' '}
        <span style={{
          background: 'linear-gradient(135deg,#c3c0ff,#4edea3)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Soon
        </span>
      </h1>

      <p style={{
        fontSize: '1rem',
        color: '#c7c4d8',
        maxWidth: 480,
        lineHeight: 1.7,
        opacity: 0.8,
      }}>
        The Mentorship feature is currently under development. Stay tuned — something exciting is on the way.
      </p>
    </div>
  );
}

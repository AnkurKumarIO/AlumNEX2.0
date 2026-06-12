import React from 'react';
import AlumNexLogo from '../AlumNexLogo';

export default function Footer() {
  return (
    <footer style={{
      background: '#0b1326',
      borderTop: '1px solid rgba(70,69,85,0.2)',
      padding: '2.5rem 2rem',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        {/* Top row: Brand */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlumNexLogo size="md" />
          </div>
        </div>

        {/* Bottom row: Copyright + Developer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(70,69,85,0.15)',
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: '#c7c4d8',
            margin: 0,
            opacity: 0.8,
          }}>
            © 2026 AlumNEX. All rights reserved.
          </p>
          <p style={{
            fontSize: '0.75rem',
            color: '#c7c4d8',
            margin: 0,
            opacity: 0.7,
          }}>
            Developed by <span style={{ color: '#c3c0ff', fontWeight: 600, opacity: 1 }}>The Tesseract</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

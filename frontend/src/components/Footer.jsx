import React from 'react';
import { Link } from 'react-router-dom';
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
        {/* Top row: Brand + Links */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlumNexLogo size={28} />
            <div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.02em',
              }}>
                Alum<span style={{ color: '#a855f7' }}>NEX</span>
              </div>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#c7c4d8',
                marginTop: 2,
              }}>
                Intelligence Platform
              </div>
            </div>
          </div>

          {/* Links */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <Link
              to="/privacy"
              style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#c7c4d8',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.color = '#c3c0ff'}
              onMouseOut={e => e.currentTarget.style.color = '#c7c4d8'}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#c7c4d8',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.color = '#c3c0ff'}
              onMouseOut={e => e.currentTarget.style.color = '#c7c4d8'}
            >
              Terms &amp; Conditions
            </Link>
            <a
              href="#"
              style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#c7c4d8',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.color = '#c3c0ff'}
              onMouseOut={e => e.currentTarget.style.color = '#c7c4d8'}
            >
              Contact Us
            </a>
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

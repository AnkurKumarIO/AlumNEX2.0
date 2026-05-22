import React from 'react';
import { Link } from 'react-router-dom';

import AlumNexLogo from '../AlumNexLogo';
import RoleCards from '../components/RoleCards';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div style={{ 
      background: '#0b1326', 
      color: '#dae2fd', 
      fontFamily: 'Inter, sans-serif', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* Hero Section */}
      <main style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: 'clamp(4rem, 10vh, 8rem) 2rem clamp(3rem, 8vh, 6rem)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        width: '100%'
      }}>
        <section style={{ 
          textAlign: 'center', 
          marginBottom: 'clamp(3rem, 8vh, 5rem)', 
          maxWidth: 900,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(1.5rem, 4vh, 2.5rem)'
        }}>
          {/* Logo - Properly sized for hero */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <AlumNexLogo size="2xl" className="md:h-24 lg:h-28" />
          </div>

          {/* Main Heading - Clear hierarchy */}
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
            fontWeight: 900, 
            letterSpacing: '-0.04em', 
            lineHeight: 1.1, 
            margin: 0,
            textShadow: '0 0 20px rgba(195,192,255,0.3)',
            maxWidth: '800px'
          }}>
            The Intelligence Bridge Between{' '}
            <span style={{ color: '#c3c0ff' }}>Campus</span> and{' '}
            <span style={{ color: '#4edea3' }}>Career</span>
          </h1>

          {/* Subtitle - Clear visual separation */}
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.125rem)', 
            color: '#c7c4d8', 
            lineHeight: 1.7, 
            maxWidth: 640, 
            margin: 0,
            opacity: 0.9
          }}>
            AlumNex connects students, alumni, and administrators through career pathways, mock interviews, and mentorship.
          </p>
        </section>

        {/* Portal Cards */}
        <RoleCards />

        {/* Network Intelligence Section */}
        <section style={{ 
          marginTop: 'clamp(4rem, 10vh, 8rem)', 
          width: '100%' 
        }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 'clamp(2.5rem, 6vh, 4rem)' 
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2rem)', 
              fontWeight: 700, 
              letterSpacing: '-0.02em', 
              textShadow: '0 0 20px rgba(195,192,255,0.3)',
              margin: 0,
              marginBottom: '0.75rem'
            }}>
              Network Intelligence
            </h2>
            <p style={{ 
              fontSize: 'clamp(0.6rem, 1.5vw, 0.65rem)', 
              color: '#c7c4d8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.3em', 
              fontWeight: 700,
              margin: 0
            }}>
              Data-Driven Connections
            </p>
          </div>

          {/* Responsive Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem',
            '@media (min-width: 768px)': {
              gridTemplateColumns: '2fr 1fr'
            }
          }}>
            {/* Main Feature Card */}
            <div style={{ 
              background: '#171f33', 
              borderRadius: 14, 
              overflow: 'hidden', 
              position: 'relative',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'flex-end'
            }}>
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'linear-gradient(to top, #0b1326 0%, rgba(11,19,38,0.4) 40%, transparent 100%)', 
                zIndex: 1 
              }} />
              <div style={{ 
                position: 'relative',
                zIndex: 2,
                padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                width: '100%'
              }}>
                <h4 style={{ 
                  fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', 
                  fontWeight: 700, 
                  color: '#c3c0ff', 
                  marginBottom: '0.5rem',
                  margin: 0
                }}>
                  Predictive Pathways
                </h4>
                <p style={{ 
                  fontSize: 'clamp(0.8rem, 2vw, 0.875rem)', 
                  color: '#c7c4d8', 
                  maxWidth: 480, 
                  lineHeight: 1.6,
                  margin: 0,
                  marginTop: '0.5rem'
                }}>
                  Our platform analyzes thousands of career trajectories to recommend the most efficient path for students based on their specific skill sets.
                </p>
              </div>
              {/* Decorative grid */}
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(195,192,255,0.08) 1px, transparent 0)', 
                backgroundSize: '32px 32px' 
              }} />
            </div>

            {/* Stats Cards */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.5rem' 
            }}>
              <div style={{ 
                flex: 1, 
                background: '#222a3d', 
                borderRadius: 14, 
                padding: 'clamp(1.5rem, 4vw, 2rem)', 
                borderLeft: '2px solid rgba(195,192,255,0.5)', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                minHeight: '140px'
              }}>
                <span className="material-symbols-outlined" style={{ 
                  color: '#c3c0ff', 
                  fontSize: 'clamp(24px, 5vw, 28px)', 
                  marginBottom: '0.75rem' 
                }}>
                  auto_awesome
                </span>
                <div style={{ 
                  fontSize: 'clamp(1.75rem, 4vw, 2rem)', 
                  fontWeight: 900,
                  lineHeight: 1
                }}>
                  94%
                </div>
                <div style={{ 
                  fontSize: 'clamp(0.55rem, 1.5vw, 0.6rem)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.15em', 
                  color: '#c7c4d8', 
                  fontWeight: 700, 
                  marginTop: '0.5rem' 
                }}>
                  Match Accuracy
                </div>
              </div>
              <div style={{ 
                flex: 1, 
                background: '#131b2e', 
                borderRadius: 14, 
                padding: 'clamp(1.5rem, 4vw, 2rem)', 
                border: '1px solid rgba(70,69,85,0.15)', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                minHeight: '140px'
              }}>
                <span className="material-symbols-outlined" style={{ 
                  color: '#4edea3', 
                  fontSize: 'clamp(24px, 5vw, 28px)', 
                  marginBottom: '0.75rem' 
                }}>
                  groups
                </span>
                <div style={{ 
                  fontSize: 'clamp(1.75rem, 4vw, 2rem)', 
                  fontWeight: 900,
                  lineHeight: 1
                }}>
                  12k+
                </div>
                <div style={{ 
                  fontSize: 'clamp(0.55rem, 1.5vw, 0.6rem)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.15em', 
                  color: '#c7c4d8', 
                  fontWeight: 700, 
                  marginTop: '0.5rem' 
                }}>
                  Active Mentors
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

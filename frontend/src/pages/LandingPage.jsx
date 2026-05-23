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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

            {/* ── LEFT: Interactive Node Graph ── */}
            <div style={{ background: '#0d1526', borderRadius: 14, overflow: 'hidden', position: 'relative', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', border: '1px solid rgba(195,192,255,0.08)' }}>
              <svg viewBox="0 0 400 260" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="ng1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#c3c0ff" stopOpacity="0.9"/><stop offset="100%" stopColor="#c3c0ff" stopOpacity="0"/></radialGradient>
                  <radialGradient id="ng2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#4edea3" stopOpacity="0.9"/><stop offset="100%" stopColor="#4edea3" stopOpacity="0"/></radialGradient>
                  <radialGradient id="ng3" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffb95f" stopOpacity="0.9"/><stop offset="100%" stopColor="#ffb95f" stopOpacity="0"/></radialGradient>
                  <filter id="nb"><feGaussianBlur stdDeviation="4"/></filter>
                  <style>{`@keyframes ndash{to{stroke-dashoffset:-24}}@keyframes npulse{0%,100%{opacity:.5}50%{opacity:1}}.ne{stroke-dasharray:6 6;animation:ndash 1.4s linear infinite}.nes{stroke-dasharray:6 6;animation:ndash 2.2s linear infinite}.np{animation:npulse 2s ease-in-out infinite}.npg{animation:npulse 2.4s ease-in-out infinite}.npo{animation:npulse 2.8s ease-in-out infinite}`}</style>
                </defs>
                {/* Glow halos */}
                <circle cx="200" cy="120" r="28" fill="url(#ng1)" filter="url(#nb)" opacity="0.6"/>
                <circle cx="80"  cy="70"  r="18" fill="url(#ng2)" filter="url(#nb)" opacity="0.5"/>
                <circle cx="320" cy="60"  r="16" fill="url(#ng3)" filter="url(#nb)" opacity="0.5"/>
                <circle cx="60"  cy="180" r="14" fill="url(#ng2)" filter="url(#nb)" opacity="0.4"/>
                <circle cx="340" cy="170" r="14" fill="url(#ng1)" filter="url(#nb)" opacity="0.4"/>
                <circle cx="200" cy="220" r="14" fill="url(#ng3)" filter="url(#nb)" opacity="0.4"/>
                <circle cx="130" cy="200" r="12" fill="url(#ng1)" filter="url(#nb)" opacity="0.3"/>
                <circle cx="270" cy="210" r="12" fill="url(#ng2)" filter="url(#nb)" opacity="0.3"/>
                {/* Edges */}
                <line x1="200" y1="120" x2="80"  y2="70"  stroke="#c3c0ff" strokeWidth="1.2" opacity="0.35" className="ne"/>
                <line x1="200" y1="120" x2="320" y2="60"  stroke="#ffb95f" strokeWidth="1.2" opacity="0.35" className="nes"/>
                <line x1="200" y1="120" x2="60"  y2="180" stroke="#4edea3" strokeWidth="1.2" opacity="0.35" className="ne"/>
                <line x1="200" y1="120" x2="340" y2="170" stroke="#c3c0ff" strokeWidth="1.2" opacity="0.35" className="nes"/>
                <line x1="200" y1="120" x2="200" y2="220" stroke="#ffb95f" strokeWidth="1.2" opacity="0.35" className="ne"/>
                <line x1="200" y1="120" x2="130" y2="200" stroke="#4edea3" strokeWidth="1"   opacity="0.25" className="nes"/>
                <line x1="200" y1="120" x2="270" y2="210" stroke="#c3c0ff" strokeWidth="1"   opacity="0.25" className="ne"/>
                <line x1="80"  y1="70"  x2="130" y2="200" stroke="#c3c0ff" strokeWidth="0.8" opacity="0.12" className="nes"/>
                <line x1="320" y1="60"  x2="340" y2="170" stroke="#ffb95f" strokeWidth="0.8" opacity="0.12" className="ne"/>
                <line x1="60"  y1="180" x2="130" y2="200" stroke="#4edea3" strokeWidth="0.8" opacity="0.12" className="nes"/>
                <line x1="270" y1="210" x2="340" y2="170" stroke="#c3c0ff" strokeWidth="0.8" opacity="0.12" className="ne"/>
                {/* Center node */}
                <circle cx="200" cy="120" r="18" fill="#1a2240" stroke="#c3c0ff" strokeWidth="2"/>
                <circle cx="200" cy="115" r="4.5" fill="#c3c0ff" opacity="0.9" className="np"/>
                <path d="M192 128 Q200 122 208 128" stroke="#c3c0ff" strokeWidth="1.5" fill="none" opacity="0.9"/>
                {/* Leaf nodes */}
                <circle cx="80"  cy="70"  r="13" fill="#131b2e" stroke="#4edea3" strokeWidth="1.5" className="npg"/>
                <text x="80"  y="74"  textAnchor="middle" fill="#4edea3" fontSize="7" fontWeight="700">SDE</text>
                <circle cx="320" cy="60"  r="13" fill="#131b2e" stroke="#ffb95f" strokeWidth="1.5" className="npo"/>
                <text x="320" y="57"  textAnchor="middle" fill="#ffb95f" fontSize="6" fontWeight="700">Tech</text>
                <text x="320" y="65"  textAnchor="middle" fill="#ffb95f" fontSize="6" fontWeight="700">Lead</text>
                <circle cx="60"  cy="180" r="12" fill="#131b2e" stroke="#4edea3" strokeWidth="1.5" className="npg"/>
                <text x="60"  y="184" textAnchor="middle" fill="#4edea3" fontSize="6.5" fontWeight="700">GOOG</text>
                <circle cx="340" cy="170" r="12" fill="#131b2e" stroke="#c3c0ff" strokeWidth="1.5" className="np"/>
                <text x="340" y="174" textAnchor="middle" fill="#c3c0ff" fontSize="7" fontWeight="700">CTO</text>
                <circle cx="200" cy="220" r="11" fill="#131b2e" stroke="#ffb95f" strokeWidth="1.5" className="npo"/>
                <text x="200" y="224" textAnchor="middle" fill="#ffb95f" fontSize="6.5" fontWeight="700">MSFT</text>
                <circle cx="130" cy="200" r="10" fill="#131b2e" stroke="#c3c0ff" strokeWidth="1.2" className="np"/>
                <text x="130" y="204" textAnchor="middle" fill="#c3c0ff" fontSize="6" fontWeight="700">ML</text>
                <circle cx="270" cy="210" r="10" fill="#131b2e" stroke="#4edea3" strokeWidth="1.2" className="npg"/>
                <text x="270" y="214" textAnchor="middle" fill="#4edea3" fontSize="6" fontWeight="700">META</text>
              </svg>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0b1326 0%, rgba(11,19,38,0.3) 50%, transparent 100%)', zIndex: 1 }}/>
              <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(1.5rem, 4vw, 2rem)' }}>
                <h4 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 700, color: '#c3c0ff', margin: 0 }}>Predictive Pathways</h4>
                <p style={{ fontSize: 'clamp(0.78rem, 2vw, 0.85rem)', color: '#c7c4d8', maxWidth: 420, lineHeight: 1.6, margin: '0.5rem 0 0 0' }}>
                  Our platform analyzes thousands of career trajectories to recommend the most efficient path for students based on their specific skill sets.
                </p>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* RIGHT TOP: Donut ring + neon bar */}
              <div style={{ flex: 1, background: '#222a3d', borderRadius: 14, padding: 'clamp(1.25rem, 3vw, 1.75rem)', borderLeft: '2px solid rgba(195,192,255,0.5)', display: 'flex', alignItems: 'center', gap: '1.25rem', minHeight: '140px', overflow: 'hidden' }}>
                <svg width="76" height="76" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
                  <defs>
                    <filter id="rg"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <style>{`@keyframes fillRing{from{stroke-dashoffset:188}to{stroke-dashoffset:11}}.rf{animation:fillRing 1.8s ease-out forwards}`}</style>
                  </defs>
                  <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(195,192,255,0.1)" strokeWidth="8"/>
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#c3c0ff" strokeWidth="8" strokeLinecap="round" strokeDasharray="188" strokeDashoffset="11" transform="rotate(-90 40 40)" filter="url(#rg)" className="rf" opacity="0.9"/>
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#c3c0ff" strokeWidth="14" strokeDasharray="188" strokeDashoffset="11" transform="rotate(-90 40 40)" opacity="0.06"/>
                  <text x="40" y="45" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="900">94%</text>
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'clamp(1.5rem, 3.5vw, 1.85rem)', fontWeight: 900, lineHeight: 1, color: '#fff' }}>94%</div>
                  <div style={{ fontSize: 'clamp(0.55rem, 1.5vw, 0.6rem)', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c7c4d8', fontWeight: 700, marginTop: '0.4rem' }}>Match Accuracy</div>
                  <div style={{ marginTop: '0.75rem', height: 4, borderRadius: 4, background: 'rgba(195,192,255,0.12)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '94%', borderRadius: 4, background: 'linear-gradient(90deg,#4f46e5,#c3c0ff)', boxShadow: '0 0 8px #c3c0ff' }}/>
                  </div>
                </div>
              </div>

              {/* RIGHT BOTTOM: Glowing dot heatmap */}
              <div style={{ flex: 1, background: '#131b2e', borderRadius: 14, padding: 'clamp(1.25rem, 3vw, 1.75rem)', border: '1px solid rgba(70,69,85,0.15)', minHeight: '140px', overflow: 'hidden', position: 'relative' }}>
                <svg viewBox="0 0 220 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.8 }} preserveAspectRatio="xMidYMid slice">
                  <defs><style>{`@keyframes dp{0%,100%{opacity:.15}50%{opacity:.9}}.dp{animation:dp var(--d,2s) ease-in-out infinite;animation-delay:var(--dl,0s)}`}</style></defs>
                  {[[10,10,2,'#4edea3',2.1,0],[30,10,1.5,'#c3c0ff',1.8,.3],[50,10,2.5,'#4edea3',2.4,.1],[70,10,1.5,'#c3c0ff',1.9,.5],[90,10,2,'#ffb95f',2.2,.2],[110,10,1.5,'#4edea3',2,.4],[130,10,2,'#c3c0ff',1.7,.1],[150,10,1.5,'#4edea3',2.3,.6],[170,10,2,'#c3c0ff',2.1,.2],[190,10,1.5,'#ffb95f',1.8,.4],[210,10,2,'#4edea3',2,.3],
                    [10,25,1.5,'#c3c0ff',2,.2],[30,25,3,'#4edea3',1.6,0],[50,25,1.5,'#c3c0ff',2.2,.4],[70,25,3,'#4edea3',1.9,.1],[90,25,1.5,'#c3c0ff',2.4,.5],[110,25,3,'#ffb95f',1.7,.2],[130,25,1.5,'#4edea3',2.1,.3],[150,25,3,'#c3c0ff',1.8,0],[170,25,1.5,'#4edea3',2.3,.6],[190,25,2.5,'#c3c0ff',2,.1],[210,25,1.5,'#ffb95f',1.9,.4],
                    [10,40,2,'#4edea3',1.8,.1],[30,40,1.5,'#c3c0ff',2.2,.5],[50,40,3,'#ffb95f',1.6,0],[70,40,1.5,'#4edea3',2,.3],[90,40,3,'#c3c0ff',1.9,.2],[110,40,1.5,'#4edea3',2.3,.4],[130,40,2.5,'#c3c0ff',1.7,.1],[150,40,1.5,'#ffb95f',2.1,.5],[170,40,3,'#4edea3',1.8,0],[190,40,1.5,'#c3c0ff',2.4,.3],[210,40,2,'#4edea3',2,.2],
                    [10,55,1.5,'#c3c0ff',2.1,.4],[30,55,2,'#4edea3',1.9,.1],[50,55,1.5,'#c3c0ff',2.3,.5],[70,55,2.5,'#ffb95f',1.7,0],[90,55,1.5,'#4edea3',2,.3],[110,55,2,'#c3c0ff',1.8,.2],[130,55,1.5,'#4edea3',2.2,.4],[150,55,2.5,'#c3c0ff',1.6,.1],[170,55,1.5,'#ffb95f',2.4,.5],[190,55,2,'#4edea3',1.9,0],[210,55,1.5,'#c3c0ff',2.1,.3],
                    [10,70,2,'#4edea3',1.7,.2],[30,70,1.5,'#c3c0ff',2.3,.4],[50,70,2,'#4edea3',1.9,.1],[70,70,1.5,'#ffb95f',2.1,.5],[90,70,2.5,'#c3c0ff',1.8,0],[110,70,1.5,'#4edea3',2.4,.3],[130,70,2,'#c3c0ff',1.6,.2],[150,70,1.5,'#4edea3',2.2,.4],[170,70,2.5,'#c3c0ff',1.9,.1],[190,70,1.5,'#ffb95f',2,.5],[210,70,2,'#4edea3',1.7,0],
                  ].map(([cx,cy,r,color,d,dl],i) => (
                    <circle key={i} cx={cx} cy={cy} r={r} fill={color} className="dp" style={{'--d':`${d}s`,'--dl':`${dl}s`}}/>
                  ))}
                </svg>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(19,27,46,0.65) 0%,rgba(19,27,46,0.25) 100%)', borderRadius: 14 }}/>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 'clamp(22px,4vw,26px)', marginBottom: '0.5rem', display: 'block' }}>groups</span>
                  <div style={{ fontSize: 'clamp(1.75rem,4vw,2rem)', fontWeight: 900, lineHeight: 1, color: '#fff' }}>12k+</div>
                  <div style={{ fontSize: 'clamp(0.55rem,1.5vw,0.6rem)', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c7c4d8', fontWeight: 700, marginTop: '0.4rem' }}>Active Mentors</div>
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

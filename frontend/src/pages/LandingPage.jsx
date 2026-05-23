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
            <div style={{ background: 'linear-gradient(135deg,#0a1020 0%,#0d1526 60%,#0f1a2e 100%)', borderRadius: 16, overflow: 'hidden', position: 'relative', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', border: '1px solid rgba(195,192,255,0.1)', boxShadow: '0 0 40px rgba(79,70,229,0.08) inset' }}>

              {/* Subtle dot-grid background */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(195,192,255,0.06) 1px, transparent 0)', backgroundSize: '28px 28px', zIndex: 0 }}/>

              {/* SVG Graph — horizontal career progression */}
              <svg viewBox="0 0 440 280" style={{ position: 'absolute', inset: 0, width: '100%', height: '65%', top: '5%' }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* Gradients for edges */}
                  <linearGradient id="eg1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c3c0ff" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#4edea3" stopOpacity="0.6"/>
                  </linearGradient>
                  <linearGradient id="eg2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4edea3" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#ffb95f" stopOpacity="0.6"/>
                  </linearGradient>
                  <linearGradient id="eg3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffb95f" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#c3c0ff" stopOpacity="0.5"/>
                  </linearGradient>
                  <linearGradient id="eg4" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c3c0ff" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#4edea3" stopOpacity="0.4"/>
                  </linearGradient>
                  {/* Glow filters */}
                  <filter id="glow1" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow2" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="8" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="softblur"><feGaussianBlur stdDeviation="3"/></filter>
                  {/* Animations */}
                  <style>{`
                    @keyframes gEdge{to{stroke-dashoffset:-32}}
                    @keyframes gPulse{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
                    @keyframes gCenter{0%,100%{opacity:.6;r:22}50%{opacity:1;r:24}}
                    @keyframes gFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
                    @keyframes gFade{0%{opacity:0}100%{opacity:1}}
                    .ge{stroke-dasharray:8 6;animation:gEdge 1.6s linear infinite}
                    .ges{stroke-dasharray:8 6;animation:gEdge 2.4s linear infinite}
                    .gp{animation:gPulse 2.2s ease-in-out infinite}
                    .gp2{animation:gPulse 2.8s ease-in-out infinite}
                    .gp3{animation:gPulse 3.2s ease-in-out infinite}
                    .gc{animation:gCenter 2s ease-in-out infinite}
                    .gfl{animation:gFloat 3s ease-in-out infinite}
                  `}</style>
                </defs>

                {/* ── Tier 1: Center — User node (x=100) ── */}
                {/* Outer glow ring */}
                <circle cx="100" cy="140" r="32" fill="none" stroke="#c3c0ff" strokeWidth="1" opacity="0.15" className="gc"/>
                <circle cx="100" cy="140" r="26" fill="rgba(195,192,255,0.06)" stroke="#c3c0ff" strokeWidth="1.5" opacity="0.4" filter="url(#softblur)"/>
                {/* Main node */}
                <circle cx="100" cy="140" r="22" fill="url(#eg1)" fillOpacity="0.12" stroke="#c3c0ff" strokeWidth="2" filter="url(#glow1)"/>
                {/* Person icon */}
                <circle cx="100" cy="133" r="6" fill="#c3c0ff" opacity="0.95"/>
                <path d="M88 150 Q100 142 112 150" stroke="#c3c0ff" strokeWidth="2" fill="none" opacity="0.9" strokeLinecap="round"/>
                {/* Label */}
                <text x="100" y="172" textAnchor="middle" fill="#c3c0ff" fontSize="8.5" fontWeight="700" letterSpacing="0.5" opacity="0.9">YOU</text>

                {/* ── Tier 2: SDE + Intern (x=210) ── */}
                {/* Edge: center → SDE */}
                <path d="M122 130 C160 110 175 100 188 100" stroke="url(#eg1)" strokeWidth="1.5" fill="none" className="ge" opacity="0.7"/>
                {/* Edge: center → Intern */}
                <path d="M122 150 C160 160 175 175 188 178" stroke="url(#eg1)" strokeWidth="1.2" fill="none" className="ges" opacity="0.5"/>

                {/* SDE node */}
                <circle cx="100" cy="100" r="14" fill="rgba(78,222,163,0.06)" stroke="#4edea3" strokeWidth="1.5" filter="url(#softblur)" opacity="0.4"/>
                <circle cx="210" cy="100" r="18" fill="rgba(78,222,163,0.1)" stroke="#4edea3" strokeWidth="1.8" filter="url(#glow1)" className="gp"/>
                <text x="210" y="96"  textAnchor="middle" fill="#4edea3" fontSize="7.5" fontWeight="800" letterSpacing="0.3">SDE</text>
                <text x="210" y="106" textAnchor="middle" fill="#4edea3" fontSize="6"   fontWeight="600" opacity="0.7">Eng I</text>

                {/* Intern node */}
                <circle cx="210" cy="178" r="15" fill="rgba(195,192,255,0.08)" stroke="#c3c0ff" strokeWidth="1.5" filter="url(#glow1)" className="gp2"/>
                <text x="210" y="174" textAnchor="middle" fill="#c3c0ff" fontSize="7"   fontWeight="800" letterSpacing="0.3">INTERN</text>
                <text x="210" y="184" textAnchor="middle" fill="#c3c0ff" fontSize="5.5" fontWeight="600" opacity="0.7">Entry</text>

                {/* ── Tier 3: Tech Lead (x=310) ── */}
                {/* Edge: SDE → Tech Lead */}
                <path d="M228 100 C258 100 278 110 292 118" stroke="url(#eg2)" strokeWidth="1.5" fill="none" className="ge" opacity="0.7"/>
                {/* Edge: Intern → Tech Lead */}
                <path d="M225 172 C258 165 278 148 292 138" stroke="url(#eg2)" strokeWidth="1.2" fill="none" className="ges" opacity="0.45"/>

                {/* Tech Lead node */}
                <circle cx="310" cy="128" r="20" fill="rgba(255,185,95,0.1)" stroke="#ffb95f" strokeWidth="2" filter="url(#glow1)" className="gp3"/>
                <text x="310" y="124" textAnchor="middle" fill="#ffb95f" fontSize="7"   fontWeight="800" letterSpacing="0.3">TECH</text>
                <text x="310" y="134" textAnchor="middle" fill="#ffb95f" fontSize="7"   fontWeight="800" letterSpacing="0.3">LEAD</text>

                {/* ── Tier 4: CTO (x=400) ── */}
                {/* Edge: Tech Lead → CTO */}
                <path d="M330 128 C355 128 370 128 382 128" stroke="url(#eg3)" strokeWidth="1.8" fill="none" className="ge" opacity="0.8"/>

                {/* CTO node — crown */}
                <circle cx="400" cy="128" r="24" fill="rgba(195,192,255,0.04)" stroke="#c3c0ff" strokeWidth="1" opacity="0.2" filter="url(#softblur)"/>
                <circle cx="400" cy="128" r="20" fill="rgba(195,192,255,0.12)" stroke="#c3c0ff" strokeWidth="2.5" filter="url(#glow2)" className="gp"/>
                <text x="400" y="124" textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="900" letterSpacing="0.5">CTO</text>
                <text x="400" y="135" textAnchor="middle" fill="#c3c0ff" fontSize="5.5" fontWeight="600" opacity="0.8">C-Suite</text>

                {/* ── Company badges floating above nodes ── */}
                {/* Google badge near SDE */}
                <rect x="188" y="68" width="44" height="16" rx="8" fill="rgba(78,222,163,0.12)" stroke="#4edea3" strokeWidth="0.8" opacity="0.8"/>
                <text x="210" y="79" textAnchor="middle" fill="#4edea3" fontSize="6" fontWeight="700" letterSpacing="0.5">GOOGLE</text>

                {/* Microsoft badge near Tech Lead */}
                <rect x="288" y="96" width="44" height="16" rx="8" fill="rgba(255,185,95,0.12)" stroke="#ffb95f" strokeWidth="0.8" opacity="0.8"/>
                <text x="310" y="107" textAnchor="middle" fill="#ffb95f" fontSize="6" fontWeight="700" letterSpacing="0.5">MICROSOFT</text>

                {/* Meta badge near Intern */}
                <rect x="188" y="198" width="44" height="16" rx="8" fill="rgba(195,192,255,0.1)" stroke="#c3c0ff" strokeWidth="0.8" opacity="0.7"/>
                <text x="210" y="209" textAnchor="middle" fill="#c3c0ff" fontSize="6" fontWeight="700" letterSpacing="0.5">META</text>

                {/* ── Subtle ambient particles ── */}
                <circle cx="155" cy="80"  r="1.5" fill="#c3c0ff" opacity="0.3" className="gp2"/>
                <circle cx="260" cy="60"  r="1.5" fill="#4edea3" opacity="0.3" className="gp3"/>
                <circle cx="355" cy="90"  r="1.5" fill="#ffb95f" opacity="0.3" className="gp"/>
                <circle cx="155" cy="200" r="1.5" fill="#4edea3" opacity="0.25" className="gp3"/>
                <circle cx="260" cy="210" r="1.5" fill="#c3c0ff" opacity="0.25" className="gp2"/>
              </svg>

              {/* Bottom gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a1020 0%, rgba(10,16,32,0.7) 35%, rgba(10,16,32,0.1) 65%, transparent 100%)', zIndex: 1 }}/>

              {/* Text content */}
              <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(1.5rem, 4vw, 2rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c3c0ff', boxShadow: '0 0 8px #c3c0ff' }}/>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#c3c0ff', opacity: 0.8 }}>Career Intelligence</span>
                </div>
                <h4 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>Predictive Pathways</h4>
                <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.82rem)', color: 'rgba(199,196,216,0.75)', maxWidth: 400, lineHeight: 1.65, margin: '0.5rem 0 0 0' }}>
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

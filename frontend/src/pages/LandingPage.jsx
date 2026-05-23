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

              {/* RIGHT BOTTOM: World map with glowing mentor dots */}
              <div style={{ flex: 1, background: '#0d1526', borderRadius: 14, border: '1px solid rgba(70,69,85,0.15)', minHeight: '140px', overflow: 'hidden', position: 'relative' }}>

                {/* World map SVG — abstract continent outlines + mentor dots */}
                <svg viewBox="0 0 320 140" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="wglow" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="2.5" result="b"/>
                      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="wglow2" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="4" result="b"/>
                      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <radialGradient id="wbg" cx="50%" cy="50%" r="70%">
                      <stop offset="0%" stopColor="#1a2a4a" stopOpacity="0.6"/>
                      <stop offset="100%" stopColor="#0d1526" stopOpacity="0"/>
                    </radialGradient>
                    <style>{`
                      @keyframes wPulse{0%,100%{opacity:.3;r:2}50%{opacity:1;r:3.2}}
                      @keyframes wPulse2{0%,100%{opacity:.2;r:1.5}50%{opacity:.85;r:2.5}}
                      @keyframes wRing{0%,100%{opacity:0;r:4}50%{opacity:.4;r:7}}
                      .wp{animation:wPulse var(--d,2.2s) ease-in-out infinite;animation-delay:var(--dl,0s)}
                      .wp2{animation:wPulse2 var(--d,2.8s) ease-in-out infinite;animation-delay:var(--dl,0s)}
                      .wr{animation:wRing var(--d,2.2s) ease-in-out infinite;animation-delay:var(--dl,0s)}
                    `}</style>
                  </defs>

                  {/* Ambient background glow */}
                  <ellipse cx="160" cy="70" rx="140" ry="60" fill="url(#wbg)"/>

                  {/* ── Abstract continent outlines ── */}
                  {/* North America */}
                  <path d="M28 28 C32 22 44 20 52 24 C58 26 62 30 64 36 C66 42 62 50 58 54 C54 58 48 60 44 58 C36 56 28 50 26 44 C24 38 24 34 28 28Z" fill="none" stroke="rgba(195,192,255,0.12)" strokeWidth="0.8"/>
                  {/* South America */}
                  <path d="M52 68 C56 64 62 64 66 68 C70 72 70 80 68 86 C66 92 60 96 56 94 C50 92 46 86 46 80 C46 74 48 72 52 68Z" fill="none" stroke="rgba(195,192,255,0.1)" strokeWidth="0.8"/>
                  {/* Europe */}
                  <path d="M118 22 C122 18 130 18 136 22 C140 26 140 32 136 36 C132 40 124 40 120 36 C116 32 114 26 118 22Z" fill="none" stroke="rgba(195,192,255,0.12)" strokeWidth="0.8"/>
                  {/* Africa */}
                  <path d="M122 46 C128 42 136 42 140 48 C144 54 144 66 140 74 C136 80 128 82 122 78 C116 74 114 64 114 56 C114 50 118 50 122 46Z" fill="none" stroke="rgba(195,192,255,0.1)" strokeWidth="0.8"/>
                  {/* Asia */}
                  <path d="M148 18 C158 14 178 14 192 20 C202 24 208 32 206 40 C204 48 194 52 182 52 C168 52 154 48 148 40 C142 34 140 22 148 18Z" fill="none" stroke="rgba(195,192,255,0.12)" strokeWidth="0.8"/>
                  {/* India peninsula */}
                  <path d="M182 52 C186 52 190 56 190 62 C190 68 186 74 182 74 C178 74 174 68 174 62 C174 56 178 52 182 52Z" fill="none" stroke="rgba(195,192,255,0.1)" strokeWidth="0.7"/>
                  {/* SE Asia / Indonesia */}
                  <path d="M218 54 C224 50 232 52 236 58 C238 62 234 68 228 68 C222 68 216 64 216 58 C216 56 216 56 218 54Z" fill="none" stroke="rgba(195,192,255,0.09)" strokeWidth="0.7"/>
                  {/* Australia */}
                  <path d="M234 76 C240 72 250 72 256 78 C260 82 260 90 256 94 C250 98 240 98 234 94 C228 90 228 82 234 76Z" fill="none" stroke="rgba(195,192,255,0.1)" strokeWidth="0.8"/>

                  {/* ── Subtle grid lines (latitude/longitude feel) ── */}
                  <line x1="0" y1="70" x2="320" y2="70" stroke="rgba(195,192,255,0.04)" strokeWidth="0.5"/>
                  <line x1="160" y1="0" x2="160" y2="140" stroke="rgba(195,192,255,0.04)" strokeWidth="0.5"/>
                  <ellipse cx="160" cy="70" rx="130" ry="55" fill="none" stroke="rgba(195,192,255,0.03)" strokeWidth="0.5"/>
                  <ellipse cx="160" cy="70" rx="80"  ry="35" fill="none" stroke="rgba(195,192,255,0.03)" strokeWidth="0.5"/>

                  {/* ── Mentor dots — placed at real geographic hotspots ── */}
                  {/* [cx, cy, color, duration, delay, big] */}
                  {[
                    // North America
                    [42, 32, '#4edea3', 2.1, 0,    true ],  // San Francisco
                    [52, 30, '#c3c0ff', 2.4, 0.3,  false],  // Seattle
                    [58, 36, '#4edea3', 1.9, 0.6,  true ],  // New York
                    [46, 38, '#ffb95f', 2.6, 0.2,  false],  // Chicago
                    [36, 42, '#c3c0ff', 2.2, 0.8,  false],  // LA
                    [62, 40, '#4edea3', 2.8, 0.4,  false],  // Boston
                    // South America
                    [56, 74, '#c3c0ff', 2.3, 0.5,  false],  // São Paulo
                    [50, 78, '#4edea3', 2.7, 0.1,  false],  // Buenos Aires
                    // Europe
                    [122, 26, '#c3c0ff', 2.0, 0.2, true ],  // London
                    [128, 24, '#4edea3', 2.5, 0.5, false],  // Paris
                    [134, 26, '#ffb95f', 2.2, 0.7, false],  // Berlin
                    [136, 30, '#c3c0ff', 2.8, 0.3, false],  // Amsterdam
                    [130, 32, '#4edea3', 2.1, 0.9, false],  // Zurich
                    // Africa
                    [126, 56, '#ffb95f', 2.4, 0.4, false],  // Lagos
                    [132, 72, '#c3c0ff', 2.6, 0.6, false],  // Johannesburg
                    [130, 48, '#4edea3', 2.3, 0.2, false],  // Cairo
                    // Asia — India (dense)
                    [180, 50, '#4edea3', 1.8, 0,   true ],  // Delhi
                    [184, 56, '#c3c0ff', 2.1, 0.3, true ],  // Mumbai
                    [186, 60, '#ffb95f', 2.4, 0.6, false],  // Bangalore
                    [188, 54, '#4edea3', 2.0, 0.2, false],  // Hyderabad
                    [182, 62, '#c3c0ff', 2.6, 0.5, false],  // Chennai
                    [176, 52, '#4edea3', 2.2, 0.8, false],  // Pune
                    // Asia — East
                    [218, 30, '#c3c0ff', 2.0, 0.1, true ],  // Beijing
                    [222, 36, '#4edea3', 2.3, 0.4, true ],  // Shanghai
                    [228, 38, '#ffb95f', 2.5, 0.7, false],  // Tokyo
                    [224, 42, '#c3c0ff', 2.1, 0.3, false],  // Seoul
                    [214, 44, '#4edea3', 2.7, 0.6, false],  // Chengdu
                    // SE Asia
                    [224, 58, '#c3c0ff', 2.2, 0.2, false],  // Singapore
                    [220, 54, '#4edea3', 2.4, 0.5, false],  // Bangkok
                    [228, 56, '#ffb95f', 2.6, 0.8, false],  // Jakarta
                    // Middle East
                    [158, 44, '#ffb95f', 2.3, 0.3, false],  // Dubai
                    [154, 40, '#c3c0ff', 2.5, 0.6, false],  // Riyadh
                    // Australia
                    [244, 84, '#4edea3', 2.1, 0.4, true ],  // Sydney
                    [238, 82, '#c3c0ff', 2.4, 0.7, false],  // Melbourne
                    [248, 80, '#ffb95f', 2.7, 0.2, false],  // Brisbane
                  ].map(([cx, cy, color, d, dl, big], i) => (
                    <g key={i}>
                      {/* Ripple ring */}
                      <circle cx={cx} cy={cy} r={big ? 4 : 3} fill="none" stroke={color} strokeWidth="0.6"
                        className="wr" style={{'--d':`${d}s`,'--dl':`${dl}s`}} opacity="0.5"/>
                      {/* Core dot */}
                      <circle cx={cx} cy={cy} r={big ? 2 : 1.5} fill={color}
                        className={big ? 'wp' : 'wp2'}
                        style={{'--d':`${d}s`,'--dl':`${dl}s`}}
                        filter="url(#wglow)"/>
                    </g>
                  ))}

                  {/* ── Connection arcs between major hubs ── */}
                  <path d="M58 36 Q90 10 122 26"  fill="none" stroke="rgba(195,192,255,0.12)" strokeWidth="0.7" strokeDasharray="3 4"/>
                  <path d="M122 26 Q152 18 180 50" fill="none" stroke="rgba(78,222,163,0.1)"  strokeWidth="0.7" strokeDasharray="3 4"/>
                  <path d="M184 56 Q204 40 222 36" fill="none" stroke="rgba(195,192,255,0.1)"  strokeWidth="0.7" strokeDasharray="3 4"/>
                  <path d="M42 32 Q50 60 56 74"    fill="none" stroke="rgba(255,185,95,0.08)"  strokeWidth="0.6" strokeDasharray="3 4"/>
                </svg>

                {/* Gradient overlay — bottom fade for text readability */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d1526 0%, rgba(13,21,38,0.75) 30%, rgba(13,21,38,0.1) 70%, transparent 100%)', borderRadius: 14 }}/>

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(1.25rem, 3vw, 1.75rem)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4edea3', boxShadow: '0 0 6px #4edea3', animation: 'wPulse 2s ease-in-out infinite' }}/>
                    <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#4edea3', opacity: 0.85 }}>Live Network</span>
                  </div>
                  <div style={{ fontSize: 'clamp(1.75rem,4vw,2rem)', fontWeight: 900, lineHeight: 1, color: '#fff' }}>12k+</div>
                  <div style={{ fontSize: 'clamp(0.55rem,1.5vw,0.6rem)', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c7c4d8', fontWeight: 700, marginTop: '0.35rem' }}>Active Mentors Globally</div>
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

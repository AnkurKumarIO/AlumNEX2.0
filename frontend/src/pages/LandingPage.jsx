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
              <div style={{ flex: 1, background: '#0a1020', borderRadius: 14, border: '1px solid rgba(195,192,255,0.08)', minHeight: '160px', overflow: 'hidden', position: 'relative' }}>

                <svg viewBox="0 0 1000 500" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="mdot"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <style>{`@keyframes mp{0%,100%{opacity:.25}50%{opacity:.95}}@keyframes mr{0%{opacity:0;r:5}60%{opacity:.35}100%{opacity:0;r:14}}.md{animation:mp var(--d,2.2s) ease-in-out infinite;animation-delay:var(--dl,0s)}.mr{animation:mr var(--d,2.2s) ease-in-out infinite;animation-delay:var(--dl,0s)}`}</style>
                  </defs>
                  {/* North America */}
                  <path d="M120,80 L155,70 L185,75 L210,85 L225,100 L230,120 L220,145 L205,160 L195,175 L185,195 L175,210 L165,225 L155,235 L145,230 L140,215 L148,200 L155,185 L158,170 L150,155 L140,145 L130,140 L120,130 L110,115 L105,100Z" fill="rgba(195,192,255,0.1)" stroke="rgba(195,192,255,0.22)" strokeWidth="0.8"/>
                  <path d="M195,45 L215,40 L230,48 L225,62 L210,68 L195,62Z" fill="rgba(195,192,255,0.07)" stroke="rgba(195,192,255,0.16)" strokeWidth="0.6"/>
                  {/* South America */}
                  <path d="M178,248 L200,245 L220,255 L235,275 L240,300 L238,330 L230,355 L218,375 L205,385 L192,380 L180,365 L172,345 L168,320 L165,295 L162,270 L165,255Z" fill="rgba(195,192,255,0.1)" stroke="rgba(195,192,255,0.2)" strokeWidth="0.8"/>
                  {/* Europe */}
                  <path d="M430,80 L445,72 L462,70 L478,75 L490,85 L495,98 L488,110 L475,118 L460,122 L445,118 L432,108 L425,95Z" fill="rgba(195,192,255,0.11)" stroke="rgba(195,192,255,0.24)" strokeWidth="0.8"/>
                  <path d="M455,55 L468,48 L478,52 L480,65 L470,72 L458,68Z" fill="rgba(195,192,255,0.08)" stroke="rgba(195,192,255,0.18)" strokeWidth="0.6"/>
                  <path d="M422,82 L430,78 L432,88 L425,92Z" fill="rgba(195,192,255,0.09)" stroke="rgba(195,192,255,0.18)" strokeWidth="0.6"/>
                  {/* Africa */}
                  <path d="M448,130 L468,122 L490,125 L505,138 L512,158 L515,182 L512,210 L505,238 L495,262 L480,280 L465,288 L450,282 L438,265 L430,242 L428,215 L430,188 L435,162 L440,145Z" fill="rgba(195,192,255,0.1)" stroke="rgba(195,192,255,0.2)" strokeWidth="0.8"/>
                  {/* Middle East */}
                  <path d="M510,118 L535,112 L555,118 L562,132 L555,145 L538,150 L520,145 L510,132Z" fill="rgba(195,192,255,0.09)" stroke="rgba(195,192,255,0.18)" strokeWidth="0.7"/>
                  {/* Asia main */}
                  <path d="M510,65 L545,55 L590,52 L635,55 L675,62 L710,72 L738,85 L755,100 L758,118 L748,132 L730,140 L710,145 L688,148 L665,145 L642,140 L618,138 L595,140 L572,145 L552,148 L535,145 L518,138 L508,125 L505,108Z" fill="rgba(195,192,255,0.11)" stroke="rgba(195,192,255,0.24)" strokeWidth="0.8"/>
                  {/* India */}
                  <path d="M598,148 L615,145 L628,152 L632,168 L628,185 L618,198 L608,202 L598,195 L592,178 L590,162 L592,150Z" fill="rgba(195,192,255,0.13)" stroke="rgba(195,192,255,0.28)" strokeWidth="0.8"/>
                  {/* SE Asia */}
                  <path d="M688,148 L710,148 L725,158 L728,172 L718,180 L705,178 L692,168 L685,158Z" fill="rgba(195,192,255,0.09)" stroke="rgba(195,192,255,0.2)" strokeWidth="0.7"/>
                  {/* East Asia */}
                  <path d="M710,72 L748,68 L778,75 L798,88 L800,105 L790,118 L770,125 L748,128 L728,122 L710,112 L705,95Z" fill="rgba(195,192,255,0.11)" stroke="rgba(195,192,255,0.24)" strokeWidth="0.8"/>
                  <path d="M800,88 L812,82 L820,90 L815,102 L805,105 L798,98Z" fill="rgba(195,192,255,0.08)" stroke="rgba(195,192,255,0.18)" strokeWidth="0.6"/>
                  {/* Australia */}
                  <path d="M738,295 L768,285 L800,288 L825,300 L838,318 L838,340 L828,358 L810,368 L788,370 L765,362 L748,348 L738,328 L732,308Z" fill="rgba(195,192,255,0.1)" stroke="rgba(195,192,255,0.2)" strokeWidth="0.8"/>
                  {/* Grid lines */}
                  <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(195,192,255,0.04)" strokeWidth="0.5"/>
                  <line x1="500" y1="0" x2="500" y2="500" stroke="rgba(195,192,255,0.04)" strokeWidth="0.5"/>
                  <line x1="0" y1="125" x2="1000" y2="125" stroke="rgba(195,192,255,0.025)" strokeWidth="0.4"/>
                  <line x1="0" y1="375" x2="1000" y2="375" stroke="rgba(195,192,255,0.025)" strokeWidth="0.4"/>
                  <line x1="250" y1="0" x2="250" y2="500" stroke="rgba(195,192,255,0.025)" strokeWidth="0.4"/>
                  <line x1="750" y1="0" x2="750" y2="500" stroke="rgba(195,192,255,0.025)" strokeWidth="0.4"/>
                  {/* Mentor dots */}
                  {[[148,112,'#4edea3',2.1,0,true],[162,105,'#c3c0ff',2.4,.3,false],[195,108,'#4edea3',1.9,.6,true],[175,115,'#ffb95f',2.6,.2,false],[140,120,'#c3c0ff',2.2,.8,false],[200,105,'#4edea3',2.8,.4,false],[200,310,'#c3c0ff',2.3,.5,false],[188,345,'#4edea3',2.7,.1,false],[432,88,'#c3c0ff',2.0,.2,true],[448,90,'#4edea3',2.5,.5,false],[462,82,'#ffb95f',2.2,.7,false],[455,85,'#c3c0ff',2.8,.3,false],[468,175,'#ffb95f',2.4,.4,false],[478,255,'#c3c0ff',2.6,.6,false],[472,148,'#4edea3',2.3,.2,false],[545,128,'#ffb95f',2.3,.3,false],[600,155,'#4edea3',1.8,0,true],[605,168,'#c3c0ff',2.1,.3,true],[612,178,'#ffb95f',2.4,.6,false],[615,162,'#4edea3',2.0,.2,false],[608,182,'#c3c0ff',2.6,.5,false],[598,160,'#4edea3',2.2,.8,false],[762,95,'#c3c0ff',2.0,.1,true],[772,108,'#4edea3',2.3,.4,true],[808,95,'#ffb95f',2.5,.7,false],[778,100,'#c3c0ff',2.1,.3,false],[712,165,'#c3c0ff',2.2,.2,false],[700,158,'#4edea3',2.4,.5,false],[800,328,'#4edea3',2.1,.4,true],[785,335,'#c3c0ff',2.4,.7,false]].map(([cx,cy,color,d,dl,big],i)=>(
                    <g key={i}>
                      <circle cx={cx} cy={cy} r={big?10:7} fill="none" stroke={color} strokeWidth="0.8" className="mr" style={{'--d':`${d}s`,'--dl':`${dl}s`}} opacity="0.55"/>
                      <circle cx={cx} cy={cy} r={big?3:2} fill={color} className="md" style={{'--d':`${d}s`,'--dl':`${dl}s`}} filter="url(#mdot)"/>
                    </g>
                  ))}
                  {/* Connection arcs */}
                  <path d="M195,108 Q312,60 432,88" fill="none" stroke="rgba(195,192,255,0.1)" strokeWidth="0.8" strokeDasharray="4 5"/>
                  <path d="M432,88 Q516,72 600,155" fill="none" stroke="rgba(78,222,163,0.08)" strokeWidth="0.8" strokeDasharray="4 5"/>
                  <path d="M605,168 Q688,130 762,95" fill="none" stroke="rgba(195,192,255,0.08)" strokeWidth="0.8" strokeDasharray="4 5"/>
                </svg>

                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a1020 0%, rgba(10,16,32,0.8) 25%, rgba(10,16,32,0.1) 55%, transparent 100%)', borderRadius: 14 }}/>
                <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(1.25rem,3vw,1.75rem)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4edea3', boxShadow: '0 0 6px #4edea3' }}/>
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

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
      <style>{`
        .glass-card {
          background: linear-gradient(135deg, rgba(16, 22, 42, 0.75) 0%, rgba(10, 16, 32, 0.85) 100%);
          border: 1px solid rgba(195, 192, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
        }
        .glass-card:hover {
          transform: translateY(-4px);
          border-color: rgba(195, 192, 255, 0.2);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        @keyframes loadBar {
          from { width: 0%; }
        }
        .bar-tech {
          animation: loadBar 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .bar-finance {
          animation: loadBar 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.15s;
        }
        .bar-product {
          animation: loadBar 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.3s;
        }
        @keyframes flowArc {
          to { stroke-dashoffset: -20; }
        }
        .flow-arc {
          stroke-dasharray: 6 6;
          animation: flowArc 3s linear infinite;
        }
      `}</style>
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
            AlumNEX connects students, alumni, and administrators through career pathways, mock interviews, and mentorship.
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
            <div className="glass-card" style={{ overflow: 'hidden', minHeight: '360px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>

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
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10, 16, 32, 0.95) 0%, rgba(10, 16, 32, 0.6) 35%, transparent 100%)', zIndex: 1 }}/>

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

              {/* RIGHT TOP: Compatibility Breakdown */}
              <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '160px', padding: 'clamp(1.25rem, 3vw, 1.75rem)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4edea3', boxShadow: '0 0 6px #4edea3' }}/>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#4edea3', opacity: 0.85 }}>Compatibility Breakdown</span>
                </div>
                <div style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: 800, color: '#fff', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
                  Top Matching Industries
                </div>
                
                {/* Miniature Bar Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {/* Row 1: Tech */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c7c4d8', width: '50px' }}>Tech</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(195, 192, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <div className="bar-tech" style={{ height: '100%', width: '94%', borderRadius: 3, background: 'linear-gradient(90deg, #3b82f6, #4edea3)', boxShadow: '0 0 8px rgba(78, 222, 163, 0.3)' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4edea3', width: '30px', textAlign: 'right' }}>94%</span>
                  </div>
                  
                  {/* Row 2: Finance */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c7c4d8', width: '50px' }}>Finance</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(195, 192, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <div className="bar-finance" style={{ height: '100%', width: '82%', borderRadius: 3, background: 'linear-gradient(90deg, #6366f1, #c3c0ff)', boxShadow: '0 0 8px rgba(195, 192, 255, 0.3)' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c3c0ff', width: '30px', textAlign: 'right' }}>82%</span>
                  </div>
                  
                  {/* Row 3: Product */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c7c4d8', width: '50px' }}>Product</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(195, 192, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <div className="bar-product" style={{ height: '100%', width: '75%', borderRadius: 3, background: 'linear-gradient(90deg, #f97316, #ffb95f)', boxShadow: '0 0 8px rgba(255, 185, 95, 0.3)' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffb95f', width: '30px', textAlign: 'right' }}>75%</span>
                  </div>
                </div>
              </div>

              {/* RIGHT BOTTOM: World map with glowing mentor dots */}
              <div className="glass-card" style={{ flex: 1, minHeight: '160px', overflow: 'hidden', position: 'relative', background: '#060e1e' }}>

                <svg viewBox="0 0 2000 1001" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <filter id="cglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <filter id="mdot2"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <style>{`@keyframes mp2{0%,100%{opacity:.2}50%{opacity:1}}@keyframes mr2{0%{opacity:0}50%{opacity:.4}100%{opacity:0}}.md2{animation:mp2 var(--d,2.2s) ease-in-out infinite;animation-delay:var(--dl,0s)}.mr2{animation:mr2 var(--d,2.2s) ease-in-out infinite;animation-delay:var(--dl,0s)}`}</style>
                  </defs>
                  {/* North America */}
                  <path d="M270,140 L295,125 L320,118 L355,115 L385,120 L410,130 L430,145 L445,162 L450,180 L445,200 L435,218 L420,232 L405,245 L390,255 L375,262 L360,268 L345,272 L330,270 L318,262 L308,250 L300,238 L295,225 L292,210 L295,195 L300,182 L305,170 L300,158 L288,150Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1.2" filter="url(#cglow)"/>
                  <path d="M180,120 L200,110 L225,108 L248,115 L260,128 L255,142 L238,148 L215,145 L195,138Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1" filter="url(#cglow)"/>
                  <path d="M270,80 L310,70 L355,68 L390,75 L415,88 L420,105 L410,118 L385,120 L355,115 L320,118 L295,125 L270,118Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1" filter="url(#cglow)"/>
                  <path d="M390,55 L420,45 L455,48 L470,62 L465,80 L448,90 L425,92 L405,85 L392,72Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1" filter="url(#cglow)"/>
                  <path d="M345,272 L360,268 L368,278 L365,292 L355,298 L342,292 L338,280Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1" filter="url(#cglow)"/>
                  {/* South America */}
                  <path d="M355,298 L380,292 L408,298 L428,315 L440,338 L445,365 L442,395 L432,425 L418,455 L400,478 L382,492 L365,495 L348,485 L335,465 L325,440 L320,412 L318,382 L320,352 L325,325 L335,308Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1.2" filter="url(#cglow)"/>
                  {/* Europe */}
                  <path d="M862,118 L885,108 L912,105 L938,110 L958,122 L968,138 L962,155 L945,165 L925,170 L905,168 L885,160 L870,148 L860,135Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1.2" filter="url(#cglow)"/>
                  <path d="M905,75 L925,65 L948,68 L960,82 L955,98 L938,105 L918,102 L905,90Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1" filter="url(#cglow)"/>
                  <path d="M848,118 L860,112 L865,125 L858,135 L848,132Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1" filter="url(#cglow)"/>
                  <path d="M855,155 L875,148 L892,152 L898,168 L890,182 L872,185 L855,178 L848,165Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1" filter="url(#cglow)"/>
                  {/* Africa */}
                  <path d="M895,195 L925,185 L958,188 L985,200 L1005,220 L1015,248 L1018,278 L1015,312 L1005,345 L990,375 L970,400 L948,418 L925,425 L902,418 L882,400 L868,375 L858,345 L852,312 L850,278 L852,248 L858,222 L870,205Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1.2" filter="url(#cglow)"/>
                  <path d="M1025,335 L1035,325 L1042,338 L1040,355 L1030,362 L1020,352Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="0.8" filter="url(#cglow)"/>
                  {/* Middle East */}
                  <path d="M1018,188 L1048,178 L1078,182 L1098,198 L1102,218 L1092,235 L1068,242 L1042,238 L1022,222Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1" filter="url(#cglow)"/>
                  {/* Asia */}
                  <path d="M1005,65 L1080,52 L1165,48 L1255,52 L1335,62 L1398,78 L1438,98 L1448,118 L1435,138 L1408,152 L1375,158 L1338,155 L1298,148 L1258,142 L1218,138 L1178,138 L1138,142 L1098,148 L1062,152 L1032,148 L1010,135 L998,118 L998,98Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1.2" filter="url(#cglow)"/>
                  {/* India */}
                  <path d="M1178,195 L1205,188 L1228,195 L1238,215 L1235,238 L1222,258 L1205,268 L1188,262 L1175,242 L1170,218Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1.2" filter="url(#cglow)"/>
                  {/* SE Asia */}
                  <path d="M1338,195 L1368,188 L1392,195 L1402,215 L1395,232 L1372,238 L1348,232 L1335,215Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1" filter="url(#cglow)"/>
                  <path d="M1368,268 L1395,262 L1415,268 L1418,282 L1405,290 L1382,288 L1365,280Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="0.8" filter="url(#cglow)"/>
                  {/* East Asia */}
                  <path d="M1398,98 L1448,88 L1498,88 L1538,98 L1558,118 L1552,142 L1528,158 L1498,162 L1465,158 L1435,148 L1415,132 L1405,115Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1.2" filter="url(#cglow)"/>
                  <path d="M1558,108 L1578,98 L1592,108 L1588,125 L1572,132 L1558,125Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1" filter="url(#cglow)"/>
                  {/* Australia */}
                  <path d="M1468,548 L1512,528 L1562,525 L1608,535 L1642,558 L1658,588 L1655,622 L1638,652 L1612,672 L1578,682 L1542,678 L1508,658 L1482,632 L1465,602 L1458,572Z" fill="rgba(10,30,70,0.9)" stroke="#1e6fff" strokeWidth="1.2" filter="url(#cglow)"/>
                  {/* Grid */}
                  <line x1="0" y1="500" x2="2000" y2="500" stroke="rgba(30,111,255,0.05)" strokeWidth="0.8"/>
                  <line x1="1000" y1="0" x2="1000" y2="1001" stroke="rgba(30,111,255,0.05)" strokeWidth="0.8"/>
                  <line x1="0" y1="250" x2="2000" y2="250" stroke="rgba(30,111,255,0.03)" strokeWidth="0.5"/>
                  <line x1="0" y1="750" x2="2000" y2="750" stroke="rgba(30,111,255,0.03)" strokeWidth="0.5"/>
                  {/* Mentor dots */}
                  {[[340,185,'#4edea3',2.1,0,true],[380,175,'#c3c0ff',2.4,.3,false],[420,178,'#4edea3',1.9,.6,true],[360,195,'#ffb95f',2.6,.2,false],[380,380,'#c3c0ff',2.3,.5,false],[360,420,'#4edea3',2.7,.1,false],[875,138,'#c3c0ff',2.0,.2,true],[900,132,'#4edea3',2.5,.5,false],[928,128,'#ffb95f',2.2,.7,false],[935,285,'#ffb95f',2.4,.4,false],[945,355,'#c3c0ff',2.6,.6,false],[918,218,'#4edea3',2.3,.2,false],[1055,208,'#ffb95f',2.3,.3,false],[1195,218,'#4edea3',1.8,0,true],[1205,232,'#c3c0ff',2.1,.3,true],[1215,245,'#ffb95f',2.4,.6,false],[1208,225,'#4edea3',2.0,.2,false],[1448,118,'#c3c0ff',2.0,.1,true],[1468,132,'#4edea3',2.3,.4,true],[1572,118,'#ffb95f',2.5,.7,false],[1498,125,'#c3c0ff',2.1,.3,false],[1362,215,'#c3c0ff',2.2,.2,false],[1548,598,'#4edea3',2.1,.4,true],[1528,618,'#c3c0ff',2.4,.7,false]].map(([cx,cy,color,d,dl,big],i)=>(
                    <g key={i}>
                      <circle cx={cx} cy={cy} r={big?18:12} fill="none" stroke={color} strokeWidth="1" className="mr2" style={{'--d':`${d}s`,'--dl':`${dl}s`}} opacity="0.5"/>
                      <circle cx={cx} cy={cy} r={big?5:3.5} fill={color} className="md2" style={{'--d':`${d}s`,'--dl':`${dl}s`}} filter="url(#mdot2)"/>
                    </g>
                  ))}
                  <path d="M420,178 Q648,80 875,138" fill="none" stroke="rgba(30,111,255,0.15)" strokeWidth="1.2" strokeDasharray="6 7"/>
                  <path d="M875,138 Q1035,105 1195,218" fill="none" stroke="rgba(78,222,163,0.12)" strokeWidth="1.2" strokeDasharray="6 7"/>
                  <path d="M1205,232 Q1325,175 1448,118" fill="none" stroke="rgba(30,111,255,0.12)" strokeWidth="1.2" strokeDasharray="6 7"/>
                </svg>

                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,14,30,0.98) 0%, rgba(6,14,30,0.7) 30%, rgba(6,14,30,0.05) 60%, transparent 100%)', zIndex: 1 }}/>
                <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(1.25rem,3vw,1.75rem)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
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

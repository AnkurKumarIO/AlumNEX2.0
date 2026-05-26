import React, { useEffect } from 'react';
import { Mail } from 'lucide-react';
import Footer from '../components/Footer';

const Linkedin = ({ size = 24, color = "currentColor" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function MeetDevelopers() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const team = [
    {
      name: "Garv Khatri",
      initials: "GK",
      accentColor: "rgba(56, 189, 248, 0.4)",
      avatarGradient: "linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)",
      bio: "I'm Garv, a Computer Science Undergraduate at VNIT Nagpur (Batch of 2029). I had the incredible opportunity to build this platform with an amazing team. We designed AlumNEX to simplify alumni-student connections and bring our campus network closer together. Loved using the site or want to talk tech? I’d love to connect on LinkedIn!",
      email: "mailto:krishnakhatri1126@gmail.com",
      linkedin: "https://www.linkedin.com/in/garv-khatri-89b780380/"
    },
    {
      name: "Ankur Kumar",
      initials: "AK",
      accentColor: "rgba(167, 139, 250, 0.4)",
      avatarGradient: "linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)",
      bio: "I'm Ankur, a Computer Science Undergraduate at VNIT Nagpur (Batch of 2029). Building AlumNEX with the Tesseract team was an incredible experience. I enjoyed crafting the platform’s architecture to bridge the gap between students and alumni through intelligent systems. Looking for collaborators on AI projects or have questions about the platform? Let's connect on LinkedIn!",
      email: "mailto:quantum.ankurkr@gmail.com",
      linkedin: "https://www.linkedin.com/in/honestly-ankur/"
    },
    {
      name: "Chetana Gattani",
      initials: "CG",
      accentColor: "rgba(244, 114, 182, 0.4)",
      avatarGradient: "linear-gradient(135deg, #f472b6 0%, #be185d 100%)",
      bio: "UI/UX enthusiast with a keen eye for detail. Focuses on creating responsive, accessible, and stunning digital experiences.",
      email: "mailto:chetana@example.com",
      linkedin: "#"
    },
    {
      name: "Pranjal Chaudhari",
      initials: "PC",
      accentColor: "rgba(52, 211, 153, 0.4)",
      avatarGradient: "linear-gradient(135deg, #34d399 0%, #047857 100%)",
      bio: "I’m Pranjal, a Computer Science undergraduate at VNIT Nagpur (Batch 2029) passionate about building impactful and user-focused tech. Through AlumNEX, I worked on creating a platform that makes alumni-student connections more meaningful and accessible. I enjoy full-stack development, exploring new technologies, and turning ideas into real-world products that people genuinely use and enjoy.",
      email: "mailto:pc125830@gmail.com",
      linkedin: "https://www.linkedin.com/in/pranjal-chaudhari-5576993a5"
    }
  ];

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
        .dev-card {
          background: linear-gradient(135deg, rgba(16, 22, 42, 0.75) 0%, rgba(10, 16, 32, 0.85) 100%);
          border: 1px solid rgba(195, 192, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .dev-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-glow);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5), 0 0 25px var(--accent-glow), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .dev-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          font-size: 1.25rem;
          font-weight: 900;
          color: #fff;
          margin-bottom: 1.25rem;
          border: 2px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          letter-spacing: -0.03em;
        }
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(195, 192, 255, 0.1);
          color: #c7c4d8;
          transition: all 0.2s ease;
        }
        .social-btn:hover {
          background: rgba(195, 192, 255, 0.2);
          color: #fff;
          transform: scale(1.1);
        }
        .team-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-top: 2rem;
          width: 100%;
        }
        @media (min-width: 768px) {
          .team-grid {
            grid-template-columns: repeat(2, 1fr);
            max-width: 960px;
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>

      <main style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 'clamp(4rem, 10vh, 6rem) 2rem',
        flex: 1,
        width: '100%'
      }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            background: 'rgba(108, 92, 231, 0.1)',
            border: '1px solid rgba(108, 92, 231, 0.2)',
            borderRadius: '999px',
            marginBottom: '1.5rem'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#a29bfe', textTransform: 'uppercase' }}>
              The Team Behind The Vision
            </span>
          </div>
          
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            margin: '0 0 1rem 0',
            background: 'linear-gradient(135deg, #fff 0%, #c3c0ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(195,192,255,0.2)'
          }}>
            The Tesseract
          </h1>
          
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: '#c7c4d8',
            lineHeight: 1.7,
            maxWidth: 750,
            margin: '0 auto',
            opacity: 0.9
          }}>
            We are a team of four dedicated developers who conceptualized and built AlumNEX entirely during our first year of college. Driven by a passion for scalable engineering and solving real-world problems early in our academic journey, we created this platform to bridge the gap between students, alumni, and administrators. Our goal remains to provide a seamless, intelligent ecosystem that fosters meaningful career connections.
          </p>
        </div>

        {/* Team Grid */}
        <div className="team-grid">
          {team.map((member, index) => (
            <div key={index} className="dev-card" style={{ '--accent-glow': member.accentColor }}>
              {/* Badge */}
              <div className="dev-avatar" style={{ background: member.avatarGradient }}>
                {member.initials}
              </div>
              
              {/* Info */}
              <h3 style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#fff',
                margin: '0 0 1rem 0',
                letterSpacing: '-0.01em',
                width: '100%',
                borderBottom: '1px solid rgba(195, 192, 255, 0.1)',
                paddingBottom: '1rem'
              }}>
                {member.name}
              </h3>
              
              <p style={{
                fontSize: '0.95rem',
                color: '#a0a0b8',
                lineHeight: 1.6,
                margin: '0 0 1.5rem 0',
                flex: 1
              }}>
                {member.bio}
              </p>

              {/* Socials */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                <a href={member.email} className="social-btn" aria-label={`Email ${member.name}`}>
                  <Mail size={18} />
                </a>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="social-btn" aria-label={`${member.name}'s LinkedIn`}>
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

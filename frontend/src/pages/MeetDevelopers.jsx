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
      bio: "Passionate about building scalable web applications and intuitive user interfaces. Specializes in React and Node.js.",
      email: "mailto:garv@example.com",
      linkedin: "#"
    },
    {
      name: "Ankur Kumar",
      bio: "Database architect and API specialist. Loves optimizing queries and building robust server-side architectures.",
      email: "mailto:ankur@example.com",
      linkedin: "#"
    },
    {
      name: "Chetana Gattani",
      bio: "UI/UX enthusiast with a keen eye for detail. Focuses on creating responsive, accessible, and stunning digital experiences.",
      email: "mailto:chetana@example.com",
      linkedin: "#"
    },
    {
      name: "Pranjal Chaudhari",
      bio: "Cloud computing and deployment expert. Ensures high availability and seamless integration of various platform services.",
      email: "mailto:pranjal@example.com",
      linkedin: "#"
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
          border-color: rgba(195, 192, 255, 0.2);
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginTop: '2rem'
        }}>
          {team.map((member, index) => (
            <div key={index} className="dev-card">
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

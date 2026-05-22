import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AlumNexLogo from '../AlumNexLogo';
import Footer from '../components/Footer';

const ContactCard = ({ icon, title, value, href, color = '#c3c0ff' }) => (
  <div style={{
    background: '#131b2e',
    border: '1px solid rgba(70,69,85,0.2)',
    borderRadius: 14,
    padding: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    transition: 'all 0.3s',
  }}
    onMouseOver={e => {
      e.currentTarget.style.borderColor = `${color}40`;
      e.currentTarget.style.background = '#171f33';
    }}
    onMouseOut={e => {
      e.currentTarget.style.borderColor = 'rgba(70,69,85,0.2)';
      e.currentTarget.style.background = '#131b2e';
    }}
  >
    <div style={{
      width: 48,
      height: 48,
      borderRadius: 12,
      background: `${color}15`,
      border: `1px solid ${color}30`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span className="material-symbols-outlined" style={{ color, fontSize: 24 }}>{icon}</span>
    </div>
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 6 }}>
        {title}
      </div>
      <a href={href} style={{ fontSize: '0.95rem', fontWeight: 600, color: '#dae2fd', textDecoration: 'none', wordBreak: 'break-word' }}>
        {value}
      </a>
    </div>
  </div>
);

const DepartmentCard = ({ icon, title, email, phone, color }) => (
  <div style={{
    background: '#131b2e',
    border: '1px solid rgba(70,69,85,0.2)',
    borderRadius: 14,
    padding: '1.75rem',
    transition: 'all 0.3s',
  }}
    onMouseOver={e => {
      e.currentTarget.style.borderColor = `${color}40`;
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseOut={e => {
      e.currentTarget.style.borderColor = 'rgba(70,69,85,0.2)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ color, fontSize: 20 }}>{icon}</span>
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#dae2fd', margin: 0 }}>{title}</h3>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c7c4d8' }}>mail</span>
        <a href={`mailto:${email}`} style={{ fontSize: '0.85rem', color: '#c7c4d8', textDecoration: 'none' }}>
          {email}
        </a>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c7c4d8' }}>call</span>
        <a href={`tel:${phone}`} style={{ fontSize: '0.85rem', color: '#c7c4d8', textDecoration: 'none' }}>
          {phone}
        </a>
      </div>
    </div>
  </div>
);

export default function ContactUs() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState(null); // 'sending' | 'success' | 'error'

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formStatus) setFormStatus(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setFormStatus('error');
      return;
    }

    // Simulate sending
    setFormStatus('sending');
    setTimeout(() => {
      setFormStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormStatus(null), 5000);
    }, 1500);
  };

  const inp = {
    width: '100%',
    background: '#222a3d',
    border: '1px solid rgba(70,69,85,0.4)',
    borderRadius: 10,
    padding: '0.75rem 1rem',
    color: '#dae2fd',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s',
  };

  const lbl = {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#c7c4d8',
    display: 'block',
    marginBottom: 8,
  };

  return (
    <div style={{ background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <nav style={{
        background: 'rgba(11,19,38,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(70,69,85,0.2)',
        padding: '0 2rem',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <AlumNexLogo size={28} />
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
            Alum<span style={{ color: '#a855f7' }}>NEX</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/privacy" style={{ fontSize: '0.8rem', color: '#c7c4d8', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/terms" style={{ fontSize: '0.8rem', color: '#c7c4d8', textDecoration: 'none' }}>Terms</Link>
          <Link to="/login" style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#c3c0ff',
            padding: '0.4rem 1rem',
            border: '1px solid rgba(195,192,255,0.25)',
            borderRadius: 8,
            textDecoration: 'none',
          }}>Sign In</Link>
        </div>
      </nav>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,70,229,0.12) 0%, rgba(78,222,163,0.08) 50%, rgba(11,19,38,0) 100%)',
        borderBottom: '1px solid rgba(70,69,85,0.2)',
        padding: '4rem 2rem 3rem',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '0.35rem 1rem',
          background: 'rgba(195,192,255,0.08)',
          border: '1px solid rgba(195,192,255,0.2)',
          borderRadius: 999,
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#c3c0ff',
          marginBottom: '1.25rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>support_agent</span>
          Get In Touch
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '1rem' }}>
          Contact Us
        </h1>
        <p style={{ fontSize: '1rem', color: '#c7c4d8', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
          Have questions about AlumNEX? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
        </p>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem', width: '100%' }}>

        {/* Quick Contact Cards */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>Get In Touch</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <ContactCard
              icon="mail"
              title="Email Us"
              value="support@alumnex.com"
              href="mailto:support@alumnex.com"
              color="#c3c0ff"
            />
            <ContactCard
              icon="call"
              title="Call Us"
              value="+1 (555) 019-2834"
              href="tel:+15550192834"
              color="#4edea3"
            />
            <ContactCard
              icon="location_on"
              title="Visit Us"
              value="123 Innovation Drive, Tech Park, Silicon Valley, CA 94025, USA"
              href="https://maps.google.com"
              color="#a855f7"
            />
          </div>
        </div>

        {/* Department Contacts */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Department Contacts</h2>
          <p style={{ fontSize: '0.9rem', color: '#c7c4d8', textAlign: 'center', marginBottom: '2rem' }}>
            Reach out to the right team for faster assistance
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <DepartmentCard
              icon="support"
              title="Technical Support"
              email="tech@alumnex.com"
              phone="+1 (555) 019-2835"
              color="#c3c0ff"
            />
            <DepartmentCard
              icon="groups"
              title="Alumni Relations"
              email="alumni@alumnex.com"
              phone="+1 (555) 019-2836"
              color="#4edea3"
            />
            <DepartmentCard
              icon="school"
              title="Training & Placement Cell"
              email="tnp@alumnex.com"
              phone="+1 (555) 019-2837"
              color="#a855f7"
            />
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            background: '#131b2e',
            border: '1px solid rgba(70,69,85,0.2)',
            borderRadius: 16,
            padding: '2.5rem',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Send Us a Message</h2>
              <p style={{ fontSize: '0.85rem', color: '#c7c4d8' }}>
                Fill out the form below and we'll respond within 24 hours
              </p>
            </div>

            {/* Status Messages */}
            {formStatus === 'success' && (
              <div style={{
                padding: '1rem 1.25rem',
                background: 'rgba(78,222,163,0.1)',
                border: '1px solid rgba(78,222,163,0.3)',
                borderRadius: 10,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 20 }}>check_circle</span>
                <span style={{ fontSize: '0.9rem', color: '#4edea3', fontWeight: 600 }}>
                  Message sent successfully! We'll get back to you soon.
                </span>
              </div>
            )}

            {formStatus === 'error' && (
              <div style={{
                padding: '1rem 1.25rem',
                background: 'rgba(255,180,171,0.1)',
                border: '1px solid rgba(255,180,171,0.3)',
                borderRadius: 10,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: 20 }}>error</span>
                <span style={{ fontSize: '0.9rem', color: '#ffb4ab', fontWeight: 600 }}>
                  Please fill in all fields before submitting.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={lbl}>Your Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="John Doe"
                    style={inp}
                    onFocus={e => e.target.style.borderColor = 'rgba(195,192,255,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(70,69,85,0.4)'}
                  />
                </div>
                <div>
                  <label style={lbl}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="john@example.com"
                    style={inp}
                    onFocus={e => e.target.style.borderColor = 'rgba(195,192,255,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(70,69,85,0.4)'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={lbl}>Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => handleChange('subject', e.target.value)}
                  placeholder="How can we help you?"
                  style={inp}
                  onFocus={e => e.target.style.borderColor = 'rgba(195,192,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(70,69,85,0.4)'}
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={lbl}>Message</label>
                <textarea
                  value={formData.message}
                  onChange={e => handleChange('message', e.target.value)}
                  placeholder="Tell us more about your inquiry..."
                  rows={6}
                  style={{ ...inp, resize: 'vertical', minHeight: 140 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(195,192,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(70,69,85,0.4)'}
                />
              </div>

              <button
                type="submit"
                disabled={formStatus === 'sending'}
                style={{
                  width: '100%',
                  padding: '0.875rem 2rem',
                  background: formStatus === 'sending' ? 'rgba(79,70,229,0.5)' : 'linear-gradient(135deg, #4f46e5, #c3c0ff)',
                  color: '#1d00a5',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: formStatus === 'sending' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onMouseOver={e => {
                  if (formStatus !== 'sending') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,70,229,0.4)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {formStatus === 'sending' ? (
                  <>
                    <div style={{
                      width: 16,
                      height: 16,
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Additional Info */}
          <div style={{
            marginTop: '2rem',
            padding: '1.25rem',
            background: 'rgba(195,192,255,0.05)',
            border: '1px solid rgba(195,192,255,0.15)',
            borderRadius: 12,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.85rem', color: '#c7c4d8', margin: 0, lineHeight: 1.7 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>schedule</span>
              Our support team typically responds within <span style={{ color: '#c3c0ff', fontWeight: 600 }}>24 hours</span> during business days (Mon-Fri, 9 AM - 6 PM PST)
            </p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <Footer />

      {/* Keyframes for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

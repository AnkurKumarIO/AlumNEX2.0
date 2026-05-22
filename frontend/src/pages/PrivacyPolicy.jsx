import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AlumNexLogo from '../AlumNexLogo';
import Footer from '../components/Footer';

const LAST_UPDATED = 'May 22, 2026';

const Section = ({ id, icon, title, children }) => (
  <section id={id} style={{ marginBottom: '3rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 20 }}>{icon}</span>
      </div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#dae2fd', letterSpacing: '-0.02em' }}>{title}</h2>
    </div>
    <div style={{ paddingLeft: 52 }}>{children}</div>
  </section>
);

const P = ({ children, style }) => (
  <p style={{ fontSize: '0.9rem', color: '#c7c4d8', lineHeight: 1.8, marginBottom: '0.9rem', ...style }}>{children}</p>
);

const Ul = ({ items }) => (
  <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.9rem' }}>
    {items.map((item, i) => (
      <li key={i} style={{ fontSize: '0.9rem', color: '#c7c4d8', lineHeight: 1.8, marginBottom: '0.35rem' }}>{item}</li>
    ))}
  </ul>
);

const SubHeading = ({ children }) => (
  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dae2fd', marginBottom: '0.6rem', marginTop: '1.25rem' }}>{children}</h3>
);

const Highlight = ({ children }) => (
  <span style={{ color: '#c3c0ff', fontWeight: 600 }}>{children}</span>
);

const tocItems = [
  { id: 'overview',       label: 'Overview' },
  { id: 'data-collected', label: 'Data We Collect' },
  { id: 'how-we-use',     label: 'How We Use Your Data' },
  { id: 'data-sharing',   label: 'Data Sharing' },
  { id: 'no-sale',        label: 'We Never Sell Your Data' },
  { id: 'security',       label: 'Data Security' },
  { id: 'cookies',        label: 'Cookies & Analytics' },
  { id: 'your-rights',    label: 'Your Rights' },
  { id: 'retention',      label: 'Data Retention' },
  { id: 'children',       label: 'Children\'s Privacy' },
  { id: 'changes',        label: 'Policy Changes' },
  { id: 'contact',        label: 'Contact Us' },
];

export default function PrivacyPolicy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(168,85,247,0.1) 50%, rgba(11,19,38,0) 100%)',
        borderBottom: '1px solid rgba(70,69,85,0.2)', padding: '4rem 2rem 3rem',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0.35rem 1rem', background: 'rgba(195,192,255,0.08)',
          border: '1px solid rgba(195,192,255,0.2)', borderRadius: 999,
          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.12em', color: '#c3c0ff', marginBottom: '1.25rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>shield</span>
          Legal Document
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '1rem' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '1rem', color: '#c7c4d8', maxWidth: 560, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
          We believe privacy is a right, not a feature. This policy explains exactly what data AlumNEX collects, how it is used, and how we protect it.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: 'event', text: `Last updated: ${LAST_UPDATED}` },
            { icon: 'language', text: 'Applies to: alumNEX.com' },
            { icon: 'block', text: 'We never sell your data' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#c7c4d8' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4edea3' }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '3rem', alignItems: 'start' }}>

        {/* Sticky TOC */}
        <aside style={{ position: 'sticky', top: 84 }}>
          <div style={{ background: '#131b2e', borderRadius: 14, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.2)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c7c4d8', marginBottom: '1rem' }}>Contents</p>
            <nav>
              {tocItems.map(({ id, label }) => (
                <a key={id} href={`#${id}`} style={{
                  display: 'block', padding: '0.4rem 0.6rem', borderRadius: 6,
                  fontSize: '0.8rem', color: '#c7c4d8', textDecoration: 'none',
                  marginBottom: 2, transition: 'all 0.15s',
                }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(195,192,255,0.08)'; e.currentTarget.style.color = '#c3c0ff'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c7c4d8'; }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main>

          {/* Overview */}
          <Section id="overview" icon="info" title="Overview">
            <P>
              AlumNEX ("we", "us", or "our") is an intelligence platform that connects students, alumni, and Training & Placement (TNP) coordinators. This Privacy Policy applies to all users of the AlumNEX website and platform, including general visitors, registered students, alumni members, and TNP administrators.
            </P>
            <P>
              By accessing or using AlumNEX, you agree to the collection and use of information as described in this policy. If you do not agree, please discontinue use of the platform.
            </P>
            <div style={{
              padding: '1rem 1.25rem', background: 'rgba(78,222,163,0.06)',
              border: '1px solid rgba(78,222,163,0.2)', borderRadius: 10, marginTop: '0.5rem',
            }}>
              <p style={{ fontSize: '0.85rem', color: '#4edea3', fontWeight: 600, margin: 0 }}>
                🔒 Core Commitment: AlumNEX does not sell, rent, or trade your personal data to any third party, ever.
              </p>
            </div>
          </Section>

          {/* Data We Collect */}
          <Section id="data-collected" icon="database" title="Data We Collect">
            <SubHeading>1.1 General Website Visitors</SubHeading>
            <P>When you browse AlumNEX without registering, we may automatically collect:</P>
            <Ul items={[
              'IP address and approximate geographic location (country/city level)',
              'Browser type, version, and operating system',
              'Pages visited, time spent, and navigation patterns',
              'Referring URLs (how you arrived at our site)',
              'Device type (desktop, mobile, tablet)',
              'Session duration and interaction events via analytics cookies',
            ]} />

            <SubHeading>1.2 Registered Students</SubHeading>
            <P>When you create a student account, we collect:</P>
            <Ul items={[
              'Full name and email address',
              'Username and hashed password',
              'College/university name, department, and year of study',
              'CGPA or academic performance indicators (optional)',
              'Skills, career goals, and professional links (LinkedIn, GitHub, Portfolio)',
              'Resume files uploaded to the platform (stored securely)',
              'Interview session transcripts and automated feedback',
              'Profile photo (if provided)',
              'Activity logs: sessions attended, requests made, progress analytics',
            ]} />

            <SubHeading>1.3 Registered Alumni</SubHeading>
            <P>When you register as an alumni member, we collect:</P>
            <Ul items={[
              'Full name, email address, and username',
              'Graduation year (batch/pass-out year) and department',
              'Current employer, job title, and domain of expertise',
              'Years of professional experience',
              'LinkedIn profile URL and professional bio',
              'Google Calendar OAuth tokens (only if you connect Google Meet integration)',
              'Availability schedule and interview session history',
              'Ratings and feedback received from students',
              'Verification status and account creation metadata',
            ]} />

            <SubHeading>1.4 TNP Coordinators</SubHeading>
            <P>TNP administrator accounts collect:</P>
            <Ul items={[
              'Administrator username and securely stored credentials',
              'Platform configuration preferences',
              'Activity logs for audit and compliance purposes',
            ]} />

            <SubHeading>1.5 Contact Forms & Support</SubHeading>
            <P>If you contact us via a form or email, we collect your name, email address, and the content of your message to respond to your inquiry.</P>
          </Section>

          {/* How We Use Data */}
          <Section id="how-we-use" icon="settings" title="How We Use Your Data">
            <P>We use the information we collect for the following purposes:</P>
            <Ul items={[
              'Providing and operating the AlumNEX platform and its features',
              'Authenticating your identity and maintaining account security',
              'Matching students with relevant alumni mentors using smart algorithms',
              'Generating interview feedback, resume analysis, and career insights',
              'Scheduling and managing mock interview sessions',
              'Sending transactional emails (session confirmations, password resets, notifications)',
              'Improving platform performance, fixing bugs, and developing new features',
              'Generating anonymised, aggregated analytics to understand platform usage',
              'Complying with legal obligations and enforcing our Terms and Conditions',
              'Preventing fraud, abuse, and unauthorised access',
            ]} />
            <P>
              We do <Highlight>not</Highlight> use your data for unsolicited marketing, behavioural advertising, or profiling for commercial purposes unrelated to the AlumNEX platform.
            </P>
          </Section>

          {/* Data Sharing */}
          <Section id="data-sharing" icon="share" title="Data Sharing & Disclosure">
            <P>AlumNEX does not share your personal data with third parties except in the following limited circumstances:</P>

            <SubHeading>Service Providers</SubHeading>
            <P>We use trusted third-party services to operate the platform. These providers process data only on our behalf and under strict data processing agreements:</P>
            <Ul items={[
              'Supabase — database hosting and authentication infrastructure',
              'Google (OAuth) — calendar integration for alumni who opt in to Google Meet',
              'LLM providers (Gemini, Groq) — processing interview transcripts and generating feedback. Data is not retained by these providers for training purposes.',
              'Hosting and CDN providers — for serving the platform reliably',
            ]} />

            <SubHeading>Legal Requirements</SubHeading>
            <P>We may disclose your information if required to do so by law, court order, or governmental authority, or if we believe in good faith that such disclosure is necessary to protect the rights, property, or safety of AlumNEX, our users, or the public.</P>

            <SubHeading>Business Transfers</SubHeading>
            <P>In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of that transaction. We will notify affected users via email or a prominent notice on the platform before any such transfer occurs.</P>

            <SubHeading>With Your Consent</SubHeading>
            <P>We may share your data with third parties when you have given us explicit consent to do so.</P>
          </Section>

          {/* No Sale */}
          <Section id="no-sale" icon="block" title="We Never Sell Your Data">
            <div style={{
              padding: '1.5rem', background: 'rgba(195,192,255,0.05)',
              border: '2px solid rgba(195,192,255,0.2)', borderRadius: 12,
            }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#c3c0ff', marginBottom: '0.75rem' }}>
                AlumNEX does not sell, rent, lease, or trade your personal information to any third party — ever.
              </p>
              <P style={{ marginBottom: 0 }}>
                Your data is used exclusively to operate and improve the AlumNEX platform. We are not in the business of data brokerage. We do not monetise your personal information through advertising networks, data marketplaces, or any other commercial arrangement that involves transferring your data to external parties for their own use.
              </P>
            </div>
          </Section>

          {/* Security */}
          <Section id="security" icon="lock" title="Data Security">
            <P>We take the security of your personal data seriously and implement industry-standard technical and organisational measures to protect it:</P>

            <SubHeading>Technical Safeguards</SubHeading>
            <Ul items={[
              'All data is transmitted over HTTPS/TLS encrypted connections',
              'Passwords are never stored in plain text — they are hashed using secure algorithms',
              'Database access is restricted to authorised services only, with no public exposure',
              'Authentication tokens (JWT) are short-lived and cryptographically signed',
              'Google OAuth tokens are stored encrypted and scoped to minimum required permissions',
              'File uploads (resumes) are stored in isolated, access-controlled storage',
            ]} />

            <SubHeading>Organisational Safeguards</SubHeading>
            <Ul items={[
              'Access to production systems is limited to authorised personnel only',
              'Regular security reviews and dependency audits are conducted',
              'Third-party service providers are vetted for security compliance',
            ]} />

            <SubHeading>Breach Notification</SubHeading>
            <P>
              In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify affected users without undue delay and, where required, notify the relevant supervisory authority within 72 hours of becoming aware of the breach.
            </P>
            <P>
              While we strive to protect your data, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security, but we commit to responding promptly to any security incidents.
            </P>
          </Section>

          {/* Cookies */}
          <Section id="cookies" icon="cookie" title="Cookies & Analytics">
            <P>AlumNEX uses cookies and similar tracking technologies to operate the platform and understand how it is used.</P>

            <SubHeading>Essential Cookies</SubHeading>
            <P>These cookies are necessary for the platform to function and cannot be disabled:</P>
            <Ul items={[
              'Authentication session cookies — keep you logged in securely',
              'Security tokens — protect against CSRF attacks',
              'User preference cookies — remember your settings (e.g., notification preferences)',
            ]} />

            <SubHeading>Analytics Cookies</SubHeading>
            <P>We use analytics tools to understand how users interact with the platform. This data is aggregated and anonymised:</P>
            <Ul items={[
              'Page views and navigation flows',
              'Feature usage patterns (which tools are used most)',
              'Performance metrics (load times, error rates)',
              'Session duration and engagement metrics',
            ]} />

            <SubHeading>Managing Cookies</SubHeading>
            <P>
              You can control cookies through your browser settings. Note that disabling essential cookies may prevent you from using core platform features such as logging in. Analytics cookies can be disabled without affecting platform functionality.
            </P>
          </Section>

          {/* Your Rights */}
          <Section id="your-rights" icon="person" title="Your Rights">
            <P>Depending on your location, you may have the following rights regarding your personal data:</P>
            <Ul items={[
              'Right of Access — request a copy of the personal data we hold about you',
              'Right to Rectification — request correction of inaccurate or incomplete data',
              'Right to Erasure ("Right to be Forgotten") — request deletion of your account and associated data',
              'Right to Data Portability — receive your data in a structured, machine-readable format',
              'Right to Restrict Processing — request that we limit how we use your data',
              'Right to Object — object to processing based on legitimate interests',
              'Right to Withdraw Consent — withdraw consent at any time where processing is based on consent',
            ]} />
            <P>
              To exercise any of these rights, please contact us at <Highlight>privacy@alumnex.com</Highlight>. We will respond to all requests within 30 days. We may need to verify your identity before processing your request.
            </P>
          </Section>

          {/* Retention */}
          <Section id="retention" icon="schedule" title="Data Retention">
            <P>We retain your personal data only for as long as necessary to fulfil the purposes described in this policy:</P>
            <Ul items={[
              'Active accounts: data is retained for the duration of your account',
              'Deleted accounts: personal data is purged within 30 days of account deletion',
              'Interview transcripts and session records: retained for 12 months, then anonymised',
              'Analytics data: retained in aggregated, anonymised form indefinitely',
              'Legal and compliance records: retained as required by applicable law',
              'Backup copies: may persist for up to 90 days in encrypted backups after deletion',
            ]} />
          </Section>

          {/* Children */}
          <Section id="children" icon="child_care" title="Children's Privacy">
            <P>
              AlumNEX is intended for use by college students, alumni, and educational professionals. The platform is <Highlight>not directed at children under the age of 13</Highlight>. We do not knowingly collect personal information from children under 13.
            </P>
            <P>
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at <Highlight>privacy@alumnex.com</Highlight> and we will take steps to delete such information.
            </P>
          </Section>

          {/* Changes */}
          <Section id="changes" icon="update" title="Changes to This Policy">
            <P>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:
            </P>
            <Ul items={[
              'Update the "Last Updated" date at the top of this page',
              'Display a prominent notice on the platform for at least 14 days',
              'Send an email notification to registered users for significant changes',
            ]} />
            <P>
              Your continued use of AlumNEX after the effective date of any changes constitutes your acceptance of the updated policy. We encourage you to review this page periodically.
            </P>
          </Section>

          {/* Contact */}
          <Section id="contact" icon="mail" title="Contact Us">
            <P>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</P>
            <div style={{
              background: '#131b2e', border: '1px solid rgba(70,69,85,0.2)',
              borderRadius: 12, padding: '1.5rem', marginTop: '0.5rem',
            }}>
              {[
                { icon: 'mail', label: 'Email', value: 'privacy@alumnex.com' },
                { icon: 'language', label: 'Website', value: 'www.alumnex.com' },
                { icon: 'business', label: 'Platform', value: 'AlumNEX — The Intelligence Platform' },
                { icon: 'group', label: 'Developed by', value: 'The Tesseract' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 18, width: 20 }}>{icon}</span>
                  <span style={{ fontSize: '0.85rem', color: '#c7c4d8' }}>
                    <span style={{ fontWeight: 600, color: '#dae2fd' }}>{label}:</span> {value}
                  </span>
                </div>
              ))}
            </div>
            <P style={{ marginTop: '1rem' }}>
              We are committed to resolving any privacy concerns promptly and transparently. You also have the right to lodge a complaint with your local data protection authority if you believe your rights have been violated.
            </P>
          </Section>

        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

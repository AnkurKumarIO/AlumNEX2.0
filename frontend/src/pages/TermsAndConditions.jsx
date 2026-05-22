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
        background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 20 }}>{icon}</span>
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
  <span style={{ color: '#4edea3', fontWeight: 600 }}>{children}</span>
);

const WarningBox = ({ children }) => (
  <div style={{
    padding: '1rem 1.25rem', background: 'rgba(255,180,171,0.06)',
    border: '1px solid rgba(255,180,171,0.25)', borderRadius: 10, marginBottom: '1rem',
  }}>
    <p style={{ fontSize: '0.85rem', color: '#ffb4ab', margin: 0, lineHeight: 1.7 }}>{children}</p>
  </div>
);

const tocItems = [
  { id: 'agreement',        label: 'Agreement to Terms' },
  { id: 'platform-desc',    label: 'Platform Description' },
  { id: 'eligibility',      label: 'Eligibility & Accounts' },
  { id: 'ip',               label: 'Intellectual Property' },
  { id: 'acceptable-use',   label: 'Acceptable Use' },
  { id: 'restricted',       label: 'Restricted Access' },
  { id: 'user-content',     label: 'User-Generated Content' },
  { id: 'ai-disclaimer',    label: 'AI Features Disclaimer' },
  { id: 'third-party',      label: 'Third-Party Services' },
  { id: 'liability',        label: 'Limitation of Liability' },
  { id: 'indemnification',  label: 'Indemnification' },
  { id: 'termination',      label: 'Termination' },
  { id: 'governing-law',    label: 'Governing Law' },
  { id: 'changes',          label: 'Changes to Terms' },
  { id: 'contact',          label: 'Contact Us' },
];

export default function TermsAndConditions() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <nav style={{
        background: 'rgba(11,19,38,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(70,69,85,0.2)', padding: '0 2rem',
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <AlumNexLogo size={28} />
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
            Alum<span style={{ color: '#a855f7' }}>NEX</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/privacy" style={{ fontSize: '0.8rem', color: '#c7c4d8', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/login" style={{
            fontSize: '0.8rem', fontWeight: 600, color: '#4edea3',
            padding: '0.4rem 1rem', border: '1px solid rgba(78,222,163,0.25)',
            borderRadius: 8, textDecoration: 'none',
          }}>Sign In</Link>
        </div>
      </nav>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(78,222,163,0.1) 0%, rgba(79,70,229,0.08) 50%, rgba(11,19,38,0) 100%)',
        borderBottom: '1px solid rgba(70,69,85,0.2)', padding: '4rem 2rem 3rem',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0.35rem 1rem', background: 'rgba(78,222,163,0.08)',
          border: '1px solid rgba(78,222,163,0.2)', borderRadius: 999,
          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.12em', color: '#4edea3', marginBottom: '1.25rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>gavel</span>
          Legal Document
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '1rem' }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ fontSize: '1rem', color: '#c7c4d8', maxWidth: 580, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
          These terms govern your use of the AlumNEX platform. Please read them carefully before accessing or using any part of our service.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: 'event',    text: `Last updated: ${LAST_UPDATED}` },
            { icon: 'language', text: 'Applies to: alumNEX.com' },
            { icon: 'verified', text: 'Alumni section: verified members only' },
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
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(78,222,163,0.08)'; e.currentTarget.style.color = '#4edea3'; }}
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

          {/* Agreement */}
          <Section id="agreement" icon="handshake" title="Agreement to Terms">
            <P>
              By accessing or using the AlumNEX platform — including its website, web application, APIs, and any associated services — you confirm that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms") and our <Link to="/privacy" style={{ color: '#4edea3' }}>Privacy Policy</Link>.
            </P>
            <P>
              If you are accessing AlumNEX on behalf of an institution or organisation, you represent that you have the authority to bind that entity to these Terms.
            </P>
            <WarningBox>
              If you do not agree to these Terms, you must immediately discontinue use of the AlumNEX platform. Continued use constitutes acceptance.
            </WarningBox>
          </Section>

          {/* Platform Description */}
          <Section id="platform-desc" icon="hub" title="Platform Description">
            <P>
              AlumNEX is an AI-powered intelligence platform designed to bridge the gap between campus and career. The platform provides the following core services:
            </P>
            <Ul items={[
              'AI-powered mock interview sessions with real-time feedback',
              'Alumni mentorship matching and booking system',
              'Resume analysis and career pathway recommendations',
              'Student progress analytics and performance tracking',
              'TNP coordinator tools for managing student-alumni interactions',
              'Google Meet integration for conducting live interview sessions',
              'Notification and scheduling infrastructure for session management',
            ]} />
            <P>
              AlumNEX is developed and operated by <Highlight>The Tesseract</Highlight>. The platform is provided as a service and may be updated, modified, or discontinued at any time.
            </P>
          </Section>

          {/* Eligibility */}
          <Section id="eligibility" icon="badge" title="Eligibility & Account Registration">
            <SubHeading>Eligibility</SubHeading>
            <P>To use AlumNEX, you must:</P>
            <Ul items={[
              'Be at least 13 years of age (18 for alumni accounts)',
              'Be a currently enrolled student, verified alumni, or authorised TNP coordinator',
              'Provide accurate, complete, and current information during registration',
              'Not have been previously suspended or banned from the platform',
            ]} />

            <SubHeading>Account Responsibility</SubHeading>
            <P>
              You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately at <Highlight>support@alumnex.com</Highlight> if you suspect any unauthorised access to your account. AlumNEX is not liable for any loss or damage arising from your failure to protect your credentials.
            </P>

            <SubHeading>Account Accuracy</SubHeading>
            <P>
              You agree to keep your profile information accurate and up to date. Providing false information — including misrepresenting your alumni status, employment, or academic credentials — is a violation of these Terms and may result in immediate account termination.
            </P>
          </Section>

          {/* Intellectual Property */}
          <Section id="ip" icon="copyright" title="Intellectual Property">
            <SubHeading>AlumNEX Ownership</SubHeading>
            <P>
              The AlumNEX name, logo, brand identity, platform design, user interface, source code, AI models, algorithms, and all original content published on the platform are the exclusive intellectual property of <Highlight>AlumNEX and The Tesseract</Highlight>. All rights are reserved.
            </P>
            <P>This includes, but is not limited to:</P>
            <Ul items={[
              'The "AlumNEX" name and wordmark',
              'The AlumNEX logo and all visual brand assets',
              'The platform\'s UI/UX design, layout, and visual elements',
              'Proprietary AI prompts, models, and interview evaluation systems',
              'All written content, documentation, and marketing materials',
              'The codebase, APIs, and technical architecture of the platform',
            ]} />

            <SubHeading>Restricted Use</SubHeading>
            <P>
              You may <Highlight>not</Highlight> copy, reproduce, distribute, modify, create derivative works from, publicly display, or commercially exploit any part of the AlumNEX platform or its content without our prior written consent.
            </P>

            <SubHeading>Your Content</SubHeading>
            <P>
              Content you upload to AlumNEX (such as your resume, profile information, or session feedback) remains your property. By uploading content, you grant AlumNEX a limited, non-exclusive, royalty-free licence to store, process, and display that content solely for the purpose of providing the platform's services to you.
            </P>
          </Section>

          {/* Acceptable Use */}
          <Section id="acceptable-use" icon="rule" title="Acceptable Use Policy">
            <P>
              You agree to use AlumNEX only for lawful purposes and in a manner consistent with these Terms. The following activities are strictly prohibited:
            </P>

            <SubHeading>Security & Technical Abuse</SubHeading>
            <Ul items={[
              'Attempting to hack, penetrate, or compromise the security of the platform or its infrastructure',
              'Introducing malware, viruses, trojans, or any malicious code',
              'Conducting denial-of-service (DoS) or distributed denial-of-service (DDoS) attacks',
              'Attempting to bypass authentication, access controls, or rate limits',
              'Exploiting vulnerabilities without responsible disclosure to our security team',
              'Using automated bots, scripts, or crawlers to access the platform without permission',
            ]} />

            <SubHeading>Data Scraping & Harvesting</SubHeading>
            <Ul items={[
              'Scraping, harvesting, or bulk-extracting user data, alumni profiles, or platform content',
              'Using the platform\'s data to build competing products or services',
              'Aggregating or republishing user profiles without explicit consent',
              'Accessing the platform\'s APIs beyond your authorised usage limits',
            ]} />

            <SubHeading>Spam & Misuse</SubHeading>
            <Ul items={[
              'Sending unsolicited messages, spam, or bulk communications to other users',
              'Impersonating another person, alumni, or AlumNEX staff member',
              'Creating multiple accounts to circumvent restrictions or bans',
              'Using the platform to conduct phishing, fraud, or social engineering attacks',
              'Posting or transmitting offensive, defamatory, or illegal content',
            ]} />

            <SubHeading>Academic & Professional Integrity</SubHeading>
            <Ul items={[
              'Misrepresenting your academic qualifications, graduation status, or employment history',
              'Using AI-generated interview responses to deceive evaluators',
              'Sharing confidential interview questions or session content without consent',
            ]} />

            <WarningBox>
              Violation of this Acceptable Use Policy may result in immediate account suspension, permanent ban, and where applicable, referral to law enforcement authorities.
            </WarningBox>
          </Section>

          {/* Restricted Access */}
          <Section id="restricted" icon="lock_person" title="Restricted Access — Alumni Section">
            <div style={{
              padding: '1.25rem 1.5rem', background: 'rgba(195,192,255,0.05)',
              border: '2px solid rgba(195,192,255,0.2)', borderRadius: 12, marginBottom: '1.25rem',
            }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#c3c0ff', marginBottom: '0.5rem' }}>
                The Alumni Portal is strictly restricted to verified alumni members only.
              </p>
              <P style={{ marginBottom: 0 }}>
                Access to the alumni section of AlumNEX is granted exclusively to individuals who have been verified as genuine alumni of their respective institutions. Verification is conducted by authorised TNP coordinators.
              </P>
            </div>

            <SubHeading>Verification Requirements</SubHeading>
            <P>To access the alumni portal, you must:</P>
            <Ul items={[
              'Be a genuine graduate of a recognised educational institution',
              'Have your alumni status verified by an authorised TNP coordinator',
              'Provide accurate graduation year, department, and institutional details',
              'Maintain a professional profile that accurately reflects your current status',
            ]} />

            <SubHeading>Prohibited Access</SubHeading>
            <P>The following are strictly prohibited and constitute a serious violation of these Terms:</P>
            <Ul items={[
              'Attempting to access the alumni portal without verified alumni status',
              'Using another person\'s alumni credentials to gain access',
              'Circumventing the verification process through any means',
              'Sharing alumni login credentials with non-alumni individuals',
              'Misrepresenting your alumni status during the verification process',
            ]} />

            <SubHeading>Consequences of Unauthorised Access</SubHeading>
            <P>
              Unauthorised access to the alumni section may constitute a criminal offence under applicable computer fraud and unauthorised access laws. AlumNEX reserves the right to pursue legal action against individuals who attempt to gain unauthorised access.
            </P>
          </Section>

          {/* User Content */}
          <Section id="user-content" icon="edit_note" title="User-Generated Content">
            <P>
              AlumNEX allows users to submit content including profile information, resumes, session feedback, and messages. By submitting content, you represent and warrant that:
            </P>
            <Ul items={[
              'You own or have the right to submit the content',
              'The content does not infringe any third-party intellectual property rights',
              'The content is accurate and not misleading',
              'The content does not violate any applicable laws or these Terms',
              'The content does not contain personal information of third parties without their consent',
            ]} />
            <P>
              AlumNEX reserves the right to remove any user-generated content that violates these Terms, without notice and at our sole discretion.
            </P>
          </Section>

          {/* AI Disclaimer */}
          <Section id="ai-disclaimer" icon="smart_toy" title="AI Features Disclaimer">
            <P>
              AlumNEX uses artificial intelligence and large language models (LLMs) to power features including mock interview feedback, resume analysis, career recommendations, and profile summaries.
            </P>
            <WarningBox>
              AI-generated content is provided for informational and educational purposes only. It does not constitute professional career advice, legal advice, or any form of guaranteed outcome.
            </WarningBox>
            <P>You acknowledge and agree that:</P>
            <Ul items={[
              'AI-generated feedback may contain errors, inaccuracies, or biases',
              'Interview scores and assessments are indicative, not definitive evaluations',
              'Career pathway recommendations are suggestions, not guarantees of employment',
              'Resume analysis results should be reviewed critically and not followed blindly',
              'AlumNEX is not responsible for decisions made based on AI-generated content',
            ]} />
          </Section>

          {/* Third Party */}
          <Section id="third-party" icon="open_in_new" title="Third-Party Services">
            <P>
              AlumNEX integrates with third-party services including Google (OAuth and Meet), Supabase, and AI providers. Your use of these integrations is subject to the respective third-party terms of service and privacy policies.
            </P>
            <P>
              AlumNEX is not responsible for the availability, accuracy, or conduct of third-party services. Links to external websites or services do not constitute endorsement by AlumNEX.
            </P>
          </Section>

          {/* Liability */}
          <Section id="liability" icon="balance" title="Limitation of Liability">
            <div style={{
              padding: '1.25rem 1.5rem', background: 'rgba(255,180,171,0.05)',
              border: '1px solid rgba(255,180,171,0.2)', borderRadius: 12, marginBottom: '1.25rem',
            }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffb4ab', marginBottom: '0.5rem' }}>
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE"
              </p>
              <P style={{ marginBottom: 0, color: '#c7c4d8' }}>
                AlumNEX makes no warranties, express or implied, regarding the platform's fitness for a particular purpose, merchantability, or uninterrupted availability.
              </P>
            </div>

            <SubHeading>No Warranty</SubHeading>
            <P>AlumNEX does not warrant that:</P>
            <Ul items={[
              'The platform will be available at all times or free from errors',
              'AI-generated content will be accurate, complete, or suitable for your needs',
              'The platform will meet your specific requirements or expectations',
              'Any defects or errors will be corrected within a specific timeframe',
              'The platform is free from viruses or other harmful components',
            ]} />

            <SubHeading>Limitation of Damages</SubHeading>
            <P>
              To the maximum extent permitted by applicable law, AlumNEX and The Tesseract shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
            </P>
            <Ul items={[
              'Loss of profits, revenue, or business opportunities',
              'Loss of data or corruption of data',
              'Damage to reputation or goodwill',
              'Cost of substitute services',
              'Any damages arising from reliance on AI-generated content',
            ]} />
            <P>
              In no event shall AlumNEX's total liability to you exceed the amount you have paid to AlumNEX in the twelve (12) months preceding the claim, or INR 1,000 (whichever is greater).
            </P>
          </Section>

          {/* Indemnification */}
          <Section id="indemnification" icon="security" title="Indemnification">
            <P>
              You agree to indemnify, defend, and hold harmless AlumNEX, The Tesseract, and their respective officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in connection with:
            </P>
            <Ul items={[
              'Your use of or access to the AlumNEX platform',
              'Your violation of these Terms and Conditions',
              'Your violation of any third-party rights, including intellectual property rights',
              'Any content you submit, post, or transmit through the platform',
              'Your violation of any applicable laws or regulations',
            ]} />
          </Section>

          {/* Termination */}
          <Section id="termination" icon="cancel" title="Termination">
            <SubHeading>Termination by AlumNEX</SubHeading>
            <P>
              AlumNEX reserves the right to suspend or permanently terminate your account, with or without notice, if you:
            </P>
            <Ul items={[
              'Violate any provision of these Terms',
              'Engage in conduct that is harmful to other users or the platform',
              'Provide false or misleading information during registration or use',
              'Fail to pay any applicable fees (if applicable)',
              'Are required to be removed by applicable law or court order',
            ]} />

            <SubHeading>Termination by You</SubHeading>
            <P>
              You may terminate your account at any time by contacting us at <Highlight>support@alumnex.com</Highlight> or using the account deletion feature in Settings. Upon termination, your personal data will be handled in accordance with our <Link to="/privacy" style={{ color: '#4edea3' }}>Privacy Policy</Link>.
            </P>

            <SubHeading>Effect of Termination</SubHeading>
            <P>
              Upon termination, your right to access the platform ceases immediately. Provisions of these Terms that by their nature should survive termination (including intellectual property, limitation of liability, and indemnification) shall continue to apply.
            </P>
          </Section>

          {/* Governing Law */}
          <Section id="governing-law" icon="gavel" title="Governing Law & Dispute Resolution">
            <P>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </P>
            <P>
              Any disputes arising out of or relating to these Terms or your use of AlumNEX shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be subject to the exclusive jurisdiction of the courts located in India.
            </P>
            <P>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall continue in full force and effect.
            </P>
          </Section>

          {/* Changes */}
          <Section id="changes" icon="update" title="Changes to These Terms">
            <P>
              AlumNEX reserves the right to modify these Terms at any time. When we make material changes, we will:
            </P>
            <Ul items={[
              'Update the "Last Updated" date at the top of this page',
              'Display a prominent notice on the platform for at least 14 days',
              'Send an email notification to registered users for significant changes',
            ]} />
            <P>
              Your continued use of AlumNEX after the effective date of any changes constitutes your acceptance of the revised Terms. If you do not agree to the updated Terms, you must stop using the platform.
            </P>
          </Section>

          {/* Contact */}
          <Section id="contact" icon="mail" title="Contact Us">
            <P>If you have any questions about these Terms and Conditions, please contact us:</P>
            <div style={{
              background: '#131b2e', border: '1px solid rgba(70,69,85,0.2)',
              borderRadius: 12, padding: '1.5rem', marginTop: '0.5rem',
            }}>
              {[
                { icon: 'mail',     label: 'General',  value: 'support@alumnex.com' },
                { icon: 'shield',   label: 'Legal',    value: 'legal@alumnex.com' },
                { icon: 'language', label: 'Website',  value: 'www.alumnex.com' },
                { icon: 'group',    label: 'Developed by', value: 'The Tesseract' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 18, width: 20 }}>{icon}</span>
                  <span style={{ fontSize: '0.85rem', color: '#c7c4d8' }}>
                    <span style={{ fontWeight: 600, color: '#dae2fd' }}>{label}:</span> {value}
                  </span>
                </div>
              ))}
            </div>
          </Section>

        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

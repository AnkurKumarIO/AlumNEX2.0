import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './index.css';
import AlumNexLogo from './AlumNexLogo';
import { AuthContext, AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import StudentLogin from './pages/StudentLogin';
import UnifiedLogin from './pages/UnifiedLogin';
import ProfileSetup from './pages/ProfileSetup';
import TNPLogin from './pages/TNPLogin';
import AlumniLogin from './pages/AlumniLogin';
import Dashboard from './pages/Dashboard';
import AlumniDashboard from './pages/AlumniDashboard';
import TNPDashboard from './pages/TNPDashboard';
import InterviewRoom from './pages/InterviewRoom';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import ContactUs from './pages/ContactUs';

function DashboardRouter() {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ALUMNI') return <AlumniDashboard />;
  if (user.role === 'TNP')    return <TNPDashboard />;
  return <Dashboard />;
}

function LandingGuard() {
  const { user } = useContext(AuthContext);
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function ProfileSetupGuard() {
  const { user } = useContext(AuthContext);
  // Must be logged in to reach profile setup
  if (!user) return <Navigate to="/login" replace />;
  // If profile is already complete, skip to dashboard
  try {
    const p1 = JSON.parse(localStorage.getItem('alumnex_profile') || 'null');
    const p2 = JSON.parse(localStorage.getItem('alumniconnect_profile') || 'null');
    const saved = p1 || p2;
    if (saved && (saved.profileComplete === true || saved.department || (saved.skills && saved.skills.length > 0))) {
      return <Navigate to="/dashboard" replace />;
    }
  } catch {}
  return <ProfileSetup />;
}

function PublicNavbar() {
  const { user } = useContext(AuthContext);
  const isInterview = window.location.pathname.startsWith('/interview');
  const isLegalPage = ['/privacy', '/terms', '/contact'].includes(window.location.pathname);
  
  // Show navbar on legal pages even if not authenticated
  if (user && !isLegalPage) return null;
  if (isInterview) return null;
  
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <AlumNexLogo size="xs" />
      </Link>
      <div className="navbar-links">
        {isLegalPage && (
          <>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Contact</Link>
          </>
        )}
        <Link to="/login">Sign In</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <PublicNavbar />
        <Routes>
          <Route path="/"                       element={<LandingGuard />} />
          <Route path="/login"                  element={<UnifiedLogin />} />
          <Route path="/student/login"          element={<StudentLogin />} />
          <Route path="/alumni/login"           element={<AlumniLogin />} />
          <Route path="/tnp/login"              element={<TNPLogin />} />
          <Route path="/profile-setup"          element={<ProfileSetupGuard />} />
          <Route path="/dashboard"              element={<DashboardRouter />} />
          <Route path="/interview/:roomId"      element={<InterviewRoom />} />
          <Route path="/resume-analyzer"        element={<ResumeAnalyzer />} />
          <Route path="/privacy"                element={<PrivacyPolicy />} />
          <Route path="/terms"                  element={<TermsAndConditions />} />
          <Route path="/contact"                element={<ContactUs />} />
          {/* Self-registration removed — accounts created by TNP bulk upload */}
          <Route path="/student/register"       element={<Navigate to="/login" replace />} />
          <Route path="/auth/student/register"  element={<Navigate to="/login" replace />} />
          <Route path="/alumni/register"        element={<Navigate to="/login" replace />} />
          <Route path="/auth/alumni/register"   element={<Navigate to="/login" replace />} />
          <Route path="*"                       element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

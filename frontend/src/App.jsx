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
import GoogleMeetInterviewRoom from './GoogleMeetInterviewRoom';
import ResumeAnalyzer from './pages/ResumeAnalyzer';

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

function PublicNavbar() {
  const { user } = useContext(AuthContext);
  const isInterview = window.location.pathname.startsWith('/interview');
  if (user || isInterview) return null;
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <AlumNexLogo size={28} showText textSize="1.1rem" />
      </Link>
      <div className="navbar-links">
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
          <Route path="/profile-setup"          element={<ProfileSetup />} />
          <Route path="/dashboard"              element={<DashboardRouter />} />
          <Route path="/interview/:roomId"      element={<InterviewRoom />} />
          <Route path="/meet-interview/:roomId" element={<GoogleMeetInterviewRoom />} />
          <Route path="/resume-analyzer"        element={<ResumeAnalyzer />} />
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

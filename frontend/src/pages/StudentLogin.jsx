import { Navigate } from 'react-router-dom';
export default function StudentLogin() {
<<<<<<< HEAD
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showForgotInfo, setShowForgotInfo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);

    try {
      const result = await api.studentLogin(username, password);
      if (result.token) {
        login(result.user, result.token);
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid username or password.');
      }
    } catch (err) {
      setError('Server connection failed.');
    }
    setLoading(false);
  };

  const inp = {
    width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)',
    borderRadius: 10, padding: '0.75rem 0.875rem', color: '#dae2fd',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 440, border: '1px solid rgba(70,69,85,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#1d00a5', fontSize: 30, fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Student Portal</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Welcome Back</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Sign in to continue</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#ffb4ab' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. alice_j"
              autoComplete="username"
              style={inp}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...inp, paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: loading ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: loading ? '#c7c4d8' : '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Forgot Password link */}
        <div style={{ textAlign: 'right', marginTop: '-0.25rem', marginBottom: '-0.25rem' }}>
          <button
            type="button"
            onClick={() => setShowForgotInfo(v => !v)}
            style={{ background: 'none', border: 'none', color: '#c3c0ff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            Forgot Password?
          </button>
        </div>

        {showForgotInfo && (
          <div style={{ background: '#131b2e', borderRadius: 12, border: '1px solid rgba(195,192,255,0.15)', padding: '1rem 1.25rem', marginTop: '0.5rem', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.625rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ffb95f' }}>info</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account Access</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#c7c4d8', lineHeight: 1.7, margin: 0 }}>
              Accounts are created by your TNP coordinator.{' '}
              <span style={{ color: '#ffb95f', fontWeight: 600 }}>Contact your institution admin</span>{' '}
              if you need access or have forgotten your credentials.
            </p>
            <p style={{ fontSize: '0.73rem', color: 'rgba(199,196,216,0.6)', lineHeight: 1.6, margin: '0.5rem 0 0 0' }}>
              Your username and password are provided by your college's TNP office. Please reach out to them directly for any login issues.
            </p>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
=======
  return <Navigate to="/login?role=STUDENT" replace />;
>>>>>>> d72eb05 (chetana aktest changes)
}

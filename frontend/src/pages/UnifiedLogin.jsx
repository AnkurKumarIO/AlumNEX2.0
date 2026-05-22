import React, { useState, useContext } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AlumNexLogo from "../AlumNexLogo";
import { supabase } from "../lib/supabaseClient";
import { api, API_BASE } from "../api";

const CREDENTIAL_STORE = [
  { username: "admin",           password: "tnp_secure_123", role: "TNP",     name: "TNP Coordinator",  department: "Administration",         id: "tnp-admin" },
  { username: "alice.johnson42", password: "Xk7mP2qR9n",    role: "STUDENT", name: "Alice Johnson",    department: "Computer Science",       id: "stu-alice-johnson" },
  { username: "bob.smith18",     password: "Ry4nQ8wL3v",    role: "STUDENT", name: "Bob Smith",        department: "Electrical Engineering", id: "stu-bob-smith" },
  { username: "priya.sharma",    password: "Alumni@2026",    role: "ALUMNI",  name: "Priya Sharma",     department: "Computer Science",       id: "alm-priya-sharma" },
  { username: "rahul.verma",     password: "Alumni@2026",    role: "ALUMNI",  name: "Rahul Verma",      department: "Electrical Engineering", id: "alm-rahul-verma" },
  { username: "sarah.chen",      password: "Alumni@2026",    role: "ALUMNI",  name: "Sarah Chen",       department: "Computer Science",       id: "alm-sarah-chen" },
  { username: "jasmine.patel",   password: "Alumni@2026",    role: "ALUMNI",  name: "Jasmine Patel",    department: "Computer Science",       id: "alm-jasmine-patel" },
  { username: "aisha.okonkwo",   password: "Alumni@2026",    role: "ALUMNI",  name: "Aisha Okonkwo",    department: "Computer Science",       id: "alm-aisha-okonkwo" },
];

function findLocalCredential(username, password) {
  const found = CREDENTIAL_STORE.find(c => c.username === username.trim() && c.password === password.trim());
  if (found) return found;
  try {
    const pending = JSON.parse(localStorage.getItem("alumniconnect_pending_profile") || "{}");
    if (pending.username === username.trim() && pending.password === password.trim()) return { ...pending, role: pending.role || "STUDENT" };
    const approved = JSON.parse(localStorage.getItem("alumniconnect_approved_accounts") || "[]");
    return approved.find(c => c.username === username.trim() && c.password === password.trim()) || null;
  } catch { return null; }
}

/** Returns true if student has already completed profile setup. */
function isProfileComplete() {
  try {
    const p1 = JSON.parse(localStorage.getItem('alumnex_profile') || 'null');
    const p2 = JSON.parse(localStorage.getItem('alumniconnect_profile') || 'null');
    const profile = p1 || p2;
    // Profile is complete if the flag is set OR if significant data exists
    if (!profile) return false;
    if (profile.profileComplete === true) return true;
    // Fallback: treat as complete if department or skills are filled
    if (profile.department || (profile.skills && profile.skills.length > 0)) return true;
    return false;
  } catch { return false; }
}

export default function UnifiedLogin() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [role, setRole] = useState("STUDENT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) { setError("Please enter both username and password."); return; }
    setLoading(true);

    // 1. Try backend API auth (Robust lookup via Prisma + Supabase Auth)
    let apiSuccess = false;
    let apiResult = null;
    try {
      if (role === "STUDENT") {
        apiResult = await api.studentLogin(username.trim(), password.trim());
      } else if (role === "ALUMNI") {
        apiResult = await api.alumniLogin(username.trim(), password.trim());
      } else if (role === "TNP") {
        apiResult = await api.tnpLogin(username.trim(), password.trim());
      }

      if (apiResult && !apiResult.error && apiResult.token && apiResult.user) {
        apiSuccess = true;
      }
    } catch (err) {
      console.warn("Backend auth failed, falling back to direct Supabase auth...", err.message);
    }

    if (apiSuccess && apiResult) {
      login(apiResult.user, apiResult.token);
      // Try to sign in on the Supabase client directly to establish session
      try {
        const email = apiResult.user.email;
        if (email) {
          await supabase.auth.signInWithPassword({ email, password: password.trim() });
        }
      } catch {}
      // Redirect logic
      if (apiResult.user.role === "STUDENT" && !isProfileComplete()) {
        navigate("/profile-setup");
      } else {
        navigate("/dashboard");
      }
      setLoading(false);
      return;
    }

    // 2. Direct Supabase Auth Fallback
    try {
      let email = username.trim();
      if (!email.includes("@")) {
        // Look up email by username in public.users
        const { data, error } = await supabase
          .from("users")
          .select("email")
          .eq("username", username.trim())
          .maybeSingle();
        if (data?.email) {
          email = data.email;
        } else {
          // Try lookup by name
          const { data: data2 } = await supabase
            .from("users")
            .select("email")
            .ilike("name", `%${username.trim()}%`)
            .limit(1);
          if (data2?.[0]?.email) {
            email = data2[0].email;
          }
        }
      }

      if (email.includes("@")) {
        // Try Supabase sign in directly
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password: password.trim(),
        });

        if (!authErr && authData?.user) {
          // Fetch user record from users table
          const { data: dbUser } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .maybeSingle();

          if (dbUser) {
            const profileData = typeof dbUser.profile_data === "string" ? JSON.parse(dbUser.profile_data) : (dbUser.profile_data || {});
            const userData = {
              id: dbUser.id,
              name: dbUser.name,
              role: dbUser.role,
              email: dbUser.email,
              department: dbUser.department,
              profile_data: profileData,
            };
            login(userData, authData.session?.access_token || `token-${Date.now()}`);
            if (dbUser.role === "STUDENT" && !isProfileComplete()) {
              navigate("/profile-setup");
            } else {
              navigate("/dashboard");
            }
            setLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Direct Supabase auth fallback failed:", err.message);
    }

    // 3. Last Resort: Local Credential Store (Mock)
    const localCred = findLocalCredential(username, password);
    if (localCred) {
      if (localCred.role !== role) { setError(`These credentials belong to a ${localCred.role.toLowerCase()} account.`); setLoading(false); return; }
      
      // Auto-register mock users into the real database so sync works perfectly!
      try {
        const email = `${localCred.username}@alumniconnect.edu`;
        const endpoint = localCred.role === 'STUDENT' ? '/auth/student/register' : '/auth/alumni/register';
        const payload = {
          name: localCred.name,
          username: localCred.username,
          email,
          password: localCred.password,
          department: localCred.department,
          batchYear: localCred.role === 'ALUMNI' ? 2020 : undefined,
          company: localCred.role === 'ALUMNI' ? 'Mock Corp' : undefined,
        };
        
        let regRes = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        // If it failed because it already exists, let's login instead!
        if (regRes.status === 400 || regRes.status === 401) {
          const loginEndpoint = localCred.role === 'STUDENT' ? '/auth/student/login' : '/auth/alumni/login';
          regRes = await fetch(`${API_BASE}${loginEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: localCred.username, password: localCred.password }),
          });
        }
        
        const data = await regRes.json();
        if (regRes.ok && data.user) {
          login(data.user, data.token);
          if (data.user.role === "STUDENT" && !localStorage.getItem("alumnex_profile") && !localStorage.getItem("alumniconnect_profile")) {
             navigate("/profile-setup");
          } else {
             navigate("/dashboard");
          }
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Auto-registration of mock user failed:", e.message);
      }

      // If auto-registration fails for some reason, fallback to original offline behavior
      let finalId = localCred.id || `${localCred.role.toLowerCase()}-${Date.now()}`;
      const userData = { id: finalId, name: localCred.name, role: localCred.role, department: localCred.department };
      login(userData, `token-${Date.now()}`);
      if (localCred.role === "STUDENT" && !isProfileComplete()) { navigate("/profile-setup"); } else { navigate("/dashboard"); }
      setLoading(false);
      return;
    }

    setError("Invalid username or password.");
    setLoading(false);
  };

  const ROLE_TABS = [
    { id: "STUDENT", label: "Student",   icon: "school" },
    { id: "ALUMNI",  label: "Alumni",    icon: "psychology" },
    { id: "TNP",     label: "TNP Admin", icon: "admin_panel_settings" },
  ];
  const DEMO_HINTS = {
    STUDENT: "Demo: alice.johnson42 / Xk7mP2qR9n",
    ALUMNI:  "Demo: priya.sharma / Alumni@2026",
    TNP:     "Demo: admin / tnp_secure_123",
  };
  const inp = { width: "100%", background: "#222a3d", border: "1px solid rgba(70,69,85,0.4)", borderRadius: 10, padding: "0.75rem 0.875rem", color: "#dae2fd", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif" };

  return (
    <div style={{ minHeight: "100vh", background: "#0b1326", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Inter, sans-serif", color: "#dae2fd" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "0.75rem" }}>
            <AlumNexLogo size={40} showText textSize="1.75rem" />
          </div>
          <p style={{ fontSize: "0.875rem", color: "#c7c4d8" }}>Sign in with your credentials</p>
        </div>
        <div style={{ background: "#171f33", borderRadius: 20, border: "1px solid rgba(70,69,85,0.15)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid rgba(70,69,85,0.2)" }}>
            {ROLE_TABS.map(tab => (
              <button key={tab.id} onClick={() => { setRole(tab.id); setError(""); }}
                style={{ flex: 1, padding: "0.875rem 0.5rem", background: "none", border: "none", borderBottom: role === tab.id ? "2px solid #c3c0ff" : "2px solid transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: role === tab.id ? "#c3c0ff" : "#c7c4d8" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{tab.icon}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{tab.label}</span>
              </button>
            ))}
          </div>
          <div style={{ padding: "2rem" }}>
            {error && <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#ffb4ab" }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#c7c4d8", display: "block", marginBottom: 6 }}>Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" autoComplete="username" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#c7c4d8", display: "block", marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" style={{ ...inp, paddingRight: "2.5rem" }} />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#c7c4d8" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.875rem", background: loading ? "#2d3449" : "linear-gradient(135deg,#4f46e5,#c3c0ff)", color: loading ? "#c7c4d8" : "#1d00a5", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.875rem", cursor: loading ? "not-allowed" : "pointer", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(199,196,216,0.3)", borderTop: "2px solid #c7c4d8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Signing in...</> : "Sign In"}
              </button>
            </form>
            <div style={{ marginTop: "1.25rem", padding: "0.75rem 1rem", background: "#131b2e", borderRadius: 10, border: "1px solid rgba(70,69,85,0.2)" }}>
              <p style={{ fontSize: "0.72rem", color: "#c7c4d8", lineHeight: 1.6, margin: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#ffb95f", verticalAlign: "middle", marginRight: 4 }}>info</span>
                {DEMO_HINTS[role]}
              </p>
            </div>
            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9b98b8", marginTop: "1.25rem", lineHeight: 1.5 }}>
              Accounts are created by your TNP coordinator.{" "}
              <span style={{ color: "#ffb95f" }}>Contact your institution admin</span> if you need access.
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

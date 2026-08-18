import React, { useState } from 'react';
import { GraduationCap, BookOpen, Network, Shield, ArrowLeft, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X } from 'lucide-react';

// ─── localStorage helpers ──────────────────────────────────────────────────────
const USERS_KEY = 'erp_users';
const SESSION_KEY = 'erp_session';

function getStoredUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}
function saveUser(user) {
  const users = getStoredUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function findUser(email, password) {
  return getStoredUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password) || null;
}
function emailExists(email) {
  return getStoredUsers().some(u => u.email.toLowerCase() === email.toLowerCase());
}
export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
export function updateSessionProfile(profileData) {
  const session = getSession();
  if (!session) return null;
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === session.id);
  if (idx !== -1) {
    users[idx].profile = profileData;
    users[idx].profile_completed = 1;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const updated = { ...users[idx] };
    saveSession(updated);
    return updated;
  }
  return null;
}

// ─── Role Definitions ──────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    desc: 'Access course materials, view grades, track attendance, and manage assignments securely.',
    loginTitle: 'Student Portal Login',
    loginSubtitle: 'Access your course materials and grades.',
    buttonText: 'Enter as Student',
    helpText: 'Need help? Contact IT Support',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    icon: BookOpen,
    desc: 'Manage classes, grade assignments, communicate with students, and upload curriculum resources.',
    loginTitle: 'Teacher Portal Login',
    loginSubtitle: 'Manage your classes, grades, and student communication.',
    buttonText: 'Enter as Teacher',
    helpText: 'Need help accessing your account? Contact IT Support',
  },
  {
    id: 'hod',
    label: 'HOD',
    icon: Network,
    desc: 'Oversee department performance, manage faculty schedules, and review departmental analytics.',
    loginTitle: 'HOD Portal Login',
    loginSubtitle: 'Oversee department performance and faculty schedules.',
    buttonText: 'Enter as HOD',
    helpText: 'Need IT support? Contact Helpdesk',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    desc: 'System configuration, user management, global analytics, and institutional infrastructure control.',
    loginTitle: 'Admin Portal Login',
    loginSubtitle: 'System configuration, user management, and institutional control.',
    buttonText: 'Enter as Admin',
    helpText: 'Need system support? Contact Super Admin',
  },
];

// ─── Popup / Toast Alert ────────────────────────────────────────────────────────
function AlertToast({ message, type, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 9999,
      backgroundColor: type === 'error' ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`,
      borderRadius: '10px',
      padding: '14px 18px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '380px',
      animation: 'toastFadeIn 0.3s ease-out'
    }}>
      <style>{`@keyframes toastFadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {type === 'error' ? <AlertCircle size={20} color="#dc2626" /> : <CheckCircle2 size={20} color="#16a34a" />}
      <div style={{ flex: 1, fontSize: '13.5px', color: type === 'error' ? '#991b1b' : '#166534', fontWeight: 500 }}>
        {message}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
        <X size={16} />
      </button>
    </div>
  );
}

export default function AuthModal({ onLoginSuccess, onRegisterSuccess }) {
  // Screens: 'role-select' | 'register' | 'login'
  const [screen, setScreen] = useState('role-select');
  const [activeRole, setActiveRole] = useState(ROLES[0]);
  const [toast, setToast] = useState(null);

  // Register Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [regPassword, setRegPassword] = useState('');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const triggerAlert = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Handle Register Submit ──
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      triggerAlert('Please enter both First Name and Last Name.');
      return;
    }
    if (!regEmail.trim()) {
      triggerAlert('Institutional Email is required.');
      return;
    }
    if (regPassword.length < 6) {
      triggerAlert('Password must be at least 6 characters.');
      return;
    }
    if (emailExists(regEmail)) {
      triggerAlert('User with this email already exists! Please log in.');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: regRole,
      department: 'Computer Science & Engineering',
      profile_completed: 0,
      profile: {},
      created_at: new Date().toISOString(),
    };

    saveUser(newUser);
    triggerAlert('Registration successful! Redirecting to login...', 'success');
    
    setTimeout(() => {
      setLoginEmail(regEmail);
      const targetRole = ROLES.find(r => r.id === regRole) || ROLES[0];
      setActiveRole(targetRole);
      setScreen('login');
    }, 1500);
  };

  // ── Handle Login Submit ──
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      triggerAlert('Please enter both email and password.');
      return;
    }

    const user = findUser(loginEmail.trim(), loginPassword);
    if (!user) {
      triggerAlert('User or password invalid. Please check your credentials.');
      return;
    }

    if (user.role !== activeRole.id) {
      triggerAlert(`This user is registered as "${user.role.toUpperCase()}". Please switch to the ${user.role.toUpperCase()} login or re-select role.`);
      return;
    }

    saveSession(user);
    triggerAlert(`Welcome back, ${user.name}!`, 'success');
    setTimeout(() => {
      onLoginSuccess(user);
    }, 600);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 1: Welcome to Academic Portal (Role Selection Grid)
  // ══════════════════════════════════════════════════════════════════════════════
  if (screen === 'role-select') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>
        {toast && <AlertToast {...toast} onClose={() => setToast(null)} />}

        {/* Top Navbar */}
        <header style={{ padding: '20px 40px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a', letterSpacing: '-0.2px' }}>
            Academic Portal
          </div>
        </header>

        {/* Hero Banner */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px 40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0', letterSpacing: '-0.5px' }}>
              Welcome to Academic Portal
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b', margin: 0, fontWeight: 400 }}>
              Please select your role to access the appropriate dashboard and resources.
            </p>
          </div>

          {/* 4 Role Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', width: '100%', maxWidth: '1100px', marginBottom: '40px' }}>
            {ROLES.map((r) => {
              const IconComp = r.icon;
              return (
                <div
                  key={r.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '32px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ width: '56px', height: '56px', backgroundColor: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <IconComp size={24} color="#334155" />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
                    {r.label}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', margin: '0 0 28px 0', flex: 1 }}>
                    {r.desc}
                  </p>
                  <button
                    onClick={() => {
                      setActiveRole(r);
                      setScreen('login');
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#f1f5f9',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#0f172a',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  >
                    {r.buttonText}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Secure Institutional Access Gateway badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', fontWeight: 500, marginTop: '10px' }}>
            <Lock size={14} color="#64748b" />
            <span>Secure Institutional Access Gateway</span>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '24px 40px', fontSize: '13px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>Academic Portal</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#privacy" style={{ color: '#475569', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#terms" style={{ color: '#475569', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#support" style={{ color: '#475569', textDecoration: 'none' }}>Contact Support</a>
            <a href="#accessibility" style={{ color: '#475569', textDecoration: 'none' }}>Accessibility</a>
          </div>
          <div>© 2024 University Academic Department. All rights reserved.</div>
        </footer>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 2: Create Account (Registration Modal / Card)
  // ══════════════════════════════════════════════════════════════════════════════
  if (screen === 'register') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
        {toast && <AlertToast {...toast} onClose={() => setToast(null)} />}

        <div style={{
          width: '100%',
          maxWidth: '920px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 40%) 1fr',
          overflow: 'hidden',
        }}>
          {/* Left Campus Graphic / Banner Panel */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%), url("https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justify: 'flex-end',
            color: '#ffffff',
          }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.3px' }}>
              Academic Portal
            </h2>
            <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.5, margin: 0, opacity: 0.9 }}>
              Secure access to university resources, research databases, and administrative tools.
            </p>
          </div>

          {/* Right Form Panel */}
          <div style={{ padding: '48px 44px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
              Create Account
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px 0' }}>
              Enter your details to register for a new academic portal account.
            </p>

            <form onSubmit={handleRegisterSubmit}>
              {/* First Name & Last Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Institutional Email */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Institutional Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="jdoe@university.edu"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Primary Role */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Primary Role <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#ffffff', color: '#0f172a', boxSizing: 'border-box', cursor: 'pointer' }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '12px', color: '#64748b', margin: '6px 0 0 0' }}>
                  Must be at least 6 characters long.
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setScreen('login')}
                  style={{ background: 'none', border: 'none', color: '#334155', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={16} /> Back to Login
                </button>

                <button
                  type="submit"
                  style={{ padding: '12px 24px', backgroundColor: '#000000', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PAGE 3, 4, 5: Portal Login Page (Student / Teacher / HOD / Admin)
  // ══════════════════════════════════════════════════════════════════════════════
  if (screen === 'login') {
    const IconComp = activeRole.icon;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
        {toast && <AlertToast {...toast} onClose={() => setToast(null)} />}

        {/* Navigation Switcher */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRole(r)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: activeRole.id === r.id ? '#0f172a' : '#cbd5e1',
                backgroundColor: activeRole.id === r.id ? '#0f172a' : '#ffffff',
                color: activeRole.id === r.id ? '#ffffff' : '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => setScreen('role-select')}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Switch Role
          </button>
        </div>

        {/* Login Card Container */}
        <div style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 25px rgba(0,0,0,0.04)',
          padding: '40px 36px',
          textAlign: 'center',
        }}>
          {/* Badge Icon for Teacher/HOD/Admin */}
          {(activeRole.id === 'teacher' || activeRole.id === 'hod' || activeRole.id === 'admin') && (
            <div style={{ width: '48px', height: '48px', backgroundColor: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <IconComp size={24} color="#ffffff" />
            </div>
          )}

          {/* Header */}
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            {activeRole.loginTitle}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px 0', lineHeight: 1.4 }}>
            {activeRole.loginSubtitle}
          </p>

          <form onSubmit={handleLoginSubmit} style={{ textAlign: 'left' }}>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email / University ID
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="user@university.edu"
                  required
                  style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); triggerAlert('Password reset link sent to your institutional email.', 'success'); }} style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                  Forgot Password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', padding: '10px 38px 10px 38px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                {activeRole.id === 'student' ? 'Remember me for 30 days' : activeRole.id === 'hod' ? 'Remember device' : 'Remember me'}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Sign In {activeRole.id === 'hod' && '→'}
            </button>

            {/* Need Account Link */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setScreen('register')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Don't have an account? Register Account
              </button>
            </div>

            {/* Help Text */}
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
              {activeRole.helpText}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}


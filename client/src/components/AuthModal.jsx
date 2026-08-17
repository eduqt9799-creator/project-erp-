import React, { useState, useEffect } from 'react';
import { BookOpen, User, Shield, GraduationCap, ArrowRight } from 'lucide-react';

export default function AuthModal({ onLoginSuccess, onRegisterSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [departmentId, setDepartmentId] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        setDepartments(data);
        if (data.length > 0) setDepartmentId(data[0].id);
      })
      .catch(err => console.error('Failed to fetch departments:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { name, email, password, role, department_id: Number(departmentId) }
      : { email, password };

    try {
      const res = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('alexandria_token', data.token);
      if (isRegister) {
        onRegisterSuccess(data.user);
      } else {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (demoEmail) => {   
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');
      localStorage.setItem('alexandria_token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '32px', color: '#0d2847' }}>Alexandria</h1>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', color: '#555555', marginTop: '4px' }}>
            Centralized Academic Portal ERP
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Dr. Alan Turing / Margaret Hamilton"
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Institutional Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="username@alexandria.edu"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Portal Role</label>
                <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="student">🎓 Student Portal</option>
                  <option value="teacher">👩‍🏫 Teacher / Faculty Portal</option>
                  <option value="hod">👔 Head of Department (HOD)</option>
                  <option value="admin">🏛️ System Administrator</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Department</label>
                <select className="input-field" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Authenticating...' : (isRegister ? 'Complete Registration' : 'Access Portal')}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button 
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#0f4c81', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {isRegister ? 'Already registered? Sign in here' : "Need an account? Register new profile"}
          </button>
        </div>

        {/* Quick Demo Credentials Switcher */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #e5e3dc' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#777777', fontWeight: 700, marginBottom: '10px' }}>
            ⚡ Quick Demo Database Sign-In:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              type="button"
              onClick={() => loginDemo('hod.cse@alexandria.edu')}
              style={{ padding: '8px 10px', fontSize: '11px', background: '#f4f3ee', border: '1px solid #dcd9d0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
            >
              👔 <strong>CSE HOD</strong> (Dr. Arun)
            </button>
            <button 
              type="button"
              onClick={() => loginDemo('teacher.ada@alexandria.edu')}
              style={{ padding: '8px 10px', fontSize: '11px', background: '#f4f3ee', border: '1px solid #dcd9d0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
            >
              👩‍🏫 <strong>CSE Teacher</strong> (Prof. Ada)
            </button>
            <button 
              type="button"
              onClick={() => loginDemo('student.linus@alexandria.edu')}
              style={{ padding: '8px 10px', fontSize: '11px', background: '#f4f3ee', border: '1px solid #dcd9d0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
            >
              🎓 <strong>CSE Student</strong> (Linus)
            </button>
            <button 
              type="button"
              onClick={() => loginDemo('admin@alexandria.edu')}
              style={{ padding: '8px 10px', fontSize: '11px', background: '#f4f3ee', border: '1px solid #dcd9d0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
            >
              🏛️ <strong>Admin</strong> (Chancellor)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

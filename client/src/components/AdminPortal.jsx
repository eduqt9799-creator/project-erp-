import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, Shield, PlusCircle, Building, Trash2 } from 'lucide-react';
import SettingsTab from './SettingsTab';
import YearSelector from './YearSelector';

export default function AdminPortal({ stats, user, activeTab }) {
  const [selectedYear, setSelectedYear] = useState(0); // 0 = All, 1 = 1st Year, 2 = 2nd Year
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for Admin user creation
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newRole, setNewRole] = useState('student');
  const [newDeptId, setNewDeptId] = useState(1);
  const [newAcademicYear, setNewAcademicYear] = useState(1);
  const [newIdentifier, setNewIdentifier] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userMsg, setUserMsg] = useState('');

  const fetchUsers = () => {
    setLoadingUsers(true);
    const token = localStorage.getItem('alexandria_token');
    fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAllUsers(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'dashboard' || !activeTab) {
      fetchUsers();
    }
  }, [activeTab]);

  const firstYearCount = allUsers.filter(u => u.role === 'student' && u.academic_year === 1).length;
  const secondYearCount = allUsers.filter(u => u.role === 'student' && u.academic_year === 2).length;

  const displayedUsers = selectedYear === 0 
    ? allUsers 
    : allUsers.filter(u => u.role !== 'student' || u.academic_year === selectedYear);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          department_id: Number(newDeptId),
          academic_year: Number(newAcademicYear),
          roll_number: newRole === 'student' ? newIdentifier : null,
          employee_id: newRole === 'teacher' ? newIdentifier : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setUserMsg(`✅ Account created successfully for ${newName} (${newRole.toUpperCase()})!`);
      setShowCreateModal(false);
      setNewName('');
      setNewEmail('');
      setNewIdentifier('');
      fetchUsers();
      setTimeout(() => setUserMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the user account for "${userName}"?`)) return;
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUserMsg(`✅ User "${userName}" deleted successfully.`);
      fetchUsers();
      setTimeout(() => setUserMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (!stats) return <div style={{ color: '#aaa', padding: '40px' }}>Loading System Governance Portal...</div>;

  const { totalDepartments, totalUsers, usersByRole, departmentsList } = stats;

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-hero">
        <div className="dept-pill">
          🏛️ Chancellor Executive Portal • System Governance
        </div>
        <h1 className="welcome-title">Welcome back, Chancellor.</h1>
        <p className="welcome-subtitle">
          Centralized governance for Hindusthan CSE Department ERP. Oversee departments, manage role authorizations, and maintain institutional integrity.
        </p>
      </div>



      {/* 1. DASHBOARD HOME TAB */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 4' }}>
            <div className="card-white-subtitle">FIRST YEAR ACCOUNTS</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#0f4c81', marginTop: '6px' }}>
              {firstYearCount} Students
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>1st Year Batch (2025 - 2029)</p>
          </div>

          <div className="card-white" style={{ gridColumn: 'span 4' }}>
            <div className="card-white-subtitle">SECOND YEAR ACCOUNTS</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#c5a059', marginTop: '6px' }}>
              {secondYearCount} Students
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>2nd Year Batch (2024 - 2028)</p>
          </div>

          <div className="card-white" style={{ gridColumn: 'span 4' }}>
            <div className="card-white-subtitle">TOTAL SYSTEM ACCOUNTS</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#15803d', marginTop: '6px' }}>
              {totalUsers} Accounts
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Database Authenticated Users</p>
          </div>

          {/* Departments Overview List */}
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="card-white-title">Departments & Academic Leadership Overview</h2>
              <span className="card-white-subtitle">MULTI-DEPARTMENT ERP</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {departmentsList.map(d => (
                <div key={d.id} style={{ border: '1px solid #e2dfd7', borderRadius: '10px', padding: '20px', backgroundColor: '#faf9f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', background: '#0d2847', padding: '4px 12px', borderRadius: '6px' }}>
                      {d.code}
                    </span>
                    <span style={{ fontSize: '12px', color: '#666' }}>ID: #{d.id}</span>
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: '#111' }}>{d.name}</h3>
                  <p style={{ fontSize: '13px', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>{d.description}</p>
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #eae8e3', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div>👔 HOD: <strong>{d.hod_name || 'Dr. Alan Turing'}</strong></div>
                    <div>👨‍🏫 Faculty: <strong>{d.teacher_count || 0}</strong> • 🎓 Students: <strong>{d.student_count || 0}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. DEDICATED TAB: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Academic Departments Registry</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>Central governance and department isolation structure.</p>
              </div>
              <span className="card-white-subtitle">{departmentsList.length} ACTIVE DEPARTMENTS</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {departmentsList.map(d => (
                <div key={d.id} style={{ border: '1px solid #e2dfd7', borderRadius: '10px', padding: '20px', backgroundColor: '#faf9f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', background: '#0d2847', padding: '4px 12px', borderRadius: '6px' }}>
                      {d.code}
                    </span>
                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>✓ Active Isolation</span>
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: '#111' }}>{d.name}</h3>
                  <p style={{ fontSize: '13px', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>{d.description}</p>
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #eae8e3', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div>👔 HOD: <strong>{d.hod_name || 'Dr. Alan Turing'}</strong></div>
                    <div>👨‍🏫 Faculty: <strong>{d.teacher_count || 0}</strong> • 🎓 Students: <strong>{d.student_count || 0}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. DEDICATED TAB: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="card-white-title">Global ERP Users Registry ({selectedYear === 0 ? 'All Academic Years' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>System-wide user accounts across 1st Year Students, 2nd Year Students, Teachers, HODs, and Admins.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                + Create Student / Teacher Account
              </button>
            </div>

            {userMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '16px' }}>{userMsg}</div>}

            {loadingUsers ? (
              <p style={{ color: '#666' }}>Fetching database users...</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd9cf', color: '#555' }}>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Role</th>
                    <th style={{ padding: '10px' }}>Academic Year</th>
                    <th style={{ padding: '10px' }}>Department</th>
                    <th style={{ padding: '10px' }}>Identifier / Roll</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #eae8e3' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding: '10px', color: '#666' }}>{u.email}</td>
                      <td style={{ padding: '10px', textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, color: u.role === 'admin' ? '#a83232' : u.role === 'hod' ? '#0f4c81' : '#111' }}>
                        {u.role}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {u.role === 'student' ? (
                          <span style={{ fontSize: '11px', background: u.academic_year === 1 ? '#eef4fb' : '#fef3c7', color: u.academic_year === 1 ? '#0f4c81' : '#b45309', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            {u.academic_year === 1 ? '1st Year' : '2nd Year'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#888' }}>Staff</span>
                        )}
                      </td>
                      <td style={{ padding: '10px' }}>{u.dept_code || 'CSE'}</td>
                      <td style={{ padding: '10px', color: '#777' }}>{u.roll_number || u.employee_id || 'N/A'}</td>
                      <td style={{ padding: '10px' }}>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 4. DEDICATED TAB: INSTITUTIONAL ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ marginBottom: '12px' }}>Institutional Attendance Governance Report</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              System-wide oversight across all departments (CSE, ECE, ME, EE).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {departmentsList.map(d => (
                <div key={d.id} style={{ padding: '16px', border: '1px solid #e2dfd7', borderRadius: '8px', backgroundColor: '#faf9f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, background: '#0d2847', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {d.code}
                    </span>
                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>Synced & Active</span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{d.name}</h3>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>
                    HOD: <strong>{d.hod_name || 'Assigned'}</strong> • Students: <strong>{d.student_count}</strong> • Faculty: <strong>{d.teacher_count}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. DEDICATED TAB: PROFILE SETTINGS */}
      {activeTab === 'settings' && (
        <SettingsTab user={user} />
      )}

      {/* Admin Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Create New Student or Teacher Account</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Dennis Ritchie"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="e.g. dennis@alexandria.edu"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Account Role</label>
                  <select className="input-field" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher / Faculty</option>
                  </select>
                </div>

                {newRole === 'student' && (
                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <select className="input-field" value={newAcademicYear} onChange={e => setNewAcademicYear(e.target.value)}>
                      <option value={1}>🥇 1st Year</option>
                      <option value={2}>🥈 2nd Year</option>
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: newRole === 'student' ? 'auto' : 'span 2' }}>
                  <label className="form-label">Department</label>
                  <select className="input-field" value={newDeptId} onChange={e => setNewDeptId(e.target.value)}>
                    <option value={1}>Computer Science & Eng. (CSE)</option>
                    <option value={2}>Electronics & Comm. (ECE)</option>
                    <option value={3}>Mechanical Engineering (ME)</option>
                    <option value={4}>Electrical Engineering (EE)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{newRole === 'student' ? 'Roll Number' : 'Employee ID'}</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder={newRole === 'student' ? 'e.g. CSE-1Y-2025-099' : 'e.g. EMP-CSE-105'}
                  value={newIdentifier}
                  onChange={e => setNewIdentifier(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Default Password</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creatingUser}>
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

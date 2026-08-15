import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, Shield, PlusCircle, Building } from 'lucide-react';

export default function AdminPortal({ stats, user, activeTab }) {
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') {
      setLoadingUsers(true);
      const token = localStorage.getItem('alexandria_token');
      fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setAllUsers(data))
        .catch(err => console.error(err))
        .finally(() => setLoadingUsers(false));
    }
  }, [activeTab]);

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
          Centralized governance for Alexandria ERP. Oversee departments, manage role authorizations, and maintain institutional integrity.
        </p>
      </div>

      {/* Main Grid Views */}
      <div className="dashboard-grid">
        <div className="card-white" style={{ gridColumn: 'span 4' }}>
          <div className="card-white-subtitle">INSTITUTIONAL DEPARTMENTS</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#0d2847', marginTop: '6px' }}>
            {totalDepartments} Academic Depts
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>CSE, ECE, ME, Electrical Engineering</p>
        </div>

        <div className="card-white" style={{ gridColumn: 'span 4' }}>
          <div className="card-white-subtitle">REGISTERED ERP USERS</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#0f4c81', marginTop: '6px' }}>
            {totalUsers} Accounts
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Database Authenticated Users</p>
        </div>

        <div className="card-white" style={{ gridColumn: 'span 4' }}>
          <div className="card-white-subtitle">SYSTEM STATUS</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#15803d', marginTop: '6px' }}>
            Active & Synced
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>SQLite Centralized Database</p>
        </div>

        {/* Departments Overview List */}
        <div className="card-white" style={{ gridColumn: 'span 12' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="card-white-title">Departments & Academic Leadership</h2>
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

        {/* Global User Management Directory */}
        {activeTab === 'users' && (
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ marginBottom: '16px' }}>Global ERP Users Registry</h2>
            {loadingUsers ? (
              <p style={{ color: '#666' }}>Fetching database users...</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd9cf', color: '#555' }}>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Role</th>
                    <th style={{ padding: '10px' }}>Department</th>
                    <th style={{ padding: '10px' }}>Identifier / Roll</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #eae8e3' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding: '10px', color: '#666' }}>{u.email}</td>
                      <td style={{ padding: '10px', textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, color: u.role === 'admin' ? '#a83232' : u.role === 'hod' ? '#0f4c81' : '#111' }}>
                        {u.role}
                      </td>
                      <td style={{ padding: '10px' }}>{u.dept_code || 'CSE'}</td>
                      <td style={{ padding: '10px', color: '#777' }}>{u.roll_number || u.employee_id || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

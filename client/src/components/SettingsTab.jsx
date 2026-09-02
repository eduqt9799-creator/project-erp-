import React, { useState } from 'react';
import { User, Phone, BookOpen, Shield, Save, CheckCircle } from 'lucide-react';

export default function SettingsTab({ user, onProfileUpdated }) {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.profile?.phone || '');
  const [bio, setBio] = useState(user.profile?.bio || '');
  const [officeRoom, setOfficeRoom] = useState(user.profile?.office_room || '');
  const [rollNumber, setRollNumber] = useState(user.profile?.roll_number || '');
  const [employeeId, setEmployeeId] = useState(user.profile?.employee_id || '');
  const [batchYear, setBatchYear] = useState(user.profile?.batch_year || '2023 - 2027');
  const [designation, setDesignation] = useState(user.profile?.designation || '');
  const [specialization, setSpecialization] = useState(user.profile?.specialization || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          phone,
          bio,
          office_room: officeRoom,
          roll_number: rollNumber,
          employee_id: employeeId,
          batch_year: batchYear,
          designation,
          specialization
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile settings');

      setSuccessMsg('✅ Profile settings updated successfully!');
      if (onProfileUpdated) onProfileUpdated(data.user);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="card-white" style={{ gridColumn: 'span 12' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 className="card-white-title">Profile & Institutional Account Settings</h2>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Manage your profile details, contact info, and institutional credentials for {user.dept_name || 'Alexandria ERP'}.
            </p>
          </div>
          <span style={{ fontSize: '12px', background: '#eef4fb', color: '#0f4c81', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}>
            Role: {user.role.toUpperCase()}
          </span>
        </div>

        {successMsg && (
          <div style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, marginBottom: '20px' }}>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', marginBottom: '20px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Institutional Email (Read Only)</label>
              <input
                type="email"
                className="input-field"
                value={user.email}
                disabled
                style={{ backgroundColor: '#f4f3ee', color: '#777', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          {user.role === 'student' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Student Roll Number</label>
                <input
                  type="text"
                  className="input-field"
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Batch Duration</label>
                <input
                  type="text"
                  className="input-field"
                  value={batchYear}
                  onChange={e => setBatchYear(e.target.value)}
                />
              </div>
            </div>
          )}

          {(user.role === 'teacher' || user.role === 'hod' || user.role === 'admin') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  className="input-field"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Designation / Official Title</label>
                <input
                  type="text"
                  className="input-field"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                />
              </div>
            </div>
          )}

          {(user.role === 'teacher' || user.role === 'hod') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Specialization Area</label>
                <input
                  type="text"
                  className="input-field"
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Office Room / Cabin</label>
                <input
                  type="text"
                  className="input-field"
                  value={officeRoom}
                  onChange={e => setOfficeRoom(e.target.value)}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Telephone / Contact Phone</label>
              <input
                type="text"
                className="input-field"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department Code (Read Only)</label>
              <input
                type="text"
                className="input-field"
                value={user.dept_code || 'CSE'}
                disabled
                style={{ backgroundColor: '#f4f3ee', color: '#777', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Academic Biography & Statement</label>
            <textarea
              className="input-field"
              rows="4"
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '12px 28px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }} disabled={loading}>
            <Save size={18} /> {loading ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

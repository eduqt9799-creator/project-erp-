import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';

export default function ProfileSetupModal({ user, onProfileUpdated }) {
  const [phone, setPhone] = useState(user.profile?.phone || '');
  const [bio, setBio] = useState(user.profile?.bio || '');
  const [officeRoom, setOfficeRoom] = useState(user.profile?.office_room || '');
  const [rollNumber, setRollNumber] = useState(user.profile?.roll_number || '');
  const [employeeId, setEmployeeId] = useState(user.profile?.employee_id || '');
  const [batchYear, setBatchYear] = useState(user.profile?.batch_year || '2023 - 2027');
  const [designation, setDesignation] = useState(user.profile?.designation || '');
  const [specialization, setSpecialization] = useState(user.profile?.specialization || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
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
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      onProfileUpdated(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <UserCheck size={28} color="#0f4c81" />
          <div>
            <h2 className="modal-header" style={{ margin: 0, fontSize: '24px' }}>Complete Portal Profile</h2>
            <p style={{ fontSize: '13px', color: '#666666' }}>
              Setup your institutional profile details for {user.dept_name || 'CSE Department'}.
            </p>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          {user.role === 'student' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Student Roll Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. CSE-2023-088"
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Batch Duration</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. 2023 - 2027"
                  value={batchYear}
                  onChange={e => setBatchYear(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {(user.role === 'teacher' || user.role === 'hod' || user.role === 'admin') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. EMP-CSE-404"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Designation / Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Associate Professor / HOD"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                />
              </div>
            </div>
          )}

          {(user.role === 'teacher' || user.role === 'hod') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Specialization Area</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Artificial Intelligence & Algorithms"
                  value={specialization}
                  onChange={e => setSpecialization(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Office / Cabin Room</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Turing Hall 304"
                  value={officeRoom}
                  onChange={e => setOfficeRoom(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Contact Telephone</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="+1 (555) 019-2834"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Academic Biography</label>
            <textarea 
              className="input-field" 
              rows="3"
              placeholder="Brief description of your academic background and objectives..."
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Saving Profile...' : 'Save & Set Portal Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

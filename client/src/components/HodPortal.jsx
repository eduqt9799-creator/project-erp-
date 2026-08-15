import React, { useState } from 'react';
import { Users, BookOpen, Megaphone, ShieldCheck, Plus, CheckCircle } from 'lucide-react';

export default function HodPortal({ stats, user, activeTab }) {
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [publishing, setPublishing] = useState(false);

  if (!stats) return <div style={{ color: '#aaa', padding: '40px' }}>Loading CSE HOD Portal...</div>;

  const { department, teachersCount, studentsCount, coursesCount, teachers, students, courses, announcements } = stats;

  const handlePublishBroadcast = async (e) => {
    e.preventDefault();
    setPublishing(true);

    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('http://localhost:5000/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: noticeTitle,
          content: noticeContent,
          target_role: targetRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post announcement');

      alert('CSE Broadcast published successfully!');
      setShowNoticeModal(false);
      setNoticeTitle('');
      setNoticeContent('');
    } catch (err) {
      alert(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-hero">
        <div className="dept-pill">
          👔 HOD Executive Portal • {department?.code || 'CSE'} Department
        </div>
        <h1 className="welcome-title">Welcome back, Dr. Turing.</h1>
        <p className="welcome-subtitle">
          Head of Department Administration for {department?.name || 'Computer Science & Engineering'}. Manage department faculty, student enrollment, and academic policy.
        </p>
      </div>

      {/* Main Grid Views */}
      <div className="dashboard-grid">
        {/* Executive Department Metrics */}
        <div className="card-white" style={{ gridColumn: 'span 4' }}>
          <div className="card-white-subtitle">FACULTY MEMBERS</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#0d2847', marginTop: '6px' }}>
            {teachersCount || 2} Professors
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Active CSE Instructors & Researchers</p>
        </div>

        <div className="card-white" style={{ gridColumn: 'span 4' }}>
          <div className="card-white-subtitle">ENROLLED STUDENTS</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#0f4c81', marginTop: '6px' }}>
            {studentsCount || 2} Undergraduates
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Registered in CSE Batches</p>
        </div>

        <div className="card-white" style={{ gridColumn: 'span 4' }}>
          <div className="card-white-subtitle">DEPARTMENT COURSES</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#c5a059', marginTop: '6px' }}>
            {coursesCount || 2} Syllabi
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Fall 2026 Curriculum</p>
        </div>

        {/* CSE Faculty Management */}
        <div className="card-white" style={{ gridColumn: 'span 7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="card-white-title">CSE Department Faculty</h2>
            <span className="card-white-subtitle">STAFF ROSTER</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {teachers.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', border: '1px solid #eae8e3', borderRadius: '8px', backgroundColor: '#faf9f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src={t.avatar} alt={t.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 700, color: '#111' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: '#0f4c81', fontWeight: 600 }}>{t.designation || 'Associate Professor'}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Spec: {t.specialization || 'Algorithms'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', background: '#eef4fb', color: '#0f4c81', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {t.office_room || 'Room 204'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Broadcast & Announcements Publisher */}
        <div className="card-white" style={{ gridColumn: 'span 5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="card-white-title">HOD Broadcasts</h2>
            <button onClick={() => setShowNoticeModal(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              + New Broadcast
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {announcements.map((ann) => (
              <div key={ann.id} style={{ padding: '14px', border: '1px solid #eae8e3', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                <div style={{ fontSize: '11px', color: '#c5a059', fontWeight: 700, textTransform: 'uppercase' }}>
                  Target: {ann.target_role}
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 700, color: '#111', margin: '4px 0' }}>
                  {ann.title}
                </div>
                <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.4 }}>{ann.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      {showNoticeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Post HOD Department Broadcast</h2>
            <form onSubmit={handlePublishBroadcast}>
              <div className="form-group">
                <label className="form-label">Broadcast Target Audience</label>
                <select className="input-field" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                  <option value="all">Everyone in CSE (Teachers + Students)</option>
                  <option value="student">CSE Students Only</option>
                  <option value="teacher">CSE Faculty Only</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Announcement Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Midterm Examination & Research Symposium Notice"
                  value={noticeTitle}
                  onChange={e => setNoticeTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Broadcast Message Content</label>
                <textarea 
                  className="input-field" 
                  rows="5"
                  placeholder="Official HOD directive content..."
                  value={noticeContent}
                  onChange={e => setNoticeContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowNoticeModal(false)}
                  style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={publishing}>
                  {publishing ? 'Publishing...' : 'Publish Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

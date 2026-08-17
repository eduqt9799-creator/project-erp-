import React, { useState } from 'react';
import { Users, BookOpen, Megaphone, ShieldCheck, Plus, CheckCircle } from 'lucide-react';

export default function HodPortal({ stats, user, activeTab }) {
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [publishing, setPublishing] = useState(false);

  // Allocation state
  const [selectedCourseForAssign, setSelectedCourseForAssign] = useState('');
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState('');
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState('');
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState('');
  const [allocationMsg, setAllocationMsg] = useState('');

  if (!stats) return <div style={{ color: '#aaa', padding: '40px' }}>Loading CSE HOD Portal...</div>;

  const { department, teachersCount, studentsCount, coursesCount, teachers, students, courses, announcements, studentAttendanceReports } = stats;

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/courses/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: Number(selectedCourseForAssign || courses[0]?.id),
          teacher_id: Number(selectedTeacherForAssign || teachers[0]?.id)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAllocationMsg('✅ Teacher assigned to subject successfully!');
      setTimeout(() => setAllocationMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('alexandria_token');
    const courseId = Number(selectedCourseForEnroll || courses[0]?.id);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: Number(selectedStudentForEnroll || students[0]?.id)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAllocationMsg('✅ Student enrolled into course class successfully!');
      setTimeout(() => setAllocationMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePublishBroadcast = async (e) => {
    e.preventDefault();
    setPublishing(true);

    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/announcements', {
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

      {/* Tab: Attendance Reports & Low Attendance Alerts */}
      {activeTab === 'attendance' && (
        <div className="dashboard-grid">
          {/* Low Attendance Alert Banner */}
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ color: '#b91c1c', marginBottom: '8px' }}>
              ⚠️ Low Attendance Alerts (&lt; 75% Threshold)
            </h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Students in CSE requiring academic intervention due to attendance falling below institutional criteria.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {studentAttendanceReports?.filter(s => s.is_low).length === 0 ? (
                <div style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#15803d', fontWeight: 600, fontSize: '13px' }}>
                  ✓ Outstanding! No students are currently below the 75% attendance threshold.
                </div>
              ) : (
                studentAttendanceReports?.filter(s => s.is_low).map(st => (
                  <div key={st.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#991b1b' }}>{st.student_name}</div>
                      <div style={{ fontSize: '12px', color: '#7f1d1d' }}>Roll: {st.roll_number || 'CSE-2023-042'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>{st.percentage}%</span>
                      <div style={{ fontSize: '11px', color: '#991b1b' }}>{st.present_count} / {st.total_classes} sessions</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* All Department Students Attendance Report */}
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ marginBottom: '16px' }}>Department Class Attendance Roster Report</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd9cf', color: '#555' }}>
                  <th style={{ padding: '10px' }}>Student Name</th>
                  <th style={{ padding: '10px' }}>Roll Number</th>
                  <th style={{ padding: '10px' }}>Attended / Total Sessions</th>
                  <th style={{ padding: '10px' }}>Attendance Percentage</th>
                  <th style={{ padding: '10px' }}>Standing Status</th>
                </tr>
              </thead>
              <tbody>
                {studentAttendanceReports?.map(st => (
                  <tr key={st.student_id} style={{ borderBottom: '1px solid #eae8e3' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{st.student_name}</td>
                    <td style={{ padding: '10px', color: '#666' }}>{st.roll_number || 'CSE-2023-042'}</td>
                    <td style={{ padding: '10px' }}>{st.present_count} / {st.total_classes}</td>
                    <td style={{ padding: '10px', fontWeight: 700, color: st.percentage < 75 ? '#b91c1c' : '#15803d' }}>
                      {st.percentage}%
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: st.percentage < 75 ? '#fef2f2' : '#eefbe7',
                        color: st.percentage < 75 ? '#b91c1c' : '#15803d'
                      }}>
                        {st.percentage < 75 ? 'Low Attendance' : 'Good Standing'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Subject & Faculty Allocations */}
      {activeTab === 'allocation' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title">HOD Subject & Class Allocation Control</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              Assign faculty instructors to CSE subjects and enroll students into respective classes.
            </p>

            {allocationMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '20px' }}>{allocationMsg}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Form 1: Assign Teacher to Subject */}
              <div style={{ padding: '20px', border: '1px solid #e2dfd7', borderRadius: '10px', backgroundColor: '#faf9f6' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#0d2847' }}>1. Assign Teacher → Subject</h3>
                <form onSubmit={handleAssignTeacher}>
                  <div className="form-group">
                    <label className="form-label">Select Course / Subject</label>
                    <select className="input-field" value={selectedCourseForAssign} onChange={e => setSelectedCourseForAssign(e.target.value)}>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.code}: {c.name} (Current: {c.teacher_name || 'Unassigned'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select Faculty Instructor</label>
                    <select className="input-field" value={selectedTeacherForAssign} onChange={e => setSelectedTeacherForAssign(e.target.value)}>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.designation || 'Faculty'})</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                    Assign Faculty to Subject
                  </button>
                </form>
              </div>

              {/* Form 2: Enroll Student into Course / Class */}
              <div style={{ padding: '20px', border: '1px solid #e2dfd7', borderRadius: '10px', backgroundColor: '#faf9f6' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#0d2847' }}>2. Enroll Student → Course Class</h3>
                <form onSubmit={handleEnrollStudent}>
                  <div className="form-group">
                    <label className="form-label">Select Course / Subject</label>
                    <select className="input-field" value={selectedCourseForEnroll} onChange={e => setSelectedCourseForEnroll(e.target.value)}>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select Student</label>
                    <select className="input-field" value={selectedStudentForEnroll} onChange={e => setSelectedStudentForEnroll(e.target.value)}>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.roll_number || 'Roll N/A'})</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                    Enroll Student into Class
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

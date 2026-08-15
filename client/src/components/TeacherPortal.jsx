import React, { useState } from 'react';
import { BookOpen, Users, CheckSquare, PlusCircle, Send, Award, FileText } from 'lucide-react';

export default function TeacherPortal({ stats, user, activeTab }) {
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDue, setAssignmentDue] = useState('2026-11-20');
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [creating, setCreating] = useState(false);

  // Grade & Attendance state
  const [selectedStudentId, setSelectedStudentId] = useState(5);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [attMsg, setAttMsg] = useState('');

  // Full Roster Attendance State
  const [rosterAttendance, setRosterAttendance] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);

  if (!stats) return <div style={{ color: '#aaa', padding: '40px' }}>Loading CSE Professor Portal...</div>;

  const { department, myCourses, hod, deptStudents, assignments, announcements, recentAttendance } = stats;

  const handleToggleStatus = (studentId, status) => {
    setRosterAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    deptStudents.forEach(s => {
      updated[s.id] = status;
    });
    setRosterAttendance(updated);
  };

  const handleSaveBulkAttendance = async (e) => {
    e.preventDefault();
    setBulkSaving(true);
    const token = localStorage.getItem('alexandria_token');
    
    // Prepare records array
    const records = deptStudents.map(s => ({
      student_id: s.id,
      status: rosterAttendance[s.id] || 'present'
    }));

    try {
      const res = await fetch('http://localhost:5000/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: Number(selectedCourseId || myCourses[0]?.id || 1),
          date: attendanceDate,
          records
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save attendance');

      setAttMsg(`✅ Attendance saved successfully for ${records.length} students on ${attendanceDate}!`);
      setTimeout(() => setAttMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkSaving(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setCreating(true);

    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: Number(selectedCourseId),
          title: assignmentTitle,
          description: assignmentDesc,
          due_date: assignmentDue,
          max_marks: 100
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish assignment');

      alert('Assignment published successfully!');
      setShowAssignmentModal(false);
      setAssignmentTitle('');
      setAssignmentDesc('');
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('http://localhost:5000/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: myCourses[0]?.id || 1,
          student_id: Number(selectedStudentId),
          date: attendanceDate,
          status: attendanceStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAttMsg('Attendance recorded in database!');
      setTimeout(() => setAttMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Hero Welcome (EXACT MATCH with Screenshot: "Welcome back, Professor.") */}
      <div className="welcome-hero">
        <div className="dept-pill">
          👩‍🏫 {department?.code || 'CSE'} Faculty • Academic Control
        </div>
        <h1 className="welcome-title">Welcome back, Professor.</h1>
        <p className="welcome-subtitle">
          Here is a curated overview of your academic day in {department?.name || 'Computer Science & Engineering'}. The archives await your direction.
        </p>
      </div>

      {/* Main Grid Views */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="dashboard-grid">
          {/* Today's Schedule Card (Matches Screenshot) */}
          <div className="card-white" style={{ gridColumn: 'span 8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Today's Schedule</h2>
                <div className="card-white-subtitle">TUESDAY, OCTOBER 24</div>
              </div>
              <span className="blue-link">VIEW FULL WEEK</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', backgroundColor: '#f9f8f6', borderLeft: '4px solid #0f4c81', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#111' }}>
                  <span>CSE-301: Advanced Data Structures & Algorithms</span>
                  <span style={{ fontSize: '13px', color: '#555' }}>09:00 AM - 10:30 AM</span>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  Lecture Room 302 • 42 Enrolled CSE Students
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f9f8f6', borderLeft: '4px solid #c5a059', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#111' }}>
                  <span>Faculty Research & Office Hours</span>
                  <span style={{ fontSize: '13px', color: '#555' }}>02:00 PM - 04:00 PM</span>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  Turing Building Room 204 • Student Consultations
                </div>
              </div>
            </div>
          </div>

          {/* HOD Directives Card */}
          <div className="card-white" style={{ gridColumn: 'span 4' }}>
            <div className="card-white-subtitle" style={{ marginBottom: '8px' }}>HEAD OF DEPARTMENT</div>
            {hod ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0' }}>
                  <img src={hod.avatar} alt={hod.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', fontWeight: 700 }}>{hod.name}</h3>
                    <p style={{ fontSize: '12px', color: '#666' }}>{hod.office_room || 'HOD Office'}</p>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#444', background: '#f4f3ee', padding: '10px', borderRadius: '6px' }}>
                  <strong>HOD Directives:</strong> Submit midterm internal assessments by Friday 5:00 PM.
                </div>
              </div>
            ) : (
              <p style={{ color: '#777', fontSize: '13px' }}>CSE HOD Info unavailable</p>
            )}
          </div>

          {/* Connected CSE Students */}
          <div className="card-white" style={{ gridColumn: 'span 7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-white-title">CSE Department Students</h2>
              <span className="card-white-subtitle">{deptStudents.length} ENROLLED</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {deptStudents.map(st => (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #eae8e3', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={st.avatar} alt={st.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{st.name}</div>
                      <div style={{ fontSize: '12px', color: '#777' }}>Roll: {st.roll_number || 'CSE-2023-042'}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#0f4c81', fontWeight: 600 }}>CSE Batch {st.batch_year || '2023-27'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card-white" style={{ gridColumn: 'span 5' }}>
            <h2 className="card-white-title" style={{ marginBottom: '16px' }}>Professor Actions</h2>
            <button 
              onClick={() => setShowAssignmentModal(true)}
              className="btn-primary" 
              style={{ width: '100%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <PlusCircle size={18} /> Publish New CSE Assignment
            </button>

            {/* Attendance Logger Box */}
            <div style={{ padding: '16px', backgroundColor: '#fcfbf9', border: '1px solid #e5e3dc', borderRadius: '8px', marginTop: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Quick Attendance Logger</h3>
              {attMsg && <div style={{ color: '#15803d', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>{attMsg}</div>}
              <form onSubmit={handleMarkAttendance}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Select Student</label>
                  <select 
                    className="input-field" 
                    style={{ padding: '6px', fontSize: '12px' }}
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                  >
                    {deptStudents.map(st => (
                      <option key={st.id} value={st.id}>{st.name} ({st.roll_number})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ padding: '6px', fontSize: '12px' }}
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                  />
                  <select 
                    className="input-field" 
                    style={{ padding: '6px', fontSize: '12px' }}
                    value={attendanceStatus}
                    onChange={e => setAttendanceStatus(e.target.value)}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </div>
                <button type="submit" style={{ width: '100%', padding: '8px', backgroundColor: '#0d2847', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Record Attendance
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Class Attendance Control Logger</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>Mark and update daily attendance for your assigned CSE courses & students.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleMarkAll('present')} style={{ padding: '6px 12px', background: '#eefbe7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                  ✓ Mark All Present
                </button>
                <button onClick={() => handleMarkAll('absent')} style={{ padding: '6px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                  ✗ Mark All Absent
                </button>
              </div>
            </div>

            {attMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '16px' }}>{attMsg}</div>}

            <form onSubmit={handleSaveBulkAttendance}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">Select Assigned Course / Subject</label>
                  <select className="input-field" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                    {myCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Select Attendance Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Student Roster List */}
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Student Roster</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {deptStudents.map(student => {
                  const currentStatus = rosterAttendance[student.id] || 'present';
                  return (
                    <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #eae8e3', borderRadius: '8px', backgroundColor: '#faf9f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={student.avatar} alt={student.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>{student.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Roll Number: {student.roll_number || 'CSE-2023-042'}</div>
                        </div>
                      </div>

                      {/* Present / Absent / Late Toggles */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          onClick={() => handleToggleStatus(student.id, 'present')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid',
                            cursor: 'pointer',
                            backgroundColor: currentStatus === 'present' ? '#15803d' : '#ffffff',
                            color: currentStatus === 'present' ? '#ffffff' : '#333333',
                            borderColor: currentStatus === 'present' ? '#15803d' : '#ccc'
                          }}
                        >
                          Present
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleToggleStatus(student.id, 'absent')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid',
                            cursor: 'pointer',
                            backgroundColor: currentStatus === 'absent' ? '#b91c1c' : '#ffffff',
                            color: currentStatus === 'absent' ? '#ffffff' : '#333333',
                            borderColor: currentStatus === 'absent' ? '#b91c1c' : '#ccc'
                          }}
                        >
                          Absent
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleToggleStatus(student.id, 'late')}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid',
                            cursor: 'pointer',
                            backgroundColor: currentStatus === 'late' ? '#d97706' : '#ffffff',
                            color: currentStatus === 'late' ? '#ffffff' : '#333333',
                            borderColor: currentStatus === 'late' ? '#d97706' : '#ccc'
                          }}
                        >
                          Late
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '12px 24px', fontSize: '14px' }} disabled={bulkSaving}>
                {bulkSaving ? 'Saving Attendance...' : '💾 Save Attendance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Publishing Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Create CSE Assignment</h2>
            <form onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="input-field" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                  {myCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Red-Black Tree Implementation"
                  value={assignmentTitle}
                  onChange={e => setAssignmentTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description / Requirements</label>
                <textarea 
                  className="input-field" 
                  rows="4"
                  placeholder="Explain problem statement..."
                  value={assignmentDesc}
                  onChange={e => setAssignmentDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={assignmentDue}
                  onChange={e => setAssignmentDue(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAssignmentModal(false)}
                  style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

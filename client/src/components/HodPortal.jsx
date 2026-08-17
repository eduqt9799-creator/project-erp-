import React, { useState } from 'react';
import { Users, BookOpen, Megaphone, Plus, Trash2, Edit, CheckCircle } from 'lucide-react';
import SettingsTab from './SettingsTab';
import YearSelector from './YearSelector';

export default function HodPortal({ stats, user, activeTab }) {
  const [selectedYear, setSelectedYear] = useState(0); // 0 = All, 1 = 1st Year, 2 = 2nd Year

  // Broadcast state
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [publishing, setPublishing] = useState(false);

  // Faculty state
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [facName, setFacName] = useState('');
  const [facEmail, setFacEmail] = useState('');
  const [facPassword, setFacPassword] = useState('password123');
  const [facDesignation, setFacDesignation] = useState('Associate Professor');
  const [facSpecialization, setFacSpecialization] = useState('Computer Science');
  const [facOffice, setFacOffice] = useState('Room 204');
  const [facMsg, setFacMsg] = useState('');
  const [savingFaculty, setSavingFaculty] = useState(false);

  // Allocation state
  const [selectedCourseForAssign, setSelectedCourseForAssign] = useState('');
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState('');
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState('');
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState('');
  const [allocationMsg, setAllocationMsg] = useState('');

  // Curriculum state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState(3);
  const [newSemester, setNewSemester] = useState('Fall 2026');
  const [newYear, setNewYear] = useState(1);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseMsg, setCourseMsg] = useState('');

  if (!stats) return <div style={{ color: '#aaa', padding: '40px' }}>Loading CSE HOD Portal...</div>;

  const { department, teachersCount, studentsCount, coursesCount, teachers, students, courses, announcements, studentAttendanceReports } = stats;

  const firstYearStudents = students.filter(s => s.academic_year === 1);
  const secondYearStudents = students.filter(s => s.academic_year === 2);

  const displayedStudents = selectedYear === 0 
    ? students 
    : students.filter(s => s.academic_year === selectedYear);

  const displayedCourses = selectedYear === 0 
    ? courses 
    : courses.filter(c => c.academic_year === selectedYear);

  const displayedAttendanceReports = selectedYear === 0 
    ? studentAttendanceReports 
    : studentAttendanceReports?.filter(s => s.academic_year === selectedYear);

  // ==========================================
  // FACULTY HANDLERS (ADD, EDIT, DELETE)
  // ==========================================

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setSavingFaculty(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/hod/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: facName,
          email: facEmail,
          password: facPassword,
          designation: facDesignation,
          specialization: facSpecialization,
          office_room: facOffice
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add faculty member');

      setFacMsg(`✅ Faculty member "${facName}" added successfully!`);
      setShowAddFacultyModal(false);
      setFacName('');
      setFacEmail('');
      setTimeout(() => setFacMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingFaculty(false);
    }
  };

  const handleEditFaculty = async (e) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setSavingFaculty(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/hod/teachers/${editingFaculty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: facName,
          designation: facDesignation,
          specialization: facSpecialization,
          office_room: facOffice
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update faculty member');

      setFacMsg(`✅ Faculty details for "${facName}" updated successfully!`);
      setEditingFaculty(null);
      setTimeout(() => setFacMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingFaculty(false);
    }
  };

  const handleDeleteFaculty = async (facultyId, facultyName) => {
    if (!window.confirm(`Are you sure you want to remove Professor "${facultyName}" from the department faculty roster?`)) return;
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/hod/teachers/${facultyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFacMsg(`✅ Professor "${facultyName}" removed from department faculty.`);
      setTimeout(() => setFacMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================
  // BROADCAST HANDLERS (ADD, EDIT, DELETE)
  // ==========================================

  const handlePublishBroadcast = async (e) => {
    e.preventDefault();
    setPublishing(true);
    const token = localStorage.getItem('alexandria_token');

    try {
      const isEdit = !!editingNotice;
      const url = isEdit ? `/api/announcements/${editingNotice.id}` : '/api/announcements';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: noticeTitle,
          content: noticeContent,
          target_role: targetRole,
          academic_year: selectedYear
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save broadcast');

      alert(`CSE Broadcast ${isEdit ? 'updated' : 'published'} successfully!`);
      setShowNoticeModal(false);
      setEditingNotice(null);
      setNoticeTitle('');
      setNoticeContent('');
    } catch (err) {
      alert(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteBroadcast = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this HOD broadcast notice?')) return;
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Broadcast notice deleted successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================
  // ALLOCATION & CURRICULUM HANDLERS
  // ==========================================

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

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCreatingCourse(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCode,
          name: newName,
          credits: Number(newCredits),
          semester: newSemester,
          academic_year: Number(newYear)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create course');

      setCourseMsg('✅ New curriculum course added successfully!');
      setShowCourseModal(false);
      setNewCode('');
      setNewName('');
      setTimeout(() => setCourseMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to remove this course from the department curriculum?')) return;
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCourseMsg('✅ Course removed successfully!');
      setTimeout(() => setCourseMsg(''), 3000);
    } catch (err) {
      alert(err.message);
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

      {/* Academic Year Switcher Bar (1st Year / 2nd Year / All Years) */}
      {activeTab !== 'settings' && (
        <YearSelector
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          firstYearCount={firstYearStudents.length}
          secondYearCount={secondYearStudents.length}
        />
      )}

      {/* 1. MAIN DASHBOARD HOME TAB */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="dashboard-grid">
          {/* Executive Department Metrics — Split into 1st Year & 2nd Year */}
          <div className="card-white" style={{ gridColumn: 'span 4' }}>
            <div className="card-white-subtitle">FIRST YEAR UNDERGRADUATES</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#0f4c81', marginTop: '6px' }}>
              {firstYearStudents.length} Students
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>1st Year Batch (2025 - 2029)</p>
          </div>

          <div className="card-white" style={{ gridColumn: 'span 4' }}>
            <div className="card-white-subtitle">SECOND YEAR UNDERGRADUATES</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#c5a059', marginTop: '6px' }}>
              {secondYearStudents.length} Students
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>2nd Year Batch (2024 - 2028)</p>
          </div>

          <div className="card-white" style={{ gridColumn: 'span 4' }}>
            <div className="card-white-subtitle">FACULTY MEMBERS</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#0d2847', marginTop: '6px' }}>
              {teachers.length} Professors
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Active CSE Instructors & Researchers</p>
          </div>

          {/* CSE Faculty Management (ADD, EDIT, DELETE) */}
          <div className="card-white" style={{ gridColumn: 'span 7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 className="card-white-title">CSE Department Faculty</h2>
                <div className="card-white-subtitle">STAFF ROSTER MANAGEMENT</div>
              </div>
              <button 
                onClick={() => {
                  setFacName('');
                  setFacEmail('');
                  setFacDesignation('Associate Professor');
                  setFacSpecialization('Computer Science');
                  setFacOffice('Room 204');
                  setShowAddFacultyModal(true);
                }} 
                className="btn-primary" 
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Faculty
              </button>
            </div>

            {facMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>{facMsg}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {teachers.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', border: '1px solid #eae8e3', borderRadius: '8px', backgroundColor: '#faf9f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img src={t.avatar} alt={t.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 700, color: '#111' }}>{t.name}</div>
                      <div style={{ fontSize: '12px', color: '#0f4c81', fontWeight: 600 }}>{t.designation || 'Associate Professor'}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>Spec: {t.specialization || 'Algorithms'} • Room: {t.office_room || 'Room 204'}</div>
                    </div>
                  </div>

                  {/* Actions: EDIT & DELETE */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setEditingFaculty(t);
                        setFacName(t.name);
                        setFacDesignation(t.designation || 'Associate Professor');
                        setFacSpecialization(t.specialization || 'Computer Science');
                        setFacOffice(t.office_room || 'Room 204');
                      }}
                      style={{ padding: '6px 10px', fontSize: '12px', background: '#eef4fb', color: '#0f4c81', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFaculty(t.id, t.name)}
                      style={{ padding: '6px 10px', fontSize: '12px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Broadcast & Announcements Publisher (ADD, EDIT, DELETE) */}
          <div className="card-white" style={{ gridColumn: 'span 5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-white-title">HOD Broadcasts</h2>
              <button 
                onClick={() => {
                  setEditingNotice(null);
                  setNoticeTitle('');
                  setNoticeContent('');
                  setTargetRole('all');
                  setShowNoticeModal(true);
                }} 
                className="btn-primary" 
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> New Broadcast
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.map((ann) => (
                <div key={ann.id} style={{ padding: '14px', border: '1px solid #eae8e3', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#c5a059', fontWeight: 700, textTransform: 'uppercase' }}>
                      Target: {ann.target_role}
                    </div>

                    {/* Actions: EDIT & DELETE */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setEditingNotice(ann);
                          setNoticeTitle(ann.title);
                          setNoticeContent(ann.content);
                          setTargetRole(ann.target_role || 'all');
                          setShowNoticeModal(true);
                        }}
                        style={{ padding: '3px 8px', fontSize: '11px', background: '#eef4fb', color: '#0f4c81', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBroadcast(ann.id)}
                        style={{ padding: '3px 8px', fontSize: '11px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 700, color: '#111', margin: '6px 0' }}>
                    {ann.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.4 }}>{ann.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. DEDICATED TAB: CLASS ATTENDANCE & ALERTS */}
      {activeTab === 'attendance' && (
        <div className="dashboard-grid">
          {/* Low Attendance Alert Banner */}
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ color: '#b91c1c', marginBottom: '8px' }}>
              ⚠️ Low Attendance Alerts (&lt; 75% Threshold) — {selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`}
            </h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Students in CSE requiring academic intervention due to attendance falling below institutional criteria.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedAttendanceReports?.filter(s => s.is_low).length === 0 ? (
                <div style={{ padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#15803d', fontWeight: 600, fontSize: '13px' }}>
                  ✓ Outstanding! No students in this batch selection are currently below the 75% attendance threshold.
                </div>
              ) : (
                displayedAttendanceReports?.filter(s => s.is_low).map(st => (
                  <div key={st.student_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#991b1b' }}>{st.student_name}</div>
                      <div style={{ fontSize: '12px', color: '#7f1d1d' }}>Roll: {st.roll_number} • Year: {st.academic_year === 1 ? '1st Year' : '2nd Year'}</div>
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
            <h2 className="card-white-title" style={{ marginBottom: '16px' }}>
              Department Class Attendance Roster Report ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd9cf', color: '#555' }}>
                  <th style={{ padding: '10px' }}>Student Name</th>
                  <th style={{ padding: '10px' }}>Academic Year</th>
                  <th style={{ padding: '10px' }}>Roll Number</th>
                  <th style={{ padding: '10px' }}>Attended / Total Sessions</th>
                  <th style={{ padding: '10px' }}>Attendance Percentage</th>
                  <th style={{ padding: '10px' }}>Standing Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedAttendanceReports?.map(st => (
                  <tr key={st.student_id} style={{ borderBottom: '1px solid #eae8e3' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{st.student_name}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ fontSize: '11px', background: st.academic_year === 1 ? '#eef4fb' : '#fef3c7', color: st.academic_year === 1 ? '#0f4c81' : '#b45309', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        {st.academic_year === 1 ? '1st Year' : '2nd Year'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: '#666' }}>{st.roll_number}</td>
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

      {/* 3. DEDICATED TAB: SUBJECT & FACULTY ALLOCATIONS */}
      {activeTab === 'allocation' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title">HOD Subject & Class Allocation Control</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              Assign faculty instructors to CSE subjects and enroll students into 1st Year / 2nd Year classes.
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
                      {displayedCourses.map(c => (
                        <option key={c.id} value={c.id}>
                          [{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}: {c.name} (Current: {c.teacher_name || 'Unassigned'})
                        </option>
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

              {/* Form 2: Enroll Student into Course Class */}
              <div style={{ padding: '20px', border: '1px solid #e2dfd7', borderRadius: '10px', backgroundColor: '#faf9f6' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#0d2847' }}>2. Enroll Student → Course Class</h3>
                <form onSubmit={handleEnrollStudent}>
                  <div className="form-group">
                    <label className="form-label">Select Course / Subject</label>
                    <select className="input-field" value={selectedCourseForEnroll} onChange={e => setSelectedCourseForEnroll(e.target.value)}>
                      {displayedCourses.map(c => (
                        <option key={c.id} value={c.id}>[{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}: {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select Student</label>
                    <select className="input-field" value={selectedStudentForEnroll} onChange={e => setSelectedStudentForEnroll(e.target.value)}>
                      {displayedStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          [{s.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {s.name} ({s.roll_number || 'Roll N/A'})
                        </option>
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

      {/* 4. DEDICATED TAB: CURRICULUM & SYLLABI */}
      {activeTab === 'curriculum' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">CSE Academic Curriculum & Syllabi ({selectedYear === 0 ? 'All Academic Years' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>Manage 1st Year & 2nd Year courses, credit weights, and semester offerings for CSE.</p>
              </div>
              <button onClick={() => setShowCourseModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                + Add New Course
              </button>
            </div>

            {courseMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '20px' }}>{courseMsg}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {displayedCourses.map(course => (
                <div key={course.id} style={{ border: '1px solid #e2dfd7', borderRadius: '10px', padding: '20px', backgroundColor: '#faf9f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, background: course.academic_year === 1 ? '#0f4c81' : '#c5a059', color: '#ffffff', padding: '4px 10px', borderRadius: '6px' }}>
                      {course.academic_year === 1 ? '1st Year' : '2nd Year'} • {course.code}
                    </span>
                    <button onClick={() => handleDeleteCourse(course.id)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700 }}>{course.name}</h3>
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#555', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Credits: <strong>{course.credits}</strong></span>
                    <span>Semester: <strong>{course.semester}</strong></span>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#0f4c81', fontWeight: 600 }}>
                    Faculty Instructor: {course.teacher_name || 'Unassigned'}
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

      {/* ADD FACULTY MODAL */}
      {showAddFacultyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Add New Faculty Professor</h2>
            <form onSubmit={handleAddFaculty}>
              <div className="form-group">
                <label className="form-label">Full Name & Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Prof. Donald Knuth"
                  value={facName}
                  onChange={e => setFacName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Institutional Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="e.g. knuth@alexandria.edu"
                  value={facEmail}
                  onChange={e => setFacEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Associate Professor"
                    value={facDesignation}
                    onChange={e => setFacDesignation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Office Room</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Turing Hall 304"
                    value={facOffice}
                    onChange={e => setFacOffice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Specialization Area</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Algorithm Analysis & Concrete Mathematics"
                  value={facSpecialization}
                  onChange={e => setFacSpecialization(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <input
                  type="text"
                  className="input-field"
                  value={facPassword}
                  onChange={e => setFacPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(false)}
                  style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={savingFaculty}>
                  {savingFaculty ? 'Adding Faculty...' : 'Add Faculty Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FACULTY MODAL */}
      {editingFaculty && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Edit Faculty Member Details</h2>
            <form onSubmit={handleEditFaculty}>
              <div className="form-group">
                <label className="form-label">Full Name & Title</label>
                <input
                  type="text"
                  className="input-field"
                  value={facName}
                  onChange={e => setFacName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    className="input-field"
                    value={facDesignation}
                    onChange={e => setFacDesignation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Office Room</label>
                  <input
                    type="text"
                    className="input-field"
                    value={facOffice}
                    onChange={e => setFacOffice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Specialization Area</label>
                <input
                  type="text"
                  className="input-field"
                  value={facSpecialization}
                  onChange={e => setFacSpecialization(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={savingFaculty}>
                  {savingFaculty ? 'Saving...' : 'Save Faculty Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST MODAL (CREATE OR EDIT) */}
      {showNoticeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">{editingNotice ? 'Edit HOD Department Broadcast' : 'Post HOD Department Broadcast'}</h2>
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
                  onClick={() => { setShowNoticeModal(false); setEditingNotice(null); }}
                  style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={publishing}>
                  {publishing ? 'Saving...' : (editingNotice ? 'Save Broadcast' : 'Publish Broadcast')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Add New Curriculum Course</h2>
            <form onSubmit={handleCreateCourse}>
              <div className="form-group">
                <label className="form-label">Target Academic Year</label>
                <select className="input-field" value={newYear} onChange={e => setNewYear(e.target.value)}>
                  <option value={1}>🥇 1st Year Course</option>
                  <option value={2}>🥈 2nd Year Course</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Course Code</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. CSE-103 / CSE-203"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Neural Networks & Deep Learning"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Credits</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newCredits}
                    onChange={e => setNewCredits(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newSemester}
                    onChange={e => setNewSemester(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creatingCourse}>
                  {creatingCourse ? 'Adding...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

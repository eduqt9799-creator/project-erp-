import React, { useState, useEffect } from 'react';
import { BookOpen, Users, CheckSquare, PlusCircle, Send, Award, FileText, Upload, Download, Megaphone, Trash2, Plus, FilePlus, FolderDown, Sparkles } from 'lucide-react';
import SettingsTab from './SettingsTab';
import YearSelector from './YearSelector';

export default function TeacherPortal({ stats, user, activeTab, onProfileUpdated, onRefresh }) {
  const [selectedYear, setSelectedYear] = useState(0); // 0 = All, 1 = 1st Year, 2 = 2nd Year

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

  // Attendance CSV / Past 2-Month Import state
  const [attMode, setAttMode] = useState('daily'); // 'daily' or 'import'
  const [csvRawInput, setCsvRawInput] = useState('');
  const [importCourseId, setImportCourseId] = useState(1);
  const [parsedImportRecords, setParsedImportRecords] = useState([]);
  const [importingCsv, setImportingCsv] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  // Notice publishing state
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeTargetRole, setNoticeTargetRole] = useState('all');
  const [publishingNotice, setPublishingNotice] = useState(false);

  // Course Material state
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matCourseId, setMatCourseId] = useState(1);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matUrl, setMatUrl] = useState('');
  const [matType, setMatType] = useState('pdf');
  const [uploadingMat, setUploadingMat] = useState(false);

  // Grading tab state
  const [submissions, setSubmissions] = useState([]);
  const [gradesList, setGradesList] = useState([]);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradingMsg, setGradingMsg] = useState('');

  // Search state for students
  const [studentSearch, setStudentSearch] = useState('');

  // Must be declared BEFORE any early return to comply with React rules of hooks
  const fetchSubmissionsAndGrades = async () => {
    const token = localStorage.getItem('alexandria_token');
    try {
      const [subsRes, gradesRes] = await Promise.all([
        fetch('/api/submissions', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/grades', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubmissions(subsData);
      }
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setGradesList(gradesData);
      }
    } catch (err) {
      console.error('Failed to fetch grading data:', err);
    }
  };

  // useEffect MUST be before the early return (Rules of Hooks)
  useEffect(() => {
    if (activeTab === 'grading' && stats) {
      fetchSubmissionsAndGrades();
    }
  }, [activeTab, stats]);

  if (!stats) return <div style={{ color: '#aaa', padding: '40px' }}>Loading CSE Professor Portal...</div>;

  const { department, myCourses, hod, deptStudents, assignments, announcements, recentAttendance, materials = [] } = stats;

  const firstYearStudents = deptStudents.filter(s => s.academic_year === 1);
  const secondYearStudents = deptStudents.filter(s => s.academic_year === 2);

  const displayedStudents = selectedYear === 0 
    ? deptStudents 
    : deptStudents.filter(s => s.academic_year === selectedYear);

  const displayedCourses = selectedYear === 0 
    ? myCourses 
    : myCourses.filter(c => c.academic_year === selectedYear);

  const displayedMaterials = selectedYear === 0
    ? materials
    : materials.filter(m => {
        const c = myCourses.find(course => course.id === m.course_id);
        return c ? c.academic_year === selectedYear : true;
      });

  const handleParseCsv = (rawText) => {
    if (!rawText || !rawText.trim()) {
      setParsedImportRecords([]);
      return;
    }
    const lines = rawText.split(/\r?\n/);
    const parsed = [];
    lines.forEach((line) => {
      if (!line.trim()) return;
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 3) {
        if (parts[0].toLowerCase().includes('roll') || parts[0].toLowerCase().includes('student')) return;
        const roll_number = parts[0];
        const date = parts[1];
        const status = parts[2].toLowerCase();
        if (roll_number && date && ['present', 'absent', 'late'].includes(status)) {
          parsed.push({ roll_number, date, status });
        }
      }
    });
    setParsedImportRecords(parsed);
  };

  const handleGenerateSampleCsv = () => {
    const today = new Date();
    const dates = [];
    for (let i = 60; i >= 1; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }
    let csv = 'Roll_Number,Date,Status\n';
    displayedStudents.forEach(st => {
      const roll = st.roll_number || st.email;
      dates.slice(0, 10).forEach(dt => {
        csv += `${roll},${dt},present\n`;
      });
    });
    setCsvRawInput(csv);
    handleParseCsv(csv);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvRawInput(text);
      handleParseCsv(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async (e) => {
    e.preventDefault();
    if (parsedImportRecords.length === 0) {
      alert('Please enter or upload valid CSV attendance records before importing.');
      return;
    }
    setImportingCsv(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/attendance/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: Number(importCourseId || selectedCourseId || displayedCourses[0]?.id || 1),
          records: parsedImportRecords
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setImportMsg(`🎉 ${data.message}`);
      setCsvRawInput('');
      setParsedImportRecords([]);
      if (onRefresh) onRefresh();
      setTimeout(() => setImportMsg(''), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setImportingCsv(false);
    }
  };

  const handlePublishNotice = async (e) => {
    e.preventDefault();
    setPublishingNotice(true);
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
          target_role: noticeTargetRole,
          department_id: department?.id || 1,
          academic_year: selectedYear
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post notice');

      alert('Notice broadcasted successfully!');
      setShowNoticeModal(false);
      setNoticeTitle('');
      setNoticeContent('');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setPublishingNotice(false);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    setUploadingMat(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: Number(matCourseId || displayedCourses[0]?.id || 1),
          title: matTitle,
          description: matDesc,
          file_url: matUrl,
          file_type: matType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload material');

      alert('Course material uploaded successfully!');
      setShowMaterialModal(false);
      setMatTitle('');
      setMatDesc('');
      setMatUrl('');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingMat(false);
    }
  };

  const handleDeleteMaterial = async (matId) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return;
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/materials/${matId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Course material deleted successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = (studentId, status) => {
    setRosterAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    displayedStudents.forEach(s => {
      updated[s.id] = status;
    });
    setRosterAttendance(updated);
  };

  const handleSaveBulkAttendance = async (e) => {
    e.preventDefault();
    setBulkSaving(true);
    const token = localStorage.getItem('alexandria_token');
    
    const records = displayedStudents.map(s => ({
      student_id: s.id,
      status: rosterAttendance[s.id] || 'present'
    }));

    try {
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: Number(selectedCourseId || displayedCourses[0]?.id || 1),
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
      const res = await fetch('/api/assignments', {
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
      const res = await fetch('/api/attendance', {
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

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!gradingSubmissionId) return;

    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/submissions/${gradingSubmissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          marks_obtained: Number(gradeMarks),
          feedback: gradeFeedback
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGradingMsg('✅ Submission graded successfully!');
      setGradingSubmissionId(null);
      setGradeMarks('');
      setGradeFeedback('');
      fetchSubmissionsAndGrades();
      setTimeout(() => setGradingMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredStudents = displayedStudents.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.roll_number && s.roll_number.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <div>
      {/* Hero Welcome */}
      <div className="welcome-hero">
        <div className="dept-pill">
          👩‍🏫 {department?.code || 'CSE'} Faculty • Academic Control
        </div>
        <h1 className="welcome-title">Welcome back, Professor.</h1>
        <p className="welcome-subtitle">
          Here is a curated overview of your academic day in {department?.name || 'Computer Science & Engineering'}. The archives await your direction.
        </p>
      </div>



      {/* 1. DASHBOARD HOME TAB */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="dashboard-grid">
          {/* Today's Schedule Card */}
          <div className="card-white" style={{ gridColumn: 'span 8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Today's Schedule ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <div className="card-white-subtitle">TUESDAY, OCTOBER 24</div>
              </div>
              <span className="blue-link">VIEW FULL WEEK</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', backgroundColor: '#f9f8f6', borderLeft: '4px solid #0f4c81', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#111' }}>
                  <span>CSE-101: Programming Fundamentals & Problem Solving (1st Year)</span>
                  <span style={{ fontSize: '13px', color: '#555' }}>09:00 AM - 10:30 AM</span>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  Lecture Room 102 • 1st Year Batch
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f9f8f6', borderLeft: '4px solid #c5a059', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#111' }}>
                  <span>CSE-201: Advanced Data Structures (2nd Year)</span>
                  <span style={{ fontSize: '13px', color: '#555' }}>01:30 PM - 03:30 PM</span>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  Systems Lab 404 • 2nd Year Batch
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
                  <strong>HOD Directives:</strong> Submit 1st Year & 2nd Year internal midterm marks by Friday.
                </div>
              </div>
            ) : (
              <p style={{ color: '#777', fontSize: '13px' }}>CSE HOD Info unavailable</p>
            )}
          </div>

          {/* Connected CSE Students (Filtered by selectedYear) */}
          <div className="card-white" style={{ gridColumn: 'span 7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-white-title">CSE Department Students ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
              <span className="card-white-subtitle">{displayedStudents.length} ENROLLED</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedStudents.map(st => (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid #eae8e3', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={st.avatar} alt={st.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{st.name}</div>
                      <div style={{ fontSize: '12px', color: '#777' }}>Roll: {st.roll_number}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', background: st.academic_year === 1 ? '#eef4fb' : '#fef3c7', color: st.academic_year === 1 ? '#0f4c81' : '#b45309', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    {st.academic_year === 1 ? '1st Year' : '2nd Year'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card-white" style={{ gridColumn: 'span 5' }}>
            <h2 className="card-white-title" style={{ marginBottom: '16px' }}>Professor Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <button 
                onClick={() => setShowAssignmentModal(true)}
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <PlusCircle size={18} /> Publish New Assignment
              </button>

              <button 
                onClick={() => setShowMaterialModal(true)}
                style={{ width: '100%', padding: '10px 16px', background: '#eef4fb', color: '#0f4c81', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <FilePlus size={18} /> Upload Study Material / PDF
              </button>

              <button 
                onClick={() => setShowNoticeModal(true)}
                style={{ width: '100%', padding: '10px 16px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Megaphone size={18} /> Broadcast Class Notice
              </button>
            </div>

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
                    {displayedStudents.map(st => (
                      <option key={st.id} value={st.id}>[{st.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {st.name} ({st.roll_number})</option>
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

      {/* 2. DEDICATED TAB: TAKE & IMPORT ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div>
          <YearSelector
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
            firstYearCount={firstYearStudents.length}
            secondYearCount={secondYearStudents.length}
            title="Attendance Batch Filter"
          />
          <div className="dashboard-grid">
            <div className="card-white" style={{ gridColumn: 'span 12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 className="card-white-title">Class Attendance Logger & Past Data Importer</h2>
                  <p style={{ fontSize: '13px', color: '#666' }}>
                    Mark daily class attendance or import past 2-month manual attendance via CSV format.
                  </p>
                </div>

                {/* Mode Selector Toggle */}
                <div style={{ display: 'flex', gap: '6px', background: '#f4f3ee', padding: '4px', borderRadius: '8px', border: '1px solid #ddd9cf' }}>
                  <button
                    type="button"
                    onClick={() => setAttMode('daily')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: attMode === 'daily' ? '#0d2847' : 'transparent',
                      color: attMode === 'daily' ? '#ffffff' : '#555555'
                    }}
                  >
                    📅 Daily Live Logger
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttMode('import')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: attMode === 'import' ? '#0f4c81' : 'transparent',
                      color: attMode === 'import' ? '#ffffff' : '#555555'
                    }}
                  >
                    📥 Import Past 2 Months CSV
                  </button>
                </div>
              </div>

              {importMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '16px' }}>{importMsg}</div>}
              {attMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '16px' }}>{attMsg}</div>}

              {attMode === 'import' ? (
                /* CSV / PAST 2 MONTHS IMPORT TOOL */
                <div style={{ border: '1px solid #e2dfd7', borderRadius: '10px', padding: '24px', backgroundColor: '#faf9f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0d2847' }}>Import Past Attendance Records (Past 2 Months)</h3>
                      <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        Paste attendance CSV rows or upload a file. Format: <code>Roll_Number, YYYY-MM-DD, Status (present/absent/late)</code>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateSampleCsv}
                      style={{ padding: '8px 14px', background: '#eef4fb', color: '#0f4c81', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Sparkles size={14} /> Generate Pre-filled Student Roster Template
                    </button>
                  </div>

                  <form onSubmit={handleExecuteImport}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label className="form-label">Select Target Subject / Course</label>
                        <select className="input-field" value={importCourseId} onChange={e => setImportCourseId(e.target.value)}>
                          {displayedCourses.map(c => (
                            <option key={c.id} value={c.id}>[{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}: {c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Upload Attendance CSV File (.csv / .txt)</label>
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileUpload}
                          className="input-field"
                          style={{ padding: '6px' }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Or Paste CSV Raw Content (Roll_Number, Date, Status)</label>
                      <textarea
                        className="input-field"
                        rows="7"
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                        placeholder="CSE-1Y-2025-001, 2026-07-01, present&#10;CSE-1Y-2025-001, 2026-07-02, present&#10;CSE-1Y-2025-002, 2026-07-01, absent"
                        value={csvRawInput}
                        onChange={e => {
                          setCsvRawInput(e.target.value);
                          handleParseCsv(e.target.value);
                        }}
                      />
                    </div>

                    {/* Preview Table */}
                    {parsedImportRecords.length > 0 && (
                      <div style={{ marginBottom: '20px', padding: '16px', background: '#ffffff', border: '1px solid #ddd9cf', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                            ✓ Parsed {parsedImportRecords.length} Attendance Entries Ready for Database Sync
                          </span>
                        </div>
                        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                          <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #ccc', color: '#555' }}>
                                <th style={{ padding: '6px' }}>Roll Number</th>
                                <th style={{ padding: '6px' }}>Session Date</th>
                                <th style={{ padding: '6px' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedImportRecords.slice(0, 10).map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: '6px', fontWeight: 600 }}>{r.roll_number}</td>
                                  <td style={{ padding: '6px' }}>{r.date}</td>
                                  <td style={{ padding: '6px', textTransform: 'capitalize', fontWeight: 700, color: r.status === 'present' ? '#15803d' : '#b91c1c' }}>{r.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {parsedImportRecords.length > 10 && (
                            <div style={{ fontSize: '11px', color: '#777', marginTop: '6px' }}>
                              ... and {parsedImportRecords.length - 10} more rows
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={importingCsv || parsedImportRecords.length === 0} style={{ padding: '12px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Upload size={16} /> {importingCsv ? 'Importing Attendance...' : `📥 Execute Import (${parsedImportRecords.length} Records)`}
                    </button>
                  </form>
                </div>
              ) : (
                /* DAILY ROSTER LOGGER FORM */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                      Daily Student Roster ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleMarkAll('present')} style={{ padding: '6px 12px', background: '#eefbe7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                        ✓ Mark All Present
                      </button>
                      <button onClick={() => handleMarkAll('absent')} style={{ padding: '6px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                        ✗ Mark All Absent
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSaveBulkAttendance}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label className="form-label">Select Assigned Course / Subject</label>
                        <select className="input-field" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                          {displayedCourses.map(c => (
                            <option key={c.id} value={c.id}>[{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}: {c.name}</option>
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                      {displayedStudents.map(student => {
                        const currentStatus = rosterAttendance[student.id] || 'present';
                        return (
                          <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #eae8e3', borderRadius: '8px', backgroundColor: '#faf9f6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img src={student.avatar} alt={student.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>{student.name}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>Roll: {student.roll_number} • Year: {student.academic_year === 1 ? '1st Year' : '2nd Year'}</div>
                              </div>
                            </div>

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
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. DEDICATED TAB: CSE STUDENTS DIRECTORY */}
      {activeTab === 'students' && (
        <div>
          <YearSelector
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
            firstYearCount={firstYearStudents.length}
            secondYearCount={secondYearStudents.length}
            title="Students Year Filter"
          />
          <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">CSE Department Students Directory ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>Comprehensive list of 1st Year & 2nd Year students in CSE.</p>
              </div>
              <input
                type="text"
                className="input-field"
                style={{ width: '260px', fontSize: '13px' }}
                placeholder="🔍 Search student name or roll..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {filteredStudents.map(s => (
                <div key={s.id} style={{ border: '1px solid #e2dfd7', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#faf9f6' }}>
                  <img src={s.avatar} alt={s.name} style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', fontWeight: 700 }}>{s.name}</h3>
                    <div style={{ fontSize: '12px', color: '#0f4c81', fontWeight: 600 }}>Roll: {s.roll_number}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>✉️ {s.email}</div>
                  </div>
                  <span style={{ fontSize: '11px', background: s.academic_year === 1 ? '#eef4fb' : '#fef3c7', color: s.academic_year === 1 ? '#0f4c81' : '#b45309', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    {s.academic_year === 1 ? '1st Year' : '2nd Year'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* 4. DEDICATED TAB: ACADEMIC CONTROL (COURSES) */}
      {activeTab === 'courses' && (
        <div>
          <YearSelector
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
            firstYearCount={firstYearStudents.length}
            secondYearCount={secondYearStudents.length}
            title="Courses Year Filter"
          />
          <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Academic Control — Assigned Courses ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>1st Year and 2nd Year syllabi and course modules instructed by you or assigned to CSE.</p>
              </div>
              <button onClick={() => setShowAssignmentModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                + Publish Assignment
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {displayedCourses.map(course => (
                <div key={course.id} style={{ border: '1px solid #e2dfd7', borderRadius: '10px', padding: '20px', backgroundColor: '#faf9f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, background: course.academic_year === 1 ? '#0f4c81' : '#c5a059', color: '#fff', padding: '4px 10px', borderRadius: '6px' }}>
                      {course.academic_year === 1 ? '1st Year' : '2nd Year'} • {course.code}
                    </span>
                    <span style={{ fontSize: '12px', color: '#777' }}>{course.credits} Credits • {course.semester}</span>
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700 }}>{course.name}</h3>
                  <div style={{ marginTop: '14px', fontSize: '13px', color: '#555' }}>
                    Assignments Published: <strong>{assignments.filter(a => a.course_id === course.id).length}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* 5. DEDICATED TAB: GRADEBOOK & MARKS */}
      {activeTab === 'grading' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title">Gradebook & Student Submissions Control</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              Review assignment solutions submitted by CSE students and award official internal assessment marks.
            </p>

            {gradingMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '20px' }}>{gradingMsg}</div>}

            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Student Submissions awaiting evaluation</h3>
            {submissions.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#777' }}>No student submissions recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                {submissions.map(sub => (
                  <div key={sub.id} style={{ border: '1px solid #e2dfd7', borderRadius: '8px', padding: '16px', backgroundColor: '#faf9f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0d2847' }}>{sub.student_name} ({sub.roll_number || 'Roll N/A'})</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          Assignment: <strong>{sub.assignment_title}</strong> ({sub.course_code}) • Submitted: {sub.submitted_at}
                        </div>
                      </div>
                      {sub.marks_obtained !== null ? (
                        <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                          Evaluated: {sub.marks_obtained} / {sub.max_marks}
                        </span>
                      ) : (
                        <button onClick={() => { setGradingSubmissionId(sub.id); setGradeMarks(sub.max_marks); }} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          Award Grade & Marks
                        </button>
                      )}
                    </div>
                    {sub.submission_text && (
                      <div style={{ marginTop: '10px', padding: '10px', background: '#ffffff', border: '1px solid #eae8e3', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}>
                        {sub.submission_text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. DEDICATED TAB: COURSE MATERIALS & RESOURCES */}
      {activeTab === 'materials' && (
        <div>
          <YearSelector
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
            firstYearCount={firstYearStudents.length}
            secondYearCount={secondYearStudents.length}
            title="Materials Batch Filter"
          />
          <div className="dashboard-grid">
            <div className="card-white" style={{ gridColumn: 'span 12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 className="card-white-title">Course Materials & Academic Resources ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                  <p style={{ fontSize: '13px', color: '#666' }}>Upload and share lecture notes, lab manuals, syllabus PDFs, and study reference links for CSE students.</p>
                </div>
                <button
                  onClick={() => setShowMaterialModal(true)}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Upload Study Material
                </button>
              </div>

              {displayedMaterials.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#777', background: '#faf9f6', borderRadius: '8px', border: '1px solid #eae8e3' }}>
                  No study materials uploaded for this selection yet. Click "+ Upload Study Material" above to publish notes or PDFs!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                  {displayedMaterials.map(mat => (
                    <div key={mat.id} style={{ border: '1px solid #e2dfd7', borderRadius: '10px', padding: '20px', backgroundColor: '#faf9f6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, background: '#0f4c81', color: '#ffffff', padding: '4px 10px', borderRadius: '6px' }}>
                            {mat.course_code}
                          </span>
                          <button
                            onClick={() => handleDeleteMaterial(mat.id)}
                            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, color: '#111' }}>{mat.title}</h3>
                        <p style={{ fontSize: '13px', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>{mat.description}</p>
                      </div>

                      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #eae8e3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#777' }}>
                          Uploaded by <strong>{mat.uploader_name || 'Faculty'}</strong> • {mat.created_at?.split(' ')[0] || 'Recent'}
                        </div>
                        <a
                          href={mat.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '6px 12px', background: '#0d2847', color: '#ffffff', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FolderDown size={14} /> Open Material
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. DEDICATED TAB: PROFILE SETTINGS */}
      {activeTab === 'settings' && (
        <SettingsTab user={user} onProfileUpdated={onProfileUpdated} />
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
                  {displayedCourses.map(c => (
                    <option key={c.id} value={c.id}>[{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}: {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. C Fundamentals Pointer Lab"
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

      {/* Notice Broadcast Modal */}
      {showNoticeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Broadcast Class Notice</h2>
            <form onSubmit={handlePublishNotice}>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <select className="input-field" value={noticeTargetRole} onChange={e => setNoticeTargetRole(e.target.value)}>
                  <option value="all">Everyone in CSE (Students + Faculty)</option>
                  <option value="student">CSE Students Only</option>
                  <option value="teacher">CSE Faculty Only</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notice Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Lab Schedule Update & Lecture Notes"
                  value={noticeTitle}
                  onChange={e => setNoticeTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notice Content</label>
                <textarea
                  className="input-field"
                  rows="4"
                  placeholder="Type official notice details..."
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
                <button type="submit" className="btn-primary" disabled={publishingNotice}>
                  {publishingNotice ? 'Publishing...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Course Material Modal */}
      {showMaterialModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Upload Course Study Material</h2>
            <form onSubmit={handleUploadMaterial}>
              <div className="form-group">
                <label className="form-label">Course / Subject</label>
                <select className="input-field" value={matCourseId} onChange={e => setMatCourseId(e.target.value)}>
                  {displayedCourses.map(c => (
                    <option key={c.id} value={c.id}>[{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}: {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Material Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Module 1: C Pointers & Memory Architecture"
                  value={matTitle}
                  onChange={e => setMatTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">File / Document / Resource URL</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://example.com/lecture_notes.pdf"
                  value={matUrl}
                  onChange={e => setMatUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resource Type</label>
                <select className="input-field" value={matType} onChange={e => setMatType(e.target.value)}>
                  <option value="pdf">📄 PDF Document / Lecture Notes</option>
                  <option value="doc">📝 Word / Text Document</option>
                  <option value="slides">📊 Presentation Slides</option>
                  <option value="link">🔗 External Reference Link / Repository</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Summary</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Briefly describe what students will learn from this material..."
                  value={matDesc}
                  onChange={e => setMatDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploadingMat}>
                  {uploadingMat ? 'Uploading...' : 'Publish Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {gradingSubmissionId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Evaluate & Grade Submission</h2>
            <form onSubmit={handleGradeSubmission}>
              <div className="form-group">
                <label className="form-label">Marks Obtained</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 95"
                  value={gradeMarks}
                  onChange={e => setGradeMarks(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Feedback / Comments</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Provide constructive academic feedback..."
                  value={gradeFeedback}
                  onChange={e => setGradeFeedback(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setGradingSubmissionId(null)}
                  style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

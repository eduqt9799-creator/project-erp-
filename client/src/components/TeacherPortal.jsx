import React, { useState, useEffect } from 'react';
import { BookOpen, Users, CheckSquare, PlusCircle, Send, Award, FileText, Upload, Trash2, Bell, MessageSquare, MessageCircle, ClipboardList, Star, GraduationCap, Settings, Search, ChevronRight } from 'lucide-react';
import SettingsTab from './SettingsTab';
import YearSelector from './YearSelector';

export default function TeacherPortal({ stats, user, activeTab }) {
  const [selectedYear, setSelectedYear] = useState(0);

  // ===== Study Materials State =====
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDesc, setMaterialDesc] = useState('');
  const [materialFileType, setMaterialFileType] = useState('pdf');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [materialFileName, setMaterialFileName] = useState('');
  const [materialSemester, setMaterialSemester] = useState('Fall 2026');
  const [materialAcademicYear, setMaterialAcademicYear] = useState(1);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  // ===== Assignment State =====
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDue, setAssignmentDue] = useState('2026-11-20');
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [creating, setCreating] = useState(false);

  // ===== Submissions & Grading State =====
  const [submissions, setSubmissions] = useState([]);
  const [gradesList, setGradesList] = useState([]);
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradingMsg, setGradingMsg] = useState('');

  // ===== Attendance State =====
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [selectedStudentId, setSelectedStudentId] = useState(5);
  const [attMsg, setAttMsg] = useState('');
  const [rosterAttendance, setRosterAttendance] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);

  // ===== Internal Marks State =====
  const [internalMarksStudentId, setInternalMarksStudentId] = useState('');
  const [internalMarksCourseId, setInternalMarksCourseId] = useState('');
  const [internalMarksExamType, setInternalMarksExamType] = useState('midterm');
  const [internalMarksValue, setInternalMarksValue] = useState('');
  const [internalMarksMax, setInternalMarksMax] = useState('100');
  const [internalMarksMsg, setInternalMarksMsg] = useState('');
  const [existingInternalMarks, setExistingInternalMarks] = useState([]);
  const [submittingInternalMarks, setSubmittingInternalMarks] = useState(false);

  // ===== Notifications State =====
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [notifMsg, setNotifMsg] = useState('');

  // ===== Chat State =====
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // ===== Discussions State =====
  const [discussions, setDiscussions] = useState([]);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionBody, setDiscussionBody] = useState('');
  const [discussionCourseId, setDiscussionCourseId] = useState('');
  const [postingDiscussion, setPostingDiscussion] = useState(false);
  const [discussionReplies, setDiscussionReplies] = useState({});
  const [replyTexts, setReplyTexts] = useState({});

  // ===== Search =====
  const [studentSearch, setStudentSearch] = useState('');

  if (!stats) return <div style={{ color: '#aaa', padding: '40px' }}>Loading CSE Professor Portal...</div>;

  const { department, myCourses, hod, deptStudents, assignments, announcements, recentAttendance } = stats;

  const firstYearStudents = deptStudents.filter(s => s.academic_year === 1);
  const secondYearStudents = deptStudents.filter(s => s.academic_year === 2);

  const displayedStudents = selectedYear === 0
    ? deptStudents
    : deptStudents.filter(s => s.academic_year === selectedYear);

  const displayedCourses = selectedYear === 0
    ? myCourses
    : myCourses.filter(c => c.academic_year === selectedYear);

  const filteredStudents = displayedStudents.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.roll_number && s.roll_number.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  // ===== Fetch Functions =====

  const fetchStudyMaterials = async () => {
    setLoadingMaterials(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/study-materials', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setStudyMaterials(data);
      }
    } catch (err) {
      console.error('Failed to fetch study materials:', err);
    } finally {
      setLoadingMaterials(false);
    }
  };

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

  const fetchInternalMarks = async () => {
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/internal-marks', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setExistingInternalMarks(data);
      }
    } catch (err) {
      console.error('Failed to fetch internal marks:', err);
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSentNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const fetchConversations = async () => {
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/conversations', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchMessages = async (conversationId) => {
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchDiscussions = async () => {
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/discussions', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data);
      }
    } catch (err) {
      console.error('Failed to fetch discussions:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'study-materials') fetchStudyMaterials();
    if (activeTab === 'grading') fetchSubmissionsAndGrades();
    if (activeTab === 'internal-marks') fetchInternalMarks();
    if (activeTab === 'notifications') fetchNotifications();
    if (activeTab === 'chat') fetchConversations();
    if (activeTab === 'discussions') fetchDiscussions();
  }, [activeTab]);

  // ===== Handlers =====

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    setUploadingMaterial(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/study-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: materialTitle,
          description: materialDesc,
          file_type: materialFileType,
          file_url: materialFileUrl,
          file_name: materialFileName,
          semester: materialSemester,
          academic_year: Number(materialAcademicYear)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload material');

      alert('Study material uploaded successfully!');
      setShowMaterialModal(false);
      setMaterialTitle('');
      setMaterialDesc('');
      setMaterialFileUrl('');
      setMaterialFileName('');
      fetchStudyMaterials();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return;
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/study-materials/${materialId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Study material deleted successfully!');
      fetchStudyMaterials();
    } catch (err) {
      alert(err.message);
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

      setGradingMsg('Submission graded successfully!');
      setGradingSubmissionId(null);
      setGradeMarks('');
      setGradeFeedback('');
      fetchSubmissionsAndGrades();
      setTimeout(() => setGradingMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEnterGrade = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: Number(selectedStudentId),
          course_id: Number(selectedCourseId),
          exam_type: internalMarksExamType,
          score: Number(gradeMarks),
          max_score: Number(internalMarksMax),
          feedback: gradeFeedback
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enter grade');

      setGradingMsg('Grade entered successfully!');
      setGradeMarks('');
      setGradeFeedback('');
      fetchSubmissionsAndGrades();
      setTimeout(() => setGradingMsg(''), 3000);
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

      setAttMsg(`Attendance saved successfully for ${records.length} students on ${attendanceDate}!`);
      setTimeout(() => setAttMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setBulkSaving(false);
    }
  };

  const handleSubmitInternalMarks = async (e) => {
    e.preventDefault();
    setSubmittingInternalMarks(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/internal-marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: Number(internalMarksStudentId),
          course_id: Number(internalMarksCourseId),
          exam_type: internalMarksExamType,
          marks_obtained: Number(internalMarksValue),
          max_marks: Number(internalMarksMax)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit internal marks');

      setInternalMarksMsg('Internal marks submitted successfully!');
      setInternalMarksValue('');
      fetchInternalMarks();
      setTimeout(() => setInternalMarksMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingInternalMarks(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setSendingNotif(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: notifTitle,
          message: notifMessage,
          target: notifTarget
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send notification');

      setNotifMsg('Notification sent successfully!');
      setNotifTitle('');
      setNotifMessage('');
      fetchNotifications();
      setTimeout(() => setNotifMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingNotif(false);
    }
  };

  const handleOpenConversation = async (conv) => {
    setActiveConversation(conv);
    await fetchMessages(conv.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    setSendingMessage(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');

      setChatMessages(prev => [...prev, data]);
      setNewMessage('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handlePostDiscussion = async (e) => {
    e.preventDefault();
    setPostingDiscussion(true);
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: discussionTitle,
          body: discussionBody,
          course_id: discussionCourseId ? Number(discussionCourseId) : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post discussion');

      alert('Discussion posted successfully!');
      setShowDiscussionModal(false);
      setDiscussionTitle('');
      setDiscussionBody('');
      fetchDiscussions();
    } catch (err) {
      alert(err.message);
    } finally {
      setPostingDiscussion(false);
    }
  };

  const handlePostReply = async (discussionId) => {
    const text = replyTexts[discussionId];
    if (!text || !text.trim()) return;
    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/discussions/${discussionId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post reply');

      setReplyTexts(prev => ({ ...prev, [discussionId]: '' }));
      fetchDiscussions();
    } catch (err) {
      alert(err.message);
    }
  };

  // ===== Render =====
  return (
    <div>
      {/* Hero Welcome */}
      <div className="welcome-hero">
        <div className="dept-pill">
          {department?.code || 'CSE'} Faculty &bull; Academic Control
        </div>
        <h1 className="welcome-title">Welcome back, Professor.</h1>
        <p className="welcome-subtitle">
          Here is a curated overview of your academic day in {department?.name || 'Computer Science & Engineering'}. The archives await your direction.
        </p>
      </div>

      {/* 1. DASHBOARD TAB */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="dashboard-grid">
          {/* Stats Row */}
          <div className="card-white" style={{ gridColumn: 'span 3' }}>
            <div className="card-white-subtitle">MY COURSES</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#0f4c81', marginTop: '6px' }}>
              {myCourses.length}
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Active CSE Subjects</p>
          </div>
          <div className="card-white" style={{ gridColumn: 'span 3' }}>
            <div className="card-white-subtitle">DEPARTMENT STUDENTS</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#c5a059', marginTop: '6px' }}>
              {deptStudents.length}
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>1st & 2nd Year Enrolled</p>
          </div>
          <div className="card-white" style={{ gridColumn: 'span 3' }}>
            <div className="card-white-subtitle">ASSIGNMENTS</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#15803d', marginTop: '6px' }}>
              {assignments.length}
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Published This Semester</p>
          </div>
          <div className="card-white" style={{ gridColumn: 'span 3' }}>
            <div className="card-white-subtitle">PENDING GRADES</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 700, color: '#b91c1c', marginTop: '6px' }}>
              {submissions.filter(s => s.marks_obtained === null).length}
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Awaiting Evaluation</p>
          </div>

          {/* Today's Schedule */}
          <div className="card-white" style={{ gridColumn: 'span 8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Today's Schedule ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <div className="card-white-subtitle">TUESDAY, OCTOBER 24</div>
              </div>
              <span className="blue-link">VIEW FULL WEEK</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {myCourses.slice(0, 3).map((course, idx) => (
                <div key={course.id} style={{ padding: '14px', backgroundColor: '#f9f8f6', borderLeft: `4px solid ${idx % 2 === 0 ? '#0f4c81' : '#c5a059'}`, borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#111' }}>
                    <span>{course.code}: {course.name} ({course.academic_year === 1 ? '1st Year' : '2nd Year'})</span>
                    <span style={{ fontSize: '13px', color: '#555' }}>{idx === 0 ? '09:00 AM - 10:30 AM' : idx === 1 ? '11:00 AM - 12:30 PM' : '01:30 PM - 03:30 PM'}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    {course.semester} &bull; {course.credits} Credits
                  </div>
                </div>
              ))}
              {myCourses.length === 0 && (
                <div style={{ padding: '14px', color: '#888', fontSize: '13px' }}>No courses assigned for today.</div>
              )}
            </div>
          </div>

          {/* HOD Info */}
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
                  <strong>HOD Directives:</strong> Submit 1st Year &amp; 2nd Year internal midterm marks by Friday.
                </div>
              </div>
            ) : (
              <p style={{ color: '#777', fontSize: '13px' }}>CSE HOD Info unavailable</p>
            )}
          </div>

          {/* Student List */}
          <div className="card-white" style={{ gridColumn: 'span 7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-white-title">CSE Department Students ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
              <span className="card-white-subtitle">{displayedStudents.length} ENROLLED</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedStudents.slice(0, 8).map(st => (
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
              {displayedStudents.length > 8 && (
                <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#0f4c81', fontWeight: 600, cursor: 'pointer' }}>
                  View all {displayedStudents.length} students
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-white" style={{ gridColumn: 'span 5' }}>
            <h2 className="card-white-title" style={{ marginBottom: '16px' }}>Professor Actions</h2>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="btn-primary"
              style={{ width: '100%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <PlusCircle size={18} /> Publish New Assignment
            </button>
            <button
              onClick={() => setShowMaterialModal(true)}
              className="btn-primary"
              style={{ width: '100%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#15803d' }}
            >
              <Upload size={18} /> Upload Study Material
            </button>

            {/* Quick Attendance Logger */}
            <div style={{ padding: '16px', backgroundColor: '#fcfbf9', border: '1px solid #e5e3dc', borderRadius: '8px', marginTop: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Quick Attendance Logger</h3>
              {attMsg && <div style={{ color: '#15803d', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>{attMsg}</div>}
              <form onSubmit={handleSaveBulkAttendance}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Select Course</label>
                  <select
                    className="input-field"
                    style={{ padding: '6px', fontSize: '12px' }}
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                  >
                    {displayedCourses.map(c => (
                      <option key={c.id} value={c.id}>[{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}</option>
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
                  <button
                    type="submit"
                    style={{ width: '100%', padding: '6px', backgroundColor: '#0d2847', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark Present
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. STUDY MATERIALS TAB */}
      {activeTab === 'study-materials' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Study Materials &amp; Resources ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>Upload and manage lecture notes, slides, reference material for CSE students.</p>
              </div>
              <button onClick={() => setShowMaterialModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} /> Upload Material
              </button>
            </div>

            {loadingMaterials ? (
              <p style={{ color: '#888', fontSize: '13px' }}>Loading study materials...</p>
            ) : studyMaterials.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                <FileText size={40} color="#ccc" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px' }}>No study materials uploaded yet.</p>
                <p style={{ fontSize: '12px', color: '#aaa' }}>Click "Upload Material" to add your first resource.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {studyMaterials.filter(m => selectedYear === 0 || m.academic_year === selectedYear).map(mat => (
                  <div key={mat.id} style={{ border: '1px solid #e2dfd7', borderRadius: '10px', padding: '20px', backgroundColor: '#faf9f6', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#0f4c81', color: '#fff', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
                        {mat.file_type || 'PDF'}
                      </span>
                      <button onClick={() => handleDeleteMaterial(mat.id)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>{mat.title}</h3>
                    <p style={{ fontSize: '12px', color: '#555', lineHeight: 1.4, flex: 1 }}>{mat.description || 'No description provided.'}</p>
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #eae8e3', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#777' }}>
                      <span>{mat.semester || 'Fall 2026'}</span>
                      <span>Year: {mat.academic_year === 1 ? '1st' : '2nd'}</span>
                    </div>
                    {mat.file_url && (
                      <a href={mat.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '10px', padding: '8px', background: '#0f4c81', color: '#fff', textAlign: 'center', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                        View / Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ASSIGNMENTS TAB */}
      {activeTab === 'assignments' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Assignments &amp; Submissions ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>Create, manage, and grade CSE course assignments.</p>
              </div>
              <button onClick={() => setShowAssignmentModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlusCircle size={16} /> New Assignment
              </button>
            </div>

            {/* Assignments List */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Published Assignments</h3>
            {assignments.length === 0 ? (
              <p style={{ color: '#777', fontSize: '13px', marginBottom: '24px' }}>No assignments published yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                {assignments.map(ass => (
                  <div key={ass.id} style={{ border: '1px solid #e2dfd7', borderRadius: '8px', padding: '16px', backgroundColor: '#faf9f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0d2847' }}>{ass.title}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          {ass.course_code} &bull; Due: {ass.due_date} &bull; Max: {ass.max_marks} marks
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', background: '#eef4fb', color: '#0f4c81', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        {ass.description ? ass.description.substring(0, 60) + '...' : 'No description'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submissions */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Student Submissions</h3>
            {submissions.length === 0 ? (
              <p style={{ color: '#777', fontSize: '13px' }}>No student submissions recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {submissions.map(sub => (
                  <div key={sub.id} style={{ border: '1px solid #e2dfd7', borderRadius: '8px', padding: '16px', backgroundColor: '#faf9f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0d2847' }}>{sub.student_name} ({sub.roll_number || 'Roll N/A'})</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          Assignment: <strong>{sub.assignment_title}</strong> ({sub.course_code}) &bull; Submitted: {sub.submitted_at}
                        </div>
                      </div>
                      {sub.marks_obtained !== null ? (
                        <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                          Evaluated: {sub.marks_obtained} / {sub.max_marks}
                        </span>
                      ) : (
                        <button onClick={() => { setGradingSubmissionId(sub.id); setGradeMarks(sub.max_marks); }} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          Grade
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

      {/* 4. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Class Attendance Control Logger ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>Mark and update daily attendance for your assigned 1st Year / 2nd Year CSE students.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleMarkAll('present')} style={{ padding: '6px 12px', background: '#eefbe7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                  Mark All Present
                </button>
                <button onClick={() => handleMarkAll('absent')} style={{ padding: '6px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                  Mark All Absent
                </button>
              </div>
            </div>

            {attMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '16px' }}>{attMsg}</div>}

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

              {/* Student Roster */}
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                Student Roster ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {displayedStudents.map(student => {
                  const currentStatus = rosterAttendance[student.id] || 'present';
                  return (
                    <div key={student.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #eae8e3', borderRadius: '8px', backgroundColor: '#faf9f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={student.avatar} alt={student.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>{student.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Roll: {student.roll_number} &bull; Year: {student.academic_year === 1 ? '1st Year' : '2nd Year'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(student.id, 'present')}
                          style={{
                            padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: '1px solid', cursor: 'pointer',
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
                            padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: '1px solid', cursor: 'pointer',
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
                            padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: '1px solid', cursor: 'pointer',
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
                {bulkSaving ? 'Saving Attendance...' : 'Save Attendance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. GRADING TAB */}
      {activeTab === 'grading' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title">Gradebook &amp; Student Submissions Control</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              Review assignment solutions submitted by CSE students and award official internal assessment marks.
            </p>

            {gradingMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '20px' }}>{gradingMsg}</div>}

            {/* Submissions Section */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Student Submissions Awaiting Evaluation</h3>
            {submissions.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#777', marginBottom: '30px' }}>No student submissions recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                {submissions.map(sub => (
                  <div key={sub.id} style={{ border: '1px solid #e2dfd7', borderRadius: '8px', padding: '16px', backgroundColor: '#faf9f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0d2847' }}>{sub.student_name} ({sub.roll_number || 'Roll N/A'})</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          Assignment: <strong>{sub.assignment_title}</strong> ({sub.course_code}) &bull; Submitted: {sub.submitted_at}
                        </div>
                      </div>
                      {sub.marks_obtained !== null ? (
                        <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                          Evaluated: {sub.marks_obtained} / {sub.max_marks}
                        </span>
                      ) : (
                        <button onClick={() => { setGradingSubmissionId(sub.id); setGradeMarks(sub.max_marks); }} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          Award Grade &amp; Marks
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

            {/* Enter New Grade Section */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Enter New Grade</h3>
            <form onSubmit={handleEnterGrade} style={{ padding: '20px', border: '1px solid #e2dfd7', borderRadius: '10px', backgroundColor: '#faf9f6' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Select Student</label>
                  <select className="input-field" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                    {displayedStudents.map(st => (
                      <option key={st.id} value={st.id}>[{st.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {st.name} ({st.roll_number})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Course</label>
                  <select className="input-field" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                    {displayedCourses.map(c => (
                      <option key={c.id} value={c.id}>[{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}: {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Type</label>
                  <select className="input-field" value={internalMarksExamType} onChange={e => setInternalMarksExamType(e.target.value)}>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="lab">Lab</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Marks Obtained</label>
                  <input type="number" className="input-field" placeholder="e.g. 85" value={gradeMarks} onChange={e => setGradeMarks(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <input type="number" className="input-field" placeholder="100" value={internalMarksMax} onChange={e => setInternalMarksMax(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Feedback / Comments</label>
                <textarea className="input-field" rows="3" placeholder="Provide constructive academic feedback..." value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary">Save Grade</button>
            </form>

            {/* All Grades Table */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '30px', marginBottom: '12px' }}>All Recorded Grades</h3>
            {gradesList.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#777' }}>No grades recorded yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd9cf', color: '#555' }}>
                    <th style={{ padding: '10px' }}>Student</th>
                    <th style={{ padding: '10px' }}>Course</th>
                    <th style={{ padding: '10px' }}>Exam Type</th>
                    <th style={{ padding: '10px' }}>Score</th>
                    <th style={{ padding: '10px' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {gradesList.map(g => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #eae8e3' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{g.student_name || 'N/A'}</td>
                      <td style={{ padding: '10px' }}>{g.course_code || 'N/A'}</td>
                      <td style={{ padding: '10px', color: '#666' }}>{g.exam_type}</td>
                      <td style={{ padding: '10px', fontWeight: 700 }}>{g.score !== null ? `${g.score}%` : 'N/A'}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, backgroundColor: '#eef4fb', color: '#0f4c81' }}>
                          {g.grade || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 6. INTERNAL MARKS TAB */}
      {activeTab === 'internal-marks' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Internal Assessment Marks Entry ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>Record internal assessment marks for CSE students across exams, quizzes, and assignments.</p>
              </div>
            </div>

            {internalMarksMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '20px' }}>{internalMarksMsg}</div>}

            {/* Internal Marks Entry Form */}
            <form onSubmit={handleSubmitInternalMarks} style={{ padding: '24px', border: '1px solid #e2dfd7', borderRadius: '10px', backgroundColor: '#faf9f6', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#0d2847' }}>Enter Internal Marks</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Select Student</label>
                  <select className="input-field" value={internalMarksStudentId} onChange={e => setInternalMarksStudentId(e.target.value)} required>
                    <option value="">-- Select Student --</option>
                    {displayedStudents.map(st => (
                      <option key={st.id} value={st.id}>[{st.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {st.name} ({st.roll_number})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Course</label>
                  <select className="input-field" value={internalMarksCourseId} onChange={e => setInternalMarksCourseId(e.target.value)} required>
                    <option value="">-- Select Course --</option>
                    {displayedCourses.map(c => (
                      <option key={c.id} value={c.id}>[{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}: {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Type</label>
                  <select className="input-field" value={internalMarksExamType} onChange={e => setInternalMarksExamType(e.target.value)}>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="lab">Lab Assessment</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Marks Obtained</label>
                  <input type="number" className="input-field" placeholder="e.g. 42" value={internalMarksValue} onChange={e => setInternalMarksValue(e.target.value)} required min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Maximum Marks</label>
                  <input type="number" className="input-field" placeholder="e.g. 50" value={internalMarksMax} onChange={e => setInternalMarksMax(e.target.value)} required min="1" />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={submittingInternalMarks}>
                {submittingInternalMarks ? 'Submitting...' : 'Submit Internal Marks'}
              </button>
            </form>

            {/* Existing Internal Marks Table */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Existing Internal Marks Records</h3>
            {existingInternalMarks.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#777' }}>No internal marks recorded yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd9cf', color: '#555' }}>
                    <th style={{ padding: '10px' }}>Student</th>
                    <th style={{ padding: '10px' }}>Course</th>
                    <th style={{ padding: '10px' }}>Exam Type</th>
                    <th style={{ padding: '10px' }}>Marks</th>
                    <th style={{ padding: '10px' }}>Max Marks</th>
                    <th style={{ padding: '10px' }}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {existingInternalMarks.map((mark, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eae8e3' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{mark.student_name || 'N/A'}</td>
                      <td style={{ padding: '10px' }}>{mark.course_code || 'N/A'}</td>
                      <td style={{ padding: '10px', color: '#666' }}>{mark.exam_type}</td>
                      <td style={{ padding: '10px', fontWeight: 700 }}>{mark.marks_obtained}</td>
                      <td style={{ padding: '10px' }}>{mark.max_marks}</td>
                      <td style={{ padding: '10px', fontWeight: 700, color: mark.max_marks > 0 && (mark.marks_obtained / mark.max_marks * 100) >= 50 ? '#15803d' : '#b91c1c' }}>
                        {mark.max_marks > 0 ? Math.round(mark.marks_obtained / mark.max_marks * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 7. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Send Notifications to Students</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>Broadcast announcements and reminders to CSE students across 1st and 2nd year.</p>
              </div>
            </div>

            {notifMsg && <div style={{ color: '#15803d', fontWeight: 700, padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '20px' }}>{notifMsg}</div>}

            {/* Send Notification Form */}
            <form onSubmit={handleSendNotification} style={{ padding: '24px', border: '1px solid #e2dfd7', borderRadius: '10px', backgroundColor: '#faf9f6', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#0d2847' }}>Compose Notification</h3>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select className="input-field" value={notifTarget} onChange={e => setNotifTarget(e.target.value)}>
                  <option value="all">All CSE Students (1st &amp; 2nd Year)</option>
                  <option value="1st_year">1st Year Students Only</option>
                  <option value="2nd_year">2nd Year Students Only</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notification Title</label>
                <input type="text" className="input-field" placeholder="e.g. Midterm Schedule Update" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Message Content</label>
                <textarea className="input-field" rows="4" placeholder="Write your notification message here..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary" disabled={sendingNotif}>
                {sendingNotif ? 'Sending...' : 'Send Notification'}
              </button>
            </form>

            {/* Sent Notifications List */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Your Sent Notifications</h3>
            {sentNotifications.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#777' }}>No notifications sent yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sentNotifications.map(notif => (
                  <div key={notif.id} style={{ padding: '16px', border: '1px solid #e2dfd7', borderRadius: '8px', backgroundColor: '#faf9f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>{notif.title}</h4>
                      <span style={{ fontSize: '11px', background: '#eef4fb', color: '#0f4c81', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        Target: {notif.target || 'all'}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>{notif.message}</p>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>{notif.created_at || ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: activeConversation ? 'span 4' : 'span 12', minHeight: '500px' }}>
            <h2 className="card-white-title" style={{ marginBottom: '16px' }}>Conversations</h2>
            {conversations.length === 0 ? (
              <p style={{ color: '#777', fontSize: '13px' }}>No conversations yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleOpenConversation(conv)}
                    style={{
                      padding: '12px 14px', border: '1px solid #eae8e3', borderRadius: '8px', cursor: 'pointer',
                      backgroundColor: activeConversation?.id === conv.id ? '#eef4fb' : '#faf9f6',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{conv.title || conv.participant_name || 'Conversation'}</div>
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>{conv.last_message || 'No messages yet'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeConversation && (
            <div className="card-white" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
              <div style={{ borderBottom: '1px solid #eae8e3', paddingBottom: '12px', marginBottom: '16px' }}>
                <h2 className="card-white-title">{activeConversation.title || activeConversation.participant_name || 'Chat'}</h2>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', padding: '8px 0' }}>
                {chatMessages.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No messages yet. Start the conversation!</p>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isOwn = msg.sender_id === user.id;
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: '12px', backgroundColor: isOwn ? '#0f4c81' : '#f4f3ee', color: isOwn ? '#fff' : '#111', fontSize: '13px', lineHeight: 1.5 }}>
                          <div style={{ fontWeight: 600, fontSize: '11px', marginBottom: '2px', opacity: 0.7 }}>{isOwn ? 'You' : msg.sender_name}</div>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', borderTop: '1px solid #eae8e3', paddingTop: '12px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" disabled={sendingMessage || !newMessage.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={16} /> Send
                </button>
              </form>
            </div>
          )}

          {!activeConversation && (
            <div className="card-white" style={{ gridColumn: 'span 8', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
              <div style={{ textAlign: 'center', color: '#999' }}>
                <MessageCircle size={48} color="#ddd" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px' }}>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. DISCUSSIONS TAB */}
      {activeTab === 'discussions' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-white-title">Discussion Forums ({selectedYear === 0 ? 'All Batches' : `${selectedYear}${selectedYear === 1 ? 'st' : 'nd'} Year`})</h2>
                <p style={{ fontSize: '13px', color: '#666' }}>Academic discussion threads for CSE courses. Post topics and reply to student questions.</p>
              </div>
              <button onClick={() => setShowDiscussionModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlusCircle size={16} /> New Discussion
              </button>
            </div>

            {discussions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                <MessageSquare size={40} color="#ccc" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px' }}>No discussions posted yet.</p>
                <p style={{ fontSize: '12px', color: '#aaa' }}>Create the first discussion topic.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {discussions.map(disc => (
                  <div key={disc.id} style={{ border: '1px solid #e2dfd7', borderRadius: '10px', padding: '20px', backgroundColor: '#faf9f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700, color: '#111' }}>{disc.title}</h3>
                        <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>
                          Posted by <strong>{disc.author_name || 'Professor'}</strong> &bull; {disc.course_code || 'General'} &bull; {disc.created_at || ''}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', background: '#eef4fb', color: '#0f4c81', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        {(disc.replies_count || disc.replies?.length || 0)} replies
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.5, marginBottom: '12px' }}>{disc.body || disc.content}</p>

                    {/* Replies */}
                    {disc.replies && disc.replies.length > 0 && (
                      <div style={{ marginLeft: '20px', borderLeft: '2px solid #e2dfd7', paddingLeft: '16px', marginBottom: '12px' }}>
                        {disc.replies.map((reply, rIdx) => (
                          <div key={rIdx} style={{ padding: '8px 0', borderBottom: rIdx < disc.replies.length - 1 ? '1px solid #eae8e3' : 'none' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0d2847' }}>{reply.author_name || 'Student'}</div>
                            <div style={{ fontSize: '13px', color: '#444', marginTop: '2px' }}>{reply.content || reply.body}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Write a reply..."
                        value={replyTexts[disc.id] || ''}
                        onChange={e => setReplyTexts(prev => ({ ...prev, [disc.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handlePostReply(disc.id); }}
                        style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handlePostReply(disc.id)}
                        className="btn-primary"
                        style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Send size={14} /> Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <SettingsTab user={user} />
      )}

      {/* ===== MODALS ===== */}

      {/* Study Material Upload Modal */}
      {showMaterialModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Upload Study Material</h2>
            <form onSubmit={handleUploadMaterial}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" className="input-field" placeholder="e.g. Data Structures - Lecture 5 Notes" value={materialTitle} onChange={e => setMaterialTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input-field" rows="3" placeholder="Brief description of the material..." value={materialDesc} onChange={e => setMaterialDesc(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">File Type</label>
                  <select className="input-field" value={materialFileType} onChange={e => setMaterialFileType(e.target.value)}>
                    <option value="pdf">PDF</option>
                    <option value="pptx">PowerPoint (PPTX)</option>
                    <option value="docx">Word Document (DOCX)</option>
                    <option value="video">Video</option>
                    <option value="link">External Link</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">File Name</label>
                  <input type="text" className="input-field" placeholder="e.g. lecture5_notes.pdf" value={materialFileName} onChange={e => setMaterialFileName(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">File URL / Download Link</label>
                <input type="url" className="input-field" placeholder="https://..." value={materialFileUrl} onChange={e => setMaterialFileUrl(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="input-field" value={materialSemester} onChange={e => setMaterialSemester(e.target.value)}>
                    <option value="Fall 2026">Fall 2026</option>
                    <option value="Spring 2026">Spring 2026</option>
                    <option value="Summer 2026">Summer 2026</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <select className="input-field" value={materialAcademicYear} onChange={e => setMaterialAcademicYear(e.target.value)}>
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowMaterialModal(false)} style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploadingMaterial}>
                  {uploadingMaterial ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
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
                  {displayedCourses.map(c => (
                    <option key={c.id} value={c.id}>[{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}: {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input type="text" className="input-field" placeholder="e.g. C Fundamentals Pointer Lab" value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Detailed Description / Requirements</label>
                <textarea className="input-field" rows="4" placeholder="Explain problem statement..." value={assignmentDesc} onChange={e => setAssignmentDesc(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="input-field" value={assignmentDue} onChange={e => setAssignmentDue(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAssignmentModal(false)} style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
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

      {/* Grade Submission Modal */}
      {gradingSubmissionId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Evaluate &amp; Grade Submission</h2>
            <form onSubmit={handleGradeSubmission}>
              <div className="form-group">
                <label className="form-label">Marks Obtained</label>
                <input type="number" className="input-field" placeholder="e.g. 95" value={gradeMarks} onChange={e => setGradeMarks(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Feedback / Comments</label>
                <textarea className="input-field" rows="3" placeholder="Provide constructive academic feedback..." value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setGradingSubmissionId(null)} style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
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

      {/* New Discussion Modal */}
      {showDiscussionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Start New Discussion</h2>
            <form onSubmit={handlePostDiscussion}>
              <div className="form-group">
                <label className="form-label">Related Course (Optional)</label>
                <select className="input-field" value={discussionCourseId} onChange={e => setDiscussionCourseId(e.target.value)}>
                  <option value="">General Discussion</option>
                  {displayedCourses.map(c => (
                    <option key={c.id} value={c.id}>[{c.academic_year === 1 ? '1st Yr' : '2nd Yr'}] {c.code}: {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Discussion Title</label>
                <input type="text" className="input-field" placeholder="e.g. Doubts on Binary Tree Traversal" value={discussionTitle} onChange={e => setDiscussionTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Content / Description</label>
                <textarea className="input-field" rows="5" placeholder="Describe the topic or question in detail..." value={discussionBody} onChange={e => setDiscussionBody(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowDiscussionModal(false)} style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={postingDiscussion}>
                  {postingDiscussion ? 'Posting...' : 'Post Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
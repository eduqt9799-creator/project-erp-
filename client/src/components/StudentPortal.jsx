import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Award, FileText, CheckCircle, Send, Users, AlertCircle, Download, Eye, Search, Filter, MessageSquare, Plus, X, ArrowUpCircle, BarChart3, GraduationCap } from 'lucide-react';
import SettingsTab from './SettingsTab';

export default function StudentPortal({ stats, user, activeTab }) {
  const token = localStorage.getItem('alexandria_token');

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [matSemesterFilter, setMatSemesterFilter] = useState('');
  const [matTypeFilter, setMatTypeFilter] = useState('');
  const [matSearch, setMatSearch] = useState('');

  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const [attendance, setAttendance] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [timetable, setTimetable] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [examTypeFilter, setExamTypeFilter] = useState('');

  const [internalMarks, setInternalMarks] = useState([]);
  const [loadingMarks, setLoadingMarks] = useState(false);

  const [semesterResults, setSemesterResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [cgpaInputs, setCgpaInputs] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const [discussions, setDiscussions] = useState([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [discussionReplies, setDiscussionReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscBody, setNewDiscBody] = useState('');

  const fetchAuth = async (url, opts = {}) => {
    const res = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers }
    });
    return res;
  };

  useEffect(() => {
    if (activeTab === 'study-materials') {
      setLoadingMaterials(true);
      fetchAuth('/api/study-materials')
        .then(r => r.ok ? r.json() : [])
        .then(d => setMaterials(Array.isArray(d) ? d : d.materials || []))
        .catch(() => setMaterials([]))
        .finally(() => setLoadingMaterials(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'assignments') {
      setLoadingAssignments(true);
      fetchAuth('/api/assignments')
        .then(r => r.ok ? r.json() : [])
        .then(d => setAssignments(Array.isArray(d) ? d : d.assignments || []))
        .catch(() => setAssignments([]))
        .finally(() => setLoadingAssignments(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      setLoadingAttendance(true);
      fetch('/api/attendance', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => setAttendance(d))
        .catch(() => setAttendance(null))
        .finally(() => setLoadingAttendance(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'timetable') {
      setLoadingTimetable(true);
      fetch('/api/timetable', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setTimetable(Array.isArray(d) ? d : d.timetable || []))
        .catch(() => setTimetable([]))
        .finally(() => setLoadingTimetable(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'exams') {
      setLoadingExams(true);
      fetch('/api/exams', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setExams(Array.isArray(d) ? d : d.exams || []))
        .catch(() => setExams([]))
        .finally(() => setLoadingExams(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'internal-marks') {
      setLoadingMarks(true);
      fetch('/api/internal-marks', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setInternalMarks(Array.isArray(d) ? d : d.marks || []))
        .catch(() => setInternalMarks([]))
        .finally(() => setLoadingMarks(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'results') {
      setLoadingResults(true);
      fetch('/api/semester-results', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => { const arr = Array.isArray(d) ? d : d.results || []; setSemesterResults(arr); setCgpaInputs(arr.map(r => ({ subject: r.subject_name || r.course_name || r.course_code, credits: r.credits || 3, grade: 'O' }))); })
        .catch(() => { setSemesterResults([]); setCgpaInputs([]); })
        .finally(() => setLoadingResults(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      setLoadingNotifications(true);
      fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setNotifications(Array.isArray(d) ? d : d.notifications || []))
        .catch(() => setNotifications([]))
        .finally(() => setLoadingNotifications(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setLoadingConversations(true);
      fetch('/api/chat/conversations', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setConversations(Array.isArray(d) ? d : d.conversations || []))
        .catch(() => setConversations([]))
        .finally(() => setLoadingConversations(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'discussions' && !activeDiscussion) {
      setLoadingDiscussions(true);
      fetch('/api/discussions', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => setDiscussions(Array.isArray(d) ? d : d.discussions || []))
        .catch(() => setDiscussions([]))
        .finally(() => setLoadingDiscussions(false));
    }
  }, [activeTab, activeDiscussion]);

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);
    try {
      const res = await fetchAuth(`/api/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ submission_text: submissionText, file_url: submissionUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitMsg('Assignment submitted successfully!');
      setTimeout(() => { setSelectedAssignment(null); setSubmitMsg(''); setSubmissionText(''); setSubmissionUrl(''); }, 1500);
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatUser) return;
    const msg = chatInput;
    setChatInput('');
    try {
      const res = await fetchAuth('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ receiver_id: activeChatUser.id || activeChatUser.user_id, message: msg })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { ...data, message: msg, sender_id: user.id, sent_at: new Date().toISOString() }]);
      }
    } catch (err) { console.error(err); }
  };

  const openChat = async (conv) => {
    const userId = conv.user_id || conv.id;
    const convUser = { id: userId, name: conv.name || conv.user_name || 'User', avatar: conv.avatar };
    setActiveChatUser(convUser);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/messages/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setChatMessages(Array.isArray(data) ? data : data.messages || []);
    } catch (err) { setChatMessages([]); }
    finally { setLoadingMessages(false); }
  };

  const markNotificationRead = async (notifId) => {
    try {
      await fetch(`/api/notifications/${notifId}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true, read: true } : n));
    } catch (err) {}
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
    } catch (err) {}
  };

  const openDiscussion = async (disc) => {
    setActiveDiscussion(disc);
    try {
      const res = await fetch(`/api/discussions/${disc.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDiscussionReplies(data.replies || data.replies === undefined ? data.replies || [] : []);
    } catch (err) { setDiscussionReplies([]); }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim() || !activeDiscussion) return;
    try {
      const res = await fetchAuth(`/api/discussions/${activeDiscussion.id}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content: newReply })
      });
      const data = await res.json();
      if (res.ok) {
        setDiscussionReplies(prev => [...prev, { ...data, content: newReply, author_name: user.name, created_at: new Date().toISOString() }]);
        setNewReply('');
      }
    } catch (err) {}
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!newDiscTitle.trim() || !newDiscBody.trim()) return;
    try {
      const res = await fetchAuth('/api/discussions', {
        method: 'POST',
        body: JSON.stringify({ title: newDiscTitle, body: newDiscBody })
      });
      const data = await res.json();
      if (res.ok) {
        setDiscussions(prev => [data, ...prev]);
        setShowNewDiscussion(false);
        setNewDiscTitle('');
        setNewDiscBody('');
      }
    } catch (err) {}
  };

  const handleCgpaChange = (idx, field, value) => {
    setCgpaInputs(prev => prev.map((item, i) => i === idx ? { ...item, [field]: field === 'credits' ? Number(value) : value } : item));
  };

  const gradePoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };
  const calcSGPA = () => {
    if (cgpaInputs.length === 0) return 0;
    let totalCredits = 0;
    let weightedSum = 0;
    cgpaInputs.forEach(item => {
      const gp = gradePoints[item.grade] ?? 0;
      weightedSum += gp * item.credits;
      totalCredits += item.credits;
    });
    return totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : '0.00';
  };
  const calcCGPA = () => { return calcSGPA(); };

  const filteredMaterials = materials.filter(m => {
    if (matSemesterFilter && String(m.semester) !== matSemesterFilter) return false;
    if (matTypeFilter && m.file_type !== matTypeFilter) return false;
    if (matSearch && !m.title?.toLowerCase().includes(matSearch.toLowerCase())) return false;
    return true;
  });

  const filteredExams = exams.filter(e => {
    if (examTypeFilter && e.exam_type !== examTypeFilter) return false;
    return true;
  });

  const timetableByDay = {};
  timetable.forEach(t => {
    const day = t.day || t.day_of_week || 'Unknown';
    if (!timetableByDay[day]) timetableByDay[day] = [];
    timetableByDay[day].push(t);
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (!stats) return <div style={{ color: '#aaa', padding: '40px' }}>Loading Student Portal...</div>;

  const { enrolledCourses, assignments: statsAssignments, attendanceRecords, courseAttendanceBreakdown, overallPercentage, totalClasses, totalPresent } = stats;

  const cardStyle = { background: '#ffffff', color: '#111111', borderRadius: '12px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' };
  const thStyle = { padding: '12px', borderBottom: '2px solid #ddd9cf', color: '#555', fontWeight: 700 };
  const tdStyle = { padding: '12px', borderBottom: '1px solid #eae8e3' };
  const badgeStyle = (bg, color) => ({ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: bg, color });
  const loadingBlock = (msg) => <div style={{ color: '#aaa', padding: '40px', textAlign: 'center' }}><Clock size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />{msg || 'Loading...'}</div>;
  const emptyBlock = (msg) => <p style={{ color: '#777', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>{msg || 'No data available.'}</p>;

  return (
    <div>
      <div className="welcome-hero">
        <div className="dept-pill">
          <GraduationCap size={14} /> {stats.department?.code || 'CSE'} Department • Student Portal
        </div>
        <h1 className="welcome-title">Welcome back, {user.name.split(' ')[0]}.</h1>
        <p className="welcome-subtitle">
          Here is a curated overview of your academic day in {stats.department?.name || 'Computer Science & Engineering'}. The archives await your direction.
        </p>
      </div>

      {/* ==================== DASHBOARD ==================== */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <div className="dashboard-grid">
          {/* Stats Cards Row */}
          <div style={{ ...cardStyle, gridColumn: 'span 3', textAlign: 'center' }}>
            <BookOpen size={28} color="#0f4c81" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 600, letterSpacing: 1 }}>Subjects Enrolled</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 800, color: '#0f4c81', marginTop: 4 }}>{enrolledCourses?.length || 0}</div>
          </div>
          <div style={{ ...cardStyle, gridColumn: 'span 3', textAlign: 'center' }}>
            <CheckCircle size={28} color={overallPercentage < 75 ? '#b91c1c' : '#15803d'} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 600, letterSpacing: 1 }}>Attendance</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 800, color: overallPercentage < 75 ? '#b91c1c' : '#15803d', marginTop: 4 }}>{overallPercentage || 0}%</div>
          </div>
          <div style={{ ...cardStyle, gridColumn: 'span 3', textAlign: 'center' }}>
            <FileText size={28} color="#c5a059" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 600, letterSpacing: 1 }}>Pending Assignments</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 800, color: '#c5a059', marginTop: 4 }}>{(statsAssignments || assignments || []).filter(a => !a.submitted && a.submitted_marks === null).length}</div>
          </div>
          <div style={{ ...cardStyle, gridColumn: 'span 3', textAlign: 'center' }}>
            <Award size={28} color="#7c3aed" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', fontWeight: 600, letterSpacing: 1 }}>Upcoming Exams</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>{exams.length || 0}</div>
          </div>

          {/* Enrolled Courses */}
          <div className="card-white" style={{ gridColumn: 'span 6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-white-title">Enrolled Courses</h2>
              <span className="card-white-subtitle">{enrolledCourses?.length || 0} ACTIVE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(enrolledCourses || []).map(course => (
                <div key={course.id} style={{ padding: '12px 14px', border: '1px solid #eae8e3', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0b2545' }}>{course.code}: {course.name}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>Faculty: {course.teacher_name || 'TBA'} &bull; {course.credits} Credits</div>
                  </div>
                  <span style={{ fontSize: '11px', background: '#eef4fb', color: '#0f4c81', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>{course.semester}</span>
                </div>
              ))}
              {(!enrolledCourses || enrolledCourses.length === 0) && emptyBlock('No enrolled courses found.')}
            </div>
          </div>

          {/* Recent Assignments */}
          <div className="card-white" style={{ gridColumn: 'span 6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-white-title">Recent Assignments</h2>
              <span className="card-white-subtitle">DUE SOON</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(statsAssignments || []).slice(0, 5).map(ass => (
                <div key={ass.id} style={{ padding: '12px 14px', border: '1px solid #eae8e3', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{ass.title}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{ass.course_code} &bull; Due: {ass.due_date}</div>
                    </div>
                    {ass.submitted_marks !== null ? (
                      <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>Score: {ass.submitted_marks}/{ass.max_marks}</span>
                    ) : (
                      <span style={{ ...badgeStyle('#fef3c7', '#b45309') }}>Not Submitted</span>
                    )}
                  </div>
                </div>
              ))}
              {(!statsAssignments || statsAssignments.length === 0) && emptyBlock('No assignments available.')}
            </div>
          </div>

          {/* Recent Materials */}
          <div className="card-white" style={{ gridColumn: 'span 7' }}>
            <h2 className="card-white-title" style={{ marginBottom: 16 }}>Recent Study Materials</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(materials || []).slice(0, 4).map(m => (
                <div key={m.id} style={{ padding: '12px 14px', border: '1px solid #eae8e3', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{m.title}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{m.uploaded_by || 'Faculty'} &bull; Semester {m.semester}</div>
                  </div>
                  <span style={{ ...badgeStyle('#eef4fb', '#0f4c81') }}>{m.file_type?.toUpperCase() || 'PDF'}</span>
                </div>
              ))}
              {(!materials || materials.length === 0) && emptyBlock('No materials uploaded yet.')}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="card-white" style={{ gridColumn: 'span 5' }}>
            <h2 className="card-white-title" style={{ marginBottom: 16 }}>Recent Notifications</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(notifications || stats.announcements || []).slice(0, 5).map((n, i) => (
                <div key={n.id || i} style={{ padding: '12px 14px', border: '1px solid #eae8e3', borderRadius: '8px', backgroundColor: (n.is_read || n.read) ? '#ffffff' : '#faf9f6' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{n.title || n.message}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>{n.created_at || n.date || ''}</div>
                </div>
              ))}
              {notifications.length === 0 && (!stats.announcements || stats.announcements.length === 0) && emptyBlock('No recent notifications.')}
            </div>
          </div>
        </div>
      )}

      {/* ==================== STUDY MATERIALS ==================== */}
      {activeTab === 'study-materials' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 className="card-white-title">Study Materials Library</h2>
                <p style={{ fontSize: 13, color: '#666' }}>Browse and download academic resources shared by your faculty.</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200 }}>
                <Search size={16} color="#666" />
                <input className="input-field" style={{ marginTop: 0 }} placeholder="Search by title..." value={matSearch} onChange={e => setMatSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={16} color="#666" />
                <select className="input-field" style={{ marginTop: 0, width: 'auto' }} value={matSemesterFilter} onChange={e => setMatSemesterFilter(e.target.value)}>
                  <option value="">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <select className="input-field" style={{ marginTop: 0, width: 'auto' }} value={matTypeFilter} onChange={e => setMatTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="doc">Document</option>
                <option value="link">Link</option>
              </select>
            </div>

            {loadingMaterials ? loadingBlock('Loading study materials...') : filteredMaterials.length === 0 ? emptyBlock('No study materials found.') : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {filteredMaterials.map(m => (
                  <div key={m.id} style={{ border: '1px solid #e2dfd7', borderRadius: 10, padding: 20, backgroundColor: '#faf9f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, background: '#0f4c81', color: '#fff', padding: '4px 10px', borderRadius: 6 }}>
                        {m.file_type?.toUpperCase() || 'PDF'}
                      </span>
                      <span style={{ fontSize: 12, color: '#777' }}>Sem {m.semester}</span>
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#111' }}>{m.title}</h3>
                    <p style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Uploaded by: {m.uploaded_by || 'Faculty'}</p>
                    <p style={{ fontSize: 12, color: '#999', marginBottom: 14 }}>{m.created_at || m.date || ''}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {m.file_url && <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}><Eye size={14} /> Preview</a>}
                      {m.file_url && <a href={m.file_url} download className="btn-primary" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', backgroundColor: '#15803d' }}><Download size={14} /> Download</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== ASSIGNMENTS ==================== */}
      {activeTab === 'assignments' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ marginBottom: 20 }}>My Assignments</h2>
            {loadingAssignments ? loadingBlock('Loading assignments...') : assignments.length === 0 ? emptyBlock('No assignments available.') : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Course</th>
                    <th style={thStyle}>Due Date</th>
                    <th style={thStyle}>Max Marks</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(ass => {
                    const isSubmitted = ass.submitted || ass.submission_id;
                    const isGraded = ass.submitted_marks !== null && ass.submitted_marks !== undefined;
                    const isLate = isSubmitted && new Date(ass.submitted_at) > new Date(ass.due_date);
                    let statusLabel, statusBg, statusColor;
                    if (isGraded) { statusLabel = 'Graded'; statusBg = '#eef4fb'; statusColor = '#0f4c81'; }
                    else if (isLate) { statusLabel = 'Late'; statusBg = '#fef3c7'; statusColor = '#b45309'; }
                    else if (isSubmitted) { statusLabel = 'Submitted'; statusBg = '#eefbe7'; statusColor = '#15803d'; }
                    else { statusLabel = 'Not Submitted'; statusBg = '#fef2f2'; statusColor = '#b91c1c'; }
                    return (
                      <tr key={ass.id} style={{ borderBottom: '1px solid #eae8e3' }}>
                        <td style={tdStyle}><div style={{ fontWeight: 700 }}>{ass.title}</div></td>
                        <td style={tdStyle}>{ass.course_code || ass.course_name}</td>
                        <td style={tdStyle}>{ass.due_date}</td>
                        <td style={tdStyle}>{ass.max_marks}</td>
                        <td style={tdStyle}>
                          <span style={{ ...badgeStyle(statusBg, statusColor) }}>{statusLabel}</span>
                          {isGraded && <div style={{ fontSize: 12, color: '#15803d', marginTop: 4, fontWeight: 700 }}>{ass.submitted_marks}/{ass.max_marks}</div>}
                        </td>
                        <td style={tdStyle}>
                          {!isSubmitted && !isGraded && (
                            <button onClick={() => setSelectedAssignment(ass)} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>Submit</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==================== ATTENDANCE ==================== */}
      {activeTab === 'attendance' && (
        <div className="dashboard-grid">
          <div style={{ ...cardStyle, gridColumn: 'span 4' }}>
            <div className="card-white-subtitle">OVERALL ATTENDANCE</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 800, color: (overallPercentage || 0) < 75 ? '#b91c1c' : '#15803d', marginTop: 6 }}>
              {overallPercentage || 0}%
            </div>
            <div style={{ margin: '10px 0', background: '#e5e3dc', borderRadius: 10, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${overallPercentage || 0}%`, background: (overallPercentage || 0) < 75 ? '#b91c1c' : '#15803d', height: '100%', borderRadius: 10 }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
              <span>Attended: <strong>{totalPresent || 0}</strong> / {totalClasses || 0} classes</span>
              <span style={{ fontWeight: 700, color: (overallPercentage || 0) >= 75 ? '#15803d' : '#b91c1c' }}>
                {(overallPercentage || 0) >= 75 ? '✓ Good Standing' : '⚠ Low Attendance'}
              </span>
            </div>
          </div>

          <div className="card-white" style={{ gridColumn: 'span 8' }}>
            <h2 className="card-white-title" style={{ marginBottom: 14 }}>Subject-Wise Breakdown</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(courseAttendanceBreakdown || []).map((item, idx) => {
                const pct = item.total_classes > 0 ? Math.round((item.present_count / item.total_classes) * 100) : 100;
                return (
                  <div key={idx} style={{ padding: '12px 14px', border: '1px solid #eae8e3', borderRadius: 8, backgroundColor: '#faf9f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
                      <span>{item.course_code}</span>
                      <span style={{ color: pct < 75 ? '#b91c1c' : '#0f4c81' }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>{item.course_name}</div>
                    <div style={{ fontSize: 11, color: '#777' }}>{item.present_count} of {item.total_classes} sessions attended</div>
                  </div>
                );
              })}
              {(!courseAttendanceBreakdown || courseAttendanceBreakdown.length === 0) && emptyBlock('No subject breakdown available.')}
            </div>
          </div>

          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ marginBottom: 16 }}>Daily Attendance History</h2>
            {(!attendanceRecords || attendanceRecords.length === 0) ? emptyBlock('No attendance records found.') : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Course / Subject</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(rec => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #eae8e3' }}>
                      <td style={tdStyle}>{rec.date}</td>
                      <td style={tdStyle}>{rec.course_code ? `${rec.course_code}: ` : ''}{rec.course_name}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                          backgroundColor: rec.status === 'present' ? '#eefbe7' : rec.status === 'absent' ? '#fef2f2' : '#fef3c7',
                          color: rec.status === 'present' ? '#15803d' : rec.status === 'absent' ? '#991b1b' : '#d97706'
                        }}>{rec.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==================== TIMETABLE ==================== */}
      {activeTab === 'timetable' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ marginBottom: 20 }}>Weekly Timetable</h2>
            {loadingTimetable ? loadingBlock('Loading timetable...') : timetable.length === 0 ? emptyBlock('No timetable entries found.') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {daysOfWeek.map(day => {
                  const entries = timetableByDay[day];
                  if (!entries || entries.length === 0) return null;
                  return (
                    <div key={day}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f4c81', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{day}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {entries.map((t, i) => (
                          <div key={i} style={{ padding: '14px 18px', backgroundColor: '#f9f8f6', borderLeft: '4px solid #0f4c81', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: '#111' }}>{t.course_code || t.subject}: {t.course_name || t.title || ''}</div>
                              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{t.room || t.location || ''} {t.teacher_name ? `• ${t.teacher_name}` : ''}</div>
                            </div>
                            <div style={{ fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={14} /> {t.start_time || t.time || ''} - {t.end_time || ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== EXAMS ==================== */}
      {activeTab === 'exams' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 className="card-white-title">Examination Schedule</h2>
                <p style={{ fontSize: 13, color: '#666' }}>View upcoming and past examinations.</p>
              </div>
              <select className="input-field" style={{ marginTop: 0, width: 'auto' }} value={examTypeFilter} onChange={e => setExamTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="internal">Internal</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
            {loadingExams ? loadingBlock('Loading exams...') : filteredExams.length === 0 ? emptyBlock('No exams found.') : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Exam Name</th>
                    <th style={thStyle}>Course</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Time</th>
                    <th style={thStyle}>Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map(ex => (
                    <tr key={ex.id} style={{ borderBottom: '1px solid #eae8e3' }}>
                      <td style={tdStyle}><span style={{ fontWeight: 700 }}>{ex.title || ex.exam_name}</span></td>
                      <td style={tdStyle}>{ex.course_code || ex.course_name}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                          backgroundColor: ex.exam_type === 'final' ? '#fef2f2' : ex.exam_type === 'midterm' ? '#fef3c7' : '#eef4fb',
                          color: ex.exam_type === 'final' ? '#b91c1c' : ex.exam_type === 'midterm' ? '#b45309' : '#0f4c81'
                        }}>{ex.exam_type}</span>
                      </td>
                      <td style={tdStyle}>{ex.date || ex.exam_date}</td>
                      <td style={tdStyle}>{ex.start_time || ex.time || ''}{ex.end_time ? ` - ${ex.end_time}` : ''}</td>
                      <td style={tdStyle}>{ex.venue || ex.room || 'TBA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==================== INTERNAL MARKS ==================== */}
      {activeTab === 'internal-marks' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ marginBottom: 20 }}>Internal Assessment Marks</h2>
            {loadingMarks ? loadingBlock('Loading marks...') : internalMarks.length === 0 ? emptyBlock('No internal marks records found.') : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Course</th>
                    <th style={thStyle}>Assessment Type</th>
                    <th style={thStyle}>Marks Obtained</th>
                    <th style={thStyle}>Max Marks</th>
                    <th style={thStyle}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {internalMarks.map((mark, i) => {
                    const pct = mark.max_marks ? Math.round((mark.marks_obtained / mark.max_marks) * 100) : 0;
                    return (
                      <tr key={mark.id || i} style={{ borderBottom: '1px solid #eae8e3' }}>
                        <td style={tdStyle}><span style={{ fontWeight: 700, color: '#0d2847' }}>{mark.course_code || mark.course_name}</span></td>
                        <td style={tdStyle}>{mark.assessment_type || mark.type || 'N/A'}</td>
                        <td style={tdStyle}>{mark.marks_obtained}</td>
                        <td style={tdStyle}>{mark.max_marks}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: '#e5e3dc', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, background: pct >= 60 ? '#15803d' : '#b91c1c', height: '100%' }}></div>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 12, color: pct >= 60 ? '#15803d' : '#b91c1c' }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==================== RESULTS & CGPA ==================== */}
      {activeTab === 'results' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 7' }}>
            <h2 className="card-white-title" style={{ marginBottom: 20 }}>Semester Results</h2>
            {loadingResults ? loadingBlock('Loading results...') : semesterResults.length === 0 ? emptyBlock('No semester results found.') : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Course Code</th>
                    <th style={thStyle}>Course Name</th>
                    <th style={thStyle}>Credits</th>
                    <th style={thStyle}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterResults.map((r, i) => (
                    <tr key={r.id || i} style={{ borderBottom: '1px solid #eae8e3' }}>
                      <td style={tdStyle}><span style={{ fontWeight: 700, color: '#0d2847' }}>{r.course_code}</span></td>
                      <td style={tdStyle}>{r.course_name || r.subject_name}</td>
                      <td style={tdStyle}>{r.credits}</td>
                      <td style={tdStyle}>
                        <span style={{ ...badgeStyle('#eef4fb', '#0f4c81'), fontWeight: 800 }}>{r.grade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card-white" style={{ gridColumn: 'span 5' }}>
            <h2 className="card-white-title" style={{ marginBottom: 16 }}>CGPA Calculator</h2>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>Adjust credits and grades to calculate your SGPA/CGPA.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, maxHeight: 300, overflowY: 'auto' }}>
              {cgpaInputs.map((item, idx) => (
                <div key={idx} style={{ padding: '10px 12px', border: '1px solid #eae8e3', borderRadius: 6, backgroundColor: '#faf9f6' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#111' }}>{item.subject}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>Credits</label>
                      <input type="number" min={1} max={10} value={item.credits} onChange={e => handleCgpaChange(idx, 'credits', e.target.value)} style={{ width: '60px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>Grade</label>
                      <select value={item.grade} onChange={e => handleCgpaChange(idx, 'grade', e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4, fontSize: 12 }}>
                        {Object.keys(gradePoints).map(g => <option key={g} value={g}>{g} ({gradePoints[g]})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px', background: '#eef4fb', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#666', fontWeight: 600, letterSpacing: 1 }}>Calculated SGPA</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 800, color: '#0f4c81' }}>{calcSGPA()}</div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#666', fontWeight: 600, letterSpacing: 1, marginTop: 10 }}>Cumulative GPA</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 800, color: '#0b2545' }}>{calcCGPA()}</div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== NOTIFICATIONS ==================== */}
      {activeTab === 'notifications' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 className="card-white-title">Notifications</h2>
                <p style={{ fontSize: 13, color: '#666' }}>Stay updated with announcements and alerts.</p>
              </div>
              <button onClick={markAllNotificationsRead} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> Mark All Read
              </button>
            </div>

            {loadingNotifications ? loadingBlock('Loading notifications...') : notifications.length === 0 ? emptyBlock('No notifications.') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.map(n => {
                  const read = n.is_read || n.read;
                  return (
                    <div key={n.id} style={{
                      padding: '16px 20px', borderRadius: 8,
                      backgroundColor: read ? '#ffffff' : '#faf9f6',
                      border: `1px solid ${read ? '#eae8e3' : '#c5a059'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {!read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c5a059', flexShrink: 0 }}></div>}
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{n.title || n.message}</h3>
                        </div>
                        {n.body && <p style={{ fontSize: 13, color: '#555', marginTop: 4, lineHeight: 1.5 }}>{n.body}</p>}
                        <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{n.created_at || n.date || ''}</p>
                      </div>
                      {!read && (
                        <button onClick={() => markNotificationRead(n.id)} style={{ padding: '6px 12px', border: '1px solid #0f4c81', background: 'transparent', color: '#0f4c81', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Mark Read
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== CHAT ==================== */}
      {activeTab === 'chat' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12', padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: '70vh' }}>
              {/* Conversation List */}
              <div style={{ width: 320, borderRight: '1px solid #eae8e3', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #eae8e3' }}>
                  <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Messages</h2>
                  <p style={{ fontSize: 12, color: '#666' }}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loadingConversations ? <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 13 }}>Loading...</div> : conversations.length === 0 ? (
                    <div style={{ padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>
                      <MessageSquare size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                      <div>No conversations yet.</div>
                    </div>
                  ) : (
                    conversations.map(conv => {
                      const convId = conv.user_id || conv.id;
                      const isActive = activeChatUser && (activeChatUser.id === convId);
                      return (
                        <div key={convId} onClick={() => openChat(conv)} style={{
                          padding: '14px 20px', cursor: 'pointer',
                          backgroundColor: isActive ? '#eef4fb' : '#ffffff',
                          borderBottom: '1px solid #f0eee9',
                          borderLeft: isActive ? '3px solid #0f4c81' : '3px solid transparent'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#d8d4c9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#333', overflow: 'hidden', flexShrink: 0 }}>
                              {conv.avatar ? <img src={conv.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (conv.name || conv.user_name || 'U').charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{conv.name || conv.user_name || 'User'}</div>
                              <div style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.last_message || conv.preview || 'Start chatting'}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Messages Panel */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {!activeChatUser ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column', gap: 12 }}>
                    <MessageSquare size={40} style={{ opacity: 0.3 }} />
                    <p style={{ fontSize: 14 }}>Select a conversation to start chatting</p>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #eae8e3', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#d8d4c9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#333', overflow: 'hidden' }}>
                        {activeChatUser.avatar ? <img src={activeChatUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (activeChatUser.name || 'U').charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{activeChatUser.name}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>Online</div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: '#f9f8f6' }}>
                      {loadingMessages ? <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>Loading messages...</div> : chatMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#aaa', padding: 40, fontSize: 13 }}>No messages yet. Say hello!</div>
                      ) : chatMessages.map((msg, i) => {
                        const isMine = msg.sender_id === user.id || msg.sender_id === user.user_id;
                        return (
                          <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              maxWidth: '70%', padding: '10px 16px', borderRadius: 12,
                              backgroundColor: isMine ? '#0f4c81' : '#ffffff',
                              color: isMine ? '#ffffff' : '#111',
                              boxShadow: isMine ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
                              fontSize: 14, lineHeight: 1.5
                            }}>
                              <div>{msg.message || msg.text || msg.content}</div>
                              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>{msg.sent_at || msg.created_at || ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleChatSend} style={{ padding: '16px 24px', borderTop: '1px solid #eae8e3', display: 'flex', gap: 10, backgroundColor: '#ffffff' }}>
                      <input className="input-field" style={{ marginTop: 0, flex: 1 }} placeholder="Type your message..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                      <button type="submit" className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Send size={16} /> Send
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DISCUSSIONS ==================== */}
      {activeTab === 'discussions' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            {activeDiscussion ? (
              <>
                <button onClick={() => { setActiveDiscussion(null); setDiscussionReplies([]); }} style={{ background: 'none', border: 'none', color: '#0f4c81', cursor: 'pointer', fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                  ← Back to Discussions
                </button>
                <h2 className="card-white-title">{activeDiscussion.title}</h2>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>By {activeDiscussion.author_name || user.name} &bull; {activeDiscussion.created_at || activeDiscussion.date || ''}</div>
                {activeDiscussion.body && <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 20, padding: '16px', background: '#faf9f6', borderRadius: 8, border: '1px solid #eae8e3' }}>{activeDiscussion.body}</p>}

                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Replies ({discussionReplies.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {discussionReplies.length === 0 ? emptyBlock('No replies yet. Be the first to respond.') : discussionReplies.map((reply, i) => (
                    <div key={reply.id || i} style={{ padding: '14px 16px', border: '1px solid #eae8e3', borderRadius: 8, backgroundColor: '#faf9f6' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f4c81', marginBottom: 4 }}>{reply.author_name || 'User'}</div>
                      <p style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>{reply.content || reply.body}</p>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>{reply.created_at || reply.date || ''}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReply} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea className="input-field" style={{ flex: 1, minHeight: 60, resize: 'vertical' }} placeholder="Write your reply..." value={newReply} onChange={e => setNewReply(e.target.value)} required />
                  <button type="submit" className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    <Send size={14} /> Reply
                  </button>
                </form>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 className="card-white-title">Discussion Forum</h2>
                    <p style={{ fontSize: 13, color: '#666' }}>Join academic discussions with peers and faculty.</p>
                  </div>
                  <button onClick={() => setShowNewDiscussion(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} /> New Discussion
                  </button>
                </div>

                {loadingDiscussions ? loadingBlock('Loading discussions...') : discussions.length === 0 ? emptyBlock('No discussions yet. Start one!') : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {discussions.map(d => (
                      <div key={d.id} onClick={() => openDiscussion(d)} style={{
                        padding: '16px 20px', border: '1px solid #e2dfd7', borderRadius: 8, cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'background-color 0.15s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#faf9f6'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                      >
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>{d.title}</h3>
                          <div style={{ fontSize: 12, color: '#666' }}>By {d.author_name || 'User'} &bull; {d.created_at || d.date || ''}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 12 }}>
                          <MessageSquare size={14} />
                          <span>{d.reply_count || d.replies_count || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== SETTINGS ==================== */}
      {activeTab === 'settings' && (
        <SettingsTab user={user} />
      )}

      {/* ==================== MODALS ==================== */}

      {/* Assignment Submission Modal */}
      {selectedAssignment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 className="modal-header" style={{ marginBottom: 0 }}>{selectedAssignment.title}</h3>
              <button onClick={() => { setSelectedAssignment(null); setSubmitMsg(''); setSubmissionText(''); setSubmissionUrl(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{selectedAssignment.description || 'Submit your solution below.'}</p>
            {submitMsg ? (
              <div style={{ color: '#15803d', fontWeight: 700, padding: 20, textAlign: 'center' }}>{submitMsg}</div>
            ) : (
              <form onSubmit={handleAssignmentSubmit}>
                <div className="form-group">
                  <label className="form-label">Solution Text / Code</label>
                  <textarea className="input-field" rows={6} placeholder="Type your solution or paste code here..." value={submissionText} onChange={e => setSubmissionText(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">File URL (optional)</label>
                  <input className="input-field" placeholder="https://drive.google.com/... or GitHub link" value={submissionUrl} onChange={e => setSubmissionUrl(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="button" onClick={() => { setSelectedAssignment(null); setSubmitMsg(''); }} style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Assignment'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Discussion Modal */}
      {showNewDiscussion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 className="modal-header" style={{ marginBottom: 0 }}>Start New Discussion</h3>
              <button onClick={() => { setShowNewDiscussion(false); setNewDiscTitle(''); setNewDiscBody(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateDiscussion}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="input-field" placeholder="Discussion topic title..." value={newDiscTitle} onChange={e => setNewDiscTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Body</label>
                <textarea className="input-field" rows={6} placeholder="Describe your discussion topic..." value={newDiscBody} onChange={e => setNewDiscBody(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => { setShowNewDiscussion(false); setNewDiscTitle(''); setNewDiscBody(''); }} style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" className="btn-primary">Post Discussion</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

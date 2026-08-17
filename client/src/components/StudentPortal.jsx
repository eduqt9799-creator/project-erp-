import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, Award, FileText, CheckCircle, Send, Users, AlertCircle } from 'lucide-react';
import SettingsTab from './SettingsTab';

export default function StudentPortal({ stats, user, activeTab }) {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  if (!stats) return <div style={{ color: '#aaa', padding: '40px' }}>Loading CSE Student Portal Data...</div>;

  const { 
    department, enrolledCourses, hod, assignments, attendanceRecords, 
    courseAttendanceBreakdown, overallPercentage, totalClasses, totalPresent, 
    grades, announcements, teachersList 
  } = stats;

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);

    const token = localStorage.getItem('alexandria_token');
    try {
      const res = await fetch(`/api/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submission_text: submissionText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSubmitMsg('Assignment submitted successfully!');
      setTimeout(() => {
        setSelectedAssignment(null);
        setSubmitMsg('');
        setSubmissionText('');
      }, 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-hero">
        <div className="dept-pill">
          🎓 {department?.code || 'CSE'} Department • Connected Portal
        </div>
        <h1 className="welcome-title">Welcome back, {user.name.split(' ')[0]}.</h1>
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
                  Turing Building Room 302 • Prof. Ada Lovelace
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f9f8f6', borderLeft: '4px solid #c5a059', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#111' }}>
                  <span>CSE-402: Compiler Design Lab</span>
                  <span style={{ fontSize: '13px', color: '#555' }}>01:30 PM - 03:30 PM</span>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  Systems Lab 404 • Prof. Grace Hopper
                </div>
              </div>
            </div>
          </div>

          {/* Department HOD Card */}
          <div className="card-white" style={{ gridColumn: 'span 4' }}>
            <div className="card-white-subtitle" style={{ marginBottom: '8px' }}>CSE DEPARTMENT HEAD</div>
            {hod ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0' }}>
                  <img src={hod.avatar} alt={hod.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700 }}>{hod.name}</h3>
                    <p style={{ fontSize: '12px', color: '#666' }}>{hod.office_room || 'HOD Office'}</p>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.4, fontStyle: 'italic' }}>
                  "Excellence in computing stems from foundational rigor and relentless inquiry."
                </p>
                <div style={{ marginTop: '16px', fontSize: '12px', color: '#0f4c81', fontWeight: 600 }}>
                  ✉️ {hod.email}
                </div>
              </div>
            ) : (
              <p style={{ color: '#888', fontSize: '13px' }}>HOD information unavailable.</p>
            )}
          </div>

          {/* Enrolled CSE Courses */}
          <div className="card-white" style={{ gridColumn: 'span 6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-white-title">Enrolled CSE Courses</h2>
              <span className="card-white-subtitle">{enrolledCourses.length} ACTIVE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {enrolledCourses.map(course => (
                <div key={course.id} style={{ padding: '12px 14px', border: '1px solid #eae8e3', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#0b2545' }}>{course.code}: {course.name}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      Faculty: {course.teacher_name || 'Prof. Ada Lovelace'} • {course.credits} Credits
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', background: '#eef4fb', color: '#0f4c81', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {course.semester}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active CSE Assignments */}
          <div className="card-white" style={{ gridColumn: 'span 6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-white-title">CSE Assignments</h2>
              <span className="card-white-subtitle">DUE SOON</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {assignments.map(ass => (
                <div key={ass.id} style={{ padding: '12px 14px', border: '1px solid #eae8e3', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{ass.title}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{ass.course_code} • Due: {ass.due_date}</div>
                    </div>
                    {ass.submitted_marks !== null ? (
                      <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>
                        Score: {ass.submitted_marks} / {ass.max_marks}
                      </span>
                    ) : (
                      <button 
                        onClick={() => setSelectedAssignment(ass)}
                        className="btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Submit Solution
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CSE Department Announcements */}
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ marginBottom: '16px' }}>CSE Department Notices & Broadcasts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {announcements.map(ann => (
                <div key={ann.id} style={{ padding: '16px', backgroundColor: '#fcfbf9', border: '1px solid #e9e7e1', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#0f4c81', fontWeight: 700, marginBottom: '4px' }}>
                    BROADCAST BY {ann.author_name || 'CSE HOD'}
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>{ann.title}</h3>
                  <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.5 }}>{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. DEDICATED TAB: MY ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="dashboard-grid">
          {/* Overall Percentage Card */}
          <div className="card-white" style={{ gridColumn: 'span 4' }}>
            <div className="card-white-subtitle">OVERALL ATTENDANCE</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '42px', fontWeight: 800, color: overallPercentage < 75 ? '#b91c1c' : '#15803d', marginTop: '6px' }}>
              {overallPercentage}%
            </div>
            <div style={{ margin: '10px 0', background: '#e5e3dc', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${overallPercentage}%`, background: overallPercentage < 75 ? '#b91c1c' : '#15803d', height: '100%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
              <span>Attended: <strong>{totalPresent}</strong> / {totalClasses} classes</span>
              <span style={{ fontWeight: 700, color: overallPercentage < 75 ? '#b91c1c' : '#15803d' }}>
                {overallPercentage >= 75 ? '✓ Good Standing' : '⚠ Low Attendance Warning'}
              </span>
            </div>
          </div>

          {/* Subject-Wise Breakdown Card */}
          <div className="card-white" style={{ gridColumn: 'span 8' }}>
            <h2 className="card-white-title" style={{ marginBottom: '14px' }}>Subject Attendance Breakdown</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {courseAttendanceBreakdown?.map((item, idx) => {
                const pct = item.total_classes > 0 ? Math.round((item.present_count / item.total_classes) * 100) : 100;
                return (
                  <div key={idx} style={{ padding: '12px 14px', border: '1px solid #eae8e3', borderRadius: '8px', backgroundColor: '#faf9f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px' }}>
                      <span>{item.course_code}</span>
                      <span style={{ color: pct < 75 ? '#b91c1c' : '#0f4c81' }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>{item.course_name}</div>
                    <div style={{ fontSize: '11px', color: '#777' }}>{item.present_count} of {item.total_classes} sessions attended</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Attendance History Log */}
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title" style={{ marginBottom: '16px' }}>Daily Attendance History Log</h2>
            {attendanceRecords?.length === 0 ? (
              <p style={{ color: '#777', fontSize: '13px' }}>No attendance sessions logged yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd9cf', color: '#555' }}>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Course / Subject</th>
                    <th style={{ padding: '10px' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords?.map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #eae8e3' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{rec.date}</td>
                      <td style={{ padding: '10px' }}>{rec.course_code ? `${rec.course_code}: ` : ''}{rec.course_name}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor: rec.status === 'present' ? '#eefbe7' : rec.status === 'absent' ? '#fef2f2' : '#fef3c7',
                          color: rec.status === 'present' ? '#15803d' : rec.status === 'absent' ? '#991b1b' : '#d97706'
                        }}>
                          {rec.status}
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

      {/* 3. DEDICATED TAB: MY CSE COURSES */}
      {activeTab === 'courses' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title">CSE Academic Curriculum</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
              Official courses allocated exclusively to Computer Science & Engineering students.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {enrolledCourses.map(course => (
                <div key={course.id} style={{ border: '1px solid #ddd9cf', borderRadius: '8px', padding: '20px', backgroundColor: '#faf9f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, background: '#0f4c81', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
                      {course.code}
                    </span>
                    <span style={{ fontSize: '12px', color: '#777' }}>{course.credits} Credits</span>
                  </div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{course.name}</h3>
                  <div style={{ fontSize: '13px', color: '#555', marginTop: '12px' }}>
                    👤 Instructor: <strong>{course.teacher_name || 'Prof. Ada Lovelace'}</strong> ({course.teacher_email || 'ada@alexandria.edu'})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. DEDICATED TAB: FACULTY DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title">CSE Department Faculty Directory</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
              Connected Professors and HOD for Computer Science & Engineering.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {teachersList.map((t, idx) => (
                <div key={idx} style={{ border: '1px solid #e2dfd7', borderRadius: '10px', padding: '20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                  <img src={t.avatar} alt={t.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: 700 }}>{t.name}</h3>
                  <p style={{ fontSize: '12px', color: '#0f4c81', fontWeight: 600, margin: '4px 0' }}>{t.specialization || 'Computer Science'}</p>
                  <p style={{ fontSize: '12px', color: '#777' }}>📍 {t.office_room || 'Faculty Hall'}</p>
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#333', background: '#f4f3ee', padding: '6px', borderRadius: '4px' }}>
                    ✉️ {t.email}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. DEDICATED TAB: GRADE TRANSCRIPT */}
      {activeTab === 'grades' && (
        <div className="dashboard-grid">
          <div className="card-white" style={{ gridColumn: 'span 12' }}>
            <h2 className="card-white-title">Official Academic Grade Transcript</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
              Verified semester grades and internal assessment evaluation record.
            </p>

            {grades.length === 0 ? (
              <p style={{ color: '#777', fontSize: '13px' }}>No academic grades recorded for this semester yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd9cf', color: '#555' }}>
                    <th style={{ padding: '12px' }}>Course Code</th>
                    <th style={{ padding: '12px' }}>Course Name</th>
                    <th style={{ padding: '12px' }}>Assessment Type</th>
                    <th style={{ padding: '12px' }}>Score %</th>
                    <th style={{ padding: '12px' }}>Letter Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #eae8e3' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0d2847' }}>{g.course_code}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{g.course_name}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{g.exam_type}</td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{g.score !== null ? `${g.score}%` : 'N/A'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 800,
                          backgroundColor: '#eef4fb',
                          color: '#0f4c81'
                        }}>
                          {g.grade}
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

      {/* 6. DEDICATED TAB: PROFILE SETTINGS */}
      {activeTab === 'settings' && (
        <SettingsTab user={user} />
      )}

      {/* Assignment Submission Modal */}
      {selectedAssignment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-header">{selectedAssignment.title}</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>{selectedAssignment.description}</p>
            
            {submitMsg ? (
              <div style={{ color: '#15803d', fontWeight: 700, padding: '20px', textAlign: 'center' }}>
                ✅ {submitMsg}
              </div>
            ) : (
              <form onSubmit={handleAssignmentSubmit}>
                <div className="form-group">
                  <label className="form-label">Solution Submission Text / Code</label>
                  <textarea 
                    className="input-field" 
                    rows="6"
                    placeholder="Type your solution response or codebase link here..."
                    value={submissionText}
                    onChange={e => setSubmissionText(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button 
                    type="button" 
                    onClick={() => setSelectedAssignment(null)}
                    style={{ padding: '8px 16px', background: '#e5e3dc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

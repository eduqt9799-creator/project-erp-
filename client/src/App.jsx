import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import AuthModal, { getSession, clearSession, updateSessionProfile } from './components/AuthModal';
import ProfileSetupModal from './components/ProfileSetupModal';
import StudentPortal from './components/StudentPortal';
import TeacherPortal from './components/TeacherPortal';
import HodPortal from './components/HodPortal';
import AdminPortal from './components/AdminPortal';

// ─── Default Dashboard Stats Helper for Client-Side / Local Storage Mode ─────
function getInitialDashboardStats(user) {
  const deptName = user?.department || 'Computer Science & Engineering';
  const deptCode = 'CSE';

  const defaultTeachers = [
    { id: 1, name: 'Dr. Alan Turing', designation: 'Senior Professor', specialization: 'Algorithms & AI', office_room: 'Turing Hall 301', email: 'turing@hindusthan.edu' },
    { id: 2, name: 'Prof. Grace Hopper', designation: 'Associate Professor', specialization: 'Compiler Engineering', office_room: 'Hopper Hall 204', email: 'hopper@hindusthan.edu' },
    { id: 3, name: 'Prof. Margaret Hamilton', designation: 'Associate Professor', specialization: 'Software Architecture', office_room: 'Hamilton Hall 105', email: 'margaret@hindusthan.edu' },
  ];

  const defaultStudents = [
    { id: 1, name: 'Linus Torvalds', roll_number: 'CSE-2023-001', academic_year: 1, email: 'linus@hindusthan.edu', attendance_pct: 94 },
    { id: 2, name: 'Ada Lovelace', roll_number: 'CSE-2023-002', academic_year: 1, email: 'ada@hindusthan.edu', attendance_pct: 98 },
    { id: 3, name: 'Dennis Ritchie', roll_number: 'CSE-2022-045', academic_year: 2, email: 'dennis@hindusthan.edu', attendance_pct: 91 },
    { id: 4, name: 'Ken Thompson', roll_number: 'CSE-2022-046', academic_year: 2, email: 'ken@hindusthan.edu', attendance_pct: 88 },
  ];

  const defaultCourses = [
    { id: 101, code: 'CSE-301', name: 'Advanced Data Structures & Algorithms', credits: 4, semester: 'Fall 2026', academic_year: 1, teacher_name: 'Dr. Alan Turing', enrolled_students: 45 },
    { id: 102, code: 'CSE-302', name: 'Database Management Systems', credits: 3, semester: 'Fall 2026', academic_year: 1, teacher_name: 'Prof. Grace Hopper', enrolled_students: 42 },
    { id: 103, code: 'CSE-401', name: 'Operating Systems & Architecture', credits: 4, semester: 'Fall 2026', academic_year: 2, teacher_name: 'Prof. Margaret Hamilton', enrolled_students: 38 },
    { id: 104, code: 'CSE-402', name: 'Compiler Design Lab', credits: 2, semester: 'Fall 2026', academic_year: 2, teacher_name: 'Prof. Grace Hopper', enrolled_students: 40 },
  ];

  const defaultAnnouncements = [
    { id: 1, title: 'Department Hackathon 2026 Registration Open', content: 'Annual CSE Hackathon will take place on Oct 10-12. Register teams before Oct 1.', created_at: new Date().toISOString(), created_by: 'Dr. Arun Kumar (HOD)' },
    { id: 2, title: 'Mid-Semester Examination Schedule', content: 'Mid-sem exams for 3rd and 5th semester starting from Sept 25. Check portal for syllabus.', created_at: new Date().toISOString(), created_by: 'Prof. Grace Hopper' },
  ];

  return {
    department: { id: 1, name: deptName, code: deptCode },
    enrolledCourses: defaultCourses,
    hod: { name: 'Dr. Arun Kumar', email: 'hod.cse@hindusthan.edu', designation: 'Professor & Head of Department' },
    assignments: [
      { id: 1, title: 'B-Tree & Red-Black Tree Implementation', course_code: 'CSE-301', due_date: '2026-09-15', description: 'Implement self-balancing search trees with time complexity benchmarks.' },
      { id: 2, title: 'SQL Query Optimization Assignment', course_code: 'CSE-302', due_date: '2026-09-20', description: 'Write optimized queries for institutional ERP schema using indexing and CTEs.' },
    ],
    attendanceRecords: [],
    courseAttendanceBreakdown: [
      { code: 'CSE-301', course_name: 'Advanced Data Structures', present: 28, total: 30, percentage: 93.3 },
      { code: 'CSE-302', course_name: 'Database Management Systems', present: 25, total: 28, percentage: 89.2 },
      { code: 'CSE-401', course_name: 'Operating Systems', present: 22, total: 25, percentage: 88.0 },
    ],
    overallPercentage: 90.1,
    totalClasses: 83,
    totalPresent: 75,
    grades: [
      { course_code: 'CSE-301', course_name: 'Advanced Data Structures', grade: 'A+', marks: 95 },
      { course_code: 'CSE-302', course_name: 'Database Management Systems', grade: 'A', marks: 88 },
      { course_code: 'CSE-401', course_name: 'Operating Systems', grade: 'A', marks: 90 },
    ],
    announcements: defaultAnnouncements,
    teachersList: defaultTeachers,
    // Teacher specific
    myCourses: defaultCourses,
    deptStudents: defaultStudents,
    recentAttendance: [],
    // HOD specific
    teachersCount: defaultTeachers.length,
    studentsCount: defaultStudents.length,
    coursesCount: defaultCourses.length,
    teachers: defaultTeachers,
    students: defaultStudents,
    courses: defaultCourses,
    studentAttendanceReports: [
      { student_name: 'Linus Torvalds', roll_number: 'CSE-2023-001', percentage: 94, status: 'Regular' },
      { student_name: 'Ada Lovelace', roll_number: 'CSE-2023-002', percentage: 98, status: 'Regular' },
      { student_name: 'Dennis Ritchie', roll_number: 'CSE-2022-045', percentage: 91, status: 'Regular' },
      { student_name: 'Ken Thompson', roll_number: 'CSE-2022-046', percentage: 88, status: 'Warning' },
    ],
    // Admin specific
    totalDepartments: 4,
    totalUsers: 890,
    usersByRole: [
      { role: 'student', count: 750 },
      { role: 'teacher', count: 110 },
      { role: 'hod', count: 24 },
      { role: 'admin', count: 6 },
    ],
    departmentsList: [
      { id: 1, code: 'CSE', name: 'Computer Science & Engineering', hod_name: 'Dr. Arun Kumar', student_count: 320, faculty_count: 18 },
      { id: 2, code: 'ECE', name: 'Electronics & Communication', hod_name: 'Dr. C. Raman', student_count: 280, faculty_count: 15 },
      { id: 3, code: 'MECH', name: 'Mechanical Engineering', hod_name: 'Dr. James Watt', student_count: 240, faculty_count: 14 },
      { id: 4, code: 'CIVIL', name: 'Civil Engineering', hod_name: 'Dr. E. Sreedharan', student_count: 200, faculty_count: 12 },
    ],
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);

  // Load session & stats on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setCurrentUser(session);
      loadStats(session);
    }
    setLoadingUser(false);
  }, []);

  const loadStats = async (user) => {
    const fallbackStats = getInitialDashboardStats(user);
    const token = localStorage.getItem('alexandria_token');
    if (!token) {
      setDashboardStats(fallbackStats);
      return;
    }

    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data) {
        setDashboardStats(data);
      } else {
        setDashboardStats(fallbackStats);
      }
    } catch {
      setDashboardStats(fallbackStats);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    loadStats(user);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setDashboardStats(null);
  };

  const handleProfileUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    loadStats(updatedUser);
  };

  if (loadingUser) {
    return (
      <div style={{ backgroundColor: '#07080a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '24px' }}>
        Loading Hindusthan CSE Department Portal...
      </div>
    );
  }

  // If not logged in, render Auth Modal (role-select → register → login)
  if (!currentUser) {
    return (
      <AuthModal
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleLoginSuccess}
      />
    );
  }

  const statsToPass = dashboardStats || getInitialDashboardStats(currentUser);

  return (
    <div className="app-container">
      {/* Off-White Sidebar */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Canvas Area */}
      <main className="main-canvas">
        <TopHeader />

        {/* Dynamic Portal View based on User Role */}
        {currentUser.role === 'student' && (
          <StudentPortal stats={statsToPass} user={currentUser} activeTab={activeTab} />
        )}

        {currentUser.role === 'teacher' && (
          <TeacherPortal stats={statsToPass} user={currentUser} activeTab={activeTab} />
        )}

        {currentUser.role === 'hod' && (
          <HodPortal stats={statsToPass} user={currentUser} activeTab={activeTab} />
        )}

        {currentUser.role === 'admin' && (
          <AdminPortal stats={statsToPass} user={currentUser} activeTab={activeTab} />
        )}

        {/* Footer */}
        <footer className="alexandria-footer">
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: '#e6e6e6' }}>Hindusthan CSE Department</div>
          <div className="footer-links">
            <a href="#integrity" className="footer-link">Academic Integrity</a>
            <a href="#support" className="footer-link">Support</a>
            <a href="#policy" className="footer-link">Institutional Policy</a>
          </div>
          <div>© 2026 Hindusthan CSE Department. All rights reserved.</div>
        </footer>
      </main>

      {/* Post-Login Profile Completion Modal */}
      {currentUser.profile_completed === 0 && (
        <ProfileSetupModal
          user={currentUser}
          onProfileUpdated={handleProfileUpdated}
          updateSessionProfile={updateSessionProfile}
        />
      )}
    </div>
  );
}


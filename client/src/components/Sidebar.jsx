import React from 'react';
import { LayoutDashboard, Users, BookOpen, BarChart3, Settings, LogOut, ShieldAlert, GraduationCap, CheckSquare } from 'lucide-react';

export default function Sidebar({ currentUser, activeTab, setActiveTab, onLogout }) {
  if (!currentUser) return null;

  const roleLabels = {
    admin: 'System Admin',
    hod: 'HOD Academic Portal',
    teacher: 'Academic Professor',
    student: 'Student Portal'
  };

  const roleBadge = roleLabels[currentUser.role] || 'Academic Portal';
  const deptCode = currentUser.dept_code || 'CSE';

  return (
    <aside className="alexandria-sidebar">
      <div>
        <div className="brand-title">Hindusthan CSE Department</div>

        {/* Profile Card Block (Matches Screenshot) */}
        <div className="profile-card-mini">
          <div className="profile-avatar-box">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} />
            ) : (
              currentUser.name.charAt(0)
            )}
          </div>
          <div className="profile-info">
            <div className="profile-name">{currentUser.name}</div>
            <div className="profile-role">{deptCode} • {roleBadge}</div>
          </div>
        </div>

        {/* Navigation Links (Matches Screenshot) */}
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </div>

          {currentUser.role === 'student' && (
            <>
              <div 
                className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                <CheckSquare />
                <span>My Attendance</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                <BookOpen />
                <span>My CSE Courses</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`}
                onClick={() => setActiveTab('directory')}
              >
                <Users />
                <span>Faculty Directory</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'grades' ? 'active' : ''}`}
                onClick={() => setActiveTab('grades')}
              >
                <BarChart3 />
                <span>Grade Transcript</span>
              </div>
            </>
          )}

          {currentUser.role === 'teacher' && (
            <>
              <div 
                className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                <CheckSquare />
                <span>Take Attendance</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <Users />
                <span>CSE Students</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                <BookOpen />
                <span>Academic Control</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'grading' ? 'active' : ''}`}
                onClick={() => setActiveTab('grading')}
              >
                <BarChart3 />
                <span>Gradebook & Marks</span>
              </div>
            </>
          )}

          {currentUser.role === 'hod' && (
            <>
              <div 
                className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                <CheckSquare />
                <span>Class Attendance & Alerts</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'allocation' ? 'active' : ''}`}
                onClick={() => setActiveTab('allocation')}
              >
                <Users />
                <span>Subject & Faculty Allocations</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'curriculum' ? 'active' : ''}`}
                onClick={() => setActiveTab('curriculum')}
              >
                <BookOpen />
                <span>Curriculum & Syllabi</span>
              </div>
            </>
          )}

          {currentUser.role === 'admin' && (
            <>
              <div 
                className={`nav-item ${activeTab === 'departments' ? 'active' : ''}`}
                onClick={() => setActiveTab('departments')}
              >
                <GraduationCap />
                <span>Departments</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users />
                <span>User Management</span>
              </div>
              <div 
                className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveTab('attendance')}
              >
                <CheckSquare />
                <span>Institutional Attendance</span>
              </div>
            </>
          )}

          <div 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings />
            <span>Profile Settings</span>
          </div>
        </nav>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #ddd9cf' }}>
        <div className="nav-item" onClick={onLogout} style={{ color: '#a83232' }}>
          <LogOut />
          <span>Sign Out</span>
        </div>
      </div>
    </aside>
  );
}

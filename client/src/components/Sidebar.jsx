import React from 'react';
import { LayoutDashboard, Users, BookOpen, BarChart3, Settings, LogOut, ShieldAlert, GraduationCap, CheckSquare, FileText, Bell, MessageSquare, Clock, Award, Calendar, Send, Upload, AlertCircle, Megaphone } from 'lucide-react';

const navItemsByRole = {
  student: [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: 'study-materials', icon: FileText, label: 'Study Materials' },
    { key: 'assignments', icon: BookOpen, label: 'Assignments' },
    { key: 'attendance', icon: CheckSquare, label: 'My Attendance' },
    { key: 'timetable', icon: Calendar, label: 'Timetable' },
    { key: 'exams', icon: Clock, label: 'Exam Schedule' },
    { key: 'internal-marks', icon: BarChart3, label: 'Internal Marks' },
    { key: 'results', icon: Award, label: 'Results & CGPA' },
    { key: 'notifications', icon: Bell, label: 'Notifications' },
    { key: 'chat', icon: MessageSquare, label: 'Messages' },
    { key: 'discussions', icon: Megaphone, label: 'Discussion Forum' },
    { key: 'settings', icon: Settings, label: 'Profile Settings' },
  ],
  teacher: [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: 'study-materials', icon: Upload, label: 'Study Materials' },
    { key: 'assignments', icon: BookOpen, label: 'Assignments' },
    { key: 'attendance', icon: CheckSquare, label: 'Take Attendance' },
    { key: 'grading', icon: BarChart3, label: 'Gradebook' },
    { key: 'internal-marks', icon: Award, label: 'Internal Marks' },
    { key: 'notifications', icon: Bell, label: 'Notifications' },
    { key: 'chat', icon: MessageSquare, label: 'Messages' },
    { key: 'discussions', icon: Megaphone, label: 'Discussion Forum' },
    { key: 'settings', icon: Settings, label: 'Profile Settings' },
  ],
  hod: [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: 'faculty', icon: Users, label: 'Faculty Management' },
    { key: 'students', icon: Users, label: 'Student Management' },
    { key: 'curriculum', icon: BookOpen, label: 'Curriculum' },
    { key: 'attendance', icon: CheckSquare, label: 'Attendance Monitor' },
    { key: 'announcements', icon: Megaphone, label: 'Announcements' },
    { key: 'notifications', icon: Bell, label: 'Notifications' },
    { key: 'chat', icon: MessageSquare, label: 'HOD Communication' },
    { key: 'settings', icon: Settings, label: 'Profile Settings' },
  ],
  admin: [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: 'departments', icon: GraduationCap, label: 'Departments' },
    { key: 'users', icon: Users, label: 'User Management' },
    { key: 'attendance', icon: CheckSquare, label: 'Institutional Attendance' },
    { key: 'settings', icon: Settings, label: 'Profile Settings' },
  ],
};

const roleLabels = {
  admin: 'System Admin',
  hod: 'HOD Academic Portal',
  teacher: 'Academic Professor',
  student: 'Student Portal',
};

export default function Sidebar({ currentUser, activeTab, setActiveTab, onLogout }) {
  if (!currentUser) return null;

  const roleBadge = roleLabels[currentUser.role] || 'Academic Portal';
  const deptCode = currentUser.dept_code || 'CSE';
  const navItems = navItemsByRole[currentUser.role] || [];

  return (
    <aside className="alexandria-sidebar">
      <div>
        <div className="brand-title">Hindusthan CSE Department</div>

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

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <Icon />
                <span>{item.label}</span>
              </div>
            );
          })}
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

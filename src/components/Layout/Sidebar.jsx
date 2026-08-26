import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  FileSpreadsheet,
  CheckSquare,
  FolderDown,
  FileText,
  Bell,
  BarChart3,
  Award,
  LogOut,
  Sliders,
  Settings,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout } = useERP();

  if (!currentUser) return null;

  const role = currentUser.role; // 'HOD' | 'Faculty' | 'Student'

  const getNavItems = () => {
    if (role === 'HOD') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'faculty-mgmt', label: 'Faculty Management', icon: UserCheck },
        { id: 'student-mgmt', label: 'Students', icon: GraduationCap },
        { id: 'subjects', label: 'Academic Control', icon: Sliders },
        { id: 'timetable', label: 'Timetable', icon: CalendarDays },
        { id: 'exam-timetable', label: 'Exam Schedule', icon: FileSpreadsheet },
        { id: 'attendance', label: 'Attendance', icon: CheckSquare },
        { id: 'materials', label: 'Study Materials', icon: FolderDown },
        { id: 'assignments', label: 'Assignments', icon: FileText },
        { id: 'announcements', label: 'Announcements', icon: Bell },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
      ];
    }

    if (role === 'Faculty') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'student-mgmt', label: 'Students', icon: Users },
        { id: 'subjects', label: 'Academic Control', icon: Sliders },
        { id: 'take-attendance', label: 'Take Attendance', icon: CheckSquare },
        { id: 'attendance-history', label: 'Attendance History', icon: BarChart3 },
        { id: 'materials', label: 'Upload Materials', icon: FolderDown },
        { id: 'assignments', label: 'Upload Assignments', icon: FileText },
        { id: 'submissions', label: 'Student Submissions', icon: Award },
        { id: 'announcements', label: 'Announcements', icon: Bell },
      ];
    }

    // Student
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'my-timetable', label: "Today's Schedule", icon: CalendarDays },
      { id: 'my-attendance', label: 'Attendance %', icon: CheckSquare },
      { id: 'materials', label: 'Study Materials', icon: FolderDown },
      { id: 'assignments', label: 'Assignments & Marks', icon: FileText },
      { id: 'exam-timetable', label: 'Exam Schedule', icon: FileSpreadsheet },
      { id: 'announcements', label: 'Announcements', icon: Bell },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-[#ececeb] text-slate-800 border-r border-[#dcdcd9] flex flex-col shrink-0 min-h-screen select-none justify-between">
      <div>
        {/* Top Header Logo */}
        <div className="p-6">
          <h1 className="font-serif font-bold text-2xl text-[#1d4ed8] tracking-tight">
            Alexandria
          </h1>
        </div>

        {/* Profile / Portal Identifier Card */}
        <div className="px-4 mb-4">
          <div className="bg-[#dfdfe2] p-3 rounded-lg flex items-center gap-3 border border-[#d4d4d8]">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded object-cover border border-slate-300 shrink-0"
            />
            <div className="overflow-hidden">
              <h3 className="text-xs font-bold text-slate-900 truncate">Alexandria</h3>
              <span className="text-[11px] text-slate-600 block leading-none mt-0.5">
                Academic Portal
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-[#1d4ed8] shadow-sm border border-slate-200/80 font-bold'
                    : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#e4e4e7]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1d4ed8]' : 'text-[#6b7280]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Details as seen in Alexandria UI */}
      <div className="p-4 border-t border-[#dcdcd9] space-y-3">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out ({currentUser.role})
        </button>

        <div className="text-[10px] text-slate-500 space-y-1 border-t border-slate-300/60 pt-2">
          <div className="font-bold text-slate-800">Alexandria</div>
          <div className="flex flex-wrap gap-2 text-[9px] text-slate-500">
            <span>Academic Integrity</span>
            <span>Support</span>
            <span>Policy</span>
          </div>
          <div className="text-[9px] text-slate-400">
            © 2026 Alexandria Educational Systems. All rights reserved.
          </div>
        </div>
      </div>
    </aside>
  );
};

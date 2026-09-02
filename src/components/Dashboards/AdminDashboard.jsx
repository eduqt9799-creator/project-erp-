import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Users,
  GraduationCap,
  BookOpen,
  FolderDown,
  Calendar,
  FileSpreadsheet,
  Bell,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const AdminDashboard = ({ setActiveTab }) => {
  const { users, subjects, materials, announcements, attendance, currentUser } = useERP();

  const facultyCount = users.filter(u => u.role === 'Faculty').length;
  const studentCount = users.filter(u => u.role === 'Student').length;
  const subjectCount = subjects.length;
  const materialCount = materials.length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Alexandria Style Welcome Banner */}
      <div className="space-y-3 pt-2">
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-slate-200 tracking-tight">
          Welcome back, {currentUser?.name?.split(' ')[0] || 'Administrator'}.
        </h1>
        <p className="font-serif text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
          Here is a curated overview of your academic day. The archives await your direction.
        </p>
      </div>

      {/* Main White Overview Card matching Alexandria layout */}
      <div className="alexandria-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-slate-900">
              Department Academic Status
            </h2>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mt-1">
              COMPUTER SCIENCE & ENGINEERING • AY 2026-27
            </span>
          </div>

          <button
            onClick={() => setActiveTab('timetable')}
            className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider hover:underline"
          >
            VIEW FULL WEEK TIMETABLE →
          </button>
        </div>

        {/* 4 Stat Column Box Grid inside white card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Faculty Roster</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{facultyCount}</div>
            <span className="text-xs text-slate-600 font-medium block mt-1">Professors & Instructors</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Enrolled Students</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{studentCount}</div>
            <span className="text-xs text-slate-600 font-medium block mt-1">Semesters 3 & 5</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Subjects</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{subjectCount}</div>
            <span className="text-xs text-slate-600 font-medium block mt-1">19 Total Credits</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Repository Items</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{materialCount}</div>
            <span className="text-xs text-slate-600 font-medium block mt-1">Shared Study Resources</span>
          </div>
        </div>
      </div>

      {/* Grid Split Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* White Card: Bulletins */}
        <div className="alexandria-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-serif text-xl font-semibold text-slate-900">
              Department Bulletins
            </h3>
            <button
              onClick={() => setActiveTab('announcements')}
              className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider hover:underline"
            >
              VIEW ALL →
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span className="text-[#1d4ed8]">{ann.category}</span>
                  <span>{ann.date}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* White Card: Recent Attendance Sessions */}
        <div className="alexandria-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-serif text-xl font-semibold text-slate-900">
              Attendance Records
            </h3>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider hover:underline"
            >
              FULL REPORTS →
            </button>
          </div>

          <div className="space-y-3">
            {attendance.map(att => {
              const records = Object.values(att.records);
              const presentCount = records.filter(r => r === 'Present').length;
              const totalCount = records.length;
              const percent = Math.round((presentCount / totalCount) * 100);

              return (
                <div key={att.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{att.subjectName}</h4>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {att.className} • {att.date} • {att.period}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${percent >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {percent}% Present
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {presentCount}/{totalCount} Students
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

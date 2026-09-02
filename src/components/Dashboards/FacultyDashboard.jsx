import React from 'react';
import { useERP } from '../../context/ERPContext';
import { CheckSquare, FolderUp, BookOpen, CalendarDays, Award, ArrowRight } from 'lucide-react';

export const FacultyDashboard = ({ setActiveTab }) => {
  const { currentUser, subjects, assignments, submissions, materials, timetable } = useERP();

  const assignedSubjects = subjects.filter(s => s.facultyId === currentUser?.id || s.facultyName === currentUser?.name);
  const pendingSubmissions = submissions.filter(s => s.status === 'Submitted');
  const todayClasses = timetable['5']?.['Monday'] || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Alexandria Style Welcome Banner */}
      <div className="space-y-3 pt-2">
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-slate-200 tracking-tight">
          Welcome back, Professor.
        </h1>
        <p className="font-serif text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
          Here is a curated overview of your academic day. The archives await your direction.
        </p>
      </div>

      {/* Main White Overview Card matching Alexandria layout */}
      <div className="alexandria-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              MONDAY, AUGUST 26
            </span>
            <h2 className="font-serif text-2xl font-semibold text-slate-900">
              Today's Schedule
            </h2>
          </div>

          <button
            onClick={() => setActiveTab('my-timetable')}
            className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider hover:underline"
          >
            VIEW FULL WEEK →
          </button>
        </div>

        {/* Schedule List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {todayClasses.slice(0, 3).map(cls => (
            <div key={cls.period} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>PERIOD {cls.period}</span>
                <span className="text-[#1d4ed8] font-mono">{cls.time}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{cls.subjectName}</h3>
              <div className="text-xs text-slate-600 flex justify-between">
                <span>📍 {cls.room}</span>
                <span className="font-semibold text-slate-700">{cls.subjectCode}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="alexandria-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Course Syllabus</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{assignedSubjects.length} Courses</div>
            <p className="text-xs text-slate-600 mt-1">Semester 3 & 5 Teaching Portfolio</p>
          </div>
          <button
            onClick={() => setActiveTab('my-subjects')}
            className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider hover:underline text-left"
          >
            VIEW SYLLABUS →
          </button>
        </div>

        <div className="alexandria-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Evaluation Hub</span>
            <div className="text-3xl font-extrabold text-amber-600 mt-1">{pendingSubmissions.length} Submissions</div>
            <p className="text-xs text-slate-600 mt-1">Pending Student Assignments to Score</p>
          </div>
          <button
            onClick={() => setActiveTab('submissions')}
            className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider hover:underline text-left"
          >
            REVIEW & GRADE →
          </button>
        </div>

        <div className="alexandria-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance Registry</span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">Interactive</div>
            <p className="text-xs text-slate-600 mt-1">Mark daily roll roster & save to student logs</p>
          </div>
          <button
            onClick={() => setActiveTab('take-attendance')}
            className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider hover:underline text-left"
          >
            TAKE ATTENDANCE NOW →
          </button>
        </div>
      </div>
    </div>
  );
};

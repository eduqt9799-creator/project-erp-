import React from 'react';
import { useERP } from '../../context/ERPContext';
import { CalendarDays, CheckCircle2, FileText, Bell, Award, ArrowRight } from 'lucide-react';

export const StudentDashboard = ({ setActiveTab }) => {
  const { currentUser, timetable, attendance, assignments, submissions, announcements } = useERP();

  const rollNo = currentUser?.rollNo || '2024-CSE-001';
  const semester = currentUser?.semester || '5';

  // Overall attendance calculation
  let totalClasses = 0;
  let presentClasses = 0;
  attendance.forEach(session => {
    if (session.records && session.records[rollNo]) {
      totalClasses++;
      if (session.records[rollNo] === 'Present') presentClasses++;
    }
  });

  const overallPercent = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 92;
  const todayClasses = timetable[semester]?.['Monday'] || [];
  const activeAssignments = assignments.filter(a => a.semester === semester);
  const mySubmissions = submissions.filter(s => s.studentId === currentUser?.id || s.rollNo === rollNo);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Alexandria Style Welcome Banner */}
      <div className="space-y-3 pt-2">
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-slate-200 tracking-tight">
          Welcome back, {currentUser?.name?.split(' ')[0] || 'Student'}.
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

        {/* Schedule Grid */}
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
                <span className="font-semibold text-slate-700">{cls.faculty}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Split: Attendance Score & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Score Card */}
        <div className="alexandria-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-serif text-xl font-semibold text-slate-900">
              Attendance Performance
            </h3>
            <button
              onClick={() => setActiveTab('my-attendance')}
              className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider hover:underline"
            >
              VIEW DETAILS →
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cumulative Ratio</span>
              <div className={`text-3xl font-extrabold mt-1 ${overallPercent >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {overallPercent}%
              </div>
              <span className="text-xs text-slate-600 block mt-1">
                {overallPercent >= 75 ? '✅ Above 75% Requirement' : '⚠️ Shortage Warning'}
              </span>
            </div>

            <div className="text-right text-xs text-slate-600 space-y-1">
              <div>Attended: <strong className="text-slate-900">{presentClasses}</strong></div>
              <div>Total Sessions: <strong className="text-slate-900">{totalClasses}</strong></div>
            </div>
          </div>
        </div>

        {/* Active Assignments Card */}
        <div className="alexandria-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-serif text-xl font-semibold text-slate-900">
              Active Coursework
            </h3>
            <button
              onClick={() => setActiveTab('assignments')}
              className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider hover:underline"
            >
              SUBMIT & MARKS →
            </button>
          </div>

          <div className="space-y-3">
            {activeAssignments.map(asg => {
              const sub = mySubmissions.find(s => s.assignmentId === asg.id);

              return (
                <div key={asg.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#1d4ed8] uppercase">{asg.subjectCode}</span>
                    <h4 className="font-bold text-slate-900 text-xs">{asg.title}</h4>
                    <span className="text-[11px] text-slate-500 block">Due: {asg.dueDate}</span>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    sub?.status === 'Graded'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sub
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {sub?.status === 'Graded' ? `${sub.marks}/100` : sub ? 'Submitted' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

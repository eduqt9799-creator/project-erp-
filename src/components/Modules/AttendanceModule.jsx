import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  Calendar,
  BarChart2,
  FileCheck
} from 'lucide-react';

export const AttendanceModule = () => {
  const { currentUser, users, subjects, attendance, saveAttendanceSession } = useERP();
  const role = currentUser?.role || 'Student';

  // Filters for Faculty / Admin Marking Form
  const [selectedClass, setSelectedClass] = useState('CSE-A');
  const [selectedSem, setSelectedSem] = useState('5');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('CS501');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('Period 1');

  const studentList = users.filter(u => u.role === 'Student' && u.semester === selectedSem);

  const [records, setRecords] = useState(() => {
    const init = {};
    studentList.forEach(s => { init[s.rollNo] = 'Present'; });
    return init;
  });

  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  const handleToggle = (rollNo, status) => {
    setRecords(prev => ({ ...prev, [rollNo]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated = {};
    studentList.forEach(s => { updated[s.rollNo] = 'Present'; });
    setRecords(updated);
  };

  const handleReset = () => {
    const updated = {};
    studentList.forEach(s => { updated[s.rollNo] = 'Absent'; });
    setRecords(updated);
  };

  const handleSaveAttendance = () => {
    const subObj = subjects.find(s => s.code === selectedSubjectCode);
    const sessionPayload = {
      className: selectedClass,
      semester: selectedSem,
      subjectCode: selectedSubjectCode,
      subjectName: subObj ? subObj.name : 'Web Technologies',
      date: selectedDate,
      period: selectedPeriod,
      records
    };

    saveAttendanceSession(sessionPayload);
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  // Student portal view calculations
  const myRollNo = currentUser?.rollNo || '2024-CSE-001';
  const mySessions = attendance.filter(a => a.semester === (currentUser?.semester || '5'));

  const subjectBreakdown = {};
  subjects.filter(s => s.semester === (currentUser?.semester || '5')).forEach(sub => {
    subjectBreakdown[sub.code] = { name: sub.name, total: 0, present: 0 };
  });

  let totalClassesCount = 0;
  let totalPresentCount = 0;

  mySessions.forEach(sess => {
    const status = sess.records ? sess.records[myRollNo] : null;
    if (status) {
      totalClassesCount++;
      if (status === 'Present') totalPresentCount++;

      if (subjectBreakdown[sess.subjectCode]) {
        subjectBreakdown[sess.subjectCode].total++;
        if (status === 'Present') subjectBreakdown[sess.subjectCode].present++;
      }
    }
  });

  const studentOverallPercent = totalClassesCount > 0
    ? Math.round((totalPresentCount / totalClassesCount) * 100)
    : 92;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* FACULTY & ADMIN ATTENDANCE MARKING WORKFLOW */}
      {(role === 'Faculty' || role === 'HOD') && (
        <div className="space-y-6">
          <div className="alexandria-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-slate-900">Attendance Registry Marker</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select Class → Semester → Subject → Date → Period</p>
              </div>
            </div>

            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Section</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="CSE-A">CSE - Section A</option>
                  <option value="CSE-B">CSE - Section B</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                <select
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="5">Semester 5</option>
                  <option value="3">Semester 3</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={selectedSubjectCode}
                  onChange={(e) => setSelectedSubjectCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  {subjects.filter(s => s.semester === selectedSem).map(s => (
                    <option key={s.id} value={s.code}>{s.code}: {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Period Slot</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="Period 1">Period 1 (09:00 - 10:00)</option>
                  <option value="Period 2">Period 2 (10:00 - 11:00)</option>
                  <option value="Period 3">Period 3 (11:15 - 12:15)</option>
                  <option value="Period 4">Period 4 (01:15 - 02:15)</option>
                  <option value="Period 5">Period 5 (02:15 - 03:15)</option>
                  <option value="Period 6">Period 6 (03:15 - 04:15)</option>
                </select>
              </div>
            </div>
          </div>

          {savedSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Attendance recorded & synchronized live to Student Portal!</span>
              </div>
              <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                {Object.values(records).filter(r => r === 'Present').length} Present / {studentList.length} Total
              </span>
            </div>
          )}

          {/* Student Roster Table */}
          <div className="alexandria-card overflow-hidden space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Student Roll Roster ({studentList.length})</h3>
                <span className="text-xs text-slate-500 font-semibold">{selectedClass} • Sem {selectedSem} • {selectedPeriod}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-3 py-1.5 bg-blue-50 text-[#1d4ed8] border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200"
                >
                  Reset / Clear
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="px-4 py-1.5 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Save className="w-4 h-4" /> Save Attendance
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Status</th>
                    <th className="text-right">Action Switch</th>
                  </tr>
                </thead>
                <tbody>
                  {studentList.map(stu => {
                    const status = records[stu.rollNo] || 'Present';
                    const isPresent = status === 'Present';

                    return (
                      <tr key={stu.id}>
                        <td>
                          <span className="font-mono text-xs font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {stu.rollNo}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <img
                              src={stu.avatar}
                              alt={stu.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <span className="font-bold text-slate-900">{stu.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 ${
                            isPresent
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isPresent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {status}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-300">
                            <button
                              type="button"
                              onClick={() => handleToggle(stu.rollNo, 'Present')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                isPresent ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggle(stu.rollNo, 'Absent')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                !isPresent ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT PORTAL ATTENDANCE VIEW */}
      {role === 'Student' && (
        <div className="space-y-6">
          <div className="alexandria-card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cumulative Attendance Ratio</span>
              <h2 className="font-serif text-3xl font-bold text-slate-900">
                {studentOverallPercent}% Overall Attendance
              </h2>
              <p className="text-xs text-slate-600">
                Minimum required percentage for examination eligibility is <strong>75%</strong>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Attended</span>
                <span className="text-lg font-black text-emerald-600">{totalPresentCount} Classes</span>
              </div>
              <div className="text-center px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Sessions</span>
                <span className="text-lg font-black text-slate-900">{totalClassesCount} Classes</span>
              </div>
            </div>
          </div>

          <div className="alexandria-card p-6 space-y-4">
            <h3 className="font-serif font-bold text-xl text-slate-900">
              Subject-Wise Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(subjectBreakdown).map(([code, item]) => {
                const subPct = item.total > 0 ? Math.round((item.present / item.total) * 100) : 90;

                return (
                  <div key={code} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#1d4ed8]">{code}</span>
                        <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                      </div>
                      <span className={`text-base font-extrabold ${subPct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {subPct}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${subPct >= 75 ? 'bg-emerald-600' : 'bg-rose-600'}`}
                        style={{ width: `${subPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Attended: {item.present} / {item.total} sessions</span>
                      <span>Status: {subPct >= 75 ? 'On Track' : 'Warning'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

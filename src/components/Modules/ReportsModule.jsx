import React from 'react';
import { useERP } from '../../context/ERPContext';
import { BarChart3, Download } from 'lucide-react';

export const ReportsModule = () => {
  const { users, attendance } = useERP();
  const students = users.filter(u => u.role === 'Student');

  const studentStats = students.map(s => {
    let total = 0;
    let present = 0;
    attendance.forEach(a => {
      if (a.records && a.records[s.rollNo]) {
        total++;
        if (a.records[s.rollNo] === 'Present') present++;
      }
    });
    const pct = total > 0 ? Math.round((present / total) * 100) : 90;
    return { ...s, total, present, pct };
  });

  const lowAttendanceList = studentStats.filter(s => s.pct < 75);

  const handleExportCSV = () => {
    let csv = 'RollNo,Name,Semester,TotalClasses,AttendedClasses,Percentage\n';
    studentStats.forEach(s => {
      csv += `${s.rollNo},${s.name},${s.semester},${s.total},${s.present},${s.pct}%\n`;
    });

    const element = document.createElement('a');
    const file = new Blob([csv], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = 'Department_Attendance_Report_2026.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="alexandria-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900">Academic & Attendance Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">Exportable roster analytics and low-attendance tracking</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm uppercase tracking-wider transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="alexandria-card p-6">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Department Attendance Ratio</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">89.4%</div>
          <span className="text-xs text-slate-600 block mt-1">Semester 5 Average</span>
        </div>

        <div className="alexandria-card p-6">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Sessions Conducted</span>
          <div className="text-3xl font-extrabold text-[#1d4ed8] mt-1">{attendance.length} Sessions</div>
          <span className="text-xs text-slate-600 block mt-1">Across All Courses</span>
        </div>

        <div className="alexandria-card p-6">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Shortage Alerts (&lt;75%)</span>
          <div className="text-3xl font-extrabold text-rose-600 mt-1">{lowAttendanceList.length} Students</div>
          <span className="text-xs text-rose-600 font-semibold block mt-1">Shortage Action Needed</span>
        </div>
      </div>

      <div className="alexandria-card p-6 space-y-4">
        <h3 className="font-serif font-bold text-xl text-slate-900">Student Roster Attendance Performance</h3>

        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Semester</th>
                <th>Sessions Held</th>
                <th>Attended</th>
                <th>Percentage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.map(s => (
                <tr key={s.id}>
                  <td className="font-mono text-xs font-bold text-[#1d4ed8]">{s.rollNo}</td>
                  <td className="font-bold text-slate-900">{s.name}</td>
                  <td className="text-slate-700">Sem {s.semester}</td>
                  <td>{s.total}</td>
                  <td>{s.present}</td>
                  <td className={`font-extrabold ${s.pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {s.pct}%
                  </td>
                  <td>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      s.pct >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {s.pct >= 75 ? 'Eligible' : 'Shortage'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

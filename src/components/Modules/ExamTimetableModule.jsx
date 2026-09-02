import React from 'react';
import { useERP } from '../../context/ERPContext';
import { FileSpreadsheet, Calendar, Clock, MapPin } from 'lucide-react';

export const ExamTimetableModule = () => {
  const { exams } = useERP();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="alexandria-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900">Mid-Semester Examination Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">Official examination dates, time slots, and hall seating allocations</p>
        </div>
        <span className="text-xs font-bold text-[#1d4ed8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 uppercase tracking-wider">
          Semester 5 Examination
        </span>
      </div>

      <div className="alexandria-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Time Slot</th>
                <th>Exam Hall Location</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(e => (
                <tr key={e.id}>
                  <td className="font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#1d4ed8]" /> {e.date}
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {e.code}
                    </span>
                  </td>
                  <td className="font-bold text-slate-900">{e.name}</td>
                  <td className="text-slate-700 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> {e.time}
                    </span>
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {e.hall}
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

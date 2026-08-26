import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { CalendarDays, Edit3, Save, X, Trash2, CheckCircle2 } from 'lucide-react';

export const TimetableModule = () => {
  const { currentUser, timetable, updateTimetableCell, subjects } = useERP();
  const role = currentUser?.role || 'Student';

  const [selectedSem, setSelectedSem] = useState('5');
  const [editingCell, setEditingCell] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    { num: 1, defaultTime: '09:00 - 10:00' },
    { num: 2, defaultTime: '10:00 - 11:00' },
    { num: 3, defaultTime: '11:15 - 12:15' },
    { num: 4, defaultTime: '01:15 - 02:15' },
    { num: 5, defaultTime: '02:15 - 03:15' },
    { num: 6, defaultTime: '03:15 - 04:15' },
  ];

  const semTimetable = timetable[selectedSem] || {};

  const handleCellClick = (day, periodObj, cellData) => {
    if (role === 'Student') return;

    setEditingCell({
      day,
      periodNum: periodObj.num,
      subjectCode: cellData?.subjectCode || 'CS501',
      subjectName: cellData?.subjectName || 'Web Technologies',
      faculty: cellData?.faculty || 'Prof. Robert Smith',
      room: cellData?.room || 'Hall 201',
      time: cellData?.time || periodObj.defaultTime
    });
  };

  const handleSaveCell = (e) => {
    e.preventDefault();
    if (!editingCell) return;

    updateTimetableCell(selectedSem, editingCell.day, editingCell.periodNum, {
      subjectCode: editingCell.subjectCode,
      subjectName: editingCell.subjectName,
      faculty: editingCell.faculty,
      room: editingCell.room,
      time: editingCell.time
    });

    setEditingCell(null);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const handleDeleteCell = () => {
    if (!editingCell) return;
    updateTimetableCell(selectedSem, editingCell.day, editingCell.periodNum, {
      subjectCode: 'FREE',
      subjectName: 'Self Study / Free Period',
      faculty: '-',
      room: 'Library',
      time: editingCell.time
    });
    setEditingCell(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Controls */}
      <div className="alexandria-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900">Master Timetable Matrix</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {role !== 'Student'
              ? 'Click any matrix cell below to modify subjects, instructors, or classroom assignments in real time.'
              : 'Synchronized weekly class schedule.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700">Semester:</label>
          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none font-bold"
          >
            <option value="5">Semester 5 (CSE-A)</option>
            <option value="3">Semester 3 (CSE-B)</option>
          </select>
        </div>
      </div>

      {showSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Timetable cell updated & live-synced to Student Portals!</span>
        </div>
      )}

      {/* Excel Table Matrix Grid White Theme */}
      <div className="alexandria-card p-4 overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
              <th className="p-3.5 w-32 border-r border-slate-200">Day / Slot</th>
              {periods.map(p => (
                <th key={p.num} className="p-3.5 text-center border-r border-slate-200 last:border-none">
                  <div>Period {p.num}</div>
                  <div className="text-[10px] font-normal text-slate-500">{p.defaultTime}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {days.map(day => {
              const daySlots = semTimetable[day] || [];

              return (
                <tr key={day} className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-200">
                    {day}
                  </td>
                  {periods.map(p => {
                    const slotData = daySlots.find(s => s.period === p.num);
                    const isFree = !slotData || slotData.subjectCode === 'FREE';

                    return (
                      <td
                        key={p.num}
                        onClick={() => handleCellClick(day, p, slotData)}
                        className={`p-2.5 border-r border-slate-200 last:border-none transition-all ${
                          role !== 'Student' ? 'cursor-pointer hover:bg-blue-50/60' : ''
                        }`}
                      >
                        {isFree ? (
                          <div className="p-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 text-[11px] h-full flex flex-col justify-center">
                            <span>{slotData ? slotData.subjectName : 'Free Period'}</span>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-white border border-slate-300 rounded-lg shadow-sm space-y-1 hover:border-[#1d4ed8] transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {slotData.subjectName}
                              </span>
                              <span className="text-[9px] font-bold text-[#1d4ed8] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                                {slotData.subjectCode}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-600 truncate font-medium">
                              {slotData.faculty}
                            </div>
                            <div className="text-[10px] text-slate-500 flex justify-between pt-0.5">
                              <span>📍 {slotData.room}</span>
                              {role !== 'Student' && <Edit3 className="w-3 h-3 text-[#1d4ed8] opacity-70" />}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cell Editor Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Edit Slot ({editingCell.day} - Period {editingCell.periodNum})
              </h3>
              <button onClick={() => setEditingCell(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCell} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={editingCell.subjectCode}
                  onChange={(e) => {
                    const sub = subjects.find(s => s.code === e.target.value);
                    setEditingCell({
                      ...editingCell,
                      subjectCode: e.target.value,
                      subjectName: sub ? sub.name : e.target.value,
                      faculty: sub ? sub.facultyName : editingCell.faculty
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="FREE">Free Period / Self Study</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty In-Charge</label>
                <input
                  type="text"
                  required
                  value={editingCell.faculty}
                  onChange={(e) => setEditingCell({ ...editingCell, faculty: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    required
                    value={editingCell.room}
                    onChange={(e) => setEditingCell({ ...editingCell, room: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    value={editingCell.time}
                    onChange={(e) => setEditingCell({ ...editingCell, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleDeleteCell}
                  className="py-2.5 px-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg"
                >
                  Clear Slot
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm"
                >
                  Update & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

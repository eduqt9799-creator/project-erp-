import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { UserPlus, Edit3, Trash2, Search, Filter, GraduationCap, X } from 'lucide-react';

export const StudentManagement = () => {
  const { users, addStudent, updateStudent, deleteStudent } = useERP();
  const studentList = users.filter(u => u.role === 'Student');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSem, setSelectedSem] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNo: '',
    semester: '5',
    section: 'A',
    department: 'Computer Science & Engineering',
    avatar: ''
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      rollNo: `2024-CSE-0${Math.floor(Math.random() * 80 + 10)}`,
      semester: '5',
      section: 'A',
      department: 'Computer Science & Engineering',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (stu) => {
    setEditingId(stu.id);
    setFormData({
      name: stu.name,
      email: stu.email,
      rollNo: stu.rollNo,
      semester: stu.semester || '5',
      section: stu.section || 'A',
      department: stu.department || 'Computer Science & Engineering',
      avatar: stu.avatar
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateStudent(editingId, formData);
    } else {
      addStudent(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove student ${name}?`)) {
      deleteStudent(id);
    }
  };

  const filteredStudents = studentList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSem = selectedSem === 'All' || s.semester === selectedSem;
    return matchesSearch && matchesSem;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Actions */}
      <div className="alexandria-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900">Student Roster Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Enrolled student profiles, semester sections, and roll numbers</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or roll..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Sem:</span>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
            >
              <option value="All">All Semesters</option>
              <option value="5">Semester 5</option>
              <option value="3">Semester 3</option>
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm uppercase tracking-wider transition-all"
          >
            <UserPlus className="w-4 h-4" /> Enroll Student
          </button>
        </div>
      </div>

      {/* Student Table */}
      <div className="alexandria-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Semester & Section</th>
                <th>Email</th>
                <th>Department</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(stu => (
                <tr key={stu.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={stu.avatar}
                        alt={stu.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <span className="font-bold text-slate-900">{stu.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {stu.rollNo}
                    </span>
                  </td>
                  <td className="text-slate-700 font-medium">Sem {stu.semester} - Section {stu.section || 'A'}</td>
                  <td className="text-slate-600">{stu.email}</td>
                  <td className="text-slate-600">{stu.department}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(stu)}
                        className="p-1.5 text-slate-400 hover:text-[#1d4ed8] hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(stu.id, stu.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                {editingId ? 'Edit Student Details' : 'Enroll New Student'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Student Name"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#1d4ed8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="2024-CSE-001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@college.edu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="1">Semester 1</option>
                    <option value="3">Semester 3</option>
                    <option value="5">Semester 5</option>
                    <option value="7">Semester 7</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider"
                >
                  {editingId ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

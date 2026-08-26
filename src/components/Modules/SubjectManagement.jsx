import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { BookOpen, Plus, Edit3, Trash2, UserCheck, X } from 'lucide-react';

export const SubjectManagement = () => {
  const { subjects, users, addSubject, updateSubject, deleteSubject } = useERP();
  const facultyMembers = users.filter(u => u.role === 'Faculty' || u.role === 'HOD');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    semester: '5',
    department: 'CSE',
    credits: 4,
    facultyId: '',
    facultyName: ''
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      code: 'CS505',
      name: 'Software Engineering Principles',
      semester: '5',
      department: 'CSE',
      credits: 4,
      facultyId: facultyMembers[0]?.id || '',
      facultyName: facultyMembers[0]?.name || ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingId(sub.id);
    setFormData({
      code: sub.code,
      name: sub.name,
      semester: sub.semester,
      department: sub.department || 'CSE',
      credits: sub.credits || 4,
      facultyId: sub.facultyId || '',
      facultyName: sub.facultyName || ''
    });
    setShowModal(true);
  };

  const handleFacultySelect = (facultyId) => {
    const selected = facultyMembers.find(f => f.id === facultyId);
    setFormData({
      ...formData,
      facultyId,
      facultyName: selected ? selected.name : ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateSubject(editingId, formData);
    } else {
      addSubject(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete course subject "${name}"?`)) {
      deleteSubject(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="alexandria-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900">Academic Curriculum Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure course offerings, credit weights, and faculty allocations</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm uppercase tracking-wider transition-all"
        >
          <Plus className="w-4 h-4" /> Create Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map(sub => (
          <div key={sub.id} className="alexandria-card p-6 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {sub.code}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">Semester {sub.semester}</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-slate-900 mt-1">{sub.name}</h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(sub)}
                  className="p-1.5 text-slate-400 hover:text-[#1d4ed8] hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(sub.id, sub.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#1d4ed8]" />
                <span>Instructor: <strong className="text-slate-900">{sub.facultyName || 'Unassigned'}</strong></span>
              </div>
              <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {sub.credits} Credits
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                {editingId ? 'Edit Subject Details' : 'Add New Subject'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="CS501"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1d4ed8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Subject Title"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#1d4ed8]"
                />
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Faculty</label>
                  <select
                    value={formData.facultyId}
                    onChange={(e) => handleFacultySelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">Select Faculty...</option>
                    {facultyMembers.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
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
                  {editingId ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

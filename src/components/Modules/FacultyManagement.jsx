import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { UserPlus, Edit3, Trash2, Mail, Phone, BookOpen, Search, X } from 'lucide-react';

export const FacultyManagement = () => {
  const { users, addFaculty, updateFaculty, deleteFaculty, subjects } = useERP();
  const facultyList = users.filter(u => u.role === 'Faculty');

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: 'Assistant Professor',
    department: 'Computer Science & Engineering',
    phone: '',
    avatar: ''
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      designation: 'Assistant Professor',
      department: 'Computer Science & Engineering',
      phone: '+1 (555) 019-2834',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (fac) => {
    setEditingId(fac.id);
    setFormData({
      name: fac.name,
      email: fac.email,
      designation: fac.designation || 'Assistant Professor',
      department: fac.department || 'Computer Science & Engineering',
      phone: fac.phone || '+1 (555) 019-2834',
      avatar: fac.avatar
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateFaculty(editingId, formData);
    } else {
      addFaculty(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from Faculty?`)) {
      deleteFaculty(id);
    }
  };

  const filteredFaculty = facultyList.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Actions */}
      <div className="alexandria-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900">Faculty Roster Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage department professors, designations, and academic course allocations</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty by name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm uppercase tracking-wider transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add Faculty
          </button>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map(fac => {
          const assignedSubs = subjects.filter(s => s.facultyId === fac.id || s.facultyName === fac.name);

          return (
            <div key={fac.id} className="alexandria-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={fac.avatar}
                      alt={fac.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h3 className="font-serif font-bold text-base text-slate-900">{fac.name}</h3>
                      <span className="text-xs font-semibold text-[#1d4ed8] block">{fac.designation}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(fac)}
                      className="p-1.5 text-slate-400 hover:text-[#1d4ed8] hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(fac.id, fac.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fac.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fac.phone || '+1 (555) 019-2834'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Assigned Courses ({assignedSubs.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {assignedSubs.length > 0 ? (
                    assignedSubs.map(s => (
                      <span key={s.id} className="text-[10px] font-bold bg-blue-50 text-[#1d4ed8] border border-blue-200 px-2 py-0.5 rounded-md">
                        {s.code}: {s.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No subject assigned</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Faculty Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                {editingId ? 'Edit Faculty Details' : 'Add New Faculty Member'}
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
                  placeholder="Prof. Jane Doe"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="faculty@college.edu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Senior Assistant Professor">Senior Assistant Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-[#1d4ed8] focus:bg-white"
                />
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
                  className="flex-1 py-2.5 px-4 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm"
                >
                  {editingId ? 'Save Changes' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

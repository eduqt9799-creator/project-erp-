import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Bell, Plus, Send, Trash2, X } from 'lucide-react';

export const AnnouncementsModule = () => {
  const { currentUser, announcements, postAnnouncement, deleteAnnouncement } = useERP();
  const role = currentUser?.role || 'Student';

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRole: 'All',
    department: 'CSE',
    semester: '5',
    category: 'Academic'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    postAnnouncement(formData);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this announcement?')) {
      deleteAnnouncement(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="alexandria-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900">Department Bulletins & Broadcasts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Post official notifications targeted to students, specific semesters, or faculty members</p>
        </div>

        {(role === 'HOD' || role === 'Faculty') && (
          <button
            onClick={() => {
              setFormData({
                title: '',
                message: '',
                targetRole: role === 'HOD' ? 'All' : 'Students',
                department: 'CSE',
                semester: '5',
                category: 'Academic'
              });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-sm uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" /> Post Bulletin
          </button>
        )}
      </div>

      {/* Announcements Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.map(ann => (
          <div key={ann.id} className="alexandria-card p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span className="text-[#1d4ed8] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 text-[10px] font-bold">
                  {ann.category}
                </span>
                <span>{ann.date}</span>
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900">{ann.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{ann.message}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <div>
                <span>Author: <strong className="text-slate-900">{ann.author}</strong></span>
                <span className="block mt-0.5">Target: <span className="text-[#1d4ed8]">{ann.targetRole} ({ann.semester})</span></span>
              </div>

              {(role === 'HOD' || role === 'Faculty') && (
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-xl font-bold text-slate-900">Post Department Bulletin</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Headline..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="All">All Students & Staff</option>
                    <option value="Specific Semester">Specific Semester</option>
                    <option value="Faculty">Faculty Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Exam">Exam Schedule</option>
                    <option value="Urgent">Urgent Alert</option>
                    <option value="General">General Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  rows="4"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Content..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

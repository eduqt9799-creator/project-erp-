import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  FolderDown,
  Upload,
  Search,
  Filter,
  FileText,
  FileCode,
  FileSpreadsheet,
  Film,
  Archive,
  Eye,
  Download,
  Edit3,
  Trash2,
  X
} from 'lucide-react';

export const StudyMaterialsModule = () => {
  const { currentUser, materials, subjects, addStudyMaterial, updateStudyMaterial, deleteStudyMaterial } = useERP();
  const role = currentUser?.role || 'Student';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSem, setSelectedSem] = useState('All');
  const [selectedSub, setSelectedSub] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewMaterial, setPreviewMaterial] = useState(null);

  const [formData, setFormData] = useState({
    department: 'CSE',
    semester: '5',
    subjectCode: 'CS501',
    title: '',
    description: '',
    category: 'PDF',
    fileName: ''
  });

  const handleOpenUpload = () => {
    setEditingId(null);
    setFormData({
      department: 'CSE',
      semester: '5',
      subjectCode: 'CS501',
      title: '',
      description: '',
      category: 'PDF',
      fileName: 'Lecture_Notes_2026.pdf'
    });
    setShowUploadModal(true);
  };

  const handleOpenEdit = (mat) => {
    setEditingId(mat.id);
    setFormData({
      department: mat.department || 'CSE',
      semester: mat.semester || '5',
      subjectCode: mat.subjectCode,
      title: mat.title,
      description: mat.description,
      category: mat.category,
      fileName: mat.fileName
    });
    setShowUploadModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateStudyMaterial(editingId, formData);
    } else {
      addStudyMaterial(formData);
    }
    setShowUploadModal(false);
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete study material "${title}"?`)) {
      deleteStudyMaterial(id);
    }
  };

  const handleDownload = (mat) => {
    const element = document.createElement('a');
    const file = new Blob([mat.previewContent || `Content of ${mat.title}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = mat.fileName || `${mat.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSem = selectedSem === 'All' || m.semester === selectedSem;
    const matchesSub = selectedSub === 'All' || m.subjectCode === selectedSub;
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;

    return matchesSearch && matchesSem && matchesSub && matchesCat;
  });

  const getIconForCategory = (cat) => {
    switch (cat) {
      case 'PDF': return <FileText className="w-5 h-5 text-rose-600" />;
      case 'PPT': return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
      case 'DOC': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'ZIP': return <Archive className="w-5 h-5 text-indigo-600" />;
      case 'Video': return <Film className="w-5 h-5 text-emerald-600" />;
      default: return <FileCode className="w-5 h-5 text-[#1d4ed8]" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Actions */}
      <div className="alexandria-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900">Study Materials Repository</h2>
          <p className="text-xs text-slate-500 mt-0.5">Explore lecture notes, presentations, lab code ZIP archives, and reference files</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#1d4ed8]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Sem:</span>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
            >
              <option value="All">All Semesters</option>
              <option value="5">Sem 5</option>
              <option value="3">Sem 3</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Type:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="PDF">PDF</option>
              <option value="PPT">PPT</option>
              <option value="ZIP">ZIP</option>
              <option value="Notes">Notes</option>
            </select>
          </div>

          {(role === 'Faculty' || role === 'HOD') && (
            <button
              onClick={handleOpenUpload}
              className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm uppercase tracking-wider transition-all ml-auto"
            >
              <Upload className="w-4 h-4" /> Upload Material
            </button>
          )}
        </div>
      </div>

      {/* Material Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map(mat => (
          <div key={mat.id} className="alexandria-card p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    {getIconForCategory(mat.category)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {mat.subjectCode} • Sem {mat.semester}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">{mat.fileSize}</span>
                  </div>
                </div>

                {(role === 'Faculty' || role === 'HOD') && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(mat)}
                      className="p-1.5 text-slate-400 hover:text-[#1d4ed8] hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(mat.id, mat.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-serif font-bold text-base text-slate-900">{mat.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{mat.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>By: <strong>{mat.uploadedBy}</strong></span>
                <span>{mat.uploadDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMaterial(mat)}
                  className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#1d4ed8]" /> Preview
                </button>
                <button
                  onClick={() => handleDownload(mat)}
                  className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#1d4ed8] border border-blue-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                {editingId ? 'Edit Study Material Details' : 'Upload Study Material'}
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="MECH">MECH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="1">Sem 1</option>
                    <option value="3">Sem 3</option>
                    <option value="5">Sem 5</option>
                    <option value="7">Sem 7</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={formData.subjectCode}
                    onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.code}>{s.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Material title..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="PDF">PDF</option>
                    <option value="PPT">PPT</option>
                    <option value="DOC">DOC</option>
                    <option value="ZIP">ZIP</option>
                    <option value="Notes">Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Attach File</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setFormData({ ...formData, fileName: e.target.files[0].name });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-600 file:bg-slate-200 file:border-none file:text-slate-900 file:px-2 file:py-1 file:rounded file:mr-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider"
                >
                  Upload Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">{previewMaterial.title}</h3>
                <span className="text-xs text-slate-500 font-medium">{previewMaterial.fileName} • {previewMaterial.fileSize}</span>
              </div>
              <button onClick={() => setPreviewMaterial(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed shadow-inner">
              {previewMaterial.previewContent}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500">Uploaded by {previewMaterial.uploadedBy}</span>
              <button
                onClick={() => handleDownload(previewMaterial)}
                className="py-2 px-4 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 uppercase tracking-wider"
              >
                <Download className="w-4 h-4" /> Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

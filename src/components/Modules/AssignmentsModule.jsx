import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { FileText, Plus, Upload, Clock, CheckCircle2, Download, X } from 'lucide-react';

export const AssignmentsModule = () => {
  const {
    currentUser,
    assignments,
    submissions,
    subjects,
    createAssignment,
    submitAssignmentSolution,
    gradeSubmission
  } = useERP();

  const role = currentUser?.role || 'Student';
  const rollNo = currentUser?.rollNo || '2024-CSE-001';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [asgForm, setAsgForm] = useState({
    subjectCode: 'CS501',
    subjectName: 'Web Technologies & Cloud',
    semester: '5',
    title: '',
    description: '',
    dueDate: '2026-09-05',
    fileName: 'Assignment_Requirements.pdf'
  });

  const [submitModalAsg, setSubmitModalAsg] = useState(null);
  const [solutionFile, setSolutionFile] = useState('Alex_Mercer_Solution.zip');
  const [studentComments, setStudentComments] = useState('');

  const [gradeModalSub, setGradeModalSub] = useState(null);
  const [gradeMarks, setGradeMarks] = useState(90);
  const [facultyFeedback, setFacultyFeedback] = useState('Great effort! Clear logic and code structure.');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const subObj = subjects.find(s => s.code === asgForm.subjectCode);
    createAssignment({
      ...asgForm,
      subjectName: subObj ? subObj.name : asgForm.subjectName
    });
    setShowCreateModal(false);
  };

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (!submitModalAsg) return;

    submitAssignmentSolution({
      assignmentId: submitModalAsg.id,
      studentId: currentUser?.id || 's1',
      rollNo: rollNo,
      studentName: currentUser?.name || 'Alex Mercer',
      fileName: solutionFile,
      comments: studentComments
    });

    setSubmitModalAsg(null);
  };

  const handleGradeSubmit = (e) => {
    e.preventDefault();
    if (!gradeModalSub) return;

    gradeSubmission(gradeModalSub.id, gradeMarks, facultyFeedback);
    setGradeModalSub(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Actions */}
      <div className="alexandria-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-slate-900">Assignments & Evaluation Portal</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {role === 'Faculty' || role === 'HOD'
              ? 'Publish course assignments, grade student solution packages, and provide feedback.'
              : 'Submit solution files before due dates and view score feedback.'}
          </p>
        </div>

        {(role === 'Faculty' || role === 'HOD') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" /> Create Assignment
          </button>
        )}
      </div>

      {/* Assignment List */}
      <div className="space-y-6">
        {assignments.map(asg => {
          const mySub = submissions.find(s => s.assignmentId === asg.id && (s.studentId === currentUser?.id || s.rollNo === rollNo));
          const allSubsForAsg = submissions.filter(s => s.assignmentId === asg.id);

          return (
            <div key={asg.id} className="alexandria-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {asg.subjectCode}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">Semester {asg.semester}</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 mt-1">{asg.title}</h3>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Due: <strong className="text-slate-900">{asg.dueDate}</strong>
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">By {asg.createdBy}</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">{asg.description}</p>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Download className="w-4 h-4 text-[#1d4ed8]" />
                  <span>Attachment: <code className="text-[#1d4ed8] font-mono">{asg.fileName}</code></span>
                </div>

                {role === 'Student' && (
                  <div>
                    {mySub ? (
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          mySub.status === 'Graded'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-[#1d4ed8] border-blue-200'
                        }`}>
                          {mySub.status === 'Graded' ? `Score: ${mySub.marks}/100` : 'Submitted'}
                        </span>

                        {mySub.status === 'Graded' && mySub.feedback && (
                          <div className="text-xs text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 italic">
                            "{mySub.feedback}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setSubmitModalAsg(asg)}
                        className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 uppercase tracking-wider shadow-sm"
                      >
                        <Upload className="w-4 h-4" /> Upload Solution
                      </button>
                    )}
                  </div>
                )}

                {(role === 'Faculty' || role === 'HOD') && (
                  <div className="w-full pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">
                      Student Submissions ({allSubsForAsg.length})
                    </span>

                    {allSubsForAsg.map(sub => (
                      <div key={sub.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{sub.studentName} ({sub.rollNo})</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Submitted: {sub.submittedAt} • File: <span className="text-[#1d4ed8] font-mono">{sub.fileName}</span>
                          </div>
                        </div>

                        <div>
                          {sub.status === 'Graded' ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                              Graded: {sub.marks}/100
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setGradeModalSub(sub);
                                setGradeMarks(90);
                                setFacultyFeedback('Great work! Well explained.');
                              }}
                              className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 font-bold rounded-lg hover:bg-amber-100"
                            >
                              Grade Submission
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-xl font-bold text-slate-900">Create New Assignment</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={asgForm.subjectCode}
                    onChange={(e) => setAsgForm({ ...asgForm, subjectCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.code}>{s.code}: {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={asgForm.dueDate}
                    onChange={(e) => setAsgForm({ ...asgForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={asgForm.title}
                  onChange={(e) => setAsgForm({ ...asgForm, title: e.target.value })}
                  placeholder="e.g. Build an ERP API Service"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  required
                  value={asgForm.description}
                  onChange={(e) => setAsgForm({ ...asgForm, description: e.target.value })}
                  placeholder="Guidelines..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Solution Upload Modal */}
      {submitModalAsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-xl font-bold text-slate-900">Submit Solution Package</h3>
              <button onClick={() => setSubmitModalAsg(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Solution File</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSolutionFile(e.target.files[0].name);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-600 file:bg-slate-200 file:border-none file:px-2 file:py-1 file:rounded file:mr-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Notes</label>
                <textarea
                  rows="2"
                  value={studentComments}
                  onChange={(e) => setStudentComments(e.target.value)}
                  placeholder="Optional notes for instructor..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalAsg(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider"
                >
                  Upload & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradeModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-xl font-bold text-slate-900">Grade Student Submission</h3>
              <button onClick={() => setGradeModalSub(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Award Marks (out of 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Feedback</label>
                <textarea
                  rows="3"
                  required
                  value={facultyFeedback}
                  onChange={(e) => setFacultyFeedback(e.target.value)}
                  placeholder="Feedback..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradeModalSub(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm"
                >
                  Submit Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Shield, UserCheck, GraduationCap, RotateCcw, Sparkles } from 'lucide-react';

export const QuickRoleBar = () => {
  const { currentUser, switchRoleDirectly, resetDemoData } = useERP();

  if (!currentUser) return null;

  return (
    <div className="bg-zinc-950 border-b border-zinc-800 px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/30 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Live Role Switcher:
        </span>
        <span className="text-slate-400 text-[11px]">Test instant cross-role portal state sync</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => switchRoleDirectly('HOD')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md border transition-all ${
            currentUser.role === 'HOD'
              ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-sm'
              : 'bg-zinc-900 border-zinc-800 text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> HOD / Admin
        </button>

        <button
          onClick={() => switchRoleDirectly('Faculty')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md border transition-all ${
            currentUser.role === 'Faculty'
              ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-sm'
              : 'bg-zinc-900 border-zinc-800 text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" /> Faculty
        </button>

        <button
          onClick={() => switchRoleDirectly('Student')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md border transition-all ${
            currentUser.role === 'Student'
              ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-sm'
              : 'bg-zinc-900 border-zinc-800 text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" /> Student
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <button
          onClick={() => {
            if (window.confirm('Reset all ERP data to default demo state?')) {
              resetDemoData();
            }
          }}
          className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
          title="Reset to default demo data"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Data
        </button>
      </div>
    </div>
  );
};

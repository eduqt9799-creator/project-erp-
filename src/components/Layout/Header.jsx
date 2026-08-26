import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Search, Bell, HelpCircle, User } from 'lucide-react';

export const Header = ({ activeTab, setActiveTab }) => {
  const { currentUser, announcements } = useERP();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!currentUser) return null;

  return (
    <header className="h-16 bg-black border-b border-zinc-900 px-8 flex items-center justify-between sticky top-9 z-40">
      {/* Page Context Breadcrumb / Department Title */}
      <div>
        <span className="text-xs text-slate-400 font-medium">
          Department of Computer Science & Engineering
        </span>
      </div>

      {/* Right Controls matching Alexandria Header */}
      <div className="flex items-center gap-4">
        {/* Search Bar pill matching Alexandria top-right input */}
        <div className="relative w-64 md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search archives..."
            className="w-full bg-white text-slate-900 placeholder-slate-400 rounded-lg pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xl z-50 p-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">Academic Bulletins</span>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                  {announcements.length} Total
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                {announcements.slice(0, 3).map(ann => (
                  <div key={ann.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-blue-700">{ann.category}</span>
                    <h4 className="font-bold text-slate-900 line-clamp-1">{ann.title}</h4>
                    <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">{ann.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help Icon matching Alexandria header */}
        <button className="p-2 text-slate-300 hover:text-white rounded-lg transition-colors" title="Help & Policy">
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full object-cover border border-slate-600"
          />
        </div>
      </div>
    </header>
  );
};

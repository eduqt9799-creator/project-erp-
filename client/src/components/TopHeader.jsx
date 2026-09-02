import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

export default function TopHeader({ onSearch }) {
  return (
    <header className="top-header-bar">
      <div className="search-archive-wrapper">
        <Search className="search-icon" />
        <input 
          type="text" 
          placeholder="Search archives..." 
          className="search-archive-input"
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>

      <button className="header-action-btn" title="Notifications">
        <Bell size={20} />
      </button>

      <button className="header-action-btn" title="Institutional Help">
        <HelpCircle size={20} />
      </button>
    </header>
  );
}

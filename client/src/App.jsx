import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import AuthModal, { getSession, clearSession, updateSessionProfile } from './components/AuthModal';
import ProfileSetupModal from './components/ProfileSetupModal';
import StudentPortal from './components/StudentPortal';
import TeacherPortal from './components/TeacherPortal';
import HodPortal from './components/HodPortal';
import AdminPortal from './components/AdminPortal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setCurrentUser(session);
    }
    setLoadingUser(false);
  }, []);

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setDashboardStats(null);
  };

  const handleProfileUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  if (loadingUser) {
    return (
      <div style={{ backgroundColor: '#07080a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '24px' }}>
        Loading Hindusthan CSE Department Portal...
      </div>
    );
  }

  // If not logged in, render Auth Modal (role-select → register → login)
  if (!currentUser) {
    return (
      <AuthModal
        onLoginSuccess={(user) => { setCurrentUser(user); }}
        onRegisterSuccess={(user) => { setCurrentUser(user); }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Off-White Sidebar */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Canvas Area */}
      <main className="main-canvas">
        <TopHeader />

        {/* Dynamic Portal View based on User Role */}
        {currentUser.role === 'student' && (
          <StudentPortal stats={dashboardStats} user={currentUser} activeTab={activeTab} />
        )}

        {currentUser.role === 'teacher' && (
          <TeacherPortal stats={dashboardStats} user={currentUser} activeTab={activeTab} />
        )}

        {currentUser.role === 'hod' && (
          <HodPortal stats={dashboardStats} user={currentUser} activeTab={activeTab} />
        )}

        {currentUser.role === 'admin' && (
          <AdminPortal stats={dashboardStats} user={currentUser} activeTab={activeTab} />
        )}

        {/* Footer */}
        <footer className="alexandria-footer">
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: '#e6e6e6' }}>Hindusthan CSE Department</div>
          <div className="footer-links">
            <a href="#integrity" className="footer-link">Academic Integrity</a>
            <a href="#support" className="footer-link">Support</a>
            <a href="#policy" className="footer-link">Institutional Policy</a>
          </div>
          <div>© 2026 Hindusthan CSE Department. All rights reserved.</div>
        </footer>
      </main>

      {/* Post-Login Profile Completion Modal */}
      {currentUser.profile_completed === 0 && (
        <ProfileSetupModal
          user={currentUser}
          onProfileUpdated={handleProfileUpdated}
          updateSessionProfile={updateSessionProfile}
        />
      )}
    </div>
  );
}

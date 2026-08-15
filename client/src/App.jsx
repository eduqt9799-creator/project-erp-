import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import AuthModal from './components/AuthModal';
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

  // Fetch current logged in user
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('alexandria_token');
    if (!token) {
      setCurrentUser(null);
      setLoadingUser(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem('alexandria_token');
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Failed to verify token:', err);
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  // Fetch role & department-specific dashboard data
  const fetchDashboardStats = async () => {
    if (!currentUser) return;
    const token = localStorage.getItem('alexandria_token');

    try {
      const res = await fetch('http://localhost:5000/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDashboardStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardStats();
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('alexandria_token');
    setCurrentUser(null);
    setDashboardStats(null);
  };

  const handleProfileUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    fetchDashboardStats();
  };

  if (loadingUser) {
    return (
      <div style={{ backgroundColor: '#07080a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '24px' }}>
        Loading Alexandria Academic Portal...
      </div>
    );
  }

  // If not logged in, render Auth Modal
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
      {/* Off-White Sidebar (Matches Screenshot) */}
      <Sidebar 
        currentUser={currentUser} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* Main Canvas Area */}
      <main className="main-canvas">
        <TopHeader />

        {/* Dynamic Portal View based on User Role & Department */}
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

        {/* Footer (Matches Screenshot) */}
        <footer className="alexandria-footer">
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: '#e6e6e6' }}>Alexandria</div>
          <div className="footer-links">
            <a href="#integrity" className="footer-link">Academic Integrity</a>
            <a href="#support" className="footer-link">Support</a>
            <a href="#policy" className="footer-link">Institutional Policy</a>
          </div>
          <div>© 2026 Alexandria Educational Systems. All rights reserved.</div>
        </footer>
      </main>

      {/* Post-Login Profile Completion Modal */}
      {currentUser.profile_completed === 0 && (
        <ProfileSetupModal user={currentUser} onProfileUpdated={handleProfileUpdated} />
      )}
    </div>
  );
}

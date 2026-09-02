import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { QuickRoleBar } from './components/Auth/QuickRoleBar';
import { LoginModal } from './components/Auth/LoginModal';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';

// Dashboards
import { AdminDashboard } from './components/Dashboards/AdminDashboard';
import { FacultyDashboard } from './components/Dashboards/FacultyDashboard';
import { StudentDashboard } from './components/Dashboards/StudentDashboard';

// Modules
import { FacultyManagement } from './components/Modules/FacultyManagement';
import { StudentManagement } from './components/Modules/StudentManagement';
import { SubjectManagement } from './components/Modules/SubjectManagement';
import { AttendanceModule } from './components/Modules/AttendanceModule';
import { TimetableModule } from './components/Modules/TimetableModule';
import { ExamTimetableModule } from './components/Modules/ExamTimetableModule';
import { StudyMaterialsModule } from './components/Modules/StudyMaterialsModule';
import { AssignmentsModule } from './components/Modules/AssignmentsModule';
import { AnnouncementsModule } from './components/Modules/AnnouncementsModule';
import { ReportsModule } from './components/Modules/ReportsModule';

const MainContent = () => {
  const { currentUser } = useERP();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUser) {
    return <LoginModal />;
  }

  const role = currentUser.role;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        if (role === 'HOD') return <AdminDashboard setActiveTab={setActiveTab} />;
        if (role === 'Faculty') return <FacultyDashboard setActiveTab={setActiveTab} />;
        return <StudentDashboard setActiveTab={setActiveTab} />;

      case 'faculty-mgmt':
        return <FacultyManagement />;

      case 'student-mgmt':
        return <StudentManagement />;

      case 'subjects':
      case 'my-subjects':
        return <SubjectManagement />;

      case 'timetable':
      case 'my-timetable':
        return <TimetableModule />;

      case 'exam-timetable':
        return <ExamTimetableModule />;

      case 'attendance':
      case 'take-attendance':
      case 'attendance-history':
      case 'my-attendance':
        return <AttendanceModule />;

      case 'materials':
        return <StudyMaterialsModule />;

      case 'assignments':
      case 'submissions':
        return <AssignmentsModule />;

      case 'announcements':
        return <AnnouncementsModule />;

      case 'reports':
        return <ReportsModule />;

      default:
        return <AdminDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Quick Role Bar for Cross-Role Testing */}
      <QuickRoleBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              {renderActiveView()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <MainContent />
    </ERPProvider>
  );
}

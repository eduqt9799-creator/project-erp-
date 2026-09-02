import React, { createContext, useContext, useState, useEffect } from 'react';

const ERPContext = createContext();

const INITIAL_USERS = [
  {
    id: 'u1',
    name: 'Dr. Arthur Pendelton',
    email: 'hod@college.edu',
    password: 'password123',
    role: 'HOD',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    designation: 'Head of Department',
    phone: '+1 (555) 019-2834'
  },
  {
    id: 'u2',
    name: 'Prof. Robert Smith',
    email: 'prof.smith@college.edu',
    password: 'password123',
    role: 'Faculty',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    designation: 'Senior Assistant Professor',
    subjectsAssigned: ['CS501', 'CS301']
  },
  {
    id: 'u3',
    name: 'Dr. Sarah Johnson',
    email: 'prof.johnson@college.edu',
    password: 'password123',
    role: 'Faculty',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    designation: 'Associate Professor',
    subjectsAssigned: ['CS502']
  },
  {
    id: 'u4',
    name: 'Prof. Alan Davis',
    email: 'prof.davis@college.edu',
    password: 'password123',
    role: 'Faculty',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    designation: 'Assistant Professor',
    subjectsAssigned: ['CS503']
  },
  {
    id: 's1',
    name: 'Alex Mercer',
    email: 'alex.2024@college.edu',
    password: 'password123',
    role: 'Student',
    rollNo: '2024-CSE-001',
    department: 'Computer Science & Engineering',
    semester: '5',
    section: 'A',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 's2',
    name: 'Sophia Chen',
    email: 'sophia.2024@college.edu',
    password: 'password123',
    role: 'Student',
    rollNo: '2024-CSE-002',
    department: 'Computer Science & Engineering',
    semester: '5',
    section: 'A',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 's3',
    name: 'Marcus Vance',
    email: 'marcus.2024@college.edu',
    password: 'password123',
    role: 'Student',
    rollNo: '2024-CSE-003',
    department: 'Computer Science & Engineering',
    semester: '5',
    section: 'A',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 's4',
    name: 'Emily Watson',
    email: 'emily.2024@college.edu',
    password: 'password123',
    role: 'Student',
    rollNo: '2024-CSE-004',
    department: 'Computer Science & Engineering',
    semester: '5',
    section: 'A',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 's5',
    name: 'Liam O\'Connor',
    email: 'liam.2024@college.edu',
    password: 'password123',
    role: 'Student',
    rollNo: '2024-CSE-051',
    department: 'Computer Science & Engineering',
    semester: '3',
    section: 'B',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  }
];

const INITIAL_SUBJECTS = [
  { id: 'subj1', code: 'CS501', name: 'Web Technologies & Cloud', semester: '5', department: 'CSE', credits: 4, facultyId: 'u2', facultyName: 'Prof. Robert Smith' },
  { id: 'subj2', code: 'CS502', name: 'Database Management Systems', semester: '5', department: 'CSE', credits: 4, facultyId: 'u3', facultyName: 'Dr. Sarah Johnson' },
  { id: 'subj3', code: 'CS503', name: 'Operating Systems Architecture', semester: '5', department: 'CSE', credits: 3, facultyId: 'u4', facultyName: 'Prof. Alan Davis' },
  { id: 'subj4', code: 'CS504', name: 'Design & Analysis of Algorithms', semester: '5', department: 'CSE', credits: 4, facultyId: 'u1', facultyName: 'Dr. Arthur Pendelton' },
  { id: 'subj5', code: 'CS301', name: 'Data Structures & Algorithms', semester: '3', department: 'CSE', credits: 4, facultyId: 'u2', facultyName: 'Prof. Robert Smith' },
];

const INITIAL_TIMETABLE = {
  '5': {
    'Monday': [
      { period: 1, time: '09:00 - 10:00', subjectCode: 'CS501', subjectName: 'Web Technologies', faculty: 'Prof. Robert Smith', room: 'Lab 3' },
      { period: 2, time: '10:00 - 11:00', subjectCode: 'CS502', subjectName: 'DBMS', faculty: 'Dr. Sarah Johnson', room: 'Hall 201' },
      { period: 3, time: '11:15 - 12:15', subjectCode: 'CS503', subjectName: 'Operating Systems', faculty: 'Prof. Alan Davis', room: 'Hall 201' },
      { period: 4, time: '01:15 - 02:15', subjectCode: 'CS504', subjectName: 'Algorithms', faculty: 'Dr. Arthur Pendelton', room: 'Auditorium A' },
      { period: 5, time: '02:15 - 03:15', subjectCode: 'CS501', subjectName: 'Web Tech Lab', faculty: 'Prof. Robert Smith', room: 'Lab 3' },
      { period: 6, time: '03:15 - 04:15', subjectCode: 'CS501', subjectName: 'Web Tech Lab', faculty: 'Prof. Robert Smith', room: 'Lab 3' },
    ],
    'Tuesday': [
      { period: 1, time: '09:00 - 10:00', subjectCode: 'CS502', subjectName: 'DBMS Lab', faculty: 'Dr. Sarah Johnson', room: 'Lab 1' },
      { period: 2, time: '10:00 - 11:00', subjectCode: 'CS502', subjectName: 'DBMS Lab', faculty: 'Dr. Sarah Johnson', room: 'Lab 1' },
      { period: 3, time: '11:15 - 12:15', subjectCode: 'CS501', subjectName: 'Web Technologies', faculty: 'Prof. Robert Smith', room: 'Hall 201' },
      { period: 4, time: '01:15 - 02:15', subjectCode: 'CS503', subjectName: 'Operating Systems', faculty: 'Prof. Alan Davis', room: 'Hall 201' },
      { period: 5, time: '02:15 - 03:15', subjectCode: 'CS504', subjectName: 'Algorithms', faculty: 'Dr. Arthur Pendelton', room: 'Hall 201' },
      { period: 6, time: '03:15 - 04:15', subjectCode: 'FREE', subjectName: 'Library / Self Study', faculty: '-', room: 'Central Library' },
    ],
    'Wednesday': [
      { period: 1, time: '09:00 - 10:00', subjectCode: 'CS504', subjectName: 'Algorithms', faculty: 'Dr. Arthur Pendelton', room: 'Hall 201' },
      { period: 2, time: '10:00 - 11:00', subjectCode: 'CS501', subjectName: 'Web Technologies', faculty: 'Prof. Robert Smith', room: 'Hall 201' },
      { period: 3, time: '11:15 - 12:15', subjectCode: 'CS502', subjectName: 'DBMS', faculty: 'Dr. Sarah Johnson', room: 'Hall 201' },
      { period: 4, time: '01:15 - 02:15', subjectCode: 'CS503', subjectName: 'OS Lab', faculty: 'Prof. Alan Davis', room: 'Lab 2' },
      { period: 5, time: '02:15 - 03:15', subjectCode: 'CS503', subjectName: 'OS Lab', faculty: 'Prof. Alan Davis', room: 'Lab 2' },
      { period: 6, time: '03:15 - 04:15', subjectCode: 'FREE', subjectName: 'Mentorship Session', faculty: 'Prof. Robert Smith', room: 'Seminar Hall' },
    ],
    'Thursday': [
      { period: 1, time: '09:00 - 10:00', subjectCode: 'CS503', subjectName: 'Operating Systems', faculty: 'Prof. Alan Davis', room: 'Hall 201' },
      { period: 2, time: '10:00 - 11:00', subjectCode: 'CS504', subjectName: 'Algorithms', faculty: 'Dr. Arthur Pendelton', room: 'Hall 201' },
      { period: 3, time: '11:15 - 12:15', subjectCode: 'CS501', subjectName: 'Web Technologies', faculty: 'Prof. Robert Smith', room: 'Hall 201' },
      { period: 4, time: '01:15 - 02:15', subjectCode: 'CS502', subjectName: 'DBMS', faculty: 'Dr. Sarah Johnson', room: 'Hall 201' },
      { period: 5, time: '02:15 - 03:15', subjectCode: 'FREE', subjectName: 'Sports / Cultural', faculty: '-', room: 'Ground' },
      { period: 6, time: '03:15 - 04:15', subjectCode: 'FREE', subjectName: 'Club Activity', faculty: '-', room: 'Auditorium' },
    ],
    'Friday': [
      { period: 1, time: '09:00 - 10:00', subjectCode: 'CS501', subjectName: 'Web Technologies', faculty: 'Prof. Robert Smith', room: 'Hall 201' },
      { period: 2, time: '10:00 - 11:00', subjectCode: 'CS502', subjectName: 'DBMS', faculty: 'Dr. Sarah Johnson', room: 'Hall 201' },
      { period: 3, time: '11:15 - 12:15', subjectCode: 'CS504', subjectName: 'Algorithms Lab', faculty: 'Dr. Arthur Pendelton', room: 'Lab 4' },
      { period: 4, time: '01:15 - 02:15', subjectCode: 'CS504', subjectName: 'Algorithms Lab', faculty: 'Dr. Arthur Pendelton', room: 'Lab 4' },
      { period: 5, time: '02:15 - 03:15', subjectCode: 'CS503', subjectName: 'Operating Systems', faculty: 'Prof. Alan Davis', room: 'Hall 201' },
      { period: 6, time: '03:15 - 04:15', subjectCode: 'FREE', subjectName: 'Weekly Seminar', faculty: 'Dr. Arthur Pendelton', room: 'Auditorium B' },
    ]
  }
};

const INITIAL_EXAMS = [
  { id: 'e1', code: 'CS501', name: 'Web Technologies & Cloud', date: '2026-09-15', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall A', semester: '5' },
  { id: 'e2', code: 'CS502', name: 'Database Management Systems', date: '2026-09-17', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall A', semester: '5' },
  { id: 'e3', code: 'CS503', name: 'Operating Systems Architecture', date: '2026-09-20', time: '10:00 AM - 01:00 PM', hall: 'Exam Hall B', semester: '5' },
  { id: 'e4', code: 'CS504', name: 'Design & Analysis of Algorithms', date: '2026-09-22', time: '10:00 AM - 01:00 PM', hall: 'Auditorium Hall', semester: '5' },
];

const INITIAL_ATTENDANCE = [
  {
    id: 'att-101',
    className: 'CSE-A',
    semester: '5',
    subjectCode: 'CS501',
    subjectName: 'Web Technologies & Cloud',
    date: '2026-08-25',
    period: 'Period 1',
    facultyName: 'Prof. Robert Smith',
    records: {
      '2024-CSE-001': 'Present',
      '2024-CSE-002': 'Present',
      '2024-CSE-003': 'Absent',
      '2024-CSE-004': 'Present'
    }
  },
  {
    id: 'att-102',
    className: 'CSE-A',
    semester: '5',
    subjectCode: 'CS501',
    subjectName: 'Web Technologies & Cloud',
    date: '2026-08-24',
    period: 'Period 3',
    facultyName: 'Prof. Robert Smith',
    records: {
      '2024-CSE-001': 'Present',
      '2024-CSE-002': 'Present',
      '2024-CSE-003': 'Present',
      '2024-CSE-004': 'Present'
    }
  },
  {
    id: 'att-103',
    className: 'CSE-A',
    semester: '5',
    subjectCode: 'CS502',
    subjectName: 'Database Management Systems',
    date: '2026-08-25',
    period: 'Period 2',
    facultyName: 'Dr. Sarah Johnson',
    records: {
      '2024-CSE-001': 'Present',
      '2024-CSE-002': 'Absent',
      '2024-CSE-003': 'Present',
      '2024-CSE-004': 'Present'
    }
  },
  {
    id: 'att-104',
    className: 'CSE-A',
    semester: '5',
    subjectCode: 'CS503',
    subjectName: 'Operating Systems Architecture',
    date: '2026-08-23',
    period: 'Period 4',
    facultyName: 'Prof. Alan Davis',
    records: {
      '2024-CSE-001': 'Present',
      '2024-CSE-002': 'Present',
      '2024-CSE-003': 'Present',
      '2024-CSE-004': 'Absent'
    }
  }
];

const INITIAL_MATERIALS = [
  {
    id: 'mat-1',
    title: 'React 19 & Component State Architecture',
    description: 'Comprehensive guide covering hooks, state management, memoization, and performance optimizations.',
    department: 'CSE',
    semester: '5',
    subjectCode: 'CS501',
    category: 'PDF',
    uploadedBy: 'Prof. Robert Smith',
    uploadDate: '2026-08-22',
    fileSize: '3.4 MB',
    fileName: 'React_State_Architecture_v2.pdf',
    previewContent: `UNIT 2: React State & Lifecycle Management
- Declarative UI Programming & React Fiber Engine
- useState, useEffect, useMemo, and useCallback hooks
- Context API vs Redux Toolkit for Enterprise ERPs
- Real-time State Synchronization patterns with Websockets`
  },
  {
    id: 'mat-2',
    title: 'Relational Schema Normalization & Indexing',
    description: 'Lecture slides on 1NF, 2NF, 3NF, B-Trees, and Query execution optimization in PostgreSQL.',
    department: 'CSE',
    semester: '5',
    subjectCode: 'CS502',
    category: 'PPT',
    uploadedBy: 'Dr. Sarah Johnson',
    uploadDate: '2026-08-21',
    fileSize: '8.1 MB',
    fileName: 'Database_Normalization_Masterclass.pptx',
    previewContent: `SLIDE 1: Introduction to Functional Dependencies
SLIDE 2: Boyce-Codd Normal Form (BCNF) Definitions
SLIDE 3: Indexing Strategies: B-Tree vs Hash Indexing
SLIDE 4: ACID Compliance & WAL Logs`
  },
  {
    id: 'mat-3',
    title: 'Process Scheduling & Memory Paging Lab Code',
    description: 'C++ implementations for Round Robin, SJF, and Virtual Memory Page Replacement algorithms.',
    department: 'CSE',
    semester: '5',
    subjectCode: 'CS503',
    category: 'ZIP',
    uploadedBy: 'Prof. Alan Davis',
    uploadDate: '2026-08-20',
    fileSize: '1.2 MB',
    fileName: 'OS_Scheduling_Algorithms_Code.zip',
    previewContent: `// scheduler.cpp
#include <iostream>
#include <vector>
using namespace std;
int main() {
    cout << "Executing Round Robin Scheduling Engine...";
    return 0;
}`
  },
  {
    id: 'mat-4',
    title: 'Dynamic Programming & Greedy Approaches Notes',
    description: 'Handwritten annotated notes for Knapsack, Dijkstra, and Bellman-Ford algorithms.',
    department: 'CSE',
    semester: '5',
    subjectCode: 'CS504',
    category: 'Notes',
    uploadedBy: 'Dr. Arthur Pendelton',
    uploadDate: '2026-08-19',
    fileSize: '5.6 MB',
    fileName: 'Algorithms_DP_Notes_2026.pdf',
    previewContent: `Dynamic Programming Core Steps:
1. Identify subproblems & optimal substructure
2. Formulate state transition recurrence relation
3. Tabulation vs Memoization approaches
4. Space complexity reduction tricks`
  }
];

const INITIAL_ASSIGNMENTS = [
  {
    id: 'asg-1',
    title: 'Build a Reactive Department ERP System',
    subjectCode: 'CS501',
    subjectName: 'Web Technologies & Cloud',
    semester: '5',
    description: 'Implement a full role-based college department portal with live attendance, interactive timetable editing, file sharing, and score submission.',
    dueDate: '2026-08-31',
    createdDate: '2026-08-22',
    createdBy: 'Prof. Robert Smith',
    fileName: 'ERP_Specs_v1.pdf'
  },
  {
    id: 'asg-2',
    title: 'SQL Query Optimization & Indexing Challenge',
    subjectCode: 'CS502',
    subjectName: 'Database Management Systems',
    semester: '5',
    description: 'Write optimized SQL queries for 100k student attendance records and analyze execution plans using EXPLAIN ANALYZE.',
    dueDate: '2026-09-05',
    createdDate: '2026-08-24',
    createdBy: 'Dr. Sarah Johnson',
    fileName: 'DBMS_Lab_Assignment_3.docx'
  }
];

const INITIAL_SUBMISSIONS = [
  {
    id: 'sub-1',
    assignmentId: 'asg-1',
    studentId: 's1',
    rollNo: '2024-CSE-001',
    studentName: 'Alex Mercer',
    submittedAt: '2026-08-24 14:30',
    fileName: 'Alex_Mercer_ERP_Submission.zip',
    fileSize: '4.8 MB',
    comments: 'Includes full dark mode, interactive Excel timetable grid, and local persistence store.',
    status: 'Graded',
    marks: 96,
    maxMarks: 100,
    feedback: 'Exceptional submission Alex! The role switcher and live attendance sync are flawless.'
  },
  {
    id: 'sub-2',
    assignmentId: 'asg-1',
    studentId: 's2',
    rollNo: '2024-CSE-002',
    studentName: 'Sophia Chen',
    submittedAt: '2026-08-25 09:15',
    fileName: 'Sophia_Chen_ERP_Project.zip',
    fileSize: '5.1 MB',
    comments: 'Completed all requirements with clean glassmorphic design and modular components.',
    status: 'Submitted',
    marks: null,
    maxMarks: 100,
    feedback: null
  }
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Upcoming Mid-Semester Examination Schedule',
    message: 'The Mid-Semester exams for Semester 5 are scheduled to begin on September 15th, 2026. Hall tickets will be issued next week.',
    targetRole: 'All',
    department: 'CSE',
    semester: '5',
    author: 'Dr. Arthur Pendelton (HOD)',
    date: '2026-08-25',
    category: 'Exam',
    pinned: true
  },
  {
    id: 'ann-2',
    title: 'Guest Lecture on Cloud Native & Kubernetes',
    message: 'Join us in Auditorium A this Friday at 3:15 PM for an expert session on Microservices and Kubernetes orchestration by Principal Architect from Google.',
    targetRole: 'All',
    department: 'CSE',
    semester: 'All',
    author: 'Prof. Robert Smith',
    date: '2026-08-24',
    category: 'Academic',
    pinned: false
  },
  {
    id: 'ann-3',
    title: 'Faculty Department Meeting',
    message: 'All CSE faculty members are requested to attend the monthly academic curriculum review meeting tomorrow at 04:30 PM in Conference Room 1.',
    targetRole: 'Faculty',
    department: 'CSE',
    semester: 'All',
    author: 'Dr. Arthur Pendelton (HOD)',
    date: '2026-08-23',
    category: 'Urgent',
    pinned: false
  }
];

export const ERPProvider = ({ children }) => {
  const loadInitial = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`erp_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [users, setUsers] = useState(() => loadInitial('users', INITIAL_USERS));
  const [subjects, setSubjects] = useState(() => loadInitial('subjects', INITIAL_SUBJECTS));
  const [timetable, setTimetable] = useState(() => loadInitial('timetable', INITIAL_TIMETABLE));
  const [exams, setExams] = useState(() => loadInitial('exams', INITIAL_EXAMS));
  const [attendance, setAttendance] = useState(() => loadInitial('attendance', INITIAL_ATTENDANCE));
  const [materials, setMaterials] = useState(() => loadInitial('materials', INITIAL_MATERIALS));
  const [assignments, setAssignments] = useState(() => loadInitial('assignments', INITIAL_ASSIGNMENTS));
  const [submissions, setSubmissions] = useState(() => loadInitial('submissions', INITIAL_SUBMISSIONS));
  const [announcements, setAnnouncements] = useState(() => loadInitial('announcements', INITIAL_ANNOUNCEMENTS));

  const [currentUser, setCurrentUser] = useState(() => loadInitial('currentUser', INITIAL_USERS[0]));

  useEffect(() => {
    localStorage.setItem('erp_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('erp_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('erp_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('erp_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('erp_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('erp_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('erp_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('erp_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('erp_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  // Auth Functions
  const loginUser = (email, password, role) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (user) {
      if (user.password === password || password === 'password123') {
        setCurrentUser(user);
        return { success: true, user };
      }
      return { success: false, message: 'Invalid password. Try "password123"' };
    }
    return { success: false, message: `No ${role} found with email: ${email}` };
  };

  const switchRoleDirectly = (roleName) => {
    let target;
    if (roleName === 'HOD') target = users.find(u => u.role === 'HOD');
    else if (roleName === 'Faculty') target = users.find(u => u.role === 'Faculty');
    else if (roleName === 'Student') target = users.find(u => u.role === 'Student');

    if (target) {
      setCurrentUser(target);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const resetDemoData = () => {
    setUsers(INITIAL_USERS);
    setSubjects(INITIAL_SUBJECTS);
    setTimetable(INITIAL_TIMETABLE);
    setExams(INITIAL_EXAMS);
    setAttendance(INITIAL_ATTENDANCE);
    setMaterials(INITIAL_MATERIALS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.clear();
  };

  // Faculty & Student Operations
  const addFaculty = (newFacultyData) => {
    const newId = `u_${Date.now()}`;
    const userObj = {
      id: newId,
      ...newFacultyData,
      role: 'Faculty',
      avatar: newFacultyData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      password: 'password123'
    };
    setUsers(prev => [...prev, userObj]);
  };

  const updateFaculty = (id, updatedFields) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedFields } : u));
  };

  const deleteFaculty = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addStudent = (newStudentData) => {
    const newId = `s_${Date.now()}`;
    const userObj = {
      id: newId,
      ...newStudentData,
      role: 'Student',
      avatar: newStudentData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      password: 'password123'
    };
    setUsers(prev => [...prev, userObj]);
  };

  const updateStudent = (id, updatedFields) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedFields } : u));
  };

  const deleteStudent = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // Subject Operations
  const addSubject = (subData) => {
    const newSub = {
      id: `subj_${Date.now()}`,
      ...subData
    };
    setSubjects(prev => [...prev, newSub]);
  };

  const updateSubject = (id, subData) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...subData } : s));
  };

  const deleteSubject = (id) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  // Timetable Matrix Update (Excel-style cell editor)
  const updateTimetableCell = (semester, day, periodNum, cellData) => {
    setTimetable(prev => {
      const semTable = prev[semester] ? JSON.parse(JSON.stringify(prev[semester])) : {};
      const dayList = semTable[day] ? [...semTable[day]] : [];

      const index = dayList.findIndex(p => p.period === periodNum);
      if (index >= 0) {
        dayList[index] = { ...dayList[index], ...cellData };
      } else {
        dayList.push({ period: periodNum, ...cellData });
      }

      semTable[day] = dayList;
      return { ...prev, [semester]: semTable };
    });
  };

  // Attendance Save & Delete
  const saveAttendanceSession = (sessionData) => {
    setAttendance(prev => {
      const existingIndex = prev.findIndex(a =>
        a.className === sessionData.className &&
        a.semester === sessionData.semester &&
        a.subjectCode === sessionData.subjectCode &&
        a.date === sessionData.date &&
        a.period === sessionData.period
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          records: sessionData.records,
          facultyName: currentUser?.name || 'Faculty'
        };
        return updated;
      } else {
        const newSession = {
          id: `att_${Date.now()}`,
          ...sessionData,
          facultyName: currentUser?.name || 'Faculty'
        };
        return [newSession, ...prev];
      }
    });
  };

  const deleteAttendanceSession = (id) => {
    setAttendance(prev => prev.filter(a => a.id !== id));
  };

  // Study Material Operations
  const addStudyMaterial = (matData) => {
    const newMat = {
      id: `mat_${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser?.name || 'Faculty',
      fileSize: `${(Math.random() * 4 + 1.2).toFixed(1)} MB`,
      previewContent: matData.description || 'Study Material preview document content...',
      ...matData
    };
    setMaterials(prev => [newMat, ...prev]);
  };

  const updateStudyMaterial = (id, updatedFields) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updatedFields } : m));
  };

  const deleteStudyMaterial = (id) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  // Assignments & Submissions Operations
  const createAssignment = (asgData) => {
    const newAsg = {
      id: `asg_${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.name || 'Faculty',
      ...asgData
    };
    setAssignments(prev => [newAsg, ...prev]);
  };

  const submitAssignmentSolution = (subData) => {
    setSubmissions(prev => {
      const existingIndex = prev.findIndex(s => s.assignmentId === subData.assignmentId && s.studentId === subData.studentId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          fileName: subData.fileName,
          comments: subData.comments,
          status: 'Submitted'
        };
        return updated;
      } else {
        const newSub = {
          id: `sub_${Date.now()}`,
          submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          fileSize: '3.2 MB',
          status: 'Submitted',
          marks: null,
          maxMarks: 100,
          feedback: null,
          ...subData
        };
        return [newSub, ...prev];
      }
    });
  };

  const gradeSubmission = (submissionId, marks, feedback) => {
    setSubmissions(prev => prev.map(s => s.id === submissionId ? {
      ...s,
      marks: Number(marks),
      feedback,
      status: 'Graded'
    } : s));
  };

  // Announcement Operations
  const postAnnouncement = (annData) => {
    const newAnn = {
      id: `ann_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: currentUser?.name || 'HOD',
      pinned: false,
      ...annData
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const deleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <ERPContext.Provider value={{
      currentUser,
      users,
      subjects,
      timetable,
      exams,
      attendance,
      materials,
      assignments,
      submissions,
      announcements,
      loginUser,
      switchRoleDirectly,
      logout,
      resetDemoData,
      addFaculty,
      updateFaculty,
      deleteFaculty,
      addStudent,
      updateStudent,
      deleteStudent,
      addSubject,
      updateSubject,
      deleteSubject,
      updateTimetableCell,
      saveAttendanceSession,
      deleteAttendanceSession,
      addStudyMaterial,
      updateStudyMaterial,
      deleteStudyMaterial,
      createAssignment,
      submitAssignmentSolution,
      gradeSubmission,
      postAnnouncement,
      deleteAnnouncement
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) throw new Error('useERP must be used within an ERPProvider');
  return context;
};

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'alexandria_erp.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF');

  // Departments Table
  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'hod', 'teacher', 'student')),
      department_id INTEGER,
      profile_completed INTEGER DEFAULT 0,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Profiles Table (with academic_year: 1 = 1st Year, 2 = 2nd Year)
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY,
      phone TEXT,
      bio TEXT,
      office_room TEXT,
      roll_number TEXT,
      employee_id TEXT,
      batch_year TEXT,
      academic_year INTEGER DEFAULT 1,
      designation TEXT,
      specialization TEXT
    )
  `);

  // Courses Table (with academic_year: 1 = 1st Year, 2 = 2nd Year)
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      teacher_id INTEGER,
      credits INTEGER DEFAULT 3,
      semester TEXT DEFAULT 'Fall 2026',
      academic_year INTEGER DEFAULT 1
    )
  `);

  // Enrollments Table
  db.run(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_id, student_id)
    )
  `);

  // Assignments Table
  db.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT NOT NULL,
      max_marks INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Submissions Table
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      submission_text TEXT,
      file_url TEXT,
      marks_obtained INTEGER,
      feedback TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Attendance Table
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent', 'late')),
      UNIQUE(course_id, student_id, date)
    )
  `);

  // Grades Table
  db.run(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      grade TEXT NOT NULL,
      exam_type TEXT DEFAULT 'Final Semester Exam',
      score REAL
    )
  `);

  // Announcements Table
  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_role TEXT DEFAULT 'all',
      academic_year INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run('PRAGMA foreign_keys = ON');

  // Seed Default Data if Departments table is empty
  db.get("SELECT COUNT(*) as count FROM departments", async (err, row) => {
    if (err) {
      console.error("Error checking departments table:", err);
      return;
    }

    if (row.count === 0) {
      console.log("Seeding Alexandria ERP Database with 1st Year & 2nd Year Student Data...");

      // Insert Departments
      db.run(`INSERT INTO departments (id, code, name, description) VALUES 
        (1, 'CSE', 'Computer Science and Engineering', 'Department of Computing, AI, Systems & Software'),
        (2, 'ECE', 'Electronics & Communication Engineering', 'Department of VLSI, Embedded & Signal Systems'),
        (3, 'ME', 'Mechanical Engineering', 'Department of Robotics, Dynamics & Thermal Systems'),
        (4, 'EE', 'Electrical Engineering', 'Department of Power Systems & Energy Control')
      `);

      const salt = await bcrypt.genSalt(10);
      const defaultHash = await bcrypt.hash('password123', salt);

      // 1. Admin (id: 1)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (1, 'Chancellor Victoria Vance', 'admin@alexandria.edu', ?, 'admin', 1, 1, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, office_room, employee_id, designation) VALUES 
        (1, '+1-800-ALEXANDRIA', 'Chief Academic Administrator & Governance Officer', 'Admin Suite 101', 'EMP-ADM-001', 'System Chancellor')`);

      // 2. CSE HOD (Dr. Arun, id: 2)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (2, 'Dr. Arun', 'hod.cse@alexandria.edu', ?, 'hod', 1, 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, office_room, employee_id, designation, specialization) VALUES 
        (2, '+1-555-0192', 'Head of Department - Computer Science & Engineering.', 'Turing Building 402', 'EMP-CSE-HOD', 'Head of Department', 'Theoretical Computer Science & Software Engineering')`);

      // 3. CSE Teacher (Prof. Ada Lovelace, id: 3)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (3, 'Prof. Ada Lovelace', 'teacher.ada@alexandria.edu', ?, 'teacher', 1, 1, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, office_room, employee_id, designation, specialization) VALUES 
        (3, '+1-555-0188', 'Senior Professor of Algorithm Analysis & Data Structures.', 'Turing Building 204', 'EMP-CSE-101', 'Associate Professor', 'Algorithms & Mathematical Logic')`);

      // 4. CSE Teacher (Prof. Grace Hopper, id: 4)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (4, 'Prof. Grace Hopper', 'teacher.grace@alexandria.edu', ?, 'teacher', 1, 1, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, office_room, employee_id, designation, specialization) VALUES 
        (4, '+1-555-0177', 'Professor of Systems Architecture & Compiler Design.', 'Turing Building 308', 'EMP-CSE-102', 'Assistant Professor', 'Compilers & Distributed Systems')`);

      // =======================================================
      // 1ST YEAR STUDENTS (academic_year = 1)
      // =======================================================
      // Student 5: Margaret Hamilton (1st Year)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (5, 'Margaret Hamilton', 'student.margaret@alexandria.edu', ?, 'student', 1, 1, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year, academic_year) VALUES 
        (5, '+1-555-0133', '1st Year CSE Undergraduate specializing in Flight Software Engineering.', 'CSE-1Y-2025-001', '2025 - 2029', 1)`);

      // Student 6: Dennis Ritchie (1st Year)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (6, 'Dennis Ritchie', 'student.dennis@alexandria.edu', ?, 'student', 1, 1, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year, academic_year) VALUES 
        (6, '+1-555-0155', '1st Year CSE Student interested in C programming and Unix.', 'CSE-1Y-2025-002', '2025 - 2029', 1)`);

      // =======================================================
      // 2ND YEAR STUDENTS (academic_year = 2)
      // =======================================================
      // Student 7: Linus Torvalds (2nd Year)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (7, 'Linus Torvalds', 'student.linus@alexandria.edu', ?, 'student', 1, 1, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year, academic_year) VALUES 
        (7, '+1-555-0122', '2nd Year Computer Science & Engineering Student.', 'CSE-2Y-2024-042', '2024 - 2028', 2)`);

      // Student 8: Steve Wozniak (2nd Year)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (8, 'Steve Wozniak', 'student.woz@alexandria.edu', ?, 'student', 1, 1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year, academic_year) VALUES 
        (8, '+1-555-0166', '2nd Year CSE Hardware & Embedded Systems Enthusiast.', 'CSE-2Y-2024-008', '2024 - 2028', 2)`);

      // =======================================================
      // COURSES (Categorized by 1st Year & 2nd Year)
      // =======================================================
      db.run(`INSERT INTO courses (id, code, name, department_id, teacher_id, credits, semester, academic_year) VALUES 
        (1, 'CSE-101', 'Programming Fundamentals & Problem Solving', 1, 3, 4, 'Fall 2026', 1),
        (2, 'CSE-102', 'Discrete Mathematics & Logic', 1, 4, 3, 'Fall 2026', 1),
        (3, 'CSE-201', 'Advanced Data Structures & Algorithms', 1, 3, 4, 'Fall 2026', 2),
        (4, 'CSE-202', 'Compiler Engineering & Computer Systems', 1, 4, 3, 'Fall 2026', 2)
      `);

      // Enrollments
      db.run(`INSERT INTO enrollments (course_id, student_id) VALUES (1, 5), (2, 6), (3, 7), (4, 8)`);

      // Assignments
      db.run(`INSERT INTO assignments (id, course_id, title, description, due_date, max_marks) VALUES 
        (1, 1, 'C Fundamentals & Memory Pointer Lab', 'Implement dynamic memory allocation and basic linked lists in C.', '2026-10-15', 100),
        (2, 3, 'Red-Black Tree Implementation', 'Implement self-balancing Red-Black Search Trees with O(log n) worst-case time complexity.', '2026-10-30', 100),
        (3, 4, 'Lexical Analyzer & AST Parser', 'Build a recursive descent parser producing an Abstract Syntax Tree in C++.', '2026-11-15', 100)
      `);

      // Announcements
      db.run(`INSERT INTO announcements (department_id, author_id, title, content, target_role, academic_year) VALUES 
        (1, 2, 'Welcome 1st Year CSE Students — Orientation 2026', 'All 1st Year CSE undergraduates are invited to attend the annual department induction program in Turing Auditorium.', 'all', 1),
        (1, 2, '2nd Year Research & Project Allocations', '2nd Year students must submit their choice of faculty project advisors by Friday.', 'all', 2)
      `);

      // Attendance
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES 
        (1, 5, '2026-10-20', 'present'),
        (1, 5, '2026-10-21', 'present'),
        (1, 6, '2026-10-20', 'absent'),
        (1, 6, '2026-10-21', 'absent'),
        (3, 7, '2026-10-20', 'present'),
        (3, 7, '2026-10-21', 'present'),
        (3, 8, '2026-10-20', 'late')
      `);

      // Grades
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES 
        (5, 1, 'A+', 'Midterm Assessment', 98.0),
        (6, 1, 'B', 'Midterm Assessment', 82.5),
        (7, 3, 'A+', 'Midterm Assessment', 96.5),
        (8, 4, 'A', 'Midterm Assessment', 94.0)
      `);

      console.log("Database seeded with 1st Year and 2nd Year student batches successfully!");
    }
  });
});

module.exports = db;

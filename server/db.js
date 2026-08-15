const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'alexandria_erp.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Temporarily disable foreign keys during schema setup
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

  // Profiles Table
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY,
      phone TEXT,
      bio TEXT,
      office_room TEXT,
      roll_number TEXT,
      employee_id TEXT,
      batch_year TEXT,
      designation TEXT,
      specialization TEXT
    )
  `);

  // Courses Table
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      teacher_id INTEGER,
      credits INTEGER DEFAULT 3,
      semester TEXT DEFAULT 'Fall 2026'
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Seed Default Data if Departments table is empty
  db.get("SELECT COUNT(*) as count FROM departments", async (err, row) => {
    if (err) {
      console.error("Error checking departments table:", err);
      return;
    }

    if (row.count === 0) {
      console.log("Seeding default ERP database...");

      // Insert Departments
      db.run(`INSERT INTO departments (id, code, name, description) VALUES 
        (1, 'CSE', 'Computer Science and Engineering', 'Department of Computing, AI, Systems & Software'),
        (2, 'ECE', 'Electronics & Communication Engineering', 'Department of VLSI, Embedded & Signal Systems'),
        (3, 'ME', 'Mechanical Engineering', 'Department of Robotics, Dynamics & Thermal Systems'),
        (4, 'EE', 'Electrical Engineering', 'Department of Power Systems & Energy Control')
      `);

      // Password for seed users
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

      // 2. CSE HOD (Dr. Alan Turing, id: 2)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (2, 'Dr. Alan Turing', 'hod.cse@alexandria.edu', ?, 'hod', 1, 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, office_room, employee_id, designation, specialization) VALUES 
        (2, '+1-555-0192', 'Head of Department - Computer Science & Engineering. Pioneer in Computational Theory.', 'Turing Building 402', 'EMP-CSE-HOD', 'Head of Department', 'Theoretical Computer Science & AI')`);

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

      // 5. CSE Student 1 (Linus Torvalds, id: 5)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (5, 'Linus Torvalds', 'student.linus@alexandria.edu', ?, 'student', 1, 1, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year) VALUES 
        (5, '+1-555-0122', 'Final Year Computer Science & Engineering Undergraduate.', 'CSE-2023-042', '2023 - 2027')`);

      // 6. CSE Student 2 (Margaret Hamilton, id: 6)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (6, 'Margaret Hamilton', 'student.margaret@alexandria.edu', ?, 'student', 1, 1, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year) VALUES 
        (6, '+1-555-0133', 'Senior CSE Honors Student specializing in Flight Software Engineering.', 'CSE-2023-019', '2023 - 2027')`);

      // 7. ECE Student (Nikola Tesla, id: 7)
      db.run(
        `INSERT INTO users (id, name, email, password, role, department_id, profile_completed, avatar) VALUES 
         (7, 'Nikola Tesla', 'student.nikola@alexandria.edu', ?, 'student', 2, 1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200')`,
        [defaultHash]
      );
      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year) VALUES 
        (7, '+1-555-0144', 'ECE Undergraduate researching Microelectronics.', 'ECE-2023-007', '2023 - 2027')`);

      // Seed Courses
      db.run(`INSERT INTO courses (id, code, name, department_id, teacher_id, credits, semester) VALUES 
        (1, 'CSE-301', 'Advanced Data Structures & Algorithms', 1, 3, 4, 'Fall 2026'),
        (2, 'CSE-402', 'Compiler Engineering & Systems Architecture', 1, 4, 3, 'Fall 2026'),
        (3, 'ECE-201', 'Analog Electronics & Signals', 2, NULL, 3, 'Fall 2026')
      `);

      // Seed Enrollments
      db.run(`INSERT INTO enrollments (course_id, student_id) VALUES (1, 5), (2, 5), (1, 6)`);

      // Seed Assignments
      db.run(`INSERT INTO assignments (id, course_id, title, description, due_date, max_marks) VALUES 
        (1, 1, 'Red-Black Tree Implementation', 'Implement self-balancing Red-Black Search Trees with O(log n) worst-case time complexity.', '2026-10-30', 100),
        (2, 2, 'Lexical Analyzer & AST Parser', 'Build a recursive descent parser producing an Abstract Syntax Tree in C++ / Rust.', '2026-11-15', 100)
      `);

      // Seed Announcements
      db.run(`INSERT INTO announcements (department_id, author_id, title, content, target_role) VALUES 
        (1, 2, 'CSE Department Research Symposium 2026', 'All CSE undergraduates and faculty are invited to present their research projects in Turing Hall on October 24th.', 'all'),
        (1, 3, 'CSE-301 Midterm Examination Schedule', 'The mid-term exam for Advanced Algorithms is scheduled for next Tuesday at 09:00 AM.', 'student')
      `);

      // Seed Attendance & Grades
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES 
        (1, 5, '2026-10-20', 'present'),
        (1, 5, '2026-10-21', 'present'),
        (1, 5, '2026-10-22', 'late'),
        (1, 6, '2026-10-20', 'present'),
        (1, 6, '2026-10-21', 'present')
      `);

      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES 
        (5, 1, 'A+', 'Midterm Assessment', 96.5),
        (6, 1, 'A', 'Midterm Assessment', 94.0)
      `);

      console.log("Database seeded successfully!");
    }
  });
});

module.exports = db;

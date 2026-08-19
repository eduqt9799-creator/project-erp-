const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "alexandria_erp.db"),
  (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
    } else {
      console.log("Connected to SQLite database.");
    }
  }
);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = OFF");

  db.run(`CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin','hod','teacher','student')) NOT NULL,
    department_id INTEGER,
    profile_completed INTEGER DEFAULT 0,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    phone TEXT,
    bio TEXT,
    office_room TEXT,
    roll_number TEXT,
    employee_id TEXT,
    batch_year TEXT,
    academic_year INTEGER DEFAULT 1,
    designation TEXT,
    specialization TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    department_id INTEGER,
    teacher_id INTEGER,
    credits INTEGER DEFAULT 3,
    semester INTEGER,
    academic_year INTEGER DEFAULT 1,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATETIME,
    max_marks INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    submission_text TEXT,
    file_url TEXT,
    marks_obtained INTEGER,
    feedback TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    date DATE NOT NULL,
    status TEXT CHECK(status IN ('present','absent','late')) NOT NULL,
    UNIQUE(course_id, student_id, date),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    exam_type TEXT,
    score REAL,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT,
    academic_year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS study_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER,
    uploaded_by INTEGER NOT NULL,
    subject_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    file_type TEXT CHECK(file_type IN ('notes','pdf','ppt','doc','video','image','zip')),
    file_url TEXT,
    file_name TEXT,
    semester INTEGER,
    academic_year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    type TEXT CHECK(type IN ('notification','announcement','system')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  )`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_chat_sender_receiver ON chat_messages(sender_id, receiver_id)`);

  db.run(`CREATE TABLE IF NOT EXISTS discussions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    department_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS discussion_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discussion_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discussion_id) REFERENCES discussions(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS timetables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    department_id INTEGER,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    room TEXT,
    academic_year INTEGER,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    department_id INTEGER,
    title TEXT NOT NULL,
    exam_type TEXT CHECK(exam_type IN ('internal','midterm','final')),
    date DATE,
    start_time TEXT,
    end_time TEXT,
    room TEXT,
    semester INTEGER,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS internal_marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    exam_type TEXT CHECK(exam_type IN ('assessment1','assessment2','midterm','assignment')),
    marks_obtained REAL,
    max_marks REAL,
    remarks TEXT,
    academic_year INTEGER,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS semester_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    sgpa REAL,
    cgpa REAL,
    total_credits INTEGER,
    academic_year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id)
  )`);

  // Seed data
  db.get("SELECT COUNT(*) AS count FROM departments", (err, row) => {
    if (err) {
      console.error("Error checking departments:", err.message);
      return;
    }

    if (row.count === 0) {
      console.log("Seeding default data...");

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync("password123", salt);

      // Departments
      db.run(`INSERT INTO departments (code, name, description) VALUES (?, ?, ?)`, ["CSE", "Computer Science & Engineering", "Department of Computer Science & Engineering"]);
      db.run(`INSERT INTO departments (code, name, description) VALUES (?, ?, ?)`, ["ECE", "Electronics & Communication Engineering", "Department of Electronics & Communication Engineering"]);
      db.run(`INSERT INTO departments (code, name, description) VALUES (?, ?, ?)`, ["ME", "Mechanical Engineering", "Department of Mechanical Engineering"]);
      db.run(`INSERT INTO departments (code, name, description) VALUES (?, ?, ?)`, ["EE", "Electrical Engineering", "Department of Electrical Engineering"]);

      // Users
      // Admin (id:1)
      db.run(`INSERT INTO users (id, name, email, password, role, department_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [1, "Chancellor Victoria Vance", "admin@alexandria.edu", hashedPassword, "admin", null, "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face"]);

      // CSE HOD (id:2)
      db.run(`INSERT INTO users (id, name, email, password, role, department_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [2, "Dr. Arun", "hod.cse@alexandria.edu", hashedPassword, "hod", 1, "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"]);

      // Teachers (id:3,4)
      db.run(`INSERT INTO users (id, name, email, password, role, department_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [3, "Prof. Ada Lovelace", "teacher.ada@alexandria.edu", hashedPassword, "teacher", 1, "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face"]);

      db.run(`INSERT INTO users (id, name, email, password, role, department_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [4, "Prof. Grace Hopper", "teacher.grace@alexandria.edu", hashedPassword, "teacher", 1, "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face"]);

      // 1st Year Students (id:5,6)
      db.run(`INSERT INTO users (id, name, email, password, role, department_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [5, "Margaret Hamilton", "student.margaret@alexandria.edu", hashedPassword, "student", 1, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face"]);

      db.run(`INSERT INTO users (id, name, email, password, role, department_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [6, "Dennis Ritchie", "student.dennis@alexandria.edu", hashedPassword, "student", 1, "https://api.dicebear.com/7.x/initials/svg?seed=DR&backgroundColor=00897b"]);

      // 2nd Year Students (id:7,8)
      db.run(`INSERT INTO users (id, name, email, password, role, department_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [7, "Linus Torvalds", "student.linus@alexandria.edu", hashedPassword, "student", 1, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"]);

      db.run(`INSERT INTO users (id, name, email, password, role, department_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [8, "Steve Wozniak", "student.woz@alexandria.edu", hashedPassword, "student", 1, "https://api.dicebear.com/7.x/initials/svg?seed=SW&backgroundColor=5c6bc0"]);

      // Profiles
      db.run(`INSERT INTO profiles (user_id, phone, bio, office_room, employee_id, designation, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [1, "+1-555-0100", "Chancellor of Alexandria University", "Admin Block, Room 101", "EMP-001", "Chancellor", "Administration"]);

      db.run(`INSERT INTO profiles (user_id, phone, bio, office_room, employee_id, designation, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [2, "+1-555-0101", "Head of Computer Science & Engineering Department", "CS Building, Room 301", "EMP-002", "Head of Department", "Artificial Intelligence"]);

      db.run(`INSERT INTO profiles (user_id, phone, bio, office_room, employee_id, designation, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [3, "+1-555-0102", "Professor specializing in Algorithms and Data Structures", "CS Building, Room 305", "EMP-003", "Professor", "Algorithms & Data Structures"]);

      db.run(`INSERT INTO profiles (user_id, phone, bio, office_room, employee_id, designation, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [4, "+1-555-0103", "Professor specializing in Programming Languages", "CS Building, Room 307", "EMP-004", "Professor", "Programming Languages"]);

      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [5, "+1-555-0201", "Passionate about software engineering and systems design", "CSE2026001", "2026", 1]);

      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [6, "+1-555-0202", "Interested in systems programming and operating systems", "CSE2026002", "2026", 1]);

      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [7, "+1-555-0203", "Linux kernel developer and open source advocate", "CSE2025001", "2025", 2]);

      db.run(`INSERT INTO profiles (user_id, phone, bio, roll_number, batch_year, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [8, "+1-555-0204", "Hardware enthusiast and co-founder of Apple Computer", "CSE2025002", "2025", 2]);

      // Courses
      db.run(`INSERT INTO courses (id, code, name, department_id, teacher_id, credits, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, "CSE-101", "Introduction to Programming", 1, 3, 4, 1, 1]);

      db.run(`INSERT INTO courses (id, code, name, department_id, teacher_id, credits, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [2, "CSE-102", "Data Structures & Algorithms", 1, 4, 4, 2, 1]);

      db.run(`INSERT INTO courses (id, code, name, department_id, teacher_id, credits, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [3, "CSE-201", "Operating Systems", 1, 3, 4, 1, 2]);

      db.run(`INSERT INTO courses (id, code, name, department_id, teacher_id, credits, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [4, "CSE-202", "Database Management Systems", 1, 4, 4, 2, 2]);

      // Enrollments
      db.run(`INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)`, [1, 5]);
      db.run(`INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)`, [1, 6]);
      db.run(`INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)`, [2, 5]);
      db.run(`INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)`, [2, 6]);
      db.run(`INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)`, [3, 7]);
      db.run(`INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)`, [3, 8]);
      db.run(`INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)`, [4, 7]);
      db.run(`INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)`, [4, 8]);

      // Assignments
      db.run(`INSERT INTO assignments (id, course_id, title, description, due_date, max_marks) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 1, "Hello World Program", "Write a program that prints Hello World in C and Python.", "2026-02-15 23:59:00", 10]);

      db.run(`INSERT INTO assignments (id, course_id, title, description, due_date, max_marks) VALUES (?, ?, ?, ?, ?, ?)`,
        [2, 1, "Control Structures Exercise", "Implement programs using if-else, switch, and loops.", "2026-03-01 23:59:00", 20]);

      db.run(`INSERT INTO assignments (id, course_id, title, description, due_date, max_marks) VALUES (?, ?, ?, ?, ?, ?)`,
        [3, 2, "Array Manipulation", "Implement sorting and searching algorithms on arrays.", "2026-03-10 23:59:00", 30]);

      db.run(`INSERT INTO assignments (id, course_id, title, description, due_date, max_marks) VALUES (?, ?, ?, ?, ?, ?)`,
        [4, 2, "Linked List Implementation", "Implement a singly linked list with insert, delete, and search operations.", "2026-03-20 23:59:00", 30]);

      db.run(`INSERT INTO assignments (id, course_id, title, description, due_date, max_marks) VALUES (?, ?, ?, ?, ?, ?)`,
        [5, 3, "Process Scheduling", "Simulate FCFS and SJF CPU scheduling algorithms.", "2026-03-15 23:59:00", 25]);

      db.run(`INSERT INTO assignments (id, course_id, title, description, due_date, max_marks) VALUES (?, ?, ?, ?, ?, ?)`,
        [6, 4, "SQL Query Exercise", "Write SQL queries for a given database schema including joins and subqueries.", "2026-03-25 23:59:00", 25]);

      // Announcements
      db.run(`INSERT INTO announcements (department_id, author_id, title, content, target_role, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 2, "Spring Semester 2026 - Schedule Released", "The academic schedule for Spring 2026 has been released. Please check your timetables.", "student", 1]);

      db.run(`INSERT INTO announcements (department_id, author_id, title, content, target_role, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 2, "Lab Session Rescheduling", "Due to maintenance, all CSE lab sessions for Week 5 have been rescheduled to next week.", "student", 1]);

      db.run(`INSERT INTO announcements (department_id, author_id, title, content, target_role, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 3, "Assignment 1 - Programming Basics", "The first assignment for CSE-101 is now available. Submit before the deadline.", "student", 1]);

      db.run(`INSERT INTO announcements (department_id, author_id, title, content, target_role, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [null, 1, "University Holiday Notice", "The university will be closed on February 26th for the national holiday.", null, null]);

      // Attendance
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [1, 5, "2026-01-12", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [1, 5, "2026-01-19", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [1, 5, "2026-01-26", "absent"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [1, 5, "2026-02-02", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [1, 5, "2026-02-09", "late"]);

      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [1, 6, "2026-01-12", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [1, 6, "2026-01-19", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [1, 6, "2026-01-26", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [1, 6, "2026-02-02", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [1, 6, "2026-02-09", "present"]);

      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [2, 5, "2026-01-14", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [2, 5, "2026-01-21", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [2, 5, "2026-01-28", "late"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [2, 6, "2026-01-14", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [2, 6, "2026-01-21", "absent"]);

      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [3, 7, "2026-01-13", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [3, 7, "2026-01-20", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [3, 7, "2026-01-27", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [3, 8, "2026-01-13", "late"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [3, 8, "2026-01-20", "absent"]);

      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [4, 7, "2026-01-15", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [4, 7, "2026-01-22", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [4, 8, "2026-01-15", "present"]);
      db.run(`INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`, [4, 8, "2026-01-22", "absent"]);

      // Grades
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`, [5, 1, "A", "midterm", 92]);
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`, [5, 1, "A+", "final", 96]);
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`, [6, 1, "B+", "midterm", 85]);
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`, [6, 1, "A", "final", 91]);
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`, [5, 2, "B", "midterm", 78]);
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`, [6, 2, "A-", "midterm", 88]);
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`, [7, 3, "A-", "midterm", 89]);
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`, [8, 3, "B+", "midterm", 84]);
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`, [7, 4, "A", "midterm", 93]);
      db.run(`INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`, [8, 4, "B", "midterm", 79]);

      // Submissions
      db.run(`INSERT INTO submissions (assignment_id, student_id, submission_text, marks_obtained, feedback, submitted_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 5, "#include <stdio.h>\nint main() {\n  printf(\"Hello World\\n\");\n  return 0;\n}", 10, "Excellent implementation!", "2026-02-10 14:30:00"]);

      db.run(`INSERT INTO submissions (assignment_id, student_id, submission_text, marks_obtained, feedback, submitted_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 6, "print(\"Hello World\")", 9, "Correct but minimal. Add comments.", "2026-02-12 18:45:00"]);

      // Study Materials
      db.run(`INSERT INTO study_materials (department_id, uploaded_by, subject_id, title, description, file_type, file_url, file_name, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 3, null, "C Programming Fundamentals", "Introduction to C programming language basics", "pdf", "https://storage.example.com/materials/c-fundamentals.pdf", "c-fundamentals.pdf", 1, 1]);

      db.run(`INSERT INTO study_materials (department_id, uploaded_by, subject_id, title, description, file_type, file_url, file_name, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 4, null, "Data Structures Visual Guide", "Visual representations of common data structures", "ppt", "https://storage.example.com/materials/ds-visual-guide.pptx", "ds-visual-guide.pptx", 2, 1]);

      db.run(`INSERT INTO study_materials (department_id, uploaded_by, subject_id, title, description, file_type, file_url, file_name, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 3, null, "Lecture Notes - Control Structures", "Detailed notes on if-else, switch, and loops", "notes", "https://storage.example.com/materials/lecture-notes-control.txt", "lecture-notes-control.txt", 1, 1]);

      db.run(`INSERT INTO study_materials (department_id, uploaded_by, subject_id, title, description, file_type, file_url, file_name, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 3, null, "Sorting Algorithms Tutorial", "Video tutorial on bubble sort, merge sort, and quicksort", "video", "https://storage.example.com/materials/sorting-tutorial.mp4", "sorting-tutorial.mp4", 1, 2]);

      db.run(`INSERT INTO study_materials (department_id, uploaded_by, subject_id, title, description, file_type, file_url, file_name, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 4, null, "SQL Reference Card", "Quick reference for SQL commands and syntax", "pdf", "https://storage.example.com/materials/sql-reference.pdf", "sql-reference.pdf", 2, 2]);

      db.run(`INSERT INTO study_materials (department_id, uploaded_by, subject_id, title, description, file_type, file_url, file_name, semester, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 3, null, "Operating Systems Concepts", "PDF covering OS fundamentals and process management", "pdf", "https://storage.example.com/materials/os-concepts.pdf", "os-concepts.pdf", 1, 2]);

      // Notifications
      db.run(`INSERT INTO notifications (sender_id, receiver_id, title, message, is_read, type) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 5, "Welcome to Alexandria ERP", "Welcome to the Alexandria University ERP system. Complete your profile to get started.", 0, "system"]);

      db.run(`INSERT INTO notifications (sender_id, receiver_id, title, message, is_read, type) VALUES (?, ?, ?, ?, ?, ?)`,
        [3, 5, "Assignment Graded", "Your submission for 'Hello World Program' has been graded. Score: 10/10", 1, "notification"]);

      db.run(`INSERT INTO notifications (sender_id, receiver_id, title, message, is_read, type) VALUES (?, ?, ?, ?, ?, ?)`,
        [3, 6, "Assignment Graded", "Your submission for 'Hello World Program' has been graded. Score: 9/10", 1, "notification"]);

      db.run(`INSERT INTO notifications (sender_id, receiver_id, title, message, is_read, type) VALUES (?, ?, ?, ?, ?, ?)`,
        [2, 5, "Course Enrollment Confirmed", "You have been enrolled in CSE-101: Introduction to Programming", 1, "notification"]);

      db.run(`INSERT INTO notifications (sender_id, receiver_id, title, message, is_read, type) VALUES (?, ?, ?, ?, ?, ?)`,
        [2, 6, "Course Enrollment Confirmed", "You have been enrolled in CSE-101: Introduction to Programming", 1, "notification"]);

      db.run(`INSERT INTO notifications (sender_id, receiver_id, title, message, is_read, type) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 7, "Welcome to Alexandria ERP", "Welcome to the Alexandria University ERP system. Complete your profile to get started.", 0, "system"]);

      db.run(`INSERT INTO notifications (sender_id, receiver_id, title, message, is_read, type) VALUES (?, ?, ?, ?, ?, ?)`,
        [1, 8, "Welcome to Alexandria ERP", "Welcome to the Alexandria University ERP system. Complete your profile to get started.", 0, "system"]);

      db.run(`INSERT INTO notifications (sender_id, receiver_id, title, message, is_read, type) VALUES (?, ?, ?, ?, ?, ?)`,
        [2, null, "Faculty Meeting Notice", "All CSE department faculty members are requested to attend the meeting on Feb 20, 2026 at 3:00 PM.", 0, "announcement"]);

      db.run(`INSERT INTO notifications (sender_id, receiver_id, title, message, is_read, type) VALUES (?, ?, ?, ?, ?, ?)`,
        [4, 7, "New Assignment Posted", "A new assignment 'SQL Query Exercise' has been posted for CSE-202. Check your course page.", 0, "notification"]);

      db.run(`INSERT INTO notifications (sender_id, receiver_id, title, message, is_read, type) VALUES (?, ?, ?, ?, ?, ?)`,
        [2, null, "Mid-Semester Exam Schedule", "The mid-semester examination schedule has been published. Please check the exam section.", 0, "announcement"]);

      // Timetables
      db.run(`INSERT INTO timetables (course_id, department_id, day_of_week, start_time, end_time, room, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [1, 1, "Monday", "09:00", "10:30", "CS-101", 1]);

      db.run(`INSERT INTO timetables (course_id, department_id, day_of_week, start_time, end_time, room, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [2, 1, "Wednesday", "11:00", "12:30", "CS-102", 1]);

      db.run(`INSERT INTO timetables (course_id, department_id, day_of_week, start_time, end_time, room, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [3, 1, "Tuesday", "14:00", "15:30", "CS-201", 2]);

      db.run(`INSERT INTO timetables (course_id, department_id, day_of_week, start_time, end_time, room, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [4, 1, "Thursday", "10:00", "11:30", "CS-202", 2]);

      db.run(`INSERT INTO timetables (course_id, department_id, day_of_week, start_time, end_time, room, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [1, 1, "Friday", "09:00", "10:30", "CS-LAB-1", 1]);

      // Exams
      db.run(`INSERT INTO exams (course_id, department_id, title, exam_type, date, start_time, end_time, room, semester) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 1, "CSE-101 Mid-Semester Exam", "midterm", "2026-03-05", "10:00", "12:00", "CS-EXAM-1", 1]);

      db.run(`INSERT INTO exams (course_id, department_id, title, exam_type, date, start_time, end_time, room, semester) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [2, 1, "CSE-102 Mid-Semester Exam", "midterm", "2026-03-12", "10:00", "12:00", "CS-EXAM-1", 2]);

      db.run(`INSERT INTO exams (course_id, department_id, title, exam_type, date, start_time, end_time, room, semester) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [3, 1, "CSE-201 Mid-Semester Exam", "internal", "2026-03-19", "14:00", "16:00", "CS-EXAM-2", 1]);

      // Internal Marks
      db.run(`INSERT INTO internal_marks (student_id, course_id, exam_type, marks_obtained, max_marks, remarks, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [5, 1, "assessment1", 18, 20, "Good understanding of basic concepts", 1]);

      db.run(`INSERT INTO internal_marks (student_id, course_id, exam_type, marks_obtained, max_marks, remarks, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [6, 1, "assessment1", 16, 20, "Needs improvement in syntax", 1]);

      db.run(`INSERT INTO internal_marks (student_id, course_id, exam_type, marks_obtained, max_marks, remarks, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [7, 3, "midterm", 42, 50, "Strong grasp of process management concepts", 2]);

      db.run(`INSERT INTO internal_marks (student_id, course_id, exam_type, marks_obtained, max_marks, remarks, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [8, 3, "midterm", 38, 50, "Good, but review memory management", 2]);

      // Semester Results
      db.run(`INSERT INTO semester_results (student_id, semester, sgpa, cgpa, total_credits, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [5, 1, 9.2, 9.2, 24, 1]);

      db.run(`INSERT INTO semester_results (student_id, semester, sgpa, cgpa, total_credits, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
        [7, 1, 8.8, 8.8, 24, 2]);

      // Discussions
      db.run(`INSERT INTO discussions (author_id, department_id, title, content) VALUES (?, ?, ?, ?)`,
        [5, 1, "Best resources for learning C pointers?", "I'm struggling with pointers in C. Can anyone recommend good resources or tips for understanding them better?"]);

      db.run(`INSERT INTO discussions (author_id, department_id, title, content) VALUES (?, ?, ?, ?)`,
        [7, 1, "Study group for Operating Systems", "Looking for study partners for the upcoming OS midterm. Anyone interested in forming a study group?"]);

      // Discussion Replies
      db.run(`INSERT INTO discussion_replies (discussion_id, author_id, content) VALUES (?, ?, ?)`,
        [1, 6, "I found the book 'C Programming: A Modern Approach' by K.N. King really helpful for understanding pointers."]);

      db.run(`INSERT INTO discussion_replies (discussion_id, author_id, content) VALUES (?, ?, ?)`,
        [1, 3, "Try practicing with visualization tools. I'll share some links in the study materials section."]);

      db.run(`INSERT INTO discussion_replies (discussion_id, author_id, content) VALUES (?, ?, ?)`,
        [2, 8, "Count me in! I'm available on Wednesdays and Fridays after classes. Let's meet in the library."]);

      console.log("Default data seeded successfully.");
    } else {
      console.log("Departments already exist, skipping seed.");
    }

    db.run("PRAGMA foreign_keys = ON");
  });
});

module.exports = db;

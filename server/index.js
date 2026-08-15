const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'alexandria_secret_key_2026';

app.use(cors());
app.use(express.json());

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// --- Helper Database Queries (Promisified) ---
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
});

// ==========================================
// 1. PUBLIC & AUTH ROUTES
// ==========================================

// Get All Departments (Public for Registration)
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await dbAll('SELECT * FROM departments ORDER BY code ASC');
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, department_id } = req.body;

  if (!name || !email || !password || !role || !department_id) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  try {
    const existing = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const result = await dbRun(
      `INSERT INTO users (name, email, password, role, department_id, profile_completed, avatar) VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [name, email, passwordHash, role, department_id, avatar]
    );

    const userId = result.lastID;

    // Create empty profile entry
    await dbRun(`INSERT INTO profiles (user_id) VALUES (?)`, [userId]);

    const token = jwt.sign({ id: userId, email, role, department_id }, JWT_SECRET, { expiresIn: '7d' });

    const newUser = await dbGet(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.profile_completed, u.avatar, d.code as dept_code, d.name as dept_name 
       FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?`,
      [userId]
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User (Verifies against database)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter email and password' });
  }

  try {
    const user = await dbGet(
      `SELECT u.*, d.code as dept_code, d.name as dept_name 
       FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.email = ?`,
      [email]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const profile = await dbGet('SELECT * FROM profiles WHERE user_id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, department_id: user.department_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: {
        ...userWithoutPassword,
        profile
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current Logged-in User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.profile_completed, u.avatar, d.code as dept_code, d.name as dept_name 
       FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile = await dbGet('SELECT * FROM profiles WHERE user_id = ?', [user.id]);

    res.json({ user: { ...user, profile } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Setup / Complete Profile
app.post('/api/profile/setup', authenticateToken, async (req, res) => {
  const { phone, bio, office_room, roll_number, employee_id, batch_year, designation, specialization } = req.body;
  const userId = req.user.id;

  try {
    await dbRun(
      `UPDATE profiles SET phone = ?, bio = ?, office_room = ?, roll_number = ?, employee_id = ?, batch_year = ?, designation = ?, specialization = ? WHERE user_id = ?`,
      [phone, bio, office_room, roll_number, employee_id, batch_year, designation, specialization, userId]
    );

    await dbRun(`UPDATE users SET profile_completed = 1 WHERE id = ?`, [userId]);

    const updatedUser = await dbGet(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.profile_completed, u.avatar, d.code as dept_code, d.name as dept_name 
       FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?`,
      [userId]
    );
    const profile = await dbGet('SELECT * FROM profiles WHERE user_id = ?', [userId]);

    res.json({ message: 'Profile updated successfully', user: { ...updatedUser, profile } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. DASHBOARD & DEPARTMENT ISOLATION ROUTES
// ==========================================

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  const { role, department_id, id: userId } = req.user;

  try {
    const dept = await dbGet('SELECT * FROM departments WHERE id = ?', [department_id]);

    if (role === 'admin') {
      // Global ERP Overview
      const totalDepartments = await dbGet('SELECT COUNT(*) as count FROM departments');
      const totalUsers = await dbGet('SELECT COUNT(*) as count FROM users');
      const usersByRole = await dbAll('SELECT role, COUNT(*) as count FROM users GROUP BY role');
      const departmentsList = await dbAll(`
        SELECT d.*, 
               (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.role = 'teacher') as teacher_count,
               (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.role = 'student') as student_count,
               (SELECT u.name FROM users u WHERE u.department_id = d.id AND u.role = 'hod' LIMIT 1) as hod_name
        FROM departments d
      `);

      return res.json({
        role: 'admin',
        totalDepartments: totalDepartments.count,
        totalUsers: totalUsers.count,
        usersByRole,
        departmentsList
      });
    }

    if (role === 'hod') {
      // HOD Department Oversight
      const teachers = await dbAll(
        `SELECT u.id, u.name, u.email, u.avatar, p.employee_id, p.designation, p.specialization, p.office_room 
         FROM users u LEFT JOIN profiles p ON u.id = p.user_id 
         WHERE u.department_id = ? AND u.role = 'teacher'`,
        [department_id]
      );

      const students = await dbAll(
        `SELECT u.id, u.name, u.email, u.avatar, p.roll_number, p.batch_year 
         FROM users u LEFT JOIN profiles p ON u.id = p.user_id 
         WHERE u.department_id = ? AND u.role = 'student'`,
        [department_id]
      );

      const courses = await dbAll(
        `SELECT c.*, u.name as teacher_name FROM courses c LEFT JOIN users u ON c.teacher_id = u.id WHERE c.department_id = ?`,
        [department_id]
      );

      const announcements = await dbAll(
        `SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id WHERE a.department_id = ? ORDER BY a.created_at DESC`,
        [department_id]
      );

      return res.json({
        role: 'hod',
        department: dept,
        teachersCount: teachers.length,
        studentsCount: students.length,
        coursesCount: courses.length,
        teachers,
        students,
        courses,
        announcements
      });
    }

    if (role === 'teacher') {
      // Teacher Portal (Connected to CSE Students & CSE HOD)
      const myCourses = await dbAll(
        `SELECT * FROM courses WHERE teacher_id = ?`,
        [userId]
      );

      const hod = await dbGet(
        `SELECT u.name, u.email, u.avatar, p.office_room, p.phone FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.department_id = ? AND u.role = 'hod' LIMIT 1`,
        [department_id]
      );

      const deptStudents = await dbAll(
        `SELECT u.id, u.name, u.email, u.avatar, p.roll_number, p.batch_year 
         FROM users u LEFT JOIN profiles p ON u.id = p.user_id 
         WHERE u.department_id = ? AND u.role = 'student'`,
        [department_id]
      );

      const assignments = await dbAll(
        `SELECT a.*, c.name as course_name FROM assignments a JOIN courses c ON a.course_id = c.id WHERE c.department_id = ? ORDER BY a.due_date ASC`,
        [department_id]
      );

      const announcements = await dbAll(
        `SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id WHERE a.department_id = ? ORDER BY a.created_at DESC`,
        [department_id]
      );

      return res.json({
        role: 'teacher',
        department: dept,
        myCourses,
        hod,
        deptStudents,
        assignments,
        announcements
      });
    }

    if (role === 'student') {
      // Student Portal (Receives only CSE data)
      const enrolledCourses = await dbAll(
        `SELECT c.*, u.name as teacher_name, u.email as teacher_email, u.avatar as teacher_avatar 
         FROM enrollments e 
         JOIN courses c ON e.course_id = c.id 
         LEFT JOIN users u ON c.teacher_id = u.id 
         WHERE e.student_id = ?`,
        [userId]
      );

      // Fallback: If not enrolled, show department courses
      const departmentCourses = enrolledCourses.length > 0 ? enrolledCourses : await dbAll(
        `SELECT c.*, u.name as teacher_name, u.email as teacher_email, u.avatar as teacher_avatar FROM courses c LEFT JOIN users u ON c.teacher_id = u.id WHERE c.department_id = ?`,
        [department_id]
      );

      const hod = await dbGet(
        `SELECT u.name, u.email, u.avatar, p.office_room FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.department_id = ? AND u.role = 'hod' LIMIT 1`,
        [department_id]
      );

      const assignments = await dbAll(
        `SELECT a.*, c.code as course_code, c.name as course_name, 
                (SELECT s.marks_obtained FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as submitted_marks
         FROM assignments a 
         JOIN courses c ON a.course_id = c.id 
         WHERE c.department_id = ? 
         ORDER BY a.due_date ASC`,
        [userId, department_id]
      );

      const attendanceRecords = await dbAll(
        `SELECT att.*, c.name as course_name FROM attendance att JOIN courses c ON att.course_id = c.id WHERE att.student_id = ?`,
        [userId]
      );

      const grades = await dbAll(
        `SELECT g.*, c.name as course_name, c.code as course_code FROM grades g JOIN courses c ON g.course_id = c.id WHERE g.student_id = ?`,
        [userId]
      );

      const announcements = await dbAll(
        `SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id WHERE a.department_id = ? ORDER BY a.created_at DESC`,
        [department_id]
      );

      const teachersList = await dbAll(
        `SELECT u.name, u.email, u.avatar, p.specialization, p.office_room FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.department_id = ? AND u.role = 'teacher'`,
        [department_id]
      );

      return res.json({
        role: 'student',
        department: dept,
        enrolledCourses: departmentCourses,
        hod,
        assignments,
        attendanceRecords,
        grades,
        announcements,
        teachersList
      });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. COURSES & ASSIGNMENTS API
// ==========================================

// Get Courses
app.get('/api/courses', authenticateToken, async (req, res) => {
  const { department_id, role } = req.user;
  try {
    let courses;
    if (role === 'admin') {
      courses = await dbAll(`SELECT c.*, d.code as dept_code, u.name as teacher_name FROM courses c JOIN departments d ON c.department_id = d.id LEFT JOIN users u ON c.teacher_id = u.id`);
    } else {
      courses = await dbAll(`SELECT c.*, d.code as dept_code, u.name as teacher_name FROM courses c JOIN departments d ON c.department_id = d.id LEFT JOIN users u ON c.teacher_id = u.id WHERE c.department_id = ?`, [department_id]);
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Course (HOD / Admin / Teacher)
app.post('/api/courses', authenticateToken, async (req, res) => {
  const { code, name, credits, semester, teacher_id, department_id } = req.body;
  const deptId = department_id || req.user.department_id;

  try {
    const result = await dbRun(
      `INSERT INTO courses (code, name, department_id, teacher_id, credits, semester) VALUES (?, ?, ?, ?, ?, ?)`,
      [code, name, deptId, teacher_id || null, credits || 3, semester || 'Fall 2026']
    );
    res.status(201).json({ id: result.lastID, message: 'Course created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Assignments
app.get('/api/assignments', authenticateToken, async (req, res) => {
  const { department_id, role } = req.user;
  try {
    let assignments;
    if (role === 'admin') {
      assignments = await dbAll(`SELECT a.*, c.code as course_code, c.name as course_name FROM assignments a JOIN courses c ON a.course_id = c.id`);
    } else {
      assignments = await dbAll(`SELECT a.*, c.code as course_code, c.name as course_name FROM assignments a JOIN courses c ON a.course_id = c.id WHERE c.department_id = ?`, [department_id]);
    }
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Assignment (Teacher / HOD)
app.post('/api/assignments', authenticateToken, async (req, res) => {
  const { course_id, title, description, due_date, max_marks } = req.body;

  if (!course_id || !title || !due_date) {
    return res.status(400).json({ error: 'Missing required assignment fields' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO assignments (course_id, title, description, due_date, max_marks) VALUES (?, ?, ?, ?, ?)`,
      [course_id, title, description, due_date, max_marks || 100]
    );
    res.status(201).json({ id: result.lastID, message: 'Assignment created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Assignment Solution (Student)
app.post('/api/assignments/:id/submit', authenticateToken, async (req, res) => {
  const assignmentId = req.params.id;
  const studentId = req.user.id;
  const { submission_text, file_url } = req.body;

  try {
    await dbRun(
      `INSERT INTO submissions (assignment_id, student_id, submission_text, file_url) VALUES (?, ?, ?, ?)`,
      [assignmentId, studentId, submission_text || '', file_url || '']
    );
    res.json({ message: 'Assignment submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Grade Submission (Teacher / HOD)
app.post('/api/submissions/:id/grade', authenticateToken, async (req, res) => {
  const submissionId = req.params.id;
  const { marks_obtained, feedback } = req.body;

  try {
    await dbRun(
      `UPDATE submissions SET marks_obtained = ?, feedback = ? WHERE id = ?`,
      [marks_obtained, feedback, submissionId]
    );
    res.json({ message: 'Submission graded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. ANNOUNCEMENTS API
// ==========================================

app.post('/api/announcements', authenticateToken, async (req, res) => {
  const { title, content, target_role, department_id } = req.body;
  const deptId = department_id || req.user.department_id;
  const authorId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO announcements (department_id, author_id, title, content, target_role) VALUES (?, ?, ?, ?, ?)`,
      [deptId, authorId, title, content, target_role || 'all']
    );
    res.status(201).json({ id: result.lastID, message: 'Announcement broadcasted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. ATTENDANCE & USERS DIRECTORY API
// ==========================================

// Mark Attendance
app.post('/api/attendance', authenticateToken, async (req, res) => {
  const { course_id, student_id, date, status } = req.body;

  try {
    await dbRun(
      `INSERT INTO attendance (course_id, student_id, date, status) VALUES (?, ?, ?, ?)`,
      [course_id, student_id, date, status]
    );
    res.json({ message: 'Attendance recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Department Users
app.get('/api/users', authenticateToken, async (req, res) => {
  const { role, department_id } = req.user;

  try {
    let users;
    if (role === 'admin') {
      users = await dbAll(
        `SELECT u.id, u.name, u.email, u.role, u.department_id, u.avatar, d.code as dept_code, d.name as dept_name,
                p.roll_number, p.employee_id, p.designation, p.specialization, p.phone, p.office_room
         FROM users u 
         LEFT JOIN departments d ON u.department_id = d.id
         LEFT JOIN profiles p ON u.id = p.user_id
         ORDER BY u.created_at DESC`
      );
    } else {
      users = await dbAll(
        `SELECT u.id, u.name, u.email, u.role, u.department_id, u.avatar, d.code as dept_code, d.name as dept_name,
                p.roll_number, p.employee_id, p.designation, p.specialization, p.phone, p.office_room
         FROM users u 
         LEFT JOIN departments d ON u.department_id = d.id
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.department_id = ?
         ORDER BY u.role ASC, u.name ASC`,
        [department_id]
      );
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Alexandria ERP Backend running on http://localhost:${PORT}`);
});

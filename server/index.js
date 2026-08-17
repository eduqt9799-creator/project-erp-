require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'alexandria_fallback_dev_secret';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim());

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS — only allow configured origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(express.json());

// Rate limiting on authentication routes (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 attempts per window per IP
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ==========================================
// HELPER UTILITIES
// ==========================================

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
// AUTHENTICATION MIDDLEWARE
// ==========================================

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

// Role authorization middleware factory
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
  }
  next();
};

// ==========================================
// 1. PUBLIC & AUTH ROUTES
// ==========================================

// Get All Departments (Public — used in registration form)
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await dbAll('SELECT * FROM departments ORDER BY code ASC');
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Register User (with rate limiting)
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { name, email, password, role, department_id } = req.body;

  if (!name || !email || !password || !role || !department_id) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  const validRoles = ['admin', 'hod', 'teacher', 'student'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const dept = await dbGet('SELECT id FROM departments WHERE id = ?', [department_id]);
    if (!dept) {
      return res.status(400).json({ error: 'Invalid department selected' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const result = await dbRun(
      `INSERT INTO users (name, email, password, role, department_id, profile_completed, avatar) VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [name, email, passwordHash, role, department_id, avatar]
    );

    const userId = result.lastID;
    await dbRun(`INSERT INTO profiles (user_id) VALUES (?)`, [userId]);

    const token = jwt.sign({ id: userId, email, role, department_id }, JWT_SECRET, { expiresIn: '7d' });

    const newUser = await dbGet(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.profile_completed, u.avatar, d.code as dept_code, d.name as dept_name
       FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?`,
      [userId]
    );

    res.status(201).json({ message: 'User registered successfully', token, user: newUser });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login User (with rate limiting)
app.post('/api/auth/login', authLimiter, async (req, res) => {
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
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const profile = await dbGet('SELECT * FROM profiles WHERE user_id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, department_id: user.department_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: { ...userWithoutPassword, profile } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get Current Logged-in User
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
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// ==========================================
// 2. PROFILE ROUTES
// ==========================================

// Initial Profile Setup (post-registration, profile_completed = 0)
app.post('/api/profile/setup', authenticateToken, async (req, res) => {
  const { phone, bio, office_room, roll_number, employee_id, batch_year, designation, specialization } = req.body;
  const userId = req.user.id;

  try {
    await dbRun(
      `UPDATE profiles SET phone = ?, bio = ?, office_room = ?, roll_number = ?, employee_id = ?, batch_year = ?, designation = ?, specialization = ? WHERE user_id = ?`,
      [phone || null, bio || null, office_room || null, roll_number || null, employee_id || null, batch_year || null, designation || null, specialization || null, userId]
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
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update Profile (Settings Tab — for already-complete profiles)
app.put('/api/profile', authenticateToken, async (req, res) => {
  const { phone, bio, office_room, roll_number, employee_id, batch_year, designation, specialization, name } = req.body;
  const userId = req.user.id;

  try {
    // Update profile fields
    await dbRun(
      `UPDATE profiles SET phone = ?, bio = ?, office_room = ?, roll_number = ?, employee_id = ?, batch_year = ?, designation = ?, specialization = ? WHERE user_id = ?`,
      [phone || null, bio || null, office_room || null, roll_number || null, employee_id || null, batch_year || null, designation || null, specialization || null, userId]
    );

    // Update display name if provided
    if (name && name.trim()) {
      await dbRun(`UPDATE users SET name = ? WHERE id = ?`, [name.trim(), userId]);
    }

    const updatedUser = await dbGet(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.profile_completed, u.avatar, d.code as dept_code, d.name as dept_name
       FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?`,
      [userId]
    );
    const profile = await dbGet('SELECT * FROM profiles WHERE user_id = ?', [userId]);

    res.json({ message: 'Profile updated successfully', user: { ...updatedUser, profile } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==========================================
// 3. DASHBOARD STATS (Role-Isolated)
// ==========================================

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  const { role, department_id, id: userId } = req.user;

  try {
    const dept = await dbGet('SELECT * FROM departments WHERE id = ?', [department_id]);

    if (role === 'admin') {
      const totalDepartments = await dbGet('SELECT COUNT(*) as count FROM departments');
      const totalUsers = await dbGet('SELECT COUNT(*) as count FROM users');
      const usersByRole = await dbAll('SELECT role, COUNT(*) as count FROM users GROUP BY role');
      const departmentsList = await dbAll(`
        SELECT d.*,
               (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.role = 'teacher') as teacher_count,
               (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.role = 'student') as student_count,
               (SELECT u.name FROM users u WHERE u.department_id = d.id AND u.role = 'hod' LIMIT 1) as hod_name
        FROM departments d ORDER BY d.code ASC
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
      const teachers = await dbAll(
        `SELECT u.id, u.name, u.email, u.avatar, p.employee_id, p.designation, p.specialization, p.office_room
         FROM users u LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.department_id = ? AND u.role = 'teacher' ORDER BY u.name ASC`,
        [department_id]
      );

      const students = await dbAll(
        `SELECT u.id, u.name, u.email, u.avatar, p.roll_number, p.batch_year, COALESCE(p.academic_year, 1) as academic_year
         FROM users u LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.department_id = ? AND u.role = 'student' ORDER BY u.name ASC`,
        [department_id]
      );

      const courses = await dbAll(
        `SELECT c.*, COALESCE(c.academic_year, 1) as academic_year, u.name as teacher_name FROM courses c LEFT JOIN users u ON c.teacher_id = u.id WHERE c.department_id = ? ORDER BY c.code ASC`,
        [department_id]
      );

      const announcements = await dbAll(
        `SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id WHERE a.department_id = ? ORDER BY a.created_at DESC LIMIT 20`,
        [department_id]
      );

      const attendanceSummary = await dbAll(
        `SELECT u.id as student_id, u.name as student_name, p.roll_number, COALESCE(p.academic_year, 1) as academic_year,
                COUNT(att.id) as total_classes,
                SUM(CASE WHEN att.status = 'present' OR att.status = 'late' THEN 1 ELSE 0 END) as present_count
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         LEFT JOIN attendance att ON u.id = att.student_id
         WHERE u.department_id = ? AND u.role = 'student'
         GROUP BY u.id ORDER BY u.name ASC`,
        [department_id]
      );

      const studentAttendanceReports = attendanceSummary.map(st => {
        const pct = st.total_classes > 0 ? Math.round((st.present_count / st.total_classes) * 100) : 100;
        return { ...st, percentage: pct, is_low: pct < 75 };
      });

      return res.json({
        role: 'hod',
        department: dept,
        teachersCount: teachers.length,
        studentsCount: students.length,
        coursesCount: courses.length,
        teachers,
        students,
        courses,
        announcements,
        studentAttendanceReports
      });
    }

    if (role === 'teacher') {
      const myCourses = await dbAll(
        `SELECT c.*, COALESCE(c.academic_year, 1) as academic_year, d.code as dept_code FROM courses c JOIN departments d ON c.department_id = d.id WHERE c.teacher_id = ? OR c.department_id = ? ORDER BY c.code ASC`,
        [userId, department_id]
      );

      const hod = await dbGet(
        `SELECT u.name, u.email, u.avatar, p.office_room, p.phone FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.department_id = ? AND u.role = 'hod' LIMIT 1`,
        [department_id]
      );

      const deptStudents = await dbAll(
        `SELECT u.id, u.name, u.email, u.avatar, p.roll_number, p.batch_year, COALESCE(p.academic_year, 1) as academic_year
         FROM users u LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.department_id = ? AND u.role = 'student' ORDER BY u.name ASC`,
        [department_id]
      );

      const assignments = await dbAll(
        `SELECT a.*, c.name as course_name, c.code as course_code FROM assignments a JOIN courses c ON a.course_id = c.id WHERE c.department_id = ? ORDER BY a.due_date ASC`,
        [department_id]
      );

      const announcements = await dbAll(
        `SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id WHERE a.department_id = ? ORDER BY a.created_at DESC LIMIT 10`,
        [department_id]
      );

      const recentAttendance = await dbAll(
        `SELECT att.*, u.name as student_name, p.roll_number, c.name as course_name, c.code as course_code
         FROM attendance att
         JOIN users u ON att.student_id = u.id
         LEFT JOIN profiles p ON u.id = p.user_id
         JOIN courses c ON att.course_id = c.id
         WHERE c.department_id = ?
         ORDER BY att.date DESC LIMIT 50`,
        [department_id]
      );

      return res.json({
        role: 'teacher',
        department: dept,
        myCourses,
        hod,
        deptStudents,
        assignments,
        announcements,
        recentAttendance
      });
    }

    if (role === 'student') {
      const enrolledCourses = await dbAll(
        `SELECT c.*, u.name as teacher_name, u.email as teacher_email, u.avatar as teacher_avatar
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE e.student_id = ?`,
        [userId]
      );

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
                (SELECT s.marks_obtained FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as submitted_marks,
                (SELECT s.id FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as submission_id
         FROM assignments a
         JOIN courses c ON a.course_id = c.id
         WHERE c.department_id = ?
         ORDER BY a.due_date ASC`,
        [userId, userId, department_id]
      );

      const attendanceRecords = await dbAll(
        `SELECT att.*, c.name as course_name, c.code as course_code
         FROM attendance att
         JOIN courses c ON att.course_id = c.id
         WHERE att.student_id = ?
         ORDER BY att.date DESC`,
        [userId]
      );

      const courseAttendanceBreakdown = await dbAll(
        `SELECT c.id as course_id, c.code as course_code, c.name as course_name,
                COUNT(att.id) as total_classes,
                SUM(CASE WHEN att.status = 'present' OR att.status = 'late' THEN 1 ELSE 0 END) as present_count
         FROM courses c
         LEFT JOIN attendance att ON c.id = att.course_id AND att.student_id = ?
         WHERE c.department_id = ?
         GROUP BY c.id`,
        [userId, department_id]
      );

      const totalClasses = attendanceRecords.length;
      const totalPresent = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
      const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;

      const grades = await dbAll(
        `SELECT g.*, c.name as course_name, c.code as course_code FROM grades g JOIN courses c ON g.course_id = c.id WHERE g.student_id = ?`,
        [userId]
      );

      const announcements = await dbAll(
        `SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id WHERE a.department_id = ? ORDER BY a.created_at DESC LIMIT 10`,
        [department_id]
      );

      const teachersList = await dbAll(
        `SELECT u.name, u.email, u.avatar, p.specialization, p.office_room, p.designation FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.department_id = ? AND u.role = 'teacher'`,
        [department_id]
      );

      return res.json({
        role: 'student',
        department: dept,
        enrolledCourses: departmentCourses,
        hod,
        assignments,
        attendanceRecords,
        courseAttendanceBreakdown,
        overallPercentage,
        totalClasses,
        totalPresent,
        grades,
        announcements,
        teachersList
      });
    }

    res.status(400).json({ error: 'Invalid user role' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// ==========================================
// 4. COURSES API
// ==========================================

// Get Courses
app.get('/api/courses', authenticateToken, async (req, res) => {
  const { department_id, role } = req.user;
  try {
    let courses;
    if (role === 'admin') {
      courses = await dbAll(`SELECT c.*, d.code as dept_code, d.name as dept_name, u.name as teacher_name FROM courses c JOIN departments d ON c.department_id = d.id LEFT JOIN users u ON c.teacher_id = u.id ORDER BY d.code, c.code`);
    } else {
      courses = await dbAll(`SELECT c.*, d.code as dept_code, u.name as teacher_name FROM courses c JOIN departments d ON c.department_id = d.id LEFT JOIN users u ON c.teacher_id = u.id WHERE c.department_id = ? ORDER BY c.code`, [department_id]);
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Create Course (HOD or Admin)
app.post('/api/courses', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const { code, name, credits, semester, teacher_id, department_id } = req.body;

  if (!code || !name) {
    return res.status(400).json({ error: 'Course code and name are required' });
  }

  const deptId = req.user.role === 'admin' ? (department_id || req.user.department_id) : req.user.department_id;

  try {
    const existing = await dbGet('SELECT id FROM courses WHERE code = ? AND department_id = ?', [code, deptId]);
    if (existing) {
      return res.status(409).json({ error: 'A course with this code already exists in your department' });
    }

    const result = await dbRun(
      `INSERT INTO courses (code, name, department_id, teacher_id, credits, semester) VALUES (?, ?, ?, ?, ?, ?)`,
      [code, name, deptId, teacher_id || null, credits || 3, semester || 'Fall 2026']
    );
    res.status(201).json({ id: result.lastID, message: 'Course created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Delete Course (HOD or Admin)
app.delete('/api/courses/:id', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const courseId = req.params.id;
  const { role, department_id } = req.user;

  try {
    const course = await dbGet('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // HOD can only delete courses in their own department
    if (role === 'hod' && course.department_id !== department_id) {
      return res.status(403).json({ error: 'You can only delete courses in your department' });
    }

    await dbRun('DELETE FROM courses WHERE id = ?', [courseId]);
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Assign Teacher to Course (HOD or Admin)
app.post('/api/courses/assign', authenticateToken, requireRole('hod', 'admin', 'teacher'), async (req, res) => {
  const { course_id, teacher_id } = req.body;
  if (!course_id || !teacher_id) {
    return res.status(400).json({ error: 'course_id and teacher_id are required' });
  }
  try {
    await dbRun(`UPDATE courses SET teacher_id = ? WHERE id = ?`, [teacher_id, course_id]);
    res.json({ message: 'Teacher assigned to course successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign teacher' });
  }
});

// Enroll Student in Course
app.post('/api/courses/:id/enroll', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const course_id = req.params.id;
  const { student_id } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id is required' });

  try {
    await dbRun(
      `INSERT INTO enrollments (course_id, student_id) VALUES (?, ?) ON CONFLICT(course_id, student_id) DO NOTHING`,
      [course_id, student_id]
    );
    res.json({ message: 'Student enrolled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// ==========================================
// 5. ASSIGNMENTS API
// ==========================================

// Get Assignments
app.get('/api/assignments', authenticateToken, async (req, res) => {
  const { department_id, role } = req.user;
  try {
    let assignments;
    if (role === 'admin') {
      assignments = await dbAll(`SELECT a.*, c.code as course_code, c.name as course_name, d.code as dept_code FROM assignments a JOIN courses c ON a.course_id = c.id JOIN departments d ON c.department_id = d.id ORDER BY a.due_date ASC`);
    } else {
      assignments = await dbAll(`SELECT a.*, c.code as course_code, c.name as course_name FROM assignments a JOIN courses c ON a.course_id = c.id WHERE c.department_id = ? ORDER BY a.due_date ASC`, [department_id]);
    }
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create Assignment (Teacher, HOD, Admin)
app.post('/api/assignments', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { course_id, title, description, due_date, max_marks } = req.body;

  if (!course_id || !title || !due_date) {
    return res.status(400).json({ error: 'course_id, title, and due_date are required' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO assignments (course_id, title, description, due_date, max_marks) VALUES (?, ?, ?, ?, ?)`,
      [course_id, title, description || '', due_date, max_marks || 100]
    );
    res.status(201).json({ id: result.lastID, message: 'Assignment created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Delete Assignment (Teacher, HOD, Admin)
app.delete('/api/assignments/:id', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  try {
    const assignment = await dbGet('SELECT id FROM assignments WHERE id = ?', [req.params.id]);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    await dbRun('DELETE FROM assignments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// ==========================================
// 6. SUBMISSIONS API
// ==========================================

// Student submits an assignment
app.post('/api/assignments/:id/submit', authenticateToken, requireRole('student'), async (req, res) => {
  const assignmentId = req.params.id;
  const studentId = req.user.id;
  const { submission_text, file_url } = req.body;

  if (!submission_text && !file_url) {
    return res.status(400).json({ error: 'Please provide submission text or a file URL' });
  }

  try {
    const assignment = await dbGet('SELECT id FROM assignments WHERE id = ?', [assignmentId]);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Check for duplicate submission
    const existing = await dbGet('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?', [assignmentId, studentId]);
    if (existing) {
      // Update instead of insert
      await dbRun(
        `UPDATE submissions SET submission_text = ?, file_url = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [submission_text || '', file_url || '', existing.id]
      );
      return res.json({ message: 'Assignment submission updated successfully' });
    }

    await dbRun(
      `INSERT INTO submissions (assignment_id, student_id, submission_text, file_url) VALUES (?, ?, ?, ?)`,
      [assignmentId, studentId, submission_text || '', file_url || '']
    );
    res.json({ message: 'Assignment submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Teacher/HOD fetches submissions for their department assignments
app.get('/api/submissions', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { department_id, role } = req.user;
  const { assignment_id } = req.query;

  try {
    let submissions;
    if (assignment_id) {
      submissions = await dbAll(
        `SELECT s.*, u.name as student_name, u.avatar as student_avatar, p.roll_number,
                a.title as assignment_title, a.max_marks, c.name as course_name, c.code as course_code
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         LEFT JOIN profiles p ON u.id = p.user_id
         JOIN assignments a ON s.assignment_id = a.id
         JOIN courses c ON a.course_id = c.id
         WHERE s.assignment_id = ?
         ORDER BY s.submitted_at DESC`,
        [assignment_id]
      );
    } else if (role === 'admin') {
      submissions = await dbAll(
        `SELECT s.*, u.name as student_name, a.title as assignment_title, a.max_marks, c.name as course_name, c.code as course_code
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         JOIN assignments a ON s.assignment_id = a.id
         JOIN courses c ON a.course_id = c.id
         ORDER BY s.submitted_at DESC LIMIT 100`
      );
    } else {
      submissions = await dbAll(
        `SELECT s.*, u.name as student_name, u.avatar as student_avatar, p.roll_number,
                a.title as assignment_title, a.max_marks, c.name as course_name, c.code as course_code
         FROM submissions s
         JOIN users u ON s.student_id = u.id
         LEFT JOIN profiles p ON u.id = p.user_id
         JOIN assignments a ON s.assignment_id = a.id
         JOIN courses c ON a.course_id = c.id
         WHERE c.department_id = ?
         ORDER BY s.submitted_at DESC`,
        [department_id]
      );
    }
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Grade a Submission (Teacher, HOD, Admin)
app.post('/api/submissions/:id/grade', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const submissionId = req.params.id;
  const { marks_obtained, feedback } = req.body;

  if (marks_obtained === undefined || marks_obtained === null) {
    return res.status(400).json({ error: 'marks_obtained is required' });
  }

  try {
    const submission = await dbGet('SELECT id FROM submissions WHERE id = ?', [submissionId]);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    await dbRun(
      `UPDATE submissions SET marks_obtained = ?, feedback = ? WHERE id = ?`,
      [marks_obtained, feedback || null, submissionId]
    );
    res.json({ message: 'Submission graded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// ==========================================
// 7. GRADES API
// ==========================================

// Get grades
app.get('/api/grades', authenticateToken, async (req, res) => {
  const { role, department_id, id: userId } = req.user;
  const { student_id } = req.query;

  try {
    let grades;
    if (role === 'student') {
      grades = await dbAll(
        `SELECT g.*, c.name as course_name, c.code as course_code FROM grades g JOIN courses c ON g.course_id = c.id WHERE g.student_id = ? ORDER BY c.code`,
        [userId]
      );
    } else if (role === 'admin') {
      if (student_id) {
        grades = await dbAll(
          `SELECT g.*, c.name as course_name, c.code as course_code, u.name as student_name FROM grades g JOIN courses c ON g.course_id = c.id JOIN users u ON g.student_id = u.id WHERE g.student_id = ? ORDER BY c.code`,
          [student_id]
        );
      } else {
        grades = await dbAll(
          `SELECT g.*, c.name as course_name, c.code as course_code, u.name as student_name FROM grades g JOIN courses c ON g.course_id = c.id JOIN users u ON g.student_id = u.id ORDER BY u.name, c.code`
        );
      }
    } else {
      // Teacher or HOD — fetch grades for all students in their department
      grades = await dbAll(
        `SELECT g.*, c.name as course_name, c.code as course_code, u.name as student_name, p.roll_number
         FROM grades g
         JOIN courses c ON g.course_id = c.id
         JOIN users u ON g.student_id = u.id
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE c.department_id = ?
         ORDER BY u.name, c.code`,
        [department_id]
      );
    }
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// Create or Update a Grade entry (Teacher, HOD, Admin)
app.post('/api/grades', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { student_id, course_id, grade, exam_type, score } = req.body;

  if (!student_id || !course_id || !grade) {
    return res.status(400).json({ error: 'student_id, course_id, and grade are required' });
  }

  try {
    const existing = await dbGet('SELECT id FROM grades WHERE student_id = ? AND course_id = ? AND exam_type = ?', [student_id, course_id, exam_type || 'Final Semester Exam']);

    if (existing) {
      await dbRun(
        `UPDATE grades SET grade = ?, score = ? WHERE id = ?`,
        [grade, score || null, existing.id]
      );
      res.json({ message: 'Grade updated successfully' });
    } else {
      const result = await dbRun(
        `INSERT INTO grades (student_id, course_id, grade, exam_type, score) VALUES (?, ?, ?, ?, ?)`,
        [student_id, course_id, grade, exam_type || 'Final Semester Exam', score || null]
      );
      res.status(201).json({ id: result.lastID, message: 'Grade recorded successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save grade' });
  }
});

// ==========================================
// 8. ANNOUNCEMENTS API
// ==========================================

// Get Announcements
app.get('/api/announcements', authenticateToken, async (req, res) => {
  const { department_id, role } = req.user;
  try {
    let announcements;
    if (role === 'admin') {
      announcements = await dbAll(
        `SELECT a.*, u.name as author_name, d.code as dept_code FROM announcements a LEFT JOIN users u ON a.author_id = u.id LEFT JOIN departments d ON a.department_id = d.id ORDER BY a.created_at DESC`
      );
    } else {
      announcements = await dbAll(
        `SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.author_id = u.id WHERE a.department_id = ? ORDER BY a.created_at DESC`,
        [department_id]
      );
    }
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Create Announcement (Teacher, HOD, Admin)
app.post('/api/announcements', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { title, content, target_role, department_id } = req.body;
  const deptId = req.user.role === 'admin' ? (department_id || req.user.department_id) : req.user.department_id;
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
    res.status(500).json({ error: 'Failed to post announcement' });
  }
});

// Edit Announcement (HOD, Admin)
app.put('/api/announcements/:id', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const { role, department_id } = req.user;
  const { title, content, target_role } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const announcement = await dbGet('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

    if (role === 'hod' && announcement.department_id !== department_id) {
      return res.status(403).json({ error: 'You can only edit announcements in your department' });
    }

    await dbRun(
      `UPDATE announcements SET title = ?, content = ?, target_role = ? WHERE id = ?`,
      [title, content, target_role || 'all', req.params.id]
    );
    res.json({ message: 'Announcement updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete Announcement (HOD, Admin — own department only for HOD)
app.delete('/api/announcements/:id', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const { role, department_id } = req.user;
  try {
    const announcement = await dbGet('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });

    if (role === 'hod' && announcement.department_id !== department_id) {
      return res.status(403).json({ error: 'You can only delete announcements in your department' });
    }

    await dbRun('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// ==========================================
// HOD FACULTY / PROFESSOR MANAGEMENT API
// ==========================================

// HOD Add Faculty / Teacher Account
app.post('/api/hod/teachers', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const { name, email, password, employee_id, designation, specialization, office_room, phone } = req.body;
  const deptId = req.user.department_id;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  try {
    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const result = await dbRun(
      `INSERT INTO users (name, email, password, role, department_id, profile_completed, avatar) VALUES (?, ?, ?, 'teacher', ?, 1, ?)`,
      [name, email, passwordHash, deptId, avatar]
    );

    const userId = result.lastID;
    await dbRun(
      `INSERT INTO profiles (user_id, employee_id, designation, specialization, office_room, phone) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, employee_id || `EMP-CSE-${userId}`, designation || 'Associate Professor', specialization || 'Computer Science', office_room || 'Turing Hall', phone || null]
    );

    res.status(201).json({ message: `Faculty account created for ${name}!`, id: userId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create faculty account' });
  }
});

// HOD Edit Faculty Details
app.put('/api/hod/teachers/:id', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const targetId = parseInt(req.params.id);
  const deptId = req.user.department_id;
  const { name, designation, specialization, office_room, phone } = req.body;

  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ? AND department_id = ? AND role = "teacher"', [targetId, deptId]);
    if (!user) return res.status(404).json({ error: 'Faculty member not found in your department' });

    if (name && name.trim()) {
      await dbRun('UPDATE users SET name = ? WHERE id = ?', [name.trim(), targetId]);
    }

    await dbRun(
      `UPDATE profiles SET designation = ?, specialization = ?, office_room = ?, phone = ? WHERE user_id = ?`,
      [designation || 'Associate Professor', specialization || 'Computer Science', office_room || 'Room 204', phone || null, targetId]
    );

    res.json({ message: 'Faculty details updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update faculty details' });
  }
});

// HOD Delete Faculty Member
app.delete('/api/hod/teachers/:id', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const targetId = parseInt(req.params.id);
  const deptId = req.user.department_id;

  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ? AND department_id = ? AND role = "teacher"', [targetId, deptId]);
    if (!user) return res.status(404).json({ error: 'Faculty member not found in your department' });

    await dbRun('DELETE FROM profiles WHERE user_id = ?', [targetId]);
    await dbRun('UPDATE courses SET teacher_id = NULL WHERE teacher_id = ?', [targetId]);
    await dbRun('DELETE FROM users WHERE id = ?', [targetId]);

    res.json({ message: `Faculty member "${user.name}" removed successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete faculty member' });
  }
});

// ==========================================
// 9. ATTENDANCE API
// ==========================================

// Get Attendance (with filters)
app.get('/api/attendance', authenticateToken, async (req, res) => {
  const { role, department_id, id: userId } = req.user;
  const { course_id, student_id, date } = req.query;

  try {
    let sql, params;

    if (role === 'student') {
      sql = `SELECT att.*, c.name as course_name, c.code as course_code
             FROM attendance att JOIN courses c ON att.course_id = c.id
             WHERE att.student_id = ?`;
      params = [userId];
    } else if (role === 'admin') {
      sql = `SELECT att.*, u.name as student_name, c.name as course_name, c.code as course_code, d.code as dept_code
             FROM attendance att JOIN users u ON att.student_id = u.id JOIN courses c ON att.course_id = c.id JOIN departments d ON c.department_id = d.id WHERE 1=1`;
      params = [];
    } else {
      sql = `SELECT att.*, u.name as student_name, c.name as course_name, c.code as course_code
             FROM attendance att JOIN users u ON att.student_id = u.id JOIN courses c ON att.course_id = c.id
             WHERE c.department_id = ?`;
      params = [department_id];
    }

    if (course_id) { sql += ' AND att.course_id = ?'; params.push(course_id); }
    if (student_id && role !== 'student') { sql += ' AND att.student_id = ?'; params.push(student_id); }
    if (date) { sql += ' AND att.date = ?'; params.push(date); }
    sql += ' ORDER BY att.date DESC LIMIT 200';

    const records = await dbAll(sql, params);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Bulk Mark Attendance (Teacher, HOD)
app.post('/api/attendance/bulk', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { course_id, date, records } = req.body;

  if (!course_id || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Please provide course_id, date, and an array of attendance records' });
  }

  const validStatuses = ['present', 'absent', 'late'];

  try {
    for (const item of records) {
      if (!item.student_id || !validStatuses.includes(item.status)) continue;
      await dbRun(
        `INSERT INTO attendance (course_id, student_id, date, status)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(course_id, student_id, date) DO UPDATE SET status = excluded.status`,
        [course_id, item.student_id, date, item.status]
      );
    }
    res.json({ message: `Attendance saved for ${records.length} students on ${date}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

// Single Attendance Mark
app.post('/api/attendance', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { course_id, student_id, date, status } = req.body;
  const validStatuses = ['present', 'absent', 'late'];

  if (!course_id || !student_id || !date || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid attendance data. Status must be: present, absent, or late' });
  }

  try {
    await dbRun(
      `INSERT INTO attendance (course_id, student_id, date, status)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(course_id, student_id, date) DO UPDATE SET status = excluded.status`,
      [course_id, student_id, date, status]
    );
    res.json({ message: 'Attendance recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// ==========================================
// 10. USER MANAGEMENT API
// ==========================================

// Get All Users (Admin = all, others = own department)
app.get('/api/users', authenticateToken, async (req, res) => {
  const { role, department_id } = req.user;

  try {
    let users;
    if (role === 'admin') {
      users = await dbAll(
        `SELECT u.id, u.name, u.email, u.role, u.department_id, u.avatar, u.created_at, d.code as dept_code, d.name as dept_name,
                p.roll_number, p.employee_id, p.designation, p.specialization, p.phone, p.office_room, COALESCE(p.academic_year, 1) as academic_year
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         LEFT JOIN profiles p ON u.id = p.user_id
         ORDER BY u.created_at DESC`
      );
    } else {
      users = await dbAll(
        `SELECT u.id, u.name, u.email, u.role, u.department_id, u.avatar, d.code as dept_code, d.name as dept_name,
                p.roll_number, p.employee_id, p.designation, p.specialization, p.phone, p.office_room, COALESCE(p.academic_year, 1) as academic_year
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
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin Create User
app.post('/api/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
  const { name, email, password, role, department_id, roll_number, employee_id, designation, batch_year, academic_year } = req.body;

  if (!name || !email || !password || !role || !department_id) {
    return res.status(400).json({ error: 'Required fields: name, email, password, role, department_id' });
  }

  const validRoles = ['student', 'teacher', 'hod'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Role must be: student, teacher, or hod' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const result = await dbRun(
      `INSERT INTO users (name, email, password, role, department_id, profile_completed, avatar) VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [name, email, passwordHash, role, department_id, avatar]
    );

    const userId = result.lastID;

    await dbRun(
      `INSERT INTO profiles (user_id, roll_number, employee_id, designation, batch_year, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, roll_number || null, employee_id || null, designation || null, batch_year || (academic_year === 2 ? '2024 - 2028' : '2025 - 2029'), Number(academic_year || 1)]
    );

    res.status(201).json({ message: `${role.toUpperCase()} account created successfully!`, userId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// Admin Delete User (cannot delete own account)
app.delete('/api/admin/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  const targetId = parseInt(req.params.id);

  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account' });
  }

  try {
    const user = await dbGet('SELECT id, name, role FROM users WHERE id = ?', [targetId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin accounts through this interface' });
    }

    // Cascade: delete related data
    await dbRun('DELETE FROM profiles WHERE user_id = ?', [targetId]);
    await dbRun('DELETE FROM enrollments WHERE student_id = ?', [targetId]);
    await dbRun('DELETE FROM attendance WHERE student_id = ?', [targetId]);
    await dbRun('DELETE FROM submissions WHERE student_id = ?', [targetId]);
    await dbRun('DELETE FROM grades WHERE student_id = ?', [targetId]);
    await dbRun('DELETE FROM users WHERE id = ?', [targetId]);

    res.json({ message: `User "${user.name}" deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

// Handle 404 for unknown API routes
app.use('/api/*splat', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
});

// Generic error handler (never expose stack traces)
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'An internal server error occurred' });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`\n✅ Alexandria ERP Backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}\n`);
});

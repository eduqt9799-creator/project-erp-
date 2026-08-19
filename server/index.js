require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const { initSheets, appendToSheet, getAllSheetUrls } = require('./sheets');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'alexandria_fallback_dev_secret';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim());

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
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

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
  }
  next();
};

// ==========================================
// GOOGLE SHEETS INITIALIZATION
// ==========================================
initSheets().catch(err => console.error('[Sheets] Init error:', err.message));

// ==========================================
// 1. PUBLIC & AUTH ROUTES
// ==========================================

app.get('/api/departments', async (req, res) => {
  try {
    const departments = await dbAll('SELECT * FROM departments ORDER BY code ASC');
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

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

    const deptName = newUser?.dept_name || 'N/A';
    appendToSheet(role, [name, email, role, deptName, new Date().toISOString(), 'Self-Registration', '']).catch(() => {});

    res.status(201).json({ message: 'User registered successfully', token, user: newUser });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

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

app.put('/api/profile', authenticateToken, async (req, res) => {
  const { phone, bio, office_room, roll_number, employee_id, batch_year, designation, specialization, name } = req.body;
  const userId = req.user.id;

  try {
    await dbRun(
      `UPDATE profiles SET phone = ?, bio = ?, office_room = ?, roll_number = ?, employee_id = ?, batch_year = ?, designation = ?, specialization = ? WHERE user_id = ?`,
      [phone || null, bio || null, office_room || null, roll_number || null, employee_id || null, batch_year || null, designation || null, specialization || null, userId]
    );

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

      const study_materials = await dbAll(
        `SELECT sm.*, u.name as uploader_name FROM study_materials sm
         LEFT JOIN users u ON sm.uploaded_by = u.id
         WHERE sm.department_id = ?
         ORDER BY sm.created_at DESC LIMIT 5`,
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
        recentAttendance,
        study_materials
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

      const study_materials = await dbAll(
        `SELECT sm.*, u.name as uploader_name FROM study_materials sm
         LEFT JOIN users u ON sm.uploaded_by = u.id
         WHERE sm.department_id = ?
         ORDER BY sm.created_at DESC LIMIT 5`,
        [department_id]
      );

      const recentNotifications = await dbAll(
        `SELECT n.*, u.name as sender_name FROM notifications n
         LEFT JOIN users u ON n.sender_id = u.id
         WHERE n.receiver_id = ?
         ORDER BY n.created_at DESC LIMIT 10`,
        [userId]
      );

      const unreadNotificationCount = await dbGet(
        `SELECT COUNT(*) as count FROM notifications WHERE receiver_id = ? AND is_read = 0`,
        [userId]
      );

      const timetable = await dbAll(
        `SELECT t.*, c.code as course_code, c.name as course_name
         FROM timetables t
         JOIN courses c ON t.course_id = c.id
         WHERE t.department_id = ?
         ORDER BY CASE t.day_of_week
           WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7
         END, t.start_time ASC`,
        [department_id]
      );

      return res.json({
        role: 'student',
        department: dept,
        enrolledCourses: departmentCourses,
        assignments,
        attendanceRecords,
        courseAttendanceBreakdown,
        overallPercentage,
        totalClasses,
        totalPresent,
        grades,
        announcements,
        teachersList,
        study_materials,
        notifications: recentNotifications,
        unread_count: unreadNotificationCount?.count || 0,
        timetable
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
      [code, name, deptId, teacher_id || null, credits || 3, semester || null]
    );
    res.status(201).json({ id: result.lastID, message: 'Course created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

app.delete('/api/courses/:id', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const courseId = req.params.id;
  const { role, department_id } = req.user;

  try {
    const course = await dbGet('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (role === 'hod' && course.department_id !== department_id) {
      return res.status(403).json({ error: 'You can only delete courses in your department' });
    }

    await dbRun('DELETE FROM courses WHERE id = ?', [courseId]);
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

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

    const existing = await dbGet('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?', [assignmentId, studentId]);
    if (existing) {
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

app.post('/api/announcements', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { title, content, target_role, department_id, academic_year } = req.body;
  const deptId = req.user.role === 'admin' ? (department_id || req.user.department_id) : req.user.department_id;
  const authorId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO announcements (department_id, author_id, title, content, target_role, academic_year) VALUES (?, ?, ?, ?, ?, ?)`,
      [deptId, authorId, title, content, target_role || 'all', academic_year || null]
    );
    res.status(201).json({ id: result.lastID, message: 'Announcement broadcasted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post announcement' });
  }
});

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
// 9. HOD FACULTY MANAGEMENT API
// ==========================================

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

    const hodDept = await dbGet('SELECT name FROM departments WHERE id = ?', [deptId]).catch(() => null);
    const hodExtra = `Emp ID: ${employee_id || `EMP-CSE-${userId}`}, Designation: ${designation || 'Associate Professor'}, Specialization: ${specialization || 'Computer Science'}`;
    appendToSheet('teacher', [name, email, 'teacher', hodDept?.name || 'N/A', new Date().toISOString(), 'HOD-Created', hodExtra]).catch(() => {});

    res.status(201).json({ message: `Faculty account created for ${name}!`, id: userId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create faculty account' });
  }
});

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
// 10. ATTENDANCE API
// ==========================================

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

// ==========================================
// 11. USER MANAGEMENT API
// ==========================================

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

    const adminDept = await dbGet('SELECT name FROM departments WHERE id = ?', [department_id]).catch(() => null);
    const extraInfo = role === 'student' ? `Roll: ${roll_number || 'N/A'}, Batch: ${batch_year || 'N/A'}` : `Emp ID: ${employee_id || 'N/A'}, Designation: ${designation || 'N/A'}`;
    appendToSheet(role, [name, email, role, adminDept?.name || 'N/A', new Date().toISOString(), 'Admin-Created', extraInfo]).catch(() => {});

    res.status(201).json({ message: `${role.toUpperCase()} account created successfully!`, userId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

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
// 12. STUDY MATERIALS API
// ==========================================

app.get('/api/study-materials', authenticateToken, async (req, res) => {
  const { department_id, role } = req.user;
  const { semester, academic_year, file_type, search } = req.query;

  try {
    let sql, params;

    if (role === 'admin') {
      sql = `SELECT sm.*, u.name as uploader_name, d.code as dept_code
             FROM study_materials sm
             LEFT JOIN users u ON sm.uploaded_by = u.id
             LEFT JOIN departments d ON sm.department_id = d.id
             WHERE 1=1`;
      params = [];
    } else {
      sql = `SELECT sm.*, u.name as uploader_name
             FROM study_materials sm
             LEFT JOIN users u ON sm.uploaded_by = u.id
             WHERE sm.department_id = ?`;
      params = [department_id];
    }

    if (semester) { sql += ' AND sm.semester = ?'; params.push(semester); }
    if (academic_year) { sql += ' AND sm.academic_year = ?'; params.push(academic_year); }
    if (file_type) { sql += ' AND sm.file_type = ?'; params.push(file_type); }
    if (search) { sql += ' AND (sm.title LIKE ? OR sm.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    sql += ' ORDER BY sm.created_at DESC';

    const materials = await dbAll(sql, params);
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch study materials' });
  }
});

app.post('/api/study-materials', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { title, description, file_type, file_url, file_name, semester, academic_year, subject_id } = req.body;
  const deptId = req.user.department_id;
  const uploadedBy = req.user.id;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const validFileTypes = ['notes', 'pdf', 'ppt', 'doc', 'video', 'image', 'zip'];
  if (file_type && !validFileTypes.includes(file_type)) {
    return res.status(400).json({ error: `Invalid file_type. Must be one of: ${validFileTypes.join(', ')}` });
  }

  try {
    const result = await dbRun(
      `INSERT INTO study_materials (department_id, uploaded_by, subject_id, title, description, file_type, file_url, file_name, semester, academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [deptId, uploadedBy, subject_id || null, title, description || null, file_type || null, file_url || null, file_name || null, semester || null, academic_year || null]
    );
    res.status(201).json({ id: result.lastID, message: 'Study material uploaded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload study material' });
  }
});

app.delete('/api/study-materials/:id', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const materialId = parseInt(req.params.id);
  const { role, department_id, id: userId } = req.user;

  try {
    const material = await dbGet('SELECT * FROM study_materials WHERE id = ?', [materialId]);
    if (!material) return res.status(404).json({ error: 'Study material not found' });

    if (role === 'teacher' && material.uploaded_by !== userId) {
      return res.status(403).json({ error: 'You can only delete materials you uploaded' });
    }

    if (role === 'hod' && material.department_id !== department_id) {
      return res.status(403).json({ error: 'You can only delete materials in your department' });
    }

    await dbRun('DELETE FROM study_materials WHERE id = ?', [materialId]);
    res.json({ message: 'Study material deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete study material' });
  }
});

// ==========================================
// 13. NOTIFICATIONS API
// ==========================================

app.get('/api/notifications', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { unread } = req.query;

  try {
    let sql = `SELECT n.*, u.name as sender_name
               FROM notifications n
               LEFT JOIN users u ON n.sender_id = u.id
               WHERE n.receiver_id = ?`;
    const params = [userId];

    if (unread === 'true') {
      sql += ' AND n.is_read = 0';
    }

    sql += ' ORDER BY n.created_at DESC';

    const notifications = await dbAll(sql, params);

    const unreadCount = await dbGet(
      'SELECT COUNT(*) as count FROM notifications WHERE receiver_id = ? AND is_read = 0',
      [userId]
    );

    res.json({ notifications, unread_count: unreadCount?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { receiver_id, title, message, type } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !title || !message) {
    return res.status(400).json({ error: 'receiver_id, title, and message are required' });
  }

  const validTypes = ['notification', 'announcement', 'system'];
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
  }

  try {
    const result = await dbRun(
      `INSERT INTO notifications (sender_id, receiver_id, title, message, type) VALUES (?, ?, ?, ?, ?)`,
      [sender_id, receiver_id, title, message, type || 'notification']
    );
    res.status(201).json({ id: result.lastID, message: 'Notification sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  const notifId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const notif = await dbGet('SELECT * FROM notifications WHERE id = ?', [notifId]);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    if (notif.receiver_id !== userId) {
      return res.status(403).json({ error: 'You can only mark your own notifications as read' });
    }

    await dbRun('UPDATE notifications SET is_read = 1 WHERE id = ?', [notifId]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    await dbRun('UPDATE notifications SET is_read = 1 WHERE receiver_id = ? AND is_read = 0', [userId]);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  const notifId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const notif = await dbGet('SELECT * FROM notifications WHERE id = ?', [notifId]);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    if (notif.receiver_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own notifications' });
    }

    await dbRun('DELETE FROM notifications WHERE id = ?', [notifId]);
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ==========================================
// 14. CHAT API
// ==========================================

app.get('/api/chat/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations = await dbAll(
      `SELECT
         CASE WHEN cm.sender_id = ? THEN cm.receiver_id ELSE cm.sender_id END as other_user_id,
         u.name as other_user_name,
         u.avatar as other_user_avatar,
         u.role as other_user_role,
         cm.message as last_message,
         cm.created_at as last_message_at,
         (SELECT COUNT(*) FROM chat_messages cm2
          WHERE cm2.sender_id = cm2.sender_id AND cm2.is_read = 0
            AND ((cm2.sender_id = CASE WHEN cm.sender_id = ? THEN cm.receiver_id ELSE cm.sender_id END) AND cm2.receiver_id = ?)
         ) as unread_count
       FROM chat_messages cm
       JOIN users u ON u.id = CASE WHEN cm.sender_id = ? THEN cm.receiver_id ELSE cm.sender_id END
       WHERE cm.sender_id = ? OR cm.receiver_id = ?
       GROUP BY other_user_id
       ORDER BY last_message_at DESC`,
      [userId, userId, userId, userId, userId, userId]
    );

    const result = await Promise.all(conversations.map(async (conv) => {
      const unread = await dbGet(
        `SELECT COUNT(*) as count FROM chat_messages
         WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
        [conv.other_user_id, userId]
      );
      return { ...conv, unread_count: unread?.count || 0 };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/chat/messages/:userId', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = parseInt(req.params.userId);

  try {
    const messages = await dbAll(
      `SELECT cm.*, u.name as sender_name
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE (cm.sender_id = ? AND cm.receiver_id = ?)
          OR (cm.sender_id = ? AND cm.receiver_id = ?)
       ORDER BY cm.created_at ASC`,
      [currentUserId, otherUserId, otherUserId, currentUserId]
    );

    await dbRun(
      `UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
      [otherUserId, currentUserId]
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/chat/messages', authenticateToken, async (req, res) => {
  const sender_id = req.user.id;
  const { receiver_id, message } = req.body;

  if (!receiver_id || !message || !message.trim()) {
    return res.status(400).json({ error: 'receiver_id and message are required' });
  }

  try {
    const receiver = await dbGet('SELECT id FROM users WHERE id = ?', [receiver_id]);
    if (!receiver) return res.status(404).json({ error: 'Recipient user not found' });

    const result = await dbRun(
      `INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)`,
      [sender_id, receiver_id, message.trim()]
    );

    const newMsg = await dbGet('SELECT cm.*, u.name as sender_name FROM chat_messages cm JOIN users u ON cm.sender_id = u.id WHERE cm.id = ?', [result.lastID]);
    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/chat/unread-count', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await dbGet(
      'SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = ? AND is_read = 0',
      [userId]
    );
    res.json({ unread_count: result?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ==========================================
// 15. DISCUSSION FORUM API
// ==========================================

app.get('/api/discussions', authenticateToken, async (req, res) => {
  const { department_id } = req.user;

  try {
    const discussions = await dbAll(
      `SELECT d.*, u.name as author_name, u.avatar as author_avatar,
              (SELECT COUNT(*) FROM discussion_replies dr WHERE dr.discussion_id = d.id) as reply_count
       FROM discussions d
       LEFT JOIN users u ON d.author_id = u.id
       WHERE d.department_id = ?
       ORDER BY d.created_at DESC`,
      [department_id]
    );
    res.json(discussions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch discussions' });
  }
});

app.post('/api/discussions', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  const author_id = req.user.id;
  const department_id = req.user.department_id;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO discussions (author_id, department_id, title, content) VALUES (?, ?, ?, ?)`,
      [author_id, department_id, title, content]
    );
    res.status(201).json({ id: result.lastID, message: 'Discussion created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create discussion' });
  }
});

app.get('/api/discussions/:id', authenticateToken, async (req, res) => {
  const discussionId = parseInt(req.params.id);

  try {
    const discussion = await dbGet(
      `SELECT d.*, u.name as author_name, u.avatar as author_avatar
       FROM discussions d
       LEFT JOIN users u ON d.author_id = u.id
       WHERE d.id = ?`,
      [discussionId]
    );
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

    const replies = await dbAll(
      `SELECT dr.*, u.name as author_name, u.avatar as author_avatar
       FROM discussion_replies dr
       LEFT JOIN users u ON dr.author_id = u.id
       WHERE dr.discussion_id = ?
       ORDER BY dr.created_at ASC`,
      [discussionId]
    );

    res.json({ ...discussion, replies });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch discussion' });
  }
});

app.post('/api/discussions/:id/replies', authenticateToken, async (req, res) => {
  const discussionId = parseInt(req.params.id);
  const { content } = req.body;
  const author_id = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const discussion = await dbGet('SELECT id FROM discussions WHERE id = ?', [discussionId]);
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

    const result = await dbRun(
      `INSERT INTO discussion_replies (discussion_id, author_id, content) VALUES (?, ?, ?)`,
      [discussionId, author_id, content.trim()]
    );

    const reply = await dbGet(
      `SELECT dr.*, u.name as author_name, u.avatar as author_avatar
       FROM discussion_replies dr LEFT JOIN users u ON dr.author_id = u.id
       WHERE dr.id = ?`,
      [result.lastID]
    );

    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

app.delete('/api/discussions/:id', authenticateToken, async (req, res) => {
  const discussionId = parseInt(req.params.id);
  const { role, department_id, id: userId } = req.user;

  try {
    const discussion = await dbGet('SELECT * FROM discussions WHERE id = ?', [discussionId]);
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

    if (role === 'student' && discussion.author_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own discussions' });
    }

    if (role === 'hod' && discussion.department_id !== department_id) {
      return res.status(403).json({ error: 'You can only delete discussions in your department' });
    }

    await dbRun('DELETE FROM discussion_replies WHERE discussion_id = ?', [discussionId]);
    await dbRun('DELETE FROM discussions WHERE id = ?', [discussionId]);
    res.json({ message: 'Discussion deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete discussion' });
  }
});

// ==========================================
// 16. TIMETABLE API
// ==========================================

app.get('/api/timetable', authenticateToken, async (req, res) => {
  const { department_id, role } = req.user;
  const { academic_year } = req.query;

  try {
    let sql, params;

    if (role === 'admin') {
      sql = `SELECT t.*, c.code as course_code, c.name as course_name, d.code as dept_code
             FROM timetables t
             JOIN courses c ON t.course_id = c.id
             LEFT JOIN departments d ON t.department_id = d.id
             WHERE 1=1`;
      params = [];
    } else {
      sql = `SELECT t.*, c.code as course_code, c.name as course_name
             FROM timetables t
             JOIN courses c ON t.course_id = c.id
             WHERE t.department_id = ?`;
      params = [department_id];
    }

    if (academic_year) { sql += ' AND t.academic_year = ?'; params.push(academic_year); }

    sql += ` ORDER BY CASE t.day_of_week
      WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7
    END, t.start_time ASC`;

    const entries = await dbAll(sql, params);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

app.post('/api/timetable', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const { course_id, day_of_week, start_time, end_time, room, academic_year } = req.body;
  const deptId = req.user.department_id;

  if (!course_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ error: 'course_id, day_of_week, start_time, and end_time are required' });
  }

  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  if (!validDays.includes(day_of_week)) {
    return res.status(400).json({ error: `Invalid day_of_week. Must be one of: ${validDays.join(', ')}` });
  }

  try {
    const result = await dbRun(
      `INSERT INTO timetables (course_id, department_id, day_of_week, start_time, end_time, room, academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [course_id, deptId, day_of_week, start_time, end_time, room || null, academic_year || null]
    );
    res.status(201).json({ id: result.lastID, message: 'Timetable entry created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
});

app.delete('/api/timetable/:id', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const entryId = parseInt(req.params.id);
  const { role, department_id } = req.user;

  try {
    const entry = await dbGet('SELECT * FROM timetables WHERE id = ?', [entryId]);
    if (!entry) return res.status(404).json({ error: 'Timetable entry not found' });

    if (role === 'hod' && entry.department_id !== department_id) {
      return res.status(403).json({ error: 'You can only delete timetable entries in your department' });
    }

    await dbRun('DELETE FROM timetables WHERE id = ?', [entryId]);
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
});

// ==========================================
// 17. EXAMS API
// ==========================================

app.get('/api/exams', authenticateToken, async (req, res) => {
  const { department_id, role } = req.user;
  const { semester, exam_type } = req.query;

  try {
    let sql, params;

    if (role === 'admin') {
      sql = `SELECT e.*, c.code as course_code, c.name as course_name, d.code as dept_code
             FROM exams e
             JOIN courses c ON e.course_id = c.id
             LEFT JOIN departments d ON e.department_id = d.id
             WHERE 1=1`;
      params = [];
    } else {
      sql = `SELECT e.*, c.code as course_code, c.name as course_name
             FROM exams e
             JOIN courses c ON e.course_id = c.id
             WHERE e.department_id = ?`;
      params = [department_id];
    }

    if (semester) { sql += ' AND e.semester = ?'; params.push(semester); }
    if (exam_type) { sql += ' AND e.exam_type = ?'; params.push(exam_type); }

    sql += ' ORDER BY e.date ASC, e.start_time ASC';

    const exams = await dbAll(sql, params);
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

app.post('/api/exams', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { course_id, title, exam_type, date, start_time, end_time, room, semester } = req.body;
  const deptId = req.user.department_id;

  if (!course_id || !title || !exam_type) {
    return res.status(400).json({ error: 'course_id, title, and exam_type are required' });
  }

  const validExamTypes = ['internal', 'midterm', 'final'];
  if (!validExamTypes.includes(exam_type)) {
    return res.status(400).json({ error: `Invalid exam_type. Must be one of: ${validExamTypes.join(', ')}` });
  }

  try {
    const result = await dbRun(
      `INSERT INTO exams (course_id, department_id, title, exam_type, date, start_time, end_time, room, semester)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, deptId, title, exam_type, date || null, start_time || null, end_time || null, room || null, semester || null]
    );
    res.status(201).json({ id: result.lastID, message: 'Exam scheduled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule exam' });
  }
});

app.put('/api/exams/:id', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const examId = parseInt(req.params.id);
  const { role, department_id } = req.user;
  const { course_id, title, exam_type, date, start_time, end_time, room, semester } = req.body;

  try {
    const exam = await dbGet('SELECT * FROM exams WHERE id = ?', [examId]);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (role !== 'admin' && exam.department_id !== department_id) {
      return res.status(403).json({ error: 'You can only update exams in your department' });
    }

    await dbRun(
      `UPDATE exams SET course_id = ?, title = ?, exam_type = ?, date = ?, start_time = ?, end_time = ?, room = ?, semester = ? WHERE id = ?`,
      [course_id || exam.course_id, title || exam.title, exam_type || exam.exam_type, date || exam.date, start_time || exam.start_time, end_time || exam.end_time, room || exam.room, semester || exam.semester, examId]
    );
    res.json({ message: 'Exam updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

app.delete('/api/exams/:id', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const examId = parseInt(req.params.id);
  const { role, department_id } = req.user;

  try {
    const exam = await dbGet('SELECT * FROM exams WHERE id = ?', [examId]);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (role !== 'admin' && exam.department_id !== department_id) {
      return res.status(403).json({ error: 'You can only delete exams in your department' });
    }

    await dbRun('DELETE FROM exams WHERE id = ?', [examId]);
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// ==========================================
// 18. INTERNAL MARKS API
// ==========================================

app.get('/api/internal-marks', authenticateToken, async (req, res) => {
  const { role, department_id, id: userId } = req.user;
  const { student_id, course_id } = req.query;

  try {
    let sql, params;

    if (role === 'student') {
      sql = `SELECT im.*, c.code as course_code, c.name as course_name
             FROM internal_marks im
             JOIN courses c ON im.course_id = c.id
             WHERE im.student_id = ?`;
      params = [userId];
    } else if (role === 'admin') {
      sql = `SELECT im.*, c.code as course_code, c.name as course_name, u.name as student_name, p.roll_number
             FROM internal_marks im
             JOIN courses c ON im.course_id = c.id
             JOIN users u ON im.student_id = u.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE 1=1`;
      params = [];
    } else {
      sql = `SELECT im.*, c.code as course_code, c.name as course_name, u.name as student_name, p.roll_number
             FROM internal_marks im
             JOIN courses c ON im.course_id = c.id
             JOIN users u ON im.student_id = u.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE c.department_id = ?`;
      params = [department_id];
    }

    if (student_id) { sql += ' AND im.student_id = ?'; params.push(student_id); }
    if (course_id) { sql += ' AND im.course_id = ?'; params.push(course_id); }

    sql += ' ORDER BY u.name ASC, c.code ASC, im.exam_type ASC';

    const marks = await dbAll(sql, params);
    res.json(marks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch internal marks' });
  }
});

app.post('/api/internal-marks', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const { student_id, course_id, exam_type, marks_obtained, max_marks, remarks, academic_year } = req.body;

  if (!student_id || !course_id || !exam_type) {
    return res.status(400).json({ error: 'student_id, course_id, and exam_type are required' });
  }

  const validExamTypes = ['assessment1', 'assessment2', 'midterm', 'assignment'];
  if (!validExamTypes.includes(exam_type)) {
    return res.status(400).json({ error: `Invalid exam_type. Must be one of: ${validExamTypes.join(', ')}` });
  }

  try {
    const result = await dbRun(
      `INSERT INTO internal_marks (student_id, course_id, exam_type, marks_obtained, max_marks, remarks, academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [student_id, course_id, exam_type, marks_obtained || null, max_marks || null, remarks || null, academic_year || null]
    );
    res.status(201).json({ id: result.lastID, message: 'Internal marks recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record internal marks' });
  }
});

app.delete('/api/internal-marks/:id', authenticateToken, requireRole('teacher', 'hod', 'admin'), async (req, res) => {
  const markId = parseInt(req.params.id);

  try {
    const mark = await dbGet('SELECT id FROM internal_marks WHERE id = ?', [markId]);
    if (!mark) return res.status(404).json({ error: 'Internal marks record not found' });

    await dbRun('DELETE FROM internal_marks WHERE id = ?', [markId]);
    res.json({ message: 'Internal marks record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete internal marks' });
  }
});

// ==========================================
// 19. SEMESTER RESULTS API
// ==========================================

app.get('/api/semester-results', authenticateToken, async (req, res) => {
  const { role, department_id, id: userId } = req.user;

  try {
    let sql, params;

    if (role === 'student') {
      sql = `SELECT sr.*, u.name as student_name
             FROM semester_results sr
             JOIN users u ON sr.student_id = u.id
             WHERE sr.student_id = ?`;
      params = [userId];
    } else if (role === 'admin') {
      sql = `SELECT sr.*, u.name as student_name, p.roll_number, d.code as dept_code
             FROM semester_results sr
             JOIN users u ON sr.student_id = u.id
             LEFT JOIN profiles p ON u.id = p.user_id
             LEFT JOIN departments d ON u.department_id = d.id
             ORDER BY u.name ASC, sr.semester ASC`;
      params = [];
    } else {
      sql = `SELECT sr.*, u.name as student_name, p.roll_number
             FROM semester_results sr
             JOIN users u ON sr.student_id = u.id
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.department_id = ?
             ORDER BY u.name ASC, sr.semester ASC`;
      params = [department_id];
    }

    const results = await dbAll(sql, params);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch semester results' });
  }
});

app.post('/api/semester-results', authenticateToken, requireRole('hod', 'admin'), async (req, res) => {
  const { student_id, semester, sgpa, cgpa, total_credits, academic_year } = req.body;

  if (!student_id || !semester) {
    return res.status(400).json({ error: 'student_id and semester are required' });
  }

  try {
    const existing = await dbGet(
      'SELECT id FROM semester_results WHERE student_id = ? AND semester = ?',
      [student_id, semester]
    );

    if (existing) {
      await dbRun(
        `UPDATE semester_results SET sgpa = ?, cgpa = ?, total_credits = ?, academic_year = ? WHERE id = ?`,
        [sgpa || null, cgpa || null, total_credits || null, academic_year || null, existing.id]
      );
      res.json({ message: 'Semester result updated successfully' });
    } else {
      const result = await dbRun(
        `INSERT INTO semester_results (student_id, semester, sgpa, cgpa, total_credits, academic_year)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [student_id, semester, sgpa || null, cgpa || null, total_credits || null, academic_year || null]
      );
      res.status(201).json({ id: result.lastID, message: 'Semester result recorded successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save semester result' });
  }
});

// ==========================================
// 20. GOOGLE SHEETS ENDPOINTS
// ==========================================

app.get('/api/sheets/urls', (req, res) => {
  const urls = getAllSheetUrls();
  res.json(urls);
});

app.post('/api/sheets/sync-local', async (req, res) => {
  const { name, email, role, department } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'name, email, and role are required' });
  }

  const ok = await appendToSheet(role, [
    name,
    email,
    role,
    department || 'N/A',
    new Date().toISOString(),
    'Self-Registration',
    ''
  ]);

  if (ok) {
    res.json({ message: 'Registration synced to Google Sheets' });
  } else {
    res.status(503).json({ error: 'Google Sheets sync unavailable' });
  }
});

// ==========================================
// ERROR HANDLERS (must be after all routes)
// ==========================================

app.use('/api/*splat', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
});

app.use((err, req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'An internal server error occurred' });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`\n Alexandria ERP Backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}\n`);
});

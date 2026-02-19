import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

// Vercel ortamında .env otomatik yüklenir ama yerel geliştirme için tutuyoruz
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Veritabanı Bağlantısı (Neon / Vercel Postgres)
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, 
  },
});

// --- API ROUTES ---

// 1. AUTH & USERS
app.post('/api/auth/login', async (req, res) => {
  const { email, role } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, role]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(401).json({ error: 'Kullanıcı bulunamadı veya rol hatalı.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, role, schoolName } = req.body;
  try {
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
    }

    const result = await pool.query(
      'INSERT INTO users (name, email, role, school_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, role, schoolName]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. STUDENTS
app.get('/api/students', async (req, res) => {
  const { userId, role } = req.query;
  try {
    let query = 'SELECT * FROM students';
    let params = [];

    if (role === 'parent') {
      query += ' WHERE parent_id = $1';
      params = [userId];
    } else if (role === 'teacher') {
      query += ' WHERE teacher_id = $1';
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  const { parentId, teacherId, name, age, grade, gender, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO students (parent_id, teacher_id, name, age, grade, gender, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [parentId, teacherId, name, age, grade, gender, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ message: 'Öğrenci silindi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3. SCREENINGS (REPORTS)
app.get('/api/screenings', async (req, res) => {
  const { userId, role } = req.query;
  try {
    let query = `
      SELECT s.*, st.name as "studentName" 
      FROM screenings s 
      JOIN students st ON s.student_id = st.id
    `;
    let params = [];

    if (role === 'parent') {
      query += ' WHERE st.parent_id = $1';
      params = [userId];
    } else if (role === 'teacher') {
      query += ' WHERE st.teacher_id = $1';
      params = [userId];
    } else if (role === 'student_specific') {
       query += ' WHERE s.student_id = $1';
       params = [userId]; 
    }

    query += ' ORDER BY s.date DESC';

    const result = await pool.query(query, params);
    
    const formattedRows = result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.studentName,
      completedBy: row.completed_by_role,
      totalScore: row.total_score,
      date: row.date,
      categoryScores: row.category_scores,
      aiAnalysis: row.ai_analysis
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/screenings', async (req, res) => {
  const { studentId, completedBy, totalScore, categoryScores, aiAnalysis, date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO screenings 
      (student_id, completed_by_role, total_score, category_scores, ai_analysis, date) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [studentId, completedBy, totalScore, categoryScores, aiAnalysis, date]
    );
    
    const row = result.rows[0];
    res.json({
        id: row.id,
        studentId: row.student_id,
        completedBy: row.completed_by_role,
        totalScore: row.total_score,
        date: row.date,
        categoryScores: row.category_scores,
        aiAnalysis: row.ai_analysis
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4. MESSAGES
app.get('/api/messages', async (req, res) => {
  const { userId } = req.query;
  try {
    const query = `
      SELECT m.*, u.name as "senderName"
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.receiver_id = $1 OR m.sender_id = $1
      ORDER BY m.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    
    const formattedRows = result.rows.map(row => ({
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      content: row.content,
      isRead: row.is_read,
      createdAt: row.created_at,
      senderName: row.senderName
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [senderId, receiverId, content]
    );
    const row = result.rows[0];
    res.json({
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      content: row.content,
      isRead: row.is_read,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Vercel için app'i dışa aktarıyoruz, listen YAPMIYORUZ.
export default app;
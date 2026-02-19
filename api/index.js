import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

// Vercel ortamında .env otomatik yüklenir
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Veritabanı Bağlantısı
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, 
  },
});

// Helper: CamelCase converter for DB rows
const toCamelCase = (rows) => {
  return rows.map(row => {
    const newRow = {};
    for (const key in row) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      newRow[camelKey] = row[key];
    }
    return newRow;
  });
};

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
      res.json(toCamelCase(result.rows)[0]);
    } else {
      res.status(401).json({ error: 'Kullanıcı bulunamadı' });
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
      return res.status(400).json({ error: 'Bu email zaten kayıtlı.' });
    }

    const result = await pool.query(
      'INSERT INTO users (name, email, role, school_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, role, schoolName]
    );
    res.json(toCamelCase(result.rows)[0]);
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
      params.push(userId);
    } else if (role === 'teacher') {
      query += ' WHERE teacher_id = $1';
      params.push(userId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(toCamelCase(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  const { name, age, grade, gender, parentId, teacherId, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO students (name, age, grade, gender, parent_id, teacher_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, age, grade, gender, parentId, teacherId, notes]
    );
    res.json(toCamelCase(result.rows)[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3. SCREENINGS
app.get('/api/screenings', async (req, res) => {
  const { userId, role } = req.query;
  try {
    let query = `
      SELECT s.*, st.name as student_name 
      FROM screenings s
      JOIN students st ON s.student_id = st.id
    `;
    let params = [];

    // "student_specific" özel bir rol değil, tekil öğrenci raporu çekmek için flag
    if (role === 'student_specific') {
       query += ` WHERE s.student_id = $1`;
       params.push(userId); // Burada userId aslında studentId olarak geliyor
    } else if (role === 'parent') {
      query += ` WHERE st.parent_id = $1`;
      params.push(userId);
    } else if (role === 'teacher') {
      query += ` WHERE st.teacher_id = $1`;
      params.push(userId);
    }

    query += ' ORDER BY s.date DESC';

    const result = await pool.query(query, params);
    
    // Manual mapping needed because of JSONB fields and join
    const mapped = result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      completedBy: row.completed_by_role,
      totalScore: row.total_score,
      date: row.date,
      categoryScores: row.category_scores,
      aiAnalysis: row.ai_analysis
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/screenings', async (req, res) => {
  const { studentId, completedBy, totalScore, categoryScores, aiAnalysis, date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO screenings (student_id, completed_by_role, total_score, category_scores, ai_analysis, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [studentId, completedBy, totalScore, JSON.stringify(categoryScores), JSON.stringify(aiAnalysis), date]
    );
    // Return formatted result
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

// 3.1 UPDATE SCREENING ANALYSIS (YENİ)
app.put('/api/screenings/:id/analysis', async (req, res) => {
  const { id } = req.params;
  const { aiAnalysis } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE screenings SET ai_analysis = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(aiAnalysis), id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    const row = result.rows[0];
    res.json({
       id: row.id,
       aiAnalysis: row.ai_analysis
    });
  } catch (err) {
    console.error("Analysis Update Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. MESSAGES
app.get('/api/messages', async (req, res) => {
  const { userId } = req.query;
  try {
    // Get messages where user is sender OR receiver
    // Join with users table to get sender name
    const query = `
      SELECT m.*, u.name as sender_name 
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.receiver_id = $1 OR m.sender_id = $1
      ORDER BY m.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    res.json(toCamelCase(result.rows));
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
    res.json(toCamelCase(result.rows)[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 5. EDUCATION PLANS (BEP)
app.get('/api/education-plans', async (req, res) => {
  const { userId, role, studentId } = req.query;
  try {
    let query = `
      SELECT ep.*, s.name as "studentName" 
      FROM education_plans ep
      JOIN students s ON ep.student_id = s.id
    `;
    let params = [];
    
    // Filtreleme Mantığı
    if (studentId && studentId !== 'undefined') {
       query += ` WHERE ep.student_id = $1`;
       params.push(studentId);
    } else if (role === 'teacher') {
       query += ` WHERE ep.teacher_id = $1`;
       params.push(userId);
    } else if (role === 'parent') {
       // Veliler sadece kendi öğrencilerinin planlarını görür
       query += ` WHERE s.parent_id = $1`;
       params.push(userId);
    }
    
    query += ` ORDER BY ep.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json(result.rows.map(row => ({
       id: row.id,
       studentId: row.student_id,
       teacherId: row.teacher_id,
       screeningId: row.screening_id,
       content: row.content, // JSONB postgres tarafından otomatik parse edilir
       createdAt: row.created_at,
       studentName: row.studentName
    })));
  } catch (err) {
    console.error("Education Plan Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/education-plans', async (req, res) => {
  const { studentId, teacherId, screeningId, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO education_plans (student_id, teacher_id, screening_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [studentId, teacherId, screeningId, JSON.stringify(content)]
    );
    
    const row = result.rows[0];
    res.json({
       id: row.id,
       studentId: row.student_id,
       teacherId: row.teacher_id,
       screeningId: row.screening_id,
       content: row.content,
       createdAt: row.created_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
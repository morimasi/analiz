import express, { Request, Response } from 'express';
import cors from 'cors';
import pg, { QueryResult } from 'pg';
import dotenv from 'dotenv';
import { User, Student, ScreeningResult, Message, EducationPlan, Invitation } from '../types';

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
const toCamelCase = <T extends Record<string, any>>(rows: Record<string, any>[]): T[] => {
  return rows.map(row => {
    const newRow: Record<string, any> = {};
    for (const key in row) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      newRow[camelKey] = row[key];
    }
    return newRow as T;
  });
};

// --- API ROUTES ---

// 1. AUTH & USERS
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, role } = req.body as Pick<User, 'email' | 'role'>;
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
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { name, email, role, schoolName } = req.body as User;
  try {
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Bu email zaten kayıtlı.' });
    }

    const result = await pool.query(
      'INSERT INTO users (name, email, role, school_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, role, schoolName]
    ) as QueryResult<User>;
    res.json(toCamelCase(result.rows)[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. STUDENTS
app.get('/api/students', async (req: Request, res: Response) => {
  const { userId, role } = req.query as { userId?: string; role?: string; };
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
    
    const result = await pool.query(query, params) as QueryResult<Student>;
    res.json(toCamelCase<Student>(result.rows));
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req: Request, res: Response) => {
  const { name, age, grade, gender, parentId, teacherId, notes } = req.body as Student;
  try {
    const result = await pool.query(
      'INSERT INTO students (name, age, grade, gender, parent_id, teacher_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, age, grade, gender, parentId, teacherId, notes]
    ) as QueryResult<Student>;
    res.json(toCamelCase<Student>(result.rows)[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// YENİ: Öğrenci Güncelleme (PUT)
app.put('/api/students/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, age, grade, gender, notes } = req.body as Partial<Student>;
  try {
    const result = await pool.query(
      'UPDATE students SET name=$1, age=$2, grade=$3, gender=$4, notes=$5 WHERE id=$6 RETURNING *',
      [name, age, grade, gender, notes, id]
    ) as QueryResult<Student>;
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }
    res.json(toCamelCase(result.rows)[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3. SCREENINGS
app.get('/api/screenings', async (req: Request, res: Response) => {
  const { userId, role } = req.query as { userId?: string; role?: string; };
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

    const result = await pool.query(query, params) as QueryResult<any>;
    
    // Manual mapping needed because of JSONB fields and join
    const mapped: ScreeningResult[] = result.rows.map(row => ({
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
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/screenings', async (req: Request, res: Response) => {
  const { studentId, completedBy, totalScore, categoryScores, aiAnalysis, date } = req.body as ScreeningResult;
  try {
    const result = await pool.query(
      'INSERT INTO screenings (student_id, completed_by_role, total_score, category_scores, ai_analysis, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [studentId, completedBy, totalScore, JSON.stringify(categoryScores), JSON.stringify(aiAnalysis), date]
    ) as QueryResult<ScreeningResult>;
    // Return formatted result
    const row: ScreeningResult = result.rows[0];
    res.json({
      id: row.id,
      studentId: row.studentId,
      completedBy: row.completedBy,
      totalScore: row.totalScore,
      date: row.date,
      categoryScores: row.categoryScores,
      aiAnalysis: row.aiAnalysis
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3.1 UPDATE SCREENING ANALYSIS (YENİ)
app.put('/api/screenings/:id/analysis', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { aiAnalysis } = req.body as Pick<ScreeningResult, 'aiAnalysis'>;
  
  try {
    const result = await pool.query(
      'UPDATE screenings SET ai_analysis = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(aiAnalysis), id]
    ) as QueryResult<ScreeningResult>;
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    const row = result.rows[0];
    res.json({
       id: row.id,
       aiAnalysis: row.aiAnalysis
    });
  } catch (err: any) {
    console.error("Analysis Update Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. MESSAGES
app.get('/api/messages', async (req: Request, res: Response) => {
  const { userId } = req.query as { userId?: string; };
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
    const result = await pool.query(query, [userId]) as QueryResult<Message>;
    res.json(toCamelCase<Message>(result.rows));
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req: Request, res: Response) => {
  const { senderId, receiverId, content } = req.body as Message;
  try {
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [senderId, receiverId, content]
    ) as QueryResult<Message>;
    res.json(toCamelCase<Message>(result.rows)[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 5. EDUCATION PLANS (BEP)
app.get('/api/education-plans', async (req: Request, res: Response) => {
  const { userId, role, studentId } = req.query as { userId?: string; role?: string; studentId?: string; };
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
    
    const result = await pool.query(query, params) as QueryResult<EducationPlan & { studentName: string }>;
    
    res.json(result.rows.map((row) => ({
       id: row.id,
       studentId: row.studentId,
       teacherId: row.teacherId,
       screeningId: row.screeningId,
       content: row.content, // JSONB postgres tarafından otomatik parse edilir
       createdAt: row.createdAt,
       studentName: row.studentName
    })));
  } catch (err: any) {
    console.error("Education Plan Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/education-plans', async (req: Request, res: Response) => {
  const { studentId, teacherId, screeningId, content } = req.body as EducationPlan;
  try {
    const result = await pool.query(
      'INSERT INTO education_plans (student_id, teacher_id, screening_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [studentId, teacherId, screeningId, JSON.stringify(content)]
    ) as QueryResult<EducationPlan>;
    
    const row: EducationPlan = result.rows[0];
    res.json({
       id: row.id,
       studentId: row.studentId,
       teacherId: row.teacherId,
       screeningId: row.screeningId,
       content: row.content,
       createdAt: row.createdAt
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 6. INVITATIONS (YENİ)
app.post('/api/invitations', async (req: Request, res: Response) => {
  const { teacherId, studentId, parentEmail } = req.body as Invitation;
  try {
    const result = await pool.query(
      'INSERT INTO invitations (teacher_id, student_id, parent_email) VALUES ($1, $2, $3) RETURNING id',
      [teacherId, studentId, parentEmail]
    ) as QueryResult<{ id: string }>;
    
    const inviteId: string = result.rows[0].id;
    // In a real app, this would be your actual domain
    const inviteLink = `https://mindscreen-ai.app/register?invite=${inviteId}`;
    
    res.json({ success: true, link: inviteLink });
  } catch (err) {
    console.error("Invitation Error:", err);
    res.status(500).json({ error: "Davetiye oluşturulamadı." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
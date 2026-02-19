import { User, Student, ScreeningResult, Role, Message } from '../types';

/* 
  =============================================================================
  VERİTABANI KURULUM REHBERİ (VERCEL POSTGRES)
  =============================================================================
  
  Vercel Storage sekmesinden yeni bir Postgres veritabanı oluşturun.
  Ardından "Query" sekmesinde aşağıdaki SQL komutlarını çalıştırarak tabloları oluşturun:

  -- 1. Kullanıcılar (Users)
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('parent', 'teacher', 'admin')) NOT NULL,
    school_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 2. Öğrenciler (Students)
  CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES users(id),
    teacher_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    grade TEXT NOT NULL,
    gender TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 3. Taramalar (Screenings)
  CREATE TABLE screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    completed_by_role TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    data JSONB NOT NULL, -- Tüm detaylı sonuç objesi burada saklanır
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 4. Mesajlar (Messages)
  CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  -- İndeksler (Performans için)
  CREATE INDEX idx_students_parent ON students(parent_id);
  CREATE INDEX idx_students_teacher ON students(teacher_id);
  CREATE INDEX idx_screenings_student ON screenings(student_id);
*/

// --- LOCAL STORAGE MOCK ADAPTER (FALLBACK) ---
// Not: Gerçek Vercel entegrasyonu için /api/auth, /api/students gibi Serverless Function'lar yazılmalıdır.
// Bu dosya şu an tarayıcıda çalıştığı için LocalStorage kullanmaya devam eder ancak
// yapı, gerçek bir API servisine (fetch calls) dönüştürülmeye hazırdır.

const KEYS = {
  USERS: 'mindscreen_users',
  STUDENTS: 'mindscreen_students',
  SCREENINGS: 'mindscreen_screenings',
  MESSAGES: 'mindscreen_messages',
  CURRENT_USER: 'mindscreen_current_user',
};

const generateId = () => Math.random().toString(36).substr(2, 9);
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Demo Data Seeding
const seedMockData = () => {
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  if (users.length === 0) {
    const demoParent: User = { id: 'demo_parent_1', name: 'Demo Veli', email: 'veli@demo.com', role: 'parent' };
    const demoTeacher: User = { id: 'demo_teacher_1', name: 'Demo Öğretmen', email: 'ogretmen@demo.com', role: 'teacher', schoolName: 'Atatürk İlkokulu' };
    const demoAdmin: User = { id: 'demo_admin_1', name: 'Sistem Yöneticisi', email: 'admin@demo.com', role: 'admin' };

    // Mesajlaşma testi için ilişki kuralım
    const demoStudents: Student[] = [
      { id: 'student_1', parentId: 'demo_parent_1', teacherId: 'demo_teacher_1', name: 'Can Yılmaz', age: 8, grade: '2', gender: 'male', notes: 'Okumada biraz yavaş.' },
      { id: 'student_2', teacherId: 'demo_teacher_1', name: 'Zeynep Kaya', age: 7, grade: '1', gender: 'female' },
      { id: 'student_3', teacherId: 'demo_teacher_1', name: 'Ali Demir', age: 7, grade: '1', gender: 'male' }
    ];

    const demoMessages: Message[] = [
      {
        id: 'msg_1', senderId: 'demo_teacher_1', receiverId: 'demo_parent_1', 
        content: 'Merhaba, Can\'ın okuma hızında artış gözlemliyorum.', isRead: false, createdAt: new Date().toISOString(), senderName: 'Demo Öğretmen'
      }
    ];

    localStorage.setItem(KEYS.USERS, JSON.stringify([demoParent, demoTeacher, demoAdmin]));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(demoStudents));
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(demoMessages));
  }
};
seedMockData();

// --- API INTERFACE ---
// Bu metodlar ileride `fetch('/api/...')` çağrılarına dönüştürülecektir.

export const api = {
  
  // AUTH
  auth: {
    login: async (email: string, role: Role): Promise<User | null> => {
      await delay(500); 
      // Vercel Postgres: SELECT * FROM users WHERE email = $1
      const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      const user = users.find(u => u.email === email && u.role === role);
      if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      return user || null;
    },
    
    register: async (userData: Omit<User, 'id'>): Promise<User> => {
      await delay(800);
      const newUser = { ...userData, id: generateId() };
      
      // Vercel Postgres: INSERT INTO users ...
      const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      if (users.find((u: User) => u.email === userData.email)) throw new Error("Email kayıtlı.");
      users.push(newUser);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
      return newUser;
    },

    logout: async () => {
      localStorage.removeItem(KEYS.CURRENT_USER);
    },

    getCurrentUser: async (): Promise<User | null> => {
      const stored = localStorage.getItem(KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    }
  },

  // STUDENTS
  students: {
    list: async (userId: string, role: Role): Promise<Student[]> => {
      await delay(400);
      const all: Student[] = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
      
      // Admin: Hepsini görür
      if (role === 'admin') return all;

      // Parent: Sadece kendi çocukları
      if (role === 'parent') return all.filter(s => s.parentId === userId);
      
      // Teacher: Kendi eklediği veya atandığı öğrenciler
      return all.filter(s => s.teacherId === userId);
    },

    add: async (student: Omit<Student, 'id'>): Promise<Student> => {
      await delay(600);
      // Vercel Postgres: INSERT INTO students ...
      const newStudent = { ...student, id: generateId() };
      const all = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
      all.push(newStudent);
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(all));
      return newStudent;
    },

    delete: async (id: string) => {
      await delay(300);
      // Vercel Postgres: DELETE FROM students WHERE id = $1
      let all = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
      all = all.filter((s: Student) => s.id !== id);
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(all));
    }
  },

  // SCREENINGS (REPORTS)
  screenings: {
    save: async (result: ScreeningResult): Promise<ScreeningResult> => {
      await delay(1000); 
      const newResult = { ...result, id: generateId(), date: new Date().toISOString() };
      
      // Vercel Postgres: INSERT INTO screenings (student_id, data, ...) VALUES ...
      const all = JSON.parse(localStorage.getItem(KEYS.SCREENINGS) || '[]');
      all.push(newResult);
      localStorage.setItem(KEYS.SCREENINGS, JSON.stringify(all));
      return newResult;
    },

    listByUser: async (userId: string, role: Role): Promise<(ScreeningResult & { studentName: string })[]> => {
      await delay(500);
      const allScreenings: ScreeningResult[] = JSON.parse(localStorage.getItem(KEYS.SCREENINGS) || '[]');
      
      // Admin: Tüm raporları görür
      if (role === 'admin') {
         return allScreenings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      // Diğerleri için önce ilişkili öğrencileri bul
      const myStudents = await api.students.list(userId, role);
      const studentIds = myStudents.map(s => s.id);
      
      return allScreenings
        .filter(s => s.studentId && studentIds.includes(s.studentId))
        .map(s => {
          const student = myStudents.find(st => st.id === s.studentId);
          return { ...s, studentName: student ? student.name : s.studentName };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    // Y.md -> Bütünleşik Rapor (Aynı öğrenci için hem veli hem öğretmen raporunu getirir)
    getCombinedReport: async (studentId: string): Promise<ScreeningResult[]> => {
        await delay(300);
        const allScreenings: ScreeningResult[] = JSON.parse(localStorage.getItem(KEYS.SCREENINGS) || '[]');
        return allScreenings.filter(s => s.studentId === studentId);
    }
  },

  // MESSAGES
  messages: {
    list: async (userId: string): Promise<Message[]> => {
      await delay(300);
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      
      // Vercel Postgres: SELECT m.*, u.name as senderName FROM messages m JOIN users u ...
      return all
        .filter(m => m.receiverId === userId || m.senderId === userId)
        .map(m => ({
          ...m,
          senderName: users.find(u => u.id === m.senderId)?.name || 'Bilinmeyen'
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    send: async (msg: Omit<Message, 'id' | 'createdAt' | 'isRead'>): Promise<Message> => {
      await delay(400);
      const newMsg = {
        ...msg,
        id: generateId(),
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      const all = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      all.push(newMsg);
      localStorage.setItem(KEYS.MESSAGES, JSON.stringify(all));
      return newMsg;
    }
  }
};
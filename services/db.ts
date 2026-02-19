import { createClient } from '@supabase/supabase-js';
import { User, Student, ScreeningResult, Role, Message } from '../types';

/* 
  =============================================================================
  VERİTABANI KURULUM REHBERİ (SUPABASE)
  =============================================================================
  Canlıya geçmek için Supabase projesi oluşturun ve aşağıdaki SQL tablolarını kurun:

  1. profiles (users)
     - id: uuid (PK)
     - email: text
     - name: text
     - role: text ('parent', 'teacher')
     - school_name: text (optional)
  
  2. students
     - id: uuid (PK)
     - parent_id: uuid (FK -> profiles.id)
     - teacher_id: uuid (FK -> profiles.id)
     - name: text
     - age: int
     - grade: text
     - gender: text
     - notes: text

  3. screenings
     - id: uuid (PK)
     - student_id: uuid (FK -> students.id)
     - data: jsonb (Tüm sonuç objesi)
     - created_at: timestamp
  
  4. messages
     - id: uuid (PK)
     - sender_id: uuid
     - receiver_id: uuid
     - content: text
     - is_read: boolean
     - created_at: timestamp
*/

// Environment variables provided by Vite/Vercel
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase Client if keys exist
const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// --- LOCAL STORAGE MOCK ADAPTER (FALLBACK) ---
// Supabase keyleri yoksa bu çalışır.
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

    localStorage.setItem(KEYS.USERS, JSON.stringify([demoParent, demoTeacher]));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(demoStudents));
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(demoMessages));
  }
};
seedMockData();

// --- API INTERFACE ---

export const api = {
  
  // AUTH
  auth: {
    login: async (email: string, role: Role): Promise<User | null> => {
      await delay(500); // Simulate network
      if (supabase) {
        // Real implementation would use supabase.auth.signInWithPassword
        // For now, we simulate user table query as "login"
        const { data } = await supabase.from('profiles').select('*').eq('email', email).single();
        return data as User;
      } else {
        const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
        const user = users.find(u => u.email === email && u.role === role);
        if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
        return user || null;
      }
    },
    
    register: async (userData: Omit<User, 'id'>): Promise<User> => {
      await delay(800);
      const newUser = { ...userData, id: generateId() };
      
      if (supabase) {
        // Supabase Auth + Profiles insert
        // await supabase.auth.signUp(...)
        // await supabase.from('profiles').insert(newUser)
        return newUser; 
      } else {
        const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
        if (users.find((u: User) => u.email === userData.email)) throw new Error("Email kayıtlı.");
        users.push(newUser);
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
        return newUser;
      }
    },

    logout: async () => {
      if (supabase) await supabase.auth.signOut();
      localStorage.removeItem(KEYS.CURRENT_USER);
    },

    getCurrentUser: async (): Promise<User | null> => {
      // In a real app, check session token
      const stored = localStorage.getItem(KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    }
  },

  // STUDENTS
  students: {
    list: async (userId: string, role: Role): Promise<Student[]> => {
      await delay(400);
      if (supabase) {
        const column = role === 'parent' ? 'parent_id' : 'teacher_id';
        const { data } = await supabase.from('students').select('*').eq(column, userId);
        return data as Student[] || [];
      } else {
        const all: Student[] = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
        return role === 'parent' 
          ? all.filter(s => s.parentId === userId)
          : all.filter(s => s.teacherId === userId);
      }
    },

    add: async (student: Omit<Student, 'id'>): Promise<Student> => {
      await delay(600);
      const newStudent = { ...student, id: generateId() };
      if (supabase) {
         await supabase.from('students').insert(newStudent);
      } else {
        const all = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
        all.push(newStudent);
        localStorage.setItem(KEYS.STUDENTS, JSON.stringify(all));
      }
      return newStudent;
    },

    delete: async (id: string) => {
      await delay(300);
      if (supabase) {
        await supabase.from('students').delete().eq('id', id);
      } else {
        let all = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
        all = all.filter((s: Student) => s.id !== id);
        localStorage.setItem(KEYS.STUDENTS, JSON.stringify(all));
      }
    }
  },

  // SCREENINGS (REPORTS)
  screenings: {
    save: async (result: ScreeningResult): Promise<ScreeningResult> => {
      await delay(1000); // AI generation time simulation
      const newResult = { ...result, id: generateId(), date: new Date().toISOString() };
      
      if (supabase) {
         // Supabase stores JSONB
         await supabase.from('screenings').insert({
            student_id: result.studentId,
            data: newResult,
            created_at: newResult.date
         });
      } else {
        const all = JSON.parse(localStorage.getItem(KEYS.SCREENINGS) || '[]');
        all.push(newResult);
        localStorage.setItem(KEYS.SCREENINGS, JSON.stringify(all));
      }
      return newResult;
    },

    listByUser: async (userId: string, role: Role): Promise<(ScreeningResult & { studentName: string })[]> => {
      await delay(500);
      // First get students to join
      const myStudents = await api.students.list(userId, role);
      const studentIds = myStudents.map(s => s.id);

      if (supabase) {
        // Complex query simulation
        return [];
      } else {
        const allScreenings: ScreeningResult[] = JSON.parse(localStorage.getItem(KEYS.SCREENINGS) || '[]');
        return allScreenings
          .filter(s => s.studentId && studentIds.includes(s.studentId))
          .map(s => {
            const student = myStudents.find(st => st.id === s.studentId);
            return { ...s, studentName: student ? student.name : s.studentName };
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    }
  },

  // MESSAGES (NEW MODULE)
  messages: {
    list: async (userId: string): Promise<Message[]> => {
      await delay(300);
      if (supabase) return [];
      const all: Message[] = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
      const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
      
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
      
      if (supabase) {
        // insert
      } else {
        const all = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
        all.push(newMsg);
        localStorage.setItem(KEYS.MESSAGES, JSON.stringify(all));
      }
      return newMsg;
    }
  }
};
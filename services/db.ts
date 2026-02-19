import { User, Student, ScreeningResult, Role, Message, EducationPlan } from '../types';

/* 
  =============================================================================
  API CLIENT (FRONTEND)
  =============================================================================
*/

const KEYS = {
  CURRENT_USER: 'mindscreen_current_user',
};

export const api = {
  
  // AUTH
  auth: {
    login: async (email: string, role: Role): Promise<User | null> => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, role })
        });

        if (!response.ok) {
           if (response.status === 401) return null;
           throw new Error('Giriş başarısız');
        }

        const user = await response.json();
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
        return user;
      } catch (e) {
        console.error("Login Error:", e);
        return null;
      }
    },
    
    register: async (userData: Omit<User, 'id'>): Promise<User> => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Kayıt başarısız');
      }

      const newUser = await response.json();
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
      const response = await fetch(`/api/students?userId=${userId}&role=${role}`);
      if (!response.ok) return [];
      
      const rows = await response.json();
      return rows.map((r: any) => ({
        id: r.id,
        parentId: r.parent_id,
        teacherId: r.teacher_id,
        name: r.name,
        age: r.age,
        grade: r.grade,
        gender: r.gender,
        notes: r.notes
      }));
    },

    add: async (student: Omit<Student, 'id'>): Promise<Student> => {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      
      if (!response.ok) throw new Error('Öğrenci eklenemedi');
      const r = await response.json();
      return {
        id: r.id,
        parentId: r.parent_id,
        teacherId: r.teacher_id,
        name: r.name,
        age: r.age,
        grade: r.grade,
        gender: r.gender,
        notes: r.notes
      };
    },

    delete: async (id: string) => {
      await fetch(`/api/students/${id}`, { method: 'DELETE' });
    }
  },

  // SCREENINGS
  screenings: {
    save: async (result: ScreeningResult): Promise<ScreeningResult> => {
      const response = await fetch('/api/screenings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });

      if (!response.ok) throw new Error('Rapor kaydedilemedi');
      return await response.json();
    },

    listByUser: async (userId: string, role: Role): Promise<(ScreeningResult & { studentName: string })[]> => {
      const response = await fetch(`/api/screenings?userId=${userId}&role=${role}`);
      if (!response.ok) return [];
      return await response.json();
    },

    getCombinedReport: async (studentId: string): Promise<ScreeningResult[]> => {
        const response = await fetch(`/api/screenings?userId=${studentId}&role=student_specific`);
        if (!response.ok) return [];
        return await response.json();
    }
  },

  // MESSAGES
  messages: {
    list: async (userId: string): Promise<Message[]> => {
      const response = await fetch(`/api/messages?userId=${userId}`);
      if (!response.ok) return [];
      return await response.json();
    },

    send: async (msg: Omit<Message, 'id' | 'createdAt' | 'isRead'>): Promise<Message> => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });
      
      if (!response.ok) throw new Error('Mesaj gönderilemedi');
      return await response.json();
    }
  },

  // EDUCATION PLANS (BEP)
  plans: {
    // userId ve role ekledik, studentId opsiyonel oldu
    list: async (userId: string, role: Role, studentId?: string): Promise<(EducationPlan & { studentName?: string })[]> => {
      let url = `/api/education-plans?userId=${userId}&role=${role}`;
      if (studentId) url = `/api/education-plans?studentId=${studentId}`; // Geriye dönük uyumluluk veya spesifik filtreleme
      
      const response = await fetch(url);
      if (!response.ok) return [];
      return await response.json();
    },

    save: async (plan: Omit<EducationPlan, 'id' | 'createdAt'>): Promise<EducationPlan> => {
      const response = await fetch('/api/education-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });

      if (!response.ok) throw new Error('Plan kaydedilemedi');
      return await response.json();
    }
  }
};
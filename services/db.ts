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
      const params = new URLSearchParams({ userId, role });
      const response = await fetch(`/api/students?${params.toString()}`);
      if (!response.ok) return [];
      
      const rows = await response.json();
      return rows.map((r: any) => ({
        id: r.id,
        parentId: r.parent_id || r.parentId, // Backend camelCase or snake_case
        teacherId: r.teacher_id || r.teacherId,
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
        parentId: r.parent_id || r.parentId,
        teacherId: r.teacher_id || r.teacherId,
        name: r.name,
        age: r.age,
        grade: r.grade,
        gender: r.gender,
        notes: r.notes
      };
    },

    // YENİ: Öğrenci Güncelleme
    update: async (id: string, student: Partial<Student>): Promise<Student> => {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      
      if (!response.ok) throw new Error('Öğrenci güncellenemedi');
      const r = await response.json();
      return {
        id: r.id,
        parentId: r.parent_id || r.parentId,
        teacherId: r.teacher_id || r.teacherId,
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

    // YENİ: Sadece analizi güncellemek için
    updateAnalysis: async (id: string, aiAnalysis: any): Promise<void> => {
        const response = await fetch(`/api/screenings/${id}/analysis`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aiAnalysis })
        });
        if (!response.ok) throw new Error('Analiz kaydedilemedi');
    },

    listByUser: async (userId: string, role: Role): Promise<(ScreeningResult & { studentName: string })[]> => {
      const params = new URLSearchParams({ userId, role });
      const response = await fetch(`/api/screenings?${params.toString()}`);
      if (!response.ok) return [];
      return await response.json();
    },

    getCombinedReport: async (studentId: string): Promise<ScreeningResult[]> => {
        const params = new URLSearchParams({ userId: studentId, role: 'student_specific' });
        const response = await fetch(`/api/screenings?${params.toString()}`);
        if (!response.ok) return [];
        return await response.json();
    }
  },

  // MESSAGES
  messages: {
    list: async (userId: string): Promise<Message[]> => {
      const params = new URLSearchParams({ userId });
      const response = await fetch(`/api/messages?${params.toString()}`);
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
    list: async (userId: string, role: Role, studentId?: string): Promise<(EducationPlan & { studentName?: string })[]> => {
      const params = new URLSearchParams();
      
      if (studentId) {
        params.append('studentId', studentId);
      } else {
        if (userId) params.append('userId', userId);
        if (role) params.append('role', role);
      }
      
      const response = await fetch(`/api/education-plans?${params.toString()}`);
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
  },

  // INVITATIONS (YENİ)
  invitations: {
    create: async (teacherId: string, studentId: string, parentEmail: string): Promise<{ success: boolean; link: string }> => {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, studentId, parentEmail })
      });
      
      if (!response.ok) throw new Error('Davetiye oluşturulamadı');
      return await response.json();
    }
  }
};
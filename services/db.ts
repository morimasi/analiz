import { User, Student, ScreeningResult, Role } from '../types';

// LocalStorage Keys
const KEYS = {
  USERS: 'mindscreen_users',
  STUDENTS: 'mindscreen_students',
  SCREENINGS: 'mindscreen_screenings',
  CURRENT_USER: 'mindscreen_current_user',
};

// Helper to generate ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- DEMO DATA SEEDING ---
const initializeDemoData = () => {
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  
  if (users.length === 0) {
    console.log("Veritabanı boş, demo veriler yükleniyor...");

    const demoParent: User = {
      id: 'demo_parent_1',
      name: 'Demo Veli',
      email: 'veli@demo.com',
      role: 'parent'
    };

    const demoTeacher: User = {
      id: 'demo_teacher_1',
      name: 'Demo Öğretmen',
      email: 'ogretmen@demo.com',
      role: 'teacher',
      schoolName: 'Atatürk İlkokulu'
    };

    const demoStudents: Student[] = [
      {
        id: 'student_1',
        parentId: 'demo_parent_1',
        name: 'Can Yılmaz',
        age: 8,
        grade: '2',
        gender: 'male',
        notes: 'Okumada biraz yavaş.'
      },
      {
        id: 'student_2',
        teacherId: 'demo_teacher_1',
        name: 'Zeynep Kaya',
        age: 7,
        grade: '1',
        gender: 'female'
      },
      {
        id: 'student_3',
        teacherId: 'demo_teacher_1',
        name: 'Ali Demir',
        age: 7,
        grade: '1',
        gender: 'male'
      }
    ];

    localStorage.setItem(KEYS.USERS, JSON.stringify([demoParent, demoTeacher]));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(demoStudents));
  }
};

// Initialize on load
initializeDemoData();

// --- AUTH SERVICE ---

export const authService = {
  login: (email: string, role: Role): User | null => {
    const users = db.getUsers();
    // Demo kolaylığı: Role kontrolünü gevşetip sadece email ile bulup, rolü kullanıcıdan gelenle eşleşiyorsa alıyoruz
    // Gerçek senaryoda şifre kontrolü olurdu.
    const user = users.find(u => u.email === email);
    
    if (user && user.role === role) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: (name: string, email: string, role: Role, schoolName?: string): User => {
    const users = db.getUsers();
    if (users.find(u => u.email === email)) {
      throw new Error("Bu e-posta adresi zaten kayıtlı.");
    }
    const newUser: User = {
      id: generateId(),
      name,
      email,
      role,
      schoolName
    };
    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  }
};

// --- DATABASE SERVICE ---

export const db = {
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },

  // Students
  getStudents: (userId: string, role: Role): Student[] => {
    const allStudents: Student[] = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
    if (role === 'parent') {
      return allStudents.filter(s => s.parentId === userId);
    } else if (role === 'teacher') {
      return allStudents.filter(s => s.teacherId === userId); 
    }
    return [];
  },

  addStudent: (student: Omit<Student, 'id'>): Student => {
    const students = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
    const newStudent = { ...student, id: generateId() };
    students.push(newStudent);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
    return newStudent;
  },

  deleteStudent: (studentId: string) => {
    let students: Student[] = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]');
    students = students.filter(s => s.id !== studentId);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  // Screenings
  saveScreening: (result: ScreeningResult) => {
    const screenings: ScreeningResult[] = JSON.parse(localStorage.getItem(KEYS.SCREENINGS) || '[]');
    const newScreening = { ...result, id: generateId(), date: new Date().toISOString() };
    screenings.push(newScreening);
    localStorage.setItem(KEYS.SCREENINGS, JSON.stringify(screenings));
    return newScreening;
  },

  getScreeningsByStudent: (studentId: string): ScreeningResult[] => {
    const screenings: ScreeningResult[] = JSON.parse(localStorage.getItem(KEYS.SCREENINGS) || '[]');
    return screenings.filter(s => s.studentId === studentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getRecentScreeningsByUser: (userId: string, role: Role): (ScreeningResult & { studentName: string })[] => {
    const myStudents = db.getStudents(userId, role);
    const studentIds = myStudents.map(s => s.id);
    const allScreenings: ScreeningResult[] = JSON.parse(localStorage.getItem(KEYS.SCREENINGS) || '[]');
    
    // Raporları öğrenci adıyla birleştir
    return allScreenings
      .filter(s => s.studentId && studentIds.includes(s.studentId))
      .map(s => {
        const student = myStudents.find(st => st.id === s.studentId);
        return { ...s, studentName: student ? student.name : s.studentName };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};
export type Role = 'parent' | 'teacher' | 'admin';

export type EvaluationCategory = 
  | 'attention'      // Dikkat Eksikliği ve Hiperaktivite
  | 'reading'        // Okuma Güçlüğü (Disleksi)
  | 'writing'        // Yazma Güçlüğü (Disgrafi)
  | 'math'           // Matematik Güçlüğü (Diskalkuli)
  | 'language'       // Dil ve İşitsel İşlemleme
  | 'motor_spatial'; // Motor Koordinasyon ve Organizasyon

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  schoolName?: string; // Sadece öğretmenler için
}

export interface Student {
  id: string;
  parentId?: string; // Veli ID'si
  teacherId?: string; // Öğretmen ID'si
  name: string;
  age: number;
  grade: string;
  gender?: 'male' | 'female';
  notes?: string;
}

export interface Question {
  id: string;
  text: string;
  category: EvaluationCategory;
  weight: number; // 1.0 standard, 1.5 critical
  formType: 'parent' | 'teacher' | 'both';
}

export interface CategoryScore {
  score: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high';
  riskLabel: string;
  findings: string[]; // List of specific symptoms flagged
}

export interface AIAnalysisResult {
  letter: string;
  actionSteps: string[];
}

export interface ScreeningResult {
  id?: string; // Veritabanı ID'si
  studentId?: string;
  date: string;
  totalScore: number;
  studentName: string;
  categoryScores: Record<EvaluationCategory, CategoryScore>;
  aiAnalysis?: AIAnalysisResult;
  completedBy: Role;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string; // Genelde Veli <-> Öğretmen
  studentId?: string; // Konu olan öğrenci
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName?: string; // UI için joinlenmiş veri
}

// --- EĞİTİM PLANI (BEP) TİPLERİ - GÜNCELLENDİ ---

export interface DailyPlan {
  day: string;          // "Pazartesi", "Salı"...
  focusArea: string;    // "Görsel Algı", "İşitsel Dikkat"
  activityName: string; // "Kelime Avı Oyunu"
  description: string;  // "Renkli kağıtlara yazılmış kelimeleri..."
  duration: string;     // "20 dk"
  materialIcon: string; // "pencil", "book", "game" (UI için ipucu)
  difficulty: 'Kolay' | 'Orta' | 'Zor';
}

export interface EducationPlanContent {
  summary: string;           // Genel motivasyon cümlesi
  weeklySchedule: DailyPlan[]; // 7 Günlük Plan
  focusAreas: string[];      // Geliştirilecek 3 temel yetkinlik (Tagler için)
  reviewDate: string;        // Tekrar değerlendirme tarihi
}

export interface EducationPlan {
  id: string;
  studentId: string;
  teacherId: string;
  screeningId: string; // Hangi taramaya dayanarak oluşturuldu
  content: EducationPlanContent;
  createdAt: string;
}

export interface UserProfile extends Omit<Student, 'id'> {
  role: Role; // Testi çözen kişinin rolü
}

export const CATEGORY_LABELS: Record<EvaluationCategory, string> = {
  attention: 'Dikkat & Odaklanma',
  reading: 'Okuma Becerileri',
  writing: 'Yazma Becerileri',
  math: 'Matematiksel Algı',
  language: 'İletişim & Dil',
  motor_spatial: 'Motor & Uzamsal',
};
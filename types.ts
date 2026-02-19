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

// --- EĞİTİM PLANI (BEP) TİPLERİ ---

export interface PlanGoal {
  area: string; // Örn: Okuma Becerileri
  shortTerm: string; // Kısa vadeli hedef
  longTerm: string; // Uzun vadeli hedef
}

export interface PlanActivity {
  title: string;
  description: string;
  duration: string; // "20 dakika"
  frequency: string; // "Haftada 3 gün"
  materials: string[]; // Kullanılacak materyaller
  method: string; // Örn: Çok duyulu öğretim
}

export interface EducationPlanContent {
  summary: string; // Genel pedagojik özet
  goals: PlanGoal[]; // Hedefler listesi
  activities: PlanActivity[]; // Etkinlik planı
  familyStrategies: string[]; // Aileye düşen görevler
  reviewDate: string; // Tekrar değerlendirme tarihi önerisi
}

export interface EducationPlan {
  id: string;
  studentId: string;
  teacherId: string;
  screeningId: string; // Hangi taramaya dayanarak oluşturuldu
  content: EducationPlanContent;
  createdAt: string;
}

// Eski UserProfile tipini geriye dönük uyumluluk veya formlarda kullanım için Student tipine benzer tutuyoruz
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
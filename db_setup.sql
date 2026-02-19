-- ============================================================================
-- MINDSCREEN AI - FULL STACK DATABASE SCHEMA & SEED DATA
-- ============================================================================
-- Bu script:
-- 1. Mevcut tabloları temizler (Fresh Start).
-- 2. Gerekli eklentileri yükler.
-- 3. Users, Students, Screenings ve Messages tablolarını oluşturur.
-- 4. Demo verilerini (Veli, Öğretmen, Öğrenci, Mesaj, Rapor) yükler.
-- ============================================================================

-- 1. TEMİZLİK (Dikkat: Varolan verileri siler)
DROP TABLE IF EXISTS education_plans CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS screenings CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. EKLENTİLER (UUID oluşturmak için gereklidir)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. TABLO TASARIMLARI

-- A. KULLANICILAR (USERS)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    -- Rol kısıtlaması: Sadece belirli roller girilebilir
    role TEXT CHECK (role IN ('parent', 'teacher', 'admin')) NOT NULL,
    school_name TEXT, -- Sadece öğretmenler için dolu olabilir
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- B. ÖĞRENCİLER (STUDENTS)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    grade TEXT NOT NULL,
    gender TEXT DEFAULT 'male',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- C. TARAMA SONUÇLARI (SCREENINGS / REPORTS)
CREATE TABLE screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    completed_by_role TEXT NOT NULL, -- Testi kim çözdü: 'parent' veya 'teacher'
    total_score INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- JSONB: Karmaşık verileri (kategori puanları, AI analizi) esnek tutmak için
    -- Frontend'deki 'categoryScores' ve 'aiAnalysis' objelerini burada saklarız.
    category_scores JSONB NOT NULL, 
    ai_analysis JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- D. MESAJLAR (MESSAGES)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- E. EĞİTİM PLANLARI (EDUCATION PLANS - BEP)
CREATE TABLE education_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    screening_id UUID REFERENCES screenings(id) ON DELETE SET NULL,
    content JSONB NOT NULL, -- Hedefler, aktiviteler, süreler burada tutulur
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. İNDEKSLER (Performans için)
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_teacher_id ON students(teacher_id);
CREATE INDEX idx_screenings_student_id ON screenings(student_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_education_plans_student_id ON education_plans(student_id);

-- ============================================================================
-- 5. SEED DATA (BAŞLANGIÇ VERİLERİ)
-- ============================================================================

-- A. KULLANICILARI EKLE
-- Not: ID'leri manuel veriyoruz ki ilişkileri aşağıda kurabilelim.
INSERT INTO users (id, name, email, role, school_name) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Demo Veli', 'veli@demo.com', 'parent', NULL),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Demo Öğretmen', 'ogretmen@demo.com', 'teacher', 'Atatürk İlkokulu'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Sistem Yöneticisi', 'admin@demo.com', 'admin', NULL);

-- B. ÖĞRENCİLERİ EKLE
INSERT INTO students (id, name, age, grade, gender, notes, parent_id, teacher_id) VALUES
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'Can Yılmaz', 8, '2', 'male', 'Okumada biraz yavaş, harfleri karıştırıyor.', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'Zeynep Kaya', 7, '1', 'female', 'Matematiği çok seviyor.', NULL, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'),
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380f66', 'Ali Demir', 7, '1', 'male', 'Dikkat dağınıklığı var.', NULL, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22');

-- C. ÖRNEK MESAJ EKLE
INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Merhaba, Can''ın okuma hızında son haftalarda artış gözlemliyorum, evdeki çalışmalarınız işe yarıyor.', FALSE, NOW() - INTERVAL '2 days');

-- D. ÖRNEK TARAMA SONUCU (RAPOR) EKLE
INSERT INTO screenings (student_id, completed_by_role, total_score, category_scores, ai_analysis, date) VALUES
(
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 
    'teacher', 
    72, 
    '{
        "reading": {"score": 85, "findings": ["b/d harflerini karıştırır", "Satır atlar"], "riskLevel": "high", "riskLabel": "Yüksek Risk"},
        "attention": {"score": 40, "findings": ["Eşyalarını kaybeder"], "riskLevel": "moderate", "riskLabel": "Orta Risk"},
        "math": {"score": 10, "findings": [], "riskLevel": "low", "riskLabel": "Düşük Risk"},
        "writing": {"score": 60, "findings": ["Yazısı okunaksız"], "riskLevel": "moderate", "riskLabel": "Orta Risk"},
        "language": {"score": 20, "findings": [], "riskLevel": "low", "riskLabel": "Düşük Risk"},
        "motor_spatial": {"score": 15, "findings": [], "riskLevel": "low", "riskLabel": "Düşük Risk"}
    }',
    '{
        "letter": "Sayın Veli, Can''ın okuma becerilerinde yaşıtlarına göre belirgin bir zorlanma tespit edilmiştir. Ancak matematiksel algısı gayet güçlüdür.",
        "actionSteps": ["Sesli okuma egzersizleri yapın", "Renkli heceleme yöntemini deneyin", "Bir uzmana danışın"]
    }',
    NOW() - INTERVAL '1 day'
);

-- SONUÇLARI KONTROL ET
SELECT * FROM users;
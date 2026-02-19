
# 🧠 Bilişsel Tarama ve Disleksi Analiz Modülü - Geliştirme Master Planı

Bu doküman, `ScreeningModule` bileşeninin bağımsız, ölçeklenebilir ve profesyonel bir web uygulaması olarak yeniden inşa edilmesi için gerekli olan teknik analizi, veri mimarisini ve geliştirme yol haritasını içerir.

---

## 1. Proje Vizyonu ve Kapsam

**Amaç:** Ebeveynler ve öğretmenler için çocukların bilişsel gelişim risklerini (Disleksi, DEHB, Diskalkuli vb.) erken aşamada tespit eden, yapay zeka destekli, bilimsel temelli bir tarama aracı geliştirmek.

**Temel Özellikler:**
1.  **Rol Bazlı Filtreleme:** Ebeveyn ve Öğretmen için özelleşmiş soru setleri.
2.  **Ağırlıklı Puanlama Motoru:** Her sorunun kategoriye etkisi farklıdır (Kritik semptomlar daha yüksek puan verir).
3.  **Hibrit Analiz:** Algoritmik puanlama (Radar Grafik) + Generative AI (Yorum ve Tavsiye Mektubu).
4.  **Dinamik Raporlama:** PDF çıktı, veri görselleştirme ve aksiyon planı.

---

## 2. Teknik Mimari (Tech Stack)

Bağımsız proje için önerilen modern teknoloji yığını:

*   **Framework:** React 19 (Vite veya Next.js 14 App Router önerilir).
*   **Dil:** TypeScript (Tip güvenliği kritik, özellikle puanlama motoru için).
*   **Styling:** Tailwind CSS (Mevcut tasarımla uyumlu, hızlı UI).
*   **State Management:** React Context API veya Zustand (Form durumu ve sonuçların taşınması için).
*   **AI Provider:** Google Gemini API (Flash Model - Hız ve maliyet etkinliği için).
*   **Grafik:** Chart.js veya Recharts (Radar grafiği için).
*   **PDF:** `html2canvas` + `jspdf` (Rapor yazdırma için).

---

## 3. Veri Mimarisi ve Türler

Uygulamanın omurgası olan veri yapıları aşağıdaki gibi olmalıdır.

### 3.1. Kategori Yapısı (Enums)
Sistemin analiz edeceği 6 temel bilişsel alan:

```typescript
export type EvaluationCategory = 
  | 'attention'      // Dikkat Eksikliği ve Hiperaktivite
  | 'reading'        // Okuma Güçlüğü (Disleksi)
  | 'writing'        // Yazma Güçlüğü (Disgrafi)
  | 'math'           // Matematik Güçlüğü (Diskalkuli)
  | 'language'       // Dil ve İşitsel İşlemleme
  | 'motor_spatial'; // Motor Koordinasyon ve Organizasyon
```

### 3.2. Soru Veri Modeli
Sorular sadece metin değildir; her birinin bir ağırlığı ve hedef kitlesi vardır.

```typescript
export interface Question {
  id: string;          // Örn: 'read_1', 'math_3'
  text: string;        // Soru metni
  category: EvaluationCategory;
  weight: number;      // Kritik sorular 1.5, standart sorular 1.0
  formType: 'parent' | 'teacher' | 'both'; // Kimin cevaplayacağı
}
```

### 3.3. Sonuç ve Rapor Modeli
Hesaplama motorunun çıktısı:

```typescript
export interface ScreeningResult {
  totalScore: number; // 0-100 Genel Risk Skoru
  studentName: string;
  categoryScores: Record<EvaluationCategory, {
    score: number;      // Yüzdelik dilim (Grafik için)
    riskLevel: 'low' | 'moderate' | 'high';
    riskLabel: string;  // "Düşük Risk", "Yüksek Risk"
    findings: string[]; // İşaretlenen kritik semptomların listesi (AI beslemesi için)
  }>;
  aiAnalysis?: {
      letter: string;   // AI tarafından yazılan mektup
      actionSteps: string[]; // Önerilen 3 adım
  };
}
```

---

## 4. Çekirdek Mantık: Puanlama Motoru (The Engine)

Bu modülün en kritik parçasıdır. Basit bir toplama işlemi değil, **ağırlıklı ortalama** algoritması kullanılmalıdır.

**Algoritma Mantığı:**
1.  **Girdi:** `answers` objesi (Soru ID -> Puan [0-4 arası Likert]).
2.  **Filtreleme:** Seçilen role (Veli/Öğretmen) uygun olmayan sorular hesaplamadan çıkarılır.
3.  **Ağırlıklandırma:** `(Verilen Cevap * Soru Ağırlığı)` formülü uygulanır.
    *   *Örnek:* "b/d karıştırır" sorusu (Ağırlık 1.5) için "Her Zaman" (4 puan) denirse: `4 * 1.5 = 6` ham puan eklenir.
4.  **Normalizasyon:** `(Toplam Ham Puan / Maksimum Mümkün Puan) * 100` ile yüzdelik skora çevrilir.
5.  **Risk Eşikleme:**
    *   0 - 34: Düşük Risk
    *   35 - 64: Orta Risk
    *   65 - 100: Yüksek Risk

---

## 5. UI/UX Akış Planı (Sayfa Yapısı)

Uygulama 3 ana aşamadan (View) oluşmalıdır:

### Aşama 1: Giriş ve Profil (ScreeningIntro)
*   **Amaç:** Kullanıcıyı karşılamak, yasal uyarıyı (Tıbbi tanı değildir) onaylatmak ve öğrenci bilgilerini almak.
*   **Girdiler:** Ad, Yaş, Sınıf, Cevaplayan (Veli/Öğretmen).
*   **Kritik:** Yasal uyarı checkbox'ı işaretlenmeden teste başlanamaz.

### Aşama 2: Değerlendirme Formu (QuestionnaireForm)
*   **Tasarım:** Tek sayfa uzun form yerine, **kategori bazlı "Step Wizard" (Sihirbaz)** yapısı kullanılmalı.
*   **Akış:**
    1.  Dikkat Soruları -> İleri
    2.  Okuma Soruları -> İleri ...
*   **UX:** Her adımda üstte bir "Progress Bar" (İlerleme Çubuğu) olmalı.
*   **Kontrol:** Bir kategorideki tüm sorular cevaplanmadan "İleri" butonu aktif olmamalı.

### Aşama 3: Sonuç Paneli (ResultDashboard)
*   **Bölüm A: Özet Kartları:** Genel risk durumu ve renk kodlu uyarılar.
*   **Bölüm B: Radar Grafik:** Çocuğun güçlü ve zayıf yönlerini görselleştiren altıgen grafik.
*   **Bölüm C: AI Analizi:** "Analiz Et" butonuna basıldığında Gemini API tetiklenir.
    *   *Prompt Stratejisi:* Ham puanları değil, `findings` (bulgular) listesini AI'ya gönderin. AI'dan "Empatik bir eğitim psikoloğu" gibi konuşmasını isteyin.
*   **Bölüm D: Aksiyonlar:** "PDF İndir", "Plan Oluştur".

---

## 6. Yapay Zeka Entegrasyonu (Prompt Engineering)

Bu modülün "Sihirli" kısmı burasıdır. AI'ya gönderilecek veri paketi ve Prompt şablonu şöyle olmalıdır:

**Sistem Rolü:**
`"Sen kıdemli bir eğitim psikoloğu ve özel eğitim uzmanısın. Endişeli bir ebeveyne durumu açıklıyorsun."`

**User Prompt Şablonu:**
```text
ÖĞRENCİ: {Ad}, {Yaş} yaşında.
ROLE: {Cevaplayan}

TARAMA SONUÇLARI (Risk Analizi):
- Dikkat: %75 (Yüksek Risk)
- Okuma: %80 (Yüksek Risk)
- Matematik: %20 (Düşük Risk)

TESPİT EDİLEN KRİTİK BULGULAR:
- b/d harflerini karıştırır.
- Okurken satır atlar.
- Yönergeleri unutur.

GÖREV:
Bu verilere dayanarak;
1. Durumu özetleyen, profesyonel ama anlaşılır, umut verici bir değerlendirme yazısı yaz.
2. Evde uygulanabilecek 3 somut, oyunlaştırılmış öneri maddesi ver.
3. Çıktıyı JSON formatında ver: { "letter": "...", "actionSteps": [...] }
```

---

## 7. Geliştirme Adımları (Roadmap)

Bu projeyi sıfırdan yapmak için izlemen gereken yol:

1.  **Kurulum:** `npm create vite@latest disleksi-tarama -- --template react-ts`
2.  **Veri Dosyası:** `data/questions.ts` dosyasını oluştur ve tüm soruları ağırlıklarıyla gir.
3.  **Motor:** `utils/scoring.ts` dosyasını yaz (Puan hesaplama mantığı).
4.  **UI İskeleti:**
    *   `components/Intro.tsx` (Form)
    *   `components/Questionnaire.tsx` (Sorular ve State)
    *   `components/Result.tsx` (Grafik ve Sonuç)
5.  **AI Bağlantısı:** Google GenAI SDK'yı kur ve `useAI` hook'unu yaz.
6.  **Görselleştirme:** `recharts` veya `chart.js` ile Radar grafiğini ekle.
7.  **PDF Motoru:** Raporu A4 formatında yazdırmak için CSS `@media print` ayarlarını yap.

---

## 8. Dosya Yapısı Önerisi (src/)

```
src/
├── data/
│   └── questions.ts       # Soru havuzu
├── types/
│   └── index.ts           # Interface tanımları
├── utils/
│   ├── scoring.ts         # Puanlama algoritması
│   └── aiClient.ts        # Gemini API servisi
├── components/
│   ├── Intro.tsx
│   ├── QuestionCard.tsx   # Tekil soru bileşeni
│   ├── ProgressBar.tsx
│   ├── RadarChart.tsx
│   └── ResultView.tsx
├── App.tsx                # Ana yönlendirici (Router mantığı)
└── main.tsx
```

Bu planı takip ederek, mevcut projedeki modülü **1 hafta içinde** tamamen bağımsız, pazarlanabilir bir ürün haline getirebilirsin.

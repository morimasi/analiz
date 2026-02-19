import { GoogleGenAI, Type } from "@google/genai";
import { ScreeningResult, CATEGORY_LABELS, EducationPlanContent } from '../types';

// Ortak AI Client kurulumu
const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateAnalysis = async (result: ScreeningResult, role: string, age: number): Promise<{ letter: string, actionSteps: string[] }> => {
  
  const ai = getAiClient();
  if (!ai) {
    return {
      letter: "API anahtarı eksik olduğu için analiz oluşturulamadı.",
      actionSteps: ["Lütfen sistem yöneticisiyle iletişime geçin."]
    };
  }

  // Prepare data for prompt
  const riskSummary = Object.entries(result.categoryScores)
    .map(([cat, data]) => `- ${CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}: %${data.score} (${data.riskLabel})`)
    .join('\n');

  const allFindings = Object.values(result.categoryScores)
    .flatMap(s => s.findings)
    .map(f => `- ${f}`)
    .join('\n');

  // Dynamic Persona and Context based on Role
  const isTeacher = role === 'teacher';
  
  const systemPersona = isTeacher 
    ? "Sen akademik dili güçlü, sınıf yönetimi ve kaynaştırma eğitimi konusunda uzman kıdemli bir Özel Eğitim Danışmanısın."
    : "Sen şefkatli, aile dinamiklerini iyi bilen ve ebeveyn psikolojisinden anlayan kıdemli bir Çocuk Gelişim Uzmanısın.";

  const targetAudience = isTeacher
    ? "sınıf öğretmenine"
    : "endişeli bir ebeveyne";

  const adviceContext = isTeacher
    ? "Öğrencinin sınıf içi performansını artıracak akademik uyarlamalar, akran iletişimi ve öğretim materyali düzenlemeleri öner."
    : "Ev ortamında uygulanabilecek basit oyunlar, günlük rutin düzenlemeleri ve duygusal destek stratejileri öner.";

  const prompt = `
    ÖĞRENCİ: ${result.studentName}, ${age} yaşında.
    HEDEF KİTLE: ${targetAudience} (${isTeacher ? 'Öğretmen' : 'Ebeveyn'})

    TARAMA SONUÇLARI (Risk Analizi):
    ${riskSummary}

    TESPİT EDİLEN KRİTİK BULGULAR (Semptomlar):
    ${allFindings || "Belirgin bir kritik semptom işaretlenmemiştir."}

    GÖREV:
    ${systemPersona}
    Bu verilere dayanarak;

    1. "letter": Durumu özetleyen bir mektup yaz (Maksimum 150 kelime). 
       - Tıbbi teşhis KOYMA (Disleksi var deme, "okuma alanında destek ihtiyacı görünüyor" de).
       - ${isTeacher ? 'Profesyonel ve işbirlikçi bir dil kullan.' : 'Empatik, umut verici ve sakinleştirici bir dil kullan.'}
    
    2. "actionSteps": ${adviceContext} (3 adet somut madde).

    JSON formatında yanıt ver.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            letter: { type: Type.STRING },
            actionSteps: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["letter", "actionSteps"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      letter: "Üzgünüz, yapay zeka analizi şu anda oluşturulamadı. Lütfen raporu standart verilerle değerlendirin.",
      actionSteps: ["Bir uzmana danışın.", "Gözlem yapmaya devam edin.", "Okul rehberlik servisiyle görüşün."]
    };
  }
};

export const generateEducationPlan = async (result: ScreeningResult, age: number): Promise<EducationPlanContent | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  const findings = Object.values(result.categoryScores)
    .flatMap(s => s.findings)
    .join(', ');

  const highRiskAreas = Object.entries(result.categoryScores)
    .filter(([_, val]) => val.riskLevel === 'high')
    .map(([key, _]) => CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS])
    .join(', ');

  const prompt = `
    GÖREV: Bireyselleştirilmiş Eğitim Planı (BEP) Hazırlama
    ROL: Kıdemli Özel Eğitim Uzmanı ve Eğitim Programcısı
    
    ÖĞRENCİ PROFİLİ:
    - Adı: ${result.studentName}
    - Yaş: ${age}
    - Riskli Alanlar: ${highRiskAreas || "Genel Gelişim Desteği"}
    - Kritik Bulgular: ${findings || "Genel performans düşüklüğü"}

    Bu öğrenci için okulda ve destek eğitim odasında uygulanmak üzere, tamamen tespit edilen bulgulara yönelik "Ultra Detaylı ve Profesyonel" bir eğitim planı oluştur.

    Plan şu yapıda olmalıdır (JSON):
    1. summary: Öğrencinin eğitsel ihtiyaçlarını özetleyen pedagojik bir paragraf (akademik dil).
    2. goals: En az 3 adet hedef. Her hedef için alan (örn: Okuma), kısa vadeli hedef (1 ay) ve uzun vadeli hedef (6 ay) belirt.
    3. activities: En az 4 adet somut etkinlik. Her etkinlik için; başlık, açıklama, süre (dk), sıklık (haftada kaç gün), materyaller ve yöntem. Etkinlikler doğrudan "b/d karıştırma", "dikkat süresi" gibi spesifik sorunlara çözüm olmalı.
    4. familyStrategies: Ailenin evde uygulayacağı 3 strateji.
    5. reviewDate: "3 Ay Sonra" veya "6 Ay Sonra" gibi bir öneri.

    Çıktı dili: Türkçe.
    Ton: Resmi, akademik, yönlendirici ve umut verici.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            goals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING },
                  shortTerm: { type: Type.STRING },
                  longTerm: { type: Type.STRING }
                }
              }
            },
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                  method: { type: Type.STRING }
                }
              }
            },
            familyStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
            reviewDate: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text as string);
  } catch (error) {
    console.error("Plan Generation Error:", error);
    return null;
  }
};
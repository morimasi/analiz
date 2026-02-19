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

// Model Yapılandırması
const MODEL_NAME = 'gemini-3-flash-preview';

export const generateAnalysis = async (result: ScreeningResult, role: string, age: number): Promise<{ letter: string, actionSteps: string[] }> => {
  
  const ai = getAiClient();
  if (!ai) {
    return {
      letter: "API anahtarı eksik olduğu için analiz oluşturulamadı.",
      actionSteps: ["Lütfen sistem yöneticisiyle iletişime geçin."]
    };
  }

  // Veri Hazırlığı
  const riskSummary = Object.entries(result.categoryScores)
    .map(([cat, data]) => `- ${CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}: %${data.score} (${data.riskLabel})`)
    .join('\n');

  const allFindings = Object.values(result.categoryScores)
    .flatMap(s => s.findings)
    .map(f => `- ${f}`)
    .join('\n');

  const isTeacher = role === 'teacher';
  const targetAudience = isTeacher ? "sınıf öğretmenine" : "endişeli bir ebeveyne";
  const prompt = `
    GÖREV TANIMI:
    Aşağıdaki öğrenci profilini ve tarama sonuçlarını derinlemesine analiz et. 
    
    ÖĞRENCİ PROFİLİ:
    - İsim: ${result.studentName}
    - Yaş: ${age}
    - Hedef Kitle: ${targetAudience}

    TARAMA SONUÇLARI:
    ${riskSummary}

    KLİNİK BULGULAR (Semptomlar):
    ${allFindings || "Belirgin bir kritik semptom işaretlenmemiştir, ancak genel gelişim takibi önerilir."}

    İSTENEN ÇIKTI (JSON):
    1. "letter": ${targetAudience} hitaben yazılmış profesyonel bir mektup. (Max 1 paragraf, çok uzatma).
    2. "actionSteps": 3 adet hap bilgi şeklinde öneri.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 1024 }, 
        maxOutputTokens: 4096, 
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

    let text = response.text;
    if (!text) throw new Error("AI boş yanıt döndürdü.");
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      letter: "Analiz servisinde geçici bir yoğunluk yaşanıyor.",
      actionSteps: ["Lütfen daha sonra tekrar deneyiniz."]
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
    GÖREV: 7 Günlük Bireysel Gelişim Ajandası Oluşturma
    ROL: Kıdemli Çocuk Gelişim Uzmanı ve Oyun Terapisti.
    
    ÖĞRENCİ: ${result.studentName} (${age} Yaş)
    ÖNCELİKLİ ALANLAR: ${highRiskAreas || "Genel Bilişsel Destek"}
    SORUNLAR: ${findings}

    TALİMATLAR:
    Bu öğrenci için Pazartesi'den Pazar'a kadar, her gün için TEK BİR SPESİFİK ve EĞLENCELİ aktivite planla.
    Plan "ders çalışmak" gibi sıkıcı olmamalı, "oyunlaştırılmış öğrenme" (gamification) temelli olmalı.
    
    KURALLAR:
    1. Her gün farklı bir beceriye odaklan (Örn: Pazartesi Görsel Algı, Salı İşitsel Dikkat).
    2. Etkinlikler evde veya sınıfta kolay bulunan malzemelerle yapılabilmeli.
    3. Açıklamalar ("description") çok net olmalı, okuyan kişi "ne yapacağım?" diye sormamalı.
    4. "difficulty" alanını (Kolay, Orta, Zor) çocuğun yaşına ve sorunun derinliğine göre belirle.

    ÇIKTI FORMATI (JSON):
    {
      "summary": "Planın genel felsefesini anlatan motive edici 1 cümle.",
      "focusAreas": ["Görsel Algı", "İnce Motor", "Dikkat"], 
      "reviewDate": "Bugünden 30 gün sonrası",
      "weeklySchedule": [
         {
           "day": "Pazartesi",
           "focusArea": "Görsel Ayırt Etme",
           "activityName": "Dedektif Mercek Oyunu",
           "description": "Evin içindeki kırmızı renkli 5 objeyi bulup masaya dizmesini isteyin. Sonra gözlerini kapatıp birini saklayın, hangisi yok bulsun.",
           "duration": "15 dk",
           "materialIcon": "game", 
           "difficulty": "Kolay"
         },
         ... (Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar için devam et)
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4096 }, // Karmaşık planlama için bütçe artırıldı
        maxOutputTokens: 16000, 
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            reviewDate: { type: Type.STRING },
            weeklySchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  focusArea: { type: Type.STRING },
                  activityName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  materialIcon: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ["Kolay", "Orta", "Zor"] }
                }
              }
            }
          }
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("AI Plan oluşturamadı.");
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("Plan Generation Error:", error);
    return null;
  }
};
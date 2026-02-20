import { GoogleGenAI, Type } from "@google/genai";
import { ScreeningResult, CATEGORY_LABELS, EducationPlanContent, DashboardInsight } from '../types';

// Ortak AI Client kurulumu
const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

const MODEL_NAME = 'gemini-3-flash-preview';

export const generateDashboardBriefing = async (reports: ScreeningResult[], role: string): Promise<DashboardInsight[]> => {
  const ai = getAiClient();
  if (!ai || reports.length === 0) return [];

  const dataSummary = reports.slice(0, 5).map(r => ({
    name: r.studentName,
    score: r.totalScore,
    criticals: Object.values(r.categoryScores).filter(c => c.riskLevel === 'high').length
  }));

  const prompt = `
    GÖREV: Dashboard "Akıllı Brifing" Paneli Oluşturma
    ROL: Sen profesyonel bir veri analisti ve eğitim danışmanısın.
    KULLANICI ROLÜ: ${role === 'teacher' ? 'Öğretmen' : 'Veli'}
    
    VERİ (Son 5 Rapor):
    ${JSON.stringify(dataSummary)}

    TALİMAT:
    Kullanıcıya o anki durumu özetleyen, aksiyon odaklı tam olarak 3 adet kısa "Insight" (içgörü) üret.
    - 1. Insight: Genel durum özeti.
    - 2. Insight: En acil müdahale gerektiren (Yüksek riskli) durum.
    - 3. Insight: Pozitif bir gelişme veya bir sonraki adım tavsiyesi.

    ÇIKTI (JSON ARRAY):
    [{ "title": "...", "content": "...", "priority": "high|medium|low", "actionLabel": "..." }]
    Dil: Türkçe. İçerik kısa (max 15 kelime) ve net olmalı.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 1000,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
              actionLabel: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

export const generateAnalysis = async (result: ScreeningResult, role: string, age: number): Promise<{ letter: string, actionSteps: string[] }> => {
  const ai = getAiClient();
  if (!ai) return { letter: "", actionSteps: [] };

  const riskSummary = Object.entries(result.categoryScores)
    .map(([cat, data]) => `- ${CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}: %${data.score} (${data.riskLabel})`)
    .join('\n');

  const prompt = `Analiz et: ${result.studentName}, ${age} yaş. Veriler: ${riskSummary}. JSON formatında 'letter' ve 'actionSteps' (3 adet) döndür.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            letter: { type: Type.STRING },
            actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { letter: "Hata oluştu", actionSteps: [] };
  }
};

export const generateEducationPlan = async (result: ScreeningResult, age: number): Promise<EducationPlanContent | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  const prompt = `7 günlük oyunlaştırılmış BEP planı oluştur: ${result.studentName}, ${age} yaş. JSON formatında 'summary', 'weeklySchedule', 'focusAreas', 'reviewDate' döndür.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2048 },
        maxOutputTokens: 8192,
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
                  difficulty: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return null;
  }
};
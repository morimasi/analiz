import { GoogleGenAI, Type } from "@google/genai";
import { ScreeningResult, CATEGORY_LABELS } from '../types';

export const generateAnalysis = async (result: ScreeningResult, role: string, age: number): Promise<{ letter: string, actionSteps: string[] }> => {
  
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    return {
      letter: "API anahtarı eksik olduğu için analiz oluşturulamadı.",
      actionSteps: ["Lütfen sistem yöneticisiyle iletişime geçin."]
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
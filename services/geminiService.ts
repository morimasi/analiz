import { GoogleGenAI, Type, SchemaType } from "@google/genai";
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

  // Rol ve Persona Ayarı
  const isTeacher = role === 'teacher';
  
  const systemPersona = isTeacher 
    ? "Sen, öğrenme güçlükleri ve kapsayıcı eğitim konusunda 20 yıl deneyimli, akademik literatüre hakim kıdemli bir Özel Eğitim Danışmanısın."
    : "Sen, çocuk psikolojisi ve aile danışmanlığı konusunda uzman, ebeveyn kaygılarını yönetebilen, empatik ve çözüm odaklı kıdemli bir Çocuk Gelişim Uzmanısın.";

  const targetAudience = isTeacher ? "sınıf öğretmenine" : "endişeli bir ebeveyne";

  const adviceContext = isTeacher
    ? "Sınıf içi uyarlamalar, öğretim materyali farklılaştırma ve akran iletişimi stratejileri."
    : "Ev ortamında uygulanabilecek oyunlar, rutinler ve duygusal destek yöntemleri.";

  const prompt = `
    GÖREV TANIMI:
    Aşağıdaki öğrenci profilini ve tarama sonuçlarını derinlemesine analiz et. Standart bir rapor yerine, öğrencinin özgün ihtiyaçlarına odaklanan, içgörü dolu bir değerlendirme yap.
    
    ÖĞRENCİ PROFİLİ:
    - İsim: ${result.studentName}
    - Yaş: ${age}
    - Hedef Kitle: ${targetAudience}

    TARAMA SONUÇLARI:
    ${riskSummary}

    KLİNİK BULGULAR (Semptomlar):
    ${allFindings || "Belirgin bir kritik semptom işaretlenmemiştir, ancak genel gelişim takibi önerilir."}

    İSTENEN ÇIKTI (JSON):
    1. "letter": ${targetAudience} hitaben yazılmış profesyonel bir mektup. 
       - Durumu net ama umut verici bir dille özetle.
       - Asla tıbbi bir tanı (Disleksi, DEHB vb.) koyma; "risk belirtileri", "destek ihtiyacı" gibi ifadeler kullan.
       - ${isTeacher ? 'Pedagojik terimler ve işbirlikçi bir ton kullan.' : 'Sıcak, anlaşılır ve motive edici bir ton kullan.'}
    
    2. "actionSteps": ${adviceContext} odaklı 3 adet somut, uygulanabilir öneri. Genel geçer tavsiyeler yerine, yukarıdaki bulgulara (örneğin b/d karıştırma varsa ona özel) yönelik nokta atışı stratejiler ver.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Thinking Config: Düşünme bütçesi ayırıyoruz
        thinkingConfig: { thinkingBudget: 2048 }, 
        // Max Output: Düşünme + JSON çıktısı için yeterli alan (Thinking bütçesinden fazla olmalı)
        maxOutputTokens: 8192, 
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
    if (!text) throw new Error("AI boş yanıt döndürdü.");

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      letter: "Analiz servisinde geçici bir yoğunluk yaşanıyor. Ancak sonuçlara dayanarak, öğrencinin özellikle zorlandığı alanlarda (kırmızı ile işaretli) bireysel destek alması faydalı olacaktır.",
      actionSteps: ["Bir çocuk psikiyatristi veya rehberlik servisi ile görüşün.", "Çocuğun güçlü yönlerini (yeşil alanlar) öne çıkararak motivasyonunu artırın.", "Okuma ve dikkat çalışmalarını kısa sürelerle (15-20 dk) sık sık yapın."]
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
    GÖREV: Bireyselleştirilmiş Eğitim Planı (BEP) Oluşturma
    ROL: Sen, nöropsikoloji ve özel eğitim alanında uzmanlaşmış, öğrenme süreçlerini çok iyi analiz eden kıdemli bir Eğitim Programcısısın.
    
    VERİLER:
    - Öğrenci: ${result.studentName} (${age} Yaş)
    - Öncelikli Müdahale Alanları: ${highRiskAreas || "Genel Akademik Destek"}
    - Tespit Edilen Spesifik Sorunlar: ${findings || "Genel dikkat ve motivasyon düşüklüğü"}

    TALİMATLAR:
    Bu öğrenci için okulda ve destek eğitim odasında uygulanmak üzere kapsamlı bir plan hazırla.
    Planı oluştururken "Düşünme Süreci"ni (Thinking Process) kullanarak şu adımları izle:
    1. Öğrencinin yaşına ve gelişim dönemine uygun hedefler belirle.
    2. Tespit edilen her bir soruna (örn: 'b/d karıştırma') karşılık gelen bilimsel bir müdahale yöntemi seç.
    3. Etkinlikleri 'oyunlaştırılmış' ve 'yapılandırılmış' olarak dengele.
    4. Aileyi sürece dahil edecek gerçekçi görevler tanımla.

    ÇIKTI FORMATI (JSON):
    Aşağıdaki şemaya tam olarak uy.
    - summary: Öğrencinin eğitsel ihtiyaçlarını ve pedagojik yaklaşımı özetleyen akademik bir paragraf.
    - goals: En az 3 hedef (Alan, Kısa Vadeli, Uzun Vadeli).
    - activities: En az 4 detaylı etkinlik (Başlık, Açıklama, Süre, Sıklık, Materyaller, Yöntem).
    - familyStrategies: Evde uygulanacak 3 strateji.
    - reviewDate: Önerilen değerlendirme tarihi.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Thinking Config: BEP planı karmaşık olduğu için daha yüksek düşünme bütçesi
        thinkingConfig: { thinkingBudget: 4096 },
        maxOutputTokens: 12000, // Uzun çıktı için geniş alan
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

    const text = response.text;
    if (!text) throw new Error("AI Plan oluşturamadı (Boş yanıt).");

    return JSON.parse(text);
  } catch (error) {
    console.error("Plan Generation Error:", error);
    // Hata durumunda null dönmek yerine UI'da hata mesajı gösterebilmek için null dönüyoruz, 
    // ancak konsola detayı basıyoruz. UI tarafı null kontrolü yapıyor.
    return null;
  }
};

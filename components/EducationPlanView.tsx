import React, { useState, useEffect, useRef } from 'react';
import { ScreeningResult, Student, EducationPlan, EducationPlanContent } from '../types';
import { generateEducationPlan } from '../services/geminiService';
import { api } from '../services/db';
import { 
  BookOpen, Target, Clock, Calendar, CheckSquare, 
  Printer, Save, Sparkles, AlertTriangle, User, 
  ChevronDown, ChevronUp, Layout, ClipboardList, Loader2, Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface EducationPlanViewProps {
  student: Student;
  teacherId?: string; // Sadece oluştururken gerekli
  screeningResult?: ScreeningResult; // Oluştururken gerekli
  preLoadedPlan?: EducationPlan; // Arşivden geliyorsa bu dolu olacak
  onBack: () => void;
  userRole?: string; // Veli ise kaydet butonu çıkmaz vs.
}

const EducationPlanView: React.FC<EducationPlanViewProps> = ({ 
  student, 
  screeningResult, 
  teacherId, 
  onBack, 
  preLoadedPlan,
  userRole
}) => {
  const [plan, setPlan] = useState<EducationPlanContent | null>(preLoadedPlan?.content || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingPlanId, setExistingPlanId] = useState<string | null>(preLoadedPlan?.id || null);

  const printRef = useRef<HTMLDivElement>(null);

  // Load existing plan if NOT preloaded and we have screening result
  useEffect(() => {
    if (preLoadedPlan) return;
    if (!screeningResult) return;

    const loadPlan = async () => {
      const plans = await api.plans.list(teacherId || '', 'teacher', student.id); // Rol checkini atlamak için studentId gönderiyoruz
      // Bu tarama sonucuna ait bir plan var mı?
      const match = plans.find(p => p.screeningId === screeningResult.id);
      if (match) {
        setPlan(match.content);
        setExistingPlanId(match.id);
      }
    };
    loadPlan();
  }, [student.id, screeningResult, preLoadedPlan, teacherId]);

  const handleGenerate = async () => {
    if (!screeningResult) return;
    setLoading(true);
    const content = await generateEducationPlan(screeningResult, student.age);
    if (content) {
      setPlan(content);
    } else {
      alert("Plan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!plan || !teacherId || !screeningResult) return;
    setSaving(true);
    try {
      await api.plans.save({
        studentId: student.id,
        teacherId: teacherId,
        screeningId: screeningResult.id!,
        content: plan
      });
      alert("Eğitim planı başarıyla kaydedildi.");
      setExistingPlanId("saved-now"); 
    } catch (error) {
      alert("Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    // Geçici olarak print stilini zorla uygula
    const element = printRef.current;
    
    try {
      // Yükleme animasyonu gösterilebilir burada
      const canvas = await html2canvas(element, {
        scale: 2, // Yüksek çözünürlük için
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95; // Biraz margin bırak
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10; 

      // Çok uzun sayfalar için basit tek sayfa mantığı (Geliştirilebilir: multi-page)
      // Şimdilik sığdırıyoruz
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, (imgHeight * pdfWidth) / imgWidth);
      pdf.save(`BEP_${student.name.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error("PDF Hatası:", error);
      alert("PDF oluşturulurken bir hata oluştu. Lütfen 'Yazdır' seçeneğini deneyiniz.");
    }
  };

  // 1. Durum: Plan henüz yok, oluşturma ekranı (Sadece Öğretmen Görür)
  if (!plan && !loading) {
    if (!screeningResult) return <div>Veri eksik.</div>;

    return (
      <div className="max-w-4xl mx-auto p-8 animate-fade-in">
        <button onClick={onBack} className="mb-6 text-gray-500 hover:text-gray-800 flex items-center gap-2">
           &larr; Geri Dön
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Bireyselleştirilmiş Eğitim Planı (BEP)</h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-8 text-lg">
            Öğrenciniz <strong>{student.name}</strong> için, son tarama sonuçlarına ve tespit edilen klinik bulgulara dayalı, ultra detaylı bir eğitim rotası oluşturun.
          </p>
          
          <button 
            onClick={handleGenerate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl transition shadow-xl shadow-indigo-200 flex items-center gap-3 mx-auto text-lg transform active:scale-95"
          >
            <Sparkles className="w-6 h-6" />
            Planı Oluştur
          </button>
        </div>
      </div>
    );
  }

  // 2. Durum: Yükleniyor
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-6" />
        <h3 className="text-xl font-bold text-gray-800">Eğitim Planı Hazırlanıyor...</h3>
        <p className="text-gray-500 mt-2">Öğrencinin risk profili ve ihtiyaçları analiz ediliyor.</p>
      </div>
    );
  }

  // 3. Durum: Plan Görüntüleme (Oluşturulduktan Sonra veya Arşivden)
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 pb-24">
      {/* Control Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print sticky top-4 z-20">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-medium flex items-center gap-2">
           &larr; <span className="hidden md:inline">Geri</span>
        </button>
        <div className="flex gap-3">
           {/* Kaydet butonu sadece öğretmen rolü varsa, plan yeni oluşturulmuşsa ve henüz kaydedilmemişse görünür */}
           {!existingPlanId && userRole === 'teacher' && (
             <button 
               onClick={handleSave} 
               disabled={saving}
               className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition shadow-md"
             >
               {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
               Kaydet
             </button>
           )}
           <button 
             onClick={handleDownloadPDF}
             className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition shadow-md"
           >
             <Download className="w-4 h-4" /> PDF İndir
           </button>
           <button 
             onClick={handlePrint}
             className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold transition shadow-md"
           >
             <Printer className="w-4 h-4" /> Yazdır
           </button>
        </div>
      </div>

      {/* Plan Document */}
      <div id="print-area" ref={printRef} className="bg-white rounded-none md:rounded-2xl shadow-xl overflow-hidden print:shadow-none print:w-full print:absolute print:top-0 print:left-0 print:m-0">
        
        {/* Header Section */}
        <div className="bg-slate-900 text-white p-8 md:p-12 print:bg-white print:text-black print:border-b-2 print:border-black">
          <div className="flex justify-between items-start">
             <div>
                <h1 className="text-3xl font-serif font-bold mb-2">Bireyselleştirilmiş Eğitim Planı</h1>
                <p className="text-slate-400 print:text-gray-500 uppercase tracking-widest text-xs font-semibold">MindScreen AI • Klinik Eğitim Modülü</p>
             </div>
             <div className="text-right hidden md:block print:block">
                <div className="text-2xl font-bold">{new Date().toLocaleDateString('tr-TR')}</div>
                <div className="text-slate-400 print:text-gray-500 text-sm">Plan Tarihi</div>
             </div>
          </div>
          
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
             <div>
                <p className="text-slate-500 print:text-gray-500 mb-1 uppercase text-xs font-bold">Öğrenci</p>
                <p className="font-semibold text-lg">{student.name}</p>
             </div>
             <div>
                <p className="text-slate-500 print:text-gray-500 mb-1 uppercase text-xs font-bold">Yaş / Sınıf</p>
                <p className="font-semibold text-lg">{student.age} Yaş / {student.grade}</p>
             </div>
             <div>
                <p className="text-slate-500 print:text-gray-500 mb-1 uppercase text-xs font-bold">Destek Türü</p>
                <p className="font-semibold text-lg text-indigo-300 print:text-black">Tam Zamanlı / BEP</p>
             </div>
             <div>
                <p className="text-slate-500 print:text-gray-500 mb-1 uppercase text-xs font-bold">Tekrar Değerlendirme</p>
                <p className="font-semibold text-lg text-orange-300 print:text-black">{plan?.reviewDate}</p>
             </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 md:p-12 space-y-10">
          
          {/* 1. Summary */}
          <section>
             <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
               <BookOpen className="w-6 h-6 text-indigo-600" /> Eğitsel Performans Özeti
             </h3>
             <p className="text-gray-700 leading-relaxed text-lg font-serif">
               {plan?.summary}
             </p>
          </section>

          {/* 2. Goals */}
          <section>
             <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
               <Target className="w-6 h-6 text-red-600" /> Hedefler ve Beklenen Kazanımlar
             </h3>
             <div className="grid grid-cols-1 gap-4">
                {plan?.goals.map((goal, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-slate-50 print:break-inside-avoid">
                     <div className="bg-white p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full text-sm w-fit">{goal.area}</span>
                        <span className="text-gray-400 text-xs font-medium uppercase">Hedef No: #{idx + 1}</span>
                     </div>
                     <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <p className="text-xs text-gray-500 uppercase font-bold mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> Kısa Vadeli Hedef</p>
                           <p className="text-gray-800 font-medium">{goal.shortTerm}</p>
                        </div>
                        <div className="md:border-l md:border-gray-200 md:pl-6">
                           <p className="text-xs text-gray-500 uppercase font-bold mb-2 flex items-center gap-1"><Calendar className="w-3 h-3"/> Uzun Vadeli Hedef</p>
                           <p className="text-gray-800 font-medium">{goal.longTerm}</p>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>

          {/* 3. Activities Plan */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
               <Layout className="w-6 h-6 text-purple-600" /> Yapılandırılmış Eğitim Etkinlikleri
            </h3>
            <div className="space-y-6">
              {plan?.activities.map((activity, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm print:shadow-none print:border-gray-300 break-inside-avoid">
                   <div className="flex-shrink-0 flex flex-col items-center justify-center bg-purple-50 text-purple-700 w-16 h-16 md:w-24 md:h-24 rounded-2xl font-bold text-2xl border border-purple-100">
                      {idx + 1}
                   </div>
                   <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{activity.title}</h4>
                      <p className="text-gray-600 mb-4">{activity.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                         <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Süre</span>
                            <span className="font-medium text-gray-800">{activity.duration}</span>
                         </div>
                         <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Sıklık</span>
                            <span className="font-medium text-gray-800">{activity.frequency}</span>
                         </div>
                         <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Yöntem</span>
                            <span className="font-medium text-gray-800">{activity.method}</span>
                         </div>
                         <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="block text-gray-400 text-xs font-bold uppercase mb-1">Materyal</span>
                            <span className="font-medium text-gray-800 truncate" title={activity.materials.join(', ')}>
                              {activity.materials.join(', ')}
                            </span>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Family Strategies */}
          <section className="bg-green-50/50 p-8 rounded-2xl border border-green-100 break-inside-avoid">
             <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
               <User className="w-5 h-5" /> Aile Destek Stratejileri
             </h3>
             <ul className="space-y-3">
               {plan?.familyStrategies.map((strat, idx) => (
                 <li key={idx} className="flex gap-3 items-start text-green-900">
                    <CheckSquare className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
                    <span>{strat}</span>
                 </li>
               ))}
             </ul>
          </section>

          {/* Footer Signature Area (For Print) */}
          <div className="hidden print:flex justify-between mt-20 pt-10 border-t border-gray-300 break-inside-avoid">
             <div className="text-center">
                <p className="font-bold mb-12">Özel Eğitim Uzmanı / Öğretmen</p>
                <div className="border-t border-black w-48 mx-auto"></div>
             </div>
             <div className="text-center">
                <p className="font-bold mb-12">Okul Müdürü / Onay</p>
                <div className="border-t border-black w-48 mx-auto"></div>
             </div>
             <div className="text-center">
                <p className="font-bold mb-12">Veli</p>
                <div className="border-t border-black w-48 mx-auto"></div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EducationPlanView;
import React, { useState, useEffect, useRef } from 'react';
import { ScreeningResult, Student, EducationPlan, EducationPlanContent, DailyPlan } from '../types';
import { generateEducationPlan } from '../services/geminiService';
import { api } from '../services/db';
import { 
  Save, Printer, Download, Sparkles, Loader2, Calendar, Clock, 
  Target, Dumbbell, Brain, Puzzle, Music, BookOpen, Star, ArrowRight,
  CheckCircle2, LayoutGrid, List, User
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface EducationPlanViewProps {
  student: Student;
  teacherId?: string;
  screeningResult?: ScreeningResult;
  preLoadedPlan?: EducationPlan;
  onBack: () => void;
  userRole?: string;
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

  useEffect(() => {
    if (preLoadedPlan) return;
    if (!screeningResult) return;

    const loadPlan = async () => {
      const plans = await api.plans.list(teacherId || '', 'teacher', student.id);
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
      alert("Haftalık plan başarıyla kaydedildi.");
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

  // Helper to get icon for daily cards
  const getIconForType = (type: string) => {
    switch(type) {
      case 'game': return <Puzzle className="w-5 h-5" />;
      case 'book': return <BookOpen className="w-5 h-5" />;
      case 'music': return <Music className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Kolay') return 'bg-green-100 text-green-700 border-green-200';
    if (diff === 'Orta') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  // 1. Durum: Plan henüz yok, oluşturma ekranı
  if (!plan && !loading) {
    if (!screeningResult) return <div>Veri eksik.</div>;

    return (
      <div className="max-w-4xl mx-auto p-8 animate-fade-in">
        <button onClick={onBack} className="mb-6 text-gray-500 hover:text-gray-800 flex items-center gap-2 font-medium">
           &larr; Geri Dön
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Calendar className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Haftalık Gelişim Ajandası</h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-10 text-lg leading-relaxed">
            Yapay zeka, <strong>{student.name}</strong> için 7 günlük, oyunlaştırılmış ve kişiye özel bir aktivite programı hazırlayacak.
          </p>
          
          <button 
            onClick={handleGenerate}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 font-lg rounded-2xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 active:scale-95 shadow-lg shadow-indigo-200"
          >
            <Sparkles className="w-6 h-6 mr-3 text-yellow-300 animate-pulse" />
            Sihirli Planı Oluştur
            <div className="absolute -inset-3 rounded-2xl bg-indigo-400 opacity-20 group-hover:opacity-40 blur-lg transition-opacity duration-200" />
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Brain className="w-8 h-8 text-indigo-600" />
            </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mt-8">Ajanda Hazırlanıyor...</h3>
        <p className="text-gray-500 mt-2">Günlük aktiviteler ve oyunlar planlanıyor.</p>
      </div>
    );
  }

  // 3. Durum: Plan Görüntüleme
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-24">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 no-print sticky top-4 z-40 gap-4">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-medium flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
           &larr; <span className="hidden md:inline">Panele Dön</span>
        </button>
        
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
            <User className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-900">{student.name}</span>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
           {!existingPlanId && userRole === 'teacher' && (
             <button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition shadow-md hover:shadow-lg active:scale-95">
               {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} Kaydet
             </button>
           )}
           <button onClick={handlePrint} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition shadow-md hover:shadow-lg active:scale-95">
             <Printer className="w-4 h-4" /> Yazdır
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div ref={printRef} className="bg-gray-50 min-h-screen print:bg-white print:m-0">
        
        {/* Hero Header */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-200 mb-8 relative overflow-hidden print:border-none">
          <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Haftalık Gelişim Ajandası</h1>
                    <p className="text-lg text-gray-600 font-medium leading-relaxed max-w-2xl">
                       {plan?.summary}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {plan?.focusAreas?.map((area, idx) => (
                        <span key={idx} className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-indigo-200">
                            {area}
                        </span>
                    ))}
                </div>
              </div>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4">
            {plan?.weeklySchedule?.map((dayPlan, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group print:break-inside-avoid print:shadow-none print:border-gray-300">
                    {/* Day Header */}
                    <div className={`p-4 ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700'} border-b border-gray-100 flex justify-between items-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300`}>
                        <h3 className="text-lg font-bold">{dayPlan.day}</h3>
                        <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                            {getIconForType(dayPlan.materialIcon || '')}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1 block">Odak Alanı</span>
                            <h4 className="text-xl font-bold text-gray-900 leading-tight">{dayPlan.activityName}</h4>
                        </div>
                        
                        <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">
                            {dayPlan.description}
                        </p>

                        {/* Footer Tags */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded-md">
                                <Clock className="w-3.5 h-3.5" />
                                {dayPlan.duration}
                            </div>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getDifficultyColor(dayPlan.difficulty)}`}>
                                {dayPlan.difficulty}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Review Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-center items-center text-center print:break-inside-avoid">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                    <Target className="w-6 h-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">Hedef Kontrol</h3>
                <p className="text-slate-300 text-sm mb-6">Bu haftalık programı tamamladıktan sonra gelişimi tekrar değerlendireceğiz.</p>
                <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Sonraki Randevu</p>
                    <p className="text-lg font-mono font-bold">{plan?.reviewDate}</p>
                </div>
            </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block mt-12 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
            <p>Bu plan MindScreen AI tarafından <strong>{new Date().toLocaleDateString()}</strong> tarihinde oluşturulmuştur.</p>
        </div>
      </div>
    </div>
  );
};

export default EducationPlanView;
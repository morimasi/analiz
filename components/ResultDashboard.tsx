import React, { useEffect, useState, useRef } from 'react';
import { ScreeningResult, CATEGORY_LABELS, EvaluationCategory, UserProfile } from '../types';
import { generateAnalysis } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Download, Sparkles, AlertTriangle, CheckCircle, Activity, Loader2, Share2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResultDashboardProps {
  result: ScreeningResult;
  profile: UserProfile;
}

const ResultDashboard: React.FC<ResultDashboardProps> = ({ result, profile }) => {
  const [analysis, setAnalysis] = useState<{ letter: string; actionSteps: string[] } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Prepare data for Radar Chart
  const chartData = Object.entries(result.categoryScores).map(([key, data]) => ({
    subject: CATEGORY_LABELS[key as EvaluationCategory],
    A: data.score,
    fullMark: 100,
  }));

  const handleGenerateAI = async () => {
    setLoadingAI(true);
    const aiResult = await generateAnalysis(result, profile.role, profile.age);
    setAnalysis(aiResult);
    setLoadingAI(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-12">
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 no-print gap-4">
        <div className="text-center md:text-left">
           <h2 className="text-xl md:text-2xl font-bold text-gray-800">Analiz Raporu</h2>
           <p className="text-sm text-gray-500">Sonuçlar başarıyla hesaplandı.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition font-medium active:scale-95"
          >
            <Printer className="w-4 h-4" /> Yazdır / PDF
          </button>
        </div>
      </div>

      {/* Main Report Area - Ref for PDF */}
      <div ref={printRef} className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 md:p-12 print:bg-white print:text-black print:border-b-2 print:border-black">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <p className="text-slate-400 print:text-gray-500 text-xs md:text-sm uppercase tracking-wider mb-2 font-semibold">MindScreen AI • Bilişsel Tarama Raporu</p>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{profile.name}</h1>
              <div className="flex flex-wrap gap-2 md:gap-4 mt-2 text-slate-300 print:text-gray-600 text-xs md:text-sm font-medium">
                <span className="bg-white/10 print:bg-gray-100 px-3 py-1 rounded-full">Yaş: {profile.age}</span>
                <span className="bg-white/10 print:bg-gray-100 px-3 py-1 rounded-full">Sınıf: {profile.grade}</span>
                <span className="bg-white/10 print:bg-gray-100 px-3 py-1 rounded-full">{new Date().toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
            <div className="text-left md:text-right w-full md:w-auto bg-white/5 md:bg-transparent p-4 md:p-0 rounded-xl">
              <div className={`text-4xl md:text-5xl font-bold mb-1 ${result.totalScore > 64 ? 'text-red-400' : result.totalScore > 34 ? 'text-orange-400' : 'text-green-400'}`}>
                {result.totalScore}
              </div>
              <p className="text-xs text-slate-400 print:text-gray-500 uppercase tracking-wide">Genel Risk Skoru</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          
          {/* Left Column: Visuals */}
          <div className="print:break-inside-avoid order-1 md:order-1">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
              <Activity className="w-5 h-5 text-primary" /> Beceriler Haritası
            </h3>
            <div className="h-[300px] md:h-[350px] w-full bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Öğrenci"
                    dataKey="A"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    fill="#4F46E5"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-mono">MindScreen v1.0</div>
            </div>

            <div className="mt-8 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Öne Çıkan Klinik Bulgular</h4>
              {Object.values(result.categoryScores).flatMap(c => c.findings).length > 0 ? (
                <div className="bg-red-50/80 p-5 md:p-6 rounded-xl border border-red-100">
                   <ul className="text-sm text-gray-700 space-y-2">
                    {Object.values(result.categoryScores).flatMap(c => c.findings).slice(0, 5).map((finding, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="text-red-500 mt-1 min-w-[8px]">•</span>
                        <span className="leading-snug">{finding}</span>
                      </li>
                    ))}
                  </ul>
                  {Object.values(result.categoryScores).flatMap(c => c.findings).length > 5 && (
                     <p className="text-xs text-red-500 mt-3 font-medium text-right">
                       ...ve {Object.values(result.categoryScores).flatMap(c => c.findings).length - 5} diğer bulgu.
                     </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-green-700 bg-green-50 p-6 rounded-xl flex items-center gap-3 border border-green-100">
                  <CheckCircle className="w-5 h-5" /> Kritik düzeyde bir risk belirtisi işaretlenmemiştir.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Category Breakdown */}
          <div className="space-y-4 print:break-inside-avoid order-2 md:order-2">
             <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">Alan Bazlı Detaylar</h3>
             {Object.entries(result.categoryScores).map(([key, data]) => (
               <div key={key} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 transition shadow-sm">
                 <div className="flex-1 pr-4">
                   <p className="font-bold text-gray-800 text-sm">{CATEGORY_LABELS[key as EvaluationCategory]}</p>
                   <div className="w-full max-w-[120px] h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${data.score > 64 ? 'bg-red-500' : data.score > 34 ? 'bg-orange-400' : 'bg-green-400'}`} 
                        style={{ width: `${data.score}%` }}
                      />
                   </div>
                 </div>
                 <div className="text-right flex-shrink-0">
                    <span className={`
                      inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold
                      ${data.riskLevel === 'high' ? 'bg-red-100 text-red-700' : 
                        data.riskLevel === 'moderate' ? 'bg-orange-100 text-orange-700' : 
                        'bg-green-100 text-green-700'}
                    `}>
                      {data.riskLabel}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">Skor: %{data.score}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="border-t border-gray-200 bg-slate-50/80 p-6 md:p-12 print:bg-white print:border-t-2 print:border-black">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
               <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
             </div>
             <div>
               <h3 className="text-lg md:text-xl font-bold text-gray-900">Uzman Görüşü & Tavsiyeler</h3>
               <p className="text-xs md:text-sm text-indigo-600 font-medium no-print">Powered by Google Gemini AI</p>
             </div>
           </div>

           {!analysis && !loadingAI && (
             <div className="text-center py-8 md:py-12 bg-white rounded-2xl border border-dashed border-gray-300 no-print px-4">
               <p className="text-gray-600 mb-6 max-w-lg mx-auto leading-relaxed text-sm md:text-base">
                 Çocuğunuzun sonuçlarını kıdemli bir <strong>Özel Eğitim Uzmanı</strong> perspektifiyle analiz etmek için yapay zeka motorunu başlatın.
               </p>
               <button 
                onClick={handleGenerateAI}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl transition shadow-xl shadow-indigo-200 inline-flex items-center justify-center gap-2 transform active:scale-95"
               >
                 <Sparkles className="w-5 h-5" />
                 Analiz Motorunu Başlat
               </button>
             </div>
           )}

           {loadingAI && (
             <div className="flex flex-col items-center justify-center py-16 text-indigo-600 bg-white rounded-2xl border border-gray-100 shadow-inner">
               <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin mb-4" />
               <p className="text-sm md:text-base font-medium animate-pulse">Veriler işleniyor...</p>
             </div>
           )}

           {analysis && (
             <div className="animate-fade-in space-y-8">
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-indigo-100 shadow-sm relative print:border print:border-gray-300 mt-4">
                  <div className="absolute -top-3 left-4 md:left-8 bg-indigo-600 text-white text-[10px] md:text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide shadow-md">
                    Ebeveyn Bilgilendirme Notu
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base md:text-lg font-serif mt-2">
                    {analysis.letter}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base md:text-lg">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                    Önerilen Ev İçi Destek Planı
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {analysis.actionSteps.map((step, idx) => (
                      <div key={idx} className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-300 transition print:border-gray-300">
                         <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold text-base md:text-lg flex items-center justify-center mb-3 md:mb-4">
                           {idx + 1}
                         </div>
                         <p className="text-gray-600 text-sm leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
           )}

           <div className="mt-8 md:mt-12 pt-6 border-t border-gray-200 text-center print:mt-6">
             <p className="text-[10px] md:text-xs text-gray-400 flex flex-col md:flex-row items-center justify-center gap-2">
               <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 md:w-4 md:h-4" /> <strong>YASAL UYARI:</strong></span>
               <span>Bu rapor bir tıbbi tanı belgesi değildir. Sonuçlar sadece tarama amaçlıdır.</span>
             </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ResultDashboard;
import React from 'react';
import { ScreeningResult, User } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';

interface AnalyticsViewProps {
  reports: (ScreeningResult & { studentName: string })[];
  userRole: string;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Green, Orange, Red

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ reports, userRole }) => {

  // Öğretmen için: Sınıf Risk Dağılımı
  const riskDistribution = [
    { name: 'Düşük Risk', value: reports.filter(r => r.totalScore < 35).length },
    { name: 'Orta Risk', value: reports.filter(r => r.totalScore >= 35 && r.totalScore < 65).length },
    { name: 'Yüksek Risk', value: reports.filter(r => r.totalScore >= 65).length },
  ];

  // Veli için: Çocuğun Tarihsel Gelişimi (Örnek: İlk öğrenciye göre filtreleyelim veya hepsini gösterelim)
  // Gerçek senaryoda bu veri API'den "öğrenci bazlı history" olarak gelmeli.
  // Burada elimizdeki raporları tarihe göre sıralayıp grafik yapacağız.
  const trendData = [...reports]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({
      date: new Date(r.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
      score: r.totalScore,
      attention: r.categoryScores.attention?.score || 0,
      reading: r.categoryScores.reading?.score || 0
    }));

  if (reports.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
        Analiz oluşturmak için yeterli veri bulunmamaktadır. Lütfen önce tarama yapın.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <p className="text-gray-500 text-sm font-medium">Toplam Analiz</p>
           <h3 className="text-3xl font-bold text-indigo-900 mt-2">{reports.length}</h3>
           <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
             <Activity className="w-3 h-3" /> Aktif Veri Akışı
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <p className="text-gray-500 text-sm font-medium">Ortalama Risk Skoru</p>
           <h3 className="text-3xl font-bold text-gray-800 mt-2">
             {Math.round(reports.reduce((acc, curr) => acc + curr.totalScore, 0) / reports.length)}%
           </h3>
           <p className="mt-2 text-xs text-gray-400">Genel Ortalama</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
           <p className="text-gray-500 text-sm font-medium">En Kritik Alan</p>
           <h3 className="text-3xl font-bold text-red-500 mt-2">Okuma</h3>
           <p className="mt-2 text-xs text-gray-400">Sistem Geneli Trendi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Grafik 1: Risk Dağılımı (Özellikle Öğretmen İçin) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-600" />
            {userRole === 'teacher' ? 'Sınıf Risk Dağılımı' : 'Genel Risk Durumu'}
          </h3>
          <div className="h-[300px] w-full flex justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={riskDistribution}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={100}
                   fill="#8884d8"
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {riskDistribution.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 2: Zaman İçinde Değişim (Trend) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
           <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-indigo-600" />
             Gelişim Trendi (Son Taramalar)
           </h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={trendData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                 <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                 <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
                 <Legend />
                 <Line type="monotone" dataKey="score" name="Genel Skor" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                 <Line type="monotone" dataKey="reading" name="Okuma" stroke="#ec4899" strokeWidth={2} strokeDasharray="5 5" dot={false} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

      </div>

      {/* Detaylı İstatistik Alanı */}
      <div className="bg-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden">
         <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Yapay Zeka Destekli İçgörü</h3>
            <p className="text-indigo-200 max-w-2xl text-sm leading-relaxed">
               Son veriler ışığında, okuma becerilerinde %12'lik bir iyileşme trendi gözlemleniyor. Dikkat eksikliği parametreleri ise son 3 ayda sabit seyrediyor. Önerilen aksiyon: Görsel dikkati artırıcı oyunlara ağırlık verilmeli.
            </p>
         </div>
         {/* Dekoratif Arkaplan */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 opacity-20 rounded-full -ml-10 -mb-10 blur-xl"></div>
      </div>

    </div>
  );
};

export default AnalyticsView;
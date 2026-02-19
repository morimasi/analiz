import React, { useState, useMemo } from 'react';
import { ScreeningResult, Student, User } from '../types';
import { Search, Filter, Calendar, Download, Eye, ArrowUpDown, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface ArchiveViewProps {
  reports: (ScreeningResult & { studentName: string })[];
  onViewReport: (report: ScreeningResult) => void;
  userRole: string;
}

type SortField = 'date' | 'score' | 'name';
type SortOrder = 'asc' | 'desc';

const ArchiveView: React.FC<ArchiveViewProps> = ({ reports, onViewReport, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'moderate' | 'low'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filtreleme ve Sıralama Mantığı
  const processedReports = useMemo(() => {
    let data = [...reports];

    // 1. Arama
    if (searchTerm) {
      data = data.filter(r => 
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Risk Filtresi
    if (riskFilter !== 'all') {
      data = data.filter(r => {
        if (riskFilter === 'high') return r.totalScore >= 65;
        if (riskFilter === 'moderate') return r.totalScore >= 35 && r.totalScore < 65;
        return r.totalScore < 35;
      });
    }

    // 3. Sıralama
    data.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'score':
          comparison = a.totalScore - b.totalScore;
          break;
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return data;
  }, [reports, searchTerm, riskFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 65) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1"/> Yüksek Risk</span>;
    if (score >= 35) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1"/> Orta Risk</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1"/> Düşük Risk</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Dijital Rapor Arşivi
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Toplam {processedReports.length} kayıt listeleniyor.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Öğrenci ara..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
          >
            <option value="all">Tüm Risk Seviyeleri</option>
            <option value="high">Yüksek Risk</option>
            <option value="moderate">Orta Risk</option>
            <option value="low">Düşük Risk</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition">
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">Tarih <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('name')}>
                   <div className="flex items-center gap-1">Öğrenci Adı <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th scope="col" className="px-6 py-4">Tarayan</th>
                <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('score')}>
                   <div className="flex items-center gap-1">Risk Skoru <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th scope="col" className="px-6 py-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Arşivde kriterlere uygun kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                processedReports.map((report) => (
                  <tr key={report.id} className="bg-white hover:bg-indigo-50/30 transition group">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(report.date).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {report.studentName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${report.completedBy === 'parent' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {report.completedBy === 'parent' ? 'Veli' : 'Öğretmen'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getRiskBadge(report.totalScore)}
                      <span className="text-xs text-gray-400 ml-2">(%{report.totalScore})</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onViewReport(report)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium inline-flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> İncele
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Footer / Pagination Mockup */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
           <span>Sayfa 1 / 1</span>
           <div className="flex gap-2">
             <button disabled className="px-3 py-1 border rounded bg-white text-gray-300 cursor-not-allowed">Önceki</button>
             <button disabled className="px-3 py-1 border rounded bg-white text-gray-300 cursor-not-allowed">Sonraki</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveView;
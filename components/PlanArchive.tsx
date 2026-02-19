import React, { useState, useMemo } from 'react';
import { EducationPlan } from '../types';
import { Search, Calendar, FileText, Eye, ArrowRight, ClipboardList } from 'lucide-react';

interface PlanArchiveProps {
  plans: (EducationPlan & { studentName?: string })[];
  onViewPlan: (plan: EducationPlan) => void;
  userRole: string;
}

const PlanArchive: React.FC<PlanArchiveProps> = ({ plans, onViewPlan, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlans = useMemo(() => {
    if (!searchTerm) return plans || [];
    return (plans || []).filter(p => 
      p.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [plans, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            BEP Arşivi (Eğitim Planları)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {userRole === 'teacher' ? 'Öğrencileriniz için oluşturulan' : 'Çocuğunuz için hazırlanan'} toplam {filteredPlans?.length || 0} plan.
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Öğrenci veya plan ara..." 
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans?.length === 0 ? (
           <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Arşivde görüntülenecek eğitim planı bulunamadı.</p>
           </div>
        ) : (
          filteredPlans?.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition group overflow-hidden flex flex-col">
               <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md uppercase tracking-wider">
                          Eğitim Planı
                        </span>
                        <h3 className="font-bold text-gray-900 mt-2 text-lg">{plan.studentName}</h3>
                     </div>
                     <div className="text-right">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(plan.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                     </div>
                  </div>
                  
                  <div className="space-y-3">
                     <p className="text-sm text-gray-600 line-clamp-3 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                       "{plan.content?.summary || 'Özet bilgisi yok.'}"
                     </p>
                     
                     <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FileText className="w-3 h-3" />
                        <span>{plan.content?.focusAreas?.length || 0} Odak</span>
                        <span className="text-gray-300">|</span>
                        <span>{plan.content?.weeklySchedule?.length || 0} Günlük</span>
                     </div>
                  </div>
               </div>

               <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">
                     Revize: {plan.content?.reviewDate || '-'}
                  </span>
                  <button 
                    onClick={() => onViewPlan(plan)}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:gap-2 transition-all"
                  >
                    Planı Görüntüle <ArrowRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlanArchive;
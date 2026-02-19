import React, { useState, useEffect } from 'react';
import { User, Student, ScreeningResult, Role, CATEGORY_LABELS, EvaluationCategory } from '../types';
import { db, authService } from '../services/db';
import { Plus, User as UserIcon, Calendar, FileText, ChevronRight, GraduationCap, LogOut, Trash2, AlertCircle } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onStartScreening: (student: Student) => void;
  onViewReport: (report: ScreeningResult, student: Student) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onStartScreening, onViewReport }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [recentReports, setRecentReports] = useState<(ScreeningResult & { studentName: string })[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', age: '', grade: '', gender: 'male' });

  // Data Loading
  useEffect(() => {
    refreshData();
  }, [user]);

  const refreshData = () => {
    const myStudents = db.getStudents(user.id, user.role);
    setStudents(myStudents);
    const reports = db.getRecentScreeningsByUser(user.id, user.role);
    setRecentReports(reports);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.name && newStudent.age && newStudent.grade) {
      const studentData: any = {
        name: newStudent.name,
        age: Number(newStudent.age),
        grade: newStudent.grade,
        gender: newStudent.gender
      };

      if (user.role === 'parent') {
        studentData.parentId = user.id;
      } else {
        studentData.teacherId = user.id;
      }

      db.addStudent(studentData);
      setShowAddModal(false);
      setNewStudent({ name: '', age: '', grade: '', gender: 'male' });
      refreshData();
    }
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm("Öğrenci kaydını silmek istediğinize emin misiniz?")) {
      db.deleteStudent(id);
      refreshData();
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 65) return 'text-red-600 bg-red-50 border-red-100';
    if (score >= 35) return 'text-orange-600 bg-orange-50 border-orange-100';
    return 'text-green-600 bg-green-50 border-green-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
               <span className="text-2xl text-white">🧠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">MindScreen AI</h1>
              <p className="text-xs text-gray-500 font-medium">{user.role === 'parent' ? 'Veli Paneli' : 'Öğretmen Paneli'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-700">{user.name}</p>
                {user.schoolName && <p className="text-xs text-gray-500">{user.schoolName}</p>}
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
              title="Çıkış Yap"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Merhaba, {user.name} 👋</h2>
            <p className="text-indigo-100 max-w-xl text-lg">
              {user.role === 'parent' 
                ? 'Çocuğunuzun bilişsel gelişimini takip etmek ve desteklemek için doğru yerdesiniz.' 
                : 'Sınıfınızdaki öğrencilerin gelişim risklerini erken tespit edip aksiyon alın.'}
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <BrainPattern />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Students List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                {user.role === 'parent' ? 'Çocuklarım' : 'Öğrenci Listesi'}
              </h3>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-200 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                {user.role === 'parent' ? 'Çocuk Ekle' : 'Öğrenci Ekle'}
              </button>
            </div>

            {students.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Henüz kayıt yok</h4>
                <p className="text-gray-500 mb-6">Analiz yapmaya başlamak için önce profil ekleyin.</p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="text-indigo-600 font-semibold hover:text-indigo-800"
                >
                  + Yeni Kayıt Ekle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map(student => (
                  <div key={student.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{student.name}</h4>
                          <p className="text-xs text-gray-500">{student.grade}. Sınıf • {student.age} Yaş</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => onStartScreening(student)}
                      className="w-full py-3 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 border border-gray-200 hover:border-indigo-200"
                    >
                      <FileText className="w-4 h-4" />
                      Yeni Tarama Başlat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recent Activity / Reports */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Son Raporlar
            </h3>
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {recentReports.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Henüz tamamlanmış bir tarama yok.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentReports.map((report) => (
                    <div 
                      key={report.id} 
                      onClick={() => {
                        const student = students.find(s => s.id === report.studentId);
                        if(student) onViewReport(report, student);
                      }}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-700 text-sm">{report.studentName}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(report.date).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getRiskColor(report.totalScore)}`}>
                             %{report.totalScore} Risk Skoru
                           </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats for Teachers */}
            {user.role === 'teacher' && students.length > 0 && (
              <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                <h4 className="text-orange-800 font-bold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Sınıf Özeti
                </h4>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-orange-700">Toplam Öğrenci</span>
                  <span className="font-bold">{students.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-orange-700">Yapılan Tarama</span>
                  <span className="font-bold">{recentReports.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {user.role === 'parent' ? 'Yeni Çocuk Ekle' : 'Yeni Öğrenci Ekle'}
            </h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yaş</label>
                  <input
                    type="number"
                    required
                    min="4"
                    max="18"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newStudent.age}
                    onChange={e => setNewStudent({...newStudent, age: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={newStudent.grade}
                    onChange={e => setNewStudent({...newStudent, grade: e.target.value})}
                  >
                    <option value="">Seçiniz</option>
                    <option value="okul_oncesi">Okul Öncesi</option>
                    <option value="1">1. Sınıf</option>
                    <option value="2">2. Sınıf</option>
                    <option value="3">3. Sınıf</option>
                    <option value="4">4. Sınıf</option>
                    <option value="ortaokul">Ortaokul</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const BrainPattern = () => (
  <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFFFFF" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.4,70.9,32.4C59.6,43.4,48.3,52.6,36.2,60.8C24.1,69,11.2,76.3,-2.6,80.8C-16.4,85.3,-31.1,87,-44.1,80.1C-57.1,73.2,-68.4,57.7,-76.3,41.4C-84.2,25.1,-88.7,8,-85.8,-7.8C-82.9,-23.6,-72.6,-38.1,-60.8,-49.2C-49,-60.3,-35.7,-68,-22.1,-75.6C-8.5,-83.2,5.4,-90.7,19.9,-91.8C34.4,-92.9,49.5,-87.6,44.7,-76.4Z" transform="translate(100 100)" />
  </svg>
);

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { User, Student, ScreeningResult, Message, EducationPlan } from '../types';
import { api } from '../services/db';
import ArchiveView from './ArchiveView';
import AnalyticsView from './AnalyticsView';
import EducationPlanView from './EducationPlanView'; 
import PlanArchive from './PlanArchive';
import { Plus, User as UserIcon, Calendar, FileText, ChevronRight, LogOut, Trash2, AlertCircle, Mail, Send, Loader2, ShieldCheck, PieChart, BarChart2, FolderOpen, ClipboardList, Sparkles, Pencil, UserPlus, Link as LinkIcon, Copy, Check } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onStartScreening: (student: Student) => void;
  onViewReport: (report: ScreeningResult, student: Student) => void;
}

type Tab = 'overview' | 'students' | 'messages' | 'archive' | 'analytics' | 'education_plan' | 'plan_archive';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onStartScreening, onViewReport }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [recentReports, setRecentReports] = useState<(ScreeningResult & { studentName: string })[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allPlans, setAllPlans] = useState<(EducationPlan & { studentName?: string })[]>([]);
  
  // Eğitim Planı için State
  const [planTargetStudent, setPlanTargetStudent] = useState<Student | null>(null);
  const [planTargetScreening, setPlanTargetScreening] = useState<ScreeningResult | null>(null);
  const [planToView, setPlanToView] = useState<EducationPlan | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null); // Düzenleme modu için
  const [studentFormData, setStudentFormData] = useState({ name: '', age: '', grade: '', gender: 'male', notes: '' });
  const [newMessage, setNewMessage] = useState({ to: '', content: '' });

  // Davetiye State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTargetStudent, setInviteTargetStudent] = useState<Student | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Data Loading
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Paralel veri çekimi
      const promises: Promise<any>[] = [
        api.students.list(user.id, user.role),
        api.screenings.listByUser(user.id, user.role),
        api.messages.list(user.id)
      ];

      // Sadece öğretmenler planları çekebilir
      if (user.role !== 'parent') {
        promises.push(api.plans.list(user.id, user.role));
      }

      const results = await Promise.all(promises);
      
      setStudents(results[0] as Student[]);
      setRecentReports(results[1] as (ScreeningResult & { studentName: string })[]);
      setMessages(results[2] as Message[]);
      
      if (user.role !== 'parent') {
        setAllPlans(results[3] as (EducationPlan & { studentName?: string })[]);
      }

    } catch (e) {
      console.error("Veri yüklenemedi", e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingStudentId(null);
    setStudentFormData({ name: '', age: '', grade: '', gender: 'male', notes: '' });
    setShowAddModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudentId(student.id);
    setStudentFormData({
        name: student.name,
        age: student.age.toString(),
        grade: student.grade,
        gender: student.gender || 'male',
        notes: student.notes || ''
    });
    setShowAddModal(true);
  };

  const openInviteModal = (student: Student) => {
    setInviteTargetStudent(student);
    setInviteEmail('');
    setGeneratedLink('');
    setCopied(false);
    setShowInviteModal(true);
  };

  const handleInviteParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteTargetStudent || !inviteEmail) return;

    setInviteLoading(true);
    try {
      const result = await api.invitations.create(user.id, inviteTargetStudent.id, inviteEmail);
      if (result.success) {
        setGeneratedLink(result.link);
      }
    } catch (error) {
      alert("Davetiye oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentFormData.name && studentFormData.age && studentFormData.grade) {
      const studentData: any = {
        name: studentFormData.name,
        age: Number(studentFormData.age),
        grade: studentFormData.grade,
        gender: studentFormData.gender,
        notes: studentFormData.notes
      };

      try {
        if (editingStudentId) {
          // UPDATE
          await api.students.update(editingStudentId, studentData);
        } else {
          // CREATE
          if (user.role === 'parent') {
            studentData.parentId = user.id;
          } else {
            studentData.teacherId = user.id;
          }
          await api.students.add(studentData);
        }
        
        setShowAddModal(false);
        setStudentFormData({ name: '', age: '', grade: '', gender: 'male', notes: '' });
        setEditingStudentId(null);
        loadData();
      } catch (error) {
        alert("İşlem sırasında bir hata oluştu.");
      }
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Öğrenci kaydını ve ilgili tüm verileri silmek istediğinize emin misiniz?")) {
      await api.students.delete(id);
      loadData();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    let receiverId = '';
    if (user.role === 'parent') {
       const teacherId = students[0]?.teacherId;
       receiverId = teacherId || 'demo_teacher_1';
    } else {
       receiverId = 'demo_parent_1';
    }

    await api.messages.send({
      senderId: user.id,
      receiverId: receiverId,
      content: newMessage.content,
      senderName: user.name
    });
    setNewMessage({ ...newMessage, content: '' });
    loadData();
  };

  const handleArchiveReportView = (report: ScreeningResult) => {
    const student = students.find(s => s.id === report.studentId);
    if(student) {
        onViewReport(report, student);
    } else {
        const mockStudent: Student = { 
            id: report.studentId || 'unknown', 
            name: (report as any).studentName || 'Bilinmeyen Öğrenci', 
            age: 0, 
            grade: '?' 
        };
        onViewReport(report, mockStudent);
    }
  };

  const handleCreateEducationPlan = (report: ScreeningResult) => {
    const student = students.find(s => s.id === report.studentId);
    if (student) {
      setPlanTargetStudent(student);
      setPlanTargetScreening(report);
      setPlanToView(null);
      setActiveTab('education_plan');
    }
  };

  const handleViewArchivedPlan = (plan: EducationPlan) => {
    const student = students.find(s => s.id === plan.studentId) || { 
       id: plan.studentId, 
       name: (plan as any).studentName || 'Öğrenci', 
       age: 0, 
       grade: '?' 
    } as Student;

    setPlanTargetStudent(student);
    setPlanToView(plan);
    setPlanTargetScreening(null);
    setActiveTab('education_plan');
  };

  const getRiskColor = (score: number) => {
    if (score >= 65) return 'text-red-600 bg-red-50 border-red-100';
    if (score >= 35) return 'text-orange-600 bg-orange-50 border-orange-100';
    return 'text-green-600 bg-green-50 border-green-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Verileriniz güvenle yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Admin özel istatistikleri
  const totalStudents = students.length;
  const highRiskCount = recentReports.filter(r => r.totalScore >= 65).length;
  const totalScreenings = recentReports.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${user.role === 'admin' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
               <span className="text-2xl text-white">🧠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">MindScreen AI</h1>
              <p className="text-xs text-gray-500 font-medium">
                {user.role === 'parent' ? 'Veli Paneli' : user.role === 'admin' ? 'Yönetici Paneli' : 'Öğretmen Paneli'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Desktop Nav */}
             <nav className="hidden md:flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('overview')} 
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'overview' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Genel Bakış
                </button>
                
                {/* VELİLER ARŞİVİ GÖREMEZ */}
                {user.role !== 'parent' && (
                  <button 
                    onClick={() => setActiveTab('archive')} 
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition flex items-center gap-2 ${activeTab === 'archive' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <FolderOpen className="w-4 h-4"/> Rapor Arşivi
                  </button>
                )}
                
                {/* BEP Arşivi Sadece Öğretmen ve Yöneticiler İçin */}
                {user.role !== 'parent' && (
                  <button 
                    onClick={() => setActiveTab('plan_archive')} 
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition flex items-center gap-2 ${activeTab === 'plan_archive' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <ClipboardList className="w-4 h-4"/> BEP Arşivi
                  </button>
                )}

                {/* ANALİZLER VELİLERE KAPALI */}
                {user.role !== 'parent' && (
                  <button 
                    onClick={() => setActiveTab('analytics')} 
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <BarChart2 className="w-4 h-4"/> Analizler
                  </button>
                )}

                {user.role !== 'admin' && (
                  <button onClick={() => setActiveTab('messages')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition flex items-center gap-2 ${activeTab === 'messages' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    Mesajlar
                    {messages.filter(m => !m.isRead && m.receiverId === user.id).length > 0 && (
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                )}
             </nav>

            <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block text-sm mr-2">
                <p className="font-semibold text-gray-700 leading-none">{user.name}</p>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* === TAB: EDUCATION PLAN (VIEW / CREATE) === */}
        {activeTab === 'education_plan' && planTargetStudent && user.role !== 'parent' && (
           <EducationPlanView 
             student={planTargetStudent}
             teacherId={user.id}
             screeningResult={planTargetScreening || undefined}
             preLoadedPlan={planToView || undefined}
             onBack={() => {
                if (planToView) setActiveTab('plan_archive');
                else setActiveTab('overview');
             }}
             userRole={user.role}
           />
        )}

        {/* === TAB: PLAN ARCHIVE === */}
        {activeTab === 'plan_archive' && user.role !== 'parent' && (
           <PlanArchive 
             plans={allPlans} 
             onViewPlan={handleViewArchivedPlan} 
             userRole={user.role}
           />
        )}

        {/* === TAB: MESSAGES === */}
        {activeTab === 'messages' && user.role !== 'admin' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px] animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                 <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800">Gelen Kutusu</h3>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">Mesajınız yok.</div>
                    ) : (
                      messages.map(msg => (
                        <div key={msg.id} className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${msg.senderId === user.id ? 'bg-indigo-50/30' : ''}`}>
                           <div className="flex justify-between mb-1">
                              <span className="font-bold text-sm text-gray-800">{msg.senderId === user.id ? 'Ben' : msg.senderName}</span>
                              <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                           </div>
                           <p className="text-sm text-gray-600 line-clamp-2">{msg.content}</p>
                        </div>
                      ))
                    )}
                 </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-600" /> Yeni Mesaj Gönder
                 </h3>
                 <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-700 border border-yellow-100">
                       Not: Bu demo sürümünde mesajlar otomatik olarak bağlı olduğunuz {user.role === 'parent' ? 'sınıf öğretmenine' : 'öğrenci velisine'} iletilir.
                    </div>
                    <textarea 
                       className="w-full flex-1 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-gray-50"
                       placeholder="Mesajınızı buraya yazın..."
                       value={newMessage.content}
                       onChange={e => setNewMessage({...newMessage, content: e.target.value})}
                    ></textarea>
                    <div className="flex justify-end">
                       <button 
                         onClick={handleSendMessage}
                         disabled={!newMessage.content}
                         className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                       >
                         Gönder <Send className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* === TAB: ARCHIVE === */}
        {activeTab === 'archive' && user.role !== 'parent' && (
          <ArchiveView reports={recentReports} onViewReport={handleArchiveReportView} userRole={user.role} />
        )}

        {/* === TAB: ANALYTICS === */}
        {activeTab === 'analytics' && user.role !== 'parent' && (
          <AnalyticsView reports={recentReports} userRole={user.role} />
        )}

        {/* === TAB: OVERVIEW === */}
        {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className={`rounded-2xl p-8 text-white shadow-xl relative overflow-hidden animate-fade-in ${user.role === 'admin' ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-indigo-600 to-purple-700'}`}>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Merhaba, {user.name} 👋</h2>
              <p className={`${user.role === 'admin' ? 'text-slate-300' : 'text-indigo-100'} max-w-xl text-lg`}>
                {user.role === 'parent' 
                  ? 'Çocuğunuzun bilişsel gelişimini takip etmek ve desteklemek için doğru yerdesiniz.' 
                  : user.role === 'admin' 
                    ? 'Sistem genelindeki tarama verileri ve kullanıcı istatistikleri aşağıdadır.'
                    : 'Sınıfınızdaki öğrencilerin gelişim risklerini erken tespit edip aksiyon alın.'}
              </p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
              <BrainPattern />
            </div>
          </div>

          {/* Admin Stats Cards */}
          {user.role === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><UserIcon className="w-6 h-6"/></div>
                  <div>
                    <p className="text-gray-500 text-sm">Toplam Öğrenci</p>
                    <h3 className="text-2xl font-bold text-gray-800">{totalStudents}</h3>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl text-green-600"><FileText className="w-6 h-6"/></div>
                  <div>
                    <p className="text-gray-500 text-sm">Tamamlanan Tarama</p>
                    <h3 className="text-2xl font-bold text-gray-800">{totalScreenings}</h3>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-xl text-red-600"><AlertCircle className="w-6 h-6"/></div>
                  <div>
                    <p className="text-gray-500 text-sm">Yüksek Riskli</p>
                    <h3 className="text-2xl font-bold text-gray-800">{highRiskCount}</h3>
                  </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Students List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-indigo-600" />
                  {user.role === 'parent' ? 'Çocuklarım' : 'Öğrenci Listesi'}
                </h3>
                <button 
                  onClick={openAddModal}
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
                    onClick={openAddModal}
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
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button 
                              onClick={() => openEditModal(student)}
                              className="text-gray-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50 transition"
                              title="Düzenle"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mb-2">
                        {user.role === 'teacher' && !student.parentId && (
                           <button 
                             onClick={() => openInviteModal(student)}
                             className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium text-xs transition flex items-center justify-center gap-1 border border-green-200"
                           >
                              <UserPlus className="w-3.5 h-3.5" /> Veli Davet Et
                           </button>
                        )}
                      </div>

                      {user.role !== 'admin' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onStartScreening(student)}
                            className="flex-1 py-2.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 rounded-lg font-medium text-xs transition flex items-center justify-center gap-2 border border-gray-200 hover:border-indigo-200"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Tarama Yap
                          </button>
                          
                          <button 
                            onClick={() => setActiveTab('messages')}
                            className="px-3 py-2.5 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-600 rounded-lg border border-gray-200 transition"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      
                      {user.role === 'admin' && (
                        <div className="bg-gray-50 p-2 rounded text-xs text-gray-500 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Yönetici Görünümü
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Recent Activity / Reports */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  {user.role === 'admin' ? 'Tüm Sistem Raporları' : 'Son Raporlar'}
                </h3>
                {user.role !== 'parent' && (
                  <button onClick={() => setActiveTab('archive')} className="text-xs font-semibold text-indigo-600 hover:underline">Tümünü Gör</button>
                )}
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {recentReports.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    Henüz tamamlanmış bir tarama yok.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recentReports.slice(0, 5).map((report) => (
                      <div 
                        key={report.id} 
                        className="p-4 hover:bg-gray-50 transition flex items-center justify-between group"
                      >
                        <div onClick={() => {
                          const student = students.find(s => s.id === report.studentId);
                          if(student) onViewReport(report, student);
                        }} className="cursor-pointer flex-1">
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

                        {/* ÖĞRETMEN İÇİN PLAN OLUŞTURMA BUTONU */}
                        {user.role === 'teacher' && (
                           <button 
                             onClick={() => handleCreateEducationPlan(report)}
                             className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 hover:scale-105 active:scale-95 border border-purple-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm ml-2"
                             title="Bireyselleştirilmiş Eğitim Planı Oluştur"
                           >
                              <Sparkles className="w-3 h-3" /> BEP Oluştur
                           </button>
                        )}
                        
                        {user.role !== 'teacher' && (
                             <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 cursor-pointer" onClick={() => {
                                const student = students.find(s => s.id === report.studentId);
                                if(student) onViewReport(report, student);
                              }}/>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </main>

      {/* Add/Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingStudentId ? 'Öğrenci Bilgilerini Düzenle' : (user.role === 'parent' ? 'Yeni Çocuk Ekle' : 'Yeni Öğrenci Ekle')}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={studentFormData.name}
                  onChange={e => setStudentFormData({...studentFormData, name: e.target.value})}
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
                    value={studentFormData.age}
                    onChange={e => setStudentFormData({...studentFormData, age: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={studentFormData.grade}
                    onChange={e => setStudentFormData({...studentFormData, grade: e.target.value})}
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
              
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Özel Notlar</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Varsa özel durumları belirtin..."
                    value={studentFormData.notes}
                    onChange={e => setStudentFormData({...studentFormData, notes: e.target.value})}
                  />
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
                  {editingStudentId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Parent Modal */}
      {showInviteModal && inviteTargetStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in relative">
              <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <span className="text-xl">×</span>
              </button>
              
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Veli Davet Et</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <strong>{inviteTargetStudent.name}</strong> için veliyi sisteme davet edin.
                </p>
              </div>

              {!generatedLink ? (
                <form onSubmit={handleInviteParent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Veli E-posta Adresi</label>
                    <input
                      type="email"
                      required
                      placeholder="ornek@veli.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={inviteLoading}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                  >
                    {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <LinkIcon className="w-4 h-4" />}
                    Davet Linki Oluştur
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                   <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                      <p className="text-green-800 font-medium mb-2">Davet Linki Hazır! 🎉</p>
                      <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg p-2">
                         <input 
                           readOnly 
                           value={generatedLink} 
                           className="flex-1 text-xs text-gray-600 outline-none bg-transparent"
                         />
                         <button 
                           onClick={handleCopyLink}
                           className="p-2 hover:bg-gray-100 rounded-md transition text-gray-500"
                           title="Kopyala"
                         >
                           {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                         </button>
                      </div>
                      <p className="text-xs text-green-600 mt-2">Bu linki kopyalayıp veliye gönderin.</p>
                   </div>
                   <button 
                     onClick={() => setShowInviteModal(false)}
                     className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                   >
                     Tamamla
                   </button>
                </div>
              )}
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
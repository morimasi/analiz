import React, { useState, useEffect } from 'react';
import { User, Student, ScreeningResult, Message, EducationPlan, DashboardInsight } from '../types';
import { api } from '../services/db';
import { generateDashboardBriefing } from '../services/geminiService';
import ArchiveView from './ArchiveView';
import AnalyticsView from './AnalyticsView';
import EducationPlanView from './EducationPlanView'; 
import PlanArchive from './PlanArchive';
import { 
  Plus, User as UserIcon, Calendar, FileText, ChevronRight, LogOut, 
  Trash2, AlertCircle, Mail, Send, Loader2, ShieldCheck, PieChart, 
  BarChart2, FolderOpen, ClipboardList, Sparkles, Pencil, UserPlus, 
  Link as LinkIcon, Copy, Check, Zap, ArrowUpRight, Target, Activity,
  Users, MessageSquare, Bell
} from 'lucide-react';

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
  const [briefingLoading, setBriefingLoading] = useState(false);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [recentReports, setRecentReports] = useState<(ScreeningResult & { studentName: string })[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allPlans, setAllPlans] = useState<(EducationPlan & { studentName?: string })[]>([]);
  const [aiInsights, setAiInsights] = useState<DashboardInsight[]>([]);
  
  const [planTargetStudent, setPlanTargetStudent] = useState<Student | null>(null);
  const [planTargetScreening, setPlanTargetScreening] = useState<ScreeningResult | null>(null);
  const [planToView, setPlanToView] = useState<EducationPlan | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentFormData, setStudentFormData] = useState({ name: '', age: '', grade: '', gender: 'male', notes: '' });
  const [newMessage, setNewMessage] = useState({ to: '', content: '' });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTargetStudent, setInviteTargetStudent] = useState<Student | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [
        api.students.list(user.id, user.role),
        api.screenings.listByUser(user.id, user.role),
        api.messages.list(user.id)
      ];

      if (user.role !== 'parent') {
        promises.push(api.plans.list(user.id, user.role));
      }

      const results = await Promise.all(promises);
      
      const fetchedStudents = results[0] as Student[];
      const fetchedReports = results[1] as (ScreeningResult & { studentName: string })[];
      
      setStudents(fetchedStudents);
      setRecentReports(fetchedReports);
      setMessages(results[2] as Message[]);
      
      if (user.role !== 'parent') {
        setAllPlans(results[3] as (EducationPlan & { studentName?: string })[]);
      }

      // Generate AI Briefing if we have data
      if (fetchedReports.length > 0) {
        setBriefingLoading(true);
        const insights = await generateDashboardBriefing(fetchedReports, user.role);
        setAiInsights(insights);
        setBriefingLoading(false);
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
      if (result.success) setGeneratedLink(result.link);
    } catch (error) {
      alert("Hata oluştu.");
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
    const studentData: any = {
      name: studentFormData.name,
      age: Number(studentFormData.age),
      grade: studentFormData.grade,
      gender: studentFormData.gender,
      notes: studentFormData.notes
    };
    try {
      if (editingStudentId) await api.students.update(editingStudentId, studentData);
      else {
        if (user.role === 'parent') studentData.parentId = user.id;
        else studentData.teacherId = user.id;
        await api.students.add(studentData);
      }
      setShowAddModal(false);
      loadData();
    } catch (error) {
      alert("Hata oluştu.");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Silmek istediğinize emin misiniz?")) {
      await api.students.delete(id);
      loadData();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.messages.send({
      senderId: user.id,
      receiverId: user.role === 'parent' ? (students[0]?.teacherId || 'demo_teacher_1') : 'demo_parent_1',
      content: newMessage.content,
      senderName: user.name
    });
    setNewMessage({ ...newMessage, content: '' });
    loadData();
  };

  const handleArchiveReportView = (report: ScreeningResult) => {
    const student = students.find(s => s.id === report.studentId);
    onViewReport(report, student || { id: '?', name: report.studentName, age: 0, grade: '?' } as Student);
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
    const student = students.find(s => s.id === plan.studentId) || { id: plan.studentId, name: (plan as any).studentName, age: 0, grade: '?' } as Student;
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
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Dynamic Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${user.role === 'admin' ? 'bg-slate-900' : 'bg-indigo-600'} shadow-lg shadow-indigo-100`}>
               <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                MindScreen <span className="text-indigo-600">AI</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             <nav className="hidden lg:flex bg-gray-100/50 p-1 rounded-xl border border-gray-200">
                <button onClick={() => setActiveTab('overview')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                  ÖZET
                </button>
                {user.role !== 'parent' && (
                  <button onClick={() => setActiveTab('archive')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'archive' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                    ARŞİV
                  </button>
                )}
                {user.role !== 'parent' && (
                  <button onClick={() => setActiveTab('plan_archive')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'plan_archive' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                    BEP
                  </button>
                )}
                {user.role !== 'parent' && (
                  <button onClick={() => setActiveTab('analytics')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                    ANALİZ
                  </button>
                )}
                <button onClick={() => setActiveTab('messages')} className={`relative px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'messages' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}>
                  MESAJLAR
                  {messages.some(m => !m.isRead && m.receiverId === user.id) && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>}
                </button>
             </nav>

            <button onClick={onLogout} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        
        {activeTab === 'education_plan' && planTargetStudent && (
           <EducationPlanView 
             student={planTargetStudent} teacherId={user.id} screeningResult={planTargetScreening || undefined} preLoadedPlan={planToView || undefined}
             onBack={() => planToView ? setActiveTab('plan_archive') : setActiveTab('overview')} userRole={user.role}
           />
        )}

        {activeTab === 'plan_archive' && <PlanArchive plans={allPlans} onViewPlan={handleViewArchivedPlan} userRole={user.role} />}
        {activeTab === 'archive' && <ArchiveView reports={recentReports} onViewReport={handleArchiveReportView} userRole={user.role} />}
        {activeTab === 'analytics' && <AnalyticsView reports={recentReports} userRole={user.role} />}
        {activeTab === 'messages' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 h-[500px] md:h-[600px] animate-fade-in">
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                 <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Gelen Kutusu</h3>
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    {messages.length === 0 ? <div className="p-10 text-center text-gray-400 text-sm">Mesaj yok.</div> : messages.map(msg => (
                      <div key={msg.id} className={`p-5 border-b border-gray-100 cursor-pointer hover:bg-indigo-50/30 transition-all ${msg.senderId === user.id ? 'opacity-80' : ''}`}>
                         <div className="flex justify-between mb-1.5">
                            <span className="font-bold text-sm text-gray-900">{msg.senderId === user.id ? 'Siz' : msg.senderName}</span>
                            <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                         </div>
                         <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 md:p-8 flex flex-col shadow-sm">
                 <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-600" /> Mesaj Oluştur
                 </h3>
                 <textarea 
                    className="w-full flex-1 p-5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none bg-gray-50/50 text-gray-700"
                    placeholder="Mesajınızı buraya detaylıca yazın..."
                    value={newMessage.content}
                    onChange={e => setNewMessage({...newMessage, content: e.target.value})}
                 ></textarea>
                 <div className="mt-6 flex justify-end">
                    <button onClick={handleSendMessage} disabled={!newMessage.content} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-xl shadow-indigo-100 active:scale-95">
                      Gönder <Send className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* === TAB: OVERVIEW (BENTO GRID REDESIGN) === */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* 1. ROW: AI Briefing & Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               
               {/* AI Smart Briefing (8 cols) */}
               <div className="lg:col-span-8 bg-white rounded-[2rem] p-6 md:p-8 border border-gray-200 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Akıllı Brifing</h3>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Günün Özeti</p>
                      </div>
                    </div>
                    {briefingLoading && <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {aiInsights.length > 0 ? aiInsights.map((insight, idx) => (
                       <div key={idx} className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] cursor-default flex flex-col justify-between ${
                         insight.priority === 'high' ? 'bg-red-50/50 border-red-100' :
                         insight.priority === 'medium' ? 'bg-orange-50/50 border-orange-100' : 'bg-green-50/50 border-green-100'
                       }`}>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                               <div className={`w-2 h-2 rounded-full ${insight.priority === 'high' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                               <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">{insight.title}</h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-snug">{insight.content}</p>
                          </div>
                          {insight.actionLabel && (
                            <button className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:translate-x-1 transition-transform">
                               {insight.actionLabel} <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                       </div>
                     )) : (
                        <div className="col-span-3 py-6 text-center text-gray-400 italic text-sm border-2 border-dashed border-gray-100 rounded-2xl">
                           {!briefingLoading && "Henüz analiz edilecek veri bulunmuyor."}
                           {briefingLoading && "Yapay zeka verileri okuyor..."}
                        </div>
                     )}
                  </div>

                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:bg-purple-50 transition-colors duration-500"></div>
               </div>

               {/* Quick KPI (4 cols) */}
               <div className="lg:col-span-4 grid grid-rows-2 gap-4">
                  <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-xl">
                     <div className="flex justify-between items-start">
                        <Users className="w-6 h-6 text-indigo-400" />
                        <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-full text-indigo-300">AKTİF</span>
                     </div>
                     <div>
                        <h4 className="text-4xl font-black mb-1">{students.length}</h4>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Kayıtlı Öğrenci</p>
                     </div>
                  </div>
                  <div className="bg-indigo-600 rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-xl">
                     <div className="flex justify-between items-start">
                        <Activity className="w-6 h-6 text-indigo-200" />
                        <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-full">TOPLAM</span>
                     </div>
                     <div>
                        <h4 className="text-4xl font-black mb-1">{recentReports.length}</h4>
                        <p className="text-xs text-indigo-100 uppercase font-bold tracking-widest">Tamamlanan Analiz</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* 2. ROW: Main Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               
               {/* Quick Actions (3 cols) */}
               <div className="lg:col-span-3 space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2">Hızlı Aksiyonlar</h4>
                  <button onClick={openAddModal} className="w-full bg-white p-5 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                           <Plus className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-700">Yeni Öğrenci</span>
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                  <button onClick={() => setActiveTab('messages')} className="w-full bg-white p-5 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                           <Mail className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-700">Mesaj Gönder</span>
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100/50">
                     <h5 className="text-xs font-black text-indigo-900 mb-2 uppercase tracking-widest">Sistem Notu</h5>
                     <p className="text-xs text-indigo-600 leading-relaxed font-medium">Tarama sonuçları otomatik olarak en son bilimsel eşik değerlerine göre güncellenmektedir.</p>
                  </div>
               </div>

               {/* Recent Activity List (6 cols) */}
               <div className="lg:col-span-6 bg-white rounded-[2rem] border border-gray-200 shadow-sm flex flex-col min-w-0">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                     <h3 className="font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" /> Son Aktiviteler
                     </h3>
                     <button onClick={() => setActiveTab('archive')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Tümünü Gör</button>
                  </div>
                  <div className="p-2 flex-1 overflow-y-auto max-h-[400px]">
                     {recentReports.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm italic">Henüz bir kayıt bulunmuyor.</div>
                     ) : (
                        recentReports.slice(0, 6).map((report, idx) => (
                           <div key={report.id} className="group p-4 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-between mb-1">
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                                   report.totalScore >= 65 ? 'bg-red-50 text-red-600' :
                                   report.totalScore >= 35 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                 }`}>
                                    {report.totalScore}
                                 </div>
                                 <div>
                                    <h5 className="font-bold text-gray-900 text-sm">{report.studentName}</h5>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                                       {new Date(report.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 {user.role === 'teacher' && (
                                    <button 
                                      onClick={() => handleCreateEducationPlan(report)}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                      title="BEP Oluştur"
                                    >
                                       <Sparkles className="w-4 h-4" />
                                    </button>
                                 )}
                                 <button 
                                   onClick={() => handleArchiveReportView(report)}
                                   className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                 >
                                    <ChevronRight className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>

               {/* Right Sidebar Bento (3 cols) */}
               <div className="lg:col-span-3 space-y-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
                     <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Canlı Destek</h4>
                     </div>
                     <p className="text-sm font-bold text-gray-800 mb-2">Uzman Yanında</p>
                     <p className="text-xs text-gray-500 leading-relaxed mb-4">Kritik vakalar için bir uzman ile anında randevu oluşturabilirsiniz.</p>
                     <button className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95">
                        RANDEVU AL
                     </button>
                  </div>
                  
                  <div className="bg-indigo-900 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                     <h4 className="text-xl font-black mb-2 relative z-10">Premium<br/>Erişim</h4>
                     <p className="text-xs text-indigo-300 mb-4 relative z-10">Tüm kategorilerde sınırsız tarama ve detaylı PDF çıktıları.</p>
                     <div className="absolute -bottom-4 -right-4 bg-white/10 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                     <ArrowUpRight className="absolute top-4 right-4 w-5 h-5 text-indigo-400" />
                  </div>
               </div>

            </div>
          </div>
        )}
      </main>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-fade-in border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">
              {editingStudentId ? 'Bilgileri Güncelle' : 'Yeni Kayıt Oluştur'}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tam Adı</label>
                <input type="text" required className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium" value={studentFormData.name} onChange={e => setStudentFormData({...studentFormData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Yaşı</label>
                  <input type="number" required min="4" max="18" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium" value={studentFormData.age} onChange={e => setStudentFormData({...studentFormData, age: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sınıfı</label>
                  <select required className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium appearance-none" value={studentFormData.grade} onChange={e => setStudentFormData({...studentFormData, grade: e.target.value})}>
                    <option value="">Seç...</option>
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Notlar</label>
                <textarea rows={3} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium resize-none" placeholder="Eklemek istediğiniz kısa bilgiler..." value={studentFormData.notes} onChange={e => setStudentFormData({...studentFormData, notes: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-all">Vazgeç</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95">Tamamla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-fade-in relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                   <UserPlus className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Veli Daveti</h3>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">Sisteme davet ederek velinin de kendi gözlemlerini girmesini sağlayın.</p>

                {!generatedLink ? (
                  <form onSubmit={handleInviteParent} className="space-y-4">
                    <input type="email" required placeholder="Veli E-posta Adresi" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                    <button type="submit" disabled={inviteLoading} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2">
                      {inviteLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <LinkIcon className="w-5 h-5" />} Bağlantı Oluştur
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-5 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                       <input readOnly value={generatedLink} className="flex-1 bg-transparent text-sm font-bold text-green-800 outline-none truncate" />
                       <button onClick={handleCopyLink} className="p-2.5 bg-white rounded-xl shadow-sm hover:scale-110 transition-transform">
                          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                       </button>
                    </div>
                    <button onClick={() => setShowInviteModal(false)} className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">Pencereyi Kapat</button>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
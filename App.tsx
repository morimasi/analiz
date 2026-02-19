import React, { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import Dashboard from './components/Dashboard';
import Questionnaire from './components/Questionnaire';
import ResultDashboard from './components/ResultDashboard';
import { User, Student, ScreeningResult, UserProfile } from './types';
import { api } from './services/db';
import { calculateResults, AnswerValue } from './utils/scoring';
import { questions } from './data/questions';
import { Loader2 } from 'lucide-react';

type AppView = 'auth' | 'dashboard' | 'questionnaire' | 'result';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('auth');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [activeResult, setActiveResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const currentUser = await api.auth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setView('dashboard');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    // AuthView handles the API call, we just need to get the user state updated
    const currentUser = await api.auth.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setView('dashboard');
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
    setView('auth');
    setActiveStudent(null);
    setActiveResult(null);
  };

  const handleStartScreening = (student: Student) => {
    setActiveStudent(student);
    setActiveResult(null);
    setView('questionnaire');
  };

  const handleViewReport = (result: ScreeningResult, student: Student) => {
    setActiveResult(result);
    setActiveStudent(student);
    setView('result');
  };

  const handleCompleteScreening = async (answers: Record<string, AnswerValue>) => {
    if (!activeStudent || !user) return;

    const scoringProfile: UserProfile = {
      name: activeStudent.name,
      age: activeStudent.age,
      grade: activeStudent.grade,
      role: user.role
    };

    const calculatedResult = calculateResults(answers, questions, scoringProfile);
    
    // Save to DB (Async)
    setLoading(true);
    try {
        const savedResult = await api.screenings.save({
          ...calculatedResult,
          studentId: activeStudent.id,
          date: new Date().toISOString(),
          completedBy: user.role
        });
    
        setActiveResult(savedResult);
        setView('result');
    } catch(e) {
        alert("Sonuç kaydedilirken bir hata oluştu.");
    } finally {
        setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setActiveStudent(null);
    setActiveResult(null);
  };

  if (loading) {
     return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50">
             <Loader2 className="w-8 h-8 text-primary animate-spin" />
         </div>
     )
  }

  if (!user || view === 'auth') {
    return <AuthView onLogin={handleLogin} />;
  }

  const getProfileForComponents = (): UserProfile | null => {
    if (!activeStudent || !user) return null;
    return {
      name: activeStudent.name,
      age: activeStudent.age,
      grade: activeStudent.grade,
      role: user.role
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {view === 'dashboard' && (
        <Dashboard 
          user={user} 
          onLogout={handleLogout}
          onStartScreening={handleStartScreening}
          onViewReport={handleViewReport}
        />
      )}

      {view === 'questionnaire' && activeStudent && (
        <div className="pt-6">
           <div className="max-w-4xl mx-auto px-4 mb-4 flex justify-between items-center">
             <button 
               onClick={handleBackToDashboard}
               className="text-gray-500 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
             >
               &larr; Panale Dön
             </button>
             <span className="text-gray-400 text-xs uppercase tracking-wider font-bold">
               {activeStudent.name} için dolduruluyor
             </span>
           </div>
           <Questionnaire 
             profile={getProfileForComponents()!} 
             onComplete={handleCompleteScreening} 
           />
        </div>
      )}

      {view === 'result' && activeResult && activeStudent && (
        <div className="pt-6">
          <div className="max-w-5xl mx-auto px-4 mb-6 flex justify-between items-center no-print">
             <button 
               onClick={handleBackToDashboard}
               className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg transition"
             >
               &larr; Panale Dön
             </button>
          </div>
          <ResultDashboard 
            result={activeResult} 
            profile={getProfileForComponents()!} 
          />
        </div>
      )}
    </div>
  );
};

export default App;
import React, { useState, useMemo, useEffect } from 'react';
import { Question, UserProfile, EvaluationCategory, CATEGORY_LABELS } from '../types';
import { questions as allQuestions } from '../data/questions';
import { AnswerValue } from '../utils/scoring';
import { ChevronRight, CheckCircle2, Brain, BookOpen, PenTool, Calculator, MessageCircle, Move } from 'lucide-react';

interface QuestionnaireProps {
  profile: UserProfile;
  onComplete: (answers: Record<string, AnswerValue>) => void;
}

const CATEGORY_ICONS: Record<EvaluationCategory, React.ElementType> = {
  attention: Brain,
  reading: BookOpen,
  writing: PenTool,
  math: Calculator,
  language: MessageCircle,
  motor_spatial: Move,
};

const LIKERT_OPTIONS = [
  { value: 0, label: "Asla", color: "bg-green-50 text-green-700 border-green-200" },
  { value: 1, label: "Nadiren", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: 2, label: "Bazen", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: 3, label: "Sık Sık", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: 4, label: "Her Zaman", color: "bg-red-50 text-red-700 border-red-200" },
];

const Questionnaire: React.FC<QuestionnaireProps> = ({ profile, onComplete }) => {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => {
    const saved = localStorage.getItem('mindscreen_answers');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    localStorage.setItem('mindscreen_answers', JSON.stringify(answers));
  }, [answers]);

  const relevantQuestions = useMemo(() => {
    return allQuestions.filter(q => q.formType === 'both' || q.formType === profile.role);
  }, [profile.role]);

  const categories = useMemo(() => {
    const cats = new Set(relevantQuestions.map(q => q.category));
    return Array.from(cats) as EvaluationCategory[];
  }, [relevantQuestions]);

  const currentCategory = categories[currentCategoryIndex];
  const CurrentIcon = CATEGORY_ICONS[currentCategory];
  
  const currentQuestions = useMemo(() => {
    return relevantQuestions.filter(q => q.category === currentCategory);
  }, [relevantQuestions, currentCategory]);

  const handleAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const isStepComplete = currentQuestions.every(q => answers[q.id] !== undefined);

  const handleNext = () => {
    setAnimating(true);
    setTimeout(() => {
      if (currentCategoryIndex < categories.length - 1) {
        setCurrentCategoryIndex(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        onComplete(answers);
      }
      setAnimating(false);
    }, 300);
  };

  const progress = Math.round(((currentCategoryIndex) / categories.length) * 100);

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12">
      {/* Sticky Header - Mobile Optimized */}
      <div className="bg-white/90 backdrop-blur-lg rounded-b-2xl md:rounded-2xl p-4 md:p-6 shadow-sm mb-6 sticky top-0 md:top-4 z-30 border-b md:border border-indigo-50 transition-all duration-300">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-100 text-primary flex items-center justify-center shadow-inner flex-shrink-0">
              <CurrentIcon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-bold text-gray-800 tracking-tight truncate">{CATEGORY_LABELS[currentCategory]}</h2>
              <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wide">
                Adım {currentCategoryIndex + 1} / {categories.length}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
             <div className="text-xl md:text-2xl font-bold text-primary font-mono">{progress}%</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 md:h-2 w-full bg-gray-100 rounded-full overflow-hidden">
           <div 
             className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
             style={{ width: `${((currentCategoryIndex + 1) / categories.length) * 100}%` }}
           />
        </div>
      </div>

      {/* Questions List */}
      <div className={`space-y-4 md:space-y-6 px-4 md:px-0 transition-all duration-300 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        {currentQuestions.map((q, idx) => (
          <div 
            key={q.id} 
            className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="mb-4 md:mb-6">
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] md:text-xs font-bold rounded mb-2">Soru {idx + 1}</span>
              <p className="text-base md:text-xl font-medium text-gray-800 leading-relaxed">
                {q.text}
              </p>
            </div>
            
            <div className="grid grid-cols-5 gap-1.5 md:gap-4">
              {LIKERT_OPTIONS.map((opt) => {
                const isSelected = answers[q.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(q.id, opt.value as AnswerValue)}
                    className={`
                      relative group flex flex-col items-center justify-center py-3 px-1 md:p-3 rounded-lg md:rounded-xl transition-all duration-200 border-2 touch-manipulation
                      active:scale-95
                      ${isSelected 
                        ? `border-primary bg-primary text-white shadow-lg shadow-primary/30 transform scale-105 z-10` 
                        : `border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100`
                      }
                    `}
                  >
                    <span className={`text-lg md:text-2xl font-bold mb-0.5 md:mb-1 transition-colors leading-none ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>
                      {opt.value}
                    </span>
                    <span className={`text-[8px] md:text-xs font-bold uppercase tracking-tight text-center leading-none ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 md:mt-10 flex justify-end sticky bottom-4 md:bottom-6 z-20 px-4 md:px-0 pointer-events-none">
        <button
          onClick={handleNext}
          disabled={!isStepComplete}
          className={`
            pointer-events-auto
            flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all duration-300 shadow-xl
            ${isStepComplete 
              ? 'bg-primary text-white hover:bg-indigo-700 hover:scale-105 hover:shadow-2xl shadow-primary/30' 
              : 'bg-white text-gray-300 border border-gray-200 cursor-not-allowed'
            }
          `}
        >
          {currentCategoryIndex === categories.length - 1 ? 'Analizi Bitir' : 'Sonraki'}
          {currentCategoryIndex === categories.length - 1 ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />}
        </button>
      </div>
    </div>
  );
};

export default Questionnaire;
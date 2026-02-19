import { Question, Role, ScreeningResult, EvaluationCategory, CategoryScore, UserProfile, CATEGORY_LABELS } from '../types';

// 0: Asla, 1: Nadiren, 2: Bazen, 3: Sık Sık, 4: Her Zaman
export type AnswerValue = 0 | 1 | 2 | 3 | 4;

export const calculateResults = (
  answers: Record<string, AnswerValue>,
  questions: Question[],
  profile: UserProfile
): ScreeningResult => {
  
  const categories: EvaluationCategory[] = [
    'attention', 'reading', 'writing', 'math', 'language', 'motor_spatial'
  ];

  const resultScores: Record<EvaluationCategory, CategoryScore> = {} as any;
  let globalWeightedScore = 0;
  let globalMaxScore = 0;

  categories.forEach((cat) => {
    // Filter questions for this category and user role
    const catQuestions = questions.filter(
      (q) => q.category === cat && (q.formType === 'both' || q.formType === profile.role)
    );

    let currentScore = 0;
    let maxPossibleScore = 0;
    const findings: string[] = [];

    catQuestions.forEach((q) => {
      const answer = answers[q.id] || 0;
      
      // Weight Calculation: Answer * Weight
      const weightedPoints = answer * q.weight;
      const maxPoints = 4 * q.weight;

      currentScore += weightedPoints;
      maxPossibleScore += maxPoints;

      // Collect Critical Findings (If answer is 'Often' or 'Always')
      if (answer >= 3) {
        findings.push(q.text);
      }
    });

    // Normalize to 0-100
    const normalizedScore = maxPossibleScore > 0 
      ? Math.round((currentScore / maxPossibleScore) * 100) 
      : 0;

    globalWeightedScore += currentScore;
    globalMaxScore += maxPossibleScore;

    // Determine Risk Level
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    let riskLabel = 'Düşük Risk';

    if (normalizedScore >= 65) {
      riskLevel = 'high';
      riskLabel = 'Yüksek Risk';
    } else if (normalizedScore >= 35) {
      riskLevel = 'moderate';
      riskLabel = 'Orta Risk';
    }

    resultScores[cat] = {
      score: normalizedScore,
      riskLevel,
      riskLabel,
      findings
    };
  });

  const totalPercentage = globalMaxScore > 0 
    ? Math.round((globalWeightedScore / globalMaxScore) * 100) 
    : 0;

  return {
    totalScore: totalPercentage,
    studentName: profile.name,
    categoryScores: resultScores,
    date: new Date().toISOString(),
    completedBy: profile.role
  };
};
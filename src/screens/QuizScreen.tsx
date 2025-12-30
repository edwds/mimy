import React, { useState } from 'react';
import { AxisKey, UserProfile, Cluster } from '../types';
import { ApiService } from '../services/api';
import { UserService } from '../services/userService';
import { QUESTIONS, LIKERT_MAP, QUIZ_OPTIONS } from '../utils/constants';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

interface QuizScreenProps {
  user: UserProfile;
  onComplete: (profile: Record<AxisKey, number>, cluster: Cluster) => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ user, onComplete }) => {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [QUESTIONS[currentIdx].id]: value };
    setAnswers(newAnswers);
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      processResult(newAnswers);
    }
  };

  const processResult = async (finalAnswers: Record<number, number>) => {
    setLoading(true);

    // 계산 로직
    const axisSums: Record<AxisKey, number> = {
      boldness: 0, acidity: 0, richness: 0, experimental: 0, spiciness: 0, sweetness: 0, umami: 0
    };
    QUESTIONS.forEach(q => {
      axisSums[q.axis] += LIKERT_MAP[finalAnswers[q.id]] || 0;
    });
    const profile: Record<AxisKey, number> = {} as any;
    (Object.keys(axisSums) as AxisKey[]).forEach(key => {
      profile[key] = Math.round(axisSums[key] / 3);
    });

    // 클러스터 매칭
    try {
      const cluster = await ApiService.matchCluster(profile);

      // 결과 저장
      await UserService.saveQuizResult({
        email: user.email,
        profile,
        cluster,
        timestamp: new Date().toISOString()
      });

      setTimeout(() => {
        onComplete(profile, cluster);
      }, 1500);
    } catch (error) {
      console.error('Error matching cluster:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center fade-in py-24">
        <div className="relative w-24 h-24 mx-auto mb-10">
          <div
            className="absolute inset-0 border-[6px] rounded-full"
            style={{ borderColor: 'var(--color-primary-bg)' }}
          ></div>
          <div
            className="absolute inset-0 border-[6px] border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          ></div>
        </div>
        <h2
          className="text-2xl font-black mb-3 tracking-tight"
          style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-display)' }}
        >
          {t('quiz.analyzing')}
        </h2>
        <p
          className="font-medium"
          style={{ color: 'var(--color-text-sub)' }}
        >
          {t('quiz.analyzingSub')}
        </p>
      </div>
    );
  }

  const progress = (currentIdx / QUESTIONS.length) * 100;

  return (
    <div className="p-8 fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <span
            className="text-[10px] font-black uppercase tracking-widest mb-1"
            style={{ color: 'var(--color-primary)' }}
          >
            {t('quiz.dimension')}
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-main)' }}
          >
            {currentIdx + 1} <span style={{ color: 'var(--color-gray-300)', fontWeight: 400 }}>/ {QUESTIONS.length}</span>
          </span>
        </div>
        <div
          className="w-24 h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-gray-100)' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: 'var(--color-primary)' }}
          />
        </div>
      </div>
      <div className="mb-12 min-h-[120px] flex items-center">
        <h2
          className="text-2xl font-bold leading-[1.4] tracking-tight"
          style={{ color: 'var(--color-text-main)' }}
        >
          {t(`questions.${QUESTIONS[currentIdx].id}`)}
        </h2>
      </div>
      <div className="space-y-3">
        {QUIZ_OPTIONS.map((opt) => (
          <Button
            key={opt.val}
            onClick={() => handleAnswer(opt.val)}
            variant="outline"
            fullWidth
            className="justify-start px-6 py-4 text-left"
            style={{ color: 'var(--color-text-sub)' }}
          >
            {t(`quiz.options.${opt.key}`)}
          </Button>
        ))}
      </div>
    </div>
  );
};



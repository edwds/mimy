import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Cluster } from '../types';
import { Button } from '../components/ui/Button';

interface QuizResultScreenProps {
  cluster: Cluster;
  onClose: () => void;
}

export const QuizResultScreen: React.FC<QuizResultScreenProps> = ({ cluster, onClose }) => {
  return (
    <div className="p-10 fade-in py-16 flex flex-col items-center justify-center h-full">
      <div className="text-center space-y-6 w-full">
        <div
          className="inline-block p-3 rounded-full mb-3"
          style={{ backgroundColor: 'var(--color-primary-bg)' }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
        </div>

        <h1
          className="text-2xl font-black tracking-tight"
          style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-display)' }}
        >
          당신의 미식 타입
        </h1>

        <div
          className="text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden"
          style={{ backgroundColor: 'var(--color-text-main)' }}
        >
          <h2 className="text-2xl font-black mb-3 flex items-center justify-center gap-2">
            <span className="text-3xl">💡</span> {cluster.cluster_name}
          </h2>
          <p
            className="font-medium leading-relaxed text-sm text-center"
            style={{ color: 'var(--color-gray-300)' }}
          >
            "{cluster.cluster_tagline}"
          </p>
        </div>

        <Button
          onClick={onClose}
          fullWidth
          size="lg"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-white)' }}
        >
          확인
        </Button>
      </div>
    </div>
  );
};



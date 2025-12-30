import React from 'react';
import { Flame, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  const { t } = useTranslation();

  return (
    <div className="p-10 text-center fade-in py-16 flex flex-col items-center justify-center h-full">
      <div
        className="w-28 h-28 rounded-[2.5rem] flex items-center justify-center mb-10 rotate-3 shadow-xl"
        style={{
          backgroundColor: 'var(--color-primary-bg)',
          boxShadow: '0 20px 25px -5px rgba(255, 75, 43, 0.15), 0 8px 10px -6px rgba(255, 75, 43, 0.1)'
        }}
      >
        <Flame className="w-14 h-14" style={{ color: 'var(--color-primary)' }} />
      </div>
      <h1
        className="text-4xl font-black mb-4 tracking-tighter leading-tight"
        style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-display)' }}
      >
        mimy
      </h1>
      <p
        className="mb-12 leading-relaxed font-medium px-4 whitespace-pre-line"
        style={{ color: 'var(--color-text-sub)' }}
      >
        {t('splash.tagline')}
      </p>
      <Button
        onClick={onStart}
        size="lg"
        fullWidth
        className="max-w-[280px]"
      >
        {t('splash.startButton')} <ArrowRight className="w-6 h-6 ml-2" />
      </Button>
    </div>
  );
};


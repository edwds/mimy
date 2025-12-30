import React, { useState, useEffect } from 'react';
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { OnboardingFlow } from './screens/OnboardingFlow';
import { QuizScreen } from './screens/QuizScreen';
import { QuizResultScreen } from './screens/QuizResultScreen';
import { MainScreen } from './screens/MainScreen';
import { UserService } from './services/userService';
import { UserProfile, Cluster, AxisKey } from './types';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/ui/Layout';

type Step = 'splash' | 'login' | 'onboarding' | 'quiz' | 'quiz-result' | 'main';

export const App: React.FC = () => {
  const [step, setStep] = useState<Step>('splash');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [quizResult, setQuizResult] = useState<Cluster | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const sessionUser = await UserService.initUser();
        if (sessionUser) {
          setUser(sessionUser);
          // Check if onboarding is complete
          if (!sessionUser.birthDate || !sessionUser.gender) {
            setStep('onboarding');
          } else {
            // Check if quiz is complete
            const result = await UserService.getLatestResult(sessionUser.email);
            if (result && result.cluster) {
              setStep('main');
            } else {
              setStep('onboarding'); // Go back to onboarding/quiz flow
            }
          }
        } else {
          setStep('splash');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setStep('splash');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const handleStart = () => {
    setStep('login');
  };

  const handleLoginSuccess = async (loggedUser: UserProfile) => {
    setUser(loggedUser);
    if (!loggedUser.birthDate || !loggedUser.gender) {
      setStep('onboarding');
    } else {
      const result = await UserService.getLatestResult(loggedUser.email);
      if (result && result.cluster) {
        setStep('main');
      } else {
        setStep('onboarding');
      }
    }
  };

  const handleOnboardingComplete = () => {
    setStep('main');
  };

  const handleStartQuiz = () => {
    setStep('quiz');
  };

  const handleQuizComplete = (profile: Record<AxisKey, number>, cluster: Cluster) => {
    setQuizResult(cluster);
    setStep('quiz-result');
  };

  const handleQuizResultClose = () => {
    setStep('main');
  };

  const handleLogout = () => {
    UserService.logout();
    setUser(null);
    setStep('login');
  };

  const handleRetest = () => {
    setStep('quiz');
  };

  const handleUserUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return <div className="h-full w-full flex items-center justify-center bg-white">Loading...</div>;
  }

  return (
    <ToastProvider>
      <Layout>
        {step === 'splash' && <SplashScreen onStart={handleStart} />}
        {step === 'login' && <LoginScreen onLoginSuccess={handleLoginSuccess} onBack={() => setStep('splash')} />}
        {step === 'onboarding' && <OnboardingFlow onComplete={handleOnboardingComplete} onStartQuiz={handleStartQuiz} />}
        {step === 'quiz' && user && <QuizScreen user={user} onComplete={handleQuizComplete} />}
        {step === 'quiz-result' && quizResult && <QuizResultScreen cluster={quizResult} onClose={handleQuizResultClose} />}
        {step === 'main' && user && (
          <MainScreen
            user={user}
            onLogout={handleLogout}
            onRetest={handleRetest}
            onUserUpdate={handleUserUpdate}
          />
        )}
      </Layout>
    </ToastProvider>
  );
};


import React from 'react';
import { User } from 'lucide-react';
import { UserProfile } from '../types';
import { UserService } from '../services/userService';
import { Button } from '../components/ui/Button';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onBack: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack }) => {
  const { t } = useTranslation();

  const handleLoginSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        const decoded: any = jwtDecode(credentialResponse.credential);
        const { email, name, picture } = decoded;

        const user = await UserService.login(email, name, picture);
        onLoginSuccess(user);
      } catch (error) {
        console.error('Login process failed:', error);
      }
    }
  };

  const handleLoginError = () => {
    console.error('Google Login Failed');
  };

  return (
    <div className="p-10 text-center fade-in py-16 flex flex-col items-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-8 shadow-inner"
        style={{ backgroundColor: 'var(--color-primary-bg)' }}
      >
        <User className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
      </div>
      <h2
        className="text-2xl font-black mb-2 tracking-tight"
        style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-display)' }}
      >
        {t('login.title')}
      </h2>
      <p
        className="mb-10 font-medium"
        style={{ color: 'var(--color-text-sub)' }}
      >
        {t('login.subtitle')}
      </p>

      <div className="w-full flex justify-center mb-4">
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          useOneTap
          theme="outline"
          shape="pill"
          width="280"
        />
      </div>

      <Button
        onClick={onBack}
        variant="ghost"
        className="mt-2 underline underline-offset-4"
      >
        {t('login.later')}
      </Button>
    </div>
  );
};



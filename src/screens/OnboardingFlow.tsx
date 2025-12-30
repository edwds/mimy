import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, Flame } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TextArea } from '../components/ui/TextArea';
import { UserService } from '../services/userService';
import { ApiService } from '../services/api';
import { UserProfile, QuizResult } from '../types';

interface OnboardingFlowProps {
    onComplete: () => void;
    onStartQuiz: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onStartQuiz }) => {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState(1);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

    // Form states
    const [birthYear, setBirthYear] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthDay, setBirthDay] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'private'>('private');
    const [nickname, setNickname] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=default');
    const [isSaving, setIsSaving] = useState(false);
    const [nicknameError, setNicknameError] = useState<string | null>(null);

    useEffect(() => {
        const u = UserService.getUser();
        if (u) {
            setUser(u);
            setNickname(u.nickname || '');
            setBio(u.bio || '');
            setProfileImage(u.profileImage || u.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default');

            if (u.birthDate) {
                const parts = u.birthDate.split('.');
                if (parts.length === 3) {
                    setBirthYear(parts[0]);
                    setBirthMonth(parts[1]);
                    setBirthDay(parts[2]);
                }
            }
            setGender((u.gender as 'male' | 'female' | 'private') || 'private');
        }
    }, []);

    const handleNext = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else if (step === 3) {
            if (!nickname.trim() || nicknameError) return;
            setStep(4);
        } else if (step === 4) {
            setIsSaving(true);
            try {
                if (user) {
                    const combinedBirthDate = birthYear && birthMonth && birthDay
                        ? `${birthYear}.${birthMonth.padStart(2, '0')}.${birthDay.padStart(2, '0')}`
                        : '';
                    const updatedUser: UserProfile = {
                        ...user,
                        nickname,
                        bio,
                        profileImage,
                        birthDate: combinedBirthDate,
                        gender
                    };
                    await UserService.saveUser(updatedUser);
                }
                setStep(5);
            } catch (error) {
                console.error('Failed to save user:', error);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const validateNickname = (name: string): boolean => {
        const regex = /^[a-zA-Z0-9._-]+$/;
        if (name && !regex.test(name)) {
            setNicknameError(t('profileEdit.validation.invalid'));
            return false;
        }
        setNicknameError(null);
        return true;
    };

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNickname(value);
        validateNickname(value);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSkipQuiz = async () => {
        try {
            const result = await UserService.getLatestResult(user?.email || '');
            if (result) {
                setQuizResult(result);
                setStep(6);
            } else {
                onComplete();
            }
        } catch (e) {
            onComplete();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const imageUrl = await ApiService.uploadImage(file);
            setProfileImage(imageUrl);
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const renderHeader = (titleKey: string, subtitleKey: string) => (
        <div className="text-center mb-10">
            <h2
                className="text-2xl font-black mb-2 tracking-tight"
                style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-family-display)' }}
            >
                {t(titleKey)}
            </h2>
            <p
                className="text-sm"
                style={{ color: 'var(--color-text-sub)' }}
            >
                {t(subtitleKey)}
            </p>
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="flex-1 flex flex-col items-center justify-center text-center fade-in px-4">
                        <div
                            className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-10 rotate-3 shadow-xl"
                            style={{
                                backgroundColor: 'var(--color-primary-bg)',
                                boxShadow: '0 20px 25px -5px rgba(255, 75, 43, 0.15), 0 8px 10px -6px rgba(255, 75, 43, 0.1)'
                            }}
                        >
                            <Flame className="w-12 h-12" style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <h1 className="text-4xl font-black mb-4 tracking-tighter leading-tight" style={{ fontFamily: 'var(--font-family-display)' }}>
                            mimy
                        </h1>
                        <p className="text-base font-medium text-gray-500 mb-12 leading-relaxed whitespace-pre-wrap px-4">
                            {t('onboarding.welcome.subtitle')}
                        </p>
                        <Button onClick={handleNext} fullWidth size="lg" className="max-w-[280px]">
                            {t('onboarding.welcome.next')}
                        </Button>
                    </div>
                );
            case 2:
                return (
                    <div className="flex-1 flex flex-col fade-in">
                        {renderHeader('onboarding.demographics.title', 'onboarding.demographics.subtitle')}
                        <div className="space-y-8 flex-1">
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-3">
                                    {t('onboarding.demographics.birthDateLabel')}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {i18n.language === 'ko' ? (
                                        <>
                                            <div className="flex items-center gap-1">
                                                <select
                                                    className="flex-1 bg-gray-50 border-none rounded-xl px-2 py-3 outline-none text-lg"
                                                    value={birthYear}
                                                    onChange={(e) => setBirthYear(e.target.value)}
                                                >
                                                    <option value="">{t('onboarding.demographics.birthDateYear')}</option>
                                                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                                <span className="text-sm text-gray-400 font-bold">{t('onboarding.demographics.birthDateYear')}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <select
                                                    className="flex-1 bg-gray-50 border-none rounded-xl px-2 py-3 outline-none text-lg"
                                                    value={birthMonth}
                                                    onChange={(e) => setBirthMonth(e.target.value)}
                                                >
                                                    <option value="">{t('onboarding.demographics.birthDateMonth')}</option>
                                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                                <span className="text-sm text-gray-400 font-bold">{t('onboarding.demographics.birthDateMonth')}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <select
                                                    className="flex-1 bg-gray-50 border-none rounded-xl px-2 py-3 outline-none text-lg"
                                                    value={birthDay}
                                                    onChange={(e) => setBirthDay(e.target.value)}
                                                >
                                                    <option value="">{t('onboarding.demographics.birthDateDay')}</option>
                                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                                <span className="text-sm text-gray-400 font-bold">{t('onboarding.demographics.birthDateDay')}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <select
                                                className="bg-gray-50 border-none rounded-xl px-3 py-3 outline-none text-lg"
                                                value={birthMonth}
                                                onChange={(e) => setBirthMonth(e.target.value)}
                                            >
                                                <option value="">{t('onboarding.demographics.birthDateMonth')}</option>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="bg-gray-50 border-none rounded-xl px-3 py-3 outline-none text-lg"
                                                value={birthDay}
                                                onChange={(e) => setBirthDay(e.target.value)}
                                            >
                                                <option value="">{t('onboarding.demographics.birthDateDay')}</option>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="bg-gray-50 border-none rounded-xl px-3 py-3 outline-none text-lg"
                                                value={birthYear}
                                                onChange={(e) => setBirthYear(e.target.value)}
                                            >
                                                <option value="">{t('onboarding.demographics.birthDateYear')}</option>
                                                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-3">
                                    {t('onboarding.demographics.genderLabel')}
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['male', 'female', 'private'] as const).map((g) => (
                                        <button
                                            key={g}
                                            className={`py-3 rounded-xl text-sm font-medium transition-all ${gender === g
                                                ? 'bg-black text-white shadow-md'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}
                                            onClick={() => setGender(g)}
                                        >
                                            {t(`onboarding.demographics.gender.${g}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={handleNext}
                            disabled={!birthYear || !birthMonth || !birthDay}
                            fullWidth
                            size="lg"
                            className="mt-auto"
                        >
                            {t('onboarding.demographics.next')}
                        </Button>
                    </div>
                );
            case 3:
                return (
                    <div className="flex-1 flex flex-col fade-in">
                        {renderHeader('onboarding.nickname.title', 'onboarding.nickname.subtitle')}
                        <div className="flex-1 space-y-1.5">
                            <Input
                                placeholder={t('onboarding.nickname.placeholder')}
                                value={nickname}
                                onChange={handleNicknameChange}
                                maxLength={30}
                                error={nicknameError || undefined}
                            />
                            <p className="mt-2 text-xs text-right text-gray-400">
                                {nickname.length}/30
                            </p>
                        </div>
                        <Button
                            onClick={handleNext}
                            disabled={!nickname.trim() || !!nicknameError}
                            fullWidth
                            size="lg"
                            className="mt-auto"
                        >
                            {t('onboarding.nickname.next')}
                        </Button>
                    </div>
                );
            case 4:
                return (
                    <div className="flex-1 flex flex-col fade-in">
                        {renderHeader('onboarding.profile.title', 'onboarding.profile.subtitle')}
                        <div className="space-y-8 flex-1">
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <img
                                        src={profileImage}
                                        alt="Profile"
                                        className="w-32 h-32 rounded-full border-4 shadow-lg object-cover"
                                        style={{ borderColor: 'var(--color-gray-200)' }}
                                    />
                                    <label
                                        className="absolute bottom-0 right-0 text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg"
                                        style={{ backgroundColor: 'var(--color-primary)' }}
                                    >
                                        <Upload className="w-4 h-4" />
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                </div>
                            </div>
                            <TextArea
                                label={t('onboarding.profile.bioLabel')}
                                placeholder={t('onboarding.profile.bioPlaceholder')}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <Button onClick={handleNext} fullWidth size="lg" className="mt-auto" disabled={isSaving}>
                            {isSaving ? '...' : t('onboarding.profile.next')}
                        </Button>
                    </div>
                );
            case 5:
                return (
                    <div className="flex-1 flex flex-col items-center justify-center text-center fade-in">
                        <div className="text-6xl mb-6">🧪</div>
                        <h2 className="text-2xl font-black mb-4 tracking-tight" style={{ fontFamily: 'var(--font-family-display)' }}>
                            {t('onboarding.quizInquiry.title')}
                        </h2>
                        <p className="text-base text-gray-500 mb-10 leading-relaxed whitespace-pre-wrap">
                            {t('onboarding.quizInquiry.subtitle')}
                        </p>
                        <div className="space-y-3 w-full">
                            <Button onClick={onStartQuiz} fullWidth size="lg">
                                {t('onboarding.quizInquiry.confirm')}
                            </Button>
                            <Button variant="ghost" onClick={handleSkipQuiz} fullWidth>
                                {t('onboarding.quizInquiry.skip')}
                            </Button>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="flex-1 flex flex-col items-center justify-center text-center fade-in">
                        <div className="text-6xl mb-6">✨</div>
                        <h2 className="text-2xl font-black mb-4 tracking-tight" style={{ fontFamily: 'var(--font-family-display)' }}>
                            {t('onboarding.result.welcome', { name: nickname })}
                        </h2>
                        <div className="w-full bg-gray-50 p-8 rounded-2xl mb-8 border border-gray-100 shadow-inner">
                            <p className="text-xl font-bold text-black leading-tight">
                                {t('onboarding.result.tasteResult', {
                                    taste: quizResult?.cluster?.cluster_name || '???'
                                })}
                            </p>
                        </div>
                        <p className="text-sm text-gray-400 mb-10">
                            {t('onboarding.result.description')}
                        </p>
                        <Button onClick={onComplete} fullWidth size="lg">
                            {t('onboarding.result.finish')}
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Progress Bar */}
            <div className="h-1 w-full bg-gray-100">
                <div
                    className="h-full bg-black transition-all duration-500 ease-out"
                    style={{ width: `${(step / 6) * 100}%` }}
                ></div>
            </div>

            <div className="p-10 flex-1 flex flex-col py-16 overflow-y-auto scrollbar-hide relative">
                {step > 1 && step < 6 && (
                    <Button
                        onClick={handleBack}
                        variant="ghost"
                        className="mb-4 -ml-6"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 'var(--font-bold)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            border: 'none',
                            backgroundColor: 'transparent',
                            padding: 'var(--spacing-3) var(--spacing-6)',
                            fontSize: 'var(--text-base)',
                            color: 'var(--color-text-sub)'
                        }}
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                    </Button>
                )}
                {renderStep()}
            </div>
        </div>
    );
};

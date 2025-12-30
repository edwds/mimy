import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageDebugToggle: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLang = i18n.language;

    return (
        <div className="hidden sm:flex fixed top-4 right-4 z-[9999] gap-2 bg-black/80 p-2 rounded-full backdrop-blur-sm shadow-lg border border-white/10">
            <button
                onClick={() => changeLanguage('cimode')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${currentLang === 'cimode'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
            >
                Code
            </button>
            <div className="w-[1px] h-4 bg-white/20 self-center mx-1" />
            <button
                onClick={() => changeLanguage('ko')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${currentLang === 'ko'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
            >
                KO
            </button>
            <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${currentLang === 'en'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
            >
                EN
            </button>
        </div>
    );
};

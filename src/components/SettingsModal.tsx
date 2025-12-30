import React, { useState } from 'react';
import { LogOut, RotateCcw, X, ChevronRight, Eye, ChevronLeft, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { ApiService } from '../services/api';

interface SettingsModalProps {
    user: UserProfile;
    onClose: () => void;
    onLogout: () => void;
    onRetest: () => void;
    onUpdate: (updatedUser: UserProfile) => void;
}

type SettingsView = 'main' | 'visibility';

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onLogout, onRetest, onUpdate }) => {
    const { t } = useTranslation();
    const [view, setView] = useState<SettingsView>('main');

    const renderMainView = () => (
        <div className="p-4 space-y-2">
            <button
                onClick={() => setView('visibility')}
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] rounded-2xl transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Eye className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-900">{t('profile.rankingSettings')}</p>
                        <p className="text-xs text-blue-500">
                            {user.defaultRankingVisibility === 'public'
                                ? t('profileEdit.visibility.publicDetail')
                                : user.defaultRankingVisibility === 'partial'
                                    ? t('profileEdit.visibility.partialDetail', { limit: user.rankingVisibilityLimit })
                                    : t('profileEdit.visibility.private')}
                        </p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-200 group-hover:text-blue-300 group-hover:translate-x-1 transition-all" />
            </button>

            <button
                onClick={() => {
                    onRetest();
                    onClose();
                }}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] rounded-2xl transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <RotateCcw className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-900">{t('settings.retest.title')}</p>
                        <p className="text-xs text-gray-500">{t('settings.retest.subtitle')}</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
            </button>

            <button
                onClick={() => {
                    onLogout();
                    onClose();
                }}
                className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 active:scale-[0.98] rounded-2xl transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                        <LogOut className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-red-600">{t('settings.logout.title')}</p>
                        <p className="text-xs text-red-400">{t('settings.logout.subtitle')}</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-200 group-hover:text-red-300 group-hover:translate-x-1 transition-all" />
            </button>
        </div>
    );

    const updateVisibilityLimit = async (limit: number) => {
        const cappedLimit = Math.min(Math.max(1, limit), 99);
        try {
            const updated = await ApiService.updateUser(user.id!, { rankingVisibilityLimit: cappedLimit });
            onUpdate(updated);
        } catch (err) {
            console.error('Failed to update limit:', err);
        }
    };

    const renderVisibilityDetail = () => (
        <div className="p-6 space-y-6">
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        {(['private', 'public', 'partial'] as const).map((v) => (
                            <button
                                key={v}
                                onClick={async () => {
                                    try {
                                        const updated = await ApiService.updateUser(user.id!, {
                                            defaultRankingVisibility: v,
                                            // Initialize limit if selecting partial for the first time
                                            ...(v === 'partial' && !user.rankingVisibilityLimit ? { rankingVisibilityLimit: 10 } : {})
                                        });
                                        onUpdate(updated);
                                    } catch (err) {
                                        console.error('Failed to update visibility:', err);
                                    }
                                }}
                                className={`flex items-center justify-between p-4 px-6 rounded-2xl border-2 transition-all active:scale-[0.98] ${user.defaultRankingVisibility === v
                                    ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white'
                                    : 'bg-white border-gray-100 hover:border-gray-200 text-gray-900'
                                    }`}
                            >
                                <div className="text-left">
                                    <p className="font-black text-base">
                                        {v === 'public'
                                            ? t('profileEdit.visibility.publicDetail')
                                            : t(`profileEdit.visibility.${v}`)}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {user.defaultRankingVisibility === 'partial' && (
                        <div className="bg-gray-50 rounded-[2rem] p-6 border-2 border-primary/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col gap-4">
                                <label className="text-[11px] font-black text-primary/60 uppercase tracking-wider px-1">
                                    {t('profileEdit.visibility.partialDetail', { limit: '' }).replace('{{limit}}', '').trim()}
                                </label>
                                <div className="flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
                                    <button
                                        onClick={() => updateVisibilityLimit((user.rankingVisibilityLimit || 10) - 1)}
                                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-90 transition-all text-gray-600"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>

                                    <div className="flex-1 flex items-center justify-center gap-2">
                                        <input
                                            type="number"
                                            value={user.rankingVisibilityLimit || ''}
                                            onChange={(e) => {
                                                const val = e.target.value ? parseInt(e.target.value) : 1;
                                                updateVisibilityLimit(val);
                                            }}
                                            className="w-16 bg-transparent border-none text-center text-2xl font-black text-gray-900 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="text-lg font-bold text-gray-400">{t('profileEdit.visibility.limitSuffix')}</span>
                                    </div>

                                    <button
                                        onClick={() => updateVisibilityLimit((user.rankingVisibilityLimit || 10) + 1)}
                                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-90 transition-all text-gray-600"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 leading-relaxed px-2 text-center">
                                {t('profileEdit.visibility.description')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[50] flex items-end justify-center sm:items-center p-0 sm bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        {view === 'visibility' && (
                            <button onClick={() => setView('main')} className="p-1 -ml-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <ChevronLeft className="w-6 h-6 text-gray-700" />
                            </button>
                        )}
                        <h3 className="text-xl font-black">
                            {view === 'main' ? t('settings.title') : t('profile.rankingSettings')}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {view === 'main' ? renderMainView() : renderVisibilityDetail()}
                </div>

                {view === 'main' && (
                    <div className="p-6 text-center text-[10px] text-gray-300 font-medium tracking-widest uppercase shrink-0">
                        Mimy v1.0.0
                    </div>
                )}
            </div>
        </div>
    );
};

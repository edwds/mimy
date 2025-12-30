import React from 'react';
import { useTranslation } from 'react-i18next';

export const LeaderboardTab: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="text-center py-20">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-main)' }}>
                {t('main.leaderboard')}
            </h2>
            <p className="mt-2" style={{ color: 'var(--color-text-sub)' }}>
                {t('main.leaderboardPreparing')}
            </p>
        </div>
    );
};

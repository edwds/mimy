import React, { useEffect, useState } from 'react';
import { Home, Compass, Trophy, User, Plus } from 'lucide-react';
import { UserProfile, QuizResult } from '../types';
import { UserService } from '../services/userService';

import { HomeTab } from './main/HomeTab';
import { DiscoveryTab } from './main/DiscoveryTab';
import { LeaderboardTab } from './main/LeaderboardTab';
import { ProfileTab } from './main/ProfileTab';
import { ReviewFlow } from '../components/ReviewFlow';
import { SearchScreen } from './SearchScreen';

interface MainScreenProps {
  user: UserProfile;
  onLogout: () => void;
  onRetest: () => void;
  onUserUpdate: (user: UserProfile) => void;
}

type TabKey = 'home' | 'discovery' | 'leaderboard' | 'profile';

export const MainScreen: React.FC<MainScreenProps> = ({ user, onLogout, onRetest, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReviewFlow, setShowReviewFlow] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const fetchLatestResult = async () => {
      const latestResult = await UserService.getLatestResult(user.email);
      if (latestResult && !latestResult.cluster) setResult(null);
      else setResult(latestResult);
    };
    fetchLatestResult();
  }, [user.email]);

  const TabButton = ({
    tab,
    icon: Icon,
    label,
  }: {
    tab: TabKey;
    icon: any;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className="flex flex-col items-center gap-1 transition-all select-none"
      style={{
        color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-gray-300)',
        transform: activeTab === tab ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden w-full"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {/* Content Area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: 'calc(8.5rem + env(safe-area-inset-bottom))',
        }}
      >
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'discovery' && (
          <DiscoveryTab
            user={user}
            onSearchRequested={() => setShowSearch(true)}
          />
        )}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            result={result}
            onLogout={onLogout}
            onRetest={onRetest}
            onUserUpdate={onUserUpdate}
            refreshKey={refreshKey}
          />
        )}
      </div>

      {/* Bottom Tabs */}
      <div
        className="absolute left-0 right-0 border-t px-4 pt-4 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]"
        style={{
          bottom: 0,
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-gray-100)',
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex-1 flex justify-around">
          <TabButton tab="home" icon={Home} label="홈" />
          <TabButton tab="discovery" icon={Compass} label="탐색" />
        </div>

        <div className="px-4 -mt-12">
          <button
            onClick={() => setShowReviewFlow(true)}
            className="w-16 h-16 rounded-[1.8rem] bg-black text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
            style={{
              backgroundColor: 'var(--color-primary, #000)',
            }}
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 flex justify-around">
          <TabButton tab="leaderboard" icon={Trophy} label="리더보드" />
          <TabButton tab="profile" icon={User} label="마이페이지" />
        </div>
      </div>

      {showReviewFlow && (
        <ReviewFlow
          user={user}
          onClose={() => setShowReviewFlow(false)}
          onComplete={() => {
            setShowReviewFlow(false);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {showSearch && (
        <SearchScreen
          user={user}
          onBack={() => setShowSearch(false)}
        />
      )}
    </div>
  );
};

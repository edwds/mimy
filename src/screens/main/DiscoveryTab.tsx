import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShopService } from '../../services/shopService';
import { Shop, UserProfile } from '../../types';
import { Search } from 'lucide-react';
import { ShopCard } from '../../components/ShopCard';

interface DiscoveryTabProps {
    user: UserProfile;
    onSearchRequested: () => void;
}

export const DiscoveryTab: React.FC<DiscoveryTabProps> = ({ user, onSearchRequested }) => {
    const { t } = useTranslation();
    const [shops, setShops] = useState<Shop[]>([]);
    const [myListIds, setMyListIds] = useState<Set<string | number>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [exploreData, myListData] = await Promise.all([
                ShopService.getExploreShops(),
                user ? ShopService.getMyList(user.email) : Promise.resolve([])
            ]);
            setShops(exploreData);
            setMyListIds(new Set(myListData.map((item: any) => item.id)));
        } catch (error) {
            console.error('Failed to load discovery data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMyList = async (shop: Shop) => {
        if (!user) return;

        try {
            if (myListIds.has(shop.id)) {
                await ShopService.removeFromMyList(user.email, shop.id);
                setMyListIds(prev => {
                    const next = new Set(prev);
                    next.delete(shop.id);
                    return next;
                });
            } else {
                await ShopService.addToMyList(user.email, shop.id);
                setMyListIds(prev => {
                    const next = new Set(prev);
                    next.add(shop.id);
                    return next;
                });
            }
        } catch (error) {
            console.error('Failed to toggle MyList:', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">{t('discovery.loading')}</div>;

    return (
        <div className="pb-20">
            <div className="space-y-8 px-6 py-8">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-2xl font-black" style={{ color: 'var(--color-text-main)' }}>
                        {t('discovery.todayPick')}
                    </h2>
                    <button
                        onClick={onSearchRequested}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <Search size={22} className="text-gray-600" />
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    {shops.map((shop) => (
                        <ShopCard
                            key={shop.id}
                            shop={shop}
                            isBookmarked={myListIds.has(shop.id)}
                            onBookmarkToggle={toggleMyList}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

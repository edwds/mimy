import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search as SearchIcon, MapPin, CircleDollarSign, X, Bookmark } from 'lucide-react';
import { ShopService } from '../services/shopService';
import { Shop, UserProfile } from '../types';
import { getLocalizedShopName, getLocalizedShopDetail } from '../utils/i18nUtils';
import { ShopCard } from '../components/ShopCard';

interface SearchScreenProps {
    user: UserProfile;
    onBack: () => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ user, onBack }) => {
    const { t, i18n } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Shop[]>([]);
    const [myListIds, setMyListIds] = useState<Set<string | number>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            ShopService.getMyList(user.email).then(data => {
                setMyListIds(new Set(data.map((item: any) => item.id)));
            });
        }
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const data = await ShopService.searchShops(query);
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
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

    return (
        <div className="absolute inset-0 z-50 bg-[var(--color-surface)] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 flex items-center gap-3 border-b border-[var(--color-gray-100)] bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-all active:scale-95"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                        <SearchIcon size={18} />
                    </div>
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('discovery.searchPlaceholder')}
                        className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-11 pr-11 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute inset-y-0 right-3 px-2 flex items-center text-gray-400 hover:text-primary transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                {loading ? (
                    <div className="py-20 text-center text-gray-400 font-medium">
                        {t('discovery.loading')}
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {results.map((shop) => (
                            <ShopCard
                                key={shop.id}
                                shop={shop}
                                isBookmarked={myListIds.has(shop.id)}
                                onBookmarkToggle={toggleMyList}
                            />
                        ))}
                    </div>
                ) : query.trim() ? (
                    <div className="py-20 text-center text-gray-400 font-medium">
                        {t('discovery.noResults')}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <SearchIcon size={32} />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">
                            {t('write.search.guide')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

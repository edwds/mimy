import React, { useState, useEffect } from 'react';
import { Settings2, Menu, Pencil, MapPin } from 'lucide-react';
import { UserProfile, QuizResult, Review, Shop } from '../../types';
import { ApiService } from '../../services/api';
import { ProfileEditModal } from '../../components/ProfileEditModal';
import { SettingsModal } from '../../components/SettingsModal';
import { ReviewFlow } from '../../components/ReviewFlow';
import { ReviewCard } from '../../components/ReviewCard';
import { ReviewService } from '../../services/reviewService';
import { ShopService } from '../../services/shopService';
import { useTranslation } from 'react-i18next';
import { getLocalizedShopName, getLocalizedShopDetail } from '../../utils/i18nUtils';
import { CircleDollarSign } from 'lucide-react';
import { ShopCard } from '../../components/ShopCard';
import { CommentModal } from '../../components/CommentModal';

interface ProfileTabProps {
    user: UserProfile;
    result: QuizResult | null;
    onLogout: () => void;
    onRetest: () => void;
    onUserUpdate: (updatedUser: UserProfile) => void;
    refreshKey?: number;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ user, result, onLogout, onRetest, onUserUpdate, refreshKey }) => {
    const { t, i18n } = useTranslation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [myList, setMyList] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [activeTab, setActiveTab] = useState<'reviews' | 'mylist'>('reviews');
    const [keywordMap, setKeywordMap] = useState<Record<string, string>>({});
    const [activeCommentReview, setActiveCommentReview] = useState<Review | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'reviews') {
                const [reviewsData, keywordsData] = await Promise.all([
                    ReviewService.getReviews(user.email, user.id),
                    ReviewService.getKeywords()
                ]);
                setReviews(reviewsData);

                const map: Record<string, string> = {};
                keywordsData.forEach(k => map[k.code] = k.text);
                setKeywordMap(map);
            } else {
                const data = await ShopService.getMyList(user.email);
                setMyList(data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLikeToggle = async (reviewId: string | number, isLiked: boolean) => {
        if (!user?.id) return;
        try {
            const res = await ApiService.toggleLike(reviewId, user.id);
            setReviews(prev => prev.map(r => {
                if (String(r.id) === String(reviewId)) {
                    return { ...r, isLiked: res.liked, likeCount: res.count };
                }
                return r;
            }));
        } catch (e) {
            console.error('Like error', e);
        }
    };

    const handleCommentAdded = (reviewId: string | number, newCount: number) => {
        setReviews(prev => prev.map(r => {
            if (String(r.id) === String(reviewId)) {
                return { ...r, commentCount: newCount };
            }
            return r;
        }));
    };

    useEffect(() => {
        fetchData();
    }, [user.email, user.id, activeTab, refreshKey]);

    return (
        <div className="space-y-8 px-6 py-8">
            {/* 상단 프로필 섹션 */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-6">
                    <div className="relative shrink-0 cursor-pointer group" onClick={() => setIsEditModalOpen(true)}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-orange-400 rounded-full -m-1 blur-[2px] opacity-20 animate-pulse group-hover:opacity-40 transition-opacity" />
                        <img
                            src={user.profileImage || user.photo}
                            className="w-20 h-20 rounded-full border-2 border-white relative z-10 object-cover"
                            alt="Profile"
                            style={{ backgroundColor: 'var(--color-gray-100)' }}
                        />
                        <div className="absolute bottom-0 right-0 z-20 bg-white rounded-full p-1.5 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                            <Settings2 className="w-3 h-3 text-gray-500" />
                        </div>
                    </div>

                    <div className="space-y-1.5 py-1 flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black tracking-tighter" style={{ color: 'var(--color-text-main)' }}>
                                {user.nickname || user.name}
                            </h2>
                        </div>
                        {user.bio ? (
                            <p className="text-sm leading-snug font-medium line-clamp-2" style={{ color: 'var(--color-text-sub)' }}>
                                {user.bio}
                            </p>
                        ) : (
                            <p className="text-sm italic opacity-40" style={{ color: 'var(--color-text-sub)' }}>
                                {t('main.profile.defaultBio')}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="p-2 transition-all hover:scale-110 active:scale-95"
                    style={{ color: 'var(--color-gray-300)' }}
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* 입맛 정보 카드 */}
            {result?.cluster && (
                <div
                    className="rounded-[2.0rem] p-6 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-text-main) 0%, #1e293b 100%)',
                        color: 'var(--color-white)',
                    }}
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[80px] opacity-20 -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400 rounded-full blur-[40px] opacity-10 -ml-10 -mb-10" />

                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="space-y-1">
                            <h4 className="text-xl font-black tracking-tight leading-tight">
                                {result.cluster.cluster_name}
                            </h4>
                            <p className="text-sm font-medium leading-relaxed opacity-80" style={{ fontFamily: 'var(--font-family-display)' }}>
                                {result.cluster.cluster_tagline}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 탭 네비게이션 */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'reviews' ? 'text-gray-900' : 'text-gray-400'}`}
                >
                    {t('myPage.tabs.reviews')}
                    {activeTab === 'reviews' && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-0.5 bg-gray-900 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('mylist')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'mylist' ? 'text-gray-900' : 'text-gray-400'}`}
                >
                    {t('myPage.tabs.mylist')}
                    {activeTab === 'mylist' && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-0.5 bg-gray-900 rounded-full" />
                    )}
                </button>
            </div>

            <div className="space-y-4">
                {activeTab === 'reviews' && (
                    <>
                        {isLoading ? (
                            <div className="py-10 text-center text-gray-400 animate-pulse font-bold">{t('myPage.reviews.loading')}</div>
                        ) : reviews.length === 0 ? (
                            <div className="py-20 text-center space-y-2">
                                <div className="text-4xl">🍽️</div>
                                <p className="text-sm font-bold text-gray-400 whitespace-pre-line">{t('myPage.reviews.empty')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {reviews.map((review) => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        user={user}
                                        keywordMap={keywordMap}
                                        onEdit={() => setEditingReview(review)}
                                        onLikeToggle={(liked) => handleLikeToggle(review.id, liked)}
                                        onCommentClick={() => setActiveCommentReview(review)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'mylist' && (
                    <>
                        {isLoading ? (
                            <div className="py-10 text-center text-gray-400 animate-pulse font-bold">{t('myPage.mylist.loading')}</div>
                        ) : myList.length === 0 ? (
                            <div className="py-20 text-center space-y-2">
                                <div className="text-4xl">🔖</div>
                                <p className="text-sm font-bold text-gray-400 whitespace-pre-line">{t('myPage.mylist.empty')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {myList.map((shop) => (
                                    <ShopCard
                                        key={shop.id}
                                        shop={shop}
                                        isBookmarked={true}
                                        onBookmarkToggle={async () => {
                                            try {
                                                await ShopService.removeFromMyList(user.email, shop.id);
                                                setMyList(prev => prev.filter(item => item.id !== shop.id));
                                            } catch (error) {
                                                console.error('Failed to remove from MyList:', error);
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {isEditModalOpen && (
                <ProfileEditModal
                    user={user}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdate={onUserUpdate}
                />
            )}
            {isSettingsModalOpen && (
                <SettingsModal
                    user={user}
                    onClose={() => setIsSettingsModalOpen(false)}
                    onLogout={onLogout}
                    onRetest={onRetest}
                    onUpdate={onUserUpdate}
                />
            )}

            {/* Edit Review Modal */}
            {editingReview && (
                <ReviewFlow
                    user={user}
                    initialReview={editingReview}
                    onClose={() => setEditingReview(null)}
                    onComplete={() => {
                        setEditingReview(null);
                        fetchData(); // Refresh list
                    }}
                />
            )}

            {activeCommentReview && (
                <CommentModal
                    review={activeCommentReview}
                    currentUser={user}
                    onClose={() => setActiveCommentReview(null)}
                    onCommentAdded={(newCount) => handleCommentAdded(activeCommentReview.id, newCount)}
                />
            )}
        </div>
    );
};
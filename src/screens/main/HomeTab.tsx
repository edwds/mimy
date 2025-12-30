import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ReviewCard } from '../../components/ReviewCard';
import { ApiService } from '../../services/api';
import { Review } from '../../types';
import { Loader2 } from 'lucide-react';
import { UserService } from '../../services/userService';
import { ReviewService } from '../../services/reviewService';
import { CommentModal } from '../../components/CommentModal';

export const HomeTab: React.FC = () => {
    const { t } = useTranslation();
    const [feed, setFeed] = useState<Review[]>([]);
    const [keywordMap, setKeywordMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [activeCommentReview, setActiveCommentReview] = useState<Review | null>(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Fetch keywords first
                const keywordsData = await ReviewService.getKeywords();
                const map: Record<string, string> = {};
                keywordsData.forEach(k => map[k.code] = k.text);
                setKeywordMap(map);

                const storedUser = localStorage.getItem('mimy_user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setCurrentUserEmail(parsed.email);
                    await fetchFeed(parsed.email, 1);
                }
            } catch (error) {
                console.error('HomeTab init error:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const fetchFeed = async (userId: number, pageNum: number) => {
        try {
            const data = await ApiService.getFeed(userId, pageNum);
            if (pageNum === 1) {
                setFeed(data);
            } else {
                setFeed(prev => [...prev, ...data]);
            }
            if (data.length < 15) setHasMore(false);
        } catch (error) {
            console.error('Feed error:', error);
        }
    };

    const handleLoadMore = () => {
        const user = UserService.getUser();
        if (!loading && hasMore && user?.id) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchFeed(user.id, nextPage);
        }
    };

    // Intersection Observer for infinite scroll
    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore) {
                    handleLoadMore();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget, hasMore, loading]);

    const handleLikeToggle = async (reviewId: string | number, isLiked: boolean) => {
        const user = UserService.getUser();
        if (!user?.id) return;
        try {
            const res = await ApiService.toggleLike(reviewId, user.id);
            // Update local state to sync with server
            setFeed(prev => prev.map(r => {
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
        setFeed(prev => prev.map(r => {
            if (String(r.id) === String(reviewId)) {
                return { ...r, commentCount: newCount };
            }
            return r;
        }));
    };

    return (
        <div className="pb-20">
            <div className="space-y-8 px-6 pt-8">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-2xl font-black" style={{ color: 'var(--color-text-main)' }}>
                        Feed
                    </h2>
                </div>
            </div>

            <div className="px-6 py-8 space-y-4">
                {feed.map((review) => (
                    <div key={review.id} className="relative">
                        <ReviewCard
                            review={review}
                            user={review.user as any}
                            keywordMap={keywordMap}
                            onLikeToggle={(liked) => handleLikeToggle(review.id, liked)}
                            onCommentClick={() => setActiveCommentReview(review)}
                        />
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                )}

                {!loading && feed.length === 0 && (
                    <div className="py-20 text-center space-y-2">
                        <div className="text-4xl">🍽️</div>
                        <p className="text-sm font-bold text-gray-400 whitespace-pre-line">
                            {t('feed.empty', '피드가 비어있어요.\n친구를 팔로우하거나 매장을 찜해보세요!')}
                        </p>
                    </div>
                )}

                <div ref={observerTarget} className="h-4" />
            </div>

            {activeCommentReview && UserService.getUser() && (
                <CommentModal
                    review={activeCommentReview}
                    currentUser={UserService.getUser()!}
                    onClose={() => setActiveCommentReview(null)}
                    onCommentAdded={(newCount) => handleCommentAdded(activeCommentReview.id, newCount)}
                />
            )}
        </div>
    );
};

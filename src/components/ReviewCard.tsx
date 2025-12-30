import React, { useState, useEffect } from 'react';
import { Review, UserProfile } from '../types';
import { MapPin, Star, MoreVertical, Heart, MessageCircle, Share2, CornerDownRight, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedShopName } from '../utils/i18nUtils';

interface ReviewCardProps {
    review: Review;
    user: UserProfile;
    keywordMap: Record<string, string>;
    onEdit?: () => void;
    onLikeToggle?: (liked: boolean, count: number) => void;
    onCommentClick?: () => void;
}

const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, user, keywordMap, onEdit, onLikeToggle, onCommentClick }) => {
    const { t, i18n } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLiked, setIsLiked] = useState(review.isLiked || false);
    const [likeCount, setLikeCount] = useState(review.likeCount || 0);
    const [commentCount, setCommentCount] = useState(review.commentCount || 0);
    const [previewComments, setPreviewComments] = useState<any[]>(review.previewComments || []);

    // Sync state if props change (e.g. from parent feed update)
    useEffect(() => {
        setIsLiked(review.isLiked || false);
        setLikeCount(review.likeCount || 0);
        setCommentCount(review.commentCount || 0);
        setPreviewComments(review.previewComments || []);
    }, [review.isLiked, review.likeCount, review.commentCount, review.previewComments]);

    return (
        <div className="bg-white flex flex-col gap-4 pb-10">
            {/* 1. Profile Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={user.profileImage || user.photo}
                        alt={user.nickname || user.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                    />
                    <div>
                        <div className="text-sm font-bold text-gray-900">{user.nickname || user.name}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                            <span>{review.visitDate}</span>
                            {review.rank && review.rank > 0 && (
                                <>
                                    <span>·</span>
                                    <span className="text-primary font-bold">
                                        {t('myPage.reviews.rankFmt', {
                                            rank: review.rank,
                                            suffix: i18n.language.startsWith('en') ? getOrdinalSuffix(review.rank) : ''
                                        })}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* 2. Text Content */}
            {review.text && (
                <div className="space-y-1">
                    <div className={`text-base text-gray-800 leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-5' : ''}`}>
                        {review.text}
                    </div>
                    {/* Rough estimation for showing "Read more" if text is long enough. 
                        In a real app, we might use a ref to measure height. 
                        For now, simply checking length as a heuristic or allowing expansion if it looks long. */}
                    {review.text.length > 100 && !isExpanded && (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-gray-400 text-sm font-bold hover:text-gray-600 flex items-center gap-1"
                        >
                            <CornerDownRight className="w-4 h-4" />
                            더보기
                        </button>
                    )}
                </div>
            )}

            {/* 3. Keywords */}
            {review.keywords && review.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {review.keywords.map(code => (
                        <span
                            key={code}
                            className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl"
                        >
                            #{keywordMap[code] || code}
                        </span>
                    ))}
                </div>
            )}

            {/* 4. Photos */}
            {review.images && review.images.length > 0 && (
                <>
                    {/* 1장 */}
                    {review.images.length === 1 && (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-black/5">
                            <img
                                src={review.images[0]}
                                alt="Review 1"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    )}

                    {/* 2장 이상: 가로 스크롤 + snap */}
                    {review.images.length >= 2 && (
                        <div className="flex gap-2 overflow-x-auto -mx-6 px-6 scrollbar-hide snap-x snap-mandatory">
                            {review.images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className="relative w-64 aspect-[1/1] shrink-0 rounded-2xl overflow-hidden snap-center bg-gray-100 ring-1 ring-black/5"
                                >
                                    <img
                                        src={img}
                                        alt={`Review ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* 5. POI Information */}
            <div className="mt-2 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-gray-200">
                    {review.shopImage ? (
                        <img src={review.shopImage} className="w-full h-full object-cover" alt={review.establishmentName} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                            <MapPin className="w-5 h-5 opacity-50" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm truncate">
                            {getLocalizedShopName(review, i18n.language)}
                        </span>
                        <span className="text-xs text-gray-500 font-medium shrink-0">{review.category}</span>
                    </div>
                    <div className="text-xs text-gray-400 font-medium truncate">
                        {review.landName || '위치 정보 없음'} · {review.visitCount ? t('myPage.reviews.visitCount', {
                            count: review.visitCount,
                            suffix: i18n.language.startsWith('en') ? getOrdinalSuffix(review.visitCount) : ''
                        }) : '첫 방문'}
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Handle save
                    }}
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                >
                    <Bookmark className="w-5 h-5" />
                </button>
            </div>

            {/* 6. Social Actions */}
            <div className="flex items-center gap-6 pt-2">
                <button
                    onClick={() => {
                        const newLiked = !isLiked;
                        const newCount = newLiked ? likeCount + 1 : likeCount - 1;
                        setIsLiked(newLiked);
                        setLikeCount(newCount);
                        onLikeToggle?.(newLiked, newCount);
                    }}
                    className="flex items-center gap-2 transition-colors"
                >
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    {likeCount > 0 && <span className="text-sm font-bold text-gray-600">{likeCount}</span>}
                </button>
                <button
                    onClick={onCommentClick}
                    className="flex items-center gap-2 transition-colors hover:text-gray-600"
                >
                    <MessageCircle className="w-6 h-6 text-gray-400" />
                    {commentCount > 0 && <span className="text-sm font-bold text-gray-600">{commentCount}</span>}
                </button>
                <div className="flex-1"></div>
                <button className="flex items-center gap-2">
                    <Share2 className="w-6 h-6 text-gray-400" />
                </button>
            </div>

            {/* 7. Comment Previews */}
            {previewComments.length > 0 && (
                <div className="space-y-2">
                    {previewComments.map((comment, idx) => (
                        <div key={comment.id || idx} className="flex items-start gap-2">
                            <span className="text-sm font-black text-gray-900 shrink-0">{comment.nickname}</span>
                            <span className="text-sm text-gray-600 line-clamp-1">{comment.text}</span>
                        </div>
                    ))}
                    {commentCount > 2 && (
                        <button
                            onClick={onCommentClick}
                            className="text-[11px] font-bold text-gray-400 hover:text-gray-600 pt-1"
                        >
                            {t('review.comments.viewAll', { count: commentCount })}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

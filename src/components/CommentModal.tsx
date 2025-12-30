import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Review, Comment, UserProfile } from '../types';
import { ApiService } from '../services/api';

interface CommentModalProps {
    review: Review;
    currentUser: UserProfile;
    onClose: () => void;
    onCommentAdded?: (count: number) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ review, currentUser, onClose, onCommentAdded }) => {
    const { t } = useTranslation();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const data = await ApiService.getComments(review.id);
            setComments(data);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [review.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser.id || submitting) return;

        setSubmitting(true);
        try {
            await ApiService.addComment(review.id, currentUser.id, newComment.trim());
            setNewComment('');
            await fetchComments();
            if (onCommentAdded) {
                // We fetch the count from the refreshed comments length
                onCommentAdded(comments.length + 1);
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-[2px]">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-md mx-auto rounded-t-[2.5rem] shadow-2xl flex flex-col h-[85vh] animate-in slide-in-from-bottom duration-300">
                {/* Handle Bar */}
                <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg tracking-tight">
                            {t('review.comments.title', '댓글')}
                            <span className="ml-1 text-primary">{comments.length}</span>
                        </h3>
                    </div>
                </div>

                {/* Comment List */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide"
                >
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 opacity-100">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-bold">{t('review.comments.empty', '첫 댓글을 남겨보세요')}</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2 group">
                                <img
                                    src={comment.profileImage || comment.photo}
                                    className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-100 border border-gray-50"
                                    alt={comment.nickname}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900">{comment.nickname}</span>
                                        <span className="text-[10px] font-bold text-gray-300">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-800 leading-relaxed font-medium">
                                            {comment.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Section */}
                <div className="p-4 border-t border-gray-100 bg-white pb-10 shrink-0">
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-2 bg-gray-50 p-2 pl-4 rounded-[2rem] border border-gray-100"
                    >
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t('review.comments.placeholder', '댓글을 입력하세요...')}
                            className="flex-1 bg-transparent border-none text-sm font-medium py-2 outline-none focus:outline-none ring-0 focus:ring-0 appearance-none"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            className={`p-2 ${newComment.trim() && !submitting
                                ? 'text-primary'
                                : 'text-gray-400'
                                }`}
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 ml-0.5" />
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

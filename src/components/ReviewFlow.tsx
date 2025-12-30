import React, { useState, useRef, useEffect } from 'react';
import { optimizeImage } from '../utils/imageOptimizer';
import { X, ChevronRight, ChevronLeft, Star, Clock, Users, MapPin, Image as ImageIcon, Camera, Search, Bookmark } from 'lucide-react';
import { Review, Satisfaction, UserProfile, RankingVisibility } from '../types';
import { ReviewService } from '../services/reviewService';
import { ShopService } from '../services/shopService';
import { Button } from './ui/Button';
import { useTranslation } from 'react-i18next';
import { getLocalizedShopName } from '../utils/i18nUtils';
import { RankingEngine, ComparisonTarget } from '../utils/rankingEngine';

interface ReviewFlowProps {
    user: UserProfile;
    initialReview?: Review;
    onClose: () => void;
    onComplete: () => void;
}

type Step = 'search' | 'satisfaction' | 'content' | 'keywords' | 'ranking';

export const ReviewFlow: React.FC<ReviewFlowProps> = ({ user, initialReview, onClose, onComplete }) => {
    const { t, i18n } = useTranslation();
    const isEditMode = !!initialReview;
    const [step, setStep] = useState<Step>(isEditMode ? 'content' : 'search');

    const [formData, setFormData] = useState<Partial<Review> & { shopId?: number | string }>(initialReview || {
        images: [],
        establishmentName: '',
        category: '',
        visitDate: new Date().toISOString().split('T')[0],
        companions: [],
        satisfaction: 'normal',
        text: '',
        keywords: []
    });

    const [imageItems, setImageItems] = useState<{ url: string; file?: File }[]>(
        initialReview?.images.map(url => ({ url })) || []
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [allReviews, setAllReviews] = useState<Review[]>([]);
    const [comparisonTarget, setComparisonTarget] = useState<ComparisonTarget | null>(null);
    const [rankingRange, setRankingRange] = useState<{ start: number; end: number }>({ start: 1, end: 1 });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [myList, setMyList] = useState<any[]>([]);

    // Keywords State
    const [availableKeywords, setAvailableKeywords] = useState<{ code: string; category: string; text: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const loadKeywords = async () => {
            try {
                const kws = await ReviewService.getKeywords();
                setAvailableKeywords(kws);
            } catch (e) {
                console.error('Failed to load keywords', e);
            }
        };
        loadKeywords();
    }, []);

    useEffect(() => {
        const loadMyList = async () => {
            if (user?.email) {
                try {
                    const list = await ShopService.getMyList(user.email);
                    setMyList(list);
                } catch (e) {
                    console.error('Failed to load MyList', e);
                }
            }
        };
        loadMyList();
    }, [user?.email]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [formData.text, step]);

    // Search Effect
    useEffect(() => {
        if (searchQuery.length > 1) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            setIsSearching(true);
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const results = await ReviewService.searchShops(searchQuery);
                    setSearchResults(results);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files) as File[];

            // Optimize all files concurrently
            const optimizedFiles = await Promise.all(
                files.map(async (file): Promise<File> => {
                    try {
                        return await optimizeImage(file);
                    } catch (error) {
                        console.error('Failed to optimize image:', error);
                        return file;
                    }
                })
            );

            const newItems = optimizedFiles.map(file => ({
                url: URL.createObjectURL(file), // createObjectURL supports both File and Blob
                file: file
            }));

            setImageItems(prev => [...prev, ...newItems].slice(0, 20));
        }
    };

    const nextStep = () => {
        if (step === 'search') setStep('satisfaction');
        else if (step === 'satisfaction') {
            if (!formData.satisfaction) {
                alert(t('write.alerts.selectSatisfaction'));
                return;
            }
            setStep('content');
        }
        else if (step === 'content') {
            if (imageItems.length === 0) {
                alert(t('write.alerts.uploadPhoto'));
                return;
            }
            if (!formData.establishmentName || !formData.category) {
                alert(t('write.alerts.enterInfo'));
                return;
            }
            setStep('keywords');
        }
        else if (step === 'keywords') {
            if (formData.satisfaction === 'liked') {
                checkRanking();
            } else {
                submitReview();
            }
        }
    };

    const prevStep = () => {
        if (step === 'satisfaction') setStep('search');
        else if (step === 'content') setStep('satisfaction');
        else if (step === 'keywords') setStep('content');
        else if (step === 'ranking') setStep('keywords');
    };

    const selectShop = (shop: any) => {
        setFormData(p => ({
            ...p,
            establishmentName: getLocalizedShopName(shop, i18n.language),
            shopName: shop.shopName,
            shopNameKo: shop.shopNameKo,
            shopNameEn: shop.shopNameEn,
            shopNameJp: shop.shopNameJp,
            category: shop.foodKind || shop.categoryEnum,
            shopId: shop.id,
            landName: shop.landName || shop.landEnum,
            lat: shop.lat,
            lon: shop.lon,
            shopImage: shop.shopImage // If shop has image, save it too
        }));
        setStep('satisfaction');
    };

    const skipSearch = () => {
        setStep('satisfaction');
    };

    const handleSatisfactionSelect = (sat: Satisfaction) => {
        setFormData(p => ({ ...p, satisfaction: sat }));
        setTimeout(() => setStep('content'), 300);
    };

    const checkRanking = async () => {
        try {
            const reviews = await ReviewService.getReviews(user.email);
            setAllReviews(reviews);

            // Check if this is a repeat visit
            const previousVisit = reviews
                .filter(r => (formData.shopId && r.shopId === formData.shopId) || r.establishmentName === formData.establishmentName)
                .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0];

            const range = RankingEngine.getRankRange(reviews, formData.satisfaction as Satisfaction);
            setRankingRange(range);

            const target = RankingEngine.getComparisonTarget(
                formData,
                reviews,
                previousVisit?.rank
            );

            if (target) {
                setComparisonTarget(target);
                setStep('ranking');
            } else {
                // If no comparison target, just put at the end of the range
                submitReview(range.end);
            }
        } catch (e) {
            console.error('Failed to check ranking', e);
            submitReview();
        }
    };

    const submitReview = async (finalRank?: number) => {
        setIsSubmitting(true);
        try {
            const existingReviews = allReviews.length > 0 ? allReviews : await ReviewService.getReviews(user.email);
            const visitCount = existingReviews.filter(r =>
                (formData.shopId && r.shopId === formData.shopId) ||
                r.establishmentName === formData.establishmentName
            ).length + (isEditMode ? 0 : 1);

            const newFiles = imageItems.filter(item => item.file).map(item => item.file!);
            let uploadedUrls: string[] = [];

            if (newFiles.length > 0) {
                uploadedUrls = await ReviewService.uploadImages(newFiles);
            }

            let uploadIdx = 0;
            const finalImageUrls = imageItems.map(item => {
                if (item.file) {
                    return uploadedUrls[uploadIdx++];
                }
                return item.url;
            });

            const reviewData: Review = {
                id: initialReview?.id || Math.random().toString(36).substr(2, 9),
                email: user.email,
                establishmentName: formData.establishmentName || '',
                category: formData.category || '',
                images: finalImageUrls,
                visitDate: formData.visitDate || '',
                companions: formData.companions || [],
                satisfaction: formData.satisfaction as Satisfaction,
                text: formData.text || '',
                keywords: formData.keywords || [],
                shopId: formData.shopId,
                visitCount: visitCount,
                landName: formData.landName || '',
                shopImage: formData.shopImage,
                timestamp: initialReview?.timestamp || new Date().toISOString(),
                rank: finalRank || formData.rank,
                rankingVisibility: user.defaultRankingVisibility || 'public'
            };

            if (isEditMode) {
                await ReviewService.updateReview(reviewData);
            } else {
                await ReviewService.saveReview(reviewData);
            }

            // Sync all rankings if position changed
            if (finalRank) {
                const newRankings = RankingEngine.recalculateAbsoluteRankings(
                    existingReviews,
                    reviewData.establishmentName,
                    finalRank
                );
                // Update all affected reviews and the ranking cache
                // Note: The backend currently expects per-category rankings, 
                // but we are using 'GLOBAL' or similar for absolute ranks if needed, 
                // or just updating all categories.
                // For simplicity, we'll update the 'GLOBAL' category and sync reviews.
                await ReviewService.saveRankings(user.email, 'GLOBAL', newRankings);

                // Also update the specific review's rank in DB if not already done by saveReview
                // Actually saveReview/updateReview already take rank.
            }

            onComplete();
        } catch (error) {
            console.error('Failed to submit review:', error);
            alert(t('write.alerts.saveFailure'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRankingComparison = (isBetter: boolean) => {
        if (!comparisonTarget) return;

        if (isBetter) {
            // New place is better than target
            // Place it at target's rank, pushing target and those below down
            submitReview(comparisonTarget.rank);
        } else {
            // Target is better than new place
            // Place it at target's rank + 1
            submitReview(comparisonTarget.rank + 1);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
            <div className={`bg-white w-full max-w-lg rounded-[2.0rem] overflow-hidden shadow-2xl flex flex-col ${['keywords', 'search', 'satisfaction'].includes(step) ? 'h-[80vh]' : 'max-h-[90vh]'}`}>

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <button onClick={onClose} className="text-gray-900 font-medium">{t('write.common.cancel')}</button>
                    <h3 className="font-black text-lg">
                        {step === 'search' && t('write.steps.search')}
                        {step === 'satisfaction' && t('write.steps.satisfaction')}
                        {step === 'content' && t('write.steps.content')}
                        {step === 'keywords' && t('write.steps.keywords')}
                        {step === 'ranking' && t('write.steps.ranking')}
                    </h3>
                    <div className="w-8"></div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto relative scrollbar-hide">

                    {/* Step 1: Search */}
                    {step === 'search' && (
                        <div className="p-6 space-y-6 slide-in h-full flex flex-col">
                            <div className="text-center space-y-2 py-4">
                                <h4 className="text-xl font-bold">{t('write.search.title')}</h4>
                                <p className="text-gray-500 text-sm">{t('write.search.subtitle')}</p>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:outline-none transition-all font-bold text-lg"
                                    placeholder={t('write.search.placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto -mx-2 px-2">
                                {isSearching ? (
                                    <div className="py-8 text-center text-gray-400">{t('write.search.searching')}</div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchResults.map((shop) => (
                                            <button
                                                key={shop.id}
                                                onClick={() => selectShop(shop)}
                                                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 rounded-2xl transition-all text-left group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                                                    <MapPin className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{getLocalizedShopName(shop, i18n.language)}</div>
                                                    <div className="text-xs text-gray-500 font-medium">{shop.landEnum} · {shop.categoryEnum}</div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                                            </button>
                                        ))}
                                    </div>
                                ) : searchQuery.length > 1 ? (
                                    <div className="py-8 text-center text-gray-400 space-y-4">
                                        <p>{t('write.search.noResult')}</p>
                                        <Button variant="outline" onClick={skipSearch} className="rounded-full">
                                            {t('write.search.manualInput')}
                                        </Button>
                                    </div>
                                ) : myList.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <Bookmark className="w-4 h-4 text-primary fill-primary" />
                                            <span className="text-sm font-bold text-gray-900">{t('myPage.tabs.mylist')}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {myList.map((shop) => (
                                                <button
                                                    key={shop.id}
                                                    onClick={() => selectShop(shop)}
                                                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 rounded-2xl transition-all text-left group border border-gray-100/50"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                                                        <MapPin className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{getLocalizedShopName(shop, i18n.language)}</div>
                                                        <div className="text-xs text-gray-500 font-medium">{shop.landEnum} · {shop.categoryEnum}</div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-300 text-sm">
                                        {t('write.search.guide')}
                                        <br />
                                        <button onClick={skipSearch} className="mt-4 text-gray-400 hover:text-gray-600 underline">
                                            {t('write.search.manualInputLink')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Satisfaction */}
                    {step === 'satisfaction' && (
                        <div className="p-8 space-y-8 slide-in text-center flex flex-col justify-center h-full">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black">{t('write.satisfaction.title', { name: user.nickname || user.name })}</h4>
                                <p className="text-xl font-bold text-gray-600">{t('write.satisfaction.subtitle')}</p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button onClick={() => handleSatisfactionSelect('liked')} className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 transition-all ${formData.satisfaction === 'liked' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-gray-300'}`}>
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">😊</div>
                                    <div className="text-left">
                                        <div className="font-bold text-lg">{t('write.satisfaction.options.liked.label')}</div>
                                        <div className="text-xs text-gray-400">{t('write.satisfaction.options.liked.desc')}</div>
                                    </div>
                                </button>
                                <button onClick={() => handleSatisfactionSelect('normal')} className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 transition-all ${formData.satisfaction === 'normal' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-gray-300'}`}>
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">😐</div>
                                    <div className="text-left">
                                        <div className="font-bold text-lg">{t('write.satisfaction.options.normal.label')}</div>
                                        <div className="text-xs text-gray-400">{t('write.satisfaction.options.normal.desc')}</div>
                                    </div>
                                </button>
                                <button onClick={() => handleSatisfactionSelect('disliked')} className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 transition-all ${formData.satisfaction === 'disliked' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-gray-300'}`}>
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">😞</div>
                                    <div className="text-left">
                                        <div className="font-bold text-lg">{t('write.satisfaction.options.disliked.label')}</div>
                                        <div className="text-xs text-gray-400">{t('write.satisfaction.options.disliked.desc')}</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Content (Combined) */}
                    {step === 'content' && (
                        <div className="p-6 space-y-6 slide-in">
                            {/* Photos */}
                            <div className="space-y-2">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-all text-gray-400 hover:text-primary shrink-0"
                                    >
                                        <Camera className="w-6 h-6" />
                                        <span className="text-[10px] font-bold">{imageItems.length}/20</span>
                                    </button>
                                    {imageItems.map((item, i) => (
                                        <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-sm group">
                                            <img src={item.url} className="w-full h-full object-cover" alt={`Preview ${i}`} />
                                            <button
                                                onClick={() => setImageItems(p => p.filter((_, idx) => idx !== i))}
                                                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} multiple hidden accept="image/*" />
                            </div>

                            {/* Text Editor */}
                            <div className="flex items-start gap-3">
                                <textarea
                                    ref={textareaRef}
                                    className="w-full bg-transparent border-none p-0 text-base placeholder-gray-400 focus:ring-0 focus:outline-none resize-none min-h-[100px]"
                                    placeholder={t('write.content.placeholder')}
                                    value={formData.text}
                                    onChange={e => setFormData(p => ({ ...p, text: e.target.value }))}
                                />
                            </div>

                            {/* Info Fields */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex flex-col gap-1 px-1">
                                        <div className="text-lg font-black text-gray-900">{formData.establishmentName}</div>
                                        <div className="text-sm font-medium text-gray-500">{formData.category}</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {t('write.content.visitDate')}</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 bg-white rounded-xl border border-gray-100 text-sm font-medium focus:outline-none transition-all"
                                            value={formData.visitDate}
                                            onChange={e => setFormData(p => ({ ...p, visitDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 ml-1 flex items-center gap-1"><Users className="w-3 h-3" /> {t('write.content.companions')}</label>
                                        <input
                                            className="w-full p-3 bg-white rounded-xl border border-gray-100 text-sm font-medium focus:outline-none transition-all"
                                            placeholder={t('write.content.companionsPlaceholder')}
                                            value={formData.companions?.join(', ')}
                                            onChange={e => setFormData(p => ({ ...p, companions: e.target.value.split(',').map(s => s.trim()) }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Keywords */}
                    {step === 'keywords' && (
                        <div className="p-6 space-y-6 slide-in h-full flex flex-col">
                            <div className="text-center space-y-2 py-2 shrink-0">
                                <h4 className="text-xl font-bold">{t('write.keywords.title')}</h4>
                                <p className="text-gray-500 text-sm">{t('write.keywords.subtitle')}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                                {availableKeywords.length > 0 ? (
                                    <>
                                        {/* Taste Section */}
                                        <div className="space-y-3">
                                            <h5 className="font-bold text-gray-900 ml-1 text-sm bg-gray-100 inline-block px-3 py-1 rounded-lg">{t('write.keywords.tastePrice')}</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {availableKeywords.filter(k => k.category === 'taste').map(kw => (
                                                    <button
                                                        key={kw.code}
                                                        onClick={() => {
                                                            const current = formData.keywords || [];
                                                            const next = current.includes(kw.code) ? current.filter(k => k !== kw.code) : [...current, kw.code];
                                                            setFormData(p => ({ ...p, keywords: next }));
                                                        }}
                                                        className={`px-4 py-3 rounded-2xl border transition-all font-bold text-sm ${formData.keywords?.includes(kw.code)
                                                            ? 'border-primary bg-primary text-white shadow-md transform scale-105'
                                                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        #{kw.text}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Atmosphere Section */}
                                        <div className="space-y-3">
                                            <h5 className="font-bold text-gray-900 ml-1 text-sm bg-gray-100 inline-block px-3 py-1 rounded-lg">{t('write.keywords.atmosphereService')}</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {availableKeywords.filter(k => k.category === 'atmosphere').map(kw => (
                                                    <button
                                                        key={kw.code}
                                                        onClick={() => {
                                                            const current = formData.keywords || [];
                                                            const next = current.includes(kw.code) ? current.filter(k => k !== kw.code) : [...current, kw.code];
                                                            setFormData(p => ({ ...p, keywords: next }));
                                                        }}
                                                        className={`px-4 py-3 rounded-2xl border transition-all font-bold text-sm ${formData.keywords?.includes(kw.code)
                                                            ? 'border-primary bg-primary text-white shadow-md transform scale-105'
                                                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        #{kw.text}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-gray-400 py-10">{t('write.keywords.loading')}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Ranking Step */}
                    {step === 'ranking' && comparisonTarget && (
                        <div className="p-8 space-y-8 slide-in text-center flex flex-col items-center justify-center h-full">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black">{t('write.ranking.title')}</h4>
                                <p className="text-gray-500 font-bold text-sm">
                                    {comparisonTarget.type === 'repeat_visit' && t('write.ranking.types.repeat_visit')}
                                    {comparisonTarget.type === 'similar_category' && t('write.ranking.types.similar_category')}
                                    {comparisonTarget.type === 'recent' && t('write.ranking.types.recent')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 w-full">
                                <button
                                    onClick={() => handleRankingComparison(true)}
                                    className="p-6 rounded-[2.5rem] bg-black text-white shadow-xl hover:scale-105 transition-all w-full"
                                >
                                    <span className="block text-xs font-bold opacity-60 mb-1">{t('write.ranking.new')}</span>
                                    <span className="text-xl font-bold">{formData.establishmentName}</span>
                                </button>

                                <div className="relative flex justify-center py-2">
                                    <span className="px-4 bg-white text-gray-300 font-black italic text-sm">VS</span>
                                </div>

                                <button
                                    onClick={() => handleRankingComparison(false)}
                                    className="p-6 rounded-[2.5rem] border-2 border-gray-100 text-gray-900 hover:border-black hover:scale-105 transition-all w-full"
                                >
                                    <span className="block text-xs font-bold text-gray-400 mb-1">{comparisonTarget.type === 'repeat_visit' ? t('myPage.reviews.rankFmt', { rank: comparisonTarget.rank }) : t('write.ranking.best')}</span>
                                    <span className="text-xl font-bold">{comparisonTarget.establishmentName}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                {step !== 'ranking' && step !== 'search' && step !== 'satisfaction' && (
                    <div className="p-4 flex items-center justify-between bg-white border-t border-gray-50">
                        <Button variant="ghost" onClick={prevStep} className="text-gray-400 font-bold">{t('write.common.prev')}</Button>

                        <Button
                            onClick={nextStep}
                            disabled={isSubmitting}
                            className={`rounded-full px-8 font-bold ${step === 'keywords' ? 'bg-black text-white hover:bg-gray-800' : ''}`}
                        >
                            {isSubmitting ? '진행 중...' : (step === 'keywords' ? (formData.satisfaction === 'liked' ? t('write.common.next') : t('write.common.complete')) : t('write.common.next'))}
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                )}
                {step === 'search' && (
                    <div className="p-4 flex items-center justify-center bg-white border-t border-gray-50">
                        <Button variant="ghost" onClick={onClose} className="text-gray-400">{t('write.common.close')}</Button>
                    </div>
                )}
                {step === 'satisfaction' && (
                    <div className="p-4 flex items-center justify-between bg-white border-t border-gray-50">
                        <Button variant="ghost" onClick={prevStep} className="text-gray-400 font-bold">{t('write.common.prev')}</Button>
                        <div className="w-8"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

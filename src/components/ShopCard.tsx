import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Bookmark, CircleDollarSign } from 'lucide-react';
import { Shop } from '../types';
import { getLocalizedShopName, getLocalizedShopDetail } from '../utils/i18nUtils';

interface ShopCardProps {
    shop: Shop;
    isBookmarked: boolean;
    onBookmarkToggle: (shop: Shop) => void;
    onClick?: (shop: Shop) => void;
    className?: string;
}

export const ShopCard: React.FC<ShopCardProps> = ({
    shop,
    isBookmarked,
    onBookmarkToggle,
    onClick,
    className = ""
}) => {
    const { t, i18n } = useTranslation();

    return (
        <div
            onClick={() => onClick?.(shop)}
            className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col transition-all active:scale-[0.98] ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
        >
            <div className="h-44 bg-gray-200 relative">
                {/* Placeholder for shop image */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <span className="text-4xl">🍽️</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onBookmarkToggle(shop);
                    }}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-transform active:scale-90"
                >
                    <Bookmark
                        size={20}
                        className={isBookmarked ? "fill-primary text-primary" : "text-gray-400"}
                    />
                </button>
            </div>
            <div className="p-5 flex flex-col gap-1.5">
                {/* 제목 + 카테고리 */}
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-1 tracking-tight min-w-0">
                        {getLocalizedShopName(shop, i18n.language)}
                    </h3>

                    {(shop.foodKind || shop.categoryEnum) && (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg shrink-0 uppercase tracking-wider">
                            {shop.foodKind || shop.categoryEnum}
                        </span>
                    )}
                </div>

                {/* ✅ 상세 설명 (위로 이동) */}
                {getLocalizedShopDetail(shop, i18n.language) && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                        {getLocalizedShopDetail(shop, i18n.language)}
                    </p>
                )}

                {/* ✅ 지역 + 가격 (아래로) */}
                <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 mt-2">
                    <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-primary/60" />
                        <span>{shop.landName || shop.landEnum}</span>
                    </div>

                    {shop.priceRange && (
                        <div className="flex items-center gap-0.5 text-primary">
                            {Array.from({ length: Number(shop.priceRange) }).map((_, i) => (
                                <CircleDollarSign
                                    key={i}
                                    size={14}
                                    fill="currentColor"
                                    fillOpacity={0.1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

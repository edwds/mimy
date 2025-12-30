import { Shop, Review } from '../types';

export const getLocalizedShopName = (item: Shop | Review | any, language: string): string => {
    if (!item) return '';

    const lang = language.toLowerCase();

    // Check for explicit localized fields
    if (lang.startsWith('ko') && item.shopNameKo) return item.shopNameKo;
    if (lang.startsWith('en') && item.shopNameEn) return item.shopNameEn;
    if (lang.startsWith('ja') && item.shopNameJp) return item.shopNameJp;

    // Fallback order
    return item.shopName || item.shopNameKo || item.shopNameEn || item.shopNameJp || item.establishmentName || item.shopName || '';
};

export const getLocalizedShopDetail = (item: Shop | any, language: string): string => {
    if (!item) return '';

    const lang = language.toLowerCase();

    if (lang.startsWith('ko') && item.detailKo) return item.detailKo;
    if (lang.startsWith('en') && item.detailEn) return item.detailEn;
    if (lang.startsWith('ja') && item.detailJp) return item.detailJp;

    return item.detailKo || item.detailEn || item.detailJp || '';
};

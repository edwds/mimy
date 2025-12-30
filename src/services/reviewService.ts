import { Review, CategoryRanking, RankingItem, Satisfaction } from '../types';

const API_BASE = 'http://localhost:3001/api';

export const ReviewService = {
    getReviews: async (email: string, currentUserId?: number): Promise<Review[]> => {
        const url = new URL(`${API_BASE}/reviews/${email}`);
        if (currentUserId) url.searchParams.append('currentUserId', currentUserId.toString());

        const response = await fetch(url.toString());
        if (!response.ok) return [];
        return response.json();
    },

    saveReview: async (review: Review): Promise<void> => {
        const response = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
        });

        if (!response.ok) throw new Error('Failed to save review');
    },

    updateReview: async (review: Review): Promise<void> => {
        const response = await fetch(`${API_BASE}/reviews/${review.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
        });

        if (!response.ok) throw new Error('Failed to update review');
    },

    getRankings: async (email: string): Promise<CategoryRanking[]> => {
        const response = await fetch(`${API_BASE}/rankings/${email}`);
        if (!response.ok) return [];
        return response.json();
    },

    updateRankings: async (email: string, category: string, establishmentName: string): Promise<void> => {
        const rankings = await ReviewService.getRankings(email);
        const categoryRanking = rankings.find(r => r.category === category);

        if (!categoryRanking) {
            await ReviewService.saveRankings(email, category, [{ establishmentName, rank: 1 }]);
        } else {
            if (!categoryRanking.rankings.find(r => r.establishmentName === establishmentName)) {
                const newRankings = [...categoryRanking.rankings, {
                    establishmentName,
                    rank: categoryRanking.rankings.length + 1
                }];
                await ReviewService.saveRankings(email, category, newRankings);
            }
        }
    },

    saveRankings: async (email: string, category: string, rankings: RankingItem[]): Promise<void> => {
        await fetch(`${API_BASE}/rankings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, category, rankings })
        });
    },

    // Helper to update specific ranking order
    updateCategoryOrder: async (email: string, category: string, newOrder: string[]): Promise<void> => {
        const rankings = newOrder.map((name, index) => ({
            establishmentName: name,
            rank: index + 1
        }));
        await ReviewService.saveRankings(email, category, rankings);
    },

    uploadImages: async (files: File[]): Promise<string[]> => {
        if (files.length === 0) return [];

        const formData = new FormData();
        files.forEach(file => {
            formData.append('images', file);
        });

        const response = await fetch(`${API_BASE}/upload/multiple`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload images');
        const data = await response.json();
        return data.imageUrls;
    },

    searchShops: async (query: string): Promise<any[]> => {
        if (!query) return [];
        const response = await fetch(`${API_BASE}/shops/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) return [];
        return response.json();
    },

    getKeywords: async (): Promise<{ code: string; category: string; text: string }[]> => {
        const response = await fetch(`${API_BASE}/keywords`);
        if (!response.ok) return [];
        return response.json();
    }
};

import { Satisfaction, RankingItem, Review } from '../types';

export interface ComparisonTarget {
    establishmentName: string;
    rank: number;
    category: string;
    type: 'similar_category' | 'recent' | 'repeat_visit';
}

export const RankingEngine = {
    /**
     * Get the global ranking range for a given satisfaction.
     * Liked: Top group
     * Normal: Middle group
     * Disliked: Bottom group
     */
    getRankRange: (allReviews: Review[], satisfaction: Satisfaction): { start: number; end: number } => {
        const sortedReviews = [...allReviews].sort((a, b) => (a.rank || 9999) - (b.rank || 9999));

        const liked = sortedReviews.filter(r => r.satisfaction === 'liked');
        const normal = sortedReviews.filter(r => r.satisfaction === 'normal');
        const disliked = sortedReviews.filter(r => r.satisfaction === 'disliked');

        if (satisfaction === 'liked') {
            return { start: 1, end: liked.length + 1 };
        } else if (satisfaction === 'normal') {
            const start = liked.length + 1;
            return { start, end: start + normal.length };
        } else {
            const start = liked.length + normal.length + 1;
            return { start, end: start + disliked.length };
        }
    },

    /**
     * Find a comparison target based on the requirements.
     */
    getComparisonTarget: (
        targetReview: Partial<Review>,
        allReviews: Review[],
        previousRank?: number
    ): ComparisonTarget | null => {
        const { category, establishmentName, satisfaction } = targetReview;

        // Ensure we aren't comparing with self if editing
        const otherReviews = allReviews.filter(r => r.id !== targetReview.id);

        // 1. Repeat Visit Check
        if (previousRank !== undefined) {
            const prevReview = otherReviews.find(r => r.rank === previousRank);
            if (prevReview) {
                return {
                    establishmentName: prevReview.establishmentName,
                    rank: prevReview.rank!,
                    category: prevReview.category,
                    type: 'repeat_visit'
                };
            }
        }

        // 2. Similar Category Check (within the same satisfaction group)
        const similarCategoryReviews = otherReviews.filter(r =>
            r.category === category &&
            r.satisfaction === satisfaction
        );

        if (similarCategoryReviews.length > 0) {
            // Sort by rank to find the "best" in that category/group for comparison?
            // Or "recent" in that category? Requirement says "방문이 있다면 해당 점포와 비교"
            // Let's take the highest ranked one in that category/group for a "benchmark"
            const sorted = similarCategoryReviews.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
            const best = sorted[0];

            return {
                establishmentName: best.establishmentName,
                rank: best.rank!,
                category: best.category,
                type: 'similar_category'
            };
        }

        // 3. Recent Review Check (within the same satisfaction group)
        const sameSatisfactionReviews = otherReviews.filter(r =>
            r.satisfaction === satisfaction
        );

        if (sameSatisfactionReviews.length > 0) {
            const latest = sameSatisfactionReviews.sort((a, b) =>
                new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
            )[0];

            return {
                establishmentName: latest.establishmentName,
                rank: latest.rank!,
                category: latest.category,
                type: 'recent'
            };
        }

        return null;
    },

    /**
     * Recalculate all rankings to be absolute.
     * Inserts movingItem at newRank and shifts others.
     */
    recalculateAbsoluteRankings: (
        allReviews: Review[],
        movingItemName: string,
        newRank: number
    ): { establishmentName: string; rank: number }[] => {
        // Get unique restaurants by name (since absolute ranking is per restaurant)
        // Actually, if a restaurant is visited multiple times, it should have a single rank?
        // "랭킹은 모두 절대값을 가진다" - usually means the restaurant itself is ranked.

        const uniqueRestaurants = Array.from(new Set(allReviews.map(r => r.establishmentName)));
        // Filter out the moving item from current list
        const others = uniqueRestaurants
            .filter(name => name !== movingItemName)
            .sort((a, b) => {
                const rA = allReviews.find(r => r.establishmentName === a)?.rank || 9999;
                const rB = allReviews.find(r => r.establishmentName === b)?.rank || 9999;
                return rA - rB;
            });

        const result: { establishmentName: string; rank: number }[] = [];
        let inserted = false;

        for (let i = 0; i < others.length; i++) {
            if (i + 1 === newRank) {
                result.push({ establishmentName: movingItemName, rank: result.length + 1 });
                inserted = true;
            }
            result.push({ establishmentName: others[i], rank: result.length + 1 });
        }

        if (!inserted) {
            result.push({ establishmentName: movingItemName, rank: result.length + 1 });
        }

        return result;
    }
};

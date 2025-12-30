import { Request, Response } from 'express';
import db from '../db/database';

export const ReviewController = {
    createReview: async (req: Request, res: Response) => {
        const {
            email, establishmentName, category, shopId, images, visitDate,
            companions, satisfaction, text, keywords, rank, visitCount
        } = req.body;

        const query = `
      INSERT INTO reviews (
        email, establishment_name, category, shop_id, images_json, 
        visit_date, companions_json, satisfaction, text, keywords_json, rank,
        visit_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        try {
            const result = await db.execute({
                sql: query,
                args: [
                    email, establishmentName, category, shopId, JSON.stringify(images),
                    visitDate, JSON.stringify(companions), satisfaction, text, JSON.stringify(keywords), rank || null,
                    visitCount || 1
                ]
            });
            res.json({ id: Number(result.lastInsertRowid) });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },

    getReviewsByEmail: async (req: Request, res: Response) => {
        const { email } = req.params;
        const { currentUserId } = req.query;

        try {
            const query = `
                SELECT 
                    r.*, 
                    s.shopNameEn, s.shopNameKo, s.shopNameJp, s.landEnum as landName, s.lat, s.lon,
                    (SELECT COUNT(*) FROM likes WHERE review_id = r.id) as likeCount,
                    (SELECT COUNT(*) FROM likes WHERE review_id = r.id AND user_id = ?) as isLiked,
                    (SELECT COUNT(*) FROM comments WHERE review_id = r.id) as commentCount
                FROM reviews r 
                LEFT JOIN shops s ON r.shop_id = s.id 
                WHERE r.email = ? 
                ORDER BY r.created_at DESC
            `;
            const result = await db.execute({
                sql: query,
                args: [(currentUserId as string) || null, email]
            });
            const rows = result.rows;

            if (rows.length === 0) return res.json([]);

            const reviewIds = rows.map((r: any) => r.id);
            const commentQuery = `
                SELECT c.*, u.nickname, u.photo, u.profileImage
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.id IN (
                    SELECT id FROM comments 
                    WHERE review_id = c.review_id 
                    ORDER BY created_at ASC 
                    LIMIT 2
                ) AND c.review_id IN (${reviewIds.map(() => '?').join(',')})
            `;

            const commentResult = await db.execute({
                sql: commentQuery,
                args: reviewIds
            });
            const commentRows = commentResult.rows;

            const commentsByReview: Record<number, any[]> = {};
            commentRows.forEach((c: any) => {
                const rid = Number(c.review_id);
                if (!commentsByReview[rid]) commentsByReview[rid] = [];
                commentsByReview[rid].push(c);
            });

            const reviews = rows.map((row: any) => ({
                ...row,
                establishmentName: row.establishment_name,
                shopId: row.shop_id,
                images: JSON.parse(row.images_json),
                visitDate: row.visit_date,
                companions: JSON.parse(row.companions_json),
                keywords: JSON.parse(row.keywords_json),
                rank: row.rank,
                visitCount: row.visit_count,
                landName: row.landName,
                isLiked: !!row.isLiked,
                likeCount: row.likeCount,
                commentCount: row.commentCount,
                previewComments: commentsByReview[Number(row.id)] || []
            }));
            res.json(reviews);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },

    getRankingsByEmail: async (req: Request, res: Response) => {
        const { email } = req.params;
        try {
            const result = await db.execute({
                sql: `SELECT * FROM rankings WHERE email = ?`,
                args: [email]
            });
            const rankings = result.rows.map((row: any) => ({
                category: row.category,
                rankings: JSON.parse(row.rankings_json)
            }));
            res.json(rankings);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },

    updateRankings: async (req: Request, res: Response) => {
        const { email, category, rankings } = req.body;
        const rankingsJson = JSON.stringify(rankings);

        try {
            // Use batch for both operations
            const batches = [];

            // 1. Update Rankings table
            const queryRankings = `
                INSERT INTO rankings (email, category, rankings_json, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(email, category) DO UPDATE SET
                  rankings_json = excluded.rankings_json,
                  updated_at = CURRENT_TIMESTAMP
            `;
            batches.push({
                sql: queryRankings,
                args: [email, category, rankingsJson]
            });

            // 2. Sync Rank in Reviews table
            rankings.forEach((item: any) => {
                const query = category === 'GLOBAL'
                    ? `UPDATE reviews SET rank = ? WHERE email = ? AND establishment_name = ?`
                    : `UPDATE reviews SET rank = ? WHERE email = ? AND category = ? AND establishment_name = ?`;

                const params = category === 'GLOBAL'
                    ? [item.rank, email, item.establishmentName]
                    : [item.rank, email, category, item.establishmentName];

                batches.push({
                    sql: query,
                    args: params
                });
            });

            await db.batch(batches, "write");
            res.json({ success: true });
        } catch (err: any) {
            console.error('Error updating rankings:', err.message);
            res.status(500).json({ error: err.message });
        }
    },

    updateReview: async (req: Request, res: Response) => {
        const { id } = req.params;
        const {
            establishmentName, category, shopId, images, visitDate,
            companions, satisfaction, text, keywords, rank, visitCount
        } = req.body;

        const query = `
      UPDATE reviews SET
        establishment_name = ?,
        category = ?,
        shop_id = ?,
        images_json = ?,
        visit_date = ?,
        companions_json = ?,
        satisfaction = ?,
        text = ?,
        keywords_json = ?,
        rank = ?,
        visit_count = ?
      WHERE id = ?
    `;

        try {
            await db.execute({
                sql: query,
                args: [
                    establishmentName, category, shopId, JSON.stringify(images),
                    visitDate, JSON.stringify(companions), satisfaction, text,
                    JSON.stringify(keywords), rank || null, visitCount, id
                ]
            });
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },

    getFeed: async (req: Request, res: Response) => {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 15;
        const offset = (page - 1) * limit;

        try {
            const query = `
                SELECT 
                    r.*, 
                    u.nickname as user_nickname, 
                    u.photo as user_photo,
                    u.profileImage as user_profileImage,
                    s.shopNameEn, s.shopNameKo, s.shopNameJp, s.landEnum as landName, s.lat, s.lon,
                    (SELECT COUNT(*) FROM likes WHERE review_id = r.id) as likeCount,
                    (SELECT COUNT(*) FROM likes WHERE review_id = r.id AND user_id = ?) as isLiked,
                    (SELECT COUNT(*) FROM comments WHERE review_id = r.id) as commentCount
                FROM reviews r
                JOIN users u ON r.email = u.email
                LEFT JOIN shops s ON r.shop_id = s.id
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const result = await db.execute({
                sql: query,
                args: [(userId as string) || null, limit, offset]
            });
            const rows = result.rows;

            if (rows.length === 0) return res.json([]);

            const reviewIds = rows.map((r: any) => r.id);
            const commentQuery = `
                SELECT c.*, u.nickname, u.photo, u.profileImage
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.id IN (
                    SELECT id FROM comments 
                    WHERE review_id = c.review_id 
                    ORDER BY created_at ASC 
                    LIMIT 2
                ) AND c.review_id IN (${reviewIds.map(() => '?').join(',')})
            `;

            const commentResult = await db.execute({
                sql: commentQuery,
                args: reviewIds
            });
            const commentRows = commentResult.rows;

            const commentsByReview: Record<number, any[]> = {};
            commentRows.forEach((c: any) => {
                const rid = Number(c.review_id);
                if (!commentsByReview[rid]) commentsByReview[rid] = [];
                commentsByReview[rid].push(c);
            });

            const feed = rows.map((row: any) => ({
                ...row,
                establishmentName: row.establishment_name,
                shopId: row.shop_id,
                images: JSON.parse(row.images_json),
                visitDate: row.visit_date,
                companions: JSON.parse(row.companions_json),
                keywords: JSON.parse(row.keywords_json),
                rank: row.rank,
                visitCount: row.visit_count,
                landName: row.landName,
                isLiked: !!row.isLiked,
                likeCount: row.likeCount,
                commentCount: row.commentCount,
                previewComments: commentsByReview[Number(row.id)] || [],
                user: {
                    nickname: row.user_nickname,
                    photo: row.user_photo,
                    profileImage: row.user_profileImage
                }
            }));
            res.json(feed);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },

    toggleLike: async (req: Request, res: Response) => {
        const { reviewId } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ error: 'userId is required' });

        try {
            const result = await db.execute({
                sql: "SELECT id FROM likes WHERE user_id = ? AND review_id = ?",
                args: [userId, reviewId]
            });
            const row = result.rows[0];

            if (row) {
                // Unlike
                await db.execute({
                    sql: "DELETE FROM likes WHERE id = ?",
                    args: [row.id]
                });
                await sendLikeStatusAsync(res, reviewId, false);
            } else {
                // Like
                await db.execute({
                    sql: "INSERT INTO likes (user_id, review_id) VALUES (?, ?)",
                    args: [userId, reviewId]
                });
                await sendLikeStatusAsync(res, reviewId, true);
            }
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },

    getComments: async (req: Request, res: Response) => {
        const { reviewId } = req.params;
        const query = `
            SELECT c.*, u.nickname, u.photo, u.profileImage
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.review_id = ?
            ORDER BY c.created_at ASC
        `;
        try {
            const result = await db.execute({
                sql: query,
                args: [reviewId]
            });
            res.json(result.rows);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },

    addComment: async (req: Request, res: Response) => {
        const { reviewId } = req.params;
        const { userId, text } = req.body;

        if (!userId || !text) return res.status(400).json({ error: 'userId and text are required' });

        const query = `INSERT INTO comments (review_id, user_id, text) VALUES (?, ?, ?)`;
        try {
            const result = await db.execute({
                sql: query,
                args: [reviewId, userId, text]
            });
            res.json({ id: Number(result.lastInsertRowid), success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },

    deleteComment: async (req: Request, res: Response) => {
        const { commentId } = req.params;
        const { userId } = req.body;

        try {
            const result = await db.execute({
                sql: `DELETE FROM comments WHERE id = ? AND user_id = ?`,
                args: [commentId, userId]
            });
            if (result.rowsAffected === 0) return res.status(404).json({ error: 'Comment not found or unauthorized' });
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
};

async function sendLikeStatusAsync(res: Response, reviewId: string, liked: boolean) {
    try {
        const result = await db.execute({
            sql: "SELECT COUNT(*) as count FROM likes WHERE review_id = ?",
            args: [reviewId]
        });
        const row = result.rows[0] as any;
        res.json({ liked, count: Number(row.count) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

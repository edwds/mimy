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

        db.run(query, [
            email, establishmentName, category, shopId, JSON.stringify(images),
            visitDate, JSON.stringify(companions), satisfaction, text, JSON.stringify(keywords), rank || null,
            visitCount || 1
        ], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID });
        });
    },

    getReviewsByEmail: async (req: Request, res: Response) => {
        const { email } = req.params;
        const { currentUserId } = req.query;

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
        db.all(query, [currentUserId || null, email], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

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

            db.all(commentQuery, reviewIds, (err, commentRows) => {
                if (err) return res.status(500).json({ error: err.message });

                const commentsByReview: Record<number, any[]> = {};
                commentRows.forEach((c: any) => {
                    if (!commentsByReview[c.review_id]) commentsByReview[c.review_id] = [];
                    commentsByReview[c.review_id].push(c);
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
                    previewComments: commentsByReview[row.id] || []
                }));
                res.json(reviews);
            });
        });
    },

    getRankingsByEmail: async (req: Request, res: Response) => {
        const { email } = req.params;
        db.all(`SELECT * FROM rankings WHERE email = ?`, [email], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const rankings = rows.map((row: any) => ({
                category: row.category,
                rankings: JSON.parse(row.rankings_json)
            }));
            res.json(rankings);
        });
    },

    updateRankings: async (req: Request, res: Response) => {
        const { email, category, rankings } = req.body;
        // rankings is an array of objects: { establishmentName, rank }

        const rankingsJson = JSON.stringify(rankings);

        db.serialize(() => {
            // 1. Update Rankings table (the fast index)
            const queryRankings = `
        INSERT INTO rankings (email, category, rankings_json, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(email, category) DO UPDATE SET
          rankings_json = excluded.rankings_json,
          updated_at = CURRENT_TIMESTAMP
      `;
            db.run(queryRankings, [email, category, rankingsJson], function (err) {
                if (err) {
                    console.error('Error updating rankings table:', err.message);
                }
            });

            // 2. Sync Rank in Reviews table
            rankings.forEach((item: any) => {
                const query = category === 'GLOBAL'
                    ? `UPDATE reviews SET rank = ? WHERE email = ? AND establishment_name = ?`
                    : `UPDATE reviews SET rank = ? WHERE email = ? AND category = ? AND establishment_name = ?`;

                const params = category === 'GLOBAL'
                    ? [item.rank, email, item.establishmentName]
                    : [item.rank, email, category, item.establishmentName];

                db.run(query, params, (err) => {
                    if (err) console.error(`Error syncing rank for ${item.establishmentName}:`, err.message);
                });
            });
        });

        res.json({ success: true });
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

        db.run(query, [
            establishmentName, category, shopId, JSON.stringify(images),
            visitDate, JSON.stringify(companions), satisfaction, text,
            JSON.stringify(keywords), rank || null, visitCount, id
        ], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        });
    },

    getFeed: async (req: Request, res: Response) => {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 15;
        const offset = (page - 1) * limit;

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

        db.all(query, [userId, limit, offset], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

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

            db.all(commentQuery, reviewIds, (err, commentRows) => {
                if (err) return res.status(500).json({ error: err.message });

                const commentsByReview: Record<number, any[]> = {};
                commentRows.forEach((c: any) => {
                    if (!commentsByReview[c.review_id]) commentsByReview[c.review_id] = [];
                    commentsByReview[c.review_id].push(c);
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
                    previewComments: commentsByReview[row.id] || [],
                    user: {
                        nickname: row.user_nickname,
                        photo: row.user_photo,
                        profileImage: row.user_profileImage
                    }
                }));
                res.json(feed);
            });
        });
    },

    toggleLike: async (req: Request, res: Response) => {
        const { reviewId } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ error: 'userId is required' });

        db.get("SELECT id FROM likes WHERE user_id = ? AND review_id = ?", [userId, reviewId], (err, row: any) => {
            if (err) return res.status(500).json({ error: err.message });

            if (row) {
                // Unlike
                db.run("DELETE FROM likes WHERE id = ?", [row.id], (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    sendLikeStatus(res, reviewId, false);
                });
            } else {
                // Like
                db.run("INSERT INTO likes (user_id, review_id) VALUES (?, ?)", [userId, reviewId], (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    sendLikeStatus(res, reviewId, true);
                });
            }
        });
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
        db.all(query, [reviewId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    },

    addComment: async (req: Request, res: Response) => {
        const { reviewId } = req.params;
        const { userId, text } = req.body;

        if (!userId || !text) return res.status(400).json({ error: 'userId and text are required' });

        const query = `INSERT INTO comments (review_id, user_id, text) VALUES (?, ?, ?)`;
        db.run(query, [reviewId, userId, text], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        });
    },

    deleteComment: async (req: Request, res: Response) => {
        const { commentId } = req.params;
        const { userId } = req.body; // Basic auth check

        db.run(`DELETE FROM comments WHERE id = ? AND user_id = ?`, [commentId, userId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Comment not found or unauthorized' });
            res.json({ success: true });
        });
    }
};

function sendLikeStatus(res: Response, reviewId: string, liked: boolean) {
    db.get("SELECT COUNT(*) as count FROM likes WHERE review_id = ?", [reviewId], (err, row: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ liked, count: row.count });
    });
}

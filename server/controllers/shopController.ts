import { Request, Response } from 'express';
import db from '../db/database';

export const searchShops = (req: Request, res: Response) => {
    const query = req.query.q as string;

    if (!query) {
        return res.json([]);
    }

    const sql = `
        SELECT * FROM shops 
        WHERE shopNameEn LIKE ? 
           OR shopNameKo LIKE ? 
           OR shopNameJp LIKE ?
        LIMIT 20
    `;

    db.all(sql, [`%${query}%`, `%${query}%`, `%${query}%`], (err, rows) => {
        if (err) {
            console.error('Error searching shops:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

export const getExploreShops = (req: Request, res: Response) => {
    // Get random 20 shops for exploration
    const sql = `SELECT * FROM shops ORDER BY RANDOM() LIMIT 20`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

export const getMyList = (req: Request, res: Response) => {
    const { email } = req.params;
    const sql = `
        SELECT s.*, m.created_at as saved_at 
        FROM shops s
        JOIN mylists m ON s.id = m.shop_id
        WHERE m.email = ?
        ORDER BY m.created_at DESC
    `;
    db.all(sql, [email], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

export const addToMyList = (req: Request, res: Response) => {
    const { email, shopId } = req.body;
    const sql = `INSERT INTO mylists (email, shop_id) VALUES (?, ?)`;
    db.run(sql, [email, shopId], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(409).json({ error: 'Shop already in MyList' });
                return;
            }
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, id: this.lastID });
    });
};

export const removeFromMyList = (req: Request, res: Response) => {
    const { email, shopId } = req.params;
    const sql = `DELETE FROM mylists WHERE email = ? AND shop_id = ?`;
    db.run(sql, [email, shopId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
};

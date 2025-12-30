import { Request, Response } from 'express';
import db from '../db/database';

export const searchShops = async (req: Request, res: Response) => {
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

    try {
        const result = await db.execute({
            sql,
            args: [`%${query}%`, `%${query}%`, `%${query}%`]
        });
        res.json(result.rows);
    } catch (err: any) {
        console.error('Error searching shops:', err);
        res.status(500).json({ error: err.message });
    }
};

export const getExploreShops = async (req: Request, res: Response) => {
    // Get random 20 shops for exploration
    const sql = `SELECT * FROM shops ORDER BY RANDOM() LIMIT 20`;
    try {
        const result = await db.execute(sql);
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getMyList = async (req: Request, res: Response) => {
    const { email } = req.params;
    const sql = `
        SELECT s.*, m.created_at as saved_at 
        FROM shops s
        JOIN mylists m ON s.id = m.shop_id
        WHERE m.email = ?
        ORDER BY m.created_at DESC
    `;
    try {
        const result = await db.execute({
            sql,
            args: [email]
        });
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const addToMyList = async (req: Request, res: Response) => {
    const { email, shopId } = req.body;
    const sql = `INSERT INTO mylists (email, shop_id) VALUES (?, ?)`;
    try {
        const result = await db.execute({
            sql,
            args: [email, shopId]
        });
        res.json({ success: true, id: Number(result.lastInsertRowid) });
    } catch (err: any) {
        if (err.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({ error: 'Shop already in MyList' });
            return;
        }
        res.status(500).json({ error: err.message });
    }
};

export const removeFromMyList = async (req: Request, res: Response) => {
    const { email, shopId } = req.params;
    const sql = `DELETE FROM mylists WHERE email = ? AND shop_id = ?`;
    try {
        await db.execute({
            sql,
            args: [email, shopId]
        });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

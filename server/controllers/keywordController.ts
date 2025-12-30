import { Request, Response } from 'express';
import db from '../db/database';

export const getKeywords = async (req: Request, res: Response) => {
    const sql = "SELECT code, category, text FROM keywords";
    try {
        const result = await db.execute(sql);
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

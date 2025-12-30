import { Request, Response } from 'express';
import db from '../db/database';

export const getKeywords = (req: Request, res: Response) => {
    const sql = "SELECT code, category, text FROM keywords";
    db.all(sql, [], (err, rows: { code: string, category: string, text: string }[]) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

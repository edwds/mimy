import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.status(200).json({
        status: 'pong',
        message: 'Standard Vercel Function is working',
        time: new Date().toISOString(),
        env: {
            VERCEL: process.env.VERCEL,
            NODE_ENV: process.env.NODE_ENV
        }
    });
}

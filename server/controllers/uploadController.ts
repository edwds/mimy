import { Request, Response } from 'express';
import path from 'path';

export const uploadProfileImage = (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the URL for the uploaded image
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
};

export const uploadMultipleImages = (req: Request, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = req.files as Express.Multer.File[];
    const imageUrls = files.map(file => `/uploads/${file.filename}`);
    res.json({ imageUrls });
};

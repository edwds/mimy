import { Request, Response } from 'express';
import { UserService } from '../services/userService';

// Simulating login by email (In real app, verify token)
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, name, photo } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        let user = await UserService.findByEmail(email);
        if (!user) {
            user = await UserService.createUser(email, name || 'User', photo || '');
        }

        res.json(user);
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', details: error.message });
    }
};

export const getUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await UserService.findById(Number(id));
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Get latest quiz result
        const result = await UserService.getLatestResult(user.id);

        res.json({ ...user, latestResult: result });
    } catch (error: any) {
        console.error('GetUser error:', error);
        res.status(500).json({ message: 'Failed to fetch user', details: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedUser = await UserService.updateUser(Number(id), req.body);
        res.json(updatedUser);
    } catch (error: any) {
        console.error('UpdateUser error:', error);
        res.status(500).json({ message: 'Update failed', details: error.message });
    }
};

export const saveQuiz = async (req: Request, res: Response) => {
    try {
        const { userId, profile, cluster } = req.body;
        await UserService.saveQuizResult(userId, profile, cluster);
        res.json({ success: true });
    } catch (error: any) {
        console.error('SaveQuiz error:', error);
        res.status(500).json({ message: 'Failed to save quiz', details: error.message });
    }
};

export const getQuizHistory = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const result = await UserService.getLatestResult(Number(userId));
        res.json(result);
    } catch (error: any) {
        console.error('GetQuizHistory error:', error);
        res.status(500).json({ message: 'Failed to fetch quiz history', details: error.message });
    }
};

import express from 'express';
import { loginUser, getUser, updateUser, saveQuiz, getQuizHistory } from '../controllers/userController';

const router = express.Router();

router.post('/auth/login', loginUser);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.post('/quiz', saveQuiz);
router.get('/quiz/:userId', getQuizHistory);

export default router;

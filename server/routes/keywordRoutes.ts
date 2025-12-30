import express from 'express';
import { getKeywords } from '../controllers/keywordController';

const router = express.Router();

router.get('/keywords', getKeywords);

export default router;

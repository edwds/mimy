import express from 'express';
import { ReviewController } from '../controllers/reviewController';

const router = express.Router();

router.post('/reviews', ReviewController.createReview);
router.put('/reviews/:id', ReviewController.updateReview);
router.get('/reviews/:email', ReviewController.getReviewsByEmail);
router.get('/rankings/:email', ReviewController.getRankingsByEmail);
router.post('/rankings', ReviewController.updateRankings);
router.get('/feed/:userId', ReviewController.getFeed);
router.post('/reviews/:reviewId/like', ReviewController.toggleLike);

// Comment routes
router.get('/reviews/:reviewId/comments', ReviewController.getComments);
router.post('/reviews/:reviewId/comments', ReviewController.addComment);
router.delete('/comments/:commentId', ReviewController.deleteComment);

export default router;

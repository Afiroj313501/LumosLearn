import express from 'express';
import { createReview, getCourseReviews, getMyReview } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/course/:courseId', getCourseReviews);
router.post('/course/:courseId', protect, authorize('STUDENT'), createReview);
router.get('/course/:courseId/mine', protect, authorize('STUDENT'), getMyReview);

export default router;
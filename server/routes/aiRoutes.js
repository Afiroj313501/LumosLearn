import express from 'express';
import { generateOutline, getRecommendations } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/outline', protect, authorize('INSTRUCTOR', 'ADMIN'), generateOutline);
router.get('/recommendations', protect, authorize('STUDENT'), getRecommendations);

export default router;
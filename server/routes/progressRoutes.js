import express from 'express';
import {
  markLessonComplete,
  unmarkLessonComplete,
  getCourseProgress,
} from '../controllers/progressController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/lesson/:lessonId/complete', protect, authorize('STUDENT'), markLessonComplete);
router.post('/lesson/:lessonId/uncomplete', protect, authorize('STUDENT'), unmarkLessonComplete);
router.get('/course/:courseId', protect, authorize('STUDENT'), getCourseProgress);

export default router;
import express from 'express';
import {
  createLesson,
  getLessonsByCourse,
  updateLesson,
  deleteLesson,
  summarizeLessonAI,
} from '../controllers/lessonController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/course/:courseId', getLessonsByCourse);
router.post('/course/:courseId', protect, authorize('INSTRUCTOR', 'ADMIN'), createLesson);
router.put('/:id', protect, authorize('INSTRUCTOR', 'ADMIN'), updateLesson);
router.delete('/:id', protect, authorize('INSTRUCTOR', 'ADMIN'), deleteLesson);
router.get('/:id/summarize', protect, summarizeLessonAI);

export default router;
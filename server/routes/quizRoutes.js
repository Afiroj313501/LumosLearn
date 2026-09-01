import express from 'express';
import {
  createQuiz,
  getQuizByLesson,
  deleteQuiz,
  submitQuiz,
  getMyQuizSubmission,
  generateQuizAI,
  getQuizReview,
} from '../controllers/quizController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/lesson/:lessonId', protect, getQuizByLesson);
router.post('/lesson/:lessonId', protect, authorize('INSTRUCTOR', 'ADMIN'), createQuiz);
router.delete('/:id', protect, authorize('INSTRUCTOR', 'ADMIN'), deleteQuiz);
router.post('/:id/submit', protect, authorize('STUDENT'), submitQuiz);
router.get('/:id/my-submission', protect, authorize('STUDENT'), getMyQuizSubmission);
router.post('/lesson/:lessonId/generate', protect, authorize('INSTRUCTOR', 'ADMIN'), generateQuizAI);
router.get('/:id/review', protect, authorize('STUDENT'), getQuizReview);

export default router;
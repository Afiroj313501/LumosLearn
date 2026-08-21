import express from 'express';
import {
  createAssignment,
  getAssignmentsByCourse,
  getAssignmentSubmissions,
  submitAssignment,
  getMySubmission,
  deleteAssignment,
} from '../controllers/assignmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/course/:courseId', protect, getAssignmentsByCourse);
router.post('/course/:courseId', protect, authorize('INSTRUCTOR', 'ADMIN'), createAssignment);
router.delete('/:id', protect, authorize('INSTRUCTOR', 'ADMIN'), deleteAssignment);
router.get('/:id/submissions', protect, authorize('INSTRUCTOR', 'ADMIN'), getAssignmentSubmissions);
router.post('/:id/submit', protect, authorize('STUDENT'), submitAssignment);
router.get('/:id/my-submission', protect, authorize('STUDENT'), getMySubmission);

export default router;
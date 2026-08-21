import express from 'express';
import {
  enrollInCourse,
  getMyEnrollments,
  checkEnrollment,
} from '../controllers/enrollmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('STUDENT'), enrollInCourse);
router.get('/mine', protect, authorize('STUDENT'), getMyEnrollments);
router.get('/check/:courseId', protect, authorize('STUDENT'), checkEnrollment);

export default router;
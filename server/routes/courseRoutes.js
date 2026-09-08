import express from 'express';
import {
  createCourse,
  getMyCourses,
  getAllCourses,
  getCourseById,
  updateCourse,
  setLessonsFinalized,
  deleteCourse,
  exportGradesCSV,
  getCourseEnrollments,
  getCourseAnalytics,
} from '../controllers/courseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllCourses);
router.get('/mine', protect, authorize('INSTRUCTOR', 'ADMIN'), getMyCourses);
router.get('/:id', getCourseById);
router.post('/', protect, authorize('INSTRUCTOR', 'ADMIN'), createCourse);
router.put('/:id', protect, authorize('INSTRUCTOR', 'ADMIN'), updateCourse);
router.put('/:id/finalize', protect, authorize('INSTRUCTOR', 'ADMIN'), setLessonsFinalized);
router.delete('/:id', protect, authorize('INSTRUCTOR', 'ADMIN'), deleteCourse);
router.get('/:id/enrollments', protect, authorize('INSTRUCTOR', 'ADMIN'), getCourseEnrollments);
router.get('/:id/analytics', protect, authorize('INSTRUCTOR', 'ADMIN'), getCourseAnalytics);
router.get('/:id/export-grades', protect, authorize('INSTRUCTOR', 'ADMIN'), exportGradesCSV);

export default router;
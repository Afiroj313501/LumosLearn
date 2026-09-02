import express from 'express';
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllCoursesAdmin,
  deleteCourseAdmin,
  getPlatformStats,
  getPendingInstructors,
  approveInstructor,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('ADMIN'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.get('/pending-instructors', getPendingInstructors);
router.put('/pending-instructors/:id/approve', approveInstructor);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/courses', getAllCoursesAdmin);
router.delete('/courses/:id', deleteCourseAdmin);

export default router;
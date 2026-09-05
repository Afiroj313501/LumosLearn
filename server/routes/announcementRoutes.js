import express from 'express';
import {
  createAnnouncement,
  getAnnouncementsByCourse,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/course/:courseId', protect, getAnnouncementsByCourse);
router.post('/course/:courseId', protect, authorize('INSTRUCTOR', 'ADMIN'), createAnnouncement);
router.delete('/:id', protect, authorize('INSTRUCTOR', 'ADMIN'), deleteAnnouncement);

export default router;
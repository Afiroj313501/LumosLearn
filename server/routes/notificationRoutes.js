import express from 'express';
import { getMyNotifications, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.put('/mark-read', protect, markAllRead);

export default router;
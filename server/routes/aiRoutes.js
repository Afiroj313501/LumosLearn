import express from 'express';
import { generateOutline } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/outline', protect, authorize('INSTRUCTOR', 'ADMIN'), generateOutline);

export default router;
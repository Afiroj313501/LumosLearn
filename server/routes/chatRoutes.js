import express from 'express';
import { askAssistant } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/course/:courseId', protect, askAssistant);

export default router;
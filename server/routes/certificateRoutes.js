import express from 'express';
import { issueCertificate, getMyCertificate } from '../controllers/certificateController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/course/:courseId', protect, authorize('STUDENT'), issueCertificate);
router.get('/course/:courseId', protect, authorize('STUDENT'), getMyCertificate);

export default router;
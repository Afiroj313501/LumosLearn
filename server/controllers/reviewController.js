import prisma from '../config/prisma.js';

export const createReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: req.user.userId, courseId } },
    });
    if (!enrollment) return res.status(403).json({ error: 'You must be enrolled to review this course' });
    if (!enrollment.completed) return res.status(400).json({ error: 'Complete the course before leaving a review' });

    const review = await prisma.review.upsert({
      where: { studentId_courseId: { studentId: req.user.userId, courseId } },
      update: { rating, comment: comment || null },
      create: { studentId: req.user.userId, courseId, rating, comment: comment || null },
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { courseId },
      include: { student: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, avgRating, count: reviews.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const getMyReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const review = await prisma.review.findUnique({
      where: { studentId_courseId: { studentId: req.user.userId, courseId } },
    });
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
};
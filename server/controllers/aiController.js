import prisma from '../config/prisma.js';
import { generateCourseOutline, recommendCourses } from '../services/aiService.js';

export const generateOutline = async (req, res) => {
  try {
    const { topic, numModules } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'A topic is required' });
    }

    const outline = await generateCourseOutline(topic, numModules || 5);
    res.json({ outline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate course outline' });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user.userId },
      include: { course: true },
    });

    const enrolledIds = enrollments.map((e) => e.courseId);

    const availableCourses = await prisma.course.findMany({
      where: { id: { notIn: enrolledIds.length > 0 ? enrolledIds : ['none'] } },
    });

    if (availableCourses.length === 0) {
      return res.json({ recommendations: [] });
    }

    if (enrollments.length === 0) {
      // No history yet - just return the 3 newest courses as a cold-start fallback
      const newest = availableCourses
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .map((c) => ({ id: c.id, reason: 'A popular course to get started with' }));
      return res.json({ recommendations: newest });
    }

    const studentContext = enrollments
      .map((e) => `Enrolled in "${e.course.title}" (${e.course.category || 'General'}), progress: ${Math.round(e.progressPct)}%`)
      .join('\n');

    const recs = await recommendCourses(studentContext, availableCourses);

    // Attach full course data to each recommendation for the frontend
    const enriched = recs
      .map((r) => {
        const course = availableCourses.find((c) => c.id === r.id);
        return course ? { ...course, reason: r.reason } : null;
      })
      .filter(Boolean);

    res.json({ recommendations: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};
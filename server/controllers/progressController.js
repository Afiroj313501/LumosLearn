import prisma from '../config/prisma.js';

export const markLessonComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { include: { lessons: true } } },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: req.user.userId, courseId: lesson.courseId } },
    });
    if (!enrollment) return res.status(403).json({ error: 'You are not enrolled in this course' });

    await prisma.progress.upsert({
      where: { studentId_lessonId: { studentId: req.user.userId, lessonId } },
      update: { completed: true, completedAt: new Date() },
      create: { studentId: req.user.userId, lessonId, completed: true, completedAt: new Date() },
    });

    const totalLessons = lesson.course.lessons.length;
    const completedCount = await prisma.progress.count({
      where: {
        studentId: req.user.userId,
        completed: true,
        lesson: { courseId: lesson.courseId },
      },
    });

    const progressPct = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
    const isComplete = progressPct >= 100;

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progressPct, completed: isComplete },
    });

    res.json({ progressPct, completed: isComplete, enrollment: updatedEnrollment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark lesson complete' });
  }
};

export const unmarkLessonComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { include: { lessons: true } } },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: req.user.userId, courseId: lesson.courseId } },
    });
    if (!enrollment) return res.status(403).json({ error: 'You are not enrolled in this course' });

    await prisma.progress.upsert({
      where: { studentId_lessonId: { studentId: req.user.userId, lessonId } },
      update: { completed: false, completedAt: null },
      create: { studentId: req.user.userId, lessonId, completed: false },
    });

    const totalLessons = lesson.course.lessons.length;
    const completedCount = await prisma.progress.count({
      where: {
        studentId: req.user.userId,
        completed: true,
        lesson: { courseId: lesson.courseId },
      },
    });

    const progressPct = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progressPct, completed: false },
    });

    res.json({ progressPct, completed: false, enrollment: updatedEnrollment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    const progressRecords = await prisma.progress.findMany({
      where: {
        studentId: req.user.userId,
        lesson: { courseId },
      },
    });

    const completedLessonIds = progressRecords
      .filter((p) => p.completed)
      .map((p) => p.lessonId);

    res.json({ completedLessonIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
};
import prisma from '../config/prisma.js';

export const enrollInCourse = async (req, res) => {
  try {
    const { courseId, enrollmentPassword } = req.body;
    if (!courseId) return res.status(400).json({ error: 'Course ID is required' });

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (course.enrollmentPassword) {
      if (!enrollmentPassword || enrollmentPassword !== course.enrollmentPassword) {
        return res.status(403).json({ error: 'Incorrect enrollment password' });
      }
    }

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: req.user.userId, courseId } },
    });
    if (existing) return res.status(400).json({ error: 'Already enrolled in this course' });

    const enrollment = await prisma.enrollment.create({
      data: { studentId: req.user.userId, courseId },
    });

    res.status(201).json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to enroll' });
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user.userId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            lessons: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
    const sanitized = enrollments.map(({ course, ...enrollment }) => {
      const { enrollmentPassword, ...sanitizedCourse } = course;
      return { ...enrollment, course: sanitizedCourse };
    });
    res.json(sanitized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

export const checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: req.user.userId, courseId } },
    });
    res.json({ enrolled: !!enrollment, enrollment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check enrollment' });
  }
};
import prisma from '../config/prisma.js';

export const createCourse = async (req, res) => {
  try {
    const { title, description, category, thumbnailUrl, enrollmentPassword } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        category,
        thumbnailUrl,
        enrollmentPassword: enrollmentPassword || null,
        instructorId: req.user.userId,
      },
    });

    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { instructorId: req.user.userId },
      include: {
        lessons: true,
        enrollments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const sanitized = courses.map(({ enrollmentPassword, ...rest }) => rest);
    res.json(sanitized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: { select: { name: true } },
        _count: { select: { enrollments: true, lessons: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const sanitized = courses.map(({ enrollmentPassword, reviews, ...rest }) => ({
      ...rest,
      avgRating: reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
      reviewCount: reviews.length,
    }));
    res.json(sanitized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        instructor: { select: { name: true } },
      },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const { enrollmentPassword, ...sanitized } = course;
    res.json(sanitized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to edit this course' });
    }

    const { title, description, category, thumbnailUrl, enrollmentPassword } = req.body;
    const updated = await prisma.course.update({
      where: { id: req.params.id },
      data: { title, description, category, thumbnailUrl, enrollmentPassword },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

export const setLessonsFinalized = async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { finalized } = req.body;
    const updated = await prisma.course.update({
      where: { id: req.params.id },
      data: { lessonsFinalized: !!finalized },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

export const getCourseEnrollments = async (req, res) => {
  try {
    const { id: courseId } = req.params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: { student: { select: { name: true, email: true } } },
      orderBy: { enrolledAt: 'desc' },
    });

    res.json(enrollments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

export const getCourseAnalytics = async (req, res) => {
  try {
    const { id: courseId } = req.params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { enrolledAt: true, completed: true, progressPct: true },
      orderBy: { enrolledAt: 'asc' },
    });

    const enrollmentByDate = {};
    enrollments.forEach((enrollment) => {
      const date = new Date(enrollment.enrolledAt).toISOString().slice(0, 10);
      enrollmentByDate[date] = (enrollmentByDate[date] || 0) + 1;
    });
    let cumulative = 0;
    const enrollmentTrend = Object.keys(enrollmentByDate)
      .sort()
      .map((date) => {
        cumulative += enrollmentByDate[date];
        return { date, count: cumulative };
      });

    const totalEnrolled = enrollments.length;
    const totalCompleted = enrollments.filter((enrollment) => enrollment.completed).length;
    const completionRate = totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : 0;
    const avgProgress = totalEnrolled > 0
      ? enrollments.reduce((sum, enrollment) => sum + enrollment.progressPct, 0) / totalEnrolled
      : 0;

    const quizzes = await prisma.quiz.findMany({
      where: { lesson: { courseId } },
      include: { submissions: true },
    });
    const quizStats = quizzes.map((quiz) => ({
      title: quiz.title,
      avgScore: quiz.submissions.length > 0
        ? quiz.submissions.reduce((sum, submission) => sum + submission.score, 0) / quiz.submissions.length
        : 0,
      attempts: quiz.submissions.length,
    }));

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: { submissions: true },
    });
    const totalAssignmentSubmissions = assignments.reduce((sum, assignment) => sum + assignment.submissions.length, 0);
    const gradedSubmissions = assignments.reduce(
      (sum, assignment) => sum + assignment.submissions.filter((submission) => submission.grade != null).length,
      0
    );

    res.json({
      totalEnrolled,
      totalCompleted,
      completionRate,
      avgProgress,
      enrollmentTrend,
      quizStats,
      totalAssignmentSubmissions,
      gradedSubmissions,
      pendingGrading: totalAssignmentSubmissions - gradedSubmissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

import { Parser } from 'json2csv';

export const exportGradesCSV = async (req, res) => {
  try {
    const { id: courseId } = req.params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: { student: true },
    });

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: { submissions: { include: { student: true } } },
    });

    const quizzes = await prisma.quiz.findMany({
      where: { lesson: { courseId } },
      include: { submissions: { include: { student: true } } },
    });

    const rows = enrollments.map((e) => {
      const row = {
        'Student Name': e.student.name,
        'Student Email': e.student.email,
        'Progress %': Math.round(e.progressPct),
        'Course Completed': e.completed ? 'Yes' : 'No',
      };

      assignments.forEach((a) => {
        const sub = a.submissions.find((s) => s.studentId === e.studentId);
        row[`Assignment: ${a.title}`] = sub?.grade != null ? sub.grade : 'Not graded';
      });

      quizzes.forEach((q) => {
        const sub = q.submissions.find((s) => s.studentId === e.studentId);
        row[`Quiz: ${q.title}`] = sub ? Math.round(sub.score) : 'Not taken';
      });

      return row;
    });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No enrolled students to export' });
    }

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${course.title.replace(/[^a-z0-9]/gi, '_')}_grades.csv`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export grades' });
  }
};
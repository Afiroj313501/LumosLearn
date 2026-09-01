import prisma from '../config/prisma.js';
import { summarizeLesson } from '../services/aiService.js';
import { extractTextFromFile } from '../services/fileTextService.js';

export const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, videoUrl, fileUrl, fileName, order } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to add lessons to this course' });
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        videoUrl,
        fileUrl,
        fileName,
        order: order ?? 0,
        courseId,
      },
    });

    res.status(201).json(lesson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
};

export const getLessonsByCourse = async (req, res) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { courseId: req.params.courseId },
      orderBy: { order: 'asc' },
    });
    res.json(lessons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: { course: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (lesson.course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to edit this lesson' });
    }

    const { title, content, videoUrl, fileUrl, fileName, order } = req.body;
    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: { title, content, videoUrl, fileUrl, fileName, order },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: { course: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (lesson.course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this lesson' });
    }

    await prisma.lesson.delete({ where: { id: req.params.id } });
    res.json({ message: 'Lesson deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
};

export const summarizeLessonAI = async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: req.user.userId, courseId: lesson.courseId } },
      });
      if (!enrollment) return res.status(403).json({ error: 'You are not enrolled in this course' });
    } else if (
      lesson.course.instructorId !== req.user.userId &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let sourceText = lesson.content || '';

    if (lesson.fileUrl) {
      const fileText = await extractTextFromFile(lesson.fileUrl);
      if (fileText) {
        sourceText = `${sourceText}\n\n${fileText}`.trim();
      }
    }

    if (!sourceText || sourceText.trim().length < 50) {
      return res.status(400).json({ error: 'Not enough content (text or file) to summarize' });
    }

    const truncated = sourceText.slice(0, 15000);
    const summary = await summarizeLesson(truncated);
    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};
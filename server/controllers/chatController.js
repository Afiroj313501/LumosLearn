import prisma from '../config/prisma.js';
import { chatWithAssistant } from '../services/aiService.js';
import { extractTextFromFile } from '../services/fileTextService.js';

export const askAssistant = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: true },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: req.user.userId, courseId } },
      });
      if (!enrollment) return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Build course context from all lesson text + attached file text (capped)
    let context = `Course: ${course.title}\n${course.description}\n\n`;
    for (const lesson of course.lessons) {
      context += `Lesson: ${lesson.title}\n${lesson.content}\n`;
      if (lesson.fileUrl) {
        const fileText = await extractTextFromFile(lesson.fileUrl);
        if (fileText) context += `${fileText}\n`;
      }
      context += '\n';
      if (context.length > 20000) break; // cap total context size
    }
    context = context.slice(0, 20000);

    const reply = await chatWithAssistant(context, history || [], message);

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get assistant reply' });
  }
};
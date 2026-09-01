import prisma from '../config/prisma.js';
import { generateQuizFromContent } from '../services/aiService.js';
import { extractTextFromPDF } from '../services/pdfService.js';
export const createQuiz = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Title and at least one question are required' });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (lesson.course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to add a quiz to this lesson' });
    }

    const existing = await prisma.quiz.findUnique({ where: { lessonId } });
    if (existing) return res.status(400).json({ error: 'This lesson already has a quiz' });

    const quiz = await prisma.quiz.create({
      data: {
        title,
        lessonId,
        questions: {
          create: questions.map((q) => ({
            text: q.text,
            type: q.type || 'MCQ',
            options: q.options || null,
            correctAnswer: q.correctAnswer,
          })),
        },
      },
      include: { questions: true },
    });

    res.status(201).json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
};

export const getQuizByLesson = async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: req.params.lessonId },
      include: { questions: true },
    });
    if (!quiz) return res.json(null);

    if (req.user.role === 'STUDENT') {
      const sanitized = {
        ...quiz,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
        })),
      };
      return res.json(sanitized);
    }

    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: { lesson: { include: { course: true } } },
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.lesson.course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this quiz' });
    }

    await prisma.quiz.delete({ where: { id: req.params.id } });
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const { answers } = req.body;

    if (!answers) return res.status(400).json({ error: 'Answers are required' });

    const existing = await prisma.submission.findUnique({
      where: { studentId_quizId: { studentId: req.user.userId, quizId } },
    });
    if (existing) return res.status(400).json({ error: 'You have already submitted this quiz' });

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let correctCount = 0;
    quiz.questions.forEach((q) => {
      const given = answers[q.id];
      if (given && given.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        correctCount++;
      }
    });
    const score = (correctCount / quiz.questions.length) * 100;

    const submission = await prisma.submission.create({
      data: {
        studentId: req.user.userId,
        quizId,
        answers,
        score,
      },
    });

    res.status(201).json({ submission, correctCount, total: quiz.questions.length, score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
};

export const getMyQuizSubmission = async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { studentId_quizId: { studentId: req.user.userId, quizId: req.params.id } },
    });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};


export const generateQuizAI = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { numQuestions } = req.body;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (lesson.course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let sourceText = lesson.content || '';

    // If a PDF is attached, extract its text and use it too (or instead, if lesson text is thin)
    if (lesson.fileUrl && lesson.fileUrl.toLowerCase().endsWith('.pdf')) {
      try {
        const pdfText = await extractTextFromPDF(lesson.fileUrl);
        sourceText = `${sourceText}\n\n${pdfText}`.trim();
      } catch (pdfErr) {
        console.error('PDF extraction failed:', pdfErr);
        // fall through and use whatever text content exists
      }
    }

    if (!sourceText || sourceText.trim().length < 50) {
      return res.status(400).json({ error: 'Not enough content (text or PDF) to generate a quiz from' });
    }

    // Gemini has input limits - truncate very long extracted text to stay safe
    const truncated = sourceText.slice(0, 15000);

    const questions = await generateQuizFromContent(truncated, numQuestions || 5);
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate quiz with AI' });
  }
};
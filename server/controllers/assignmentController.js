import prisma from '../config/prisma.js';

export const createAssignment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, dueDate, fileUrl, fileName } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    if (dueDate) {
      const selectedDueDate = new Date(`${dueDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (Number.isNaN(selectedDueDate.getTime())) {
        return res.status(400).json({ error: 'Invalid due date' });
      }

      if (selectedDueDate < today) {
        return res.status(400).json({ error: 'Due date cannot be in the past' });
      }
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to add assignments to this course' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`) : null,
        fileUrl,
        fileName,
        courseId,
      },
    });

    res.status(201).json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

export const getAssignmentsByCourse = async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { courseId: req.params.courseId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

export const getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: { course: true },
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view submissions' });
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: req.params.id },
      include: { student: { select: { name: true, email: true } } },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      return res.status(400).json({ error: 'A file is required to submit' });
    }

    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: { assignmentId, studentId: req.user.userId },
      },
      update: { fileUrl, fileName, submittedAt: new Date() },
      create: { assignmentId, studentId: req.user.userId, fileUrl, fileName },
    });

    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
};

export const getMySubmission = async (req, res) => {
  try {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: { assignmentId: req.params.id, studentId: req.user.userId },
      },
    });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: { course: true },
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this assignment' });
    }

    await prisma.assignment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }

  
};

export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { course: true } } },
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    if (
      submission.assignment.course.instructorId !== req.user.userId &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({ error: 'Not authorized to grade this submission' });
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { grade: grade ?? null, feedback: feedback ?? null },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
};
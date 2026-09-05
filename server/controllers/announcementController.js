import prisma from '../config/prisma.js';
import { sendEmail, announcementEmail } from '../services/emailService.js';

export const createAnnouncement = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const announcement = await prisma.announcement.create({
      data: { courseId, message },
    });

    // Email all enrolled students (fire-and-forget, don't block the response)
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: { student: true },
    });

    Promise.all(
      enrollments.map((e) =>
        sendEmail(
          e.student.email,
          `New announcement in ${course.title}`,
          announcementEmail(course.title, message, course.instructor.name)
        )
      )
    ).catch((err) => console.error('Bulk announcement email error:', err));

    res.status(201).json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

export const getAnnouncementsByCourse = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { courseId: req.params.courseId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id },
      include: { course: true },
    });
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
    if (announcement.course.instructorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};
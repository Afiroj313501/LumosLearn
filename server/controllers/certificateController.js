import prisma from '../config/prisma.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const issueCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: req.user.userId, courseId } },
      include: {
        course: { include: { instructor: true } },
        student: true,
      },
    });

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    if (!enrollment.completed) {
      return res.status(400).json({ error: 'Course is not yet 100% complete' });
    }

    const existing = await prisma.certificate.findUnique({
      where: { studentId_courseId: { studentId: req.user.userId, courseId } },
    });
    if (existing) return res.json(existing);

    const fileName = `${crypto.randomUUID()}.pdf`;
    const filePath = path.join('certificates', fileName);

    await generateCertificatePDF(filePath, {
      studentName: enrollment.student.name,
      courseTitle: enrollment.course.title,
      instructorName: enrollment.course.instructor.name,
      date: new Date(),
    });

    const certificate = await prisma.certificate.create({
      data: {
        studentId: req.user.userId,
        courseId,
        fileUrl: `/certificates/${fileName}`,
      },
    });

    res.status(201).json(certificate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
};

export const getMyCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const certificate = await prisma.certificate.findUnique({
      where: { studentId_courseId: { studentId: req.user.userId, courseId } },
    });
    res.json(certificate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
};

function generateCertificatePDF(filePath, { studentName, courseTitle, instructorName, date }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.rect(0, 0, pageWidth, pageHeight).fill('#0b0c1e');
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60).lineWidth(2).stroke('#f2b84b');

    doc.fillColor('#f2b84b').fontSize(14).font('Helvetica')
      .text('LUMENLEARNER', 0, 90, { align: 'center', characterSpacing: 4 });

    doc.fillColor('#f5f3ed').fontSize(38).font('Helvetica-Bold')
      .text('Certificate of Completion', 0, 130, { align: 'center' });

    doc.fillColor('#a9a8c3').fontSize(14).font('Helvetica')
      .text('This certifies that', 0, 200, { align: 'center' });

    doc.fillColor('#f2b84b').fontSize(30).font('Helvetica-Bold')
      .text(studentName, 0, 230, { align: 'center' });

    doc.fillColor('#a9a8c3').fontSize(14).font('Helvetica')
      .text('has successfully completed the course', 0, 280, { align: 'center' });

    doc.fillColor('#f5f3ed').fontSize(22).font('Helvetica-Bold')
      .text(courseTitle, 0, 310, { align: 'center' });

    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    doc.fillColor('#a9a8c3').fontSize(12).font('Helvetica')
      .text(`Issued on ${formattedDate}`, 0, 380, { align: 'center' });

    doc.fillColor('#8c7cf0').fontSize(13).font('Helvetica')
      .text(`Instructor: ${instructorName}`, 0, 410, { align: 'center' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}
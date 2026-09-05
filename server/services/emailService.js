import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to, subject, html) {
  try {
    await resend.emails.send({
      from: `LumenLearner <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Failed to send email:', err.message);
    // Don't throw - email failures shouldn't break the main feature (grading, announcements, etc.)
  }
}

export function announcementEmail(courseTitle, message, instructorName) {
  return `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #c8791a;">New announcement in ${courseTitle}</h2>
      <p style="color: #444; line-height: 1.6;">${message}</p>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">- ${instructorName}</p>
    </div>
  `;
}

export function gradeEmail(assignmentTitle, courseTitle, grade, feedback) {
  return `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #c8791a;">Your assignment has been graded</h2>
      <p style="color: #444;"><strong>${assignmentTitle}</strong> in <strong>${courseTitle}</strong></p>
      <p style="font-size: 24px; color: #221f2e; margin: 16px 0;">Grade: ${grade}%</p>
      ${feedback ? `<p style="color: #666; line-height: 1.6;">Feedback: ${feedback}</p>` : ''}
    </div>
  `;
}
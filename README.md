# LumenLearner

**LumenLearner** is a full-stack, AI-powered Learning Management System built with the PERN stack (PostgreSQL, Express, React, Node.js). It supports role-based workflows for Admins, Instructors, and Students — course creation, lesson delivery, AI-generated quizzes, assignments, progress tracking, certificates, reviews, and real-time notifications — wrapped in a custom-designed, theme-aware UI.

> Formerly known as EduSmart — renamed and rebuilt as LumenLearner during development.

---

## Features

### Core Platform
- **Multi-role authentication** — JWT-based auth with Admin, Instructor, and Student roles
- **Instructor approval workflow** — new instructor signups require admin approval before they can log in
- **Course management** — create, edit, and delete courses; optional enrollment password set by the instructor
- **Lesson delivery** — text content, embedded YouTube video, and downloadable file attachments (PDF, PPTX, DOCX), with full edit support
- **Enrollment system** — students enroll (with password check if required) and track status
- **Progress tracking** — lesson-level completion, auto-calculated course progress percentage
- **Quiz system** — instructors build quizzes per lesson with per-question mark values; students get a confirm-to-start gate (leaving mid-quiz forfeits it), optional instructor-set deadlines, one attempt, auto-grading, and a full answer review after submission
- **Assignments** — instructors post assignments with optional due dates; students upload submissions; instructors grade with marks + feedback
- **Certificates** — auto-generated PDF certificates, gated behind an instructor "content finalized" flag and a live recalculation of course completion (prevents students from certifying against content added after they finished)
- **Course reviews & ratings** — students rate completed courses (1–5 stars + comment); average rating shown on the browse page
- **File uploads** — Multer-based pipeline supporting PDF, PPT/PPTX, DOC/DOCX, images, and ZIP files
- **Course search & filtering** — students can search and filter the course catalog by category
- **Announcements** — instructors post course-wide announcements; students are emailed and notified in-app
- **In-app notifications** — bell icon with unread badge for grades posted, announcements, and other course events
- **Admin dashboard** — platform stats, user management (role changes, deletion), course moderation, pending instructor approvals
- **Instructor analytics** — per-course enrollment trend chart, completion rate, average progress, and quiz performance breakdown
- **CSV export** — instructors can export a full grade sheet (assignments + quizzes, with marks) per course

### AI Features (powered by Google Gemini)
- **Auto-generate quizzes** from lesson content — reads plain text *and* extracts text from attached PDF/PPTX/DOCX files (via `officeparser`) to generate multiple-choice questions instructors can review and edit before saving
- **Lesson summarizer** — condenses lesson content (including attached files) into a short bullet-point summary on demand
- **AI Study Assistant** — a floating chat widget scoped to a specific course's material; declines to answer off-topic questions
- **Course outline generator** — instructor enters a topic, AI proposes a modular course structure that can be used to scaffold a new course
- **Personalized recommendations** — button-triggered (not automatic, to conserve free-tier API quota) suggestions of courses a student hasn't enrolled in yet, based on their enrollment history
- Includes automatic fallback to a secondary Gemini model if the primary model is temporarily overloaded

### Design
- **Dark/light theme toggle**, applied consistently via a shared `TopBar` component and CSS custom properties across every page
- Typography: Fraunces (serif) for branding/marketing, Source Serif 4 for course/lesson content titles (built for readability), Sora for UI chrome
- Animated landing page with an in-place login/register modal (no page redirects), glow and constellation motifs reflecting the "Lumen" (light) theme
- Loading skeletons, toast notifications, and friendly empty states (icon + message) throughout, instead of plain loading/error text

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), TypeScript, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL (hosted on Neon) |
| ORM | Prisma |
| Auth | JWT, bcrypt |
| AI | Google Gemini API (`@google/generative-ai`) |
| File Uploads | Multer |
| Document Parsing | `officeparser` (PDF/PPTX/DOCX text extraction) |
| PDF Generation | `pdfkit` (certificates) |
| CSV Export | `json2csv` |
| Email | Resend |
| Styling | Custom CSS (no framework), Google Fonts |

---

## Project Structure

```
LumenLearner/
├── client/                 # React + TypeScript frontend
│   └── src/
│       ├── api/              # Axios API modules (one per resource)
│       ├── components/       # Reusable components (TopBar, AuthModal, Toast, NotificationBell, etc.)
│       ├── context/           # Auth, Theme, and Toast context providers
│       ├── hooks/              # Custom hooks
│       └── pages/                # Route-level pages (Landing, dashboards, CourseDetail, CourseManage)
│
└── server/                 # Express backend
    ├── config/               # Database & Prisma client setup
    ├── controllers/          # Route handler logic
    ├── middleware/            # Auth & upload middleware
    ├── routes/                # Express route definitions
    ├── services/               # AI service, email service, file text extraction, PDF generation
    ├── prisma/                  # Prisma schema & migrations
    └── uploads/ / certificates/   # Uploaded and generated file storage
```

---

## Database Schema (Overview)

The Prisma schema models a relational structure covering:

`User` · `Course` · `Lesson` · `Enrollment` · `Progress` · `Quiz` · `Question` · `Submission` · `Certificate` · `Assignment` · `AssignmentSubmission` · `Review` · `Announcement` · `Notification`

Key relationships:
- A `Course` belongs to an instructor (`User`), and has many `Lesson`s, `Assignment`s, `Review`s, and `Announcement`s
- A `Lesson` optionally has one `Quiz`, which has many `Question`s (each with a `marks` value)
- A `Student` enrolls in a `Course` (`Enrollment`), tracks per-lesson `Progress`, and submits `Submission`s for quizzes and assignments

---

## Getting Started

### Prerequisites
- Node.js (LTS)
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) instance)
- A [Google AI Studio](https://aistudio.google.com) API key (for AI features)
- A [Resend](https://resend.com) API key (for email notifications — optional, features degrade gracefully without it)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/lumenlearner.git
cd lumenlearner
```

### 2. Backend setup
```bash
cd server
npm install
```

Create a `.env` file in `server/`:
```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_random_secret_string
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=onboarding@resend.dev
```

Push the schema and start the server:
```bash
npx prisma db push
npx prisma generate
npm run dev
```

### 3. Frontend setup
```bash
cd ../client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`, with the API running at `http://localhost:5000`.

### First-time admin setup
There is no public admin signup. To create your first admin account: sign up as a regular student, then open Prisma Studio (`npx prisma studio` from `server/`) and change that user's `role` field to `ADMIN`. Log out and back in to pick up the new role.

---

## Known Limitations

- **File storage is local disk** — uploaded lesson files, assignment submissions, and generated certificates are *not* currently backed by cloud storage. This is fine for local development but will not survive a redeploy on most hosting platforms; migrating to a service like Cloudinary or S3 is recommended before production use.
- **Email sending is domain-restricted** — without a verified sending domain in Resend, emails can only be delivered to the account owner's own address. A verified domain (e.g. via GitHub Student Developer Pack) removes this restriction.
- **No OCR for image-only slide decks** — AI features that read lesson attachments can't extract text from PPTX/PDF files where content exists only as embedded images, not real text.

---

## Roadmap

- [x] Authentication, roles, and instructor approval workflow
- [x] Course, lesson, and assignment management (full CRUD)
- [x] File uploads (PDF/PPTX/DOCX/video links)
- [x] Enrollment system with optional password protection
- [x] Progress tracking and gated certificate generation
- [x] Quiz system with per-question marks, deadlines, and forfeit-on-exit
- [x] Assignment submission, grading, and CSV export
- [x] All five planned AI features (quiz generation, summarizer, chat assistant, outline generator, recommendations)
- [x] Admin dashboard with user/course moderation
- [x] Course reviews and ratings
- [x] Instructor analytics dashboard
- [x] Email notifications and in-app notification inbox
- [x] Dark/light theme support
- [x] Cloud file storage for production deployment
- [x] Lesson drag-and-drop reordering
- [x] "Continue where you left off" for students
- [x] Video watch-progress tracking


---

## Author

Built by **Abdullah Firoj**, Computer Science Graduate from United International University (UIU), as a capstone project.

## License

This project is currently unlicensed / for academic use. Add a license (e.g. MIT) here if you plan to open-source it.

# LumenLearner

**LumenLearner** is a full-stack Learning Management System built with the PERN stack (PostgreSQL, Express, React, Node.js). It supports role-based dashboards for Admins, Instructors, and Students, with course creation, lesson delivery, quizzes, assignments, progress tracking, and file uploads — all wrapped in a custom-designed, animated UI.

> Formerly known as EduSmart — renamed and rebuilt as LumenLearner during development.

---

## Features

### Core Platform
- **Multi-role authentication** — JWT-based auth with Admin, Instructor, and Student roles, protected via role-based middleware
- **Course management** — instructors create, edit, and delete courses; students browse and enroll
- **Lesson delivery** — text content, embedded YouTube video, and downloadable file attachments (PDF, PPTX, DOCX) per lesson
- **Enrollment system** — students enroll in courses and track their status
- **Progress tracking** — lesson-level completion tracking with automatically calculated course progress percentage
- **Quiz system** — instructors build quizzes per lesson (multiple choice or short answer); students take them once and receive an auto-graded score
- **Assignments** — instructors post assignments with optional due dates; students upload submissions; instructors review all submissions per assignment
- **File uploads** — Multer-based upload pipeline supporting PDF, PPT/PPTX, DOC/DOCX, images, and ZIP files
- **Role-based dashboards** — distinct views and permissions for Admin, Instructor, and Student accounts

### Design
- Custom dark UI with an "illumination" visual motif (glow orbs, constellation graphics) reflecting the Lumen (light) theme
- Typography pairing of Fraunces (serif display) and Sora (sans UI/body)
- Fully animated landing page with an in-place login/register modal (no page redirects)
- Responsive card-based layouts across all dashboards

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), TypeScript, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL (hosted on Neon) |
| ORM | Prisma |
| Auth | JWT, bcrypt |
| File Uploads | Multer |
| Styling | Custom CSS (no framework), Google Fonts (Fraunces, Sora) |

---

## Project Structure

```
LumenLearner/
├── client/                 # React + TypeScript frontend
│   └── src/
│       ├── api/             # Axios API modules (auth, courses, lessons, quizzes, etc.)
│       ├── components/      # Reusable components (AuthModal, ProtectedRoute)
│       ├── context/         # Auth context/provider
│       └── pages/           # Route-level pages (Landing, dashboards, CourseDetail, CourseManage)
│
└── server/                 # Express backend
    ├── config/               # Database & Prisma client setup
    ├── controllers/          # Route handler logic
    ├── middleware/            # Auth & upload middleware
    ├── routes/                # Express route definitions
    ├── prisma/                # Prisma schema & migrations
    └── uploads/                # Uploaded file storage
```

---

## Database Schema (Overview)

The Prisma schema models an 11-entity relational structure:

`User` · `Course` · `Lesson` · `Enrollment` · `Progress` · `Quiz` · `Question` · `Submission` · `Certificate` · `Assignment` · `AssignmentSubmission`

Key relationships:
- A `Course` belongs to an instructor (`User`) and has many `Lesson`s and `Assignment`s
- A `Lesson` optionally has one `Quiz`, which has many `Question`s
- A `Student` enrolls in a `Course` (`Enrollment`), tracks per-lesson `Progress`, and submits `Submission`s for quizzes and assignments

---

## Getting Started

### Prerequisites
- Node.js (LTS)
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) instance)

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
```

Run migrations and start the server:
```bash
npx prisma migrate dev
npm run dev
```

### 3. Frontend setup
```bash
cd ../client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`, with the API running at `http://localhost:5000`.

---

## Roadmap

- [x] Authentication & role-based access
- [x] Course & lesson management
- [x] File uploads (PDF/PPTX/video links)
- [x] Enrollment system
- [x] Progress tracking
- [x] Quiz system with auto-grading
- [x] Assignment submission & review
- [x] Assignment grading UI (grade + feedback)
- [x] Certificate generation on course completion
- [x] Admin dashboard (user & course moderation)
- [x] AI features — quiz auto-generation, lesson summarizer, study assistant chatbot, course outline generator, personalized recommendations

---

## Author

Built by **Firoj Abdullah** as a capstone project at United International University (UIU).

## License

This project is currently unlicensed / for academic use. Add a license (e.g. MIT) here if you plan to open-source it.

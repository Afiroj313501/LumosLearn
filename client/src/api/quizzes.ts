import api from './axios';

export interface QuizQuestion {
  id?: string;
  text: string;
  type: 'MCQ' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  marks?: number;
}

export interface Quiz {
  id: string;
  title: string;
  lessonId: string;
  deadline?: string;
  questions: QuizQuestion[];
}

export interface QuizSubmission {
  id: string;
  score: number;
  answers: Record<string, string>;
  submittedAt: string;
}

export interface QuizReviewItem {
  id: string;
  text: string;
  type: 'MCQ' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  marks: number;
  studentAnswer: string;
  isCorrect: boolean;
}


export const getQuizByLesson = (lessonId: string) =>
  api.get<Quiz | null>(`/quizzes/lesson/${lessonId}`);

export const createQuiz = (lessonId: string, data: { title: string; questions: QuizQuestion[]; deadline?: string }) =>
  api.post<Quiz>(`/quizzes/lesson/${lessonId}`, data);

export const deleteQuiz = (id: string) => api.delete(`/quizzes/${id}`);

export const submitQuiz = (id: string, answers: Record<string, string>) =>
  api.post<{ score: number; correctCount: number; total: number; earnedMarks: number; totalMarks: number }>(`/quizzes/${id}/submit`, { answers });

export const forfeitQuiz = (quizId: string) =>
  api.post(`/quizzes/${quizId}/forfeit`);

export const getMyQuizSubmission = (id: string) =>
  api.get<QuizSubmission | null>(`/quizzes/${id}/my-submission`);

export const generateQuizAI = (lessonId: string, numQuestions?: number) =>
  api.post<{ questions: QuizQuestion[] }>(`/quizzes/lesson/${lessonId}/generate`, { numQuestions });

export const getQuizReview = (quizId: string) =>
  api.get<{ score: number; earnedMarks: number; totalMarks: number; review: QuizReviewItem[] }>(`/quizzes/${quizId}/review`);

export interface QuizResultRow {
  id: string;
  score: number;
  submittedAt: string;
  earnedMarks: number;
  totalMarks: number;
  student: { name: string; email: string };
}

export const getQuizResults = (quizId: string) =>
  api.get<QuizResultRow[]>(`/quizzes/${quizId}/results`);
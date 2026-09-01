import api from './axios';

export interface QuizQuestion {
  id?: string;
  text: string;
  type: 'MCQ' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
}

export interface Quiz {
  id: string;
  title: string;
  lessonId: string;
  questions: QuizQuestion[];
}

export interface QuizSubmission {
  id: string;
  score: number;
  answers: Record<string, string>;
  submittedAt: string;
}

export const getQuizByLesson = (lessonId: string) =>
  api.get<Quiz | null>(`/quizzes/lesson/${lessonId}`);

export const createQuiz = (lessonId: string, data: { title: string; questions: QuizQuestion[] }) =>
  api.post<Quiz>(`/quizzes/lesson/${lessonId}`, data);

export const deleteQuiz = (id: string) => api.delete(`/quizzes/${id}`);

export const submitQuiz = (id: string, answers: Record<string, string>) =>
  api.post<{ score: number; correctCount: number; total: number }>(`/quizzes/${id}/submit`, { answers });

export const getMyQuizSubmission = (id: string) =>
  api.get<QuizSubmission | null>(`/quizzes/${id}/my-submission`);

export const generateQuizAI = (lessonId: string, numQuestions?: number) =>
  api.post<{ questions: QuizQuestion[] }>(`/quizzes/lesson/${lessonId}/generate`, { numQuestions });
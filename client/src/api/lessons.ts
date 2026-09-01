import api from './axios';

export interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  fileUrl?: string;
  fileName?: string;
  order: number;
  courseId: string;
}

export const getLessonsByCourse = (courseId: string) =>
  api.get<Lesson[]>(`/lessons/course/${courseId}`);

export const createLesson = (courseId: string, data: Partial<Lesson>) =>
  api.post<Lesson>(`/lessons/course/${courseId}`, data);

export const deleteLesson = (id: string) => api.delete(`/lessons/${id}`);

export const summarizeLesson = (lessonId: string) =>
  api.get<{ summary: string }>(`/lessons/${lessonId}/summarize`);

export const updateLesson = (id: string, data: Partial<Lesson>) =>
  api.put<Lesson>(`/lessons/${id}`, data);
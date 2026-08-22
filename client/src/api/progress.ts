import api from './axios';

export interface ProgressResult {
  progressPct: number;
  completed: boolean;
}

export const markLessonComplete = (lessonId: string) =>
  api.post<ProgressResult>(`/progress/lesson/${lessonId}/complete`);

export const unmarkLessonComplete = (lessonId: string) =>
  api.post<ProgressResult>(`/progress/lesson/${lessonId}/uncomplete`);

export const getCourseProgress = (courseId: string) =>
  api.get<{ completedLessonIds: string[] }>(`/progress/course/${courseId}`);
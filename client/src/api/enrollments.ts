import api from './axios';

export interface Enrollment {
  id: string;
  enrolledAt: string;
  progressPct: number;
  completed: boolean;
  course: {
    id: string;
    title: string;
    description: string;
    category?: string;
    instructor: { name: string };
    lessons: any[];
  };
}

export const enrollInCourse = (courseId: string, enrollmentPassword?: string) =>
  api.post<Enrollment>('/enrollments', { courseId, enrollmentPassword });

export const getMyEnrollments = () => api.get<Enrollment[]>('/enrollments/mine');

export const checkEnrollment = (courseId: string) =>
  api.get<{ enrolled: boolean }>(`/enrollments/check/${courseId}`);
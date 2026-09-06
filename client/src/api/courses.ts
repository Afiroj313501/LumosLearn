import api from './axios';

export interface Course {
  id: string;
  title: string;
  description: string;
  category?: string;
  thumbnailUrl?: string;
  createdAt: string;
  lessons?: any[];
  enrollments?: any[];
  instructor?: { name: string };
  _count?: { lessons: number; enrollments: number };
  enrollmentPassword?: string;
  lessonsFinalized?: boolean;
}

export interface CourseEnrollment {
  id: string;
  enrolledAt: string;
  progressPct: number;
  completed: boolean;
  student: { name: string; email: string };
}

export const getMyCourses = () => api.get<Course[]>('/courses/mine');
export const getAllCourses = () => api.get<Course[]>('/courses');
export const getCourseById = (id: string) => api.get<Course>(`/courses/${id}`);
export const createCourse = (data: Partial<Course>) => api.post<Course>('/courses', data);
export const deleteCourse = (id: string) => api.delete(`/courses/${id}`);
export const exportGradesCSV = (courseId: string) =>
  api.get(`/courses/${courseId}/export-grades`, { responseType: 'blob' });
export const getCourseEnrollments = (courseId: string) =>
  api.get<CourseEnrollment[]>(`/courses/${courseId}/enrollments`);
export const setLessonsFinalized = (id: string, finalized: boolean) =>
  api.put<Course>(`/courses/${id}/finalize`, { finalized });
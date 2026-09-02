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
}

export const getMyCourses = () => api.get<Course[]>('/courses/mine');
export const getAllCourses = () => api.get<Course[]>('/courses');
export const getCourseById = (id: string) => api.get<Course>(`/courses/${id}`);
export const createCourse = (data: Partial<Course>) => api.post<Course>('/courses', data);
export const deleteCourse = (id: string) => api.delete(`/courses/${id}`);
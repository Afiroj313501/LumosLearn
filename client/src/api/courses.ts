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
}

export const getMyCourses = () => api.get<Course[]>('/courses/mine');
export const createCourse = (data: Partial<Course>) => api.post<Course>('/courses', data);
export const deleteCourse = (id: string) => api.delete(`/courses/${id}`);
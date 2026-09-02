import api from './axios';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  createdAt: string;
  _count: { coursesTaught: number; enrollments: number };
}

export interface AdminCourse {
  id: string;
  title: string;
  category?: string;
  createdAt: string;
  instructor: { name: string; email: string };
  _count: { enrollments: number; lessons: number };
}

export interface PlatformStats {
  userCount: number;
  courseCount: number;
  enrollmentCount: number;
  instructorCount: number;
  studentCount: number;
}

export const getPlatformStats = () => api.get<PlatformStats>('/admin/stats');
export const getAllUsers = () => api.get<AdminUser[]>('/admin/users');
export const updateUserRole = (id: string, role: string) =>
  api.put<AdminUser>(`/admin/users/${id}/role`, { role });
export const deleteUser = (id: string) => api.delete(`/admin/users/${id}`);
export const getAllCoursesAdmin = () => api.get<AdminCourse[]>('/admin/courses');
export const deleteCourseAdmin = (id: string) => api.delete(`/admin/courses/${id}`);
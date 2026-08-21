import api from './axios';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  fileUrl?: string;
  fileName?: string;
  courseId: string;
}

export interface Submission {
  id: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  student?: { name: string; email: string };
}

export const getAssignmentsByCourse = (courseId: string) =>
  api.get<Assignment[]>(`/assignments/course/${courseId}`);

export const createAssignment = (courseId: string, data: Partial<Assignment>) =>
  api.post<Assignment>(`/assignments/course/${courseId}`, data);

export const deleteAssignment = (id: string) => api.delete(`/assignments/${id}`);

export const getAssignmentSubmissions = (id: string) =>
  api.get<Submission[]>(`/assignments/${id}/submissions`);

export const submitAssignment = (id: string, data: { fileUrl: string; fileName: string }) =>
  api.post<Submission>(`/assignments/${id}/submit`, data);

export const getMySubmission = (id: string) =>
  api.get<Submission | null>(`/assignments/${id}/my-submission`);
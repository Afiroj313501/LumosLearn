import api from './axios';

export interface Certificate {
  id: string;
  issuedAt: string;
  fileUrl: string;
}

export const issueCertificate = (courseId: string) =>
  api.post<Certificate>(`/certificates/course/${courseId}`);

export const getMyCertificate = (courseId: string) =>
  api.get<Certificate | null>(`/certificates/course/${courseId}`);
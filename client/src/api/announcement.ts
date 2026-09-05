import api from './axios';

export interface Announcement {
  id: string;
  message: string;
  createdAt: string;
}

export const getAnnouncementsByCourse = (courseId: string) =>
  api.get<Announcement[]>(`/announcements/course/${courseId}`);

export const createAnnouncement = (courseId: string, message: string) =>
  api.post<Announcement>(`/announcements/course/${courseId}`, { message });

export const deleteAnnouncement = (id: string) => api.delete(`/announcements/${id}`);
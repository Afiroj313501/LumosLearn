import api from './axios';

export interface Notification {
  id: string;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export const getMyNotifications = () =>
  api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications');

export const markAllRead = () => api.put('/notifications/mark-read');
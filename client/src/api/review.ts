import api from './axios';

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  student: { name: string };
}

export const getCourseReviews = (courseId: string) =>
  api.get<{ reviews: Review[]; avgRating: number; count: number }>(`/reviews/course/${courseId}`);

export const createReview = (courseId: string, rating: number, comment?: string) =>
  api.post<Review>(`/reviews/course/${courseId}`, { rating, comment });

export const getMyReview = (courseId: string) =>
  api.get<Review | null>(`/reviews/course/${courseId}/mine`);
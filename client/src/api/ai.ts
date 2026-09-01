import api from './axios';

export interface OutlineModule {
  title: string;
  description: string;
}

export const generateOutline = (topic: string, numModules?: number) =>
  api.post<{ outline: OutlineModule[] }>('/ai/outline', { topic, numModules });

export interface RecommendedCourse {
  id: string;
  title: string;
  description: string;
  category?: string;
  reason: string;
}

export const getRecommendations = () =>
  api.get<{ recommendations: RecommendedCourse[] }>('/ai/recommendations');
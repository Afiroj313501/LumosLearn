import api from './axios';

export interface OutlineModule {
  title: string;
  description: string;
}

export const generateOutline = (topic: string, numModules?: number) =>
  api.post<{ outline: OutlineModule[] }>('/ai/outline', { topic, numModules });
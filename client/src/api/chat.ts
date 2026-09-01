import api from './axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const askAssistant = (courseId: string, message: string, history: ChatMessage[]) =>
  api.post<{ reply: string }>(`/chat/course/${courseId}`, { message, history });
import api from './axios';

export interface UploadResponse {
  fileUrl: string;
  fileName: string;
}

export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
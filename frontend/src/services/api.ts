/**
 * API service for communicating with the backend.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export interface UploadResponse {
  file_id: string;
  filename: string;
  width: number;
  height: number;
  size: number;
}

export interface HealthResponse {
  status: string;
  ai_models_enabled: boolean;
  device: string;
}

/**
 * Upload an image to the server.
 */
export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<UploadResponse>('/upload', formData);
  return response.data;
};

/**
 * Remove background from an image.
 */
export const removeBackground = async (file: File): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/remove-background', formData, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Inpaint (remove object) from an image.
 */
export const inpaintImage = async (
  image: File,
  mask: File,
  useAI: boolean = false,
  prompt: string = 'fill naturally'
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('mask', mask);
  formData.append('use_ai', String(useAI));
  formData.append('prompt', prompt);
  
  const response = await api.post('/inpaint', formData, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Apply a filter to an image.
 */
export const applyFilter = async (
  file: File,
  filterType: 'none' | 'blur' | 'sharpen' | 'edge' | 'grayscale'
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filter_type', filterType);
  
  const response = await api.post('/apply-filter', formData, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Adjust image brightness.
 */
export const adjustBrightness = async (
  file: File,
  factor: number
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('factor', String(factor));
  
  const response = await api.post('/adjust-brightness', formData, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Generate image from text prompt.
 */
export const generateImage = async (
  prompt: string,
  negativePrompt?: string,
  width: number = 512,
  height: number = 512
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  if (negativePrompt) {
    formData.append('negative_prompt', negativePrompt);
  }
  formData.append('width', String(width));
  formData.append('height', String(height));
  
  const response = await api.post('/generate-image', formData, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Check API health status.
 */
export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>('/health');
  return response.data;
};

export default api;

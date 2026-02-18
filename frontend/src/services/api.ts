/**
 * API service for communicating with the backend.
 * Advanced AI features support.
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

export interface StylePreset {
  id: string;
  name: string;
  description: string;
}

export interface AspectRatio {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface StylePresetsResponse {
  style_presets: StylePreset[];
  aspect_ratios: AspectRatio[];
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

// Adobe Firefly-like Features

/**
 * Get available style presets and aspect ratios.
 */
export const getStylePresets = async (): Promise<StylePresetsResponse> => {
  const response = await api.get<StylePresetsResponse>('/style-presets');
  return response.data;
};

/**
 * Generative Fill: AI-powered object insertion/replacement.
 */
export const generativeFill = async (
  image: File,
  mask: File,
  prompt: string,
  negativePrompt?: string,
  numInferenceSteps: number = 50,
  guidanceScale: number = 7.5
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('mask', mask);
  formData.append('prompt', prompt);
  if (negativePrompt) {
    formData.append('negative_prompt', negativePrompt);
  }
  formData.append('num_inference_steps', String(numInferenceSteps));
  formData.append('guidance_scale', String(guidanceScale));

  const response = await api.post('/generative-fill', formData, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Outpaint: Extend image borders with AI.
 */
export const outpaintImage = async (
  image: File,
  direction: 'left' | 'right' | 'top' | 'bottom' | 'all',
  expandPixels: number = 256,
  prompt?: string,
  numInferenceSteps: number = 50
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('direction', direction);
  formData.append('expand_pixels', String(expandPixels));
  if (prompt) {
    formData.append('prompt', prompt);
  }
  formData.append('num_inference_steps', String(numInferenceSteps));

  const response = await api.post('/outpaint', formData, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Generate text with artistic effects.
 */
export const generateTextEffect = async (
  text: string,
  style: string = '3d metallic',
  width: number = 512,
  height: number = 512,
  numInferenceSteps: number = 50
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('style', style);
  formData.append('width', String(width));
  formData.append('height', String(height));
  formData.append('num_inference_steps', String(numInferenceSteps));

  const response = await api.post('/text-effect', formData, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Apply style transfer to an image.
 */
export const applyStyleTransfer = async (
  image: File,
  stylePrompt: string,
  strength: number = 0.75,
  numInferenceSteps: number = 50
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('style_prompt', stylePrompt);
  formData.append('strength', String(strength));
  formData.append('num_inference_steps', String(numInferenceSteps));

  const response = await api.post('/style-transfer', formData, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Generate image with style presets and aspect ratios (Enhanced text-to-image).
 */
export const generateWithStyle = async (
  prompt: string,
  stylePreset: string = 'none',
  negativePrompt?: string,
  aspectRatio: string = '1:1',
  numInferenceSteps: number = 50,
  guidanceScale: number = 7.5,
  seed?: number
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('style_preset', stylePreset);
  if (negativePrompt) {
    formData.append('negative_prompt', negativePrompt);
  }
  formData.append('aspect_ratio', aspectRatio);
  formData.append('num_inference_steps', String(numInferenceSteps));
  formData.append('guidance_scale', String(guidanceScale));
  if (seed !== undefined) {
    formData.append('seed', String(seed));
  }

  const response = await api.post('/generate-with-style', formData, {
    responseType: 'blob',
  });
  return response.data;
};

export default api;

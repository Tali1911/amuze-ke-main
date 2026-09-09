
import api from './apiService';

export interface Feature {
  _id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  updatedBy: string;
  updatedAt: string;
}

// Get all features
export const getFeatures = async (): Promise<Feature[]> => {
  const response = await api.get('/features');
  return response.data.data;
};

// Get feature by ID
export const getFeature = async (id: string): Promise<Feature> => {
  const response = await api.get(`/features/${id}`);
  return response.data.data;
};

// Toggle feature status
export const toggleFeature = async (id: string): Promise<Feature> => {
  const response = await api.patch(`/features/${id}/toggle`);
  return response.data.data;
};

// Update feature (for super admins only)
export const updateFeature = async (id: string, featureData: Partial<Feature>): Promise<Feature> => {
  const response = await api.put(`/features/${id}`, featureData);
  return response.data.data;
};

// Initialize default features (for super admins only)
export const initializeFeatures = async (): Promise<Feature[]> => {
  const response = await api.post('/features/init');
  return response.data.data;
};

// Utility functions to handle local storage for when API is not available
export const setLocalFeature = (key: string, enabled: boolean): void => {
  localStorage.setItem(key, JSON.stringify(enabled));
};

export const getLocalFeature = (key: string, defaultValue: boolean): boolean => {
  const value = localStorage.getItem(key);
  return value !== null ? JSON.parse(value) : defaultValue;
};

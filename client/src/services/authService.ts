import api from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', credentials);
    return data.data;
  },

  async register(userData: { name: string; email: string; password: string; phone?: string }): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', userData);
    return data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Silent fail - still clear locally
    }
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },

  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/verify-email', { token });
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get('/auth/profile');
    return data.data;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data } = await api.put('/auth/profile', updates);
    return data.data;
  },

  async googleAuth(token: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/google', { token });
    return data.data;
  },
};

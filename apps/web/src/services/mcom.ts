import api from '../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const mcomService = {
  async startLogin(): Promise<void> {
    try {
      const response = await api.get('/auth/sso/config');
      if (response.data.configured) {
        window.location.href = `${API_URL}/api/v1/auth/sso/login`;
      } else {
        throw new Error('MCOM SSO not configured');
      }
    } catch (error) {
      console.error('Failed to start MCOM login:', error);
      throw error;
    }
  },

  async completeLogin(code: string, state: string): Promise<any> {
    const response = await api.post('/auth/sso/complete', { code, state });
    return response.data;
  },

  async refreshSession(userId: number): Promise<any> {
    const response = await api.post('/auth/sso/refresh', { userId });
    return response.data;
  },

  async getStatus(userId: number, sync: boolean = false): Promise<any> {
    const response = await api.get(`/auth/sso/status/${userId}?sync=${sync}`);
    return response.data;
  },

  async completeHandshake(token: string): Promise<any> {
    const response = await api.post('/auth/sso/complete-handshake', { token });
    return response.data;
  },
};

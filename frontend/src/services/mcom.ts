import api from '../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const mcomService = {
  /** Ask the API whether MCOM is configured, then send the browser to MCOM. */
  async startLogin(): Promise<void> {
    const response = await api.get('/auth/sso/config');
    if (response.data.configured) {
      window.location.href = `${API_URL}/api/auth/sso/login`;
    } else {
      throw new Error('MCOM SSO not configured');
    }
  },

  async refreshSession(userId: number): Promise<any> {
    const response = await api.post('/auth/sso/refresh', { userId });
    return response.data;
  },

  async getStatus(userId: number, sync = false): Promise<any> {
    const response = await api.get(`/auth/sso/status/${userId}?sync=${sync}`);
    return response.data;
  },
};

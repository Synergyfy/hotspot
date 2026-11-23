import api from './index';

export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
};

export const ssoApi = {
  getConfig: () => api.get('/auth/sso/config'),

  async startLogin(): Promise<void> {
    const [configResponse, healthResponse] = await Promise.all([
      api.get('/auth/sso/config'),
      api.get('/auth/sso/health'),
    ]);
    if (!configResponse.data?.configured) {
      throw new Error('Shared sign-in is not configured');
    }
    if (healthResponse.data?.reachable === false) {
      throw new Error('MCOM Central is currently unavailable. Please try again shortly.');
    }

    const baseUrl = (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, '') || '';
    window.location.assign(`${baseUrl}/api/auth/sso/login`);
  },

  complete: (code: string, state: string) => api.post('/auth/sso/complete', { code, state }),
  completeHandshake: (token: string) => api.post('/auth/sso/complete-handshake', { token }),
};

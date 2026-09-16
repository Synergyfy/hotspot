import api from './index';

export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
};

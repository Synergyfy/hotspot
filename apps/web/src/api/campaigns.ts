import api from './index';

export const campaignsApi = {
  findAll: () => api.get('/campaigns'),
  findOne: (id: number | string) => api.get(`/campaigns/${id}`),
  create: (data: any) => api.post('/campaigns', data),
  update: (id: number | string, data: any) => api.patch(`/campaigns/${id}`, data),
  remove: (id: number | string) => api.delete(`/campaigns/${id}`),
  getPublic: (id: number | string) => api.get(`/public/campaigns/${id}`),
};

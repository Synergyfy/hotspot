import api from './index';

export const publicApi = {
  getCampaign: (id: number | string) => api.get(`/public/campaigns/${id}`),
};

export const analyticsApi = {
  logEvent: (campaignId: number | string, data: any) => api.post(`/analytics/${campaignId}/log`, data),
  getStats: (campaignId: number | string) => api.get(`/analytics/${campaignId}`),
};

export const leadsApi = {
  findAll: (campaignId?: number | string) =>
    campaignId ? api.get(`/leads?campaignId=${campaignId}`) : api.get('/leads'),
  create: (data: any) => api.post('/leads', data),
};

export const domainsApi = {
  findAll: () => api.get('/domains'),
  create: (data: { name: string }) => api.post('/domains', data),
  remove: (id: number | string) => api.delete(`/domains/${id}`),
  verify: (id: number | string) => api.post(`/domains/${id}/verify`),
};

export const uploadsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

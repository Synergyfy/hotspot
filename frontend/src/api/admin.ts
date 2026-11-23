import api from './index';

export const adminApi = {
  getOverview: () => api.get('/admin/overview'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id: string | number, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  getCampaigns: () => api.get('/admin/campaigns'),
  deleteCampaign: (id: string | number) => api.delete(`/admin/campaigns/${id}`),
  getLeads: () => api.get('/admin/leads'),
  deleteLead: (id: string | number) => api.delete(`/admin/leads/${id}`),
  getDomains: () => api.get('/admin/domains'),
  deleteDomain: (id: string | number) => api.delete(`/admin/domains/${id}`),
};

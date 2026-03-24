import { http } from './http';

export const adminApi = {
  me: () => http.get('/api/me'),
  login: (payload) => http.post('/api/admin/login', payload),
  logout: () => http.post('/api/logout', {}),

  dashboard: () => http.get('/api/admin/dashboard'),

  posts: (status) => http.get(`/api/admin/posts${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  postDetail: (postId) => http.get(`/api/admin/posts/${postId}`),
  approvePost: (postId) => http.post(`/api/admin/posts/${postId}/approve`, {}),
  rejectPost: (postId, reason = '') => http.post(`/api/admin/posts/${postId}/reject`, { reason }),
  deletePost: (postId) => http.delete(`/api/admin/posts/${postId}`),

  users: () => http.get('/api/admin/users'),
  userDetail: (ownerId) => http.get(`/api/admin/owners/${ownerId}`),
  banOwner: (ownerId, reason = '') => http.post(`/api/admin/owners/${ownerId}/ban`, { reason }),
  unbanOwner: (ownerId, reason = '') => http.post(`/api/admin/owners/${ownerId}/unban`, { reason }),

  pets: () => http.get('/api/admin/pets'),
  petDetail: (petId) => http.get(`/api/admin/pets/${petId}`),

  reports: () => http.get('/api/admin/reports'),
  reportDetail: (reportId) => http.get(`/api/admin/reports/${reportId}`),
  resolveReport: (reportId, resolution = 'resolved by admin', actionType = '') => http.post(`/api/admin/reports/${reportId}/resolve`, { resolution, actionType }),

  config: () => http.get('/api/admin/config'),
  patchConfig: (payload) => http.patch('/api/admin/config', payload),

  audits: () => http.get('/api/admin/audits'),
  auditDetail: (auditId) => http.get(`/api/admin/audits/${auditId}`),

  comments: () => http.get('/api/admin/comments'),
  deleteComment: (commentId) => http.delete(`/api/admin/comments/${commentId}`)
};

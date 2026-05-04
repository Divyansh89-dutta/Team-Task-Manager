import axios from 'axios';
import toast from 'react-hot-toast';
import {
  mockAuthApi, mockProjectApi, mockTaskApi,
  mockDashboardApi, mockNotificationApi, mockUserApi,
} from './mockApi';

const isDemoMode = () => localStorage.getItem('demo_mode') === 'true';
const backendOrigin = (import.meta.env.VITE_API_URL || 'https://projecttask-production-9c58.up.railway.app').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${backendOrigin}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg = error.response?.data?.message || 'Something went wrong';

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject({ ...error, message: msg });
  }
);

export const authApi = {
  register: (data) => isDemoMode() ? mockAuthApi.register(data) : api.post('/auth/register', data),
  login: (data) => isDemoMode() ? mockAuthApi.login(data) : api.post('/auth/login', data),
  getMe: () => isDemoMode() ? mockAuthApi.getMe() : api.get('/auth/me'),
  updateMe: (data) => isDemoMode() ? mockAuthApi.updateMe(data) : api.patch('/auth/me', data),
};

export const projectApi = {
  getAll: (params) => isDemoMode() ? mockProjectApi.getAll(params) : api.get('/projects', { params }),
  getById: (id) => isDemoMode() ? mockProjectApi.getById(id) : api.get(`/projects/${id}`),
  create: (data) => isDemoMode() ? mockProjectApi.create(data) : api.post('/projects', data),
  update: (id, data) => isDemoMode() ? mockProjectApi.update(id, data) : api.put(`/projects/${id}`, data),
  delete: (id) => isDemoMode() ? mockProjectApi.delete(id) : api.delete(`/projects/${id}`),
  getStats: (id) => isDemoMode() ? mockProjectApi.getStats(id) : api.get(`/projects/${id}/stats`),
  addMember: (id, data) => isDemoMode() ? mockProjectApi.addMember(id, data) : api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => isDemoMode() ? mockProjectApi.removeMember(id, userId) : api.delete(`/projects/${id}/members/${userId}`),
};

export const taskApi = {
  getAll: (params) => isDemoMode() ? mockTaskApi.getAll(params) : api.get('/tasks', { params }),
  getById: (id) => isDemoMode() ? mockTaskApi.getById(id) : api.get(`/tasks/${id}`),
  create: (data) => isDemoMode() ? mockTaskApi.create(data) : api.post('/tasks', data),
  update: (id, data) => isDemoMode() ? mockTaskApi.update(id, data) : api.patch(`/tasks/${id}`, data),
  delete: (id) => isDemoMode() ? mockTaskApi.delete(id) : api.delete(`/tasks/${id}`),
  reorder: (data) => isDemoMode() ? mockTaskApi.reorder(data) : api.post('/tasks/reorder', data),
  addComment: (id, data) => isDemoMode() ? mockTaskApi.addComment(id, data) : api.post(`/tasks/${id}/comments`, data),
};

export const dashboardApi = {
  getStats: () => isDemoMode() ? mockDashboardApi.getStats() : api.get('/dashboard/stats'),
  getMyTasks: (params) => isDemoMode() ? mockDashboardApi.getMyTasks(params) : api.get('/dashboard/my-tasks', { params }),
};

export const notificationApi = {
  getAll: (params) => isDemoMode() ? mockNotificationApi.getAll(params) : api.get('/notifications', { params }),
  markAsRead: (id) => isDemoMode() ? mockNotificationApi.markAsRead(id) : api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => isDemoMode() ? mockNotificationApi.markAllAsRead() : api.patch('/notifications/read-all'),
  delete: (id) => isDemoMode() ? mockNotificationApi.delete(id) : api.delete(`/notifications/${id}`),
};

export const userApi = {
  getAll: (params) => isDemoMode() ? mockUserApi.getAll(params) : api.get('/users', { params }),
  getById: (id) => isDemoMode() ? mockUserApi.getById(id) : api.get(`/users/${id}`),
  update: (id, data) => isDemoMode() ? mockUserApi.update(id, data) : api.patch(`/users/${id}`, data),
};

export default api;

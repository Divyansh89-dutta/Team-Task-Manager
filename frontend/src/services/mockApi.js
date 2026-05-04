import { mockUser, mockProjects, mockTasks, mockNotifications } from './mockData';

const ok = (data) => Promise.resolve({ data: { success: true, data } });
const DEMO_USER_KEY = 'demo_user';

const getDemoUser = () => {
  const raw = localStorage.getItem(DEMO_USER_KEY);
  if (!raw) return { ...mockUser };
  try {
    return { ...mockUser, ...JSON.parse(raw) };
  } catch {
    return { ...mockUser };
  }
};

const setDemoUser = (user) => {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
};

export const mockAuthApi = {
  register: async () => {
    const user = getDemoUser();
    setDemoUser(user);
    return { data: { success: true, token: 'demo-token', data: { user } } };
  },
  login: async () => {
    const user = getDemoUser();
    setDemoUser(user);
    return { data: { success: true, token: 'demo-token', data: { user } } };
  },
  getMe: async () => ({ data: { success: true, data: { user: getDemoUser() } } }),
  updateMe: async (updates) => {
    const current = getDemoUser();
    const user = {
      ...current,
      ...updates,
      preferences: { ...current.preferences, ...(updates.preferences || {}) },
    };
    setDemoUser(user);
    return { data: { success: true, data: { user } } };
  },
};

export const mockProjectApi = {
  getAll: async () => ok({ projects: mockProjects, pagination: { total: 0 } }),
  getById: async () => ok({ project: null }),
  create: async () => ok({ project: null }),
  update: async () => ok({ project: null }),
  delete: async () => ok({}),
  getStats: async () => ok({ totalTasks: 0, completedTasks: 0, progress: 0 }),
  addMember: async () => ok({}),
  removeMember: async () => ok({}),
};

export const mockTaskApi = {
  getAll: async () => ok({ tasks: mockTasks, pagination: { total: 0 } }),
  getById: async () => ok({ task: null }),
  create: async () => ok({ task: null }),
  update: async () => ok({ task: null }),
  delete: async () => ok({}),
  reorder: async () => ok({}),
  addComment: async () => ok({}),
};

export const mockDashboardApi = {
  getStats: async () => ok({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    activeProjects: 0,
  }),
  getMyTasks: async () => ok({ tasks: [] }),
};

export const mockNotificationApi = {
  getAll: async () => ok({ notifications: mockNotifications, pagination: { total: 0 } }),
  markAsRead: async () => ok({}),
  markAllAsRead: async () => ok({}),
  delete: async () => ok({}),
};

export const mockUserApi = {
  getAll: async () => ok({ users: [getDemoUser()], pagination: { total: 1 } }),
  getById: async () => ok({ user: getDemoUser() }),
  update: async () => ok({ user: getDemoUser() }),
};

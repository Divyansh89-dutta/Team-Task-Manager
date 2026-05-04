import { create } from 'zustand';
import { notificationApi } from '../services/api';
import useUIStore from './uiStore';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await notificationApi.getAll({ limit: 50, ...params });
      const { notifications, unreadCount } = data.data;
      set({ notifications, unreadCount, isLoading: false });
      useUIStore.getState().setUnreadCount(unreadCount);
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
      useUIStore.getState().decrementUnread();
    } catch {}
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
      useUIStore.getState().setUnreadCount(0);
    } catch {}
  },

  deleteNotification: async (id) => {
    try {
      await notificationApi.delete(id);
      const wasUnread = !get().notifications.find((n) => n._id === id)?.read;
      set((state) => ({
        notifications: state.notifications.filter((n) => n._id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }));
    } catch {}
  },

  addFromSocket: (notification) => {
    set((state) => ({
      notifications: [{ ...notification, read: false }, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
    useUIStore.getState().setUnreadCount(get().unreadCount);
  },
}));

export default useNotificationStore;

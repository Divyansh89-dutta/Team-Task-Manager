import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      taskModalOpen: false,
      taskModalData: null,
      notificationsOpen: false,
      unreadCount: 0,
      activeView: 'kanban',

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

      openTaskModal: (data = null) => set({ taskModalOpen: true, taskModalData: data }),
      closeTaskModal: () => set({ taskModalOpen: false, taskModalData: null }),

      toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),
      closeNotifications: () => set({ notificationsOpen: false }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      decrementUnread: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),

      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'ui-storage',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, activeView: s.activeView }),
    }
  )
);

export default useUIStore;

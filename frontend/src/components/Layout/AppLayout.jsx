import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import CommandPalette from '../CommandPalette';
import TaskModal from '../Tasks/TaskModal';
import NotificationPanel from '../Notifications/NotificationPanel';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import useProjectStore from '../../store/projectStore';
import useNotificationStore from '../../store/notificationStore';
import useTaskStore from '../../store/taskStore';
import { getSocket, initSocket } from '../../services/socket';
import { useKeyboardShortcuts } from '../../hooks/useKeyboard';

const AppLayout = () => {
  const { isAuthenticated, token, user } = useAuthStore();
  const { commandPaletteOpen, taskModalOpen, notificationsOpen } = useUIStore();
  const { fetchProjects } = useProjectStore();
  const { fetchNotifications, addFromSocket } = useNotificationStore();
  const { addTaskFromSocket, updateTaskFromSocket, removeTaskFromSocket } = useTaskStore();
  const navigate = useNavigate();

  useKeyboardShortcuts();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }

    fetchProjects();
    fetchNotifications();

    const socket = token ? initSocket(token) : getSocket();
    if (!socket) return;

    socket.on('notification:new', (notification) => {
      addFromSocket(notification);
      // Non-intrusive pop-up — skip if it's self-triggered
      if (notification.message) {
        toast(notification.message, {
          icon: '🔔',
          duration: 3500,
          style: {
            background: '#1a1a1a',
            color: '#e5e5e5',
            border: '1px solid #2e2e2e',
            fontSize: '12px',
            maxWidth: '320px',
          },
        });
      }
    });

    socket.on('task:created', ({ task }) => addTaskFromSocket(task));
    socket.on('task:updated', ({ task }) => updateTaskFromSocket(task));
    socket.on('task:deleted', ({ taskId }) => removeTaskFromSocket(taskId));

    return () => {
      socket.off('notification:new');
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [isAuthenticated, token]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-background-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <motion.main
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-hidden"
        >
          <Outlet />
        </motion.main>
      </div>
      {commandPaletteOpen && <CommandPalette />}
      {taskModalOpen && <TaskModal />}
      {notificationsOpen && <NotificationPanel />}
    </div>
  );
};

export default AppLayout;

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, X, BellOff } from 'lucide-react';
import { cn, timeAgo } from '../../utils/helpers';
import useUIStore from '../../store/uiStore';
import useNotificationStore from '../../store/notificationStore';
import useTaskStore from '../../store/taskStore';
import Avatar from '../UI/Avatar';
import { taskApi } from '../../services/api';

const TYPE_ICON = {
  task_assigned: '📌',
  task_status_changed: '🔄',
  task_due_soon: '⏰',
  project_invitation: '👥',
  mention: '💬',
  task_comment: '💬',
};

const NotificationItem = ({ notification, onRead, onDelete, onClick }) => (
  <motion.div
    initial={{ opacity: 0, x: 8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 8, height: 0 }}
    transition={{ duration: 0.18 }}
    onClick={() => onClick(notification)}
    className={cn(
      'flex items-start gap-3 px-4 py-3 transition-colors group relative cursor-pointer',
      'hover:bg-surface-hover',
      !notification.read && 'bg-accent/5'
    )}
  >
    {/* Unread dot */}
    {!notification.read && (
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
    )}

    {/* Avatar + type icon */}
    <div className="relative flex-shrink-0 mt-0.5">
      <Avatar user={notification.actor} size="sm" />
      <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none select-none">
        {TYPE_ICON[notification.type] || '🔔'}
      </span>
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <p className={cn(
        'text-xs leading-snug',
        notification.read ? 'text-text-secondary' : 'font-medium text-text-primary'
      )}>
        {notification.message}
      </p>
      {notification.project?.name && (
        <p className="text-2xs text-text-tertiary mt-0.5 truncate">
          {notification.project.name}
        </p>
      )}
      <p className="text-2xs text-text-tertiary mt-1">{timeAgo(notification.createdAt)}</p>
    </div>

    {/* Actions (visible on hover) */}
    <div
      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      {!notification.read && (
        <button
          onClick={() => onRead(notification._id)}
          className="p-1 rounded hover:bg-surface text-text-tertiary hover:text-accent transition-colors"
          title="Mark as read"
        >
          <Check size={11} />
        </button>
      )}
      <button
        onClick={() => onDelete(notification._id)}
        className="p-1 rounded hover:bg-surface text-text-tertiary hover:text-red-400 transition-colors"
        title="Delete"
      >
        <Trash2 size={11} />
      </button>
    </div>
  </motion.div>
);

const NotificationPanel = () => {
  const { notificationsOpen, closeNotifications, openTaskModal } = useUIStore();
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const panelRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (notificationsOpen) fetchNotifications({ limit: 50 });
  }, [notificationsOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.closest('[data-bell-button]')) return;
      if (!panelRef.current?.contains(e.target)) closeNotifications();
    };
    if (notificationsOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notificationsOpen]);

  const handleClick = async (notification) => {
    if (!notification.read) markAsRead(notification._id);
    closeNotifications();

    const taskId = notification.task?._id || (typeof notification.task === 'string' ? notification.task : null);
    const projectId = notification.project?._id || (typeof notification.project === 'string' ? notification.project : null);

    if (taskId) {
      try {
        const { data } = await taskApi.getById(taskId);
        openTaskModal(data.data.task);
      } catch {
        if (projectId) navigate(`/projects/${projectId}`);
      }
    } else if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  const unread = notifications.filter(n => !n.read);

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="fixed top-[52px] right-4 w-80 bg-background-elevated border border-border rounded-xl shadow-elevation-3 overflow-hidden z-[200]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell size={13} className="text-text-secondary" />
              <h3 className="text-xs font-semibold text-text-primary">Notifications</h3>
              {unread.length > 0 && (
                <span className="text-2xs bg-accent text-white rounded-full px-1.5 py-0.5 leading-none font-medium">
                  {unread.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unread.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-2xs text-accent hover:text-accent-hover transition-colors"
                >
                  <CheckCheck size={11} />
                  Mark all read
                </button>
              )}
              <button onClick={closeNotifications} className="p-0.5 rounded hover:bg-surface text-text-tertiary">
                <X size={12} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border no-scrollbar">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3">
                  <div className="skeleton w-7 h-7 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-2.5 w-1/4 rounded" />
                  </div>
                </div>
              ))
            ) : notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-text-tertiary"
              >
                <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-3">
                  <BellOff size={18} className="opacity-40" />
                </div>
                <p className="text-xs font-medium text-text-secondary mb-1">You're all caught up!</p>
                <p className="text-2xs text-text-tertiary">No new notifications right now</p>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {notifications.map((n) => (
                  <NotificationItem
                    key={n._id}
                    notification={n}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={handleClick}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border">
              <p className="text-2xs text-text-tertiary text-center">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                {unread.length > 0 && ` · ${unread.length} unread`}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;

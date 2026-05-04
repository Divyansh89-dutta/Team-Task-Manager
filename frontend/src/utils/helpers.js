import { formatDistanceToNow, format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { clsx } from 'clsx';

export const cn = (...classes) => clsx(...classes);

export const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
};

export const formatDateTime = (date) => {
  if (!date) return null;
  return format(new Date(date), 'MMM d, yyyy HH:mm');
};

export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '…' : str;
};

export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, no_priority: 4 };

export const sortByPriority = (tasks) =>
  [...tasks].sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));

export const groupBy = (array, key) =>
  array.reduce((acc, item) => {
    const group = typeof key === 'function' ? key(item) : item[key];
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

export const isOverdue = (dueDate, status) =>
  dueDate && status !== 'done' && new Date() > new Date(dueDate);

export const generateId = () => Math.random().toString(36).slice(2, 11);

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

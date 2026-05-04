import { io } from 'socket.io-client';

let socket = null;
const backendOrigin = (import.meta.env.VITE_BACKEND_URL || 'https://projecttask-production-9c58.up.railway.app').replace(/\/$/, '');

export const initSocket = (token) => {
  if (socket?.connected) return socket;
  socket = io(backendOrigin, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => console.debug('[Socket] Connected:', socket.id));
  socket.on('disconnect', (reason) => console.debug('[Socket] Disconnected:', reason));
  socket.on('connect_error', (err) => console.warn('[Socket] Error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinProject = (projectId) => socket?.emit('project:join', projectId);
export const leaveProject = (projectId) => socket?.emit('project:leave', projectId);

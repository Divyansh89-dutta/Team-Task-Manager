import { useEffect } from 'react';
import { getSocket, joinProject, leaveProject } from '../services/socket';

export const useProjectRoom = (projectId) => {
  useEffect(() => {
    if (!projectId) return;
    joinProject(projectId);
    return () => leaveProject(projectId);
  }, [projectId]);
};

export const useSocketEvent = (event, handler, deps = []) => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [event, ...deps]);
};

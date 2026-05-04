import { create } from 'zustand';
import { projectApi } from '../services/api';
import toast from 'react-hot-toast';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  pagination: null,

  fetchProjects: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await projectApi.getAll(params);
      set({ projects: data.data.projects, pagination: data.data.pagination, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await projectApi.getById(id);
      set({ currentProject: data.data.project, isLoading: false });
      return data.data.project;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  createProject: async (projectData) => {
    try {
      const { data } = await projectApi.create(projectData);
      const project = data.data.project;
      set((state) => ({ projects: [project, ...state.projects] }));
      toast.success('Project created');
      return { success: true, project };
    } catch (err) {
      toast.error(err.message);
      return { success: false };
    }
  },

  updateProject: async (id, updates) => {
    try {
      const { data } = await projectApi.update(id, updates);
      const updated = data.data.project;
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? updated : p)),
        currentProject: state.currentProject?._id === id ? updated : state.currentProject,
      }));
      toast.success('Project updated');
      return { success: true };
    } catch (err) {
      toast.error(err.message);
      return { success: false };
    }
  },

  deleteProject: async (id) => {
    try {
      await projectApi.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        currentProject: state.currentProject?._id === id ? null : state.currentProject,
      }));
      toast.success('Project deleted');
      return { success: true };
    } catch (err) {
      toast.error(err.message);
      return { success: false };
    }
  },

  addMember: async (projectId, email, role = 'member') => {
    try {
      const { data } = await projectApi.addMember(projectId, { email, role });
      const updated = data.data.project;
      set((state) => ({
        projects: state.projects.map((p) => (p._id === projectId ? updated : p)),
        currentProject: state.currentProject?._id === projectId ? updated : state.currentProject,
      }));
      toast.success('Member added');
      return { success: true };
    } catch (err) {
      toast.error(err.message);
      return { success: false };
    }
  },

  removeMember: async (projectId, userId) => {
    try {
      await projectApi.removeMember(projectId, userId);
      set((state) => ({
        projects: state.projects.map((p) =>
          p._id === projectId
            ? { ...p, members: p.members.filter((m) => m.user._id !== userId) }
            : p
        ),
      }));
      toast.success('Member removed');
      return { success: true };
    } catch (err) {
      toast.error(err.message);
      return { success: false };
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  updateProjectSocket: (project) => {
    set((state) => ({
      projects: state.projects.map((p) => (p._id === project._id ? project : p)),
      currentProject: state.currentProject?._id === project._id ? project : state.currentProject,
    }));
  },
}));

export default useProjectStore;

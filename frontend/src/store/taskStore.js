import { create } from 'zustand';
import { taskApi } from '../services/api';
import { KANBAN_COLUMNS } from '../utils/constants';
import toast from 'react-hot-toast';

const useTaskStore = create((set, get) => ({
  tasks: [],
  kanbanTasks: {},
  selectedTask: null,
  isLoading: false,
  pagination: null,
  filters: { status: [], priority: [], assignee: '', search: '' },

  fetchTasks: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await taskApi.getAll(params);
      const tasks = data.data.tasks;
      set({ tasks, pagination: data.data.pagination, isLoading: false });
      get().buildKanban(tasks);
    } catch {
      set({ isLoading: false });
    }
  },

  buildKanban: (tasks) => {
    const kanban = KANBAN_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: [] }), {});
    tasks.forEach((task) => {
      if (kanban[task.status]) {
        kanban[task.status].push(task);
      }
    });
    Object.keys(kanban).forEach((col) => {
      kanban[col].sort((a, b) => a.order - b.order);
    });
    set({ kanbanTasks: kanban });
  },

  fetchTask: async (id) => {
    try {
      const { data } = await taskApi.getById(id);
      return data.data.task;
    } catch {
      return null;
    }
  },

  createTask: async (taskData) => {
    try {
      const { data } = await taskApi.create(taskData);
      const task = data.data.task;
      set((state) => {
        const tasks = [task, ...state.tasks];
        const kanban = { ...state.kanbanTasks };
        if (kanban[task.status]) {
          kanban[task.status] = [task, ...kanban[task.status]];
        }
        return { tasks, kanbanTasks: kanban };
      });
      toast.success('Task created');
      return { success: true, task };
    } catch (err) {
      toast.error(err.message);
      return { success: false };
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { data } = await taskApi.update(id, updates);
      const updated = data.data.task;
      set((state) => {
        const tasks = state.tasks.map((t) => (t._id === id ? updated : t));
        const kanban = { ...state.kanbanTasks };
        Object.keys(kanban).forEach((col) => {
          kanban[col] = kanban[col].filter((t) => t._id !== id);
        });
        if (kanban[updated.status]) {
          kanban[updated.status] = [...kanban[updated.status], updated]
            .sort((a, b) => a.order - b.order);
        }
        return { tasks, kanbanTasks: kanban, selectedTask: state.selectedTask?._id === id ? updated : state.selectedTask };
      });
      return { success: true, task: updated };
    } catch (err) {
      toast.error(err.message);
      return { success: false };
    }
  },

  deleteTask: async (id) => {
    try {
      await taskApi.delete(id);
      set((state) => {
        const kanban = { ...state.kanbanTasks };
        Object.keys(kanban).forEach((col) => {
          kanban[col] = kanban[col].filter((t) => t._id !== id);
        });
        return {
          tasks: state.tasks.filter((t) => t._id !== id),
          kanbanTasks: kanban,
          selectedTask: state.selectedTask?._id === id ? null : state.selectedTask,
        };
      });
      toast.success('Task deleted');
      return { success: true };
    } catch (err) {
      toast.error(err.message);
      return { success: false };
    }
  },

  reorderTasks: async (sourceCol, destCol, sourceIndex, destIndex, projectId) => {
    const kanban = { ...get().kanbanTasks };
    const sourceTasks = [...(kanban[sourceCol] || [])];
    const destTasks = sourceCol === destCol ? sourceTasks : [...(kanban[destCol] || [])];

    const [movedTask] = sourceTasks.splice(sourceIndex, 1);
    const updatedTask = { ...movedTask, status: destCol };
    destTasks.splice(destIndex, 0, updatedTask);

    const newKanban = { ...kanban, [sourceCol]: sourceTasks };
    if (sourceCol !== destCol) newKanban[destCol] = destTasks;

    set({ kanbanTasks: newKanban });

    const reorderPayload = destTasks.map((t, i) => ({
      id: t._id,
      order: i,
      status: destCol,
    }));

    try {
      await taskApi.reorder({ tasks: reorderPayload, projectId });
    } catch {
      get().buildKanban(get().tasks);
    }
  },

  setSelectedTask: (task) => set({ selectedTask: task }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: { status: [], priority: [], assignee: '', search: '' } }),

  addTaskFromSocket: (task) => {
    set((state) => {
      const existsInTasks = state.tasks.some((t) => t._id === task._id);
      const existsInKanban = Object.values(state.kanbanTasks).some((col) =>
        col.some((t) => t._id === task._id)
      );
      if (existsInTasks || existsInKanban) return state;
      const kanban = { ...state.kanbanTasks };
      if (kanban[task.status]) kanban[task.status] = [...kanban[task.status], task];
      return { tasks: [task, ...state.tasks], kanbanTasks: kanban };
    });
  },

  updateTaskFromSocket: (task) => {
    set((state) => {
      const kanban = { ...state.kanbanTasks };
      Object.keys(kanban).forEach((col) => {
        kanban[col] = kanban[col].filter((t) => t._id !== task._id);
      });
      if (kanban[task.status]) kanban[task.status] = [...kanban[task.status], task].sort((a, b) => a.order - b.order);
      return {
        tasks: state.tasks.map((t) => (t._id === task._id ? task : t)),
        kanbanTasks: kanban,
      };
    });
  },

  removeTaskFromSocket: (taskId) => {
    set((state) => {
      const kanban = { ...state.kanbanTasks };
      Object.keys(kanban).forEach((col) => {
        kanban[col] = kanban[col].filter((t) => t._id !== taskId);
      });
      return { tasks: state.tasks.filter((t) => t._id !== taskId), kanbanTasks: kanban };
    });
  },
}));

export default useTaskStore;

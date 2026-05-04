import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, CheckSquare, Calendar, ChevronDown } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Avatar from '../components/UI/Avatar';
import { PriorityBadge, StatusBadge } from '../components/UI/Badge';
import { TaskCardSkeleton } from '../components/UI/Skeleton';
import useTaskStore from '../store/taskStore';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import { useDebounce } from '../hooks/useDebounce';
import { cn, formatDate, isOverdue } from '../utils/helpers';
import { KANBAN_COLUMNS, PRIORITY_LABELS } from '../utils/constants';

const TaskRow = ({ task }) => {
  const { openTaskModal } = useUIStore();
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      onClick={() => openTaskModal(task)}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors cursor-pointer group border-b border-border last:border-0"
    >
      <StatusBadge status={task.status} size="xs" showLabel={false} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {task.identifier && (
            <span className="text-2xs font-mono text-text-tertiary flex-shrink-0">{task.identifier}</span>
          )}
          <span className={cn(
            'text-sm truncate',
            task.status === 'done' ? 'line-through text-text-tertiary' : 'text-text-primary'
          )}>
            {task.title}
          </span>
        </div>
        {task.project && (
          <span className="text-2xs text-text-tertiary">{task.project.name}</span>
        )}
      </div>

      <PriorityBadge priority={task.priority} size="xs" showLabel={false} />

      {task.dueDate && (
        <span className={cn('flex items-center gap-1 text-xs', overdue ? 'text-red-400' : 'text-text-tertiary')}>
          <Calendar size={11} />
          {formatDate(task.dueDate)}
        </span>
      )}

      {task.assignee ? (
        <Avatar user={task.assignee} size="xs" />
      ) : (
        <div className="w-5 h-5 rounded-full border border-dashed border-border" />
      )}
    </motion.div>
  );
};

const Tasks = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const { tasks, isLoading, fetchTasks } = useTaskStore();
  const { openTaskModal } = useUIStore();
  const { user } = useAuthStore();
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!user?._id) return;
    fetchTasks({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      assignee: user._id,
    });
  }, [debouncedSearch, statusFilter, priorityFilter, user?._id]);

  const grouped = tasks.reduce((acc, task) => {
    const col = KANBAN_COLUMNS.find((c) => c.id === task.status)?.label || task.status;
    if (!acc[col]) acc[col] = [];
    acc[col].push(task);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar title="My Tasks" subtitle={`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`} />

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-background-secondary flex-wrap">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={12} />}
          size="sm"
          className="w-48"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-7 bg-background-tertiary border border-border rounded-md text-xs px-2 text-text-secondary outline-none focus:border-accent/60"
        >
          <option value="">All statuses</option>
          {KANBAN_COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-7 bg-background-tertiary border border-border rounded-md text-xs px-2 text-text-secondary outline-none focus:border-accent/60"
        >
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <TaskCardSkeleton key={i} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
            <CheckSquare size={40} className="mb-4 opacity-30" />
            <p className="text-sm text-text-secondary mb-1">No tasks found</p>
            <p className="text-xs">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {Object.entries(grouped).map(([status, items]) => (
              <div key={status}>
                <div className="flex items-center gap-2 px-4 py-2 bg-background-primary sticky top-0 z-10">
                  <span className="text-2xs font-semibold text-text-tertiary uppercase tracking-wider">{status}</span>
                  <span className="text-2xs bg-surface border border-border text-text-tertiary rounded px-1.5">{items.length}</span>
                </div>
                <AnimatePresence>
                  {items.map((task) => <TaskRow key={task._id} task={task} />)}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;

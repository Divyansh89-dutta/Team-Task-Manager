import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, MoreHorizontal, Trash2, Edit2, User } from 'lucide-react';
import { cn, formatDate, isOverdue } from '../../utils/helpers';
import { PRIORITY_COLORS } from '../../utils/constants';
import Avatar from '../UI/Avatar';
import { PriorityBadge } from '../UI/Badge';
import useTaskStore from '../../store/taskStore';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import useProjectStore from '../../store/projectStore';

const TaskCard = ({ task, overlay = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { deleteTask } = useTaskStore();
  const { openTaskModal } = useUIStore();
  const { user } = useAuthStore();
  const { projects } = useProjectStore();

  const taskProjectId = task.project?._id || task.project;
  const taskProject = projects.find(p => p._id === taskProjectId);
  const canDelete = user?.role === 'admin';

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task._id, data: { task, type: 'task' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = isOverdue(task.dueDate, task.status);
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.no_priority;

  const handleEdit = (e) => {
    e.stopPropagation();
    openTaskModal(task);
    setMenuOpen(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    await deleteTask(task._id);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        onClick={() => openTaskModal(task)}
        className={cn(
          'group bg-surface border rounded-lg p-3 cursor-pointer select-none',
          'hover:border-border-strong hover:shadow-elevation-1 transition-all duration-150',
          isDragging ? 'opacity-50 shadow-elevation-2 scale-[1.02] rotate-1' : '',
          overlay ? 'shadow-elevation-3 rotate-1' : '',
          'border-border'
        )}
        style={{
          borderLeft: `2px solid ${priorityColor}`,
        }}
      >
        {/* Drag handle + actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-0.5 -ml-0.5 text-text-tertiary hover:text-text-secondary transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
              <circle cx="4" cy="4" r="1.5" /><circle cx="8" cy="4" r="1.5" />
              <circle cx="4" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
              <circle cx="4" cy="12" r="1.5" /><circle cx="8" cy="12" r="1.5" />
            </svg>
          </div>

          {/* Task identifier */}
          {task.identifier && (
            <span className="text-2xs font-mono text-text-tertiary flex-1">{task.identifier}</span>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-active transition-all"
            >
              <MoreHorizontal size={13} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-background-elevated border border-border rounded-lg shadow-elevation-2 py-1 w-36">
                  <button onClick={handleEdit} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">
                    <Edit2 size={11} /> Edit task
                  </button>
                  {canDelete && (
                    <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={11} /> Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <p className={cn(
          'text-xs font-medium leading-snug mb-2.5',
          task.status === 'done' ? 'line-through text-text-tertiary' : 'text-text-primary'
        )}>
          {task.title}
        </p>

        {/* Labels */}
        {task.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.slice(0, 3).map((label) => (
              <span key={label} className="text-2xs px-1.5 py-0.5 bg-surface-active rounded text-text-tertiary border border-border">
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} size="xs" showLabel={false} />
            {task.dueDate && (
              <span className={cn(
                'flex items-center gap-1 text-2xs',
                overdue ? 'text-red-400' : 'text-text-tertiary'
              )}>
                <Calendar size={9} />
                {formatDate(task.dueDate)}
              </span>
            )}
            {task.comments?.length > 0 && (
              <span className="flex items-center gap-1 text-2xs text-text-tertiary">
                <MessageSquare size={9} />
                {task.comments.length}
              </span>
            )}
          </div>
          {task.assignee ? (
            <Avatar user={task.assignee} size="xs" />
          ) : (
            <span className="w-4 h-4 rounded-full border border-dashed border-border flex items-center justify-center">
              <User size={8} className="text-text-tertiary" />
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TaskCard;

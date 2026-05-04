import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../../utils/helpers';
import TaskCard from './TaskCard';
import { KanbanColumnSkeleton } from '../UI/Skeleton';
import useUIStore from '../../store/uiStore';

const KanbanColumn = ({ column, tasks, isLoading, projectId }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const { openTaskModal } = useUIStore();

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
          <span className="text-xs font-semibold text-text-secondary">{column.label}</span>
          <span className="text-2xs bg-surface border border-border text-text-tertiary rounded px-1.5 py-0.5 tabular-nums">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => openTaskModal({ status: column.id, project: projectId })}
          className="p-1 rounded hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 p-2 rounded-xl min-h-[200px] transition-all duration-150',
          isOver ? 'bg-accent/5 border-2 border-dashed border-accent/30' : 'border-2 border-transparent'
        )}
      >
        {isLoading ? (
          <KanbanColumnSkeleton />
        ) : (
          <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </AnimatePresence>

            {tasks.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-text-tertiary"
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-dashed mb-2 flex items-center justify-center"
                  style={{ borderColor: column.color + '40' }}
                >
                  <Plus size={14} style={{ color: column.color + '80' }} />
                </div>
                <p className="text-2xs text-center">Drop tasks here or<br />
                  <button
                    onClick={() => openTaskModal({ status: column.id, project: projectId })}
                    className="text-accent hover:text-accent-hover transition-colors"
                  >
                    create new
                  </button>
                </p>
              </motion.div>
            )}
          </SortableContext>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;

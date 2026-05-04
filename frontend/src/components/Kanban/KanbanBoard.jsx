import { useState } from 'react';
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { KANBAN_COLUMNS } from '../../utils/constants';
import useTaskStore from '../../store/taskStore';

const KanbanBoard = ({ projectId, isLoading }) => {
  const [activeTask, setActiveTask] = useState(null);
  const { kanbanTasks, reorderTasks } = useTaskStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findColumn = (taskId) => {
    for (const col of KANBAN_COLUMNS) {
      if (kanbanTasks[col.id]?.find((t) => t._id === taskId)) return col.id;
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    const colId = findColumn(active.id);
    const task = kanbanTasks[colId]?.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const sourceCol = findColumn(active.id);
    let destCol = KANBAN_COLUMNS.find((c) => c.id === over.id)?.id;
    if (!destCol) destCol = findColumn(over.id);
    if (!sourceCol || !destCol) return;

    const sourceTasks = kanbanTasks[sourceCol] || [];
    const destTasks = sourceCol === destCol ? sourceTasks : (kanbanTasks[destCol] || []);

    const sourceIndex = sourceTasks.findIndex((t) => t._id === active.id);
    let destIndex = destTasks.findIndex((t) => t._id === over.id);
    if (destIndex === -1) destIndex = destTasks.length;

    if (sourceCol === destCol && sourceIndex === destIndex) return;

    await reorderTasks(sourceCol, destCol, sourceIndex, destIndex, projectId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto no-scrollbar pb-4 pt-1 items-start">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={kanbanTasks[column.id] || []}
            isLoading={isLoading}
            projectId={projectId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask && <TaskCard task={activeTask} overlay />}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;

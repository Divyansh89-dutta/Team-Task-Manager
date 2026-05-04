export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done',
};

export const STATUS_LABELS = {
  todo: 'Todo',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export const PRIORITY_LABELS = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  no_priority: 'No Priority',
};

export const PRIORITY_COLORS = {
  urgent: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
  no_priority: '#555555',
};

export const STATUS_COLORS = {
  todo: '#888888',
  in_progress: '#5E6AD2',
  in_review: '#EAB308',
  done: '#22C55E',
};

export const KANBAN_COLUMNS = [
  { id: 'todo', label: 'Todo', color: '#888888' },
  { id: 'in_progress', label: 'In Progress', color: '#5E6AD2' },
  { id: 'in_review', label: 'In Review', color: '#EAB308' },
  { id: 'done', label: 'Done', color: '#22C55E' },
];

export const PROJECT_COLORS = [
  '#5E6AD2', '#EC4899', '#F97316', '#EAB308',
  '#22C55E', '#06B6D4', '#8B5CF6', '#EF4444',
  '#14B8A6', '#F59E0B', '#6366F1', '#10B981',
];

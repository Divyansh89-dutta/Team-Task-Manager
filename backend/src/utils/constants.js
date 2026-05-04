const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done',
};

const TASK_PRIORITY = {
  NO_PRIORITY: 'no_priority',
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
};

const PROJECT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  COMPLETED: 'completed',
};

const ACTIVITY_TYPES = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_ASSIGNED: 'task_assigned',
  TASK_DELETED: 'task_deleted',
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
  COMMENT_ADDED: 'comment_added',
};

const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_DUE_SOON: 'task_due_soon',
  PROJECT_INVITATION: 'project_invitation',
  MENTION: 'mention',
};

const CACHE_TTL = {
  DASHBOARD: 300,
  PROJECTS: 600,
  USER_PROFILE: 3600,
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

module.exports = {
  TASK_STATUS,
  TASK_PRIORITY,
  USER_ROLES,
  PROJECT_STATUS,
  ACTIVITY_TYPES,
  NOTIFICATION_TYPES,
  CACHE_TTL,
  PAGINATION,
};

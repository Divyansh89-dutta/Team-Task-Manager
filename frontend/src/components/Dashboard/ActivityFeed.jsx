import { motion } from 'framer-motion';
import { CheckSquare, FolderKanban, UserPlus, MessageSquare, ArrowRight } from 'lucide-react';
import { timeAgo, cn } from '../../utils/helpers';
import Avatar from '../UI/Avatar';
import { ActivityItemSkeleton } from '../UI/Skeleton';

const activityIcons = {
  task_created: { icon: CheckSquare, color: '#5E6AD2' },
  task_updated: { icon: CheckSquare, color: '#888888' },
  task_status_changed: { icon: ArrowRight, color: '#22C55E' },
  task_assigned: { icon: CheckSquare, color: '#EAB308' },
  task_deleted: { icon: CheckSquare, color: '#EF4444' },
  task_comment: { icon: MessageSquare, color: '#5E6AD2' },
  project_created: { icon: FolderKanban, color: '#8B5CF6' },
  project_updated: { icon: FolderKanban, color: '#888888' },
  member_added: { icon: UserPlus, color: '#22C55E' },
  member_removed: { icon: UserPlus, color: '#EF4444' },
};

const activityText = (activity) => {
  const actor = activity.actor?.name || 'Someone';
  const task = activity.task?.title ? `"${activity.task.title}"` : 'a task';
  const project = activity.project?.name ? `in ${activity.project.name}` : '';
  const meta = activity.meta || {};

  switch (activity.type) {
    case 'task_created': return `${actor} created ${task} ${project}`;
    case 'task_updated': return `${actor} updated ${task}`;
    case 'task_status_changed': return `${actor} moved ${task} to ${meta.toStatus?.replace('_', ' ') || 'new status'}`;
    case 'task_assigned': return `${actor} assigned ${task}`;
    case 'task_deleted': return `${actor} deleted "${meta.taskTitle || 'a task'}"`;
    case 'task_comment': return `${actor} commented on ${task}`;
    case 'project_created': return `${actor} created project "${meta.projectName || project}"`;
    case 'member_added': return `${actor} added ${meta.addedUser || 'a member'} to ${project}`;
    default: return `${actor} performed an action`;
  }
};

const ActivityFeed = ({ activities = [], isLoading = false }) => (
  <div className="bg-surface border border-border rounded-xl">
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <h3 className="text-sm font-semibold text-text-primary">Activity</h3>
      <span className="text-2xs text-text-tertiary">{activities.length} events</span>
    </div>

    <div className="divide-y divide-border">
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3"><ActivityItemSkeleton /></div>
        ))
      ) : activities.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-text-tertiary">
          No recent activity
        </div>
      ) : (
        activities.map((activity, i) => {
          const { icon: Icon, color } = activityIcons[activity.type] || activityIcons.task_updated;
          return (
            <motion.div
              key={activity._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
            >
              <div className="relative flex-shrink-0">
                <Avatar user={activity.actor} size="sm" />
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  <Icon size={7} />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-secondary leading-snug">{activityText(activity)}</p>
                <p className="text-2xs text-text-tertiary mt-0.5">{timeAgo(activity.createdAt)}</p>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  </div>
);

export default ActivityFeed;

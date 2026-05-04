import { cn } from '../../utils/helpers';
import { PRIORITY_COLORS, STATUS_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../../utils/constants';

const sizeStyles = {
  xs: 'h-4 px-1.5 text-2xs gap-1',
  sm: 'h-5 px-1.5 text-xs gap-1',
  md: 'h-6 px-2 text-xs gap-1.5',
};

export const PriorityBadge = ({ priority, size = 'sm', showLabel = true }) => {
  const color = PRIORITY_COLORS[priority] || PRIORITY_COLORS.no_priority;
  const label = PRIORITY_LABELS[priority] || 'No Priority';

  const priorityIcons = {
    urgent: '⚡',
    high: '↑',
    medium: '~',
    low: '↓',
    no_priority: '○',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-medium',
        sizeStyles[size]
      )}
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}30`,
      }}
    >
      <span className="text-xs leading-none">{priorityIcons[priority]}</span>
      {showLabel && <span>{label}</span>}
    </span>
  );
};

export const StatusBadge = ({ status, size = 'sm', showLabel = true }) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.todo;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-medium',
        sizeStyles[size]
      )}
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {showLabel && <span>{label}</span>}
    </span>
  );
};

export const Badge = ({ children, color, className, size = 'sm' }) => (
  <span
    className={cn(
      'inline-flex items-center rounded font-medium',
      sizeStyles[size],
      !color && 'bg-surface text-text-secondary border border-border',
      className
    )}
    style={color ? {
      color,
      backgroundColor: `${color}18`,
      border: `1px solid ${color}30`,
    } : undefined}
  >
    {children}
  </span>
);

export default Badge;

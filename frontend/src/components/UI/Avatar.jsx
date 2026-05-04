import { cn, getInitials } from '../../utils/helpers';

const sizes = {
  xs: 'w-5 h-5 text-2xs',
  sm: 'w-6 h-6 text-xs',
  md: 'w-7 h-7 text-xs',
  lg: 'w-8 h-8 text-sm',
  xl: 'w-10 h-10 text-sm',
  '2xl': 'w-12 h-12 text-base',
};

const AVATAR_COLORS = [
  ['#5E6AD2', '#3D4FC0'],
  ['#EC4899', '#DB2777'],
  ['#F97316', '#EA580C'],
  ['#22C55E', '#16A34A'],
  ['#06B6D4', '#0891B2'],
  ['#8B5CF6', '#7C3AED'],
  ['#EAB308', '#CA8A04'],
  ['#EF4444', '#DC2626'],
];

const getColorForName = (name = '') => {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const Avatar = ({ user, size = 'md', className, showStatus = false, online = false }) => {
  const name = user?.name || '?';
  const [bg, shadow] = getColorForName(name);

  return (
    <div className={cn('relative flex-shrink-0', className)}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={name}
          className={cn('rounded-full object-cover ring-1 ring-white/10', sizes[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold text-white select-none ring-1 ring-white/10',
            sizes[size]
          )}
          style={{ background: `linear-gradient(135deg, ${bg}, ${shadow})` }}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border border-background-primary',
            online ? 'bg-green-500' : 'bg-text-tertiary',
            size === 'xs' || size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
          )}
        />
      )}
    </div>
  );
};

export const AvatarGroup = ({ users = [], max = 3, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((user) => (
        <Avatar
          key={user._id || user.id}
          user={user}
          size={size}
          className="ring-2 ring-background-primary"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full bg-surface border border-border flex items-center justify-center',
            'text-2xs font-medium text-text-secondary ring-2 ring-background-primary',
            sizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default Avatar;

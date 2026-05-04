import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Settings, ChevronLeft, ChevronRight, Plus,
  Zap, Circle,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import useProjectStore from '../../store/projectStore';
import Avatar from '../UI/Avatar';
import Tooltip from '../UI/Tooltip';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
];

const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar, openCommandPalette } = useUIStore();
  const { user, logout } = useAuthStore();
  const { projects } = useProjectStore();
  const navigate = useNavigate();

  const recentProjects = projects.slice(0, 5);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 56 : 220 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full bg-background-secondary border-r border-border flex-shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className={cn(
        'flex items-center h-12 px-3 border-b border-border flex-shrink-0',
        sidebarCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
              <Zap size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-text-primary tracking-tight">Linear</span>
          </motion.div>
        )}
        {sidebarCollapsed && (
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-surface text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-background-elevated border border-border flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors shadow-elevation-1"
        >
          <ChevronRight size={11} />
        </button>
      )}

      {/* Command palette shortcut */}
      <div className={cn('px-2 py-2 border-b border-border')}>
        <Tooltip content="Search & commands" side="right">
          <button
            onClick={openCommandPalette}
            className={cn(
              'w-full flex items-center gap-2 rounded-md px-2 h-7',
              'bg-surface hover:bg-surface-hover transition-colors text-text-tertiary hover:text-text-secondary',
              sidebarCollapsed ? 'justify-center' : ''
            )}
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            {!sidebarCollapsed && (
              <span className="text-xs flex-1 text-left">Search</span>
            )}
            {!sidebarCollapsed && (
              <span className="kbd">⌘K</span>
            )}
          </button>
        </Tooltip>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-2">
        <div className="space-y-0.5 px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Tooltip key={to} content={sidebarCollapsed ? label : ''} side="right">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-md px-2 h-7 text-xs font-medium transition-colors',
                    'outline-none',
                    isActive
                      ? 'bg-accent/15 text-accent'
                      : 'text-text-secondary hover:bg-surface hover:text-text-primary',
                    sidebarCollapsed ? 'justify-center' : ''
                  )
                }
              >
                <Icon size={14} className="flex-shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
              </NavLink>
            </Tooltip>
          ))}
        </div>

        {/* Recent Projects */}
        {!sidebarCollapsed && recentProjects.length > 0 && (
          <div className="mt-4 px-2">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-2xs font-semibold text-text-tertiary uppercase tracking-wider">
                Projects
              </span>
              <button
                onClick={() => navigate('/projects')}
                className="p-0.5 rounded hover:bg-surface text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <Plus size={11} />
              </button>
            </div>
            {recentProjects.map((project) => (
              <NavLink
                key={project._id}
                to={`/projects/${project._id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-2 h-7 text-xs transition-colors',
                    isActive
                      ? 'bg-surface text-text-primary'
                      : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                  )
                }
              >
                <Circle
                  size={8}
                  fill={project.color || '#5E6AD2'}
                  stroke="none"
                  className="flex-shrink-0"
                />
                <span className="truncate">{project.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-border p-2 flex items-center gap-2',
        sidebarCollapsed ? 'justify-center' : ''
      )}>
        <Tooltip content={sidebarCollapsed ? user?.name : ''} side="right">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 w-full hover:bg-surface transition-colors group"
          >
            <Avatar user={user} size="sm" />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-text-primary truncate">{user?.name}</p>
                <p className="text-2xs text-text-tertiary truncate">{user?.role}</p>
              </div>
            )}
          </button>
        </Tooltip>
        {!sidebarCollapsed && (
          <Tooltip content="Settings">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'p-1.5 rounded-md transition-colors flex-shrink-0',
                  isActive ? 'text-accent' : 'text-text-tertiary hover:text-text-primary hover:bg-surface'
                )
              }
            >
              <Settings size={13} />
            </NavLink>
          </Tooltip>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;

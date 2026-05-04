import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Search, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import useProjectStore from '../../store/projectStore';
import Avatar from '../UI/Avatar';

const Navbar = ({ title, subtitle, actions }) => {
  const { openCommandPalette, toggleNotifications, unreadCount } = useUIStore();
  const { user, logout } = useAuthStore();
  const { projects } = useProjectStore();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (!userMenuRef.current?.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 flex-shrink-0 bg-background-secondary">
      {/* Left: Title */}
      <div className="flex items-center gap-2 min-w-0">
        {title && (
          <div>
            <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
            {subtitle && <p className="text-2xs text-text-tertiary">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {actions}

        {/* Search */}
        <button
          onClick={openCommandPalette}
          className="flex items-center gap-2 px-2 h-7 rounded-md bg-surface border border-border text-text-tertiary hover:text-text-secondary hover:border-border-strong transition-all text-xs"
        >
          <Search size={12} />
          <span className="hidden sm:block">Search</span>
          <span className="kbd hidden sm:inline-flex">⌘K</span>
        </button>

        {/* New Task */}
        <button
          onClick={() => useUIStore.getState().openTaskModal()}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
        >
          <Plus size={13} />
          <span className="hidden sm:block">New Task</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            data-bell-button
            className="relative p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-accent rounded-full flex items-center justify-center text-2xs text-white font-medium px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 p-1 rounded-md hover:bg-surface transition-colors"
          >
            <Avatar user={user} size="sm" />
            <ChevronDown size={11} className="text-text-tertiary" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1.5 w-52 bg-background-elevated border border-border rounded-xl shadow-elevation-3 py-1 z-50"
              >
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-xs font-medium text-text-primary">{user?.name}</p>
                  <p className="text-2xs text-text-tertiary truncate">{user?.email}</p>
                </div>
                {[
                  { icon: User, label: 'Profile', action: () => { navigate('/settings'); setUserMenuOpen(false); } },
                  { icon: Settings, label: 'Settings', action: () => { navigate('/settings'); setUserMenuOpen(false); } },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

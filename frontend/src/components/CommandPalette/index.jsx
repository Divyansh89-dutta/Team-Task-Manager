import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, FolderKanban, CheckSquare,
  Settings, Plus, LogOut, ArrowRight, Hash,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import useProjectStore from '../../store/projectStore';
import useTaskStore from '../../store/taskStore';

const CommandPalette = () => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef();
  const listRef = useRef();
  const navigate = useNavigate();

  const { closeCommandPalette, openTaskModal } = useUIStore();
  const { logout } = useAuthStore();
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();

  const staticActions = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Go to Dashboard', group: 'Navigate', action: () => navigate('/dashboard') },
    { id: 'projects', icon: FolderKanban, label: 'Go to Projects', group: 'Navigate', action: () => navigate('/projects') },
    { id: 'tasks', icon: CheckSquare, label: 'My Tasks', group: 'Navigate', action: () => navigate('/tasks') },
    { id: 'settings', icon: Settings, label: 'Settings', group: 'Navigate', action: () => navigate('/settings') },
    { id: 'new-task', icon: Plus, label: 'Create new task', shortcut: 'N', group: 'Actions', action: () => { closeCommandPalette(); openTaskModal(); } },
    { id: 'new-project', icon: Plus, label: 'Create new project', group: 'Actions', action: () => navigate('/projects?new=true') },
    { id: 'logout', icon: LogOut, label: 'Sign out', group: 'Actions', action: () => { logout(); navigate('/login'); } },
  ];

  const projectItems = projects.map((p) => ({
    id: `project-${p._id}`,
    icon: Hash,
    label: p.name,
    subtitle: `${p.taskCount || 0} tasks`,
    group: 'Projects',
    color: p.color,
    action: () => navigate(`/projects/${p._id}`),
  }));

  const taskItems = tasks.slice(0, 20).map((t) => ({
    id: `task-${t._id}`,
    icon: CheckSquare,
    label: t.title,
    subtitle: t.project?.name,
    group: 'Tasks',
    action: () => { closeCommandPalette(); useTaskStore.getState().setSelectedTask(t); },
  }));

  const allItems = [...staticActions, ...projectItems, ...taskItems];

  const filtered = query.trim()
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const groupedItems = filtered.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const flatFiltered = Object.values(groupedItems).flat();

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeSelected = useCallback(() => {
    const item = flatFiltered[selectedIndex];
    if (item) {
      item.action();
      closeCommandPalette();
    }
  }, [flatFiltered, selectedIndex]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeSelected();
      } else if (e.key === 'Escape') {
        closeCommandPalette();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [executeSelected, flatFiltered.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeCommandPalette}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-xl bg-background-elevated border border-border rounded-2xl shadow-elevation-3 overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={15} className="text-text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions, projects, tasks..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-text-tertiary hover:text-text-secondary transition-colors text-xs"
            >
              Clear
            </button>
          )}
          <span className="kbd">Esc</span>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto no-scrollbar py-2">
          {flatFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
              <Search size={20} className="mb-2 opacity-50" />
              <p className="text-sm">No results for "{query}"</p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-1.5">
                  <span className="text-2xs font-semibold text-text-tertiary uppercase tracking-wider">
                    {group}
                  </span>
                </div>
                {items.map((item) => {
                  const itemIndex = globalIndex++;
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-selected={isSelected}
                      onClick={() => { item.action(); closeCommandPalette(); }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                        isSelected ? 'bg-accent/15 text-text-primary' : 'text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <span
                        className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0',
                          isSelected ? 'bg-accent text-white' : 'bg-surface text-text-tertiary'
                        )}
                        style={item.color && !isSelected ? { backgroundColor: `${item.color}20`, color: item.color } : undefined}
                      >
                        <item.icon size={12} />
                      </span>
                      <div className="flex-1 text-left min-w-0">
                        <span className="truncate block">{item.label}</span>
                        {item.subtitle && (
                          <span className="text-2xs text-text-tertiary truncate block">{item.subtitle}</span>
                        )}
                      </div>
                      {item.shortcut && <span className="kbd">{item.shortcut}</span>}
                      {isSelected && <ArrowRight size={11} className="text-accent flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border">
          <div className="flex items-center gap-3">
            {[['↑↓', 'Navigate'], ['↵', 'Select'], ['Esc', 'Close']].map(([key, label]) => (
              <span key={key} className="flex items-center gap-1 text-2xs text-text-tertiary">
                <span className="kbd">{key}</span>
                {label}
              </span>
            ))}
          </div>
          <span className="text-2xs text-text-tertiary">{flatFiltered.length} results</span>
        </div>
      </motion.div>
    </div>
  );
};

export default CommandPalette;

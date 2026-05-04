import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FolderKanban, Circle, Users, CheckSquare, MoreHorizontal, Trash2, Crown } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import Modal from '../components/UI/Modal';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { AvatarGroup } from '../components/UI/Avatar';
import { ProjectCardSkeleton } from '../components/UI/Skeleton';
import useProjectStore from '../store/projectStore';
import useAuthStore from '../store/authStore';
import { PROJECT_COLORS } from '../utils/constants';
import { cn, timeAgo } from '../utils/helpers';

const ProjectCard = ({ project, onDelete, showOwner = false }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const progress = project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0;
  const canDelete = user?.role === 'admin';
  const memberUsers = project.members?.map((m) => m.user) || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/projects/${project._id}`)}
      className="group bg-surface border border-border rounded-xl p-4 cursor-pointer hover:border-border-strong hover:shadow-elevation-1 transition-all duration-200 relative"
    >
      {/* Menu */}
      {canDelete && (
        <div
          className="absolute top-3 right-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-active text-text-tertiary hover:text-text-primary transition-all"
          >
            <MoreHorizontal size={13} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-background-elevated border border-border rounded-lg shadow-elevation-2 py-1 w-36">
                <button
                  onClick={() => { onDelete(project._id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ backgroundColor: `${project.color}20` }}
        >
          {project.icon || '📋'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">{project.name}</h3>
          {showOwner && project.owner?.name && !isOwner && (
            <p className="flex items-center gap-1 text-2xs text-text-tertiary mt-0.5">
              <Crown size={9} className="text-amber-400" />
              {project.owner.name}
            </p>
          )}
          {!showOwner && project.description && (
            <p className="text-xs text-text-tertiary truncate mt-0.5">{project.description}</p>
          )}
          {showOwner && isOwner && project.description && (
            <p className="text-xs text-text-tertiary truncate mt-0.5">{project.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-3 text-xs text-text-tertiary">
        <span className="flex items-center gap-1">
          <CheckSquare size={11} />
          {project.taskCount || 0} tasks
        </span>
        <span className="flex items-center gap-1">
          <Users size={11} />
          {(project.members?.length || 0) + 1}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xs text-text-tertiary">Progress</span>
          <span className="text-2xs font-medium text-text-secondary tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="h-full rounded-full"
            style={{ backgroundColor: project.color }}
          />
        </div>
      </div>

      {/* Members + time */}
      <div className="flex items-center justify-between">
        <AvatarGroup users={[project.owner, ...memberUsers].filter(Boolean)} max={4} size="xs" />
        <span className="text-2xs text-text-tertiary">{timeAgo(project.updatedAt)}</span>
      </div>
    </motion.div>
  );
};

const CreateProjectModal = ({ open, onClose }) => {
  const [form, setForm] = useState({ name: '', description: '', color: '#5E6AD2', icon: '📋' });
  const { createProject } = useProjectStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    const result = await createProject(form);
    setLoading(false);
    if (result.success) { onClose(); setForm({ name: '', description: '', color: '#5E6AD2', icon: '📋' }); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New project" size="sm" footer={
      <>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" loading={loading} onClick={handleSubmit}>Create project</Button>
      </>
    }>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Input
          label="Project name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Mobile App"
          autoFocus
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="What is this project about?"
        />
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                className={cn('w-6 h-6 rounded-full transition-all', form.color === c ? 'ring-2 ring-offset-2 ring-offset-background-secondary ring-white/60 scale-110' : 'hover:scale-110')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};

const Projects = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(searchParams.get('new') === 'true');
  const { projects, isLoading, fetchProjects, deleteProject } = useProjectStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => { fetchProjects(); }, []);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar
        title={isAdmin ? 'All Projects' : 'Projects'}
        subtitle={isAdmin
          ? `${projects.length} project${projects.length !== 1 ? 's' : ''} across workspace`
          : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setCreateOpen(true)}>
            New project
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Search */}
        <div className="mb-5 max-w-xs">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={13} />}
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-text-tertiary"
          >
            <FolderKanban size={40} className="mb-4 opacity-30" />
            <p className="text-sm font-medium text-text-secondary mb-1">
              {search ? 'No projects match your search' : 'No projects yet'}
            </p>
            <p className="text-xs text-text-tertiary mb-4">
              {search ? 'Try a different term' : 'Create a project to start managing tasks'}
            </p>
            {!search && (
              <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setCreateOpen(true)}>
                Create project
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <ProjectCard key={project._id} project={project} onDelete={deleteProject} showOwner={isAdmin} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
};

export default Projects;

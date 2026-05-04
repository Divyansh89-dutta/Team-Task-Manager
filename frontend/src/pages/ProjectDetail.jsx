import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, List, Plus, Filter, Search, Settings2,
  UserPlus, ArrowLeft, Circle,
} from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import KanbanBoard from '../components/Kanban/KanbanBoard';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import Avatar, { AvatarGroup } from '../components/UI/Avatar';
import useProjectStore from '../store/projectStore';
import useTaskStore from '../store/taskStore';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import { useProjectRoom } from '../hooks/useSocket';
import { useDebounce } from '../hooks/useDebounce';
import { cn } from '../utils/helpers';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const { currentProject, projects, fetchProject, addMember } = useProjectStore();
  const { fetchTasks, isLoading } = useTaskStore();
  const { openTaskModal } = useUIStore();
  const { user } = useAuthStore();

  // Use whichever source has the right project — avoids stale currentProject during async fetch
  const activeProject =
    (currentProject?._id === id ? currentProject : null) ||
    projects.find((p) => p._id === id) ||
    null;

  const debouncedSearch = useDebounce(search, 300);

  useProjectRoom(id);

  useEffect(() => {
    fetchProject(id);
    fetchTasks({ projectId: id });
  }, [id]);

  useEffect(() => {
    if (debouncedSearch !== undefined) {
      fetchTasks({ projectId: id, search: debouncedSearch || undefined });
    }
  }, [debouncedSearch]);

  const userId = user?._id;
  const isMember =
    user?.role === 'admin' ||
    activeProject?.owner?._id === userId ||
    activeProject?.members?.some((m) => (m.user?._id || m.user) === userId);
  const isAdmin =
    user?.role === 'admin' ||
    activeProject?.owner?._id === userId ||
    activeProject?.members?.some(
      (m) => (m.user?._id || m.user) === userId && m.role === 'admin'
    );

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setAddingMember(true);
    const result = await addMember(id, memberEmail);
    setAddingMember(false);
    if (result.success) { setAddMemberOpen(false); setMemberEmail(''); }
  };

  const members = currentProject
    ? [currentProject.owner, ...(currentProject.members?.map((m) => m.user) || [])].filter(Boolean)
    : (activeProject
      ? [activeProject.owner, ...(activeProject.members?.map((m) => m.user) || [])].filter(Boolean)
      : []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar
        title={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/projects')} className="text-text-tertiary hover:text-text-primary transition-colors">
              <ArrowLeft size={14} />
            </button>
            {activeProject ? (
              <>
                <Circle size={8} fill={activeProject.color} stroke="none" />
                <span className="font-semibold text-text-primary">{activeProject.name}</span>
              </>
            ) : (
              <span className="text-text-tertiary text-sm">Loading...</span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <AvatarGroup users={members} max={4} size="sm" />
            {(isAdmin || isMember) && (
              <Button variant="ghost" size="sm" icon={<UserPlus size={13} />} onClick={() => setAddMemberOpen(true)}>
                Invite
              </Button>
            )}
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openTaskModal({ project: id })}>
              Task
            </Button>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-background-secondary">
        <Input
          placeholder="Filter tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={12} />}
          size="sm"
          className="w-48"
        />
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <KanbanBoard projectId={id} isLoading={isLoading} />
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        title="Invite team member"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={addingMember} onClick={handleAddMember}>Send invite</Button>
          </>
        }
      >
        <form onSubmit={handleAddMember} className="p-4">
          <Input
            label="Email address"
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="colleague@company.com"
            autoFocus
          />
          <p className="text-xs text-text-tertiary mt-2">
            They must already have an account to be added.
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;

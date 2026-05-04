import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, User, Tag, Trash2, Send, ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import useUIStore from '../../store/uiStore';
import useTaskStore from '../../store/taskStore';
import useProjectStore from '../../store/projectStore';
import useAuthStore from '../../store/authStore';
import { taskApi } from '../../services/api';
import Button from '../UI/Button';
import Input, { Textarea } from '../UI/Input';
import Select from '../UI/Select';
import Avatar from '../UI/Avatar';
import { StatusBadge } from '../UI/Badge';
import { timeAgo, cn } from '../../utils/helpers';
import { useSocketEvent } from '../../hooks/useSocket';
import { KANBAN_COLUMNS, PRIORITY_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = KANBAN_COLUMNS.map((c) => ({ value: c.id, label: c.label }));

// Custom assignee dropdown with avatars and "(You)" indicator
const AssigneeSelect = ({ value, onChange, members, currentUserId }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const youFirst = members.filter(m => m._id === currentUserId);
  const others = members.filter(m => m._id !== currentUserId);
  const selected = value ? members.find(m => m._id === value) : null;

  return (
    <div className="relative" ref={ref}>
      <label className="text-xs font-medium text-text-secondary block mb-1.5">Assignee</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-8 flex items-center gap-2 bg-background-tertiary border border-border rounded-md px-2.5 text-xs text-text-primary hover:border-accent/60 outline-none transition-colors"
      >
        {selected ? (
          <>
            <Avatar user={selected} size="xs" />
            <span className="flex-1 text-left truncate">
              {selected.name}{selected._id === currentUserId ? ' (You)' : ''}
            </span>
          </>
        ) : (
          <>
            <div className="w-4 h-4 rounded-full border border-dashed border-border flex items-center justify-center flex-shrink-0">
              <User size={9} className="text-text-tertiary" />
            </div>
            <span className="flex-1 text-left text-text-tertiary">Unassigned</span>
          </>
        )}
        <ChevronDown size={11} className="text-text-tertiary flex-shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-0 right-0 mt-1 z-[60] bg-background-elevated border border-border rounded-lg shadow-elevation-3 py-1 max-h-48 overflow-y-auto no-scrollbar"
          >
            {/* Unassigned */}
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors',
                !value ? 'text-accent bg-accent/5' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              )}
            >
              <div className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center flex-shrink-0">
                <User size={10} className="text-text-tertiary" />
              </div>
              <span>Unassigned</span>
            </button>

            {/* Current user first, highlighted */}
            {youFirst.map(m => (
              <button
                key={m._id}
                type="button"
                onClick={() => { onChange(m._id); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors',
                  value === m._id ? 'text-accent bg-accent/5' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                )}
              >
                <Avatar user={m} size="xs" />
                <span className="flex-1 text-left font-medium">{m.name}</span>
                <span className="text-2xs text-text-tertiary bg-surface border border-border px-1.5 py-0.5 rounded">You</span>
              </button>
            ))}

            {/* Other project members */}
            {others.map(m => (
              <button
                key={m._id}
                type="button"
                onClick={() => { onChange(m._id); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors',
                  value === m._id ? 'text-accent bg-accent/5' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                )}
              >
                <Avatar user={m} size="xs" />
                <span className="flex-1 text-left">{m.name}</span>
              </button>
            ))}

            {members.length === 0 && (
              <div className="px-3 py-2 text-2xs text-text-tertiary italic">Select a project first</div>
            )}
            {members.length === 1 && members[0]?._id === currentUserId && (
              <div className="px-3 py-2 text-2xs text-text-tertiary italic border-t border-border mt-1 pt-2">
                No other members — invite from the project page
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TaskModal = () => {
  const { taskModalData, closeTaskModal } = useUIStore();
  const { createTask, updateTask, deleteTask } = useTaskStore();
  const { projects, currentProject } = useProjectStore();
  const { user } = useAuthStore();

  const isEdit = !!(taskModalData?._id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'no_priority',
    project: '',
    assignee: null,
    dueDate: '',
    labels: [],
  });
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState([]);
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const commentsEndRef = useRef();

  // Real-time: new comments pushed by other users via socket
  const handleCommentSocket = useCallback(({ taskId, comment }) => {
    if (!isEdit) return;
    if (taskId?.toString() !== taskModalData?._id?.toString()) return;
    setComments((prev) => {
      // Deduplicate — own comment already added optimistically
      if (prev.some((c) => c._id?.toString() === comment._id?.toString())) return prev;
      return [...prev, comment];
    });
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [isEdit, taskModalData?._id]);

  useSocketEvent('task:commented', handleCommentSocket, [handleCommentSocket]);

  // Permission check: can current user delete this task?
  const taskProject =
    projects.find(p => p._id === form.project) ||
    (currentProject?._id === form.project ? currentProject : null);
  const canDelete = isEdit && user?.role === 'admin';

  // Initialize form on modal open
  useEffect(() => {
    if (isEdit) {
      const t = taskModalData;
      setForm({
        title: t.title || '',
        description: t.description || '',
        status: t.status || 'todo',
        priority: t.priority || 'no_priority',
        project: t.project?._id || t.project || '',
        assignee: t.assignee?._id || t.assignee || null,
        dueDate: t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : '',
        labels: t.labels || [],
      });
      setComments(t.comments || []);
      taskApi.getById(t._id).then(({ data }) => {
        setComments(data.data.task.comments || []);
      }).catch(() => {});
    } else {
      // Smart defaults: members default to self, admins default to unassigned
      const defaultAssignee = user?.role === 'member' ? user._id : null;
      setForm({
        title: '',
        description: '',
        status: taskModalData?.status || 'todo',
        priority: 'no_priority',
        project: taskModalData?.project || projects[0]?._id || '',
        assignee: defaultAssignee,
        dueDate: '',
        labels: [],
      });
      setComments([]);
    }
  }, [taskModalData]);

  // Fallback: if projects loaded after modal opened (async)
  useEffect(() => {
    if (!isEdit && !form.project && projects.length > 0) {
      setForm(prev => ({ ...prev, project: projects[0]._id }));
    }
  }, [projects]);

  // Build members list when project selection changes
  useEffect(() => {
    if (form.project) {
      const project =
        projects.find((p) => p._id === form.project) ||
        (currentProject?._id === form.project ? currentProject : null);
      if (project) {
        const seen = new Set();
        const memberUsers = [
          project.owner,
          ...(project.members?.map((m) => m.user) || []),
        ]
          .filter(m => m && typeof m === 'object' && m._id)
          .filter((m) => {
            const id = m._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });
        setMembers(memberUsers);
      } else {
        setMembers([]);
      }
    } else {
      setMembers([]);
    }
  }, [form.project, projects]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.title.trim()) { toast.error('Task title is required'); return; }
    if (!form.project) { toast.error('Please select a project'); return; }
    setSaving(true);
    const payload = { ...form, dueDate: form.dueDate || null };
    const result = isEdit
      ? await updateTask(taskModalData._id, payload)
      : await createTask(payload);
    setSaving(false);
    if (result.success) closeTaskModal();
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !isEdit) return;
    setSubmittingComment(true);
    try {
      const { data } = await taskApi.addComment(taskModalData._id, { content: comment });
      setComments((prev) => [...prev, data.data.comment]);
      setComment('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !canDelete) return;
    await deleteTask(taskModalData._id);
    closeTaskModal();
  };

  const addLabel = () => {
    const trimmed = labelInput.trim();
    if (trimmed && !form.labels.includes(trimmed)) {
      setForm((f) => ({ ...f, labels: [...f.labels, trimmed] }));
    }
    setLabelInput('');
  };

  const projectOptions = projects.map((p) => ({ value: p._id, label: `${p.icon || '📋'} ${p.name}` }));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeTaskModal}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-2xl bg-background-secondary border border-border rounded-2xl shadow-elevation-3 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              {isEdit && (
                <span className="text-2xs font-mono text-text-tertiary">
                  {taskModalData?.identifier}
                </span>
              )}
              <StatusBadge status={form.status} size="sm" />
            </div>
            <div className="flex items-center gap-1.5">
              {canDelete && (
                <Button variant="danger" size="xs" icon={<Trash2 size={12} />} onClick={handleDelete}>
                  Delete
                </Button>
              )}
              <Button variant="ghost" size="xs" icon={<X size={13} />} onClick={closeTaskModal} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              {/* Title */}
              <textarea
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Task title..."
                rows={1}
                autoFocus
                className="w-full bg-transparent text-base font-semibold text-text-primary placeholder:text-text-tertiary outline-none resize-none leading-snug mb-3"
                style={{ minHeight: 28 }}
                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              />

              {/* Description */}
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Add a description..."
                rows={3}
                className="text-sm border-transparent bg-transparent hover:bg-surface focus:bg-surface hover:border-border focus:border-border"
              />
            </div>

            {/* Properties grid */}
            <div className="px-5 pb-4 grid grid-cols-2 gap-3">
              <Select
                label="Status"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v })}
                options={STATUS_OPTIONS}
                size="sm"
              />
              <Select
                label="Priority"
                value={form.priority}
                onChange={(v) => setForm({ ...form, priority: v })}
                options={PRIORITY_OPTIONS}
                size="sm"
              />
              {!isEdit && (
                <Select
                  label="Project"
                  value={form.project}
                  onChange={(v) => setForm({ ...form, project: v, assignee: user?.role === 'member' ? user._id : null })}
                  options={projectOptions}
                  size="sm"
                />
              )}
              <AssigneeSelect
                value={form.assignee}
                onChange={(v) => setForm({ ...form, assignee: v })}
                members={members}
                currentUserId={user?._id}
              />
              <Input
                label="Due date"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                size="sm"
              />

              {/* Labels */}
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1.5">Labels</label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {form.labels.map((label) => (
                    <span key={label} className="flex items-center gap-1 text-2xs bg-surface border border-border rounded px-1.5 py-0.5 text-text-secondary">
                      {label}
                      <button
                        onClick={() => setForm((f) => ({ ...f, labels: f.labels.filter((l) => l !== label) }))}
                        className="text-text-tertiary hover:text-red-400"
                      >×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                    placeholder="Add label..."
                    className="flex-1 h-7 bg-background-tertiary border border-border rounded-md text-xs px-2.5 text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/60"
                  />
                  <Button variant="ghost" size="xs" onClick={addLabel}><Tag size={11} /></Button>
                </div>
              </div>
            </div>

            {/* Comments (edit mode only) */}
            {isEdit && (
              <div className="px-5 pb-5 border-t border-border pt-4">
                <h4 className="text-xs font-semibold text-text-secondary mb-3">
                  Comments {comments.length > 0 && `(${comments.length})`}
                </h4>
                <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c._id} className="flex gap-2.5">
                      <Avatar user={c.author} size="xs" className="flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-text-primary">{c.author?.name}</span>
                          <span className="text-2xs text-text-tertiary">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
                <div className="flex gap-2">
                  <Avatar user={user} size="xs" className="flex-shrink-0 mt-1.5" />
                  <div className="flex-1 flex gap-2">
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                      placeholder="Add a comment..."
                      className="flex-1 h-8 bg-background-tertiary border border-border rounded-md text-xs px-3 text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/60"
                    />
                    <Button
                      variant="primary"
                      size="xs"
                      icon={<Send size={11} />}
                      loading={submittingComment}
                      onClick={handleAddComment}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <div className="flex items-center gap-2 text-2xs text-text-tertiary">
              <span className="kbd">↵</span>
              <span>to save</span>
              <span className="kbd ml-2">Esc</span>
              <span>to close</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={closeTaskModal}>Cancel</Button>
              <Button variant="primary" size="sm" loading={saving} onClick={handleSubmit}>
                {isEdit ? 'Save changes' : 'Create task'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskModal;

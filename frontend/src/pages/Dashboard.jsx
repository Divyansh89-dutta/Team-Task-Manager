import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  FolderKanban, Plus, ArrowRight, Circle,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { dashboardApi } from '../services/api';
import Navbar from '../components/Layout/Navbar';
import StatsCard from '../components/Dashboard/StatsCard';
import ActivityFeed from '../components/Dashboard/ActivityFeed';
import { StatCardSkeleton, ProjectCardSkeleton } from '../components/UI/Skeleton';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import useProjectStore from '../store/projectStore';
import { cn, formatDate } from '../utils/helpers';
import { STATUS_COLORS } from '../utils/constants';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { openTaskModal } = useUIStore();
  const { projects } = useProjectStore();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await dashboardApi.getStats();
        setStats(data.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const overview = stats?.overview;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const chartData = (() => {
    if (!stats?.weeklyTrend) return [];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    return days.map((date) => ({
      date: date.slice(5),
      created: stats.weeklyTrend.created.find((d) => d._id === date)?.count || 0,
      completed: stats.weeklyTrend.completed.find((d) => d._id === date)?.count || 0,
    }));
  })();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle="Here's what's happening with your projects"
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <StatsCard
                  title="Total Tasks"
                  value={overview?.total ?? 0}
                  subtitle="across all projects"
                  icon={CheckSquare}
                  color="#5E6AD2"
                  index={0}
                />
                <StatsCard
                  title="In Progress"
                  value={overview?.inProgress ?? 0}
                  subtitle={`${overview?.inReview ?? 0} in review`}
                  icon={TrendingUp}
                  color="#EAB308"
                  index={1}
                />
                <StatsCard
                  title="Completed"
                  value={overview?.done ?? 0}
                  subtitle="tasks finished"
                  icon={CheckSquare}
                  color="#22C55E"
                  index={2}
                />
                <StatsCard
                  title="Overdue"
                  value={overview?.overdue ?? 0}
                  subtitle={`${overview?.dueSoon ?? 0} due soon`}
                  icon={AlertTriangle}
                  color={overview?.overdue > 0 ? '#EF4444' : '#888888'}
                  index={3}
                />
              </>
            )}
          </div>

          {/* Chart + Projects Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weekly Chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-2 bg-surface border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">Weekly Activity</h3>
                <div className="flex items-center gap-4">
                  {[['#5E6AD2', 'Created'], ['#22C55E', 'Completed']].map(([color, label]) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="h-32 skeleton rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5E6AD2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5E6AD2" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#555555' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1E1E1E', border: '1px solid #2E2E2E', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#888' }}
                    />
                    <Area type="monotone" dataKey="created" stroke="#5E6AD2" strokeWidth={1.5} fill="url(#colorCreated)" dot={false} />
                    <Area type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={1.5} fill="url(#colorCompleted)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Projects List */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface border border-border rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Projects</h3>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-2xs text-accent hover:text-accent-hover transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3"><ProjectCardSkeleton /></div>
                  ))
                ) : projects.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs text-text-tertiary mb-3">No projects yet</p>
                    <button
                      onClick={() => navigate('/projects?new=true')}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover mx-auto transition-colors"
                    >
                      <Plus size={12} /> Create project
                    </button>
                  </div>
                ) : (
                  projects.slice(0, 6).map((project) => {
                    const progress = project.taskCount > 0
                      ? Math.round((project.completedTaskCount / project.taskCount) * 100)
                      : 0;
                    return (
                      <button
                        key={project._id}
                        onClick={() => navigate(`/projects/${project._id}`)}
                        className="w-full px-4 py-3 hover:bg-surface-hover transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <Circle size={8} fill={project.color} stroke="none" className="flex-shrink-0" />
                          <span className="text-xs font-medium text-text-primary truncate flex-1">{project.name}</span>
                          <ArrowRight size={11} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${progress}%`, backgroundColor: project.color }}
                            />
                          </div>
                          <span className="text-2xs text-text-tertiary tabular-nums">{progress}%</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>

          {/* Tasks per Member + Activity Feed Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Tasks per Member */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-surface border border-border rounded-xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Tasks per Member</h3>
              </div>
              <div className="p-4 space-y-3">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full skeleton flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 skeleton rounded w-24" />
                        <div className="h-1.5 skeleton rounded w-full" />
                      </div>
                      <div className="h-2.5 skeleton rounded w-6" />
                    </div>
                  ))
                ) : !stats?.tasksByAssignee?.length ? (
                  <p className="text-xs text-text-tertiary text-center py-4">No assigned tasks yet</p>
                ) : (
                  stats.tasksByAssignee.map((item) => {
                    const pct = item.total > 0 ? Math.round((item.done / item.total) * 100) : 0;
                    const initials = item.user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <div key={item._id} className="flex items-center gap-3">
                        {item.user.avatar ? (
                          <img
                            src={item.user.avatar}
                            alt={item.user.name}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-2xs font-semibold flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-text-primary truncate">{item.user.name}</span>
                            <span className="text-2xs text-text-tertiary tabular-nums ml-2 flex-shrink-0">
                              {item.done}/{item.total}
                            </span>
                          </div>
                          <div className="h-1 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: '#5E6AD2' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <ActivityFeed activities={stats?.recentActivity || []} isLoading={loading} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

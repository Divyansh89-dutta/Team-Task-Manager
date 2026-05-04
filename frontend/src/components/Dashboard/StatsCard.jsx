import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const StatsCard = ({ title, value, subtitle, icon: Icon, color = '#5E6AD2', trend, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.06 }}
    className="bg-surface border border-border rounded-xl p-4 hover:border-border-strong transition-all duration-200 hover:shadow-elevation-1 group"
  >
    <div className="flex items-start justify-between mb-3">
      <p className="text-xs font-medium text-text-secondary">{title}</p>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon size={13} />
      </div>
    </div>

    <div className="flex items-end justify-between">
      <div>
        <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
        {subtitle && <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>}
      </div>
      {trend !== undefined && (
        <span className={cn(
          'text-xs font-medium px-1.5 py-0.5 rounded',
          trend > 0 ? 'text-green-400 bg-green-500/10' : trend < 0 ? 'text-red-400 bg-red-500/10' : 'text-text-tertiary bg-surface'
        )}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  </motion.div>
);

export default StatsCard;

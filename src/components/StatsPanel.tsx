import { motion } from 'framer-motion';
import { BarChart3, Flame, Target, Calendar } from 'lucide-react';
import { useStore } from '@/store/useStore';

const StatsPanel = () => {
  const stats = useStore(s => s.stats);
  const weeklyCount = stats.dailyHistory
    .filter(d => {
      const diff = (Date.now() - new Date(d.date).getTime()) / 86400000;
      return diff <= 7;
    })
    .reduce((sum, d) => sum + d.count, 0);

  const items = [
    { icon: Target, label: 'Today', value: stats.sessionsToday },
    { icon: Calendar, label: 'This Week', value: weeklyCount },
    { icon: BarChart3, label: 'All Time', value: stats.totalSessions },
    { icon: Flame, label: 'Streak', value: `${stats.currentStreak}d` },
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <BarChart3 size={16} />
        Statistics
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ icon: Icon, label, value }, i) => (
          <motion.div
            key={label}
            className="flex flex-col items-center p-3 rounded-xl bg-muted/40"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Icon size={16} className="text-primary mb-1" />
            <span className="text-lg font-bold font-serif">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;

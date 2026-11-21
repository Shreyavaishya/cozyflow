import { motion } from 'framer-motion';
import { BarChart3, Flame, Target, Calendar } from 'lucide-react';
import { fmtFocus } from '@/lib/format';
import { useStore, getSessionsToday, getSessionsThisWeek, getStreak } from '@/store/useStore';

const StatsPanel = () => {
  const stats = useStore(s => s.stats);
  const todayCount = getSessionsToday(stats.dailyHistory);
  const weeklyCount = getSessionsThisWeek(stats.dailyHistory);
  const streak = getStreak(stats.dailyHistory);
  const focusTime = fmtFocus(stats.totalMinutes);

  const items = [
    { icon: Target, label: 'Today', value: todayCount },
    { icon: Calendar, label: 'This Week', value: weeklyCount },
    { icon: BarChart3, label: 'Focus Time', value: focusTime },
    { icon: Flame, label: 'Streak', value: `${streak}d` },
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

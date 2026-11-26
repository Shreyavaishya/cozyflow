import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Flame, Target, Calendar, Flag, Snowflake } from 'lucide-react';
import { fmtFocus, fmtGoal } from '@/lib/format';
import { useStore, getSessionsToday, getSessionsThisWeek, getGoalProgress, toDateKey } from '@/store/useStore';
import { useProStore } from '@/store/useProStore';
import { useStreak } from '@/hooks/useStreak';

const GOAL_PRESETS = [30, 60, 90, 120, 180, 240];
const MIN_GOAL = 5;
const MAX_GOAL = 600;

const StatsPanel = () => {
  const stats = useStore(s => s.stats);
  const goal = useStore(s => s.settings.dailyGoalMinutes) ?? 60;
  const updateSettings = useStore(s => s.updateSettings);
  const { isPro, openUpgrade } = useProStore();
  const { streak, frozenDays } = useStreak();
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState('');

  const todayCount = getSessionsToday(stats.dailyHistory);
  const weeklyCount = getSessionsThisWeek(stats.dailyHistory);
  const focusTime = fmtFocus(stats.totalMinutes);
  const progress = getGoalProgress(stats.dailyHistory, goal);

  // A freeze that saved the streak within the last 7 days
  const lastWeek = new Set(Array.from({ length: 7 }, (_, i) => toDateKey(new Date(Date.now() - i * 86400000))));
  const recentFreeze = frozenDays.some(d => lastWeek.has(d));

  const setGoal = (m: number) => updateSettings({ dailyGoalMinutes: Math.min(MAX_GOAL, Math.max(MIN_GOAL, Math.round(m))) });
  const commitCustom = () => {
    const n = parseInt(custom, 10);
    if (Number.isFinite(n)) setGoal(n);
    setCustom('');
  };

  const items = [
    { icon: Target, label: 'Today', value: <>{todayCount}</> },
    { icon: Calendar, label: 'This Week', value: <>{weeklyCount}</> },
    { icon: BarChart3, label: 'Focus Time', value: <>{focusTime}</> },
    {
      icon: Flame,
      label: 'Streak',
      value: (
        <>
          {streak}d
          {recentFreeze && (
            <span title="A streak freeze saved your streak this week" aria-label="Streak freeze used" className="inline-block ml-1 align-middle text-primary">
              <Snowflake size={13} />
            </span>
          )}
        </>
      ),
    },
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

      {/* Daily goal */}
      <div className="rounded-xl bg-muted/40 p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground"><Flag size={14} className="text-primary" /> Daily goal</span>
          <button
            onClick={() => setEditing(e => !e)}
            className="font-medium hover:underline underline-offset-2"
            aria-expanded={editing}
            title="Change your daily goal"
          >
            {fmtGoal(progress.minutes)} / {fmtGoal(progress.goal)}
          </button>
        </div>
        <div
          role="progressbar"
          aria-label="Daily focus goal"
          aria-valuemin={0}
          aria-valuemax={progress.goal}
          aria-valuenow={Math.min(progress.minutes, progress.goal)}
          className="h-2 rounded-full bg-muted overflow-hidden"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress.ratio * 100}%` }} />
        </div>
        {progress.reached && <p className="text-xs text-primary">Goal reached today 🎉</p>}

        {editing && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {GOAL_PRESETS.map(m => (
              <button
                key={m}
                onClick={() => setGoal(m)}
                className={`px-2 py-1 rounded-lg text-xs ${goal === m ? 'bg-primary text-primary-foreground' : 'bg-muted/70 text-muted-foreground hover:text-foreground'}`}
              >
                {fmtGoal(m)}
              </button>
            ))}
            <input
              type="number"
              inputMode="numeric"
              min={MIN_GOAL}
              max={MAX_GOAL}
              value={custom}
              placeholder="min"
              aria-label="Custom daily goal in minutes"
              onChange={e => setCustom(e.target.value)}
              onBlur={commitCustom}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-14 rounded-lg bg-muted/70 px-2 py-1 text-xs text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        )}
      </div>

      {/* Only shown when there is a streak worth protecting */}
      {!isPro && streak >= 3 && (
        <button onClick={openUpgrade} className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Snowflake size={13} className="text-primary" /> Protect your {streak}-day streak with Pro
        </button>
      )}
    </div>
  );
};

export default StatsPanel;
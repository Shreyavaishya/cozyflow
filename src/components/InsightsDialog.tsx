import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Lock } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useStore, toDateKey, getStreak } from '@/store/useStore';
import { useProStore } from '@/store/useProStore';
import ShareCardPanel from '@/components/ShareCardPanel';
import { fmtFocus } from '@/lib/format';

const WEEKS = 16;

const InsightsDialog = () => {
  const history = useStore(s => s.stats.dailyHistory);
  const totalMinutes = useStore(s => s.stats.totalMinutes);
  const { isPro, openUpgrade } = useProStore();

  const { week, cells, best, longest } = useMemo(() => {
    const byDate = new Map(history.map(h => [h.date, h]));
    const day = 86400000;

    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * day);
      return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), minutes: byDate.get(toDateKey(d))?.minutes ?? 0 };
    });

    const total = WEEKS * 7;
    const start = new Date(Date.now() - (total - 1) * day);
    const lead = start.getDay();
    const cells: ({ date: string; count: number } | null)[] = Array(lead).fill(null);
    for (let i = 0; i < total; i++) {
      const key = toDateKey(new Date(start.getTime() + i * day));
      cells.push({ date: key, count: byDate.get(key)?.count ?? 0 });
    }

    const best = history.reduce((m, h) => (h.count > m.count ? h : m), { date: '', count: 0, minutes: 0 });

    // longest streak across stored history
    const days = history.filter(h => h.count > 0).map(h => h.date).sort();
    let longest = 0, run = 0, prev = '';
    days.forEach(d => {
      const expected = prev ? toDateKey(new Date(new Date(prev + 'T00:00:00').getTime() + day)) : '';
      run = prev && d === expected ? run + 1 : 1;
      longest = Math.max(longest, run);
      prev = d;
    });
    return { week, cells, best, longest };
  }, [history]);

  const shade = (c: number) =>
    c === 0 ? 'bg-muted/60' : c === 1 ? 'bg-primary/30' : c <= 3 ? 'bg-primary/55' : c <= 5 ? 'bg-primary/80' : 'bg-primary';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          className="p-2 rounded-xl glass-panel text-muted-foreground hover:text-foreground"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title="Insights"
        >
          <BarChart3 size={18} />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Your focus insights</DialogTitle>
          <DialogDescription>
            {fmtFocus(totalMinutes)} focused in total · current streak {getStreak(history)}d · longest {longest}d
            {best.count > 0 && ` · best day ${best.count} sessions`}
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Last 7 days (minutes)</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={(v: number) => [`${v} min`, 'Focus']} />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Last {WEEKS} weeks</p>
          <div className="relative">
          <div className={`grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto ${isPro ? '' : 'blur-sm pointer-events-none select-none'}`}>
            {cells.map((c, i) =>
              c ? (
                <div key={c.date} title={`${c.date}: ${c.count} sessions`} className={`w-3.5 h-3.5 rounded-sm ${shade(c.count)}`} />
              ) : (
                <div key={`b${i}`} className="w-3.5 h-3.5" />
              )
            )}
          </div>
          {!isPro && (
            <button onClick={openUpgrade} className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium text-primary">
              <Lock size={14} /> Unlock heatmap with Pro
            </button>
          )}
          </div>
        </div>

        <ShareCardPanel />
      </DialogContent>
    </Dialog>
  );
};

export default InsightsDialog;

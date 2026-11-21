import { useState } from 'react';
import { Hourglass, Plus, Trash2 } from 'lucide-react';
import { useStore, toDateKey } from '@/store/useStore';
import { useProStore } from '@/store/useProStore';

const FREE_LIMIT = 1;

const daysLeft = (date: string) => {
  const target = new Date(date + 'T00:00:00').getTime();
  const today = new Date(toDateKey() + 'T00:00:00').getTime();
  return Math.round((target - today) / 86400000);
};

const label = (n: number) => (n === 0 ? 'Today' : n > 0 ? `${n} day${n === 1 ? '' : 's'} left` : `${-n}d ago`);

const CountdownPanel = () => {
  const countdowns = useStore(s => s.countdowns) ?? [];
  const addCountdown = useStore(s => s.addCountdown);
  const removeCountdown = useStore(s => s.removeCountdown);
  const { isPro, openUpgrade } = useProStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const locked = !isPro && countdowns.length >= FREE_LIMIT;

  const add = () => {
    if (!title.trim() || !date) return;
    if (locked) { openUpgrade(); return; }
    addCountdown(title.trim(), date);
    setTitle(''); setDate('');
  };

  const sorted = [...countdowns].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Hourglass size={16} /> Countdowns
      </div>

      {sorted.map(c => {
        const n = daysLeft(c.date);
        return (
          <div key={c.id} className="group flex items-center justify-between gap-2 text-sm">
            <span className="truncate">{c.title}</span>
            <span className="flex items-center gap-2 shrink-0">
              <span className={`text-xs ${n < 0 ? 'text-muted-foreground' : n <= 7 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{label(n)}</span>
              <button onClick={() => removeCountdown(c.id)} aria-label="Remove" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                <Trash2 size={13} />
              </button>
            </span>
          </div>
        );
      })}

      <div className="flex gap-2">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Exam, deadline…"
          className="min-w-0 flex-1 bg-muted/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/30"
        />
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-muted/50 rounded-xl px-2 py-2 text-xs outline-none focus:ring-2 ring-primary/30"
        />
        <button onClick={add} aria-label="Add countdown" className="rounded-xl bg-primary text-primary-foreground px-3">
          <Plus size={16} />
        </button>
      </div>
      {locked && <p className="text-[11px] text-muted-foreground">Free plan: 1 countdown. Go Pro for unlimited.</p>}
    </div>
  );
};

export default CountdownPanel;

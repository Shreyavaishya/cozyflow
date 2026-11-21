import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

const PRESETS = [1, 2, 5, 10, 15, 25, 40, 50, 90];
const MAX = 180;

const keyFor = { focus: 'focusDuration', shortBreak: 'shortBreakDuration', longBreak: 'longBreakDuration' } as const;

/** Quick duration picker for the current mode: presets plus any custom minutes (1 to 180). */
const DurationEditor = () => {
  const mode = useStore(s => s.mode);
  const settings = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
  const resetTimer = useStore(s => s.resetTimer);
  const key = keyFor[mode];
  const current = settings[key];
  const [text, setText] = useState(String(current));

  useEffect(() => { setText(String(current)); }, [current, mode]);

  // Applies immediately: stops the timer and restarts it at the new length
  const set = (n: number) => {
    updateSettings({ [key]: Math.min(MAX, Math.max(1, Math.round(n))) });
    resetTimer();
  };

  const commit = () => {
    const n = parseInt(text, 10);
    if (Number.isFinite(n)) set(n); else setText(String(current));
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
      {PRESETS.map(p => (
        <button
          key={p}
          onClick={() => set(p)}
          className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
            current === p ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          {p}m
        </button>
      ))}
      <div className="flex items-center gap-1 rounded-lg bg-muted/60 px-2 py-1">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && (e.currentTarget.blur())}
          aria-label="Custom minutes"
          className="w-12 bg-transparent text-xs text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-muted-foreground">min</span>
      </div>
    </div>
  );
};

export default DurationEditor;

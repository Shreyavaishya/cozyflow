import { describe, it, expect } from 'vitest';
import { getStreak, toDateKey } from '@/store/useStore';
import { mergeRemote, pickSyncable } from '@/lib/sync';
import { useStore } from '@/store/useStore';

const daysAgo = (n: number) => toDateKey(new Date(Date.now() - n * 86400000));
const rec = (n: number) => ({ date: daysAgo(n), count: 1, minutes: 25 });

describe('streak', () => {
  it('counts consecutive days including today', () => {
    expect(getStreak([rec(0), rec(1), rec(2)])).toBe(3);
  });
  it('does not break if today has no session yet', () => {
    expect(getStreak([rec(1), rec(2)])).toBe(2);
  });
  it('resets after a missed day', () => {
    expect(getStreak([rec(2), rec(3)])).toBe(0);
  });
});

describe('mergeRemote', () => {
  it('keeps the higher per-day values and unions tasks', () => {
    const local = pickSyncable(useStore.getState());
    local.stats.dailyHistory = [{ date: daysAgo(0), count: 2, minutes: 50 }];
    local.tasks = [{ id: 'a', text: 'a', completed: false, createdAt: 1, pomodoros: 1 }];
    const merged = mergeRemote(local, {
      stats: { totalSessions: 5, totalMinutes: 125, dailyHistory: [{ date: daysAgo(0), count: 3, minutes: 75 }, rec(1)] },
      tasks: [{ id: 'b', text: 'b', completed: true, createdAt: 2, pomodoros: 0 }],
    });
    expect(merged.stats.dailyHistory.find(h => h.date === daysAgo(0))?.count).toBe(3);
    expect(merged.stats.dailyHistory.length).toBe(2);
    expect(merged.tasks.map(t => t.id)).toEqual(['a', 'b']);
  });
});

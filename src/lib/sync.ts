import { useStore, SessionRecord, Task, Countdown } from '@/store/useStore';

export const pickSyncable = (s: ReturnType<typeof useStore.getState>) => ({
  theme: s.theme,
  settings: s.settings,
  stats: s.stats,
  tasks: s.tasks,
  countdowns: s.countdowns,
  activeTaskId: s.activeTaskId,
  plantStage: s.plantStage,
  sessionsCompleted: s.sessionsCompleted,
});

export type SyncData = ReturnType<typeof pickSyncable>;

const mergeHistory = (a: SessionRecord[] = [], b: SessionRecord[] = []) => {
  const map = new Map<string, SessionRecord>();
  [...a, ...b].forEach(r => {
    const prev = map.get(r.date);
    map.set(r.date, prev
      ? { date: r.date, count: Math.max(prev.count, r.count), minutes: Math.max(prev.minutes, r.minutes) }
      : r);
  });
  return [...map.values()].sort((x, y) => x.date.localeCompare(y.date)).slice(-365);
};

const mergeTasks = (a: Task[] = [], b: Task[] = []) => {
  const map = new Map<string, Task>();
  [...a, ...b].forEach(t => {
    const prev = map.get(t.id);
    map.set(t.id, prev
      ? { ...prev, completed: prev.completed || t.completed, pomodoros: Math.max(prev.pomodoros ?? 0, t.pomodoros ?? 0) }
      : t);
  });
  return [...map.values()].sort((x, y) => x.createdAt - y.createdAt);
};

const mergeCountdowns = (a: Countdown[] = [], b: Countdown[] = []) => {
  const map = new Map<string, Countdown>();
  [...a, ...b].forEach(c => map.set(c.id, c));
  return [...map.values()].slice(0, 20);
};

/** Merge remote data into local so nothing is lost when a user signs in on a new device. */
export const mergeRemote = (local: SyncData, remote: Partial<SyncData> | null): SyncData => {
  if (!remote || Object.keys(remote).length === 0) return local;
  return {
    theme: remote.theme ?? local.theme,
    settings: { ...local.settings, ...(remote.settings ?? {}) },
    stats: {
      totalSessions: Math.max(local.stats.totalSessions, remote.stats?.totalSessions ?? 0),
      totalMinutes: Math.max(local.stats.totalMinutes, remote.stats?.totalMinutes ?? 0),
      dailyHistory: mergeHistory(local.stats.dailyHistory, remote.stats?.dailyHistory),
    },
    tasks: mergeTasks(local.tasks, remote.tasks),
    countdowns: mergeCountdowns(local.countdowns, remote.countdowns),
    activeTaskId: remote.activeTaskId ?? local.activeTaskId,
    plantStage: Math.max(local.plantStage, remote.plantStage ?? 0) as SyncData['plantStage'],
    sessionsCompleted: Math.max(local.sessionsCompleted, remote.sessionsCompleted ?? 0),
  };
};

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type PlantStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  pomodoros: number;
}

export interface SessionRecord {
  date: string; // YYYY-MM-DD (local time)
  count: number;
  minutes: number;
}

import type { SceneId } from '@/lib/scenes';
import type { ChimeId } from '@/lib/chime';

export type FontStyle = 'modern' | 'grotesk' | 'rounded' | 'mono' | 'classic';
export type AccentId = 'terracotta' | 'sage' | 'ocean' | 'lavender' | 'rose' | 'amber' | 'graphite';

export interface Countdown {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD, local
}

interface Settings {
  scene: SceneId;
  chime: ChimeId;
  fontStyle: FontStyle;
  accent: AccentId;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
  cursorGlow: boolean; // optional decorative glow; never replaces the native cursor
  dailyGoalMinutes: number; // minutes of focus to aim for each day
  soundEnabled: boolean;
  backgroundIntensity: number;
  notificationsEnabled: boolean;
}

interface Stats {
  totalSessions: number;
  totalMinutes: number;
  dailyHistory: SessionRecord[];
}

interface StoreState {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Timer
  mode: TimerMode;
  setMode: (mode: TimerMode) => void;
  isRunning: boolean;
  setIsRunning: (v: boolean) => void;
  timeLeft: number;
  setTimeLeft: (v: number) => void;
  startTimestamp: number | null;
  setStartTimestamp: (v: number | null) => void;
  pausedTimeLeft: number | null;
  setPausedTimeLeft: (v: number | null) => void;
  sessionsCompleted: number;
  incrementSession: () => void;
  resetTimer: () => void;

  // Settings
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;

  // Stats
  stats: Stats;
  recordSession: (minutes: number) => void;

  // Tasks
  tasks: Task[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  activeTaskId: string | null;
  setActiveTask: (id: string | null) => void;

  // Plant
  plantStage: PlantStage;
  growPlant: () => void;
  resetPlant: () => void;

  // Focus mode
  focusModeActive: boolean;
  setFocusMode: (v: boolean) => void;

  // Countdowns (exam / deadline)
  countdowns: Countdown[];
  addCountdown: (title: string, date: string) => void;
  removeCountdown: (id: string) => void;

  // Ambient sound mixer (not persisted: browsers block autoplay on reload)
  mixer: Record<string, { on: boolean; volume: number }>;
  toggleSound: (id: string) => void;
  setSoundVolume: (id: string, v: number) => void;
}

// Local-time date key (toISOString is UTC and breaks streaks for users like IST)
export const toDateKey = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const getToday = () => toDateKey();

export const getSessionsToday = (history: SessionRecord[]) =>
  history.find(h => h.date === getToday())?.count ?? 0;

export const getSessionsThisWeek = (history: SessionRecord[]) => {
  const keys = new Set(Array.from({ length: 7 }, (_, i) => toDateKey(new Date(Date.now() - i * 86400000))));
  return history.filter(h => keys.has(h.date)).reduce((a, h) => a + h.count, 0);
};

export interface StreakInfo {
  streak: number;       // days with at least one session in the chain
  frozenDays: string[]; // missed days that a streak freeze bridged (never includes trailing days)
}

const DAY_MS = 86400000;

/**
 * Streak = consecutive days with at least one session. Derived from history, so a missed day breaks it.
 *
 * With `freeze` (a Pro perk) one missed day does not break the streak, at most once in any 7-day window.
 * It is computed only from history, so there is nothing extra to store or sync and every device agrees.
 * A bridged day only counts if an earlier session day follows it, and it never adds to the streak number.
 */
export const getStreakInfo = (history: SessionRecord[], freeze = false): StreakInfo => {
  const days = new Set(history.filter(h => h.count > 0).map(h => h.date));
  let cursor = new Date();
  if (!days.has(toDateKey(cursor))) cursor = new Date(cursor.getTime() - DAY_MS); // today not done yet: don't break

  let streak = 0;
  let frozenDays: string[] = [];
  let pending: string[] = [];      // bridged days waiting for an earlier session day to connect to
  let sinceFreeze = Infinity;      // days walked back since the last bridged day

  for (let i = 0; i < 800; i++) {
    const key = toDateKey(cursor);
    if (days.has(key)) {
      streak++;
      frozenDays = frozenDays.concat(pending);
      pending = [];
    } else if (freeze && sinceFreeze >= 7) {
      pending.push(key);
      sinceFreeze = 0;
    } else {
      break;
    }
    cursor = new Date(cursor.getTime() - DAY_MS);
    sinceFreeze++;
  }
  return { streak, frozenDays };
};

export const getStreak = (history: SessionRecord[], freeze = false) => getStreakInfo(history, freeze).streak;

export const getMinutesToday = (history: SessionRecord[]) =>
  history.find(h => h.date === getToday())?.minutes ?? 0;

export interface GoalProgress {
  minutes: number;
  goal: number;
  ratio: number; // 0 to 1
  reached: boolean;
}

export const getGoalProgress = (history: SessionRecord[], goalMinutes: number): GoalProgress => {
  const goal = Math.max(1, Math.round(goalMinutes || 0));
  const minutes = getMinutesToday(history);
  return { minutes, goal, ratio: Math.min(1, minutes / goal), reached: minutes >= goal };
};

const getDuration = (mode: TimerMode, settings: Settings) => {
  switch (mode) {
    case 'focus': return settings.focusDuration * 60;
    case 'shortBreak': return settings.shortBreakDuration * 60;
    case 'longBreak': return settings.longBreakDuration * 60;
  }
};

// Data saved by older app versions. Loosely typed on purpose: it is upgraded field by field in `migrate`.
interface LegacyPersisted {
  stats?: { totalSessions?: number; dailyHistory?: { date: string; count: number }[] };
  tasks?: Partial<Task>[];
  settings?: Record<string, unknown> & { focusDuration?: number };
  countdowns?: Countdown[];
  activeSound?: unknown;
  soundVolume?: unknown;
  [key: string]: unknown;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      toggleTheme: () => set(s => {
        const next = s.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        return { theme: next };
      }),

      // Timer
      mode: 'focus',
      setMode: (mode) => {
        const duration = getDuration(mode, get().settings);
        set({ mode, timeLeft: duration, isRunning: false, startTimestamp: null, pausedTimeLeft: null });
      },
      isRunning: false,
      setIsRunning: (v) => set({ isRunning: v }),
      timeLeft: 25 * 60,
      setTimeLeft: (v) => set({ timeLeft: v }),
      startTimestamp: null,
      setStartTimestamp: (v) => set({ startTimestamp: v }),
      pausedTimeLeft: null,
      setPausedTimeLeft: (v) => set({ pausedTimeLeft: v }),
      sessionsCompleted: 0,
      incrementSession: () => set(s => ({ sessionsCompleted: s.sessionsCompleted + 1 })),
      resetTimer: () => {
        const { mode, settings } = get();
        set({ timeLeft: getDuration(mode, settings), isRunning: false, startTimestamp: null, pausedTimeLeft: null });
      },

      // Settings
      settings: {
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        autoStartBreaks: false,
        autoStartSessions: false,
        cursorGlow: false,
        dailyGoalMinutes: 60,
        scene: 'default',
        chime: 'bell',
        fontStyle: 'modern',
        accent: 'terracotta',
        soundEnabled: true,
        backgroundIntensity: 0.7,
        notificationsEnabled: true,
      },
      updateSettings: (s) => set(state => {
        const newSettings = { ...state.settings, ...s };
        const newTimeLeft = state.isRunning ? state.timeLeft : getDuration(state.mode, newSettings);
        return { settings: newSettings, timeLeft: newTimeLeft };
      }),

      // Stats
      stats: { totalSessions: 0, totalMinutes: 0, dailyHistory: [] },
      recordSession: (minutes) => set(s => {
        const today = getToday();
        const exists = s.stats.dailyHistory.some(h => h.date === today);
        const history = exists
          ? s.stats.dailyHistory.map(h => h.date === today ? { ...h, count: h.count + 1, minutes: h.minutes + minutes } : h)
          : [...s.stats.dailyHistory, { date: today, count: 1, minutes }];
        const tasks = s.activeTaskId
          ? s.tasks.map(t => t.id === s.activeTaskId ? { ...t, pomodoros: (t.pomodoros ?? 0) + 1 } : t)
          : s.tasks;
        return {
          tasks,
          stats: {
            totalSessions: s.stats.totalSessions + 1,
            totalMinutes: s.stats.totalMinutes + minutes,
            dailyHistory: history.slice(-365),
          },
        };
      }),

      // Tasks
      tasks: [],
      addTask: (text) => set(s => ({
        tasks: [...s.tasks, { id: crypto.randomUUID(), text, completed: false, createdAt: Date.now(), pomodoros: 0 }]
      })),
      toggleTask: (id) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),
      deleteTask: (id) => set(s => ({
        tasks: s.tasks.filter(t => t.id !== id),
        activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
      })),
      activeTaskId: null,
      setActiveTask: (id) => set(s => ({ activeTaskId: s.activeTaskId === id ? null : id })),

      // Plant
      plantStage: 0 as PlantStage,
      growPlant: () => set(s => ({ plantStage: Math.min(5, s.plantStage + 1) as PlantStage })),
      resetPlant: () => set({ plantStage: 0 as PlantStage }),

      // Focus mode
      focusModeActive: false,
      setFocusMode: (v) => set({ focusModeActive: v }),

      // Countdowns
      countdowns: [],
      addCountdown: (title, date) => set(s => ({
        countdowns: [...s.countdowns, { id: crypto.randomUUID(), title, date }].slice(0, 20),
      })),
      removeCountdown: (id) => set(s => ({ countdowns: s.countdowns.filter(c => c.id !== id) })),

      // Sound mixer
      mixer: {},
      toggleSound: (id) => set(s => {
        const cur = s.mixer[id] ?? { on: false, volume: 0.5 };
        return { mixer: { ...s.mixer, [id]: { ...cur, on: !cur.on } } };
      }),
      setSoundVolume: (id, v) => set(s => {
        const cur = s.mixer[id] ?? { on: false, volume: 0.5 };
        return { mixer: { ...s.mixer, [id]: { ...cur, volume: v } } };
      }),
    }),
    {
      name: 'cozy-pomodoro-storage',
      version: 7,
      migrate: (persistedState, version) => {
        const persisted = persistedState as LegacyPersisted | null;
        if (version < 2 && persisted) {
          const old = persisted.stats ?? {};
          const focus = persisted.settings?.focusDuration ?? 25;
          const history = (old.dailyHistory ?? []).map(h => ({ date: h.date, count: h.count, minutes: h.count * focus }));
          persisted.stats = {
            totalSessions: old.totalSessions ?? 0,
            totalMinutes: (old.totalSessions ?? 0) * focus,
            dailyHistory: history,
          } as LegacyPersisted['stats'];
          persisted.tasks = (persisted.tasks ?? []).map(t => ({ ...t, pomodoros: t.pomodoros ?? 0 }));
        }
        if (persisted) {
          delete persisted.activeSound;
          delete persisted.soundVolume;
          persisted.settings = { scene: 'default', chime: 'bell', fontStyle: 'modern', accent: 'terracotta', cursorGlow: false, dailyGoalMinutes: 60, ...(persisted.settings ?? {}) };
          delete persisted.settings.cursorEnabled; // old custom-cursor flag, no longer used
          persisted.countdowns = persisted.countdowns ?? [];
        }
        return persisted as unknown as StoreState;
      },
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        stats: state.stats,
        tasks: state.tasks,
        countdowns: state.countdowns,
        activeTaskId: state.activeTaskId,
        plantStage: state.plantStage,
        sessionsCompleted: state.sessionsCompleted,
      }),
    }
  )
);
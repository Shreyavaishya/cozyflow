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
  cursorEnabled: boolean;
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

// Streak is derived from history so it resets correctly when a day is missed.
export const getStreak = (history: SessionRecord[]) => {
  const days = new Set(history.filter(h => h.count > 0).map(h => h.date));
  let cursor = new Date();
  if (!days.has(toDateKey(cursor))) cursor = new Date(Date.now() - 86400000); // today not done yet: don't break
  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
};

const getDuration = (mode: TimerMode, settings: Settings) => {
  switch (mode) {
    case 'focus': return settings.focusDuration * 60;
    case 'shortBreak': return settings.shortBreakDuration * 60;
    case 'longBreak': return settings.longBreakDuration * 60;
  }
};

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
        cursorEnabled: true,
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
      version: 5,
      migrate: (persisted: any, version) => {
        if (version < 2 && persisted) {
          const old = persisted.stats ?? {};
          const focus = persisted.settings?.focusDuration ?? 25;
          const history = (old.dailyHistory ?? []).map((h: any) => ({ date: h.date, count: h.count, minutes: h.count * focus }));
          persisted.stats = {
            totalSessions: old.totalSessions ?? 0,
            totalMinutes: (old.totalSessions ?? 0) * focus,
            dailyHistory: history,
          };
          persisted.tasks = (persisted.tasks ?? []).map((t: any) => ({ ...t, pomodoros: t.pomodoros ?? 0 }));
        }
        if (persisted) {
          delete persisted.activeSound; delete persisted.soundVolume;
          persisted.settings = { scene: 'default', chime: 'bell', fontStyle: 'modern', accent: 'terracotta', ...(persisted.settings ?? {}) };
          persisted.countdowns = persisted.countdowns ?? [];
        }
        return persisted;
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

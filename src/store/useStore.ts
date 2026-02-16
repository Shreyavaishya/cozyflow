import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type PlantStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface SessionRecord {
  date: string; // YYYY-MM-DD
  count: number;
}

interface Settings {
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
  sessionsToday: number;
  lastSessionDate: string;
  dailyHistory: SessionRecord[];
  currentStreak: number;
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
  recordSession: () => void;

  // Tasks
  tasks: Task[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Plant
  plantStage: PlantStage;
  growPlant: () => void;
  resetPlant: () => void;

  // Focus mode
  focusModeActive: boolean;
  setFocusMode: (v: boolean) => void;

  // Ambient sound
  activeSound: string | null;
  setActiveSound: (s: string | null) => void;
  soundVolume: number;
  setSoundVolume: (v: number) => void;
}

const getToday = () => new Date().toISOString().split('T')[0];

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
      stats: { totalSessions: 0, sessionsToday: 0, lastSessionDate: '', dailyHistory: [], currentStreak: 0 },
      recordSession: () => set(s => {
        const today = getToday();
        const history = [...s.stats.dailyHistory];
        const todayEntry = history.find(h => h.date === today);
        if (todayEntry) todayEntry.count++;
        else history.push({ date: today, count: 1 });

        const sessionsToday = s.stats.lastSessionDate === today ? s.stats.sessionsToday + 1 : 1;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const streak = (s.stats.lastSessionDate === today || s.stats.lastSessionDate === yesterday)
          ? (s.stats.lastSessionDate === today ? s.stats.currentStreak : s.stats.currentStreak + 1)
          : 1;

        return {
          stats: {
            totalSessions: s.stats.totalSessions + 1,
            sessionsToday,
            lastSessionDate: today,
            dailyHistory: history.slice(-30),
            currentStreak: streak,
          }
        };
      }),

      // Tasks
      tasks: [],
      addTask: (text) => set(s => ({
        tasks: [...s.tasks, { id: crypto.randomUUID(), text, completed: false, createdAt: Date.now() }]
      })),
      toggleTask: (id) => set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      })),
      deleteTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),

      // Plant
      plantStage: 0 as PlantStage,
      growPlant: () => set(s => ({ plantStage: Math.min(5, s.plantStage + 1) as PlantStage })),
      resetPlant: () => set({ plantStage: 0 as PlantStage }),

      // Focus mode
      focusModeActive: false,
      setFocusMode: (v) => set({ focusModeActive: v }),

      // Sound
      activeSound: null,
      setActiveSound: (s) => set({ activeSound: s }),
      soundVolume: 0.5,
      setSoundVolume: (v) => set({ soundVolume: v }),
    }),
    {
      name: 'cozy-pomodoro-storage',
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        stats: state.stats,
        tasks: state.tasks,
        plantStage: state.plantStage,
        sessionsCompleted: state.sessionsCompleted,
        activeSound: state.activeSound,
        soundVolume: state.soundVolume,
      }),
    }
  )
);

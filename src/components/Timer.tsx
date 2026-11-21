import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { useStore, TimerMode } from '@/store/useStore';
import ProgressRing from './ProgressRing';
import { playChime } from '@/lib/chime';
import DurationEditor from './DurationEditor';

const modeLabels: Record<TimerMode, string> = {
  focus: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

const modeColors: Record<TimerMode, string> = {
  focus: 'text-primary',
  shortBreak: 'text-emerald-500 dark:text-emerald-400',
  longBreak: 'text-blue-500 dark:text-blue-400',
};

const Timer = () => {
  const {
    mode, setMode, isRunning, setIsRunning,
    timeLeft, setTimeLeft, startTimestamp, setStartTimestamp,
    pausedTimeLeft, setPausedTimeLeft, sessionsCompleted,
    incrementSession, resetTimer, settings, recordSession, growPlant,
  } = useStore();

  const totalDuration = settings[mode === 'focus' ? 'focusDuration' : mode === 'shortBreak' ? 'shortBreakDuration' : 'longBreakDuration'] * 60;

  const completeSession = useCallback((counted: boolean = true) => {
    setIsRunning(false);
    setStartTimestamp(null);
    setPausedTimeLeft(null);

    if (counted && settings.soundEnabled) {
      playChime(settings.chime ?? 'bell');
    }

    if (counted && settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('🍅 Cozy Flow', {
        body: mode === 'focus' ? 'Great work! Time for a break.' : 'Break is over. Ready to focus?',
      });
    }

    if (mode === 'focus') {
      if (counted) {
        incrementSession();
        recordSession(settings.focusDuration);
        growPlant();
      }
      const next: TimerMode = counted && (sessionsCompleted + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(next);
      if (counted && settings.autoStartBreaks) {
        setTimeout(() => {
          setStartTimestamp(Date.now());
          setIsRunning(true);
        }, 500);
      }
    } else {
      setMode('focus');
      if (counted && settings.autoStartSessions) {
        setTimeout(() => {
          setStartTimestamp(Date.now());
          setIsRunning(true);
        }, 500);
      }
    }
  }, [mode, settings, sessionsCompleted, incrementSession, recordSession, growPlant, setMode, setIsRunning, setStartTimestamp, setPausedTimeLeft]);

  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      if (!startTimestamp) return;
      const base = pausedTimeLeft ?? totalDuration;
      const elapsed = (Date.now() - startTimestamp) / 1000;
      const remaining = Math.max(0, base - elapsed);
      setTimeLeft(Math.ceil(remaining));
      if (remaining <= 0) {
        completeSession(true);
      }
    };

    const id = setInterval(tick, 200);
    tick();
    return () => clearInterval(id);
  }, [isRunning, startTimestamp, pausedTimeLeft, totalDuration, setTimeLeft, completeSession]);

  // Show countdown in the browser tab so the app works from a background tab
  useEffect(() => {
    const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const ss = String(timeLeft % 60).padStart(2, '0');
    document.title = isRunning ? `${mm}:${ss} · ${modeLabels[mode]} | Cozy Flow` : 'Cozy Flow';
    return () => { document.title = 'Cozy Flow'; };
  }, [timeLeft, isRunning, mode]);

  const handleStart = () => {
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setStartTimestamp(Date.now());
    if (!isRunning && timeLeft < totalDuration) {
      setPausedTimeLeft(timeLeft);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setPausedTimeLeft(timeLeft);
    setStartTimestamp(null);
    setIsRunning(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / totalDuration;

  return (
    <motion.div
      className="flex flex-col items-center gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >

      {/* Mode selector */}
      <div className="flex gap-2 glass-panel rounded-2xl p-1.5">
        {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <motion.button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === m ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {modeLabels[m]}
          </motion.button>
        ))}
      </div>

      {/* Timer display */}
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        <div className="absolute inset-0 rounded-full timer-glow" />
        <ProgressRing progress={progress} />
        <div className="flex flex-col items-center z-10">
          <AnimatePresence mode="wait">
            <motion.span
              key={timeLeft}
              className={`text-6xl timer-digits font-serif ${modeColors[mode]}`}
              initial={{ opacity: 0.6, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </motion.span>
          </AnimatePresence>
          <span className="text-sm text-muted-foreground mt-1">{modeLabels[mode]}</span>
        </div>
      </div>

      {/* Session indicator */}
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${
              i < sessionsCompleted % 4 ? 'bg-primary' : 'bg-muted'
            }`}
            animate={{ scale: i < sessionsCompleted % 4 ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <DurationEditor />

      {/* Controls */}
      <div className="flex gap-3 items-center">
        <motion.button
          onClick={resetTimer}
          className="p-3 rounded-xl glass-panel text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          <RotateCcw size={20} />
        </motion.button>

        <motion.button
          onClick={isRunning ? handlePause : handleStart}
          className="p-5 rounded-2xl bg-primary text-primary-foreground shadow-lg"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-0.5" />}
        </motion.button>

        <motion.button
          onClick={() => completeSession(false)}
          className="p-3 rounded-xl glass-panel text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          <SkipForward size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Timer;

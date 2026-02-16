import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Settings, Maximize, Minimize } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Timer from '@/components/Timer';
import AnimatedBackground from '@/components/AnimatedBackground';
import CustomCursor from '@/components/CustomCursor';
import PlantWidget from '@/components/PlantWidget';
import SoundPanel from '@/components/SoundPanel';
import TaskPanel from '@/components/TaskPanel';
import StatsPanel from '@/components/StatsPanel';
import SettingsModal from '@/components/SettingsModal';

const Index = () => {
  const { theme, toggleTheme, focusModeActive, setFocusMode } = useStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Escape exits focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusModeActive) setFocusMode(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusModeActive, setFocusMode]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <AnimatedBackground />
      <CustomCursor />

      <AnimatePresence>
        {!focusModeActive && (
          <motion.header
            className="flex items-center justify-between px-6 py-4 z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              🍅 Cozy Pomodoro
            </h1>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setFocusMode(true)}
                className="p-2 rounded-xl glass-panel text-muted-foreground hover:text-foreground"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <Maximize size={18} />
              </motion.button>
              <motion.button
                onClick={toggleTheme}
                className="p-2 rounded-xl glass-panel text-muted-foreground hover:text-foreground"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </motion.button>
              <motion.button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-xl glass-panel text-muted-foreground hover:text-foreground"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <Settings size={18} />
              </motion.button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex-1 flex items-center justify-center z-10 px-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 max-w-5xl w-full">
          {/* Side panels — left */}
          <AnimatePresence>
            {!focusModeActive && (
              <motion.div
                className="hidden lg:flex flex-col gap-4 w-72"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
              >
                <StatsPanel />
                <SoundPanel />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center — Timer + Plant */}
          <div className="flex flex-col items-center gap-6 flex-1">
            <Timer />
            <PlantWidget />

            {focusModeActive && (
              <motion.button
                onClick={() => setFocusMode(false)}
                className="p-2 rounded-xl glass-panel text-muted-foreground hover:text-foreground mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <Minimize size={18} />
              </motion.button>
            )}
          </div>

          {/* Side panels — right */}
          <AnimatePresence>
            {!focusModeActive && (
              <motion.div
                className="hidden lg:flex flex-col gap-4 w-72"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4 }}
              >
                <TaskPanel />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile panels */}
          <AnimatePresence>
            {!focusModeActive && (
              <motion.div
                className="lg:hidden flex flex-col gap-4 w-full max-w-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <StatsPanel />
                <TaskPanel />
                <SoundPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;

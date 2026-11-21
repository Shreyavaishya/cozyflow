import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Settings, Maximize, Minimize } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Timer from '@/components/Timer';
import SceneBackground from '@/components/SceneBackground';
import { SCENES, SceneId } from '@/lib/scenes';
import CustomCursor from '@/components/CustomCursor';
import PlantWidget from '@/components/PlantWidget';
import SoundPanel from '@/components/SoundPanel';
import TaskPanel from '@/components/TaskPanel';
import StatsPanel from '@/components/StatsPanel';
import SettingsModal from '@/components/SettingsModal';
import AccountButton from '@/components/AccountButton';
import InsightsDialog from '@/components/InsightsDialog';
import UpgradeDialog from '@/components/UpgradeDialog';
import { useProStore } from '@/store/useProStore';
import { Crown } from 'lucide-react';
import { useCloudSync } from '@/hooks/useCloudSync';
import SponsorCard from '@/components/SponsorCard';
import CountdownPanel from '@/components/CountdownPanel';
import LeaderboardDialog from '@/components/LeaderboardDialog';
import SceneToggle from '@/components/SceneToggle';

const Index = () => {
  const { theme, toggleTheme, focusModeActive, setFocusMode } = useStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const cloud = useCloudSync();
  const { isPro, openUpgrade, load: loadPro } = useProStore();
  // Landing page "Get Pro" button links to /app?upgrade=1
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('upgrade')) openUpgrade();
    const scene = q.get('scene');
    if (scene && SCENES.some(sc => sc.id === scene && !sc.pro)) useStore.getState().updateSettings({ scene: scene as SceneId });
  }, []);
  useEffect(() => { if (cloud.authReady) loadPro(cloud.session?.user.id ?? null); }, [cloud.session, cloud.authReady]);

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
      <SceneBackground />
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
            <h1 className="text-xl font-serif font-semibold text-foreground">
              <a href="/" className="flex items-center gap-2" title="Back to home">🍅 Cozy Flow</a>
            </h1>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={openUpgrade}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl glass-panel text-xs font-medium ${isPro ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Crown size={14} /> {isPro ? 'Pro' : 'Go Pro'}
              </motion.button>
              <SceneToggle />
              <LeaderboardDialog session={cloud.session} />
              <InsightsDialog />
              <AccountButton {...cloud} />
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
            <SponsorCard />

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
                <><TaskPanel /><CountdownPanel /></>
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
                <><TaskPanel /><CountdownPanel /></>
                <SoundPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <UpgradeDialog session={cloud.session} />

      {!focusModeActive && (
        <footer className="z-10 py-3 text-center text-xs text-muted-foreground">
          <a href="/sponsor" className="hover:text-foreground">Sponsor Cozy Flow</a>
        </footer>
      )}
    </div>
  );
};

export default Index;

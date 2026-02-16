import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2, CloudRain, Coffee, Flame, Radio } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useStore } from '@/store/useStore';

const sounds = [
  { id: 'rain', label: 'Rain', icon: CloudRain, url: 'https://cdn.freesound.org/previews/531/531947_6364864-lq.mp3' },
  { id: 'cafe', label: 'Café', icon: Coffee, url: 'https://cdn.freesound.org/previews/424/424899_5765668-lq.mp3' },
  { id: 'fire', label: 'Fire', icon: Flame, url: 'https://cdn.freesound.org/previews/277/277021_3284006-lq.mp3' },
  { id: 'white', label: 'White', icon: Radio, url: 'https://cdn.freesound.org/previews/629/629627_13982855-lq.mp3' },
];

const SoundPanel = () => {
  const { activeSound, setActiveSound, soundVolume, setSoundVolume, settings } = useStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  const playAudio = useCallback((soundId: string) => {
    stopAudio();
    const sound = sounds.find(s => s.id === soundId);
    if (!sound) return;

    // Create and play synchronously within the user gesture
    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.volume = soundVolume;
    audio.play().catch(console.warn);
    audioRef.current = audio;
  }, [soundVolume, stopAudio]);

  const handleToggle = useCallback((id: string) => {
    if (activeSound === id) {
      stopAudio();
      setActiveSound(null);
    } else {
      if (settings.soundEnabled) {
        playAudio(id);
      }
      setActiveSound(id);
    }
  }, [activeSound, settings.soundEnabled, playAudio, stopAudio, setActiveSound]);

  // Stop audio when sound is disabled in settings
  useEffect(() => {
    if (!settings.soundEnabled) {
      stopAudio();
    }
  }, [settings.soundEnabled, stopAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = soundVolume;
  }, [soundVolume]);

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Volume2 size={16} />
        Ambient Sounds
      </div>
      <div className="grid grid-cols-4 gap-2">
        {sounds.map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            onClick={() => handleToggle(id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-colors ${
              activeSound === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon size={18} />
            {label}
          </motion.button>
        ))}
      </div>
      {activeSound && (
        <Slider
          value={[soundVolume * 100]}
          onValueChange={([v]) => setSoundVolume(v / 100)}
          max={100}
          step={1}
          className="mt-2"
        />
      )}
    </div>
  );
};

export default SoundPanel;

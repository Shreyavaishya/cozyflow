import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, CloudRain, Flame, Trees, Waves, Wind, Lock } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useStore } from '@/store/useStore';
import { useProStore } from '@/store/useProStore';

type SoundDef = { id: string; label: string; icon: typeof Volume2; url?: string; noise?: 'white' | 'brown'; pro?: boolean };

const sounds: SoundDef[] = [
  { id: 'rain', label: 'Rain', icon: CloudRain, url: '/sounds/rain.mp3' },
  { id: 'forest', label: 'Forest', icon: Trees, url: '/sounds/forest.mp3' },
  { id: 'fire', label: 'Fire', icon: Flame, url: '/sounds/fire.mp3' },
  { id: 'brown', label: 'Brown', icon: Waves, noise: 'brown', pro: true },
  { id: 'white', label: 'White', icon: Wind, noise: 'white', pro: true },
];

const makeNoiseBuffer = (ctx: AudioContext, type: 'white' | 'brown') => {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'white') data[i] = white * 0.4;
    else { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.5; }
  }
  return buf;
};

const SoundPanel = () => {
  const mixer = useStore(s => s.mixer);
  const toggleSound = useStore(s => s.toggleSound);
  const setSoundVolume = useStore(s => s.setSoundVolume);
  const soundEnabled = useStore(s => s.settings.soundEnabled);
  const { isPro, openUpgrade } = useProStore();

  const audios = useRef<Record<string, HTMLAudioElement>>({});
  const noises = useRef<Record<string, { src: AudioBufferSourceNode; gain: GainNode }>>({});
  const ctxRef = useRef<AudioContext | null>(null);

  const stop = (id: string) => {
    const a = audios.current[id];
    if (a) { a.pause(); a.src = ''; delete audios.current[id]; }
    const n = noises.current[id];
    if (n) { try { n.src.stop(); } catch { /* already stopped */ } n.src.disconnect(); n.gain.disconnect(); delete noises.current[id]; }
  };

  // Reconcile playing audio with mixer state
  useEffect(() => {
    sounds.forEach(def => {
      const st = mixer[def.id];
      const shouldPlay = !!st?.on && soundEnabled && (!def.pro || isPro);
      const vol = st?.volume ?? 0.5;

      if (!shouldPlay) { stop(def.id); return; }

      if (def.url) {
        let a = audios.current[def.id];
        if (!a) {
          a = new Audio(def.url);
          a.loop = true;
          audios.current[def.id] = a;
          a.play().catch(console.warn);
        }
        a.volume = vol;
      } else if (def.noise) {
        let n = noises.current[def.id];
        if (!n) {
          const ctx = (ctxRef.current ??= new AudioContext());
          if (ctx.state === 'suspended') ctx.resume();
          const src = ctx.createBufferSource();
          src.buffer = makeNoiseBuffer(ctx, def.noise);
          src.loop = true;
          const gain = ctx.createGain();
          src.connect(gain).connect(ctx.destination);
          src.start();
          n = { src, gain };
          noises.current[def.id] = n;
        }
        n.gain.gain.value = vol;
      }
    });
  }, [mixer, soundEnabled, isPro]);

  useEffect(() => () => { sounds.forEach(d => stop(d.id)); }, []);

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Volume2 size={16} />
        Ambient Mixer
      </div>
      <div className="grid grid-cols-5 gap-1">
        {sounds.map(({ id, label, icon: Icon, pro }) => {
          const locked = !!pro && !isPro;
          const on = !!mixer[id]?.on && !locked;
          return (
            <motion.button
              key={id}
              onClick={() => (locked ? openUpgrade() : toggleSound(id))}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] transition-colors ${
                on ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {locked ? <Lock size={18} /> : <Icon size={18} />}
              {label}
            </motion.button>
          );
        })}
      </div>
      <div className="space-y-2">
        {sounds.filter(d => mixer[d.id]?.on && (!d.pro || isPro)).map(d => (
          <div key={d.id} className="flex items-center gap-2">
            <span className="w-12 text-xs text-muted-foreground">{d.label}</span>
            <Slider
              value={[(mixer[d.id]?.volume ?? 0.5) * 100]}
              onValueChange={([v]) => setSoundVolume(d.id, v / 100)}
              max={100}
              step={1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundPanel;

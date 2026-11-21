export type ChimeId = 'bell' | 'soft' | 'marimba' | 'digital';

export const CHIMES: { id: ChimeId; label: string }[] = [
  { id: 'bell', label: 'Bell' },
  { id: 'soft', label: 'Soft' },
  { id: 'marimba', label: 'Marimba' },
  { id: 'digital', label: 'Digital' },
];

let ctx: AudioContext | null = null;

type Note = { freq: number; at: number; dur: number; type: OscillatorType; vol: number; attack?: number };

const play = (notes: Note[]) => {
  try {
    ctx = ctx ?? new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    notes.forEach(n => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = n.type;
      osc.frequency.value = n.freq;
      const t = now + n.at;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(n.vol, t + (n.attack ?? 0.02));
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + n.dur + 0.05);
    });
  } catch { /* audio unavailable */ }
};

/** Four synthesized chimes, no audio files needed. */
export const playChime = (id: ChimeId = 'bell') => {
  switch (id) {
    case 'soft':
      return play([523.25, 659.25, 783.99].map((freq, i) => ({ freq, at: i * 0.25, dur: 2.2, type: 'sine' as const, vol: 0.18, attack: 0.15 })));
    case 'marimba':
      return play([659.25, 783.99, 987.77, 1318.5].map((freq, i) => ({ freq, at: i * 0.14, dur: 0.7, type: 'triangle' as const, vol: 0.3, attack: 0.005 })));
    case 'digital':
      return play([0, 0.22, 0.44].map(at => ({ freq: 880, at, dur: 0.14, type: 'square' as const, vol: 0.08, attack: 0.005 })));
    case 'bell':
    default:
      return play([880, 1318.5, 1760].map((freq, i) => ({ freq, at: i * 0.18, dur: 1.6, type: 'sine' as const, vol: 0.25 / (i + 1) })));
  }
};

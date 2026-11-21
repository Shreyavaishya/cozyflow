import { useMemo } from 'react';
import type { ParticleKind } from '@/lib/scenes';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

type P = { style: React.CSSProperties };

const build = (kind: ParticleKind): P[] => {
  const mk = (n: number, f: (i: number) => React.CSSProperties) => Array.from({ length: n }, (_, i) => ({ style: f(i) }));
  const base: React.CSSProperties = { position: 'absolute' };

  switch (kind) {
    case 'petals':
      return mk(18, () => {
        const d = rnd(12, 22); const s = rnd(10, 16);
        return { ...base, left: `${rnd(0, 100)}%`, top: 0, width: s, height: s, opacity: 0.8, borderRadius: '150% 0 150% 0',
          background: 'linear-gradient(135deg,#ffc2d6,#ff8fb1)',
          ['--sway' as any]: `${rnd(-80, 80)}px`, ['--spin' as any]: `${rnd(300, 720)}deg`,
          animation: `scene-fall ${d}s linear ${-rnd(0, d)}s infinite` };
      });
    case 'leaves':
      return mk(14, () => {
        const d = rnd(14, 24); const s = rnd(14, 22);
        return { ...base, left: `${rnd(0, 100)}%`, top: 0, width: s, height: s, opacity: 0.85, borderRadius: '150% 0 150% 0',
          background: pick(['linear-gradient(135deg,#f08a3c,#c2411b)', 'linear-gradient(135deg,#e8b04a,#b5701f)', 'linear-gradient(135deg,#d9622b,#8f2a12)']),
          ['--sway' as any]: `${rnd(-90, 90)}px`, ['--spin' as any]: `${rnd(300, 720)}deg`,
          animation: `scene-fall ${d}s linear ${-rnd(0, d)}s infinite` };
      });
    case 'embers':
      return mk(22, () => {
        const d = rnd(6, 12); const s = rnd(2, 5);
        return { ...base, left: `${rnd(10, 90)}%`, top: 0, width: s, height: s, borderRadius: '50%', background: '#ffb347',
          boxShadow: '0 0 8px 2px rgba(255,138,61,0.8)', ['--sway' as any]: `${rnd(-40, 40)}px`,
          animation: `scene-rise ${d}s linear ${-rnd(0, d)}s infinite` };
      });
    case 'stars':
      return mk(46, () => {
        const s = rnd(1, 3);
        return { ...base, left: `${rnd(0, 100)}%`, top: `${rnd(0, 75)}%`, width: s, height: s, borderRadius: '50%', background: '#fff',
          boxShadow: '0 0 6px rgba(255,255,255,0.8)', animation: `scene-twinkle ${rnd(2, 6)}s ease-in-out ${-rnd(0, 6)}s infinite` };
      });
    case 'dust':
      return mk(18, () => {
        const s = rnd(2, 4);
        return { ...base, left: `${rnd(0, 100)}%`, top: `${rnd(0, 100)}%`, width: s, height: s, borderRadius: '50%', background: 'rgba(255,220,170,0.55)',
          ['--sway' as any]: `${rnd(-25, 25)}px`, animation: `scene-float ${rnd(8, 16)}s ease-in-out ${-rnd(0, 10)}s infinite` };
      });
    case 'fireflies':
      return mk(16, () => {
        const s = rnd(3, 5);
        return { ...base, left: `${rnd(0, 100)}%`, top: `${rnd(30, 100)}%`, width: s, height: s, borderRadius: '50%', background: '#f6e27a',
          boxShadow: '0 0 10px 3px rgba(246,226,122,0.7)', ['--sway' as any]: `${rnd(-40, 40)}px`,
          animation: `scene-float ${rnd(6, 12)}s ease-in-out ${-rnd(0, 8)}s infinite, scene-twinkle ${rnd(2, 5)}s ease-in-out ${-rnd(0, 4)}s infinite` };
      });
  }
};

const Particles = ({ kind }: { kind: ParticleKind }) => {
  const items = useMemo(() => build(kind), [kind]);
  return (
    <>
      {items.map((p, i) => <span key={i} className="scene-particle" style={p.style} />)}
    </>
  );
};

export default Particles;

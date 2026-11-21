export type SceneId = 'default' | 'aura' | 'sakura' | 'night' | 'fireplace' | 'academia' | 'sunrise' | 'autumn' | 'forest';
export type ParticleKind = 'petals' | 'leaves' | 'embers' | 'stars' | 'dust' | 'fireflies';

export interface Scene {
  id: SceneId;
  label: string;
  pro: boolean;
  light: string; // CSS background in light mode
  dark: string;  // CSS background in dark mode
  particles?: ParticleKind;
  size?: string;      // background-size (used with the drift animation)
  drift?: boolean;
  glow?: boolean;     // flickering glow overlay (fireplace)
}

const aura = (a: string, b: string, c: string, base: string) =>
  `radial-gradient(60% 50% at 20% 20%, ${a} 0%, transparent 70%), radial-gradient(55% 50% at 80% 30%, ${b} 0%, transparent 70%), radial-gradient(60% 55% at 50% 90%, ${c} 0%, transparent 70%), ${base}`;

export const SCENES: Scene[] = [
  {
    id: 'default', label: 'Default', pro: false,
    light: 'linear-gradient(180deg, #f8f2eb, #efe2d6)',
    dark: 'linear-gradient(180deg, #1c1714, #120f0d)',
  },
  {
    id: 'aura', label: 'Aura', pro: false, drift: true, size: '150% 150%, 150% 150%, 150% 150%, 100% 100%',
    light: aura('#ffd6e8', '#cfd9ff', '#ffe3c7', '#fbf7f5'),
    dark: aura('#5b2a63', '#26357a', '#6b3a2a', '#120e16'),
  },
  {
    id: 'sakura', label: 'Tokyo Sakura', pro: false, particles: 'petals',
    light: 'radial-gradient(60% 40% at 50% 0%, rgba(255,255,255,0.7), transparent 70%), linear-gradient(180deg, #ffe3ec 0%, #ffd0de 45%, #f6b8cf 100%)',
    dark: 'radial-gradient(60% 40% at 50% 0%, rgba(255,160,200,0.15), transparent 70%), linear-gradient(180deg, #2a1830 0%, #3d1f3f 55%, #5a2a4d 100%)',
  },
  {
    id: 'night', label: 'Midnight Stars', pro: false, particles: 'stars',
    light: 'linear-gradient(180deg, #dfe7ff, #c3cdf5)',
    dark: 'linear-gradient(180deg, #070b1f, #10183a 60%, #1b1f4d)',
  },
  {
    id: 'fireplace', label: 'Cozy Fireplace', pro: true, particles: 'embers', glow: true,
    light: 'linear-gradient(180deg, #fff3e6, #fbe3cf)',
    dark: 'linear-gradient(180deg, #1a0f0b, #0e0807)',
  },
  {
    id: 'academia', label: 'Dark Academia', pro: true, particles: 'dust',
    light: 'radial-gradient(80% 70% at 50% 40%, rgba(255,255,255,0.35), transparent 70%), linear-gradient(180deg, #efe6d6, #d9c9ae)',
    dark: 'radial-gradient(80% 70% at 50% 40%, #3a2c20 0%, #1d1510 70%), #120d09',
  },
  {
    id: 'sunrise', label: 'Seoul Sunrise', pro: true,
    light: 'radial-gradient(40% 30% at 50% 88%, rgba(255,244,210,0.9), transparent 70%), linear-gradient(180deg, #ffd7b5 0%, #ffb59a 40%, #e98fa0 70%, #b98acb 100%)',
    dark: 'radial-gradient(40% 30% at 50% 100%, rgba(255,170,120,0.55), transparent 70%), linear-gradient(180deg, #2b1f4a 0%, #7a3b63 55%, #e0745f 100%)',
  },
  {
    id: 'autumn', label: 'Autumn', pro: true, particles: 'leaves',
    light: 'linear-gradient(180deg, #fbe6c8, #f2c48d 60%, #e39c63)',
    dark: 'linear-gradient(180deg, #2a1a10, #4a2a14 60%, #7a3b16)',
  },
  {
    id: 'forest', label: 'Forest Mist', pro: true, particles: 'fireflies',
    light: 'linear-gradient(180deg, #e3efe4, #bcd8c2 60%, #8fbf9f)',
    dark: 'linear-gradient(180deg, #0c1a14, #14291f 60%, #1d3d2d)',
  },
];

export const getScene = (id?: string): Scene => SCENES.find(s => s.id === id) ?? SCENES[0];

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Lock } from 'lucide-react';
import { SCENES } from '@/lib/scenes';
import { CHIMES, playChime } from '@/lib/chime';
import { useProStore } from '@/store/useProStore';
import { PRO_ACCENTS } from '@/hooks/useAppearance';
import type { AccentId, FontStyle } from '@/store/useStore';
import { Slider } from '@/components/ui/slider';
import { useStore } from '@/store/useStore';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}


const FONTS: { id: FontStyle; label: string; family: string }[] = [
  { id: 'modern', label: 'Modern', family: "'Inter Variable', sans-serif" },
  { id: 'grotesk', label: 'Grotesk', family: "'Space Grotesk Variable', sans-serif" },
  { id: 'rounded', label: 'Rounded', family: "'Manrope Variable', sans-serif" },
  { id: 'mono', label: 'Mono', family: "'JetBrains Mono Variable', monospace" },
  { id: 'classic', label: 'Classic', family: "'Fraunces Variable', serif" },
];

const ACCENTS: { id: AccentId; color: string }[] = [
  { id: 'terracotta', color: 'hsl(16 50% 52%)' },
  { id: 'sage', color: 'hsl(150 28% 42%)' },
  { id: 'ocean', color: 'hsl(205 55% 45%)' },
  { id: 'lavender', color: 'hsl(262 40% 55%)' },
  { id: 'rose', color: 'hsl(345 55% 52%)' },
  { id: 'amber', color: 'hsl(32 85% 44%)' },
  { id: 'graphite', color: 'hsl(220 8% 30%)' },
];

const SettingsModal = ({ open, onOpenChange }: Props) => {
  const { settings, updateSettings } = useStore();
  const { isPro, openUpgrade } = useProStore();
  const theme = useStore(s => s.theme);

  const durations = [
    { key: 'focusDuration' as const, label: 'Focus Duration', min: 1, max: 180 },
    { key: 'shortBreakDuration' as const, label: 'Short Break', min: 1, max: 60 },
    { key: 'longBreakDuration' as const, label: 'Long Break', min: 1, max: 120 },
  ];

  const toggles = [
    { key: 'autoStartBreaks' as const, label: 'Auto-start breaks' },
    { key: 'autoStartSessions' as const, label: 'Auto-start focus sessions' },
    { key: 'soundEnabled' as const, label: 'Sounds' },
    { key: 'cursorEnabled' as const, label: 'Custom cursor' },
    { key: 'notificationsEnabled' as const, label: 'Browser notifications' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel rounded-2xl max-w-md max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {durations.map(({ key, label, min, max }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="font-medium">{settings[key]}m</span>
              </div>
              <Slider
                value={[settings[key]]}
                onValueChange={([v]) => updateSettings({ [key]: v })}
                min={min}
                max={max}
                step={1}
              />
            </div>
          ))}

          <div className="border-t border-border pt-4 space-y-3">
            {toggles.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <Switch
                  checked={settings[key]}
                  onCheckedChange={(v) => updateSettings({ [key]: v })}
                />
              </div>
            ))}
          </div>



          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm">Scene</p>
            <div className="grid grid-cols-3 gap-2">
              {SCENES.map(sc => {
                const locked = sc.pro && !isPro;
                const active = (settings.scene ?? 'default') === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => (locked ? (onOpenChange(false), openUpgrade()) : updateSettings({ scene: sc.id }))}
                    className={`relative h-16 rounded-xl overflow-hidden text-left ring-offset-2 ring-offset-background ${active ? 'ring-2 ring-foreground' : ''}`}
                    style={{ background: theme === 'dark' ? sc.dark : sc.light, backgroundSize: sc.size }}
                  >
                    <span className="absolute inset-x-0 bottom-0 bg-black/35 text-white text-[10px] px-1.5 py-0.5 truncate flex items-center gap-1">
                      {locked && <Lock size={9} />}{sc.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => updateSettings({ scene: 'default', fontStyle: 'modern', accent: 'terracotta' })}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Reset scene, font and color to default
            </button>

            <p className="text-sm pt-1">Alarm sound</p>
            <div className="flex flex-wrap gap-1.5">
              {CHIMES.map(c => (
                <button
                  key={c.id}
                  onClick={() => { updateSettings({ chime: c.id }); playChime(c.id); }}
                  className={`px-3 py-1.5 rounded-lg text-xs ${(settings.chime ?? 'bell') === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted/60 hover:bg-muted'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm">Font style</p>
            <div className="grid grid-cols-5 gap-1.5">
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => updateSettings({ fontStyle: f.id })}
                  className={`rounded-xl px-1 py-2 text-center transition-colors ${
                    (settings.fontStyle ?? 'modern') === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  <span className="block text-base leading-none" style={{ fontFamily: f.family }}>25:00</span>
                  <span className="block text-[10px] mt-1 opacity-80">{f.label}</span>
                </button>
              ))}
            </div>

            <p className="text-sm pt-1">Accent color</p>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map(a => {
                const locked = PRO_ACCENTS.includes(a.id) && !isPro;
                const active = (settings.accent ?? 'terracotta') === a.id;
                return (
                  <button
                    key={a.id}
                    title={locked ? `${a.id} (Pro)` : a.id}
                    onClick={() => (locked ? (onOpenChange(false), openUpgrade()) : updateSettings({ accent: a.id }))}
                    className={`relative h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition ${active ? 'ring-2 ring-foreground' : ''}`}
                    style={{ background: a.color }}
                  >
                    {locked && <Lock size={12} className="absolute inset-0 m-auto text-white/90" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Background intensity</span>
              <span className="font-medium">{Math.round(settings.backgroundIntensity * 100)}%</span>
            </div>
            <Slider
              value={[settings.backgroundIntensity * 100]}
              onValueChange={([v]) => updateSettings({ backgroundIntensity: v / 100 })}
              min={0}
              max={100}
              step={5}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useStore } from '@/store/useStore';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: Props) => {
  const { settings, updateSettings } = useStore();

  const durations = [
    { key: 'focusDuration' as const, label: 'Focus Duration', min: 1, max: 60 },
    { key: 'shortBreakDuration' as const, label: 'Short Break', min: 1, max: 30 },
    { key: 'longBreakDuration' as const, label: 'Long Break', min: 1, max: 60 },
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
      <DialogContent className="glass-panel rounded-2xl max-w-md">
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

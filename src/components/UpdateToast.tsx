import { useSyncExternalStore } from 'react';
import { applyUpdate, dismissUpdate, getUpdateReady, subscribeUpdate } from '@/lib/pwa';
import { useStore } from '@/store/useStore';

/** Appears when a new version of the app has been downloaded. Reloading is always the user's choice. */
const UpdateToast = () => {
  const ready = useSyncExternalStore(subscribeUpdate, getUpdateReady, () => false);
  const timerRunning = useStore(s => s.isRunning);

  if (!ready) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] glass-panel rounded-2xl px-4 py-3 shadow-lg flex flex-wrap items-center gap-3 max-w-[92vw]"
    >
      <div className="text-sm">
        <p className="font-medium">A new version is ready</p>
        {timerRunning && <p className="text-xs text-muted-foreground">Reloading restarts your running timer.</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={() => void applyUpdate()} className="rounded-xl bg-primary text-primary-foreground text-sm px-3 py-1.5">Reload</button>
        <button onClick={dismissUpdate} className="rounded-xl bg-muted text-sm px-3 py-1.5">Later</button>
      </div>
    </div>
  );
};

export default UpdateToast;
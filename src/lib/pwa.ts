/**
 * Service-worker update state. The worker is registered in src/main.tsx (production only) and reports here.
 * Updates are never applied automatically: a reload would restart a running timer, so the user chooses when.
 */
type UpdateFn = (reloadPage?: boolean) => Promise<void>;

let updateServiceWorker: UpdateFn | null = null;
let updateReady = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const initPwa = (register: (options: { immediate?: boolean; onNeedRefresh?: () => void }) => UpdateFn) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  updateServiceWorker = register({
    immediate: true,
    onNeedRefresh() {
      updateReady = true;
      emit();
    },
  });
};

export const subscribeUpdate = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};
export const getUpdateReady = () => updateReady;
export const dismissUpdate = () => { updateReady = false; emit(); };
/** Activates the waiting version and reloads the page. */
export const applyUpdate = () => updateServiceWorker?.(true);

/** Test helper. */
export const __setUpdateReadyForTests = (v: boolean) => { updateReady = v; emit(); };
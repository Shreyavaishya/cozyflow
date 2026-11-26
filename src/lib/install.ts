import { useSyncExternalStore } from 'react';

/** Chrome, Edge and Android fire this when the app can be installed. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const isIOS = (
  ua: string = typeof navigator !== 'undefined' ? navigator.userAgent : '',
  touchPoints: number = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
) => /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1); // iPadOS reports itself as a Mac

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

interface InstallState {
  canPrompt: boolean; // the browser offered a one-tap install
  installed: boolean;
}

let deferred: BeforeInstallPromptEvent | null = null;
let state: InstallState = { canPrompt: false, installed: false };
const listeners = new Set<() => void>();
const set = (next: InstallState) => { state = next; listeners.forEach(l => l()); };

/** Call once at startup: the browser may fire the event before React renders. */
export const initInstallCapture = () => {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep it for our own button instead of the browser's mini-banner
    deferred = e as BeforeInstallPromptEvent;
    set({ ...state, canPrompt: true });
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    set({ canPrompt: false, installed: true });
  });
};

export const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
  if (!deferred) return 'unavailable';
  const event = deferred;
  deferred = null; // the event can only be used once
  set({ ...state, canPrompt: false });
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === 'accepted') set({ canPrompt: false, installed: true });
  return outcome;
};

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useInstall = () => useSyncExternalStore(subscribe, () => state, () => state);

/** Test helper. */
export const __resetInstallForTests = () => { deferred = null; state = { canPrompt: false, installed: false }; listeners.forEach(l => l()); };
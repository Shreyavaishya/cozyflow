import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetInstallForTests, initInstallCapture, isIOS, promptInstall } from '@/lib/install';
import { __setUpdateReadyForTests, initPwa } from '@/lib/pwa';
import InstallButton from '@/components/InstallButton';
import UpdateToast from '@/components/UpdateToast';
import { useStore } from '@/store/useStore';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

const setUA = (ua?: string) => {
  if (ua) Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
  else delete (navigator as unknown as Record<string, unknown>).userAgent;
};
const setStandalone = (on: boolean) => {
  window.matchMedia = ((q: string) => ({
    matches: on && q.includes('display-mode: standalone'),
    media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

/** A fake "beforeinstallprompt" event like Chrome fires. */
const installEvent = (outcome: 'accepted' | 'dismissed') => {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  });
  return { event, prompt };
};

beforeAll(() => initInstallCapture()); // registers the window listeners once, like main.tsx does
beforeEach(() => { __resetInstallForTests(); __setUpdateReadyForTests(false); setStandalone(false); });
afterEach(() => setUA());

describe('platform detection', () => {
  it('detects iPhone, iPad and iPadOS-as-Mac', () => {
    expect(isIOS(IPHONE, 5)).toBe(true);
    expect(isIOS('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 5)).toBe(true);
    expect(isIOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);   // iPadOS desktop mode
    expect(isIOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);  // a real Mac
    expect(isIOS('Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile', 5)).toBe(false);
    expect(isIOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120', 0)).toBe(false);
  });
});

describe('install flow (Chrome / Edge / Android)', () => {
  it('shows nothing until the browser says installing is possible', () => {
    const { container } = render(<InstallButton />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the button after beforeinstallprompt, keeps the event for later, and prompts on click', async () => {
    const { event, prompt } = installEvent('accepted');
    render(<InstallButton />);
    act(() => { window.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true); // we take over from the browser's own banner
    const button = screen.getByLabelText('Install app');
    await act(async () => { fireEvent.click(button); });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Install app')).toBeNull(); // accepted: installed, button goes away
  });

  it('hides the button after the user dismisses the prompt (the event is single-use)', async () => {
    const { event } = installEvent('dismissed');
    render(<InstallButton />);
    act(() => { window.dispatchEvent(event); });
    await act(async () => { fireEvent.click(screen.getByLabelText('Install app')); });
    expect(screen.queryByLabelText('Install app')).toBeNull();
    expect(await promptInstall()).toBe('unavailable');
  });

  it('hides the button when the app gets installed another way', () => {
    const { event } = installEvent('accepted');
    render(<InstallButton />);
    act(() => { window.dispatchEvent(event); });
    expect(screen.getByLabelText('Install app')).toBeTruthy();
    act(() => { window.dispatchEvent(new Event('appinstalled')); });
    expect(screen.queryByLabelText('Install app')).toBeNull();
  });

  it('never shows inside the installed app', () => {
    setStandalone(true);
    const { event } = installEvent('accepted');
    const { container } = render(<InstallButton />);
    act(() => { window.dispatchEvent(event); });
    expect(container.firstChild).toBeNull();
  });
});

describe('install on iPhone / iPad', () => {
  it('shows the button and opens a Share > Add to Home Screen guide', () => {
    setUA(IPHONE);
    render(<InstallButton />);
    fireEvent.click(screen.getByLabelText('Install app'));
    expect(screen.getAllByText(/Add to Home Screen/).length).toBeGreaterThan(0);
  });
});

describe('update prompt', () => {
  const setupWorker = () => {
    Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true });
    const updateSW = vi.fn().mockResolvedValue(undefined);
    let needRefresh: (() => void) | undefined;
    initPwa((options) => { needRefresh = options.onNeedRefresh; return updateSW; });
    return { updateSW, announceUpdate: () => act(() => needRefresh?.()) };
  };
  afterEach(() => { delete (navigator as unknown as Record<string, unknown>).serviceWorker; });

  it('stays hidden until a new version is downloaded, then reloads only when the user asks', () => {
    const { updateSW, announceUpdate } = setupWorker();
    const { container } = render(<UpdateToast />);
    expect(container.firstChild).toBeNull();

    announceUpdate();
    expect(screen.getByText('A new version is ready')).toBeTruthy();
    expect(updateSW).not.toHaveBeenCalled(); // never reloads by itself

    fireEvent.click(screen.getByText('Reload'));
    expect(updateSW).toHaveBeenCalledWith(true);
  });

  it('"Later" dismisses it without reloading', () => {
    const { updateSW, announceUpdate } = setupWorker();
    render(<UpdateToast />);
    announceUpdate();
    fireEvent.click(screen.getByText('Later'));
    expect(screen.queryByText('A new version is ready')).toBeNull();
    expect(updateSW).not.toHaveBeenCalled();
  });

  it('warns that reloading restarts a running timer', () => {
    act(() => { useStore.setState({ isRunning: true }); });
    render(<UpdateToast />);
    act(() => __setUpdateReadyForTests(true));
    expect(screen.getByText(/restarts your running timer/)).toBeTruthy();
    act(() => { useStore.setState({ isRunning: false }); });
  });
});
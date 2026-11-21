import fs from 'node:fs';
import path from 'node:path';
import { Profiler } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribePointer } from '@/lib/pointer';
import CustomCursor from '@/components/CustomCursor';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useStore } from '@/store/useStore';

const move = (x: number, y: number, pointerType?: string) => {
  const e = new MouseEvent('pointermove', { clientX: x, clientY: y });
  if (pointerType) Object.defineProperty(e, 'pointerType', { value: pointerType });
  window.dispatchEvent(e);
};

const setMedia = (finePointer: boolean, reduced = false) => {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('hover: hover') ? finePointer : q.includes('reduced-motion') ? reduced : false,
    media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

beforeEach(() => { vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] }); setMedia(true); });
afterEach(() => { vi.useRealTimers(); document.body.style.cursor = ''; });

describe('shared pointer subscription', () => {
  it('attaches a single passive listener no matter how many subscribers', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const a = subscribePointer(() => {});
    const b = subscribePointer(() => {});
    const c = subscribePointer(() => {});
    const moveCalls = add.mock.calls.filter(c => c[0] === 'pointermove');
    expect(moveCalls).toHaveLength(1);
    expect(moveCalls[0][2]).toEqual({ passive: true });
    a(); b();
    expect(remove.mock.calls.filter(c => c[0] === 'pointermove')).toHaveLength(0); // still one subscriber
    c();
    expect(remove.mock.calls.filter(c => c[0] === 'pointermove')).toHaveLength(1);
    add.mockRestore(); remove.mockRestore();
  });

  it('calls subscribers at most once per animation frame, with the latest position', () => {
    const fn = vi.fn();
    const off = subscribePointer(fn);
    for (let i = 1; i <= 50; i++) move(i, i * 2);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersToNextFrame();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(50, 100);
    off();
  });

  it('ignores touch and pen input', () => {
    const fn = vi.fn();
    const off = subscribePointer(fn);
    move(10, 10, 'touch'); move(20, 20, 'pen');
    vi.advanceTimersToNextFrame();
    expect(fn).not.toHaveBeenCalled();
    off();
  });

  it('cleans up: no callbacks after unsubscribe and no pending frame', () => {
    const fn = vi.fn();
    const off = subscribePointer(fn);
    move(5, 5);
    off();
    vi.advanceTimersToNextFrame();
    move(6, 6);
    vi.advanceTimersToNextFrame();
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('decorative cursor glow', () => {
  const enable = (on: boolean) => useStore.setState({ settings: { ...useStore.getState().settings, cursorGlow: on } });

  it('is off by default and renders nothing', () => {
    enable(false);
    const { container } = render(<CustomCursor />);
    expect(container.firstChild).toBeNull();
  });

  it('never hides or replaces the native cursor when enabled', () => {
    enable(true);
    render(<CustomCursor />);
    expect(document.body.style.cursor).toBe('');
    expect(document.documentElement.style.cursor).toBe('');
  });

  it('follows the pointer without re-rendering React, and ignores clicks (pointer-events: none)', async () => {
    enable(true);
    let commits = 0;
    const { container } = render(<Profiler id="c" onRender={() => { commits++; }}><CustomCursor /></Profiler>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('pointer-events-none');
    const base = commits;
    for (let i = 0; i < 100; i++) { await act(async () => { move(i * 4, i * 2); vi.advanceTimersToNextFrame(); }); }
    expect(commits).toBe(base);                 // zero React commits from 100 mouse moves
    expect(el.style.transform).toContain('396px, 198px'); // latest position, written straight to the DOM
    expect(el.style.opacity).toBe('1');
  });

  it('hides when the pointer leaves the window and removes its listeners on unmount', () => {
    enable(true);
    const removeDoc = vi.spyOn(document.documentElement, 'removeEventListener');
    const { container, unmount } = render(<CustomCursor />);
    const el = container.firstElementChild as HTMLElement;
    move(10, 10); vi.advanceTimersToNextFrame();
    document.documentElement.dispatchEvent(new MouseEvent('mouseleave'));
    expect(el.style.opacity).toBe('0');
    unmount();
    expect(removeDoc.mock.calls.some(c => c[0] === 'mouseleave')).toBe(true);
    removeDoc.mockRestore();
  });

  it('does not render on touch devices or with reduced motion', () => {
    enable(true);
    setMedia(false);
    expect(render(<CustomCursor />).container.firstChild).toBeNull();
    setMedia(true, true);
    expect(render(<CustomCursor />).container.firstChild).toBeNull();
  });
});

describe('animated background', () => {
  it('does not re-render React when the mouse moves', async () => {
    let commits = 0;
    render(<Profiler id="bg" onRender={() => { commits++; }}><AnimatedBackground /></Profiler>);
    const base = commits;
    for (let i = 0; i < 100; i++) { await act(async () => { move(i * 5, i * 3); vi.advanceTimersToNextFrame(); }); }
    expect(commits).toBe(base);
  });

  it('adds no pointer listener on touch devices', () => {
    setMedia(false);
    const add = vi.spyOn(window, 'addEventListener');
    render(<AnimatedBackground />);
    expect(add.mock.calls.filter(c => c[0] === 'pointermove' || c[0] === 'mousemove')).toHaveLength(0);
    add.mockRestore();
  });
});

describe('saved settings migration', () => {
  it('turns the glow off and drops the old custom-cursor flag for existing users', async () => {
    const old = { ...useStore.getState().settings } as Record<string, unknown>;
    delete old.cursorGlow;
    old.cursorEnabled = true; // what every existing user had saved
    localStorage.setItem('cozy-pomodoro-storage', JSON.stringify({ state: { settings: old }, version: 5 }));
    await useStore.persist.rehydrate();
    const settings = useStore.getState().settings as unknown as Record<string, unknown>;
    expect(settings.cursorGlow).toBe(false);
    expect(settings.cursorEnabled).toBeUndefined();
  });
});

describe('source guard', () => {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : /\.(tsx?|css)$/.test(d.name) ? [path.join(dir, d.name)] : []);
  const files = walk(path.resolve(__dirname, '..')).filter(f => !f.includes(`${path.sep}test${path.sep}`));

  it('nothing in the app hides the native cursor', () => {
    const offenders = files.filter(f => /cursor\s*=\s*['"]none|cursor-none|cursor:\s*none/.test(fs.readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('only the shared pointer module registers global mouse/pointer move listeners', () => {
    const offenders = files
      .filter(f => !f.endsWith(`lib${path.sep}pointer.ts`))
      .filter(f => /addEventListener\(\s*['"](mousemove|pointermove)['"]/.test(fs.readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
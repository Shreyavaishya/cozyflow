type Listener = (x: number, y: number) => void;

const listeners = new Set<Listener>();
let raf = 0;
let px = 0;
let py = 0;

const flush = () => {
  raf = 0;
  listeners.forEach(l => l(px, py));
};

const onMove = (e: PointerEvent) => {
  // Mouse and trackpad only. Touch and pen input never drive decorative effects.
  if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
  px = e.clientX;
  py = e.clientY;
  if (!raf) raf = requestAnimationFrame(flush);
};

/** Subscribe to pointer positions. Returns an unsubscribe function. */
export const subscribePointer = (listener: Listener): (() => void) => {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('pointermove', onMove, { passive: true });

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener('pointermove', onMove);
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }
  };
};

/** True for devices with a real hovering pointer (mouse/trackpad). False on phones and tablets. */
export const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches === true;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
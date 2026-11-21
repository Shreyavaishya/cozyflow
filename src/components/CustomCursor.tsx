import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { hasFinePointer, prefersReducedMotion, subscribePointer } from '@/lib/pointer';

const CustomCursor = () => {
  const enabled = useStore(s => s.settings.cursorGlow) === true;
  const [supported] = useState(() => hasFinePointer() && !prefersReducedMotion());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !supported || !el) return;

    const unsubscribe = subscribePointer((x, y) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      el.style.opacity = '1';
    });
    // Hide the glow when the pointer leaves the window so it does not stick to the edge.
    const hide = () => { el.style.opacity = '0'; };
    document.documentElement.addEventListener('mouseleave', hide);

    return () => {
      unsubscribe();
      document.documentElement.removeEventListener('mouseleave', hide);
    };
  }, [enabled, supported]);

  if (!enabled || !supported) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[9999] pointer-events-none w-9 h-9 rounded-full border-2 border-primary/50 opacity-0 transition-opacity duration-200 will-change-transform"
      style={{ boxShadow: '0 0 15px 3px hsl(var(--primary) / 0.15)' }}
    />
  );
};

export default CustomCursor;
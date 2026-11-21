import { useEffect, useState, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useStore } from '@/store/useStore';

const CustomCursor = () => {
  const enabled = useStore(s => s.settings.cursorEnabled);
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);
  const isTouchRef = useRef(false);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  useEffect(() => {
    if ('ontouchstart' in window) {
      isTouchRef.current = true;
      return;
    }
    if (!enabled) {
      document.body.style.cursor = '';
      return;
    }

    document.body.style.cursor = 'none';

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const down = () => setClicking(true);
    const up = () => setClicking(false);

    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, [role="button"], input, textarea, select, label')) {
        setHovering(true);
      }
    };
    const out = () => setHovering(false);

    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    window.addEventListener('mouseover', over);
    window.addEventListener('mouseout', out);

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('mouseout', out);
    };
  }, [enabled, x, y, visible]);

  if (!enabled || isTouchRef.current) return null;

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full border-2 border-primary/50"
        style={{
          x, y,
          translateX: '-50%',
          translateY: '-50%',
          width: hovering ? 48 : 36,
          height: hovering ? 48 : 36,
          opacity: visible ? 1 : 0,
          scale: clicking ? 0.85 : 1,
          boxShadow: '0 0 15px 3px hsl(var(--primary) / 0.15)',
        }}
        transition={{ type: 'spring', ...springConfig }}
      />
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] w-2 h-2 rounded-full bg-primary"
        style={{
          x, y,
          translateX: '-50%',
          translateY: '-50%',
          opacity: visible ? 1 : 0,
          scale: clicking ? 1.8 : hovering ? 0 : 1,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      />
    </>
  );
};

export default CustomCursor;

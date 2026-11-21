import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { hasFinePointer, prefersReducedMotion, subscribePointer } from '@/lib/pointer';

// Gentle, slow follow so the parallax feels calm.
const SPRING = { stiffness: 30, damping: 20, mass: 1 };

const AnimatedBackground = () => {
  const intensity = useStore(s => s.settings.backgroundIntensity);

  // Pointer offset lives in MotionValues, not React state, so moving the mouse never re-renders this component.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, SPRING);
  const sy = useSpring(my, SPRING);

  const b1x = useTransform(sx, v => v * 0.5);
  const b1y = useTransform(sy, v => v * 0.5);
  const b2x = useTransform(sx, v => v * -0.3);
  const b2y = useTransform(sy, v => v * -0.3);
  const b3x = useTransform(sx, v => v * 0.4);
  const b3y = useTransform(sy, v => v * 0.4);

  useEffect(() => {
    // No parallax on touch devices or for people who prefer reduced motion.
    if (!hasFinePointer() || prefersReducedMotion()) return;
    return subscribePointer((x, y) => {
      mx.set((x / window.innerWidth - 0.5) * 30);
      my.set((y / window.innerHeight - 0.5) * 30);
    });
  }, [mx, my]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" style={{ opacity: intensity }}>
      {/* Blob 1 */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
        style={{ background: 'hsl(var(--blob-1) / 0.35)', top: '10%', left: '15%', translateX: b1x, translateY: b1y }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Blob 2 */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
        style={{ background: 'hsl(var(--blob-2) / 0.3)', top: '50%', right: '10%', translateX: b2x, translateY: b2y }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -20, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Blob 3 */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full blur-3xl"
        style={{ background: 'hsl(var(--blob-3) / 0.25)', bottom: '10%', left: '40%', translateX: b3x, translateY: b3y }}
        animate={{
          x: [0, 30, -40, 0],
          y: [0, -20, 30, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Grain */}
      <div className="grain-overlay" />
    </div>
  );
};

export default AnimatedBackground;
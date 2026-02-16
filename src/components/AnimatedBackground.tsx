import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

const AnimatedBackground = () => {
  const intensity = useStore(s => s.settings.backgroundIntensity);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" style={{ opacity: intensity }}>
      {/* Blob 1 */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
        style={{ background: 'hsl(var(--blob-1) / 0.35)', top: '10%', left: '15%' }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          translateX: mouse.x * 0.5,
          translateY: mouse.y * 0.5,
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Blob 2 */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
        style={{ background: 'hsl(var(--blob-2) / 0.3)', top: '50%', right: '10%' }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -20, 0],
          translateX: mouse.x * -0.3,
          translateY: mouse.y * -0.3,
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Blob 3 */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full blur-3xl"
        style={{ background: 'hsl(var(--blob-3) / 0.25)', bottom: '10%', left: '40%' }}
        animate={{
          x: [0, 30, -40, 0],
          y: [0, -20, 30, 0],
          translateX: mouse.x * 0.4,
          translateY: mouse.y * 0.4,
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Grain */}
      <div className="grain-overlay" />
    </div>
  );
};

export default AnimatedBackground;

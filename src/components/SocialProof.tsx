import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchPublicStats, PublicStats } from '@/lib/sponsors';
import { fmtFocus } from '@/lib/format';

const REFRESH_MS = 60_000;
const n = (v: number) => v.toLocaleString('en-IN');

/**
 * Live, honest numbers from your own database (aggregates only, no personal data).
 * Shows nothing if the numbers cannot be loaded, so a visitor never sees a broken or fake counter.
 */
const SocialProof = () => {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (document.visibilityState === 'hidden') return; // do not poll from background tabs
      fetchPublicStats().then(s => { if (!cancelled && s) setStats(s); });
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (!stats || stats.users < 1) return null;

  const people = `${n(stats.users)} ${stats.users === 1 ? 'person has' : 'people have'} joined`;
  const chips = [
    stats.sessions > 0 && `${n(stats.sessions)} focus ${stats.sessions === 1 ? 'session' : 'sessions'}`,
    stats.minutes > 0 && `${fmtFocus(stats.minutes)} focused`,
  ].filter(Boolean) as string[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-5 inline-flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1 glass-panel rounded-full px-4 py-2 text-sm"
      aria-live="polite"
    >
      <span className="font-medium">🌱 {people}</span>
      {chips.map(c => (
        <span key={c} className="text-muted-foreground">· {c}</span>
      ))}
    </motion.div>
  );
};

export default SocialProof;
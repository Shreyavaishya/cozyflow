import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useProStore } from '@/store/useProStore';
import { fetchSponsors, trackSponsorEvent, Sponsor } from '@/lib/sponsors';

const HOUSE: Sponsor = {
  id: 'house',
  name: 'Your brand here',
  tagline: 'Reach students while they take a break. Sponsor Cozy Flow.',
  cta: 'Become a sponsor',
  url: '/sponsor',
  emoji: '💛',
};

/** Shown during breaks only, never during focus. Hidden for Pro users. */
const SponsorCard = () => {
  const mode = useStore(s => s.mode);
  const focusModeActive = useStore(s => s.focusModeActive);
  const isPro = useProStore(s => s.isPro);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [current, setCurrent] = useState<Sponsor | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const tracked = useRef<string | null>(null);

  useEffect(() => { fetchSponsors().then(setSponsors); }, []);

  const onBreak = mode !== 'focus' && !focusModeActive && !isPro;

  // Pick one sponsor per break, count one impression per break
  useEffect(() => {
    if (!onBreak) { setCurrent(null); setDismissed(false); tracked.current = null; return; }
    const pool = sponsors.length ? sponsors : [HOUSE];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setCurrent(pick);
    if (pick.id !== 'house' && tracked.current !== `${mode}:${pick.id}`) {
      tracked.current = `${mode}:${pick.id}`;
      trackSponsorEvent(pick.id, 'impression');
    }
  }, [onBreak, mode, sponsors]);

  const show = onBreak && current && !dismissed;
  const internal = current?.url.startsWith('/');

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={current!.id}
          className="glass-panel rounded-2xl px-4 py-3 w-full max-w-sm relative"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            {current!.id === 'house' ? 'Advertise here' : 'Sponsored'}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{current!.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{current!.name}</p>
              <p className="text-xs text-muted-foreground">{current!.tagline}</p>
            </div>
            <a
              href={current!.url}
              {...(internal ? {} : { target: '_blank', rel: 'sponsored noopener noreferrer' })}
              onClick={() => current!.id !== 'house' && trackSponsorEvent(current!.id, 'click')}
              className="shrink-0 rounded-xl bg-primary text-primary-foreground text-xs px-3 py-1.5"
            >
              {current!.cta}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SponsorCard;

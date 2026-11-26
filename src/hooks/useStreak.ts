import { getStreakInfo, useStore } from '@/store/useStore';
import { useProStore } from '@/store/useProStore';

/** Current streak, with the Pro streak freeze applied when the user has Pro. Recomputed each render so it rolls over at midnight. */
export const useStreak = () => {
  const history = useStore(s => s.stats.dailyHistory);
  const isPro = useProStore(s => s.isPro);
  return { ...getStreakInfo(history, isPro), freezeActive: isPro };
};
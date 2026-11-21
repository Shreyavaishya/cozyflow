import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useProStore } from '@/store/useProStore';

export const PRO_ACCENTS = ['lavender', 'rose', 'amber', 'graphite'];

/** Applies the chosen font style and accent to <html>. Pro accents fall back to the default for free users. */
export const useAppearance = () => {
  const fontStyle = useStore(s => s.settings.fontStyle) ?? 'modern';
  const accent = useStore(s => s.settings.accent) ?? 'terracotta';
  const isPro = useProStore(s => s.isPro);
  const loaded = useProStore(s => s.loaded);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.font = fontStyle;
    root.dataset.accent = PRO_ACCENTS.includes(accent) && loaded && !isPro ? 'terracotta' : accent;
  }, [fontStyle, accent, isPro, loaded]);
};

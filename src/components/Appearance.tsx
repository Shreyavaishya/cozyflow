import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useAppearance } from '@/hooks/useAppearance';

/** Applies theme, font style and accent on every page (landing, app, sponsor). */
const Appearance = () => {
  const theme = useStore(s => s.theme);
  useAppearance();
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  return null;
};

export default Appearance;

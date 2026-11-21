import { useEffect } from 'react';
import SceneBackground from '@/components/SceneBackground';
import Timer from '@/components/Timer';
import { useStore } from '@/store/useStore';
import { SCENES, SceneId } from '@/lib/scenes';

/** Timer-only page for embedding in Notion or a second screen. /embed?scene=sakura&theme=dark */
const Embed = () => {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const scene = q.get('scene');
    const theme = q.get('theme');
    const st = useStore.getState();
    if (scene && SCENES.some(s => s.id === scene && !s.pro)) st.updateSettings({ scene: scene as SceneId });
    if (theme === 'dark' || theme === 'light') useStore.setState({ theme });
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <SceneBackground />
      <Timer />
      <a href="/" target="_blank" rel="noopener noreferrer" className="mt-6 text-xs text-muted-foreground hover:text-foreground">
        🍅 Made with Cozy Flow
      </a>
    </div>
  );
};

export default Embed;

import { useStore } from '@/store/useStore';
import { useProStore } from '@/store/useProStore';
import { getScene } from '@/lib/scenes';
import AnimatedBackground from '@/components/AnimatedBackground';
import Particles from '@/components/Particles';

/** The page backdrop: the original blobs, or one of the aesthetic scenes (Pro scenes fall back for free users). */
const SceneBackground = () => {
  const sceneId = useStore(s => s.settings.scene) ?? 'default';
  const theme = useStore(s => s.theme);
  const isPro = useProStore(s => s.isPro);
  const loaded = useProStore(s => s.loaded);

  const picked = getScene(sceneId);
  // Only fall back once we know the user is not Pro; otherwise Pro users see a flash of the default.
  const scene = picked.pro && loaded && !isPro ? getScene('default') : picked;

  if (scene.id === 'default') return <AnimatedBackground />;

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none scene-bg"
      style={{
        background: theme === 'dark' ? scene.dark : scene.light,
        backgroundSize: scene.size,
        animation: scene.drift ? 'scene-drift 40s ease-in-out infinite alternate' : undefined,
      }}
    >
      {scene.glow && (
        <div
          className="absolute inset-0 scene-bg"
          style={{
            background: `radial-gradient(60% 45% at 50% 105%, rgba(255,140,60,${theme === 'dark' ? 0.55 : 0.35}), transparent 70%)`,
            animation: 'scene-glow 3s ease-in-out infinite',
          }}
        />
      )}
      {scene.particles && <Particles kind={scene.particles} />}
    </div>
  );
};

export default SceneBackground;

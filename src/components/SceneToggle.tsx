import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { SceneId } from '@/lib/scenes';

/** One-tap switch between the default background and your chosen scene. */
const SceneToggle = () => {
  const scene = useStore(s => s.settings.scene) ?? 'default';
  const updateSettings = useStore(s => s.updateSettings);
  const [previous, setPrevious] = useState<SceneId>('aura');
  const active = scene !== 'default';

  useEffect(() => { if (scene !== 'default') setPrevious(scene); }, [scene]);

  return (
    <motion.button
      onClick={() => updateSettings({ scene: active ? 'default' : previous })}
      className={`p-2 rounded-xl glass-panel ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      title={active ? 'Turn scene off (use default)' : 'Turn scene on'}
      aria-label={active ? 'Turn scene off' : 'Turn scene on'}
    >
      <Sparkles size={18} />
    </motion.button>
  );
};

export default SceneToggle;

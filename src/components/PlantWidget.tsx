import { motion } from 'framer-motion';
import { useStore, PlantStage } from '@/store/useStore';

const stages: Record<PlantStage, { emoji: string; label: string }> = {
  0: { emoji: '🌰', label: 'Seed' },
  1: { emoji: '🌱', label: 'Sprout' },
  2: { emoji: '🌿', label: 'Sapling' },
  3: { emoji: '🪴', label: 'Young Plant' },
  4: { emoji: '🌳', label: 'Tree' },
  5: { emoji: '🌸', label: 'In Bloom' },
};

const PlantWidget = () => {
  const plantStage = useStore(s => s.plantStage);
  const { emoji, label } = stages[plantStage];

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
    >
      <motion.span
        key={plantStage}
        className="text-4xl"
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 10, stiffness: 200 }}
      >
        {emoji}
      </motion.span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </motion.div>
  );
};

export default PlantWidget;

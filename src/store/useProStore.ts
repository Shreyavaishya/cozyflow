import { create } from 'zustand';

interface ProState {
  isPro: boolean;
  loaded: boolean; // true once Pro status is known (signed out counts as known)
  proUntil: string | null;
  lifetime: boolean;
  upgradeOpen: boolean;
  openUpgrade: () => void;
  closeUpgrade: () => void;
  setUpgradeOpen: (o: boolean) => void;
  load: (userId: string | null) => Promise<void>;
}

export const useProStore = create<ProState>((set) => ({
  isPro: false,
  loaded: false,
  proUntil: null,
  lifetime: false,
  upgradeOpen: false,
  openUpgrade: () => set({ upgradeOpen: true }),
  closeUpgrade: () => set({ upgradeOpen: false }),
  setUpgradeOpen: (o) => set({ upgradeOpen: o }),
  load: async (userId) => {
    if (!userId) return set({ isPro: false, proUntil: null, lifetime: false, loaded: true });
    // Imported on demand so pages that never sign anyone in do not download the Supabase library.
    const { supabase } = await import('@/lib/supabase');
    if (!supabase) return set({ isPro: false, proUntil: null, lifetime: false, loaded: true });
    const { data } = await supabase.from('subscriptions').select('pro_until, lifetime').eq('user_id', userId).maybeSingle();
    const lifetime = !!data?.lifetime;
    const active = lifetime || (!!data?.pro_until && new Date(data.pro_until) > new Date());
    set({ isPro: active, proUntil: data?.pro_until ?? null, lifetime, loaded: true });
  },
}));
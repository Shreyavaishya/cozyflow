import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { mergeRemote, pickSyncable } from '@/lib/sync';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export const useCloudSync = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>('local');
  const [errorMsg, setErrorMsg] = useState('');
  const [authReady, setAuthReady] = useState(!supabase); // true once we know whether someone is signed in
  const ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Track auth session
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Pull + merge once per login, then push on changes (debounced)
  useEffect(() => {
    if (!supabase || !session) {
      ready.current = false;
      setStatus('local');
      return;
    }
    const userId = session.user.id;
    let cancelled = false;

    const push = async () => {
      setStatus('syncing');
      const { error } = await supabase!.from('user_data').upsert({
        user_id: userId,
        data: pickSyncable(useStore.getState()),
        updated_at: new Date().toISOString(),
      });
      if (error) console.error('[cloud sync] save failed:', error);
      if (!cancelled) { setStatus(error ? 'error' : 'synced'); setErrorMsg(error ? error.message : ''); }
    };

    (async () => {
      setStatus('syncing');
      const { data, error } = await supabase!.from('user_data').select('data').eq('user_id', userId).maybeSingle();
      if (cancelled) return;
      if (error) { console.error('[cloud sync] load failed:', error); setErrorMsg(error.message); setStatus('error'); return; }
      const merged = mergeRemote(pickSyncable(useStore.getState()), data?.data ?? null);
      useStore.setState(merged);
      document.documentElement.classList.toggle('dark', merged.theme === 'dark');
      ready.current = true;
      await push();
    })();

    const unsub = useStore.subscribe(() => {
      if (!ready.current) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(push, 1500);
    });

    return () => { cancelled = true; unsub(); clearTimeout(timer.current); };
  }, [session]);

  return { session, status, errorMsg, authReady };
};

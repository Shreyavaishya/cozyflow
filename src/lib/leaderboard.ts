import { supabase } from '@/lib/supabase';

export type Period = 'week' | 'all';

export interface LeaderboardRow {
  rank: number;
  display_name: string;
  minutes: number;
  is_me: boolean;
}

export const fetchLeaderboard = async (period: Period): Promise<LeaderboardRow[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_leaderboard', { period });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({ ...r, rank: Number(r.rank), minutes: Number(r.minutes) }));
};

export const getMyProfile = async (userId: string): Promise<string | null> => {
  if (!supabase) return null;
  const { data } = await supabase.from('leaderboard_profiles').select('display_name').eq('user_id', userId).maybeSingle();
  return data?.display_name ?? null;
};

export const joinLeaderboard = async (userId: string, name: string) => {
  const { error } = await supabase!.from('leaderboard_profiles').upsert({ user_id: userId, display_name: name, opted_in: true });
  if (error) {
    if (error.code === '23505') throw new Error('That name is taken. Try another.');
    if (error.code === '23514') throw new Error('Use 2 to 20 letters, numbers, spaces, dots, dashes or underscores.');
    throw new Error(error.message);
  }
};

export const leaveLeaderboard = async (userId: string) => {
  const { error } = await supabase!.from('leaderboard_profiles').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
};

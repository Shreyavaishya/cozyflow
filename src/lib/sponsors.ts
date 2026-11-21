import { supabase } from '@/lib/supabase';

export interface Sponsor {
  id: string;
  name: string;
  tagline: string;
  cta: string;
  url: string;
  emoji: string;
}

export interface PublicStats {
  users: number;
  weekly_active: number;
  sessions: number;
  minutes: number;
  impressions: number;
  clicks: number;
}

export const fetchSponsors = async (): Promise<Sponsor[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('sponsors').select('id, name, tagline, cta, url, emoji');
  return error || !data ? [] : (data as Sponsor[]);
};

export const trackSponsorEvent = (sponsorId: string, event: 'impression' | 'click') => {
  if (!supabase) return;
  supabase.from('sponsor_events').insert({ sponsor_id: sponsorId, event }).then(() => {});
};

export const fetchPublicStats = async (): Promise<PublicStats | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('public_stats');
  return error ? null : (data as PublicStats);
};

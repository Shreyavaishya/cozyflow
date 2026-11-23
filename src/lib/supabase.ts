import { createClient } from '@supabase/supabase-js';

const strip = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, '').trim();

/**
 * Accepts whatever was pasted into VITE_SUPABASE_URL and returns just the origin,
 * e.g. "https://abc.supabase.co". Fixes the common mistakes that make Supabase answer
 * "Invalid path specified in request URL": a trailing slash, a pasted "/rest/v1/" or
 * "/auth/v1" path, surrounding quotes, or a missing "https://".
 */
export const normalizeSupabaseUrl = (raw?: string): string | undefined => {
  const value = strip(raw);
  if (!value) return undefined;
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).origin;
  } catch {
    return undefined;
  }
};

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const url = normalizeSupabaseUrl(rawUrl);
const key = strip(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

if (import.meta.env.DEV && rawUrl) {
  if (!url) {
    console.error('[supabase] VITE_SUPABASE_URL is not a valid URL. Expected something like https://YOUR-PROJECT.supabase.co');
  } else if (strip(rawUrl) !== url) {
    console.warn(`[supabase] VITE_SUPABASE_URL had extra characters or a path. Using ${url}. Please set it to exactly that.`);
  }
}

/**
 * Asks Supabase whether the Google provider is switched on (Authentication > Providers > Google).
 * Fails closed: on any error we say "not enabled", so the button never leads to an error page.
 */
export const checkGoogleEnabled = async (baseUrl: string, apiKey: string, doFetch: typeof fetch = fetch): Promise<boolean> => {
  try {
    const res = await doFetch(`${baseUrl}/auth/v1/settings`, { headers: { apikey: apiKey } });
    if (!res.ok) return false;
    const settings = await res.json();
    return settings?.external?.google === true;
  } catch {
    return false;
  }
};

let googleCheck: Promise<boolean> | null = null;
/** Cached per page load. A failed check is not cached, so it is retried the next time the dialog opens. */
export const isGoogleEnabled = (): Promise<boolean> => {
  if (!url || !key) return Promise.resolve(false);
  googleCheck ??= checkGoogleEnabled(url, key).then(ok => {
    if (!ok) googleCheck = null;
    return ok;
  });
  return googleCheck;
};

// null when env vars are missing, so the app keeps working local-only.
export const supabase = url && key ? createClient(url, key) : null;
export const cloudEnabled = !!supabase;
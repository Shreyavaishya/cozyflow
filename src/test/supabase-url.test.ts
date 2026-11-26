import { describe, expect, it } from 'vitest';
import { normalizeSupabaseUrl } from '@/lib/supabase';

const OK = 'https://gzsgbrrhexossgyqhktb.supabase.co';

describe('normalizeSupabaseUrl', () => {
  it('keeps a correct URL as is', () => {
    expect(normalizeSupabaseUrl(OK)).toBe(OK);
  });

  it.each([
    ['trailing slash', `${OK}/`],
    ['pasted REST path', `${OK}/rest/v1/`],
    ['pasted auth path', `${OK}/auth/v1`],
    ['surrounding double quotes', `"${OK}"`],
    ['surrounding single quotes', `'${OK}'`],
    ['spaces', `  ${OK}  `],
    ['missing https://', 'gzsgbrrhexossgyqhktb.supabase.co'],
  ])('fixes: %s', (_label, input) => {
    expect(normalizeSupabaseUrl(input)).toBe(OK);
  });

  it('returns undefined for empty or unusable values', () => {
    expect(normalizeSupabaseUrl(undefined)).toBeUndefined();
    expect(normalizeSupabaseUrl('')).toBeUndefined();
    expect(normalizeSupabaseUrl('   ')).toBeUndefined();
    expect(normalizeSupabaseUrl('http://')).toBeUndefined();
  });
});

import { checkGoogleEnabled } from '@/lib/supabase';

describe('checkGoogleEnabled', () => {
  const reply = (ok: boolean, body: unknown) => (async () => ({ ok, json: async () => body })) as unknown as typeof fetch;

  it('is true only when Supabase reports the Google provider on', async () => {
    expect(await checkGoogleEnabled(OK, 'k', reply(true, { external: { email: true, google: true } }))).toBe(true);
    expect(await checkGoogleEnabled(OK, 'k', reply(true, { external: { email: true, google: false } }))).toBe(false);
    expect(await checkGoogleEnabled(OK, 'k', reply(true, {}))).toBe(false);
  });

  it('fails closed on errors, so the button stays hidden', async () => {
    expect(await checkGoogleEnabled(OK, 'k', reply(false, {}))).toBe(false);
    expect(await checkGoogleEnabled(OK, 'k', (async () => { throw new Error('offline'); }) as unknown as typeof fetch)).toBe(false);
  });

  it('calls the settings endpoint with the public key', async () => {
    let seen: { url?: string; apikey?: string } = {};
    const spy = (async (u: string, init?: RequestInit) => { seen = { url: u, apikey: (init?.headers as Record<string, string>).apikey }; return { ok: true, json: async () => ({}) }; }) as unknown as typeof fetch;
    await checkGoogleEnabled(OK, 'pub-key', spy);
    expect(seen).toEqual({ url: `${OK}/auth/v1/settings`, apikey: 'pub-key' });
  });
});
// DEV ONLY. Prints a one-time sign-in link WITHOUT sending an email, so you can keep testing
// when Supabase says "email rate limit exceeded".
//
//   node scripts/dev-login-link.mjs you@example.com [redirectUrl]
//
// Needs SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env.
// SUPABASE_SERVICE_ROLE_KEY must be the SECRET key (sb_secret_...) or the legacy service_role key,
// NOT the public anon/publishable key. Open the printed link in the browser on the SAME computer that runs the app.
// The secret key is a master key: only use this on your own machine, never put it in client code.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const loadEnv = (file) => {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
};

/** Tells us what kind of key was pasted, without ever printing the key itself. */
const describeKey = (key) => {
  if (key.startsWith('sb_secret_')) return { ok: true, kind: 'secret key' };
  if (key.startsWith('sb_publishable_')) return { ok: false, kind: 'publishable (public) key' };
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const role = JSON.parse(Buffer.from(parts[1], 'base64url').toString()).role;
      return { ok: role === 'service_role', kind: `legacy JWT key with role "${role}"` };
    } catch { /* fall through */ }
  }
  return { ok: false, kind: 'key in an unrecognized format' };
};

const main = async () => {
  loadEnv('.env.local');
  loadEnv('.env');

  const [email, redirectTo = 'http://localhost:8080'] = process.argv.slice(2);
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!email || !email.includes('@')) {
    console.error('Usage: node scripts/dev-login-link.mjs you@example.com [redirectUrl]');
    return 1;
  }
  if (!rawUrl || !key) {
    console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in .env.local / .env.');
    return 1;
  }

  let url;
  try {
    url = new URL(rawUrl.trim().replace(/^["']|["']$/g, '')).origin; // keeps only https://PROJECT.supabase.co
  } catch {
    console.error('SUPABASE_URL is not a valid URL:', rawUrl);
    return 1;
  }

  const info = describeKey(key);
  if (!info.ok) {
    console.error(
      `SUPABASE_SERVICE_ROLE_KEY is a ${info.kind}, but this script needs the SECRET key.\n` +
      'Get it in Supabase > Settings > API Keys: under "Secret keys" click the copy/reveal button (it starts with sb_secret_),\n' +
      'or use the legacy "service_role" key. The public anon/publishable key cannot create sign-in links.',
    );
    return 1;
  }

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo } });

  if (error) {
    console.error('Could not create the link:', error.message);
    console.error(`Check that the key belongs to the same project as ${url}.`);
    return 1;
  }

  console.log(`\nOpen this link in your laptop browser (works once):\n\n${data.properties.action_link}\n`);
  console.log(`It signs ${email} in and returns to ${redirectTo}.`);
  console.log('That address must be listed in Supabase > Authentication > URL Configuration > Redirect URLs.');
  return 0;
};

// Set the exit code instead of calling process.exit(): on Windows, exiting while a network
// connection is still closing can crash Node with "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)".
process.exitCode = await main();
// DEV ONLY. Prints a one-time sign-in link WITHOUT sending an email, so you can keep testing
// when Supabase says "email rate limit exceeded".
//
//   node scripts/dev-login-link.mjs you@example.com [redirectUrl]
//
// Needs SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env.
// Open the printed link in the browser on the SAME computer that runs the app.
// The service role key is a master key: only use this on your own machine, never put it in client code.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const loadEnv = (file) => {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
};
loadEnv('.env.local');
loadEnv('.env');

const [email, redirectTo = 'http://localhost:8080'] = process.argv.slice(2);
const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !email.includes('@')) {
  console.error('Usage: node scripts/dev-login-link.mjs you@example.com [redirectUrl]');
  process.exit(1);
}
if (!rawUrl || !key) {
  console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in .env.local / .env.');
  process.exit(1);
}

let url;
try {
  url = new URL(rawUrl.trim().replace(/^["']|["']$/g, '')).origin; // keeps only https://PROJECT.supabase.co
} catch {
  console.error('SUPABASE_URL is not a valid URL:', rawUrl);
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo } });

if (error) {
  console.error('Could not create the link:', error.message);
  process.exit(1);
}

console.log(`\nOpen this link in your laptop browser (works once):\n\n${data.properties.action_link}\n`);
console.log(`It signs ${email} in and returns to ${redirectTo}.`);
console.log('That address must be listed in Supabase > Authentication > URL Configuration > Redirect URLs.');
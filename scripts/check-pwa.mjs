// Verifies the production build is a valid, installable PWA.
//   npm run build && npm run check:pwa
import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist';
let failures = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};
const read = (f) => fs.readFileSync(path.join(dist, f), 'utf8');
const pngSize = (f) => {
  const b = fs.readFileSync(path.join(dist, f));
  return b.subarray(1, 4).toString() === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null;
};

if (!fs.existsSync(dist)) { console.error('No dist folder. Run `npm run build` first.'); process.exit(1); }

// ---- manifest
const m = JSON.parse(read('manifest.webmanifest'));
check(!!m.name && !!m.short_name, 'manifest has a name and short_name');
check(m.display === 'standalone', 'display is standalone');
check(m.start_url === '/app' && m.scope === '/' && m.start_url.startsWith(m.scope), 'start_url is inside scope');
check(/^#[0-9a-f]{6}$/i.test(m.theme_color) && /^#[0-9a-f]{6}$/i.test(m.background_color), 'theme and background colors set');

const sizes = (purpose) => m.icons.filter(i => (i.purpose ?? 'any') === purpose);
check(sizes('any').some(i => i.sizes === '192x192') && sizes('any').some(i => i.sizes === '512x512'), 'has 192 and 512 "any" icons');
check(sizes('maskable').some(i => i.sizes === '512x512'), 'has a 512 maskable icon');
for (const icon of m.icons) {
  const file = icon.src.replace(/^\//, '');
  const exists = fs.existsSync(path.join(dist, file));
  const dim = exists ? pngSize(file) : null;
  const [w, h] = icon.sizes.split('x').map(Number);
  check(exists && dim && dim[0] === w && dim[1] === h, `icon ${icon.src} exists and really is ${icon.sizes}`, dim ? `actual ${dim.join('x')}` : 'missing');
}

// ---- index.html
const html = read('index.html');
check(/<link rel="manifest" href="\/manifest\.webmanifest"/.test(html), 'index.html links the manifest');
check(/rel="apple-touch-icon"/.test(html), 'apple-touch-icon present (iPhone home screen)');
check(/name="theme-color"/.test(html), 'theme-color present');
check(fs.existsSync(path.join(dist, 'icons/apple-touch-icon.png')) && pngSize('icons/apple-touch-icon.png')?.[0] === 180, 'apple-touch-icon is 180x180');

// ---- service worker
const sw = read('sw.js');
const precached = [...sw.matchAll(/url:"([^"]+)"/g)].map(x => x[1]);
check(precached.includes('index.html'), 'index.html is precached (offline start)');
check(precached.some(u => u.endsWith('.js')) && precached.some(u => u.endsWith('.css')), 'JS and CSS are precached');
check(!precached.some(u => /\.mp3$|^sounds\/|og\.png/.test(u)), 'big files (sounds, share image) are NOT precached');
check(/denylist:\[\/\^\\\/api\\\/\/\]/.test(sw), 'navigation fallback never captures /api routes (payments, webhook)');
check(!/registerRoute\([^)]*api/.test(sw), 'no cache rule touches /api');
check(/skipWaiting/.test(sw) && !/clientsClaim\(\)/.test(sw), 'updates wait for the user (no silent takeover that would reset a timer)');

// ---- hosting config
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const swHeaders = vercel.headers?.find(h => h.source === '/sw.js')?.headers ?? [];
check(swHeaders.some(h => h.key === 'Cache-Control' && /max-age=0/.test(h.value)), 'vercel.json: sw.js is never cached (updates arrive)');
check(vercel.rewrites?.some(r => /api/.test(r.source)), 'vercel.json: SPA rewrite excludes /api');

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll PWA checks passed.');
process.exitCode = failures ? 1 : 0;
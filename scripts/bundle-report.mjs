// Shows how much JavaScript a visitor downloads (gzip) on first load of each page.
//   npm run build && npm run check:size
// Build with your real VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set: without them the Supabase library is
// removed from the build and the numbers look better than what your visitors really download.
// Fails if the first load of any page goes over the budget below, so the site cannot silently get heavy again.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const BUDGET_KB = { landing: 150, app: 230 }; // gzip KB of JavaScript on first load. Raise deliberately, not by accident.

const assets = 'dist/assets';
if (!fs.existsSync(assets)) { console.error('No dist folder. Run `npm run build` first.'); process.exit(1); }

const files = fs.readdirSync(assets).filter(f => f.endsWith('.js'));
const gz = Object.fromEntries(files.map(f => [f, zlib.gzipSync(fs.readFileSync(path.join(assets, f))).length]));
const raw = Object.fromEntries(files.map(f => [f, fs.statSync(path.join(assets, f)).size]));
const kb = n => (n / 1024).toFixed(1).padStart(7);

// Static imports only (dynamic import() is what splits code, and is not downloaded up front).
const staticDeps = (f) => {
  const src = fs.readFileSync(path.join(assets, f), 'utf8');
  return [...src.matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)].map(m => m[1]).filter(d => files.includes(d));
};
const closure = (roots) => {
  const seen = new Set();
  const walk = f => { if (seen.has(f)) return; seen.add(f); staticDeps(f).forEach(walk); };
  roots.forEach(walk);
  return seen;
};

const html = fs.readFileSync('dist/index.html', 'utf8');
const entry = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)].map(m => m[1]).filter(f => files.includes(f));
const base = closure(entry);
const total = set => [...set].reduce((a, f) => a + gz[f], 0);

const hasSupabase = files.some(f => /GoTrueClient|PostgrestClient/.test(fs.readFileSync(path.join(assets, f), 'utf8')));
if (!hasSupabase) console.log('WARNING: this build contains no Supabase code (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY were not set).\n         Sizes below are too low. Set them and rebuild to see what visitors really download.\n');

console.log('All JavaScript chunks (raw / gzip KB):');
files.sort((a, b) => raw[b] - raw[a]).forEach(f => console.log(`  ${kb(raw[f])} / ${kb(gz[f])}   ${f}`));

const routeChunk = (name) => files.find(f => f.toLowerCase().startsWith(`${name}-`));
const first = (name) => {
  const rc = routeChunk(name);
  return rc ? { split: true, size: total(closure([...entry, rc])) } : { split: false, size: total(base) };
};

console.log('\nFirst-load JavaScript per page (gzip KB):');
const rows = [['landing', 'Landing (/)'], ['index', 'App (/app)'], ['sponsor', 'Sponsor page'], ['legal', 'Legal pages']];
const sizes = {};
for (const [key, label] of rows) {
  const r = first(key);
  sizes[key] = r.size;
  console.log(`  ${kb(r.size)}   ${label}${r.split ? '' : '   (everything is in the main bundle)'}`);
}
console.log(`  ${kb(total(new Set(files)))}   everything combined (what offline mode caches)`);

let failed = false;
for (const [key, limit] of [['landing', BUDGET_KB.landing], ['index', BUDGET_KB.app]]) {
  const over = sizes[key] / 1024 > limit;
  console.log(`${over ? 'FAIL' : 'PASS'}  ${key === 'index' ? 'App' : 'Landing'} first load is ${(sizes[key] / 1024).toFixed(0)} KB (budget ${limit} KB)`);
  if (over) failed = true;
}
process.exitCode = failed ? 1 : 0;
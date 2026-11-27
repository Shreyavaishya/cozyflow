import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '..');
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');
const staticImport = (code: string, pattern: RegExp) =>
  code.split('\n').some(line => /^\s*import\s/.test(line) && !/^\s*import\s+type\s/.test(line) && pattern.test(line));

describe('keep the first download small', () => {
  // These are used by the landing, legal, sponsor and embed pages. If any of them imports the Supabase
  // library directly, every visitor downloads it (about 58 KB gzip) even if they never sign in.
  const mustNotImportSupabase = [
    'pages/Landing.tsx', 'pages/Sponsor.tsx', 'pages/Legal.tsx', 'pages/Embed.tsx', 'pages/NotFound.tsx',
    'store/useProStore.ts', 'lib/sponsors.ts', 'lib/routes.ts',
    'components/SceneBackground.tsx', 'components/Appearance.tsx', 'components/UpdateToast.tsx',
    'components/InstallButton.tsx', 'components/SocialProof.tsx', 'hooks/useAppearance.ts',
  ];

  it.each(mustNotImportSupabase)('%s does not import the Supabase library up front', (file) => {
    expect(staticImport(read(file), /@\/lib\/supabase|@supabase\//)).toBe(false);
  });

  it('the router loads every page on demand', () => {
    const app = read('App.tsx');
    for (const page of ['Landing', 'Index', 'Embed', 'Sponsor', 'NotFound', 'Legal']) {
      expect(staticImport(app, new RegExp(`pages/${page}['"]`))).toBe(false);
    }
  });

  it('the charting library is only imported by the lazily loaded chart', () => {
    const offenders = ['components/InsightsDialog.tsx', 'pages/Index.tsx', 'pages/Landing.tsx']
      .filter(f => staticImport(read(f), /recharts/));
    expect(offenders).toEqual([]);
    expect(staticImport(read('components/WeekChart.tsx'), /recharts/)).toBe(true);
  });
});
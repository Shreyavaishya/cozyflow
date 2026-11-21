// Pure canvas drawing (no app imports) so it can be tested in Node with node-canvas.
export interface ShareData {
  streak: number;
  weekFocus: string; // e.g. "25m" or "4.5h"
  weekSessions: number;
  totalFocus: string;
  last35: number[]; // session counts, oldest -> newest
  host: string;
}

const PRIMARY = '#c4694a';
const INK = '#3d2b24';
const MUTED = '#8a766c';
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'Helvetica, Arial, "Segoe UI", Roboto, sans-serif';

const roundRect = (c: any, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
};

const background = (c: any, w: number, h: number) => {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f8f2eb');
  g.addColorStop(1, '#efe2d6');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  const r = c.createRadialGradient(w / 2, h * 0.35, 20, w / 2, h * 0.35, w * 0.7);
  r.addColorStop(0, 'rgba(196,105,74,0.22)');
  r.addColorStop(1, 'rgba(196,105,74,0)');
  c.fillStyle = r;
  c.fillRect(0, 0, w, h);
};

export const drawShareCard = (c: any, W: number, H: number, d: ShareData) => {
  background(c, W, H);
  c.textBaseline = 'alphabetic';

  // Brand
  c.textAlign = 'left';
  c.fillStyle = INK;
  c.font = `bold 46px ${SERIF}`;
  c.fillText('🍅 Cozy Flow', 80, 120);

  // Streak
  c.textAlign = 'center';
  c.font = `120px ${SANS}`;
  c.fillText('🔥', W / 2, 330);
  c.fillStyle = PRIMARY;
  c.font = `bold 280px ${SERIF}`;
  c.fillText(String(d.streak), W / 2, 590);
  c.fillStyle = INK;
  c.font = `normal 56px ${SANS}`;
  c.fillText('day streak', W / 2, 670);

  // Stat boxes
  const stats = [
    { label: 'This week', value: d.weekFocus },
    { label: 'Sessions', value: String(d.weekSessions) },
    { label: 'All time', value: d.totalFocus },
  ];
  const boxW = 290, gap = 35, top = 740, boxH = 190;
  const startX = (W - (boxW * 3 + gap * 2)) / 2;
  stats.forEach((s, i) => {
    const x = startX + i * (boxW + gap);
    roundRect(c, x, top, boxW, boxH, 36);
    c.fillStyle = 'rgba(255,255,255,0.65)';
    c.fill();
    c.fillStyle = MUTED;
    c.font = `normal 28px ${SANS}`;
    c.fillText(s.label, x + boxW / 2, top + 55);
    c.fillStyle = INK;
    c.font = `bold 72px ${SERIF}`;
    c.fillText(s.value, x + boxW / 2, top + 140);
  });

  // 35-day mini heatmap (5 rows x 7 cols)
  const cell = 46, cg = 10;
  const gridW = 7 * cell + 6 * cg;
  const gx = (W - gridW) / 2, gy = 955;
  d.last35.forEach((n, i) => {
    const col = i % 7, row = Math.floor(i / 7);
    roundRect(c, gx + col * (cell + cg), gy + row * (cell + cg), cell, cell, 12);
    c.fillStyle = n === 0 ? 'rgba(196,105,74,0.14)' : n === 1 ? 'rgba(196,105,74,0.38)' : n <= 3 ? 'rgba(196,105,74,0.65)' : PRIMARY;
    c.fill();
  });
  c.fillStyle = MUTED;
  c.font = `normal 26px ${SANS}`;
  c.fillText('Last 35 days', W / 2, gy + 5 * cell + 4 * cg + 40);

  // Footer
  c.fillStyle = INK;
  c.font = `bold 38px ${SANS}`;
  c.fillText(`Focus with me → ${d.host}`, W / 2, H - 38);
};

export const drawOgImage = (c: any, W: number, H: number, host: string) => {
  background(c, W, H);
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  c.fillStyle = INK;
  c.font = `bold 92px ${SERIF}`;
  c.fillText('Cozy Flow', 84, 250);
  c.fillStyle = MUTED;
  c.font = `normal 38px ${SANS}`;
  ['A calm Pomodoro timer with', 'ambient sounds, tasks and streaks.'].forEach((l, i) => c.fillText(l, 84, 335 + i * 54));
  c.fillStyle = PRIMARY;
  c.font = `bold 34px ${SANS}`;
  c.fillText(host, 84, 535);

  // timer ring
  const cx = 930, cy = 315, r = 190;
  c.lineWidth = 22;
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(196,105,74,0.18)';
  c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = PRIMARY;
  c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.35); c.stroke();
  c.textAlign = 'center';
  c.fillStyle = PRIMARY;
  c.font = `bold 104px ${SERIF}`;
  c.fillText('25:00', cx, cy + 30);
  c.fillStyle = MUTED;
  c.font = `normal 34px ${SANS}`;
  c.fillText('Focus', cx, cy + 85);
};

export const renderShareCardBlob = (d: ShareData): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    drawShareCard(canvas.getContext('2d'), 1080, 1350, d);
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not render image'))), 'image/png');
  });

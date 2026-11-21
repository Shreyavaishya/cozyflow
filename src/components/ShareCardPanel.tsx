import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, Share2 } from 'lucide-react';
import { useStore, toDateKey, getStreak, getSessionsThisWeek } from '@/store/useStore';
import { renderShareCardBlob, ShareData } from '@/lib/shareCard';
import { fmtFocus } from '@/lib/format';
import { SITE_HOST, SITE_URL } from '@/lib/site';

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const ShareCardPanel = () => {
  const history = useStore(s => s.stats.dailyHistory);
  const totalMinutes = useStore(s => s.stats.totalMinutes);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const data: ShareData = useMemo(() => {
    const byDate = new Map(history.map(h => [h.date, h]));
    const day = 86400000;
    const weekMinutes = Array.from({ length: 7 }, (_, i) => byDate.get(toDateKey(new Date(Date.now() - i * day)))?.minutes ?? 0)
      .reduce((a, b) => a + b, 0);
    return {
      streak: getStreak(history),
      weekFocus: fmtFocus(weekMinutes),
      weekSessions: getSessionsThisWeek(history),
      totalFocus: fmtFocus(totalMinutes),
      last35: Array.from({ length: 35 }, (_, i) => byDate.get(toDateKey(new Date(Date.now() - (34 - i) * day)))?.count ?? 0),
      host: SITE_HOST,
    };
  }, [history, totalMinutes]);

  const hasActivity = history.some(h => h.count > 0);

  useEffect(() => {
    if (!hasActivity) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    renderShareCardBlob(data)
      .then(b => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch(() => setMsg('Could not create the image.'));
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [data, hasActivity]);

  if (!hasActivity) {
    return <p className="text-xs text-muted-foreground">Finish a focus session to unlock your shareable streak card.</p>;
  }

  const caption = data.streak > 0
    ? `${data.streak}-day focus streak on Cozy Flow 🍅 ${data.weekFocus} focused this week.`
    : `${data.weekFocus} focused this week on Cozy Flow 🍅`;

  const download = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cozy-flow-streak.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMsg('Image downloaded.');
  };

  const copyCaption = async () => {
    try { await navigator.clipboard.writeText(`${caption} ${SITE_URL}`); return true; } catch { return false; }
  };

  const copyImage = async () => {
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setMsg('Image copied. Paste it into your post.');
    } catch {
      setMsg('Your browser blocked image copy. Use Download instead.');
    }
  };

  // Native share sheet: phones only. Desktop browsers handle file sharing unreliably.
  const nativeShare = async () => {
    if (!blob) return;
    const file = new File([blob], 'cozy-flow-streak.png', { type: 'image/png' });
    try {
      await navigator.share({ files: [file], text: `${caption} ${SITE_URL}` });
    } catch (e: any) {
      if (e?.name !== 'AbortError') { download(); await copyCaption(); setMsg('Sharing is not available here. Image downloaded and caption copied.'); }
    }
  };

  const canNative = isMobile() && !!blob && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [new File([blob], 'x.png', { type: 'image/png' })] });

  const open = (link: string) => window.open(link, '_blank', 'noopener,noreferrer');
  const postX = async () => {
    await copyImage();
    open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(SITE_URL)}`);
  };
  const whatsapp = async () => {
    await copyImage();
    open(`https://wa.me/?text=${encodeURIComponent(`${caption} ${SITE_URL}`)}`);
  };

  const btn = 'flex items-center gap-2 rounded-xl text-sm px-3 py-2 disabled:opacity-60';

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Share your streak</p>
      <div className="flex gap-4 items-start">
        {url ? (
          <img src={url} alt="Your Cozy Flow streak card" className="h-44 rounded-xl border border-border/50" />
        ) : (
          <div className="h-44 w-36 rounded-xl bg-muted/60 animate-pulse" />
        )}
        <div className="flex flex-col gap-2">
          {canNative && (
            <button onClick={nativeShare} className={`${btn} bg-primary text-primary-foreground`}>
              <Share2 size={14} /> Share
            </button>
          )}
          <button onClick={download} disabled={!blob} className={`${btn} ${canNative ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
            <Download size={14} /> Download
          </button>
          <button onClick={copyImage} disabled={!blob} className={`${btn} bg-muted hover:bg-muted/70`}>
            <Copy size={14} /> Copy image
          </button>
          <div className="flex gap-2">
            <button onClick={postX} disabled={!blob} className={`${btn} bg-muted hover:bg-muted/70`}>Post on X</button>
            <button onClick={whatsapp} disabled={!blob} className={`${btn} bg-muted hover:bg-muted/70`}>WhatsApp</button>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">X and WhatsApp copy the image first, then open the post. Paste it in.</p>
      {msg && <p className="text-xs text-primary">{msg}</p>}
    </div>
  );
};

export default ShareCardPanel;

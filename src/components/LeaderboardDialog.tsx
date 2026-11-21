import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { cloudEnabled } from '@/lib/supabase';
import { fmtFocus } from '@/lib/format';
import { fetchLeaderboard, getMyProfile, joinLeaderboard, leaveLeaderboard, LeaderboardRow, Period } from '@/lib/leaderboard';

const medal = (r: number) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : String(r));

const LeaderboardDialog = ({ session }: { session: Session | null }) => {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('week');
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await fetchLeaderboard(period));
      setMsg('');
    } catch (e: any) {
      setRows([]);
      setMsg(e.message);
    }
  }, [period]);

  useEffect(() => {
    if (!open) return;
    setRows(null);
    load();
  }, [open, load]);

  useEffect(() => {
    if (!open || !session) return;
    getMyProfile(session.user.id).then(setMyName);
  }, [open, session]);

  if (!cloudEnabled) return null;

  const join = async () => {
    if (!session) return;
    setBusy(true); setMsg('');
    try {
      await joinLeaderboard(session.user.id, name.trim());
      setMyName(name.trim());
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!session) return;
    setBusy(true);
    try {
      await leaveLeaderboard(session.user.id);
      setMyName(null);
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const iAmListed = rows?.some(r => r.is_me);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          className="p-2 rounded-xl glass-panel text-muted-foreground hover:text-foreground"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title="Leaderboard"
        >
          <Trophy size={18} />
        </motion.button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Leaderboard</DialogTitle>
          <DialogDescription>Top focusers. Weekly ranking resets every Monday.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-xl bg-muted/60 p-1 w-fit">
          {(['week', 'all'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs ${period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {p === 'week' ? 'This week' : 'All time'}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 min-h-24">
          {rows === null && <div className="h-24 rounded-xl bg-muted/50 animate-pulse" />}
          {rows?.length === 0 && !msg && (
            <p className="text-sm text-muted-foreground py-4 text-center">No one is ranked yet. Join and be the first! 🏆</p>
          )}
          {rows?.map(r => (
            <div
              key={`${r.rank}-${r.display_name}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${r.is_me ? 'bg-primary/15 ring-1 ring-primary/40' : 'bg-muted/40'}`}
            >
              <span className="w-6 text-center">{medal(r.rank)}</span>
              <span className="flex-1 truncate font-medium">{r.display_name}{r.is_me && ' (you)'}</span>
              <span className="text-muted-foreground tabular-nums">{fmtFocus(r.minutes)}</span>
            </div>
          ))}
        </div>

        {session && myName && !iAmListed && rows && (
          <p className="text-xs text-muted-foreground">You are in, but not ranked for this period yet. Finish a focus session and give it a few seconds to sync.</p>
        )}

        {!session ? (
          <p className="text-xs text-muted-foreground">Sign in with the account icon to join the leaderboard.</p>
        ) : myName ? (
          <button onClick={leave} disabled={busy} className="text-xs text-muted-foreground underline underline-offset-2 w-fit">
            Leave the leaderboard (shown as {myName})
          </button>
        ) : (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-sm font-medium">Join the leaderboard</p>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim().length >= 2 && join()}
                maxLength={20}
                placeholder="Display name"
                className="min-w-0 flex-1 bg-muted/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/30"
              />
              <button
                onClick={join}
                disabled={busy || name.trim().length < 2}
                className="rounded-xl bg-primary text-primary-foreground text-sm px-4 disabled:opacity-60"
              >
                Join
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Only this display name and your focus minutes are shown publicly. Never your email. You can leave any time.
            </p>
          </div>
        )}
        {msg && <p className="text-xs text-destructive">{msg}</p>}
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardDialog;

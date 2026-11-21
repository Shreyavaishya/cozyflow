import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase, cloudEnabled } from '@/lib/supabase';
import type { useCloudSync } from '@/hooks/useCloudSync';

type Props = ReturnType<typeof useCloudSync>;

const AccountButton = ({ session, status, errorMsg }: Props) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!cloudEnabled) return null;

  const sendLink = async () => {
    if (!email.trim()) return;
    setBusy(true); setErr('');
    const { error } = await supabase!.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  };

  const google = () =>
    supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });

  const Icon = status === 'syncing' ? Loader2 : status === 'error' ? CloudOff : session ? Cloud : User;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl glass-panel text-muted-foreground hover:text-foreground"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        title={session ? 'Account' : 'Sign in to sync'}
      >
        <Icon size={18} className={status === 'syncing' ? 'animate-spin' : ''} />
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          {session ? (
            <>
              <DialogHeader>
                <DialogTitle>Your account</DialogTitle>
                <DialogDescription>
                  {session.user.email} · {status === 'synced' ? 'All synced' : status === 'syncing' ? 'Syncing…' : status === 'error' ? `Sync error: ${errorMsg || 'unknown'}` : 'Local only'}
                </DialogDescription>
              </DialogHeader>
              <button
                onClick={() => { supabase!.auth.signOut(); setOpen(false); }}
                className="w-full rounded-xl bg-muted px-4 py-2 text-sm hover:bg-muted/70"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Sync across devices</DialogTitle>
                <DialogDescription>Sign in to save your streaks, stats and tasks.</DialogDescription>
              </DialogHeader>
              {sent ? (
                <p className="text-sm text-muted-foreground">Check your inbox for the sign-in link.</p>
              ) : (
                <div className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendLink()}
                    placeholder="you@email.com"
                    className="w-full bg-muted/50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/30"
                  />
                  <button
                    onClick={sendLink}
                    disabled={busy}
                    className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {busy ? 'Sending…' : 'Email me a magic link'}
                  </button>
                  <button onClick={google} className="w-full rounded-xl bg-muted px-4 py-2 text-sm hover:bg-muted/70">
                    Continue with Google
                  </button>
                  {err && <p className="text-xs text-destructive">{err}</p>}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountButton;

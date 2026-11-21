import { useState } from 'react';
import { Check, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { loadRazorpay } from '@/lib/razorpay';
import { PLANS, PRO_FEATURES, PlanId } from '@/lib/plans';
import { useProStore } from '@/store/useProStore';
import type { Session } from '@supabase/supabase-js';

const UpgradeDialog = ({ session }: { session: Session | null }) => {
  const { upgradeOpen, setUpgradeOpen, isPro, proUntil, lifetime, load } = useProStore();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [msg, setMsg] = useState('');

  const call = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session!.access_token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? 'Something went wrong');
    return json;
  };

  const buy = async (plan: PlanId) => {
    setMsg('');
    if (!session) { setMsg('Sign in first (account icon in the header), then upgrade.'); return; }
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
    if (!keyId) { setMsg('Payments are not configured yet.'); return; }
    setBusy(plan);
    try {
      if (!(await loadRazorpay())) throw new Error('Could not load Razorpay. Check your connection.');
      const order = await call('/api/create-order', { plan });
      const rzp = new window.Razorpay({
        key: keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Cozy Flow',
        description: `Pro · ${PLANS[plan].label}`,
        prefill: { email: session.user.email },
        theme: { color: '#c4694a' },
        handler: async (resp: any) => {
          try {
            await call('/api/verify-payment', resp);
            await load(session.user.id);
            setMsg('You are Pro now. Thank you! 🎉');
          } catch (e: any) {
            setMsg(e.message);
          } finally {
            setBusy(null);
          }
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      rzp.open();
    } catch (e: any) {
      setMsg(e.message);
      setBusy(null);
    }
  };

  return (
    <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Crown size={18} className="text-primary" /> Cozy Flow Pro</DialogTitle>
          <DialogDescription>
            {isPro
              ? lifetime ? 'You have lifetime Pro. 💛' : `Pro active until ${new Date(proUntil!).toLocaleDateString()}. You can extend anytime.`
              : 'Unlock the full cozy experience.'}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1.5 text-sm">
          {PRO_FEATURES.map(f => (
            <li key={f} className="flex items-center gap-2"><Check size={14} className="text-primary" />{f}</li>
          ))}
        </ul>

        {!lifetime && (
          <div className="grid gap-2">
            {(Object.keys(PLANS) as PlanId[]).map(id => (
              <button
                key={id}
                onClick={() => buy(id)}
                disabled={!!busy}
                className="flex items-center justify-between rounded-xl bg-muted/60 hover:bg-muted px-4 py-3 text-left disabled:opacity-60"
              >
                <span>
                  <span className="block text-sm font-medium">{PLANS[id].label}</span>
                  <span className="block text-xs text-muted-foreground">{PLANS[id].blurb}</span>
                </span>
                <span className="text-base font-semibold">
                  {busy === id ? '…' : `₹${PLANS[id].price}`}<span className="text-xs font-normal text-muted-foreground">{PLANS[id].period}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        {!lifetime && (
          <p className="text-[11px] text-muted-foreground">
            One-time payment, no auto-renewal. By paying you agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</a> and{' '}
            <a href="/refund" target="_blank" rel="noopener noreferrer" className="underline">Refund Policy</a>.
          </p>
        )}
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;

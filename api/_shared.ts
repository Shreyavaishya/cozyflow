import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

// Keep in sync with src/lib/plans.ts. Amounts are in paise. Prices live on the server so clients cannot change them.
export const PLAN_CONFIG = {
  monthly:  { amount: 4900,  days: 30 },
  yearly:   { amount: 39900, days: 365 },
  lifetime: { amount: 79900, days: 0 },
} as const;
export type PlanId = keyof typeof PLAN_CONFIG;

export const admin = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

export const razorpayAuth = () =>
  'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

/** Returns the authenticated Supabase user from the Bearer token, or null. */
export const getUser = async (req: VercelRequest) => {
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error ? null : data.user;
};

export type GrantResult =
  | { status: 'applied' }
  | { status: 'already' }
  | { status: 'rejected' }            // amount does not match the plan
  | { status: 'error'; message: string };

/**
 * Records a payment and grants Pro atomically (SQL function apply_payment).
 * Safe to call more than once for the same order: replays return 'already'.
 */
export const grantPro = async (
  db: ReturnType<typeof admin>,
  p: { orderId: string; paymentId: string; userId: string; plan: PlanId; amountPaid: number },
): Promise<GrantResult> => {
  const cfg = PLAN_CONFIG[p.plan];
  if (!cfg || p.amountPaid !== cfg.amount) return { status: 'rejected' };

  const { data, error } = await db.rpc('apply_payment', {
    p_order_id: p.orderId,
    p_payment_id: p.paymentId,
    p_user_id: p.userId,
    p_plan: p.plan,
    p_amount: p.amountPaid,
    p_days: cfg.days,
  });
  if (error) return { status: 'error', message: error.message };
  return data === 'already' ? { status: 'already' } : { status: 'applied' };
};

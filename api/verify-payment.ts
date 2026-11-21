import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PLAN_CONFIG, PlanId, admin, getUser, grantPro, razorpayAuth } from './_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in first' });

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body ?? {};
  if (!orderId || !paymentId || !signature) return res.status(400).json({ error: 'Missing payment fields' });

  // 1. Verify the signature Razorpay produced
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const ok = expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!ok) return res.status(400).json({ error: 'Invalid signature' });

  // 2. Read the order from Razorpay (do not trust the client for plan or user)
  const r = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, { headers: { Authorization: razorpayAuth() } });
  const order = await r.json();
  if (!r.ok) return res.status(502).json({ error: 'Could not load order' });

  const plan = order.notes?.plan as PlanId;
  const cfg = PLAN_CONFIG[plan];
  if (!cfg || order.notes?.user_id !== user.id) return res.status(403).json({ error: 'Order does not belong to this user' });
  if (order.status !== 'paid' || order.amount_paid !== cfg.amount) return res.status(402).json({ error: 'Payment not completed' });

  // 3. Record the payment and grant Pro in one transaction. Safe to repeat for the same order.
  const result = await grantPro(admin(), { orderId, paymentId, userId: user.id, plan, amountPaid: order.amount_paid });
  if (result.status === 'already') return res.status(200).json({ ok: true, alreadyApplied: true });
  if (result.status === 'rejected') return res.status(402).json({ error: 'Payment not completed' });
  if (result.status === 'error') return res.status(500).json({ error: 'Payment received but activation failed. It will be retried automatically; contact support if Pro does not appear.' });

  return res.status(200).json({ ok: true });
}

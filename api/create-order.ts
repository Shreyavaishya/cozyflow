import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PLAN_CONFIG, PlanId, getUser, razorpayAuth } from './_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in first' });

  const plan = req.body?.plan as PlanId;
  const cfg = PLAN_CONFIG[plan];
  if (!cfg) return res.status(400).json({ error: 'Invalid plan' });

  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: razorpayAuth() },
    body: JSON.stringify({
      amount: cfg.amount,
      currency: 'INR',
      receipt: `cf_${Date.now()}`,
      notes: { user_id: user.id, plan },
    }),
  });
  const order = await r.json();
  if (!r.ok) return res.status(502).json({ error: order?.error?.description ?? 'Could not create order' });

  return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency });
}

import crypto from 'node:crypto';
import { PLAN_CONFIG, PlanId, admin, grantPro } from './_shared.js';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Razorpay webhook: activates Pro even if the buyer closed the tab before the browser verified the payment.
 * Dashboard setup: Settings > Webhooks > URL https://YOUR-DOMAIN/api/razorpay-webhook,
 * a secret of your choice (same value as RAZORPAY_WEBHOOK_SECRET), and only the "order.paid" event.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return json({ error: 'Webhook is not configured' }, 500);

  // The signature is computed over the exact raw body, so read it as text before parsing.
  const raw = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const valid = signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return json({ error: 'Invalid signature' }, 400);

  let event: any;
  try { event = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON' }, 400); }

  if (event.event !== 'order.paid') return json({ ok: true, ignored: true });

  const order = event.payload?.order?.entity;
  const payment = event.payload?.payment?.entity;
  const userId = order?.notes?.user_id as string | undefined;
  const plan = order?.notes?.plan as PlanId | undefined;

  // Not one of our orders (for example created elsewhere on the same Razorpay account): acknowledge and ignore.
  if (!order?.id || !payment?.id || !userId || !plan || !PLAN_CONFIG[plan]) return json({ ok: true, ignored: true });

  const result = await grantPro(admin(), { orderId: order.id, paymentId: payment.id, userId, plan, amountPaid: order.amount_paid });

  // A 5xx makes Razorpay retry later. Rejected amounts are not retried.
  if (result.status === 'error') return json({ error: 'Activation failed, will retry' }, 500);
  if (result.status === 'rejected') console.error('[webhook] amount does not match plan', order.id);
  return json({ ok: true, status: result.status });
}

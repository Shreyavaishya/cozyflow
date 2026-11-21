import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = { payments: new Map<string, any>(), subs: new Map<string, any>(), failRpc: false };

vi.mock('../../api/_shared.js', async () => {
  const actual = await vi.importActual<any>('../../api/_shared.js');
  return {
    ...actual,
    admin: () => ({
      rpc: async (_n: string, a: any) => {
        if (state.failRpc) return { data: null, error: { message: 'db down' } };
        if (state.payments.has(a.p_order_id)) return { data: 'already', error: null };
        state.payments.set(a.p_order_id, a);
        const cur = state.subs.get(a.p_user_id);
        const base = cur?.pro_until && new Date(cur.pro_until) > new Date() ? new Date(cur.pro_until) : new Date();
        state.subs.set(a.p_user_id, { lifetime: a.p_days === 0, pro_until: new Date(base.getTime() + a.p_days * 86400000).toISOString() });
        return { data: 'applied', error: null };
      },
    }),
  };
});

import { POST } from '../../api/razorpay-webhook';

const SECRET = 'whsec_test';
const sign = (raw: string, secret = SECRET) => crypto.createHmac('sha256', secret).update(raw).digest('hex');

const event = (over: any = {}) => JSON.stringify({
  event: 'order.paid',
  payload: {
    order: { entity: { id: 'order_1', amount_paid: 4900, notes: { user_id: 'u1', plan: 'monthly' }, ...(over.order ?? {}) } },
    payment: { entity: { id: 'pay_1' } },
  },
  ...(over.top ?? {}),
});

const call = (raw: string, sig = sign(raw)) =>
  POST(new Request('https://example.com/api/razorpay-webhook', { method: 'POST', body: raw, headers: { 'x-razorpay-signature': sig } }));

beforeEach(() => { state.payments.clear(); state.subs.clear(); state.failRpc = false; process.env.RAZORPAY_WEBHOOK_SECRET = SECRET; });

describe('razorpay webhook', () => {
  it('grants Pro for a paid order, even though the browser never verified it', async () => {
    const res = await call(event());
    expect(res.status).toBe(200);
    expect(state.subs.get('u1')).toBeTruthy();
    expect(state.payments.size).toBe(1);
  });

  it('is idempotent when Razorpay retries the same event', async () => {
    await call(event());
    const first = state.subs.get('u1').pro_until;
    const res = await call(event());
    expect((await res.json()).status).toBe('already');
    expect(state.subs.get('u1').pro_until).toBe(first);
  });

  it('rejects a bad signature and grants nothing', async () => {
    const res = await call(event(), sign(event(), 'wrong-secret'));
    expect(res.status).toBe(400);
    expect(state.subs.size).toBe(0);
  });

  it('rejects a body that was changed after signing', async () => {
    const signed = sign(event());
    const res = await call(event({ order: { notes: { user_id: 'attacker', plan: 'lifetime' } } }), signed);
    expect(res.status).toBe(400);
    expect(state.subs.size).toBe(0);
  });

  it('ignores other events and orders that are not ours', async () => {
    expect((await call(event({ top: { event: 'payment.failed' } }))).status).toBe(200);
    expect((await call(event({ order: { notes: {} } }))).status).toBe(200);
    expect(state.subs.size).toBe(0);
  });

  it('does not grant when the paid amount does not match the plan', async () => {
    const res = await call(event({ order: { amount_paid: 100 } }));
    expect(res.status).toBe(200);
    expect(state.subs.size).toBe(0);
  });

  it('returns 500 on a database failure so Razorpay retries, then succeeds on retry', async () => {
    state.failRpc = true;
    expect((await call(event())).status).toBe(500);
    expect(state.subs.size).toBe(0);
    state.failRpc = false;
    expect((await call(event())).status).toBe(200);
    expect(state.subs.size).toBe(1);
  });

  it('refuses to run without a configured secret', async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    expect((await call(event())).status).toBe(500);
  });
});

import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---- in-memory fake of the Supabase admin client + auth
const state = { payments: new Map<string, any>(), subs: new Map<string, any>(), user: { id: 'u1' } as { id: string } | null, failRpc: false };

// In-memory stand-in for the Postgres function apply_payment (the SQL itself is tested against a real Postgres).
const fakeApplyPayment = async (a: any) => {
  if (state.failRpc) return { data: null, error: { message: 'db down' } };
  if (state.payments.has(a.p_order_id)) return { data: 'already', error: null };
  state.payments.set(a.p_order_id, { order_id: a.p_order_id, user_id: a.p_user_id, plan: a.p_plan, amount: a.p_amount });
  const cur = state.subs.get(a.p_user_id);
  const lifetime = a.p_days === 0 || !!cur?.lifetime;
  let until = cur?.pro_until ?? null;
  if (a.p_days !== 0) {
    const base = cur?.pro_until && new Date(cur.pro_until) > new Date() ? new Date(cur.pro_until) : new Date();
    until = new Date(base.getTime() + a.p_days * 86400000).toISOString();
  }
  state.subs.set(a.p_user_id, { user_id: a.p_user_id, plan: a.p_plan, pro_until: until, lifetime });
  return { data: 'applied', error: null };
};

vi.mock('../../api/_shared.js', async () => {
  const actual = await vi.importActual<any>('../../api/_shared.js');
  return {
    ...actual,
    getUser: async () => state.user,
    razorpayAuth: () => 'Basic test',
    admin: () => ({ rpc: async (_name: string, args: any) => fakeApplyPayment(args) }),
  };
});

import verify from '../../api/verify-payment';
import createOrder from '../../api/create-order';

const SECRET = 'test_secret';
process.env.RAZORPAY_KEY_SECRET = SECRET;

const sign = (o: string, p: string) => crypto.createHmac('sha256', SECRET).update(`${o}|${p}`).digest('hex');
const mkRes = () => { const r: any = { code: 0, body: null }; r.status = (c: number) => { r.code = c; return r; }; r.json = (b: any) => { r.body = b; return r; }; return r; };
const mockOrder = (o: any) => { (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => o })); };
const body = (orderId = 'order_1', paymentId = 'pay_1', sig?: string) => ({
  method: 'POST', headers: {}, body: { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig ?? sign(orderId, paymentId) },
});
const paidOrder = (plan: string, amount: number, user = 'u1') => ({ id: 'order_1', status: 'paid', amount, amount_paid: amount, notes: { user_id: user, plan } });
const days = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / 86400000);

beforeEach(() => { state.payments.clear(); state.subs.clear(); state.user = { id: 'u1' }; state.failRpc = false; });

describe('verify-payment', () => {
  it('grants 30 days for a paid monthly order', async () => {
    mockOrder(paidOrder('monthly', 4900));
    const res = mkRes();
    await verify(body() as any, res);
    expect(res.code).toBe(200);
    expect(days(state.subs.get('u1').pro_until)).toBe(30);
    expect(state.payments.size).toBe(1);
  });

  it('is idempotent: replaying the same order does not extend Pro again', async () => {
    mockOrder(paidOrder('monthly', 4900));
    await verify(body() as any, mkRes());
    const first = state.subs.get('u1').pro_until;
    const res = mkRes();
    await verify(body() as any, res);
    expect(res.body.alreadyApplied).toBe(true);
    expect(state.subs.get('u1').pro_until).toBe(first);
  });

  it('stacks a new purchase on top of remaining time', async () => {
    state.subs.set('u1', { pro_until: new Date(Date.now() + 10 * 86400000).toISOString(), lifetime: false });
    mockOrder(paidOrder('monthly', 4900));
    await verify(body() as any, mkRes());
    expect(days(state.subs.get('u1').pro_until)).toBe(40);
  });

  it('grants lifetime', async () => {
    mockOrder(paidOrder('lifetime', 79900));
    await verify(body() as any, mkRes());
    expect(state.subs.get('u1').lifetime).toBe(true);
  });

  it('rejects a bad signature and grants nothing', async () => {
    mockOrder(paidOrder('monthly', 4900));
    const res = mkRes();
    await verify(body('order_1', 'pay_1', 'f'.repeat(64)) as any, res);
    expect(res.code).toBe(400);
    expect(state.subs.size).toBe(0);
  });

  it("rejects someone else's order", async () => {
    mockOrder(paidOrder('monthly', 4900, 'someone-else'));
    const res = mkRes();
    await verify(body() as any, res);
    expect(res.code).toBe(403);
    expect(state.subs.size).toBe(0);
  });

  it('rejects an unpaid order and a short-paid amount', async () => {
    mockOrder({ ...paidOrder('yearly', 39900), status: 'created' });
    let res = mkRes(); await verify(body() as any, res); expect(res.code).toBe(402);
    mockOrder({ ...paidOrder('yearly', 39900), amount_paid: 4900 });
    res = mkRes(); await verify(body() as any, res); expect(res.code).toBe(402);
    expect(state.subs.size).toBe(0);
  });

  it('a failed activation records nothing and can be retried', async () => {
    mockOrder(paidOrder('monthly', 4900));
    state.failRpc = true;
    let res = mkRes();
    await verify(body() as any, res);
    expect(res.code).toBe(500);
    expect(state.payments.size).toBe(0);
    state.failRpc = false;
    res = mkRes();
    await verify(body() as any, res);
    expect(res.code).toBe(200);
    expect(days(state.subs.get('u1').pro_until)).toBe(30);
  });

  it('requires sign-in', async () => {
    state.user = null;
    const res = mkRes();
    await verify(body() as any, res);
    expect(res.code).toBe(401);
  });
});

describe('create-order', () => {
  it('uses the server price, ignoring any client amount', async () => {
    mockOrder({ id: 'order_9', amount: 4900, currency: 'INR' });
    const res = mkRes();
    await createOrder({ method: 'POST', headers: {}, body: { plan: 'monthly', amount: 1 } } as any, res);
    const sent = JSON.parse(((globalThis as any).fetch as any).mock.calls[0][1].body);
    expect(sent.amount).toBe(4900);
    expect(sent.notes).toEqual({ user_id: 'u1', plan: 'monthly' });
    expect(res.body.orderId).toBe('order_9');
  });

  it('rejects an unknown plan', async () => {
    const res = mkRes();
    await createOrder({ method: 'POST', headers: {}, body: { plan: 'free-forever' } } as any, res);
    expect(res.code).toBe(400);
  });
});

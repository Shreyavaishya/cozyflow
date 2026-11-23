// Simulates a Razorpay "order.paid" webhook against your LOCAL server, no Razorpay needed.
//
//   node scripts/test-webhook.mjs <USER_UUID> [baseUrl]
//
// USER_UUID: Supabase > Authentication > Users > the "User UID" of the account that should get Pro.
// Needs RAZORPAY_WEBHOOK_SECRET in .env.local or .env, and `npx vercel dev` running (default http://localhost:3000).
import crypto from 'node:crypto';
import fs from 'node:fs';

const loadEnv = (file) => {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
};

const main = async () => {
  loadEnv('.env.local');
  loadEnv('.env');

  const [userId, base = 'http://localhost:3000'] = process.argv.slice(2);
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    console.error('Usage: node scripts/test-webhook.mjs <USER_UUID> [baseUrl]\nUSER_UUID looks like 3f2b8c1e-....-....-....-............');
    return 1;
  }
  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is missing. Add it to .env.local or .env (any long random string), restart `npx vercel dev`, and try again.');
    return 1;
  }

  const orderId = `order_TEST_${Date.now()}`;
  const body = JSON.stringify({
    event: 'order.paid',
    payload: {
      order: { entity: { id: orderId, amount_paid: 4900, notes: { user_id: userId, plan: 'monthly' } } },
      payment: { entity: { id: `pay_TEST_${Date.now()}` } },
    },
  });
  const sign = (b, s = secret) => crypto.createHmac('sha256', s).update(b).digest('hex');

  const call = async (label, payload, signature, expect) => {
    let res;
    try {
      res = await fetch(`${base}/api/razorpay-webhook`, { method: 'POST', body: payload, headers: { 'x-razorpay-signature': signature } });
    } catch (e) {
      console.error(`Could not reach ${base}. Is \`npx vercel dev\` running?`, e.message);
      return null;
    }
    const text = await res.text();
    const ok = expect(res.status, text);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ->  ${res.status} ${text}`);
    return ok;
  };

  const checks = [
    ['valid signature (expect applied)', body, sign(body), (s, t) => s === 200 && t.includes('"applied"')],
    ['same event again (expect already, no double grant)', body, sign(body), (s, t) => s === 200 && t.includes('"already"')],
    ['wrong signature (expect 400)', body, sign(body, 'wrong-secret'), (s) => s === 400],
    ['body tampered after signing (expect 400)', body.replace('monthly', 'lifetime'), sign(body), (s) => s === 400],
  ];

  const results = [];
  for (const [label, payload, signature, expect] of checks) {
    const r = await call(label, payload, signature, expect);
    if (r === null) return 1; // server unreachable: stop early
    results.push(r);
  }

  const allOk = results.every(Boolean);
  console.log(allOk ? '\nAll 4 checks passed.' : '\nSome checks failed. See the lines above.');
  console.log(`\nCleanup (Supabase SQL Editor):\n  delete from payments where order_id = '${orderId}';\n  delete from subscriptions where user_id = '${userId}';   -- only if you did not have real Pro before`);
  return allOk ? 0 : 1;
};

// Set the exit code instead of calling process.exit(): on Windows, exiting while a network
// connection is still closing can crash Node with "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)".
process.exitCode = await main();
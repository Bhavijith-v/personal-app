// Reminder notifications for Deposit Box (Web Push, no payload).
//
// The app works out *when* something is due - an exam, a journey, a renewal
// - and sends this worker only those times plus the phone's push address.
// Nothing about what is due ever leaves the phone. Every 15 minutes a cron
// run sends an empty push for each time that has arrived; the app's service
// worker turns it into "Something is due. Open the box to see what."
//
// Pushes carry no payload, so no message encryption is needed: only the
// VAPID signature (ES256) that push services require.

const TTL_DAYS = 400;
const MAX_TIMES = 150;
// Only real browser push services, so the worker can't be pointed at other sites.
const PUSH_HOSTS = [/\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];

const enc = new TextEncoder();
function b64url(bytes) {
  let s = '';
  new Uint8Array(bytes).forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function sha(text) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40);
}

export function endpointOk(endpoint, env) {
  if (typeof endpoint !== 'string' || endpoint.length > 1200) return false;
  if (env.DEV_PUSH_ALLOW && endpoint.startsWith(env.DEV_PUSH_ALLOW)) return true;   // local testing only (.dev.vars)
  let u;
  try { u = new URL(endpoint); } catch { return false; }
  return u.protocol === 'https:' && PUSH_HOSTS.some((re) => re.test(u.hostname));
}

async function vapidJwt(aud, env) {
  const key = await crypto.subtle.importKey('jwk', JSON.parse(env.VAPID_PRIVATE), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64url(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body));
  return head + '.' + body + '.' + b64url(sig);
}

export async function sendPush(endpoint, env) {
  const jwt = await vapidJwt(new URL(endpoint).origin, env);
  return fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC}`, TTL: '14400', Urgency: 'high', 'Content-Length': '0' }
  });
}

function cleanTimes(list) {
  const now = Date.now(), max = now + TTL_DAYS * 86400000;
  const out = [...new Set((Array.isArray(list) ? list : [])
    .map((t) => Math.round(Number(t) / 60000) * 60000)
    .filter((t) => Number.isFinite(t) && t > now - 3600000 && t < max))].sort((a, b) => a - b);
  return out.slice(0, MAX_TIMES);
}

// POST /push/subscribe {endpoint, times}, /push/unsubscribe {endpoint}, /push/test {endpoint}
export async function handlePush(path, body, env) {
  if (!env.PUSH || !env.VAPID_PRIVATE || !env.VAPID_PUBLIC) return [500, { error: 'Notifications are not set up on the server.' }];
  const endpoint = body && body.endpoint;
  if (!endpointOk(endpoint, env)) return [400, { error: 'That is not a push address.' }];
  const key = 'sub:' + await sha(endpoint);
  if (path === '/push/subscribe') {
    const times = cleanTimes(body.times);
    await env.PUSH.put(key, JSON.stringify({ endpoint, times }), { expirationTtl: TTL_DAYS * 86400 });
    return [200, { ok: true, scheduled: times.length, next: times[0] || null }];
  }
  if (path === '/push/unsubscribe') {
    await env.PUSH.delete(key);
    return [200, { ok: true }];
  }
  if (path === '/push/test') {
    const res = await sendPush(endpoint, env);
    if (res.status === 404 || res.status === 410) await env.PUSH.delete(key);
    return [res.ok ? 200 : 502, { ok: res.ok, status: res.status }];
  }
  return [404, { error: 'Unknown push request.' }];
}

// Cron: send one push per subscription whose next time has come.
export async function runPushes(env) {
  if (!env.PUSH) return { sent: 0 };
  const now = Date.now();
  let cursor, sent = 0;
  do {
    const page = await env.PUSH.list({ prefix: 'sub:', cursor });
    for (const k of page.keys) {
      const raw = await env.PUSH.get(k.name);
      if (!raw) continue;
      let rec;
      try { rec = JSON.parse(raw); } catch { await env.PUSH.delete(k.name); continue; }
      const due = rec.times.filter((t) => t <= now);
      if (!due.length) continue;
      // Several times that came due together make one notification, not a burst.
      const res = await sendPush(rec.endpoint, env).catch(() => null);
      if (res && (res.status === 404 || res.status === 410)) { await env.PUSH.delete(k.name); continue; }
      if (res && res.ok) sent++;
      rec.times = rec.times.filter((t) => t > now);
      await env.PUSH.put(k.name, JSON.stringify(rec), { expirationTtl: TTL_DAYS * 86400 });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return { sent };
}

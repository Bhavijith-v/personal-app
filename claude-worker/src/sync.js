// Sync between the user's own devices (iPhone and laptop).
//
// The app sends its box already encrypted with a key that never leaves the
// devices, so this only ever holds unreadable text. It keeps the newest copy
// and a revision number: a device must say which revision its change is
// based on, so two devices can't overwrite each other's changes unseen.
// One Durable Object per sync id gives each box strictly ordered reads and
// writes, which a plain KV store can't promise.

import { DurableObject } from 'cloudflare:workers';

const ID = /^[0-9a-f]{32}$/;
const KEY = /^[A-Za-z0-9_-]{43}$/;
const MAX_BLOB = 24 * 1024 * 1024;   // characters of encrypted text (RPC carries up to 32 MiB)
const CHUNK = 1000000;               // stored values are capped at 2 MB each

async function sha(s) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class SyncBox extends DurableObject {
  async run(op, key, body) {
    const st = this.ctx.storage;
    const meta = await st.get('meta');
    const kh = await sha(key);
    if (meta && meta.kh !== kh) return [403, { error: 'Wrong sync code.' }];
    const rev = meta ? meta.rev : 0;
    const blob = async () => {
      if (!meta) return '';
      const keys = Array.from({ length: meta.n }, (_, i) => 'c' + i);
      const got = await st.get(keys);
      return keys.map((k) => got.get(k) || '').join('');
    };

    if (op === 'get') {
      if (!meta || body.have === rev) return [200, { rev, same: true }];
      return [200, { rev, blob: await blob() }];
    }
    if (op === 'put') {
      if (body.base !== rev) return [409, { rev, blob: await blob() }];
      const b = body.blob, n = Math.ceil(b.length / CHUNK), put = {};
      for (let i = 0; i < n; i++) put['c' + i] = b.slice(i * CHUNK, (i + 1) * CHUNK);
      put.meta = { kh, rev: rev + 1, n, at: Date.now() };
      await st.put(put);   // one transaction: chunks and revision together
      if (meta && meta.n > n) await st.delete(Array.from({ length: meta.n - n }, (_, i) => 'c' + (n + i)));
      return [200, { rev: rev + 1 }];
    }
    if (op === 'drop') {
      await st.deleteAll();
      return [200, { ok: true }];
    }
    return [404, { error: 'Unknown sync request.' }];
  }
}

export async function handleSync(path, body, env) {
  if (!env.SYNC) return [500, { error: 'Sync is not set up on this server.' }];
  const op = path.slice('/sync/'.length);
  if (!['get', 'put', 'drop'].includes(op)) return [404, { error: 'Unknown sync request.' }];
  if (!body || !ID.test(body.id) || !KEY.test(body.key)) return [400, { error: 'Bad sync id or key.' }];
  if (op === 'get' && !Number.isInteger(body.have)) return [400, { error: 'Bad revision.' }];
  if (op === 'put') {
    if (!Number.isInteger(body.base) || body.base < 0) return [400, { error: 'Bad revision.' }];
    if (typeof body.blob !== 'string' || !body.blob || !/^[A-Za-z0-9+/=.]+$/.test(body.blob)) return [400, { error: 'Bad box.' }];
    if (body.blob.length > MAX_BLOB) return [413, { error: 'The box is too big to sync. Remove some photos.' }];
  }
  const stub = env.SYNC.get(env.SYNC.idFromName(body.id));
  const clean = op === 'get' ? { have: body.have } : op === 'put' ? { base: body.base, blob: body.blob } : {};
  return stub.run(op, body.key, clean);
}

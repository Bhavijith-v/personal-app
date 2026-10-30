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
const FID = /^f[0-9a-f]{16}$/;
const KEY = /^[A-Za-z0-9_-]{43}$/;
const MAX_BLOB = 24 * 1024 * 1024;   // characters of encrypted text (RPC carries up to 32 MiB)
const CHUNK = 1000000;
const MAX_FILE = 15 * 1024 * 1024;   // a 10 MB file, encrypted and in base64               // stored values are capped at 2 MB each

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
    // Attached files travel on their own, so a small edit never re-sends them.
    if (op === 'fput' || op === 'fget' || op === 'fdrop') {
      if (!meta) return [409, { error: 'Sync this box first.' }];
      const fm = await st.get('fm:' + body.fid);
      const fkeys = (n) => Array.from({ length: n }, (_, i) => 'fc:' + body.fid + ':' + i);
      if (op === 'fget') {
        if (!fm) return [404, { error: 'No such file.' }];
        const got = await st.get(fkeys(fm.n));
        return [200, { blob: fkeys(fm.n).map((k) => got.get(k) || '').join('') }];
      }
      if (fm) await st.delete(fkeys(fm.n).concat('fm:' + body.fid));
      if (op === 'fdrop') return [200, { ok: true }];
      const b = body.blob, n = Math.ceil(b.length / CHUNK), put = {};
      for (let i = 0; i < n; i++) put['fc:' + body.fid + ':' + i] = b.slice(i * CHUNK, (i + 1) * CHUNK);
      put['fm:' + body.fid] = { n, at: Date.now() };
      await st.put(put);
      return [200, { ok: true }];
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
  if (!['get', 'put', 'drop', 'fput', 'fget', 'fdrop'].includes(op)) return [404, { error: 'Unknown sync request.' }];
  if (!body || !ID.test(body.id) || !KEY.test(body.key)) return [400, { error: 'Bad sync id or key.' }];
  if (op === 'get' && !Number.isInteger(body.have)) return [400, { error: 'Bad revision.' }];
  if (op === 'put') {
    if (!Number.isInteger(body.base) || body.base < 0) return [400, { error: 'Bad revision.' }];
    if (typeof body.blob !== 'string' || !body.blob || !/^[A-Za-z0-9+/=.]+$/.test(body.blob)) return [400, { error: 'Bad box.' }];
    if (body.blob.length > MAX_BLOB) return [413, { error: 'The box is too big to sync. Remove some photos.' }];
  }
  if (op[0] === 'f') {
    if (!FID.test(body.fid)) return [400, { error: 'Bad file id.' }];
    if (op === 'fput' && (typeof body.blob !== 'string' || !body.blob || body.blob.length > MAX_FILE || !/^[A-Za-z0-9+/=.]+$/.test(body.blob))) return [413, { error: 'That file is too big to sync.' }];
  }
  const stub = env.SYNC.get(env.SYNC.idFromName(body.id));
  const clean = op === 'get' ? { have: body.have } : op === 'put' ? { base: body.base, blob: body.blob }
    : op === 'fput' ? { fid: body.fid, blob: body.blob } : op[0] === 'f' ? { fid: body.fid } : {};
  const out = await stub.run(op, body.key, clean);
  // For troubleshooting: which box (first 4 hex of the id), revisions and size. Nothing readable.
  console.log('sync', op, body.id.slice(0, 4), 'have', body.have ?? body.base ?? body.fid, '->', out[0], out[1].rev, out[1].same ? 'same' : (out[1].blob || body.blob || '').length);
  return out;
}

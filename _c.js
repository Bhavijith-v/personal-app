
(function () {
  'use strict';

  /* ============ constants ============ */
  var STORE = 'depositbox.v1';
  var IDLE_MS = 3 * 60 * 1000;   // lock after 3 min untouched
  var SHEET_GRACE_MS = 30 * 1000; // only while a share sheet / file picker is up
  var REVEAL_MS = 20 * 1000;     // re-mask a revealed value
  var CLIP_MS = 45 * 1000;       // wipe the clipboard

  var enc = new TextEncoder();
  var dec = new TextDecoder();
  function $(sel, root) { return (root || document).querySelector(sel); }

  /* ============ field schema ============ */
  var ICON = {
    login: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.4 3.4 8.5s-1.2 6.2-3.4 8.5c-2.2-2.3-3.4-5.4-3.4-8.5S9.8 5.8 12 3.5Z"/></svg>',
    bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5 12 4.5l8.5 5"/><path d="M5.5 9.5v9M18.5 9.5v9M9.5 12.5v6M14.5 12.5v6M3 18.5h18"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5.5" width="19" height="13" rx="2.2"/><path d="M2.5 10h19M6 14.5h3.5"/></svg>',
    race: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8.6 2.8 11 8.4M15.4 2.8 13 8.4"/><circle cx="12" cy="15" r="6"/><path d="m12 11.9 1 2.1 2.3.3-1.65 1.6.4 2.3-2.05-1.1-2.05 1.1.4-2.3L8.7 14.3l2.3-.3Z"/></svg>'
  };

  // Standard distances, in km, so pace can be worked out from a finish time.
  var DISTANCES = {
    '5K': 5,
    '10K': 10,
    'Half marathon (21.1K)': 21.0975,
    'Marathon (42.2K)': 42.195
  };

  var TYPES = {
    login: {
      name: 'Login', titleLabel: 'Name', titlePh: 'HDFC NetBanking',
      fields: [
        { k: 'site', l: 'Website or app', ph: 'netbanking.hdfcbank.com' },
        { k: 'username', l: 'Username or email' },
        { k: 'password', l: 'Password', secret: true, gen: true },
        { k: 'recovery', l: '2FA backup codes', secret: true, area: true }
      ]
    },
    bank: {
      name: 'Bank account', titleLabel: 'Name', titlePh: 'HDFC Savings — main',
      fields: [
        { k: 'bank', l: 'Bank' },
        { k: 'acno', l: 'Account number', secret: true, mono: true, num: true, tail: true },
        { k: 'ifsc', l: 'IFSC code', mono: true, upper: true, ph: 'HDFC0001234' },
        { k: 'actype', l: 'Account type', opts: ['Savings', 'Current', 'Salary', 'NRE', 'NRO', 'Fixed deposit'] },
        { k: 'custid', l: 'Customer ID', mono: true },
        { k: 'nbuser', l: 'Netbanking user ID' },
        { k: 'nbpass', l: 'Netbanking password', secret: true, gen: true },
        { k: 'txnpass', l: 'Transaction / profile password', secret: true },
        { k: 'upi', l: 'UPI ID', ph: 'name@okhdfcbank' },
        { k: 'upipin', l: 'UPI PIN', secret: true, mono: true, num: true }
      ]
    },
    card: {
      name: 'Card', titleLabel: 'Name', titlePh: 'ICICI Amazon Pay',
      fields: [
        { k: 'holder', l: 'Name on card' },
        { k: 'number', l: 'Card number', secret: true, mono: true, num: true, card: true, tail: true },
        { k: 'expiry', l: 'Valid thru', mono: true, ph: '09/29' },
        { k: 'cvv', l: 'CVV', secret: true, mono: true, num: true },
        { k: 'pin', l: 'ATM / card PIN', secret: true, mono: true, num: true },
        { k: 'bank', l: 'Issuing bank' }
      ]
    },
    race: {
      name: 'Race', titleLabel: 'Event', titlePh: 'THE WEEK Half Marathon 2026',
      fields: [
        { k: 'date', l: 'Race day', date: true },
        { k: 'distance', l: 'Distance', opts: ['5K', '10K', 'Half marathon (21.1K)', 'Marathon (42.2K)', 'Other'] },
        { k: 'time', l: 'Finish time', mono: true, ph: '2:14:36', time: true },
        { k: 'bib', l: 'Bib number', mono: true },
        { k: 'place', l: 'Finishing position', mono: true, ph: '142 of 280' },
        { k: 'venue', l: 'Where', ph: 'Willingdon Island, Kochi' },
        { k: 'organiser', l: 'Organised by', ph: 'THE WEEK' }
      ]
    }
  };
  var ORDER = ['login', 'bank', 'card', 'race'];

  /* ============ helpers ============ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function b64(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function ub64(str) {
    var s = atob(str), b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function paint() {
    return new Promise(function (r) {
      requestAnimationFrame(function () { requestAnimationFrame(r); });
    });
  }
  function randInt(n) {
    var limit = Math.floor(4294967296 / n) * n, a = new Uint32Array(1);
    do { crypto.getRandomValues(a); } while (a[0] >= limit);
    return a[0] % n;
  }
  function uid() {
    var a = new Uint8Array(8); crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }

  /* ============ storage ============ */
  var storageOK = true;
  try {
    localStorage.setItem('depositbox.probe', '1');
    localStorage.removeItem('depositbox.probe');
  } catch (e) { storageOK = false; }

  function readRec() {
    try { var r = localStorage.getItem(STORE); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function writeRec(rec) {
    try { localStorage.setItem(STORE, JSON.stringify(rec)); return true; } catch (e) { return false; }
  }

  /* ============ crypto ============ */
  // Argon2id is memory-hard: an attacker with a stolen backup file needs 64 MiB
  // of RAM per guess, which is what blunts GPU cracking. PBKDF2 does not.
  var ARGON = { m: 65536, t: 3, p: 1 };   // 64 MiB, 3 passes, 1 lane

  function newKdf() {
    return {
      name: 'argon2id',
      m: ARGON.m, t: ARGON.t, p: ARGON.p,
      salt: b64(crypto.getRandomValues(new Uint8Array(32)))
    };
  }

  function importAes(raw) {
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  // Every vault and every backup carries the parameters it was made with, so
  // older PBKDF2 boxes and old backup files keep opening after the upgrade.
  function deriveFromKdf(pass, kdf) {
    var norm = pass.normalize('NFKC');
    var salt = ub64(kdf.salt);

    if (kdf.name === 'argon2id') {
      var lib = window.hashwasm;
      if (!lib || !lib.argon2id) return Promise.reject(new Error('argon2-missing'));
      return lib.argon2id({
        password: norm,
        salt: salt,
        parallelism: kdf.p,
        iterations: kdf.t,
        memorySize: kdf.m,
        hashLength: 32,
        outputType: 'binary'
      }).then(importAes);
    }

    return crypto.subtle
      .importKey('raw', enc.encode(norm), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: kdf.iter, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
      });
  }

  /* --- master key wrapping ---
     The vault is sealed with a random master key. That key is then wrapped
     once per unlock method: by the passphrase (always) and, optionally, by a
     secret Face ID hands back. Adding or removing Face ID re-wraps the key and
     never touches the vault itself, so no unlock method can lock you out of
     another one. */
  function wrapKey(raw, kek) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, kek, raw)
      .then(function (ct) { return { iv: b64(iv), ct: b64(ct) }; });
  }
  function unwrapKey(wrap, kek) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(wrap.iv) }, kek, ub64(wrap.ct))
      .then(function (buf) { return new Uint8Array(buf); });
  }
  function useMasterKey(raw) {
    S.mk = raw;
    return importAes(raw).then(function (k) { S.key = k; return k; });
  }
  function passKdfOf(rec) {
    return rec.v === 2 ? rec.wraps.pass.kdf : rec.kdf;
  }
  function normalizeData(d) {
    return d && d.entries ? d : { v: 1, entries: [] };
  }

  // Moves any older record onto the v2 wrapped-key layout. Atomic: nothing is
  // written until the new ciphertext exists, and in-memory state only moves
  // after the write succeeds.
  function migrateToV2(pass) {
    var kdf = newKdf();
    return deriveFromKdf(pass, kdf).then(function (kek) {
      var raw = crypto.getRandomValues(new Uint8Array(32));
      return wrapKey(raw, kek).then(function (w) {
        return importAes(raw).then(function (k) {
          return seal(S.data, k).then(function (sealed) {
            var rec = {
              v: 2,
              wraps: { pass: { kdf: kdf, iv: w.iv, ct: w.ct } },
              iv: sealed.iv, ct: sealed.ct
            };
            if (!writeRec(rec)) return false;
            S.mk = raw; S.key = k; S.rec = rec;
            return true;
          });
        });
      });
    });
  }

  /* --- Face ID, via a passkey's PRF secret ---
     WebAuthn's PRF extension hands the page a stable 32-byte secret after a
     successful Face ID check. That secret never leaves the device and is not
     the passkey's signing key. We stretch it with HKDF and use the result to
     wrap the master key. Safari only returns PRF values from get(), not
     create(), so enrolment does both. */
  function faceSupported() {
    return !!(window.PublicKeyCredential && navigator.credentials &&
      navigator.credentials.create && navigator.credentials.get);
  }

  function prfKek(secret) {
    return crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          {
            name: 'HKDF', hash: 'SHA-256',
            salt: new Uint8Array(0),
            info: enc.encode('deposit-box/face-wrap/v1')
          },
          base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
      });
  }

  function faceEvaluate(credId, prfSalt) {
    return navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: credId }],
        userVerification: 'required',
        timeout: 60000,
        extensions: { prf: { eval: { first: prfSalt } } }
      }
    }).then(function (assertion) {
      var ext = assertion && assertion.getClientExtensionResults();
      var out = ext && ext.prf && ext.prf.results && ext.prf.results.first;
      if (!out) throw new Error('prf-missing');
      return new Uint8Array(out);
    });
  }

  function faceEnroll() {
    if (!S.mk) return Promise.reject(new Error('locked'));
    var prfSalt = crypto.getRandomValues(new Uint8Array(32));
    guardSheet();
    return navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Deposit Box' },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'Deposit Box',
          displayName: 'Deposit Box'
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'required',
          userVerification: 'required'
        },
        timeout: 60000,
        attestation: 'none',
        extensions: { prf: {} }
      }
    }).then(function (cred) {
      var ext = cred && cred.getClientExtensionResults();
      if (!ext || !ext.prf || ext.prf.enabled === false) throw new Error('prf-unsupported');
      var credId = new Uint8Array(cred.rawId);
      guardSheet();
      return faceEvaluate(credId, prfSalt).then(function (secret) {
        return prfKek(secret).then(function (kek) {
          return wrapKey(S.mk, kek).then(function (w) {
            S.rec.wraps.face = {
              credId: b64(credId), prfSalt: b64(prfSalt), iv: w.iv, ct: w.ct
            };
            return persist();
          });
        });
      });
    });
  }
  function seal(data, key) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle
      .encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(JSON.stringify(data)))
      .then(function (ct) { return { iv: b64(iv), ct: b64(ct) }; });
  }
  function unseal(rec, key) {
    return crypto.subtle
      .decrypt({ name: 'AES-GCM', iv: ub64(rec.iv) }, key, ub64(rec.ct))
      .then(function (pt) { return JSON.parse(dec.decode(pt)); });
  }

  /* ============ state ============ */
  var S = { key: null, mk: null, rec: null, data: null, view: 'lock', id: null, filter: 'all', draft: null, isNew: false };
  var attempts = 0, idleTimer = null, hideTimer = null, clipTimer = null, toastTimer = null;
  var sheetOpen = false, sheetTimer = null;

  function persist() {
    return seal(S.data, S.key).then(function (sealed) {
      // Keep whatever scheme this vault was built with, PBKDF2 or Argon2id.
      // Carry the wraps across untouched; only the vault ciphertext changes.
      var rec = { v: 2, wraps: S.rec.wraps, iv: sealed.iv, ct: sealed.ct };
      if (!writeRec(rec)) { toast('Could not save — device storage is full or blocked'); return false; }
      S.rec = rec;
      return true;
    });
  }

  /* ============ chrome ============ */
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  var SCREENS = {
    lock: '#screen-lock', vault: '#screen-vault', detail: '#screen-detail',
    edit: '#screen-edit', backup: '#screen-backup'
  };
  function show(view) {
    S.view = view;
    Object.keys(SCREENS).forEach(function (k) { $(SCREENS[k]).hidden = k !== view; });
    window.scrollTo(0, 0);
    if (view === 'vault') renderVault();
    if (view === 'detail') renderDetail();
    if (view === 'edit') renderEdit();
    if (view === 'backup') renderBackup();
    if (view !== 'lock') armIdle();
  }

  /* ============ auto-lock ============ */
  function armIdle() {
    clearTimeout(idleTimer);
    if (!S.key) return;
    idleTimer = setTimeout(function () { lockNow('Locked after 3 minutes idle'); }, IDLE_MS);
  }
  function lockNow(msg) {
    if (S.mk) { try { S.mk.fill(0); } catch (e) {} }   // wipe the master key
    S.mk = null;
    S.key = null; S.data = null; S.id = null; S.draft = null; S.isNew = false; S.filter = 'all';
    clearTimeout(idleTimer); clearTimeout(hideTimer);
    $('#detail-body').textContent = '';
    $('#edit-body').textContent = '';
    $('#list').textContent = '';
    $('#confirm').hidden = true;
    $('#bk-import-panel').hidden = true;
    $('#bk-dump-wrap').hidden = true;
    $('#bk-dump').value = '';
    pendingBackup = null;
    lockMode = 'unlock';
    S.rec = readRec();
    show('lock');
    renderLock();
    if (msg) toast(msg);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () { if (S.key) armIdle(); }, { passive: true });
  });
  // Opening the share sheet or the file picker also hides the page, so those
  // two moments get a short grace period instead of an instant lock.
  function guardSheet() {
    sheetOpen = true;
    clearTimeout(sheetTimer);
    sheetTimer = setTimeout(function () { sheetOpen = false; }, 120000);
  }

  document.addEventListener('visibilitychange', function () {
    if (!S.key) return;
    if (document.visibilityState === 'hidden') {
      if (sheetOpen) {
        hideTimer = setTimeout(function () { lockNow(null); }, SHEET_GRACE_MS);
      } else {
        lockNow(null);
      }
    } else {
      sheetOpen = false;
      clearTimeout(sheetTimer);
      clearTimeout(hideTimer);
      armIdle();
    }
  });

  /* ============ clipboard ============ */
  function copyValue(text, what, btn) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      toast('This browser will not allow copying'); return;
    }
    navigator.clipboard.writeText(text).then(function () {
      toast(what + ' copied — clipboard clears in 45 seconds');
      if (btn) {
        btn.classList.add('done');
        setTimeout(function () { btn.classList.remove('done'); }, 1400);
      }
      clearTimeout(clipTimer);
      clipTimer = setTimeout(function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(function () {});
        }
      }, CLIP_MS);
    }).catch(function () { toast('Could not reach the clipboard'); });
  }

  /* ============ formatting ============ */
  function digits(v) { return String(v || '').replace(/\D/g, ''); }
  function network(num) {
    var n = digits(num);
    if (/^4/.test(n)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'Amex';
    if (/^(60|65|81|82|508)/.test(n)) return 'RuPay';
    if (/^(36|38|30[0-5])/.test(n)) return 'Diners Club';
    return '';
  }
  function groupCard(v) {
    var n = digits(v);
    if (!n) return '';
    if (/^3[47]/.test(n)) {
      return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ');
    }
    return (n.match(/.{1,4}/g) || []).join(' ');
  }
  function maskOf(v, f) {
    var s = String(v || '');
    if (!s) return '';
    if (f.tail) {
      var n = f.card ? digits(s) : s;
      if (n.length > 4) {
        var hid = f.card ? '•••• •••• •••• ' : '•••• ';
        return hid + n.slice(-4);
      }
      return '••••';
    }
    return new Array(Math.min(Math.max(s.length, 6), 14) + 1).join('•');
  }
  function shownValue(v, f) {
    if (f.card) return groupCard(v);
    return String(v || '');
  }
  /* --- race maths --- */
  // Accepts h:mm:ss or mm:ss and returns whole seconds, or null.
  function parseTime(v) {
    var m = String(v || '').trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    var h = m[1] ? parseInt(m[1], 10) : 0;
    var mi = parseInt(m[2], 10);
    var s = parseInt(m[3], 10);
    if (mi > 59 || s > 59) return null;
    return h * 3600 + mi * 60 + s;
  }
  function paceOf(e) {
    var f = e.f || {};
    var secs = parseTime(f.time);
    var km = DISTANCES[f.distance];
    if (!secs || !km) return null;
    var per = secs / km;
    var m = Math.floor(per / 60);
    var s = Math.round(per - m * 60);
    if (s === 60) { m += 1; s = 0; }
    return {
      pace: m + ':' + (s < 10 ? '0' : '') + s,
      speed: (km / (secs / 3600)).toFixed(1),
      km: km
    };
  }
  function fmtDate(ymd) {
    var m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return String(ymd || '');
    try {
      return new Date(+m[1], +m[2] - 1, +m[3])
        .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (err) { return ymd; }
  }

  function stampOf(ts) {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return new Date(ts).toISOString().slice(0, 16).replace('T', ' '); }
  }

  /* ============ lock screen ============ */
  var lockMode = 'setup';   // 'setup' | 'unlock' | 'restore'
  var pendingBackup = null; // a parsed backup waiting for its passphrase

  function renderLock() {
    if (lockMode !== 'restore') lockMode = S.rec ? 'unlock' : 'setup';
    var mode = lockMode;

    $('#setup-fields').hidden = mode !== 'setup';
    $('#unlock-fields').hidden = mode !== 'unlock';
    $('#restore-fields').hidden = mode !== 'restore';
    $('#setup-notice').hidden = mode !== 'setup';
    $('#storage-notice').hidden = storageOK;
    $('#btn-restore-start').hidden = mode === 'restore';
    $('#btn-restore-cancel').hidden = mode !== 'restore';
    $('#btn-face-unlock').hidden = !(mode === 'unlock' && S.rec &&
      S.rec.wraps && S.rec.wraps.face && faceSupported());

    if (mode === 'setup') {
      $('#lock-title').textContent = 'Set up your box';
      $('#lock-sub').textContent = 'Everything you store is encrypted on this phone with the passphrase you pick. Nothing is sent anywhere.';
      $('#lock-action').textContent = 'Create the box';
    } else if (mode === 'unlock') {
      $('#lock-title').textContent = 'Deposit Box';
      $('#lock-sub').textContent = 'Enter your passphrase to open the box.';
      $('#lock-action').textContent = 'Unlock';
    } else {
      $('#lock-title').textContent = 'Restore a backup';
      $('#lock-sub').textContent = 'Put a saved box back on this phone.';
      $('#lock-action').textContent = 'Restore the box';
      $('#restore-found').innerHTML = pendingBackup ? describeBackup(pendingBackup) : '';
    }

    $('#lock-err').textContent = '';
    $('#pass-new').value = '';
    $('#pass-confirm').value = '';
    $('#pass-unlock').value = '';
    $('#pass-restore').value = '';
    paintMeter('');
    setTimeout(function () {
      var el = mode === 'setup' ? $('#pass-new') : mode === 'unlock' ? $('#pass-unlock') : $('#pass-restore');
      if (el) el.focus();
    }, 120);
  }

  function strength(p) {
    if (!p) return 0;
    var pool = 0;
    if (/[a-z]/.test(p)) pool += 26;
    if (/[A-Z]/.test(p)) pool += 26;
    if (/[0-9]/.test(p)) pool += 10;
    if (/[^A-Za-z0-9]/.test(p)) pool += 33;
    var bits = p.length * (pool ? Math.log(pool) / Math.log(2) : 0);
    var uniq = {}, n = 0, i;
    for (i = 0; i < p.length; i++) if (!uniq[p[i]]) { uniq[p[i]] = 1; n++; }
    if (n <= 4 && p.length > 6) bits *= 0.5;
    return bits;
  }
  function paintMeter(p) {
    var bits = strength(p);
    var level = bits >= 90 ? 4 : bits >= 70 ? 3 : bits >= 50 ? 2 : bits > 0 ? 1 : 0;
    var bars = $('#meter').children;
    for (var i = 0; i < bars.length; i++) {
      bars[i].className = i < level ? (level === 1 ? 'on weak' : 'on') : '';
    }
    var note = $('#meter-note');
    if (!p) note.textContent = 'At least 12 characters. Four unrelated words works well.';
    else if (p.length < 12) note.textContent = 'Too short — ' + p.length + ' of 12 characters.';
    else if (level <= 1) note.textContent = 'Weak. Add length or mix in other characters.';
    else if (level === 2) note.textContent = 'Fair. Longer would be better for bank details.';
    else if (level === 3) note.textContent = 'Good.';
    else note.textContent = 'Strong.';
  }
  $('#pass-new').addEventListener('input', function () { paintMeter(this.value); });

  function lockErr(msg) { $('#lock-err').textContent = msg; }
  function lockBusy(on, label) {
    var b = $('#lock-action');
    b.disabled = on;
    if (on) { b.dataset.was = b.textContent; b.textContent = label; }
    else if (b.dataset.was) { b.textContent = b.dataset.was; }
  }

  function doSetup() {
    var p1 = $('#pass-new').value, p2 = $('#pass-confirm').value;
    if (p1.length < 12) return lockErr('Use at least 12 characters.');
    if (p1 !== p2) return lockErr('The two passphrases do not match.');
    if (strength(p1) < 50) return lockErr('That is too easy to guess. Add length or mix in other characters.');
    if (!storageOK) return lockErr('This browser is blocking storage, so the vault cannot be saved.');
    lockErr('');
    lockBusy(true, 'Building the box…');
    paint().then(function () {
      var kdf = newKdf();
      return deriveFromKdf(p1, kdf).then(function (kek) {
        var raw = crypto.getRandomValues(new Uint8Array(32));
        return wrapKey(raw, kek).then(function (w) {
          return useMasterKey(raw).then(function () {
            S.data = { v: 1, entries: [] };
            S.rec = { v: 2, wraps: { pass: { kdf: kdf, iv: w.iv, ct: w.ct } }, iv: '', ct: '' };
            return persist();
          });
        });
      });
    }).then(function (ok) {
      lockBusy(false);
      if (!ok) { S.key = null; S.data = null; S.rec = null; return lockErr('Could not write to storage.'); }
      $('#pass-new').value = ''; $('#pass-confirm').value = '';
      show('vault');
    }).catch(function (err) {
      lockBusy(false);
      S.key = null; S.data = null; S.rec = null;
      lockErr(err && err.message === 'argon2-missing'
        ? 'The encryption engine did not load. Reload the page and try again.'
        : 'Something went wrong setting up. Try again.');
    });
  }

  function doUnlock() {
    var p = $('#pass-unlock').value;
    if (!p) return lockErr('Enter your passphrase.');
    lockErr('');
    lockBusy(true, 'Unlocking…');
    paint().then(function () {
      return attempts > 0 ? sleep(Math.min(attempts * 600, 5000)) : null;
    }).then(function () {
      return deriveFromKdf(p, passKdfOf(S.rec));
    }).then(function (kek) {
      if (S.rec.v === 2) {
        return unwrapKey(S.rec.wraps.pass, kek)
          .then(useMasterKey)
          .then(function () { return unseal(S.rec, S.key); })
          .then(function (data) { S.data = normalizeData(data); });
      }
      // Older single-key record: the derived key opens the vault directly.
      // Move it onto the wrapped-key layout before anything can be saved.
      return unseal(S.rec, kek).then(function (data) {
        S.data = normalizeData(data);
        return migrateToV2(p).then(function (ok) {
          if (!ok) throw new Error('migrate-failed');
        });
      });
    }).then(function () {
      attempts = 0;
      $('#pass-unlock').value = '';
      lockBusy(false);
      show('vault');
    }).catch(function (err) {
      lockBusy(false);
      S.key = null; S.mk = null; S.data = null;
      if (err && err.message === 'migrate-failed') {
        lockErr('Your passphrase was right, but the box could not be saved. Free up storage and try again.');
        return;
      }
      attempts++;
      lockErr(attempts >= 3 ? 'Wrong passphrase. (' + attempts + ' failed attempts)' : 'Wrong passphrase.');
    });
  }

  function doFaceUnlock() {
    var f = S.rec && S.rec.wraps && S.rec.wraps.face;
    if (!f) return;
    lockErr('');
    lockBusy(true, 'Waiting for Face ID…');
    faceEvaluate(ub64(f.credId), ub64(f.prfSalt))
      .then(prfKek)
      .then(function (kek) { return unwrapKey(f, kek); })
      .then(useMasterKey)
      .then(function () { return unseal(S.rec, S.key); })
      .then(function (data) {
        S.data = normalizeData(data);
        attempts = 0;
        lockBusy(false);
        show('vault');
      })
      .catch(function (err) {
        lockBusy(false);
        S.key = null; S.mk = null; S.data = null;
        var name = err && err.name;
        lockErr(name === 'NotAllowedError' || name === 'AbortError'
          ? 'Face ID was cancelled. You can still use your passphrase.'
          : 'Face ID did not work. Use your passphrase.');
      });
  }

  $('#lock-action').addEventListener('click', function () {
    if (lockMode === 'restore') doRestore();
    else if (lockMode === 'setup') doSetup();
    else doUnlock();
  });
  $('#pass-unlock').addEventListener('keydown', function (e) { if (e.key === 'Enter') doUnlock(); });
  $('#pass-restore').addEventListener('keydown', function (e) { if (e.key === 'Enter') doRestore(); });
  $('#btn-face-unlock').addEventListener('click', doFaceUnlock);
  $('#pass-confirm').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSetup(); });
  $('#pass-new').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#pass-confirm').focus(); });

  /* ============ vault list ============ */
  function entries() { return (S.data && S.data.entries) || []; }
  function counts() {
    var c = { all: 0, login: 0, bank: 0, card: 0, race: 0 };
    entries().forEach(function (e) { c.all++; if (c[e.type] != null) c[e.type]++; });
    return c;
  }
  function rowMeta(e) {
    var f = e.f || {};
    if (e.type === 'login') return f.username || f.site || '';
    if (e.type === 'bank') {
      var tail = f.acno ? '•••• ' + String(f.acno).slice(-4) : '';
      return [f.bank, tail].filter(Boolean).join('  ');
    }
    if (e.type === 'card') {
      var net = network(f.number);
      var t4 = digits(f.number) ? '•••• ' + digits(f.number).slice(-4) : '';
      return [net, t4].filter(Boolean).join('  ');
    }
    if (e.type === 'race') {
      return [f.time, f.distance, f.date ? fmtDate(f.date) : ''].filter(Boolean).join('  ·  ');
    }
    return '';
  }

  function renderVault() {
    var c = counts();
    var TAB_NAMES = { login: 'Logins', bank: 'Banks', card: 'Cards', race: 'Races' };
    var tabDefs = [{ k: 'all', n: 'Everything' }].concat(ORDER.map(function (k) {
      return { k: k, n: TAB_NAMES[k] };
    }));
    $('#tabs').innerHTML = tabDefs.map(function (t) {
      return '<button class="tab" role="tab" data-filter="' + t.k + '" aria-selected="' +
        (S.filter === t.k) + '">' + esc(t.n) + '<span class="n">' + c[t.k] + '</span></button>';
    }).join('');

    var list = entries().filter(function (e) { return S.filter === 'all' || e.type === S.filter; });
    list.sort(function (a, b) { return String(a.title || '').localeCompare(String(b.title || ''), 'en'); });

    var hasAny = c.all > 0;
    $('#empty').hidden = hasAny;
    $('#tabs').hidden = !hasAny;
    $('#backup-nudge').hidden = !(hasAny && !(S.data && S.data.lastExport));

    if (!hasAny) { $('#list').textContent = ''; return; }

    if (!list.length) {
      var NONE = { login: 'logins', bank: 'bank accounts', card: 'cards', race: 'races' };
      $('#list').innerHTML = '<div class="empty"><h2>Nothing here yet</h2><p>No ' +
        esc(NONE[S.filter] || 'entries') + ' stored so far.</p></div>';
      return;
    }

    $('#list').innerHTML = list.map(function (e) {
      return '<button class="row" data-id="' + esc(e.id) + '">' +
        '<span class="glyph" aria-hidden="true">' + ICON[e.type] + '</span>' +
        '<span class="row-text"><span class="row-title">' + esc(e.title || 'Untitled') + '</span>' +
        '<span class="row-meta">' + esc(rowMeta(e)) + '</span></span>' +
        '<span class="chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg></span>' +
        '</button>';
    }).join('');
  }

  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-filter]');
    if (!b) return;
    S.filter = b.dataset.filter;
    renderVault();
  });
  $('#list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-id]');
    if (!b) return;
    S.id = b.dataset.id;
    show('detail');
  });
  $('#btn-lock').addEventListener('click', function () { lockNow('Locked'); });
  $('#btn-add').addEventListener('click', function () {
    S.isNew = true;
    S.draft = { id: uid(), type: 'login', title: '', f: {}, notes: '', updated: Date.now() };
    show('edit');
  });

  /* ============ detail ============ */
  function findEntry(id) {
    var list = entries();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // The headline of a race is the finish time, with pace worked out from the
  // distance. Stats only appear once there is something real to show.
  function raceCard(e) {
    var f = e.f || {};
    var p = paceOf(e);
    var head = f.time
      ? '<span class="bib-time">' + esc(f.time) + '</span>'
      : '<span class="bib-time none">No finish time yet</span>';
    if (f.distance) head += '<span class="bib-dist">' + esc(f.distance) + '</span>';

    var stats = [];
    if (p) {
      stats.push(['Pace', p.pace + ' /km']);
      stats.push(['Speed', p.speed + ' km/h']);
    }
    if (f.date) stats.push(['Race day', fmtDate(f.date)]);
    if (!p && f.bib) stats.push(['Bib', f.bib]);

    return '<div class="bib"><div class="bib-top">' + head + '</div>' +
      (stats.length
        ? '<div class="bib-stats">' + stats.map(function (s) {
            return '<div class="bib-stat"><span class="label">' + esc(s[0]) +
              '</span><b>' + esc(s[1]) + '</b></div>';
          }).join('') + '</div>'
        : '') +
      '</div>';
  }

  function renderDetail() {
    var e = findEntry(S.id);
    if (!e) { show('vault'); return; }
    var t = TYPES[e.type];
    $('#detail-bar-title').textContent = e.title || 'Untitled';

    var html = '<div class="detail-head">' +
      '<span class="glyph" aria-hidden="true">' + ICON[e.type] + '</span>' +
      '<span><h2 class="detail-title">' + esc(e.title || 'Untitled') + '</h2>' +
      '<div class="detail-kind">' + esc(t.name) +
      (e.type === 'card' && network((e.f || {}).number) ? ' · ' + esc(network(e.f.number)) : '') +
      '</div></span></div>';

    if (e.type === 'race') html += raceCard(e);

    var rows = t.fields.filter(function (f) { return (e.f || {})[f.k]; }).map(function (f) {
      var raw = e.f[f.k];
      var visible = f.secret ? maskOf(raw, f) : shownValue(raw, f);
      var cls = 'val' + (f.mono || f.card ? '' : ' plain') + (f.secret ? ' masked' : '');
      var acts = '';
      if (f.secret) {
        acts += '<button class="mini" data-reveal="' + esc(f.k) + '" aria-label="Reveal ' + esc(f.l) + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
          'stroke-linejoin="round"><path d="M1.8 12S5.5 5.5 12 5.5 22.2 12 22.2 12 18.5 18.5 12 18.5 1.8 12 1.8 12Z"/>' +
          '<circle cx="12" cy="12" r="3"/></svg></button>';
      }
      acts += '<button class="mini" data-copy="' + esc(f.k) + '" aria-label="Copy ' + esc(f.l) + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
        'stroke-linejoin="round"><rect x="9" y="9" width="11.5" height="11.5" rx="2"/>' +
        '<path d="M6.5 15H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h8.5A1.5 1.5 0 0 1 15 5v1.5"/></svg></button>';

      return '<div class="frow"><span class="frow-text"><span class="label">' + esc(f.l) + '</span>' +
        '<span class="' + cls + '" data-field="' + esc(f.k) + '" data-masked="' + (f.secret ? '1' : '0') + '">' +
        esc(visible) + '</span></span><span class="frow-acts">' + acts + '</span></div>';
    }).join('');

    html += rows ? '<div class="card">' + rows + '</div>'
                 : '<div class="notice">No details filled in yet. Tap <b>Edit</b> to add them.</div>';

    if (e.notes) {
      html += '<div class="section-label">Notes</div><div class="card"><div class="frow">' +
        '<span class="frow-text"><span class="val note">' + esc(e.notes) + '</span></span></div></div>';
    }

    html += '<div class="stamp">Last changed ' + esc(stampOf(e.updated)) + '</div>' +
      '<div class="detail-foot"><button class="btn danger" id="btn-delete">Delete entry</button></div>';

    $('#detail-body').innerHTML = html;
  }

  $('#detail-body').addEventListener('click', function (ev) {
    var e = findEntry(S.id);
    if (!e) return;

    var rv = ev.target.closest('[data-reveal]');
    if (rv) {
      var k = rv.dataset.reveal;
      var f = fieldDef(e.type, k);
      var span = $('[data-field="' + k + '"]', $('#detail-body'));
      if (!span || !f) return;
      if (span.dataset.masked === '1') {
        span.textContent = shownValue(e.f[k], f);
        span.classList.remove('masked');
        span.dataset.masked = '0';
        setTimeout(function () {
          if (span.dataset.masked === '0' && S.key) {
            span.textContent = maskOf(e.f[k], f);
            span.classList.add('masked');
            span.dataset.masked = '1';
          }
        }, REVEAL_MS);
      } else {
        span.textContent = maskOf(e.f[k], f);
        span.classList.add('masked');
        span.dataset.masked = '1';
      }
      return;
    }

    var cp = ev.target.closest('[data-copy]');
    if (cp) {
      var ck = cp.dataset.copy;
      var cf = fieldDef(e.type, ck);
      if (!cf) return;
      var raw = e.f[ck];
      copyValue(cf.card ? digits(raw) : String(raw), cf.l, cp);
      return;
    }

    if (ev.target.closest('#btn-delete')) {
      askConfirm({
        title: 'Delete this entry?',
        body: '“' + (e.title || 'Untitled') + '” will be removed from the box. There is no backup, so this cannot be undone.',
        yes: 'Delete'
      }).then(function (ok) {
        if (!ok) return;
        S.data.entries = entries().filter(function (x) { return x.id !== e.id; });
        persist().then(function () {
          S.id = null;
          toast('Entry deleted');
          show('vault');
        });
      });
    }
  });

  function fieldDef(type, k) {
    var fs = TYPES[type].fields;
    for (var i = 0; i < fs.length; i++) if (fs[i].k === k) return fs[i];
    return null;
  }

  $('#btn-back').addEventListener('click', function () { show('vault'); });
  $('#btn-edit').addEventListener('click', function () {
    var e = findEntry(S.id);
    if (!e) return;
    S.isNew = false;
    S.draft = JSON.parse(JSON.stringify(e));
    show('edit');
  });

  /* ============ editor ============ */
  function renderEdit() {
    var d = S.draft;
    if (!d) { show('vault'); return; }
    var t = TYPES[d.type];
    $('#edit-bar-title').textContent = S.isNew ? 'New entry' : 'Edit entry';
    $('#edit-err').textContent = '';

    var html = '';
    if (S.isNew) {
      html += '<div class="kindpick">' + ORDER.map(function (k) {
        return '<button type="button" data-kind="' + k + '" aria-pressed="' + (d.type === k) + '">' +
          ICON[k] + '<span>' + esc(TYPES[k].name) + '</span></button>';
      }).join('') + '</div>';
    }

    html += '<div class="field"><label class="label" for="in-title">' + esc(t.titleLabel) + '</label>' +
      '<input class="input" id="in-title" type="text" value="' + esc(d.title) + '" placeholder="' +
      esc(t.titlePh) + '" autocapitalize="words" spellcheck="false"></div>';

    html += t.fields.map(function (f) {
      var val = (d.f || {})[f.k] || '';
      var id = 'in-' + f.k;
      var body;
      if (f.opts) {
        body = '<select class="input" id="' + id + '" data-key="' + esc(f.k) + '">' +
          '<option value="">—</option>' +
          f.opts.map(function (o) {
            return '<option value="' + esc(o) + '"' + (val === o ? ' selected' : '') + '>' + esc(o) + '</option>';
          }).join('') + '</select>';
      } else if (f.area) {
        body = '<textarea class="input' + (f.mono ? ' mono' : '') + '" id="' + id + '" data-key="' + esc(f.k) +
          '" autocapitalize="off" spellcheck="false">' + esc(val) + '</textarea>';
      } else {
        var attrs = ' autocomplete="off" autocapitalize="' + (f.upper ? 'characters' : 'off') + '" spellcheck="false"';
        if (f.num) attrs += ' inputmode="numeric"';
        var type = f.secret ? 'password' : f.date ? 'date' : 'text';
        body = '<div class="pw-wrap"><input class="input' + (f.mono ? ' mono' : '') + '" id="' + id +
          '" type="' + type + '" data-key="' + esc(f.k) + '" value="' + esc(val) + '" placeholder="' +
          esc(f.ph || '') + '"' + attrs + '>';
        if (f.secret) {
          body += '<button class="mini" type="button" data-peek="' + esc(f.k) + '" aria-label="Show ' + esc(f.l) + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
            'stroke-linejoin="round"><path d="M1.8 12S5.5 5.5 12 5.5 22.2 12 22.2 12 18.5 18.5 12 18.5 1.8 12 1.8 12Z"/>' +
            '<circle cx="12" cy="12" r="3"/></svg></button>';
        }
        if (f.gen) {
          body += '<button class="mini" type="button" data-gen="' + esc(f.k) + '" aria-label="Generate a password">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
            'stroke-linejoin="round"><path d="M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5"/><path d="M4 4.5v4h4"/>' +
            '<path d="M4 12.5a8 8 0 0 0 13.7 5.2L20 15.5"/><path d="M20 19.5v-4h-4"/></svg></button>';
        }
        body += '</div>';
      }
      return '<div class="field"><label class="label" for="' + id + '">' + esc(f.l) + '</label>' + body +
        '<div data-genpanel="' + esc(f.k) + '"></div></div>';
    }).join('');

    html += '<div class="field"><label class="label" for="in-notes">Notes</label>' +
      '<textarea class="input" id="in-notes" autocapitalize="sentences">' + esc(d.notes || '') + '</textarea></div>';

    $('#edit-body').innerHTML = html;
  }

  function collectDraft() {
    var d = S.draft;
    d.title = ($('#in-title') ? $('#in-title').value : '').trim();
    d.notes = ($('#in-notes') ? $('#in-notes').value : '').trim();
    d.f = d.f || {};
    TYPES[d.type].fields.forEach(function (f) {
      var el = $('[data-key="' + f.k + '"]', $('#edit-body'));
      if (!el) return;
      var v = el.value.trim();
      if (f.upper) v = v.toUpperCase();
      if (v) d.f[f.k] = v; else delete d.f[f.k];
    });
  }

  $('#edit-body').addEventListener('click', function (ev) {
    var kind = ev.target.closest('[data-kind]');
    if (kind) {
      collectDraft();
      S.draft.type = kind.dataset.kind;
      // Drop anything the new kind has no slot for, so a half-filled login
      // cannot ride along invisibly inside a saved card.
      var keep = {};
      TYPES[S.draft.type].fields.forEach(function (f) {
        if (S.draft.f[f.k]) keep[f.k] = S.draft.f[f.k];
      });
      S.draft.f = keep;
      renderEdit();
      return;
    }

    var peek = ev.target.closest('[data-peek]');
    if (peek) {
      var inp = $('[data-key="' + peek.dataset.peek + '"]', $('#edit-body'));
      if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
      return;
    }

    var g = ev.target.closest('[data-gen]');
    if (g) { openGen(g.dataset.gen); return; }

    var use = ev.target.closest('[data-use]');
    if (use) {
      var key = use.dataset.use;
      var panel = $('[data-genpanel="' + key + '"]', $('#edit-body'));
      var out = $('.gen-out', panel);
      var target = $('[data-key="' + key + '"]', $('#edit-body'));
      if (target && out) { target.value = out.textContent; target.type = 'text'; }
      panel.textContent = '';
      toast('Password filled in');
      return;
    }

    var again = ev.target.closest('[data-again]');
    if (again) { spinGen(again.dataset.again); return; }

    var close = ev.target.closest('[data-closegen]');
    if (close) { $('[data-genpanel="' + close.dataset.closegen + '"]', $('#edit-body')).textContent = ''; }
  });

  function openGen(key) {
    var panel = $('[data-genpanel="' + key + '"]', $('#edit-body'));
    if (!panel) return;
    if (panel.firstChild) { panel.textContent = ''; return; }
    panel.innerHTML = '<div class="gen-panel">' +
      '<div class="gen-out"></div>' +
      '<div class="gen-ctl"><span>Length</span>' +
      '<input type="range" min="12" max="40" value="20" data-len="' + esc(key) + '">' +
      '<span class="gen-len">20</span>' +
      '<label><input type="checkbox" checked data-sym="' + esc(key) + '">Symbols</label></div>' +
      '<div class="gen-acts"><button type="button" data-again="' + esc(key) + '">New one</button>' +
      '<button type="button" class="use" data-use="' + esc(key) + '">Use this</button>' +
      '<button type="button" data-closegen="' + esc(key) + '">Close</button></div>' +
      '</div>';
    panel.addEventListener('input', function (ev) {
      if (ev.target.matches('[data-len]')) {
        $('.gen-len', panel).textContent = ev.target.value;
      }
      spinGen(key);
    });
    spinGen(key);
  }

  function spinGen(key) {
    var panel = $('[data-genpanel="' + key + '"]', $('#edit-body'));
    if (!panel || !panel.firstChild) return;
    var len = parseInt($('[data-len]', panel).value, 10) || 20;
    var syms = $('[data-sym]', panel).checked;
    $('.gen-out', panel).textContent = makePassword(len, syms);
  }

  function makePassword(len, syms) {
    var lower = 'abcdefghijkmnopqrstuvwxyz';   // no l
    var upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';    // no I, O
    var nums = '23456789';                     // no 0, 1
    var sym = '!#$%&*+-=?@^_';
    var sets = [lower, upper, nums];
    if (syms) sets.push(sym);
    var pool = sets.join('');
    var out = [], i, j, tmp;
    for (i = 0; i < sets.length && out.length < len; i++) out.push(sets[i][randInt(sets[i].length)]);
    while (out.length < len) out.push(pool[randInt(pool.length)]);
    for (i = out.length - 1; i > 0; i--) { j = randInt(i + 1); tmp = out[i]; out[i] = out[j]; out[j] = tmp; }
    return out.join('');
  }

  function saveDraft() {
    collectDraft();
    var d = S.draft;
    if (!d.title) { $('#edit-err').textContent = 'Give this entry a name so you can find it.'; return; }
    var f = d.f || {};
    if (d.type === 'bank' && f.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc)) {
      $('#edit-err').textContent = 'That IFSC code looks wrong. It is 11 characters: four letters, a zero, then six more.';
      return;
    }
    if (d.type === 'card' && f.number) {
      var n = digits(f.number);
      if (n.length < 13 || n.length > 19) {
        $('#edit-err').textContent = 'A card number is 13 to 19 digits. Check what you typed.';
        return;
      }
    }
    if (d.type === 'card' && f.expiry && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.expiry)) {
      $('#edit-err').textContent = 'Write the expiry as MM/YY, for example 09/29.';
      return;
    }
    if (d.type === 'race' && f.time && parseTime(f.time) === null) {
      $('#edit-err').textContent = 'Write the finish time as h:mm:ss or mm:ss, for example 2:14:36.';
      return;
    }
    $('#edit-err').textContent = '';
    d.updated = Date.now();

    var list = entries(), found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === d.id) { list[i] = d; found = true; break; }
    }
    if (!found) list.push(d);
    S.data.entries = list;

    persist().then(function (ok) {
      if (!ok) return;
      S.id = d.id;
      S.draft = null;
      toast(S.isNew ? 'Added to the box' : 'Changes saved');
      S.isNew = false;
      show('detail');
    });
  }

  $('#btn-save').addEventListener('click', saveDraft);

  function leaveEditor() {
    askConfirm({
      title: 'Discard this entry?',
      body: S.isNew ? 'Nothing will be added to the box.' : 'Your changes to this entry will be thrown away.',
      yes: 'Discard'
    }).then(function (ok) {
      if (!ok) return;
      var back = S.isNew ? 'vault' : 'detail';
      S.draft = null;
      S.isNew = false;
      $('#edit-body').textContent = '';
      show(back);
    });
  }
  $('#btn-cancel').addEventListener('click', leaveEditor);
  $('#btn-discard').addEventListener('click', leaveEditor);

  /* ============ backup ============ */
  var FORMAT = 'deposit-box-backup';
  var fileTarget = null;

  function plural(n) { return n === 1 ? 'entry' : 'entries'; }

  function describeBackup(p) {
    var when = p.exported ? stampOf(p.exported) : 'an unknown date';
    var n = typeof p.entries === 'number' ? p.entries : null;
    return 'Backup from <b>' + esc(when) + '</b>' +
      (n !== null ? ' · <b>' + n + '</b> ' + plural(n) : '');
  }

  function buildBackup() {
    return {
      format: FORMAT,
      v: 2,
      app: 'Deposit Box',
      exported: new Date().toISOString(),
      entries: entries().length,
      // Only the passphrase wrap travels. A Face ID wrap is useless off this
      // device, and leaving it out keeps a backup restorable anywhere.
      wrap: S.rec.wraps.pass,
      iv: S.rec.iv,
      ct: S.rec.ct
    };
  }

  function parseBackup(text) {
    var p = JSON.parse(text);
    if (!p || p.format !== FORMAT) throw new Error('wrong format');
    if (!p.iv || !p.ct) throw new Error('incomplete');
    if (p.wrap) {
      if (!p.wrap.kdf || !p.wrap.kdf.salt || !p.wrap.iv || !p.wrap.ct) throw new Error('incomplete');
    } else if (!p.kdf || !p.kdf.salt) {
      throw new Error('incomplete');
    }
    return p;
  }

  // Opens either backup generation: v2 wraps a master key, v1 derived the
  // vault key straight from the passphrase.
  function openBackup(p, pass) {
    if (p.wrap) {
      return deriveFromKdf(pass, p.wrap.kdf)
        .then(function (kek) { return unwrapKey(p.wrap, kek); })
        .then(function (raw) {
          return importAes(raw).then(function (k) {
            return unseal({ iv: p.iv, ct: p.ct }, k)
              .then(function (d) { return { data: d, raw: raw, wrap: p.wrap }; });
          });
        });
    }
    return deriveFromKdf(pass, p.kdf).then(function (key) {
      return unseal({ iv: p.iv, ct: p.ct }, key)
        .then(function (d) { return { data: d, raw: null, wrap: null }; });
    });
  }

  // Anything coming out of a file is treated as untrusted shape, even though
  // GCM proves it was sealed by this app with this passphrase.
  function sanitize(list) {
    if (!Object.prototype.toString.call(list).match(/Array/)) return [];
    return list.filter(function (e) {
      return e && typeof e === 'object' && e.id && TYPES[e.type];
    }).map(function (e) {
      var f = {};
      if (e.f && typeof e.f === 'object') {
        TYPES[e.type].fields.forEach(function (fd) {
          if (e.f[fd.k] != null && e.f[fd.k] !== '') f[fd.k] = String(e.f[fd.k]);
        });
      }
      return {
        id: String(e.id),
        type: e.type,
        title: String(e.title || 'Untitled'),
        f: f,
        notes: String(e.notes || ''),
        updated: typeof e.updated === 'number' ? e.updated : 0
      };
    });
  }

  function mergeEntries(current, incoming) {
    var byId = {}, order = [], added = 0, updated = 0;
    current.forEach(function (e) { byId[e.id] = e; order.push(e.id); });
    incoming.forEach(function (e) {
      var ex = byId[e.id];
      if (!ex) { byId[e.id] = e; order.push(e.id); added++; }
      else if ((e.updated || 0) > (ex.updated || 0)) { byId[e.id] = e; updated++; }
    });
    return { entries: order.map(function (k) { return byId[k]; }), added: added, updated: updated };
  }

  function pickFile(target) {
    fileTarget = target;
    var inp = $('#file-in');
    inp.value = '';
    guardSheet();
    inp.click();
  }

  $('#file-in').addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      var p;
      try { p = parseBackup(String(fr.result)); }
      catch (err) {
        if (fileTarget === 'lock') lockErr('That file is not a Deposit Box backup.');
        else toast('That file is not a Deposit Box backup');
        return;
      }
      pendingBackup = p;
      if (fileTarget === 'lock') {
        lockMode = 'restore';
        renderLock();
      } else {
        $('#bk-found').innerHTML = describeBackup(p);
        $('#bk-err').textContent = '';
        $('#pass-import').value = '';
        $('#bk-import-panel').hidden = false;
        $('#pass-import').focus();
      }
    };
    fr.onerror = function () { toast('Could not read that file'); };
    fr.readAsText(f);
  });

  function updateBkStatus() {
    var n = entries().length;
    var last = S.data && S.data.lastExport;
    $('#bk-status').textContent = (last ? 'Last backup: ' + stampOf(last) : 'Never backed up') +
      '  ·  ' + n + ' ' + plural(n) + ' in the box';
  }

  function renderFaceSection() {
    var supported = faceSupported();
    $('#face-sect').hidden = !supported;
    $('#face-rule').hidden = !supported;
    if (!supported) return;
    var on = !!(S.rec && S.rec.wraps && S.rec.wraps.face);
    $('#btn-face-on').hidden = on;
    $('#btn-face-off').hidden = !on;
    $('#face-err').textContent = '';
    $('#face-desc').textContent = on
      ? 'Face ID is on. Your passphrase still works and is the only way back in if the passkey is ever lost.'
      : 'Open the box with your face instead of typing. Your passphrase keeps working either way — Face ID never replaces it.';
  }

  function renderBackup() {
    updateBkStatus();
    renderFaceSection();
    $('#bk-import-panel').hidden = true;
    $('#bk-dump-wrap').hidden = true;
    $('#bk-dump').value = '';
    pendingBackup = null;
  }

  function faceBusy(on, label) {
    $('#btn-face-on').disabled = on;
    $('#btn-face-off').disabled = on;
    if (on) $('#btn-face-on').textContent = label;
    else $('#btn-face-on').textContent = 'Turn on Face ID';
  }

  $('#btn-face-on').addEventListener('click', function () {
    $('#face-err').textContent = '';
    faceBusy(true, 'Waiting for Face ID…');
    faceEnroll().then(function (ok) {
      faceBusy(false);
      if (ok === false) { $('#face-err').textContent = 'Could not save. Free up storage and try again.'; return; }
      renderFaceSection();
      toast('Face ID is on');
    }).catch(function (err) {
      faceBusy(false);
      var name = err && err.name;
      if (name === 'NotAllowedError' || name === 'AbortError') {
        $('#face-err').textContent = 'Cancelled.';
      } else if (err && err.message === 'prf-unsupported') {
        $('#face-err').textContent = 'This iPhone will not give the app a key from Face ID. Needs iOS 18.4 or newer, with iCloud Keychain on.';
      } else if (err && err.message === 'prf-missing') {
        $('#face-err').textContent = 'Face ID worked but returned no key. Try again, or keep using your passphrase.';
      } else {
        $('#face-err').textContent = 'Face ID could not be set up. Your passphrase is unaffected.';
      }
    });
  });

  $('#btn-face-off').addEventListener('click', function () {
    askConfirm({
      title: 'Turn off Face ID?',
      body: 'You will go back to typing your passphrase every time. Nothing in the box changes.',
      yes: 'Turn off'
    }).then(function (ok) {
      if (!ok) return;
      delete S.rec.wraps.face;
      persist().then(function () {
        renderFaceSection();
        toast('Face ID turned off');
      });
    });
  });

  function doExport() {
    var text = JSON.stringify(buildBackup(), null, 2);
    var name = 'deposit-box-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    var blob = new Blob([text], { type: 'application/json' });

    function recordIt() {
      S.data.lastExport = Date.now();
      persist().then(updateBkStatus);
    }

    // On iOS a Home Screen app saves files through the share sheet, not a download.
    var file = null;
    try { file = new File([blob], name, { type: 'application/json' }); } catch (e) {}
    if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      guardSheet();
      navigator.share({ files: [file], title: name }).then(function () {
        recordIt();
        toast('Backup saved');
      }).catch(function (err) {
        if (err && err.name === 'AbortError') return;   // they tapped Cancel
        downloadFallback(blob, name, text, recordIt);
      });
      return;
    }
    downloadFallback(blob, name, text, recordIt);
  }

  function downloadFallback(blob, name, text, recordIt) {
    var worked = false;
    try {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 20000);
      worked = true;
    } catch (e) {}
    // A download can fail silently here, so always offer the text as a safety net.
    $('#bk-dump').value = text;
    $('#bk-dump-wrap').hidden = false;
    recordIt();
    toast(worked ? 'Backup saved' : 'Copy the text below to keep your backup');
  }

  function setImportBusy(on) {
    $('#btn-merge').disabled = on;
    $('#btn-replace').disabled = on;
    $('#btn-merge').textContent = on ? 'Working…' : 'Merge into my box';
    $('#btn-replace').textContent = 'Replace everything';
  }

  function finishImport(msg) {
    return persist().then(function (ok) {
      setImportBusy(false);
      if (!ok) return;
      pendingBackup = null;
      $('#bk-import-panel').hidden = true;
      $('#pass-import').value = '';
      toast(msg);
      show('vault');
    });
  }

  function doImport(mode) {
    var p = pendingBackup;
    if (!p) return;
    var pass = $('#pass-import').value;
    if (!pass) { $('#bk-err').textContent = 'Enter the passphrase for this backup.'; return; }
    $('#bk-err').textContent = '';
    setImportBusy(true);

    paint().then(function () {
      return openBackup(p, pass);
    }).then(function (r) {
      var incoming = sanitize(r.data && r.data.entries);
      if (mode === 'replace') {
        return askConfirm({
          title: 'Replace everything?',
          body: 'All ' + entries().length + ' ' + plural(entries().length) +
            ' in this box will be deleted and replaced with the ' + incoming.length + ' from the backup.',
          yes: 'Replace'
        }).then(function (ok) {
          if (!ok) { setImportBusy(false); return; }
          S.data.entries = incoming;
          return finishImport('Box replaced — ' + incoming.length + ' ' + plural(incoming.length));
        });
      }
      var res = mergeEntries(entries(), incoming);
      S.data.entries = res.entries;
      var parts = [];
      if (res.added) parts.push('added ' + res.added);
      if (res.updated) parts.push('updated ' + res.updated);
      return finishImport(parts.length ? 'Merged — ' + parts.join(', ') : 'Nothing new in that backup');
    }).catch(function () {
      setImportBusy(false);
      $('#bk-err').textContent = 'That passphrase does not open this backup.';
    });
  }

  function doRestore() {
    var p = pendingBackup;
    if (!p) { lockErr('Choose a backup file first.'); return; }
    var pass = $('#pass-restore').value;
    if (!pass) { lockErr('Enter the passphrase for this backup.'); return; }
    if (!storageOK) { lockErr('This browser is blocking storage, so the box cannot be restored.'); return; }
    lockErr('');
    lockBusy(true, 'Restoring…');

    paint().then(function () {
      return openBackup(p, pass);
    }).then(function (r) {
      S.data = {
        v: 1,
        entries: sanitize(r.data && r.data.entries),
        lastExport: (r.data && r.data.lastExport) || null
      };
      if (r.raw) {
        return useMasterKey(r.raw).then(function () {
          S.rec = { v: 2, wraps: { pass: r.wrap }, iv: p.iv, ct: p.ct };
          return persist();
        });
      }
      // An older backup carries no wrapped key, so build a fresh one.
      return migrateToV2(pass);
    }).then(function (ok) {
      lockBusy(false);
      if (!ok) {
        S.key = null; S.mk = null; S.data = null;
        return lockErr('Could not write to storage.');
      }
      var n = entries().length;
      pendingBackup = null;
      lockMode = 'unlock';
      $('#pass-restore').value = '';
      toast('Box restored — ' + n + ' ' + plural(n));
      show('vault');
    }).catch(function () {
      lockBusy(false);
      S.key = null; S.mk = null; S.data = null;
      lockErr('That passphrase does not open this backup.');
    });
  }

  $('#btn-backup').addEventListener('click', function () { show('backup'); });
  $('#backup-nudge').addEventListener('click', function () { show('backup'); });
  $('#btn-bk-back').addEventListener('click', function () { show('vault'); });
  $('#btn-export').addEventListener('click', doExport);
  $('#btn-import').addEventListener('click', function () { pickFile('vault'); });
  $('#btn-merge').addEventListener('click', function () { doImport('merge'); });
  $('#btn-replace').addEventListener('click', function () { doImport('replace'); });
  $('#pass-import').addEventListener('keydown', function (e) { if (e.key === 'Enter') doImport('merge'); });
  $('#btn-dump-copy').addEventListener('click', function () {
    var ta = $('#bk-dump');
    ta.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value)
        .then(function () { toast('Backup text copied'); })
        .catch(function () { toast('Select the text and copy it by hand'); });
    } else {
      toast('Select the text and copy it by hand');
    }
  });

  $('#btn-restore-start').addEventListener('click', function () {
    if (S.rec) {
      askConfirm({
        title: 'Replace the box on this phone?',
        body: 'Restoring overwrites whatever is stored here now. If you can still unlock the current box, save a backup of it first.',
        yes: 'Continue'
      }).then(function (ok) { if (ok) pickFile('lock'); });
    } else {
      pickFile('lock');
    }
  });
  $('#btn-restore-cancel').addEventListener('click', function () {
    pendingBackup = null;
    lockMode = S.rec ? 'unlock' : 'setup';
    renderLock();
  });

  /* ============ confirm sheet ============ */
  var confirmResolve = null;
  function askConfirm(opts) {
    $('#confirm-title').textContent = opts.title;
    $('#confirm-body').textContent = opts.body;
    $('#confirm-yes').textContent = opts.yes || 'Delete';
    $('#confirm').hidden = false;
    return new Promise(function (res) { confirmResolve = res; });
  }
  function closeConfirm(val) {
    $('#confirm').hidden = true;
    if (confirmResolve) { confirmResolve(val); confirmResolve = null; }
  }
  $('#confirm-yes').addEventListener('click', function () { closeConfirm(true); });
  $('#confirm-no').addEventListener('click', function () { closeConfirm(false); });
  $('#confirm').addEventListener('click', function (e) { if (e.target === $('#confirm')) closeConfirm(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('#confirm').hidden) closeConfirm(false);
  });

  /* ============ boot ============ */
  if (!window.crypto || !crypto.subtle || !crypto.subtle.deriveKey) {
    $('#lock-sub').textContent =
      'This browser does not provide the encryption this app needs. Open it in Safari or Chrome over https.';
    $('#lock-action').disabled = true;
  } else if (!window.hashwasm || !window.hashwasm.argon2id) {
    $('#lock-title').textContent = 'Encryption engine missing';
    $('#lock-sub').textContent =
      'lib/argon2.umd.min.js did not load, so the box cannot be opened safely. Reload the page; if it keeps happening, re-upload the whole folder to your host.';
    $('#lock-action').disabled = true;
    $('#btn-restore-start').hidden = true;
  } else {
    S.rec = readRec();
    renderLock();
    show('lock');
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();

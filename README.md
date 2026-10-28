# Deposit Box

A private vault for logins, bank accounts and cards that runs on your iPhone's
Home Screen, works with no internet, and stores everything encrypted with a
passphrase only you know.

## What's here

| File | What it is |
| --- | --- |
| `index.html` | The whole app — UI, logic and encryption in one file |
| `lib/` | Argon2id (hash-wasm, MIT) — vendored, never fetched from a CDN |
| `manifest.webmanifest` | Makes iOS treat it as an app, not a web page |
| `sw.js` | Caches the app so it opens with no network |
| `icons/` | Home Screen icon |

## Installing it on your iPhone

The app needs an **https://** address. That is not optional: Safari only grants
`crypto.subtle` — the encryption engine this app runs on — to secure pages, and
it only allows offline caching on secure pages. Over plain `http://` the app
will refuse to start.

So it needs to be put online once. **Hosting the app does not put your data
online.** The files above contain no data, only code; your entries are created
on the phone, encrypted on the phone, and stored on the phone.

### The quickest route — Netlify Drop

1. Go to **app.netlify.com/drop** on this laptop.
2. Drag the whole `Personal_App` folder onto the page.
3. You get an address like `https://wandering-cliff-8a21.netlify.app`.
4. Open that address in **Safari** on your iPhone (not Chrome — only Safari can
   install to the Home Screen).
5. Tap **Share** → **Add to Home Screen** → **Add**.
6. Open it from the Home Screen icon. Set your passphrase.

After step 6 the app is cached on the phone. Turn on Airplane Mode and it still
opens. You never need the Netlify address again — but keep it, in case you want
to reinstall later.

GitHub Pages, Cloudflare Pages and Vercel all work the same way if you prefer one.

### Testing on this laptop first

```
cd C:\Users\bhavi\Desktop\Personal_App
python -m http.server 8080
```

Then open **http://localhost:8080** — `localhost` counts as secure, so the app
works fully. Your laptop vault and your phone vault are separate boxes; they do
not sync.

## How the encryption works

- Your passphrase is stretched into a key with **Argon2id** — 64 MiB of memory,
  3 passes, 32-byte random salt. Argon2id is *memory-hard*: every guess costs an
  attacker 64 MiB of RAM, which is what makes GPU cracking expensive. This is the
  current standard for exactly this job, and a real step up from PBKDF2.
- The Argon2 code is `lib/argon2.umd.min.js` ([hash-wasm](https://www.npmjs.com/package/hash-wasm),
  MIT). It is **vendored into this folder, not loaded from a CDN**, so the app
  stays offline and nobody else can change your key derivation. Its output was
  checked byte-for-byte against the reference C implementation.
- The vault is encrypted with **AES-256-GCM**, a fresh random IV on every save.
  GCM also authenticates, so edited or corrupted storage is rejected rather than
  silently decrypted into nonsense.
- The key exists only in memory while the app is unlocked, and is marked
  non-extractable, so no script can read it back out.
- The passphrase itself is **never stored anywhere**, in any form.
- The page declares `connect-src 'none'`, so the browser itself blocks the app
  from making any network request. Even if the code tried to send your data
  somewhere, Safari would stop it.

### It locks itself

- 3 minutes with no touch → locked.
- **The instant you switch to another app → locked.** The only exception is the
  share sheet and the file picker (which also hide the page); those get 30
  seconds so saving a backup doesn't lock you out mid-way.
- A revealed password re-hides after 20 seconds.
- Anything you copy is wiped from the clipboard after 45 seconds.

## Backups

Tap the box icon in the top bar.

**Saving one** writes a single `.json` file containing your whole vault, still
encrypted under your current passphrase. iOS hands it to the share sheet, so you
can drop it into iCloud Drive, AirDrop it to the laptop, or mail it to yourself.
The file is ciphertext — storing it in a cloud you don't control is fine, because
without the passphrase it is noise. If your phone refuses to produce a file, the
app shows the backup as text you can copy into a note instead; that text *is* the
backup.

**Restoring** works in two places:

- From the lock screen — *Restore from a backup file*. This is the one that
  matters on a new or wiped phone, when there is no vault to unlock yet.
- From inside the vault, with two choices: **Merge** (keeps both sides; when the
  same entry exists in each, the more recently edited one wins) or **Replace
  everything** (throws away what's on the phone). Merge is the safe default and
  never deletes an entry.

The vault list shows a reminder until you've saved your first backup.

Backups are tied to the passphrase that was in use when they were saved. If you
later change your passphrase, older files still need the old one — label them.

## The one thing that will still lose your data

Forgetting the passphrase. There is no reset, no recovery email, no support
line, and backups don't help because they're encrypted with the same secret. The
data is unrecoverable — not difficult, *unrecoverable*.

Write the passphrase on paper and keep it somewhere safe before you enter real
bank details.

## Changing the app later

Everything lives in `index.html`. Re-drag the folder to Netlify to update it;
the phone picks up the new version next time it opens with a connection, because
the service worker fetches the page from the network first and only falls back
to its cached copy when offline.

If you change `manifest.webmanifest` or the icons, also bump `CACHE` in
[sw.js](sw.js) (`depositbox-v2` → `v3`). Those are cached aggressively, and
changing that string is what tells the browser to re-fetch them.

Your stored entries survive updates — they live in the browser's storage, not in
the file. Save a backup before a big change anyway.

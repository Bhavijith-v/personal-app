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

### Face ID

Turn it on from the gear icon → **Face ID**. Needs iOS 18.4 or newer with
iCloud Keychain on.

It uses a passkey with the **WebAuthn PRF extension**: after a successful Face
ID check, the device hands the page a 32-byte secret that never leaves it. That
secret is stretched with HKDF and used to unlock the same vault key your
passphrase unlocks.

- The vault key is random and wrapped **twice** — once by your passphrase,
  once by Face ID. Both open the same box.
- **Your passphrase always works.** Face ID is a convenience layer, never a
  replacement. If the passkey is lost (phone reset, iCloud problem), the
  passphrase is the way back in.
- Turning Face ID off just deletes its wrap. Nothing in the box changes.
- **Backups never contain the Face ID wrap** — a passkey is useless on another
  device — so a backup always restores with the passphrase alone.

### ID documents

**+** → **ID document**, then pick the document. Each has the fields printed on
the real one:

| Document | Fields |
| --- | --- |
| **Aadhaar** | Number, Virtual ID, name, date of birth, gender, linked mobile, address, enrolment ID |
| **PAN** | PAN, name, father's name, date of birth, whether it's linked to Aadhaar |
| **Voter ID** | EPIC number, name, relation's name, gender, date of birth, constituency, part and serial number, polling station, address |
| **Passport** | Number, surname, given names, date and place of birth, issue and expiry dates, place of issue, file number |
| **Driving licence** | Number, name, date of birth, blood group, vehicle classes, issue date, valid till, issuing RTO |
| **Ration card** | Number, card colour (Kerala: yellow, pink, blue, white), head of family, members, ARD shop number, taluk office |
| **ABHA** | 14-digit health ID, ABHA address, name, date of birth, gender, mobile |
| **Other** | Anything else: birth certificate, SSLC, UAN… |

Checks on save: **Aadhaar numbers are verified with their Verhoeff check
digit**, so a single mistyped or swapped digit is caught. PAN, passport, VID
and ABHA formats are checked, and an expiry date before the issue date is
refused.

Each document shows as a **designed card** at real card proportions, with your
details, the number masked, and an expiry badge for a passport or licence
("Expires in 100 days", "Expired"). The design carries **no emblems or official
logos**, and says it's a personal record, so it can't pass as the real thing.

Add **photos of your real card**, front and back (photo page and address page
for a passport). They're shrunk to 1400px and stored encrypted in the vault.
Tap one to show it full screen, at a counter for example. Settings shows how
much space the vault uses, and warns you before Safari's ~5 MB limit.

### Home: search and three shortcuts

The vault list opens with a **search box**. It matches names, notes, document
types and every field that isn't secret. Passwords, PINs and card numbers are
never searched, so typing can't be used to probe them.

Below it, three tiles:

- **Needs attention**: passports, licences and documents expiring within a
  year, cards expiring within 90 days, upcoming races, and a backup due after 30
  days, soonest first with a status label. **Add to Calendar** creates all-day
  iPhone Calendar events with alerts ahead of time (90 and 30 days before an ID
  expires, 7 days and 1 day before a race). The calendar file holds only the
  entry name and date, never a number or password.
- **Password health**: flags passwords reused in more than one place, weak ones
  (under 10 characters or easy to guess) and ones unchanged for a year. It
  checks login, netbanking, transaction and trading passwords, not PINs, and
  never shows the values.
- **Running**: log training runs (date, km, time, type, notes) and see
  **personal bests** for 5K, 10K, half and full (races count too; distances
  within 2% match, so a 10.05 km GPS run is a 10K), distance this week, month
  and year, and a 12-week chart. Tap a week to see its total. Runs are stored
  encrypted and travel with backups.

### Scanning a document

In any ID document, tap **Scan your Aadhaar** (or PAN, passport…), take or
pick a photo, and the app fills in the fields. Then **you** tick what to keep.

**It all happens on the phone.** The reader is Tesseract OCR compiled to
WebAssembly, plus jsQR for QR codes, all vendored in `lib/ocr/` (Apache-2.0 /
MIT licences included). The photo and the recognised text are never uploaded
and never stored. Only the fields you tick go into the vault. The first scan
downloads about 7 MB (the reader and its English model) from this site; after
that it works offline.

How each document is read:

| Document | How |
| --- | --- |
| Aadhaar | **The QR code first**: old cards hold XML; newer "Secure QR" codes are decoded (gzip, fields split by byte 255) for exact name, DOB, gender and address. The number comes from the print, is checked with its Verhoeff digit, and is confirmed against the QR's last four digits. |
| Passport | The two code lines at the foot of the photo page (ICAO 9303), read in a second pass limited to code-line characters. Number, birth and expiry dates carry check digits. If a check fails, the printed value wins. The issue date is worked out from the 10-year validity. |
| PAN | Format check, including the 4th-letter holder type |
| Voter ID, licence, ration card, ABHA | Labelled fields and formats (Kerala ration colours, licence vehicle classes, blood group) |

Every value carries a label: **From QR**, **Verified** (passed a check
digit or strict format), **Matches vault** (a name within two letters of one
already in your vault, the usual way OCR slips), or **Check this** (plain
reading, so compare it with the card).

The page's security policy now allows `connect-src 'self'`, so the app can
fetch its own reader files. It still can't contact any other host.

### Trading accounts and 2FA codes

The **Trading account** type holds a broker login: client ID, password, Kite
PIN, demat BO ID, CDSL TPIN, PAN and the **2FA (TOTP) secret key**.

If you store the TOTP key, the entry shows the **current 6-digit login code**
with a countdown, like an authenticator app. It is computed on the phone with
the standard RFC 6238 method (HMAC-SHA1, 30-second steps), so it needs no
network. The code was checked against the RFC's official test vectors.

Keeping the password and the TOTP key in the same vault means the vault
passphrase guards both. That's the same trade every password manager with
built-in codes makes; keep a separate authenticator app too if you'd rather not.

Live portfolio data is deliberately **not** in this app. Zerodha's API rules
forbid embedding the API secret in a client-side app, and the session token
it issues can place trades, not just read.

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

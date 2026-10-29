# Deposit Box

A private vault for logins, bank accounts and cards that runs on your iPhone's
Home Screen, works with no internet, and stores everything encrypted with a
passphrase only you know.

## What's here

| File | What it is |
| --- | --- |
| `index.html` | The whole app — UI, logic and encryption in one file |
| `lib/` | Argon2id (hash-wasm, MIT), the QR code maker (qrcode-generator 1.4.4, MIT) and site logos (`brands.js`, from Simple Icons, CC0) — vendored, never fetched from a CDN |
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

### Education and certifications

**+ → Education**, then the level:

| Level | Fields |
| --- | --- |
| **10th** (SSLC / Secondary) | Board (CBSE, ICSE, Kerala State SSLC, NIOS…), school, year, register number, result, certificate number, medium |
| **12th** (Plus Two / HSC) | Board (CBSE, ISC, Kerala DHSE, VHSE…), stream, school, year, register number, result, certificate number |
| **Degree** and **PG** | Degree (B.Tech, BCA… / M.Tech, MCA, MBA…), branch, college, university (KTU, Kerala, MG, Calicut, CUSAT… suggested), years of joining and passing, register number, CGPA or percentage, class awarded, certificate number |
| **Other** | Diplomas, ITI, PhD: qualification, institution, board, years, result |

**+ → Certification**: issuer (Microsoft, Anthropic, AWS, OffSec… suggested),
exam code, status (Planning → Studying → Exam booked → Passed → Expired),
exam date, issue and expiry dates, credential ID, verification link and
score. Certificates expiring within six months and booked exams appear in
**Needs attention**, and Add to Calendar works for both.

Both can hold photos of the real certificate and mark sheet (or score
report), shrunk and encrypted like ID photos. Years must be four digits,
joining can't come after passing, and verification links must be `https://`.

### Quick copy, pins and Wi-Fi

- **Logos and covers.** Logins, bank and trading accounts show their site's
  logo and a cover in the brand's colour, picked from the entry's name first,
  then its website (about 170 popular sites, Indian ones included). Logos are
  bundled in `lib/brands.js` (rebuild with `tools/brands/build_brands.py`), so
  no site or logo service learns which accounts you have. A login with no match
  gets a lettered cover. Brand names and logos belong to their owners.
- **Press and hold** any entry in the list to copy its UPI ID, IFSC, account
  number, password and so on without opening it.
- **Star** (top right of an entry) pins it to the top of the list.
- **Wi-Fi** entries hold the network, its password and the router login.
  *Show QR code to join* draws the standard Wi-Fi code that phone cameras read;
  it holds the password, so it is drawn only when asked and cleared after two
  minutes.
- The ↻ button next to any password field makes a strong password.

### Share one item safely

*Share safely* at the bottom of an entry. Tick what to send (passwords and PINs
start unticked), pick when the link should stop opening (1 hour, 1 day or
7 days), and the app makes:

1. a link, and
2. a 12-character one-time password (`abcd-efgh-jkmn`).

The ticked fields are locked with that password (Argon2id + AES-256-GCM) on your
phone. The locked data rides in the link after the `#`, which browsers never
send to a server, so GitHub never sees it. Send the link and the password by
different routes (link on WhatsApp, password on a call). The other person opens
the link in any browser, types the password and can copy each value; nothing is
saved on their phone.

There is no server, so a sent link can't be revoked. Its expiry is enforced by
the app. Photos are never included.

### OSCP labs

Home → **OSCP labs rooted**. All 196 machines from TJ Null's NetSecFocus
Trophy Room (PWK V3 tab, updated 18 July 2026): HackTheBox, Proving Grounds
Practice and Play, Vulnlab, and self-hosted AD labs (GOAD, VulnAD, Ludus).

- **Filter** by difficulty (Easy, Medium, Hard, Insane, Unrated), platform,
  type (Linux, Windows, Active Directory, Post-OSCP, Pro Lab) and status, or
  search by name.
- **Tap the circle** to cycle To do → In progress → Rooted. The date you root
  a box is recorded.
- **Tap a lab** for its details and **your notes**, which save as you type and
  are encrypted in the vault like everything else.

Where the difficulty comes from: for HackTheBox (and Vulnlab boxes now on HTB)
it's the official HTB rating, read from 0xdf's write-ups. For Proving Grounds
it's OffSec's tier as listed in a community repository, because OffSec's own
ratings need a login. Medium includes PG's Intermediate, and Insane includes
Very Hard. Boxes with no public rating show as **Unrated**, and you can set
your own rating on the lab's page.

The list is public data in `lib/oscp-labs.js`, built by
`tools/oscp/build_labs.py`. To refresh it when TJ Null updates the sheet:
```
python -I tools/oscp/build_labs.py <cache folder outside the repo> lib/oscp-labs.js
```
Then bump `CACHE` in `sw.js`. Your progress and notes are kept by lab ID, so
they survive a refresh.

### Ask Claude

**Running → Ask Claude about your running.** A chat with Claude Sonnet 5.5
about training, pacing and race day, using your races, personal bests,
weekly kilometres and recent runs.

**What's sent, and what isn't.** The screen shows the exact text Claude
receives ("What Claude sees"): races, bests and runs, and nothing else.
Passwords, card numbers, bank details and ID numbers are never included, and
the test suite checks that none of them ever leaves the app. The chat is kept
in memory only and is gone when the box locks.

**Why a server.** The app is public code, so it can't hold an Anthropic API
key: anyone could copy it and spend your credit. The key lives in a small
Cloudflare Worker you own (`claude-worker/`). The worker answers only this
app's address and only with your access token, caps each answer at 8,000
output tokens, and streams the reply back. If Claude declines a request, the
worker has Anthropic retry it on its recommended fallback model
(`fallbacks: "default"`).

**Cost.** The worker uses Claude Sonnet 5.5 at low effort ($2 per million
input tokens, $10 per million output; Claude's thinking counts as output). At
about ₹97 to the dollar that's roughly ₹1 for a quick question and ₹4–5 for a
full training plan. One answer can't cost more than about ₹8.5 (8,000 output
tokens). The app shows a rupee estimate under each answer; your card adds its
foreign-currency fee and taxes. Credit is prepaid, so set a spend limit in the
Anthropic Console as a backstop.

To use the most capable model instead, set `MODEL = 'claude-opus-5-5'` in
`claude-worker/src/index.js` (about twice the cost) and run
`npx wrangler deploy` again.

#### Setting it up (once, about 10 minutes)

1. **Anthropic API key.** At console.anthropic.com, add some credit under
   Billing, set a spend limit, and create an API key. This is separate from a
   claude.ai Pro or Max plan.
2. **Cloudflare account.** Sign up free at dash.cloudflare.com.
3. **Make an access token.** This is a password between the app and your
   server:
   ```
   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
   ```
4. **Deploy the server** from this folder:
   ```
   cd claude-worker
   npm install
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY     (paste the API key)
   npx wrangler secret put APP_TOKEN             (paste the token from step 3)
   npx wrangler deploy
   ```
   Wrangler prints an address like
   `https://deposit-box-claude.yourname.workers.dev`.
5. **Connect the app.** Running → Ask Claude → paste the address and the
   token → **Test and save**. Both are stored encrypted in the box.

The page's security policy allows `connect-src 'self' https://*.workers.dev`,
so the app can reach your worker and nothing else.

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
- Anything you copy is wiped from the clipboard after 30 seconds. iOS only lets
  a page touch the clipboard during a tap, so if you've left the app the wipe
  happens on your next tap inside it.

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

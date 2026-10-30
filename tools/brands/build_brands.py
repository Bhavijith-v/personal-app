"""Builds lib/brands.js: the logos and colours shown on login, bank and
trading entries, matched on the entry's name or website.

Logos come from Simple Icons (CC0, https://simpleicons.org). Brands it does
not carry get a lettered tile in the brand's colour instead. Brand names and
marks remain their owners' trademarks; they are used here only to label the
user's own accounts.

Usage:  python -I tools/brands/build_brands.py <simple-icons package dir> lib/brands.js

Order matters: the first brand that matches wins, so specific products
(Gmail, YouTube, Prime Video) come before their parent (Google, Amazon).
Keywords match whole words in the entry's name; one starting with "=" must
be the whole name. Domains match the website field and its subdomains.
"""
import json
import os
import re
import sys

# (simple-icons slug or None, name, colour if no slug, tile letters if no slug, keywords, domains)
BRANDS = [
    # --- Google family before Google ---
    ('gmail', 'Gmail', None, None, ['gmail', 'google mail'], ['gmail.com', 'mail.google.com']),
    ('youtube', 'YouTube', None, None, ['youtube', 'yt music', 'youtube music'], ['youtube.com', 'youtu.be', 'music.youtube.com']),
    ('googledrive', 'Google Drive', None, None, ['google drive', 'gdrive'], ['drive.google.com']),
    ('googlephotos', 'Google Photos', None, None, ['google photos'], ['photos.google.com']),
    ('googlemaps', 'Google Maps', None, None, ['google maps'], ['maps.google.com']),
    ('googlepay', 'Google Pay', None, None, ['google pay', 'gpay', 'g pay'], ['pay.google.com']),
    ('googlecloud', 'Google Cloud', None, None, ['google cloud', 'gcp'], ['cloud.google.com', 'console.cloud.google.com']),
    ('googlegemini', 'Gemini', None, None, ['gemini', 'google gemini', 'bard'], ['gemini.google.com']),
    ('googleplay', 'Google Play', None, None, ['google play', 'play store'], ['play.google.com']),
    ('google', 'Google', None, None, ['google', 'google account'], ['google.com', 'accounts.google.com', 'google.co.in']),

    # --- Apple ---
    ('icloud', 'iCloud', None, None, ['icloud'], ['icloud.com']),
    ('appstore', 'App Store', None, None, ['app store'], ['apps.apple.com']),
    ('apple', 'Apple', None, None, ['apple', 'apple id', 'apple account'], ['apple.com', 'appleid.apple.com', 'account.apple.com']),

    # --- Microsoft (not in Simple Icons) ---
    (None, 'Outlook', '0078D4', 'O', ['outlook', 'hotmail', 'live mail'], ['outlook.com', 'outlook.live.com', 'hotmail.com', 'live.com']),
    (None, 'Xbox', '107C10', 'X', ['xbox'], ['xbox.com']),
    (None, 'Azure', '0078D4', 'Az', ['azure', 'microsoft azure'], ['azure.com', 'portal.azure.com', 'azure.microsoft.com']),
    (None, 'Microsoft', '00A4EF', 'MS', ['microsoft', 'office 365', 'microsoft 365', 'teams', 'onedrive', 'skype'],
     ['microsoft.com', 'office.com', 'onedrive.live.com', 'teams.microsoft.com', 'login.microsoftonline.com']),
    (None, 'LinkedIn', '0A66C2', 'in', ['linkedin'], ['linkedin.com']),
    ('github', 'GitHub', None, None, ['github'], ['github.com']),

    # --- Amazon ---
    (None, 'Prime Video', '00A8E1', 'PV', ['prime video', 'amazon prime video'], ['primevideo.com']),
    (None, 'AWS', '232F3E', 'aws', ['aws', 'amazon web services'], ['aws.amazon.com', 'console.aws.amazon.com', 'signin.aws.amazon.com']),
    (None, 'Amazon', '232F3E', 'a', ['amazon', 'amazon prime', 'amazon pay'], ['amazon.in', 'amazon.com', 'amazon.co.uk']),

    # --- Meta and social ---
    ('whatsapp', 'WhatsApp', None, None, ['whatsapp'], ['whatsapp.com', 'web.whatsapp.com']),
    ('instagram', 'Instagram', None, None, ['instagram', 'insta'], ['instagram.com']),
    ('threads', 'Threads', None, None, ['threads'], ['threads.net', 'threads.com']),
    ('facebook', 'Facebook', None, None, ['facebook', 'fb', 'meta'], ['facebook.com', 'fb.com', 'meta.com']),
    ('x', 'X', None, None, ['twitter', '=x', 'x twitter', 'x com'], ['x.com', 'twitter.com']),
    ('reddit', 'Reddit', None, None, ['reddit'], ['reddit.com']),
    ('discord', 'Discord', None, None, ['discord'], ['discord.com', 'discord.gg']),
    ('telegram', 'Telegram', None, None, ['telegram'], ['telegram.org', 'web.telegram.org']),
    ('signal', 'Signal', None, None, ['signal'], ['signal.org']),
    ('snapchat', 'Snapchat', None, None, ['snapchat', 'snap'], ['snapchat.com']),
    ('pinterest', 'Pinterest', None, None, ['pinterest'], ['pinterest.com', 'in.pinterest.com']),
    ('quora', 'Quora', None, None, ['quora'], ['quora.com']),
    ('medium', 'Medium', None, None, ['medium'], ['medium.com']),
    ('tiktok', 'TikTok', None, None, ['tiktok'], ['tiktok.com']),
    ('bluesky', 'Bluesky', None, None, ['bluesky'], ['bsky.app']),
    ('mastodon', 'Mastodon', None, None, ['mastodon'], ['mastodon.social']),
    ('tinder', 'Tinder', None, None, ['tinder'], ['tinder.com']),
    (None, 'Bumble', 'FFC629', 'B', ['bumble'], ['bumble.com']),
    (None, 'Truecaller', '0087FF', 'T', ['truecaller'], ['truecaller.com']),

    # --- AI ---
    ('claude', 'Claude', None, None, ['claude', 'claude ai'], ['claude.ai']),
    ('anthropic', 'Anthropic', None, None, ['anthropic', 'anthropic console'], ['anthropic.com', 'console.anthropic.com']),
    (None, 'ChatGPT', '10A37F', 'AI', ['chatgpt', 'openai', 'open ai', 'gpt'], ['chatgpt.com', 'chat.openai.com', 'openai.com', 'platform.openai.com']),
    ('perplexity', 'Perplexity', None, None, ['perplexity'], ['perplexity.ai']),
    ('cursor', 'Cursor', None, None, ['cursor'], ['cursor.com', 'cursor.sh']),
    ('huggingface', 'Hugging Face', None, None, ['hugging face', 'huggingface'], ['huggingface.co']),

    # --- Indian shopping, food, travel ---
    (None, 'Flipkart', '2874F0', 'F', ['flipkart'], ['flipkart.com']),
    (None, 'Myntra', 'FF3F6C', 'M', ['myntra'], ['myntra.com']),
    (None, 'Meesho', '9F2089', 'M', ['meesho'], ['meesho.com']),
    (None, 'AJIO', '2C4152', 'A', ['ajio'], ['ajio.com']),
    (None, 'Nykaa', 'FC2779', 'N', ['nykaa'], ['nykaa.com']),
    ('swiggy', 'Swiggy', None, None, ['swiggy', 'instamart'], ['swiggy.com']),
    ('zomato', 'Zomato', None, None, ['zomato'], ['zomato.com']),
    (None, 'Blinkit', 'F8CB46', 'b', ['blinkit', 'grofers'], ['blinkit.com']),
    (None, 'Zepto', '5B1D86', 'Z', ['zepto'], ['zeptonow.com']),
    ('bigbasket', 'bigbasket', None, None, ['bigbasket', 'big basket'], ['bigbasket.com']),
    ('bookmyshow', 'BookMyShow', None, None, ['bookmyshow', 'book my show', 'bms'], ['bookmyshow.com', 'in.bookmyshow.com']),
    (None, 'IRCTC', '213D77', 'IR', ['irctc', 'indian railways'], ['irctc.co.in']),
    (None, 'MakeMyTrip', 'EB2026', 'my', ['makemytrip', 'make my trip', 'mmt'], ['makemytrip.com']),
    ('uber', 'Uber', None, None, ['uber', 'uber eats'], ['uber.com']),
    (None, 'Ola', '1C1C1C', 'Ola', ['ola', 'ola cabs'], ['olacabs.com', 'ola.in']),
    (None, 'Rapido', 'F9C935', 'R', ['rapido'], ['rapido.bike']),
    ('airbnb', 'Airbnb', None, None, ['airbnb'], ['airbnb.com', 'airbnb.co.in']),
    ('bookingdotcom', 'Booking.com', None, None, ['booking com', 'booking'], ['booking.com']),
    ('ebay', 'eBay', None, None, ['ebay'], ['ebay.com']),
    ('etsy', 'Etsy', None, None, ['etsy'], ['etsy.com']),
    ('aliexpress', 'AliExpress', None, None, ['aliexpress'], ['aliexpress.com']),
    ('ikea', 'IKEA', None, None, ['ikea'], ['ikea.com']),
    (None, 'Decathlon', '0082C3', 'D', ['decathlon'], ['decathlon.in', 'decathlon.com']),
    ('shopify', 'Shopify', None, None, ['shopify'], ['shopify.com']),

    # --- money ---
    ('paytm', 'Paytm', None, None, ['paytm'], ['paytm.com']),
    ('phonepe', 'PhonePe', None, None, ['phonepe', 'phone pe'], ['phonepe.com']),
    (None, 'CRED', '1A1A1A', 'C', ['cred'], ['cred.club']),
    ('paypal', 'PayPal', None, None, ['paypal'], ['paypal.com']),
    ('razorpay', 'Razorpay', None, None, ['razorpay'], ['razorpay.com']),
    ('stripe', 'Stripe', None, None, ['stripe'], ['stripe.com', 'dashboard.stripe.com']),
    ('hdfcbank', 'HDFC Bank', None, None, ['hdfc', 'hdfc bank', 'hdfc netbanking'], ['hdfcbank.com', 'netbanking.hdfcbank.com', 'hdfc.bank.in']),
    ('icicibank', 'ICICI Bank', None, None, ['icici', 'icici bank', 'imobile'], ['icicibank.com', 'icici.bank.in']),
    ('axisbank', 'Axis Bank', None, None, ['axis', 'axis bank'], ['axisbank.com', 'axis.bank.in']),
    (None, 'SBI', '22409A', 'SBI', ['sbi', 'state bank', 'state bank of india', 'yono', 'onlinesbi'], ['onlinesbi.sbi', 'sbi.co.in', 'onlinesbi.com', 'yonosbi.com', 'sbi.bank.in']),
    (None, 'Kotak', 'ED232A', 'K', ['kotak', 'kotak mahindra', 'kotak 811'], ['kotak.com', 'kotak.bank.in']),
    (None, 'Federal Bank', '1A3F8E', 'FB', ['federal bank', 'fedmobile'], ['federalbank.co.in', 'federal.bank.in']),
    (None, 'South Indian Bank', 'A8232A', 'SIB', ['south indian bank', 'sib'], ['southindianbank.com']),
    (None, 'Canara Bank', '0091D5', 'C', ['canara', 'canara bank'], ['canarabank.com', 'canarabank.bank.in']),
    (None, 'Union Bank', 'E31E24', 'U', ['union bank'], ['unionbankofindia.co.in']),
    (None, 'Kerala Gramin Bank', '1B5E20', 'KGB', ['kerala gramin', 'kgb'], ['keralagbank.com']),
    ('zerodha', 'Zerodha', None, None, ['zerodha', 'kite', 'coin by zerodha'], ['zerodha.com', 'kite.zerodha.com', 'console.zerodha.com']),
    (None, 'Groww', '00D09C', 'G', ['groww'], ['groww.in']),
    (None, 'Upstox', '5A298B', 'U', ['upstox'], ['upstox.com']),
    (None, 'Angel One', '3B5BDB', 'A', ['angel one', 'angel broking'], ['angelone.in']),
    ('tradingview', 'TradingView', None, None, ['tradingview'], ['tradingview.com', 'in.tradingview.com']),
    ('binance', 'Binance', None, None, ['binance'], ['binance.com']),
    ('coinbase', 'Coinbase', None, None, ['coinbase'], ['coinbase.com']),

    # --- telecom and government ---
    (None, 'JioHotstar', '0F1E3C', 'JH', ['jiohotstar', 'jio hotstar', 'hotstar', 'disney hotstar'], ['hotstar.com', 'jiohotstar.com']),
    ('jio', 'Jio', None, None, ['jio', 'myjio', 'jiofiber', 'jio fiber'], ['jio.com']),
    ('airtel', 'Airtel', None, None, ['airtel', 'airtel thanks'], ['airtel.in']),
    (None, 'Vi', 'EE2737', 'Vi', ['vodafone', 'idea', '=vi'], ['myvi.in']),
    (None, 'BSNL', '1565C0', 'B', ['bsnl'], ['bsnl.co.in']),
    (None, 'DigiLocker', '3B4FB5', 'DL', ['digilocker'], ['digilocker.gov.in']),
    (None, 'Income Tax', '1F3A93', 'IT', ['income tax', 'itr', 'e filing', 'efiling'], ['incometax.gov.in', 'eportal.incometax.gov.in']),
    (None, 'EPFO', '2E3192', 'PF', ['epfo', 'epf', 'uan', 'provident fund'], ['epfindia.gov.in', 'unifiedportal-mem.epfindia.gov.in']),
    (None, 'UIDAI', 'B5121B', 'UID', ['uidai', 'myaadhaar', 'aadhaar'], ['uidai.gov.in', 'myaadhaar.uidai.gov.in']),
    (None, 'Passport Seva', '1D3C78', 'PS', ['passport seva'], ['passportindia.gov.in']),
    (None, 'Parivahan', '0B5394', 'P', ['parivahan', 'sarathi'], ['parivahan.gov.in']),

    # --- streaming and music ---
    ('netflix', 'Netflix', None, None, ['netflix'], ['netflix.com']),
    ('spotify', 'Spotify', None, None, ['spotify'], ['spotify.com', 'open.spotify.com']),
    ('twitch', 'Twitch', None, None, ['twitch'], ['twitch.tv']),
    ('steam', 'Steam', None, None, ['steam'], ['steampowered.com', 'store.steampowered.com', 'steamcommunity.com']),
    ('epicgames', 'Epic Games', None, None, ['epic games', 'epic'], ['epicgames.com']),
    ('playstation', 'PlayStation', None, None, ['playstation', 'psn'], ['playstation.com']),
    ('chessdotcom', 'Chess.com', None, None, ['chess com', 'chess'], ['chess.com']),
    ('lichess', 'Lichess', None, None, ['lichess'], ['lichess.org']),

    # --- work and dev ---
    ('gitlab', 'GitLab', None, None, ['gitlab'], ['gitlab.com']),
    ('stackoverflow', 'Stack Overflow', None, None, ['stack overflow', 'stackoverflow'], ['stackoverflow.com']),
    (None, 'Slack', '4A154B', 'S', ['slack'], ['slack.com']),
    ('notion', 'Notion', None, None, ['notion'], ['notion.so', 'notion.com']),
    ('zoom', 'Zoom', None, None, ['zoom'], ['zoom.us', 'zoom.com']),
    ('dropbox', 'Dropbox', None, None, ['dropbox'], ['dropbox.com']),
    ('figma', 'Figma', None, None, ['figma'], ['figma.com']),
    (None, 'Canva', '00C4CC', 'C', ['canva'], ['canva.com']),
    (None, 'Adobe', 'FA0F00', 'A', ['adobe', 'photoshop', 'lightroom', 'acrobat'], ['adobe.com']),
    ('atlassian', 'Atlassian', None, None, ['atlassian', 'confluence'], ['atlassian.com', 'atlassian.net']),
    ('jira', 'Jira', None, None, ['jira'], ['jira.com']),
    ('trello', 'Trello', None, None, ['trello'], ['trello.com']),
    ('postman', 'Postman', None, None, ['postman'], ['postman.com']),
    ('replit', 'Replit', None, None, ['replit'], ['replit.com']),
    ('zoho', 'Zoho', None, None, ['zoho', 'zoho mail'], ['zoho.com', 'zoho.in']),
    ('wordpress', 'WordPress', None, None, ['wordpress'], ['wordpress.com', 'wordpress.org']),
    ('docker', 'Docker', None, None, ['docker', 'docker hub'], ['docker.com', 'hub.docker.com']),
    ('cloudflare', 'Cloudflare', None, None, ['cloudflare'], ['cloudflare.com', 'dash.cloudflare.com']),
    ('vercel', 'Vercel', None, None, ['vercel'], ['vercel.com']),
    ('netlify', 'Netlify', None, None, ['netlify'], ['netlify.com', 'app.netlify.com']),
    ('supabase', 'Supabase', None, None, ['supabase'], ['supabase.com']),
    ('firebase', 'Firebase', None, None, ['firebase'], ['firebase.google.com']),
    ('digitalocean', 'DigitalOcean', None, None, ['digitalocean', 'digital ocean'], ['digitalocean.com']),
    (None, 'Heroku', '430098', 'H', ['heroku'], ['heroku.com']),
    ('kaggle', 'Kaggle', None, None, ['kaggle'], ['kaggle.com']),
    ('leetcode', 'LeetCode', None, None, ['leetcode'], ['leetcode.com']),
    ('hackerrank', 'HackerRank', None, None, ['hackerrank'], ['hackerrank.com']),
    ('codeforces', 'Codeforces', None, None, ['codeforces'], ['codeforces.com']),
    ('protonmail', 'Proton Mail', None, None, ['proton mail', 'protonmail'], ['proton.me', 'mail.proton.me', 'protonmail.com']),
    ('proton', 'Proton', None, None, ['proton', 'proton vpn', 'proton pass'], ['account.proton.me']),
    (None, 'Yahoo', '6001D2', 'Y!', ['yahoo', 'yahoo mail'], ['yahoo.com', 'mail.yahoo.com']),
    ('bitwarden', 'Bitwarden', None, None, ['bitwarden'], ['bitwarden.com', 'vault.bitwarden.com']),
    ('1password', '1Password', None, None, ['1password'], ['1password.com']),
    ('samsung', 'Samsung', None, None, ['samsung', 'samsung account'], ['samsung.com', 'account.samsung.com']),
    ('xiaomi', 'Xiaomi', None, None, ['xiaomi', 'mi account', 'redmi'], ['mi.com', 'account.xiaomi.com']),
    ('wikipedia', 'Wikipedia', None, None, ['wikipedia'], ['wikipedia.org']),
    ('duckduckgo', 'DuckDuckGo', None, None, ['duckduckgo'], ['duckduckgo.com']),
    ('firefox', 'Firefox', None, None, ['firefox', 'mozilla'], ['mozilla.org', 'accounts.firefox.com']),
    ('brave', 'Brave', None, None, ['brave'], ['brave.com']),

    # --- learning, security, careers ---
    ('udemy', 'Udemy', None, None, ['udemy'], ['udemy.com']),
    ('coursera', 'Coursera', None, None, ['coursera'], ['coursera.org']),
    ('duolingo', 'Duolingo', None, None, ['duolingo'], ['duolingo.com']),
    ('hackthebox', 'Hack The Box', None, None, ['hack the box', 'hackthebox', 'htb'], ['hackthebox.com', 'app.hackthebox.com', 'academy.hackthebox.com']),
    ('tryhackme', 'TryHackMe', None, None, ['tryhackme', 'thm'], ['tryhackme.com']),
    (None, 'OffSec', 'E2231A', 'OS', ['offsec', 'offensive security', 'oscp', 'proving grounds'], ['offsec.com', 'portal.offsec.com', 'offensive-security.com']),
    ('burpsuite', 'PortSwigger', None, None, ['portswigger', 'burp', 'burp suite', 'web security academy'], ['portswigger.net']),
    ('hackerone', 'HackerOne', None, None, ['hackerone'], ['hackerone.com']),
    ('bugcrowd', 'Bugcrowd', None, None, ['bugcrowd'], ['bugcrowd.com']),
    ('virustotal', 'VirusTotal', None, None, ['virustotal'], ['virustotal.com']),
    ('kalilinux', 'Kali Linux', None, None, ['kali', 'kali linux'], ['kali.org']),
    ('indeed', 'Indeed', None, None, ['indeed'], ['indeed.com', 'in.indeed.com']),
    (None, 'Naukri', '275DF5', 'N', ['naukri'], ['naukri.com']),
    ('strava', 'Strava', None, None, ['strava'], ['strava.com']),
    ('garmin', 'Garmin', None, None, ['garmin', 'garmin connect'], ['garmin.com', 'connect.garmin.com']),
]

PATH_OK = re.compile(r'^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\-\s]+$')
HEX_OK = re.compile(r'^[0-9A-Fa-f]{6}$')


ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOGOS = os.path.join(ROOT, 'assets', 'logos')


def slug_of(name):
    return re.sub(r'[^a-z0-9]', '', name.lower())


def logo_file(slug):
    """The app path of an org's real logo in assets/logos/, following 'same:' picks."""
    from logo_picks import PICKS
    seen = set()
    while PICKS.get(slug, '').startswith('same:') and slug not in seen:
        seen.add(slug)
        slug = PICKS[slug][5:]
    if slug in PICKS and os.path.exists(os.path.join(LOGOS, slug + '.webp')):
        return 'assets/logos/' + slug + '.webp'
    return None


def main(pkg, out):
    from orgs import ORGS
    meta = {(x.get('slug') or slug_of(x['title'])): x for x in json.load(open(os.path.join(pkg, 'data', 'simple-icons.json'), encoding='utf-8'))}
    colours = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logo_colours.json')))
    rows, seen = [], set()
    by_slug = {slug_of(b[1]): b for b in BRANDS}
    # Organisations first: they are the more specific names ("SBI Life" before "SBI").
    for slug, name, domain, _wiki, keys in ORGS:
        if slug in by_slug or slug_of(name) in by_slug:
            continue   # an app/bank below has it; its keywords are merged there
        img = logo_file(slug)
        if not img:
            continue
        rows.append({'n': name, 'k': keys, 'h': [domain] if domain else [], 'c': colours.get(slug, '334155'), 'i': img})
        seen.add(name)
    extra = {}
    for slug, name, domain, _wiki, keys in ORGS:
        for k in (slug, slug_of(name)):
            if k in by_slug:
                extra.setdefault(by_slug[k][1], []).extend(keys)
    for slug, name, hex_, letters, keys, domains in BRANDS:
        if name in seen:
            sys.exit('duplicate brand ' + name)
        seen.add(name)
        keys = keys + [k for k in extra.get(name, []) if k not in keys]
        row = {'n': name, 'k': keys, 'h': domains}
        img = logo_file(slug_of(name))
        if slug and slug in meta:
            svg = open(os.path.join(pkg, 'icons', slug + '.svg'), encoding='utf-8').read()
            m = re.search(r'<path d="([^"]+)"', svg)
            if not m or not PATH_OK.match(m.group(1)):
                sys.exit('bad path for ' + slug)
            row['c'] = meta[slug]['hex'].upper()
            row['d'] = m.group(1)
        elif img:
            row['c'] = colours.get(slug_of(name)) or (hex_ or '334155').upper()
            row['i'] = img
        else:
            row['c'] = (hex_ or '334155').upper()
            row['t'] = letters or name[:1]
        if not HEX_OK.match(row['c']):
            sys.exit('bad colour for ' + name)
        rows.append(row)
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* Generated by tools/brands/build_brands.py. Vector logos: Simple Icons (CC0-1.0),\n'
                '   https://simpleicons.org. Picture logos (assets/logos/): each organisation\'s own website\n'
                '   or Wikipedia (see tools/brands/logo_picks.py). Names and marks belong to their owners. */\n')
        f.write('window.BRANDS = ' + json.dumps(rows, separators=(',', ':'), ensure_ascii=False) + ';\n')
    print('%d brands: %d vector logos, %d picture logos, %d lettered tiles -> %s' % (
        len(rows), sum(1 for r in rows if 'd' in r), sum(1 for r in rows if 'i' in r), sum(1 for r in rows if 't' in r), out))


if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main(sys.argv[1], sys.argv[2])

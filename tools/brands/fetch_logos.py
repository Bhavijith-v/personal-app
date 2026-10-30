"""Downloads logo candidates for every organisation in orgs.py and for the
lettered brands in build_brands.py: the app icon from the organisation's own
website (apple-touch-icon or the largest icon it links), and the image in
its Wikipedia infobox. A person then picks the better one per brand and
raster_logos.mjs turns it into assets/logos/<slug>.png.

Usage:  python -I tools/brands/fetch_logos.py <out dir>
Writes <out dir>/<slug>.site.<ext>, <slug>.wiki.<ext> and index.json.
"""
import concurrent.futures as cf
import html.parser
import json
import os
import re
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from orgs import ORGS  # noqa: E402
from build_brands import BRANDS  # noqa: E402

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36'
WIKI_UA = 'DepositBoxLogoFetcher/1.0 (personal app; https://github.com/Bhavijith-v/personal-app)'
WIKI_TITLES = {
    'Outlook': 'Microsoft Outlook', 'Azure': 'Microsoft Azure', 'Prime Video': 'Amazon Prime Video', 'AWS': 'Amazon Web Services',
    'Amazon': 'Amazon (company)', 'Bumble': 'Bumble (app)', 'Ola': 'Ola Cabs', 'Rapido': 'Rapido (company)', 'CRED': 'CRED (company)',
    'SBI': 'State Bank of India', 'Kotak': 'Kotak Mahindra Bank', 'Union Bank': 'Union Bank of India', 'Groww': 'Groww',
    'Angel One': 'Angel One', 'Vi': 'Vodafone Idea', 'Income Tax': 'Income Tax Department', 'EPFO': "Employees' Provident Fund Organisation",
    'UIDAI': 'Unique Identification Authority of India', 'Passport Seva': 'Ministry of External Affairs (India)',
    'Parivahan': 'Ministry of Road Transport and Highways', 'Slack': 'Slack (software)', 'Canva': 'Canva', 'Adobe': 'Adobe Inc.',
    'Yahoo': 'Yahoo', 'OffSec': 'Offensive Security', 'Naukri': 'Naukri.com', 'Zepto': 'Zepto (company)', 'Blinkit': 'Blinkit',
    'Decathlon': 'Decathlon S.A.', 'Heroku': 'Heroku', 'JioHotstar': 'JioHotstar', 'BSNL': 'BSNL', 'DigiLocker': 'DigiLocker',
}


def slug_of(name):
    return re.sub(r'[^a-z0-9]', '', name.lower())


def targets():
    out = [{'slug': s, 'name': n, 'domain': d, 'wiki': w} for s, n, d, w, _ in ORGS]
    have = {t['slug'] for t in out}
    for slug, name, _c, _t, _k, doms in BRANDS:
        if slug is None and slug_of(name) not in have:
            out.append({'slug': slug_of(name), 'name': name, 'domain': doms[0] if doms else '', 'wiki': WIKI_TITLES.get(name, name)})
    return out


def get(url, ua=UA, limit=4_000_000):
    req = urllib.request.Request(url, headers={'User-Agent': ua, 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.geturl(), r.headers.get('Content-Type', ''), r.read(limit)


class Icons(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.found = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        rel = (a.get('rel') or '').lower()
        if tag == 'link' and a.get('href') and ('icon' in rel):
            size = 0
            m = re.search(r'(\d+)x\d+', a.get('sizes') or '')
            if m:
                size = int(m.group(1))
            if 'apple-touch-icon' in rel:
                size = max(size, 180)
            if (a.get('type') or '').endswith('svg') or a['href'].lower().split('?')[0].endswith('.svg'):
                size = max(size, 256)
            self.found.append((size, a['href']))


def ext_of(ctype, url):
    for k, e in (('svg', 'svg'), ('png', 'png'), ('jpeg', 'jpg'), ('jpg', 'jpg'), ('webp', 'webp'), ('icon', 'ico'), ('gif', 'gif')):
        if k in ctype:
            return e
    m = re.search(r'\.(svg|png|jpe?g|webp|ico|gif)(\?|$)', url.lower())
    return m.group(1).replace('jpeg', 'jpg') if m else ''


def site_icon(t, out):
    if not t['domain']:
        return None
    cands = []
    try:
        base, _ct, body = get('https://' + t['domain'] + '/', limit=1_500_000)
        p = Icons()
        p.feed(body.decode('utf-8', 'replace'))
        cands = sorted(p.found, key=lambda x: -x[0])
        cands = [(s, urllib.parse.urljoin(base, h)) for s, h in cands]
    except Exception:
        base = 'https://' + t['domain'] + '/'
    cands.append((180, urllib.parse.urljoin(base, '/apple-touch-icon.png')))
    for size, url in cands:
        try:
            u, ct, data = get(url)
            e = ext_of(ct, u)
            if not e or len(data) < 200 or b'<html' in data[:300].lower():
                continue
            path = os.path.join(out, t['slug'] + '.site.' + e)
            open(path, 'wb').write(data)
            return {'file': os.path.basename(path), 'url': u, 'size': size}
        except Exception:
            continue
    return None


def infobox_image(title):
    # The first picture in the article's infobox: usually the logo, emblem or seal.
    # (PageImages leaves out non-free files, and most logos are non-free.)
    q = urllib.parse.urlencode({'action': 'parse', 'page': title, 'prop': 'text', 'section': 0, 'redirects': 1, 'format': 'json'})
    _u, _ct, body = get('https://en.wikipedia.org/w/api.php?' + q, ua=WIKI_UA)
    page = json.loads(body).get('parse', {}).get('text', {}).get('*', '')
    i = page.find('class="infobox')
    if i < 0:
        return None
    m = re.search(r'<img[^>]+src="(//(?:upload|thumb)\.wikimedia\.org/[^"?]+)', page[i:i + 20000])
    if not m:
        return None
    src = 'https:' + m.group(1)
    t = re.match(r'https://(?:upload|thumb)\.wikimedia\.org/(wikipedia/[^/]+/)thumb/(.+?)/[^/]+$', src)
    return 'https://upload.wikimedia.org/' + t.group(1) + t.group(2) if t else src.replace('//thumb.', '//upload.')


def wiki_logo(t, out):
    q = urllib.parse.urlencode({'action': 'query', 'titles': t['wiki'], 'prop': 'pageimages', 'piprop': 'original',
                                'redirects': 1, 'format': 'json'})
    try:
        src = infobox_image(t['wiki'])
        if not src:
            _u, _ct, body = get('https://en.wikipedia.org/w/api.php?' + q, ua=WIKI_UA)
            pages = json.loads(body)['query']['pages']
            src = next(iter(pages.values())).get('original', {}).get('source')
        if not src:
            return None
        u, ct, data = get(src, ua=WIKI_UA)
        e = ext_of(ct, u)
        path = os.path.join(out, t['slug'] + '.wiki.' + e)
        open(path, 'wb').write(data)
        return {'file': os.path.basename(path), 'url': u}
    except Exception:
        return None


def main():
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    ts = targets()
    res = {}
    with cf.ThreadPoolExecutor(8) as ex:
        futs = {ex.submit(lambda t: (site_icon(t, out), wiki_logo(t, out)), t): t for t in ts}
        for f in cf.as_completed(futs):
            t = futs[f]
            s, w = f.result()
            res[t['slug']] = {'name': t['name'], 'site': s, 'wiki': w}
            print('%-20s site:%-4s wiki:%s' % (t['slug'], 'yes' if s else '-', 'yes' if w else '-'), flush=True)
    json.dump(res, open(os.path.join(out, 'index.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()

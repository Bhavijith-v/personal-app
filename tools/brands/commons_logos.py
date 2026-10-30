"""Finds sharper logo files on Wikimedia Commons for the given slugs (most
website icons are 16-64 px favicons, too small for the app's tiles). Saves
up to three candidates per slug as <slug>.c1.<ext>, .c2, .c3 for a person to
choose from.

Usage:  python -I tools/brands/commons_logos.py <out dir> slug [slug ...]
"""
import json
import os
import sys
import time
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_logos import WIKI_UA, ext_of, get, targets  # noqa: E402

API = 'https://commons.wikimedia.org/w/api.php?'


def search(q, n=6):
    p = urllib.parse.urlencode({'action': 'query', 'list': 'search', 'srsearch': q, 'srnamespace': 6, 'srlimit': n, 'format': 'json'})
    _u, _c, body = get(API + p, ua=WIKI_UA)
    return [x['title'] for x in json.loads(body)['query']['search']]


def file_url(title):
    p = urllib.parse.urlencode({'action': 'query', 'titles': title, 'prop': 'imageinfo', 'iiprop': 'url|size|mime', 'format': 'json'})
    _u, _c, body = get(API + p, ua=WIKI_UA)
    info = next(iter(json.loads(body)['query']['pages'].values())).get('imageinfo', [{}])[0]
    return info.get('url'), info.get('width', 0), info.get('height', 0)


def main():
    out, slugs = sys.argv[1], sys.argv[2:]
    os.makedirs(out, exist_ok=True)
    names = {t['slug']: t['name'] for t in targets()}
    res = {}
    for slug in slugs:
        name = names.get(slug, slug)
        titles = []
        for q in ('intitle:logo "%s" filetype:drawing' % name, '"%s" logo' % name):
            try:
                titles += [t for t in search(q) if t not in titles]
            except Exception:
                pass
            time.sleep(0.3)
        got = []
        for t in titles:
            if len(got) == 3:
                break
            try:
                url, w, h = file_url(t)
                if not url or (min(w, h) < 120 and not url.lower().endswith('.svg')):
                    continue
                u, ct, data = get(url, ua=WIKI_UA)
                f = '%s.c%d.%s' % (slug, len(got) + 1, ext_of(ct, u))
                open(os.path.join(out, f), 'wb').write(data)
                got.append({'file': f, 'title': t})
            except Exception:
                continue
            time.sleep(0.2)
        res[slug] = got
        print(slug, len(got), flush=True)
    json.dump(res, open(os.path.join(out, 'commons.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()

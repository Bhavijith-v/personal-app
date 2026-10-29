"""Build lib/oscp-labs.js from TJ Null's NetSecFocus Trophy Room.

Sources (all public):
  - The machine list: TJ Null's "NetSecFocus Trophy Room" Google Sheet, PWK V3
    tab, exported as CSV.
  - HackTheBox (and Vulnlab boxes since migrated to HTB) difficulty: the
    official HTB rating shown in each of 0xdf's write-ups.
  - Proving Grounds difficulty: OffSec's tiers as listed in the community repo
    pika5164/Offsec_Proving_Grounds, with AaronCaiii/OSCP-Prepare-Proving-
    grounds-Practice filling gaps. OffSec's own ratings need a login.

Anything without a source is left unrated rather than guessed.

Usage:
  python -I tools/oscp/build_labs.py <cache-dir> <output .js>

Downloads go to <cache-dir> and are reused on the next run. Keep that
directory outside the repo; it holds third-party pages.
"""
import csv
import html
import io
import json
import os
import re
import sys
import time
import urllib.request

SHEET = '1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8'
PWK_GID = '129517485'
ODF = 'https://0xdf.gitlab.io'
PIKA = 'https://raw.githubusercontent.com/pika5164/Offsec_Proving_Grounds/HEAD/README.md'
AARON = 'https://raw.githubusercontent.com/AaronCaiii/OSCP-Prepare-Proving-grounds-Practice/HEAD/README.md'
UA = {'User-Agent': 'Mozilla/5.0 (deposit-box oscp list builder)'}

PLATFORMS = {
    'hackthebox': 'HackTheBox',
    'proving grounds practice': 'PG Practice',
    'proving grounds play': 'PG Play',
    'vulnlab': 'Vulnlab',
    'other labs': 'Self-hosted',
}
TRACKS = {
    'linux boxes': 'Linux',
    'windows boxes': 'Windows',
    'windows active directory boxes': 'Active Directory',
    'post oscp section. challenging yourself': 'Post-OSCP',
    'prolabs': 'Pro Lab',
}
OS_WORDS = {'linux': 'Linux', 'windows': 'Windows', 'windows/linux': 'Windows + Linux'}


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return open(path, encoding='utf-8', errors='replace').read()
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read().decode('utf-8', errors='replace')
    with io.open(path, 'w', encoding='utf-8') as f:
        f.write(data)
    time.sleep(0.4)   # be polite to the hosts
    return data


def key(name):
    return re.sub(r'[^a-z0-9]', '', name.lower())


def split_name(cell):
    """'Mentor [Linux]' -> ('Mentor', 'Linux'); 'Trusted(Chain)' -> ('Trusted', 'Chain')."""
    m = re.match(r'^\s*([^\[\(]+?)\s*[\[\(]\s*([^\]\)]+?)\s*[\]\)]\s*$', cell)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return cell.strip(), ''


def parse_sheet(text):
    rows = list(csv.reader(io.StringIO(text)))
    labs, order = {}, []
    platform, columns, prolab_post = None, [], False
    for row in rows:
        cells = [c.strip() for c in row]
        if not any(cells):
            continue
        first = cells[0].rstrip(':').strip().lower()
        if first in PLATFORMS:
            platform, columns, prolab_post = PLATFORMS[first], [], False
            continue
        if platform is None:
            continue
        if any(c.rstrip(':').strip().lower() in TRACKS for c in cells if c):
            columns = [TRACKS.get(c.rstrip(':').strip().lower()) for c in cells]
            continue
        if platform == 'Self-hosted':
            m = re.match(r'^(.+?):\s*(https?://\S+)', cells[0])
            if m:
                name = m.group(1).strip()
                labs[('Self-hosted', key(name))] = {
                    'name': name, 'platform': platform, 'tracks': ['Active Directory'],
                    'os': 'Windows', 'tags': [], 'url': m.group(2)}
                order.append(('Self-hosted', key(name)))
            continue
        for i, cell in enumerate(cells):
            if not cell or i >= len(columns) or not columns[i]:
                continue
            track = columns[i]
            if track == 'Pro Lab' and cell.lower().startswith('post oscp prolabs'):
                prolab_post = True
                continue
            name, note = split_name(cell)
            os_name, tags = None, []
            low = note.lower()
            if low in OS_WORDS:
                os_name = OS_WORDS[low]
            elif low == 'windows active directory':
                os_name, extra = 'Windows', 'Active Directory'
                tags.append(extra)
            elif low == 'windows buffer overflow':
                os_name = 'Windows'
                tags.append('Buffer overflow')
            elif note:
                tags.append(re.sub(r'\s+box$', '', note, flags=re.I).strip())
            if track == 'Linux':
                os_name = os_name or 'Linux'
            elif track in ('Windows', 'Active Directory'):
                os_name = os_name or 'Windows'
            k = (platform, key(name))
            lab = labs.get(k)
            if not lab:
                lab = {'name': name, 'platform': platform, 'tracks': [], 'os': os_name, 'tags': []}
                labs[k] = lab
                order.append(k)
            tr = [track]
            if track == 'Pro Lab' and prolab_post:
                tr.append('Post-OSCP')
            if 'Active Directory' in tags:
                tags.remove('Active Directory')
                tr.append('Active Directory')
            for t in tr:
                if t not in lab['tracks']:
                    lab['tracks'].append(t)
            for t in tags:
                if t and t not in lab['tags']:
                    lab['tags'].append(t)
            if not lab['os'] and os_name:
                lab['os'] = os_name
    return [labs[k] for k in order]


def odf_ratings(cache):
    """Every 0xdf HTB write-up, from his home page (which lists all posts),
    plus the OSCP cheatsheet page. Maps box key -> list of post paths."""
    pages = [fetch(ODF + '/', os.path.join(cache, '0xdf-home.html')),
             fetch(ODF + '/cheatsheets/offsec', os.path.join(cache, '0xdf-offsec.html'))]
    by_key = {}
    for page in pages:
        for path, slug in re.findall(r'href="(?:https://0xdf\.gitlab\.io)?(/20\d\d/\d\d/\d\d/htb-([a-z0-9-]+)\.html)"', page):
            paths = by_key.setdefault(key(slug), [])
            if path not in paths:
                paths.append(path)
    return by_key


def odf_box(cache, path):
    page = fetch(ODF + path, os.path.join(cache, '0xdf-' + path.strip('/').replace('/', '_')))
    text = html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<script.*?</script>', '', page, flags=re.S)))
    text = re.sub(r'\s+', ' ', text)
    m = re.search(r'Box Info\s+(.+?)\s+(Easy|Medium|Hard|Insane)\s+Release Date', text)
    os_m = re.search(r'\bOS\s+(Linux|Windows|FreeBSD|OpenBSD|Other)\b', text)
    return (m.group(2) if m else None), (os_m.group(1) if os_m else None), (m.group(1) if m else None)


def pick_odf(lab, paths):
    """Vulnlab boxes joined HTB in April 2025, so only later write-ups can be
    about them; an older post with the same name is a different machine
    (HTB's 2023 Escape is not Vulnlab's Escape)."""
    if lab['platform'] == 'Vulnlab':
        paths = [p for p in paths if p[1:8] >= '2025/04']
    else:
        paths = sorted(paths)   # the original HTB machine is the earliest post
    return paths[0] if paths else None


def pg_ratings(cache):
    out = {}
    pika = fetch(PIKA, os.path.join(cache, 'pika.md'))
    platform, diff = None, None
    for ln in pika.splitlines():
        if re.match(r'^#\s', ln):
            platform = 'PG Play' if 'PG Play' in ln else 'PG Practice' if 'PG Practice' in ln else platform
        m = re.match(r'^#{2,3}\s+(Easy|Intermediate|Hard|Very Hard)\s*$', ln.strip())
        if m:
            diff = m.group(1)
            continue
        for name in re.findall(r'\[([^\]]+)\]\(PG_(?:Play|Practice)/', ln):
            if platform and diff:
                out.setdefault((platform, key(name)), diff)
    aaron = fetch(AARON, os.path.join(cache, 'aaron.md'))
    for m in re.finditer(r'^\|\s*([^|]+?)\s*\|\s*(Linux|Windows)\s*\|\s*(Easy|Intermediate|Hard|Very Hard)\s*\|', aaron, re.M):
        out.setdefault(('PG Practice', key(m.group(1))), m.group(3))
    return out


def main():
    cache, out_path = sys.argv[1], sys.argv[2]
    os.makedirs(cache, exist_ok=True)
    sheet = fetch('https://docs.google.com/spreadsheets/d/%s/export?format=csv&gid=%s' % (SHEET, PWK_GID),
                  os.path.join(cache, 'pwk.csv'))
    updated = re.search(r'Latest Update:\s*([^",\n]+)', sheet)
    labs = parse_sheet(sheet)

    import difflib
    odf = odf_ratings(cache)
    pg = pg_ratings(cache)
    fuzzy = []
    for lab in labs:
        lab['difficulty'], lab['source'] = None, None
        k = key(lab['name'])
        if lab['platform'] in ('HackTheBox', 'Vulnlab') and 'Pro Lab' not in lab['tracks'] and k in odf:
            path = pick_odf(lab, odf[k])
            if path:
                diff, os_name, boxname = odf_box(cache, path)
                # The write-up must be about a box of exactly this name.
                if diff and boxname and key(boxname) == k:
                    lab['difficulty'], lab['source'] = diff, '0xdf'
                    lab['writeup'] = ODF + path
                    if os_name and not lab['os']:
                        lab['os'] = os_name
        elif lab['platform'] in ('PG Practice', 'PG Play'):
            other = 'PG Practice' if lab['platform'] == 'PG Play' else 'PG Play'
            d = pg.get((lab['platform'], k)) or pg.get((other, k))
            if not d:
                # Accept a spelling variant only when exactly one listed box
                # is very close (DriftingBlue6 -> DriftingBlues6).
                pool = [n for (p, n) in pg if p == lab['platform']]
                close = difflib.get_close_matches(k, pool, n=2, cutoff=0.9)
                if len(close) == 1:
                    d = pg[(lab['platform'], close[0])]
                    fuzzy.append(lab['name'] + ' -> ' + close[0])
            if d:
                lab['difficulty'], lab['source'] = d, 'community'

    for i, lab in enumerate(labs):
        slug = {'HackTheBox': 'htb', 'PG Practice': 'pgp', 'PG Play': 'pgy', 'Vulnlab': 'vl', 'Self-hosted': 'own'}[lab['platform']]
        lab['id'] = slug + '-' + key(lab['name'])
        lab['os'] = lab['os'] or ''

    meta = {
        'list': "TJ Null's NetSecFocus Trophy Room (PWK V3 tab)",
        'listUpdated': updated.group(1).strip() if updated else '',
        'built': time.strftime('%Y-%m-%d'),
        'count': len(labs),
    }
    fields = ['id', 'name', 'platform', 'os', 'tracks', 'tags', 'difficulty', 'source', 'writeup', 'url']
    rows = [{f: lab[f] for f in fields if lab.get(f)} for lab in labs]
    with io.open(out_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* Generated by tools/oscp/build_labs.py - do not edit by hand.\n')
        f.write('   ' + meta['list'] + ', updated ' + meta['listUpdated'] + '. Built ' + meta['built'] + '. */\n')
        f.write('window.OSCP_META = ' + json.dumps(meta) + ';\n')
        f.write('window.OSCP_LABS = [\n')
        f.write(',\n'.join('  ' + json.dumps(r, ensure_ascii=False) for r in rows))
        f.write('\n];\n')

    from collections import Counter
    print('labs:', len(labs), '| list updated:', meta['listUpdated'])
    print('by platform:', dict(Counter(l['platform'] for l in labs)))
    print('difficulty:', dict(Counter(l['difficulty'] or 'Unrated' for l in labs)))
    print('fuzzy name matches:', fuzzy or 'none')
    print('unrated:', [l['platform'] + ':' + l['name'] for l in labs if not l['difficulty'] and 'Pro Lab' not in l['tracks'] and l['platform'] != 'Self-hosted'])


if __name__ == '__main__':
    main()

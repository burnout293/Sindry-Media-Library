"""Lists the icons SindryOS really asks for: Icon= of its .desktop files, and the known icon names
found in the strings of its binaries. Read-only, on a copy extracted from the ISO."""
import collections
import json
import os
import re

BS = chr(92)
names = collections.defaultdict(set)  # icon name -> themes that have it
for line in open('liste.txt', encoding='utf-8', errors='replace'):
    parts = line.rstrip('\n').split()
    if not parts:
        continue
    p = parts[-1].replace(BS, '/')
    m = re.match(r'usr/share/icons/([^/]+)/.*/([^/]+)\.(svg|png|xpm)$', p)
    if m:
        names[m.group(2)].add(m.group(1))
print('thèmes', collections.Counter(t for v in names.values() for t in v))
known = set(names)

desk = {}
for base, _, files in os.walk('root'):
    for f in files:
        if f.endswith('.desktop'):
            text = open(os.path.join(base, f), encoding='utf-8', errors='replace').read()
            hidden = 'NoDisplay=true' in text
            for ic in re.findall(r'^Icon=(.+)$', text, re.M):
                desk.setdefault(ic.strip(), []).append(f.replace('.desktop', '') + ('*' if hidden else ''))

token = re.compile(rb'[a-zA-Z][a-zA-Z0-9._-]{3,60}')
hits = collections.defaultdict(set)
skip = re.compile(r'firefox|vlc|libav|libx26|libgtk-4|libQt|libicu|libcrypto|libssl|libgs|libmesa|libdrm|libvpx')
for base, _, files in os.walk(os.path.join('root', 'usr')):
    if '/share/' in base.replace(BS, '/'):
        continue
    for f in files:
        path = os.path.join(base, f)
        if os.path.islink(path) or skip.search(f):
            continue
        try:
            size = os.path.getsize(path)
            if size < 512 or size > 80_000_000:
                continue
            data = open(path, 'rb').read()
        except OSError:
            continue
        for t in set(token.findall(data)):
            s = t.decode('ascii')
            if s in known:
                hits[s].add(f)
            elif s.endswith('-symbolic') and s[:-9] in known:
                hits[s].add(f)

json.dump({'desktop': desk, 'binaires': {k: sorted(v) for k, v in hits.items()},
           'themes': {k: sorted(v) for k, v in names.items()}},
          open('recensement.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

print('Icon= distincts', len(desk))
for k in sorted(desk):
    print(' ', k, '<-', ', '.join(desk[k])[:70])
colour = sorted(k for k in hits if not k.endswith('-symbolic'))
print('noms en couleur cités par les binaires', len(colour), '; symboliques', len(hits) - len(colour))
libs = collections.Counter(f for k in colour for f in hits[k])
print(libs.most_common(30))
print()
outside_gtk = {}
for k in colour:
    users = [u for u in hits[k] if not u.startswith(('libgtk', 'libgdk', 'libgio', 'libglib'))]
    if users:
        outside_gtk[k] = users
print('hors GTK', len(outside_gtk))
for k in sorted(outside_gtk):
    print(' ', k, '<-', ', '.join(outside_gtk[k])[:60])

"""Compares what SindryOS 0.9.0 asks for (recensement.json, plus the visible menu entries and the
standard names of recenser2.py) with what the Prisme set provides. Usage: couverture.py <index.json> <out.json>"""
import json
import os
import re
import sys

index = json.load(open(sys.argv[1], encoding='utf-8'))
provided = set()
for icon in index['icones']:
    provided.add(icon['nom'])
    provided.update(icon['alias'])

census = json.load(open('recensement.json', encoding='utf-8'))
asked = {}  # name -> who asks

def note(name, who):
    asked.setdefault(name, set()).add(who)

GTK = ('libgtk', 'libgdk', 'libgio', 'libglib')
NOISE = re.compile(r'flite|zbar|python3|webkit|javascript|samba|spandsp|cups|colord|exif|bd_info|WebKit|bomtool|appstream|libadwaita|libroc|librsvg|fy-tool|ayatana|MiniBrowser|libnm\.|libmm-glib|libdisplay-info|libgroup')
for name, users in census['binaires'].items():
    if name.endswith('-symbolic') or name.endswith('-symbolic-rtl'):
        continue
    real = [u for u in users if not u.startswith(GTK) and not NOISE.search(u)]
    for u in real:
        note(name, u)

for base, _, files in os.walk(os.path.join('root', 'usr', 'share', 'applications')):
    for f in files:
        if f.endswith('.desktop'):
            text = open(os.path.join(base, f), encoding='utf-8', errors='replace').read()
            if re.search(r'^(NoDisplay|Hidden)=true', text, re.M):
                continue
            m = re.search(r'^Icon=(.+)$', text, re.M)
            if m:
                note(m.group(1).strip(), f.replace('.desktop', ''))

for name, users in json.load(open('standards.json', encoding='utf-8')).items():
    real = [u for u in users if not NOISE.search(u)]
    for u in real:
        note(name, u)

# The names of the other programs, words that only look like an icon name.
NOT_ICONS = {'model', 'keyboard-brightness', 'tablet', 'phone', 'scanner', 'unknown'} - provided
REASONS = [
    (r'^(firefox|firefox-esr|vlc)$', "Logo de l'application, gardé"),
    (r'^(sindryos|sindryos-demarrer)$', 'Icônes officielles de Sindry, déjà dans l\'OS (le lanceur se décide à part)'),
    (r'^org\.xfce\.panel\.', "Greffons de la barre : visibles seulement dans « Ajouter à la barre »"),
    (r'^xfce-(display|wm)-', 'Schémas internes aux réglages Écrans et Fenêtres'),
    (r'^nm-(tech|adhoc|mb-roam|wwan|device-wwan|insecure)', 'Réseau mobile et ad hoc : rare, reste celui du paquet'),
    (r'^(xfce4-logo|xfwm4-default|org\.xfce\.garcon|org\.xfce\.tumbler)$', 'Marques de Xfce, dans « À propos »'),
    (r'^gcr-', 'Cartes à puce : rare'),
    (r'^media-tape$', 'Bandes magnétiques : rare'),
    (r'^(zenity|keyboard-brightness|model|pan-end-symbolic-rtl)$', 'Sans objet ici'),
]
covered, left = [], []
for name in sorted(asked):
    if name in provided:
        covered.append(name)
        continue
    reason = next((text for pattern, text in REASONS if re.search(pattern, name)), None)
    left.append({'nom': name, 'raison': reason, 'par': sorted(asked[name])[:3]})
to_decide = [x for x in left if not x['raison']]
print(f"demandés {len(asked)} ; couverts {len(covered)} ; laissés {len(left)} ; dont sans raison {len(to_decide)}")
for x in to_decide:
    print('  À TRAITER', x['nom'], '<-', ', '.join(x['par']))
groups = {}
for x in left:
    groups.setdefault(x['raison'] or '?', []).append(x['nom'])
for reason, names in groups.items():
    print(' ', reason, ':', len(names))
json.dump({'demandes': len(asked), 'couverts': covered, 'laisses': groups}, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

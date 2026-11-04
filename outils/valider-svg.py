"""Checks every generated SVG: well-formed, none of what librsvg or a GPU-free OS could trip on, and
every url(#id) resolved inside the file. Usage: valider.py <dir> [<dir>...]"""
import os
import re
import sys
import xml.etree.ElementTree as ET

SVG = '{http://www.w3.org/2000/svg}'
FORBIDDEN_TAGS = {'filter', 'style', 'script', 'image', 'foreignObject', 'use', 'animate', 'text'}
FORBIDDEN_ATTRS = {'style', 'class', 'filter', 'mask', 'href', '{http://www.w3.org/1999/xlink}href'}
total, problems = 0, []
for root in sys.argv[1:]:
    for base, _, files in os.walk(root):
        for f in files:
            if not f.endswith('.svg'):
                continue
            path = os.path.join(base, f)
            total += 1
            # The official files reuse Sindry's classes and masks: they are checked for parsing only.
            official = 'a-icone-complete' in f
            try:
                tree = ET.parse(path)
            except ET.ParseError as e:
                problems.append(f'{path}: illisible ({e})')
                continue
            ids, refs = set(), set()
            for el in tree.iter():
                tag = el.tag.replace(SVG, '')
                if not official and tag in FORBIDDEN_TAGS:
                    problems.append(f'{path}: balise <{tag}>')
                for k, v in el.attrib.items():
                    if k == 'id':
                        ids.add(v)
                    if not official and k in FORBIDDEN_ATTRS:
                        problems.append(f'{path}: attribut {k}')
                    refs.update(re.findall(r'url\(#([^)]+)\)', v))
            for r in refs - ids:
                problems.append(f'{path}: référence #{r} introuvable')
            root_el = tree.getroot()
            if root_el.get('viewBox') is None:
                problems.append(f'{path}: pas de viewBox')
print(f'{total} fichiers, {len(problems)} problème(s)')
for p in problems[:40]:
    print(' ', p)
sys.exit(1 if problems else 0)

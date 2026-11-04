// Draws SindryOS's system and notification icons in six families. Every icon is a plain SVG:
// no filter, no CSS, no script, so librsvg can rasterise it at build time and no graphics card
// is needed (docs/IDENTITE.md of Sindry-OS). Colours come from that same file.
// Usage: node icones-os.mjs <out dir>  ->  <out dir>/<family>/<icon>.svg and <out dir>/index.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];

const NUIT = { surface: '#121A33', surface2: '#172142', border: '#2A3760', text: '#E4E9FF', muted: '#8E9AC0', accent: '#7B8CFF', deep: '#0E1426' };
const AURORA = ['#1FB5A3', '#5B6CF0', '#9A5BE0'];
const AURORA_BRIGHT = ['#3FE0C8', '#7B8CFF', '#C58BFF'];
const AMBIANCE = ['#4ED8FF', '#6670FF', '#A45CFF', '#FF8A5B']; // the wallpaper's gear (M53 C)
const EMBER = '#FFB35C';

// The twelve icons. `name` is the freedesktop name the icon theme would give them.
const ICONS = [
  { id: 'ce-pc', label: 'Ce PC', group: 'lieux', name: 'computer' },
  { id: 'disque', label: 'Disque', group: 'lieux', name: 'drive-harddisk' },
  { id: 'cle-usb', label: 'Clé USB', group: 'lieux', name: 'drive-removable-media-usb' },
  { id: 'images', label: 'Images', group: 'lieux', name: 'folder-pictures' },
  { id: 'info', label: 'Information', group: 'notifs', name: 'dialog-information', tone: 'info', shape: 'circle' },
  { id: 'ok', label: 'Réussite', group: 'notifs', name: 'emblem-ok', tone: 'ok', shape: 'circle' },
  { id: 'attention', label: 'Attention', group: 'notifs', name: 'dialog-warning', tone: 'warn', shape: 'triangle' },
  { id: 'erreur', label: 'Erreur', group: 'notifs', name: 'dialog-error', tone: 'err', shape: 'octagon' },
  { id: 'usb', label: 'Clé branchée', group: 'notifs', name: 'notification-device', shape: 'tile' },
  { id: 'reseau', label: 'Réseau', group: 'notifs', name: 'notification-network-wireless', shape: 'tile' },
  { id: 'maj', label: 'Mise à jour', group: 'notifs', name: 'software-update-available', shape: 'tile' },
  { id: 'script', label: 'Script', group: 'notifs', name: 'utilities-terminal', shape: 'tile' },
];

// ---------------------------------------------------------------- geometry

// Line glyphs on a 24 unit grid, the grid of the OS's existing glyphs.
const LINE = {
  'ce-pc': '<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M9 20.5h6M12 16.5v4"/>',
  disque: '<rect x="4.5" y="3" width="15" height="18" rx="2.5"/><circle cx="12" cy="10" r="4.5"/><path d="M12 10h.01M8.2 17.7h.01M11.5 17.7h4.3"/>',
  'cle-usb': '<path d="M9 8.5V3.2h6v5.3"/><rect x="6.8" y="8.5" width="10.4" height="12.5" rx="2.4"/><path d="M11 5.8h.01M13 5.8h.01M12 12.2v4.6"/>',
  images: '<rect x="3" y="5" width="18" height="14.5" rx="2.4"/><circle cx="8.4" cy="9.8" r="1.6"/><path d="M3.6 17.4l4.9-4.3 3.4 2.9 3-2.4 5.5 4.4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11.2v5M12 7.7h.01"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="M7.9 12.4l2.9 2.9 5.3-5.8"/>',
  attention: '<path d="M10.6 4.3a1.6 1.6 0 0 1 2.8 0l7.5 13.3a1.6 1.6 0 0 1-1.4 2.4H4.5a1.6 1.6 0 0 1-1.4-2.4z"/><path d="M12 9.8v4.2M12 17h.01"/>',
  erreur: '<path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z"/><path d="M9.3 9.3l5.4 5.4M14.7 9.3l-5.4 5.4"/>',
  usb: '<path d="M12 3.2v14.4M12 3.2l-2 2.7M12 3.2l2 2.7M12 15l-4.6-3.2V9.6M12 12.6l4.6-3.2V7.4"/><circle cx="12" cy="19.2" r="1.8"/><circle cx="7.4" cy="8.4" r="1.2"/><path d="M15.5 5.2h2.2v2.2h-2.2z"/>',
  reseau: '<path d="M3.2 9.6a12.8 12.8 0 0 1 17.6 0M6.4 13.1a8.2 8.2 0 0 1 11.2 0M9.5 16.5a3.6 3.6 0 0 1 5 0M12 19.8h.01"/>',
  maj: '<path d="M20 11a8 8 0 0 0-14.2-4.6L3.8 8.6M3.8 4.4v4.2H8M4 13a8 8 0 0 0 14.2 4.6l2-2.2M20.2 19.6v-4.2H16"/>',
  script: '<rect x="3" y="4.5" width="18" height="15" rx="2.4"/><path d="M7 9.4l3.1 2.6L7 14.6M12.6 15.2h4.4"/>',
};

function roundPoly(points, r) {
  const n = points.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = points[i], prev = points[(i + n - 1) % n], next = points[(i + 1) % n];
    const toward = (q) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p[0] + ((q[0] - p[0]) * r) / l, p[1] + ((q[1] - p[1]) * r) / l]; };
    const a = toward(prev), b = toward(next), f = (v) => +v.toFixed(2);
    d += `${i ? 'L' : 'M'}${f(a[0])} ${f(a[1])}Q${p[0]} ${p[1]} ${f(b[0])} ${f(b[1])}`;
  }
  return `${d}Z`;
}

const SHAPE = {
  circle: '<circle cx="48" cy="48" r="41"/>',
  triangle: `<path d="${roundPoly([[48, 7], [92, 85], [4, 85]], 10)}"/>`,
  octagon: `<path d="${roundPoly([[30, 6], [66, 6], [90, 30], [90, 66], [66, 90], [30, 90], [6, 66], [6, 30]], 7)}"/>`,
  tile: '<rect x="6" y="6" width="84" height="84" rx="16"/>',
};

// The status glyphs drawn solid over their coded shape; the others reuse their line glyph.
function solidGlyph(id, colour) {
  switch (id) {
    case 'info': return `<g fill="${colour}"><circle cx="48" cy="28" r="6.4"/><rect x="42" y="41" width="12" height="33" rx="6"/></g>`;
    case 'ok': return `<path d="M27 50l15 15 28-33" fill="none" stroke="${colour}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'attention': return `<g fill="${colour}"><rect x="42.5" y="34" width="11" height="28" rx="5.5"/><circle cx="48" cy="72" r="6"/></g>`;
    case 'erreur': return `<path d="M32 32l32 32M64 32L32 64" fill="none" stroke="${colour}" stroke-width="11" stroke-linecap="round"/>`;
    default: return `<g transform="translate(15 15) scale(2.75)" fill="none" stroke="${colour}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${LINE[id]}</g>`;
  }
}

// ---------------------------------------------------------------- helpers

const gradient = (id, [x1, y1, x2, y2], stops) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
  .map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`;
const evenly = (colours) => colours.map((c, i) => [+(i / (colours.length - 1)).toFixed(3), c]);
const svg = (defs, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${defs ? `<defs>${defs}</defs>` : ''}${inner}</svg>\n`;
const lineGlyph = (id, transform, stroke, width) => `<g transform="${transform}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${LINE[id]}</g>`;

// The four objects, filled, as layers. `f` is the family's painter:
//   f.body(markup, key)   the object's main surface;
//   f.part(markup)        a secondary solid (stand, connector, photo behind);
//   f.inner               the dark recess (screen, platter, label);
//   f.R                   corner radius of the outer forms;
//   f.screen / f.platter / f.label / f.photo   what fills the recess.
const OBJECTS = {
  'ce-pc': (f) => `
    ${f.part('<path d="M40 66h16l3.5 13h-23z"/>')}
    ${f.part('<rect x="25" y="77" width="46" height="8" rx="4"/>')}
    ${f.body(`<rect x="7" y="11" width="82" height="59" rx="${f.R}"/>`, 'ce-pc')}
    <rect x="14" y="18" width="68" height="45" rx="3.5" fill="${f.inner}"/>
    ${f.screen()}`,
  disque: (f) => `
    ${f.body(`<rect x="14" y="7" width="68" height="82" rx="${f.R}"/>`, 'disque')}
    ${f.platter()}`,
  'cle-usb': (f) => `
    ${f.part('<path d="M36 8a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v22H36z"/>')}
    <g fill="${f.inner}"><rect x="41.5" y="11" width="5" height="7" rx="1"/><rect x="49.5" y="11" width="5" height="7" rx="1"/></g>
    ${f.body(`<rect x="25" y="27" width="46" height="65" rx="${f.R + 2}"/>`, 'cle-usb')}
    <rect x="33" y="39" width="30" height="42" rx="5" fill="${f.inner}"/>
    ${f.label()}`,
  images: (f) => `
    ${f.part('<rect x="16" y="9" width="70" height="56" rx="7" transform="rotate(-8 51 37)"/>')}
    ${f.body(`<rect x="7" y="21" width="78" height="66" rx="${f.R}"/>`, 'images')}
    <rect x="14" y="28" width="64" height="52" rx="3.5" fill="${f.inner}"/>
    ${f.photo()}`,
};

const INNER_CLIP = {
  'ce-pc': '<rect x="14" y="18" width="68" height="45" rx="3.5"/>',
  images: '<rect x="14" y="28" width="64" height="52" rx="3.5"/>',
  platter: '<circle cx="48" cy="37" r="25"/>',
  label: '<rect x="33" y="39" width="30" height="42" rx="5"/>',
};
const clip = (id, key) => `<clipPath id="${id}">${INNER_CLIP[key]}</clipPath>`;
// A small USB fork for the stick's label.
const fork = (stroke, width) => `<path d="M48 73V47M48 47l-4.5 5.5M48 47l4.5 5.5M48 66l-8-5.5v-5M48 61l8-5.5v-5" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

// ---------------------------------------------------------------- the six families

const FAMILIES = [
  {
    id: 'a-verre', letter: 'A', name: 'Verre', text: "La vitre du « Ce PC » actuel : blanc à 14 %, trait blanc. Le plus proche du bureau d'aujourd'hui.",
    draw(icon) {
      const pane = '<rect x="1" y="1" width="94" height="94" rx="16" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>';
      const colour = { info: '#A9C4FF', ok: AURORA_BRIGHT[0], warn: '#FFC14D', err: '#FF7D8C' }[icon.tone] ?? '#fff';
      return svg('', pane + lineGlyph(icon.id, 'translate(22 22) scale(2.1667)', colour, 1.7));
    },
  },
  {
    id: 'b-ambiance', letter: 'B', name: 'Ambiance', text: "L'engrenage retenu pour le fond (M53 C) : dégradé cyan, violet, braise, reflet en haut, arête claire.",
    draw(icon) {
      const defs = [
        gradient('f', [4, 30, 92, 66], evenly(AMBIANCE).map(([o, c], i) => [[0, 0.45, 0.78, 1][i], c])),
        gradient('g', [0, 4, 0, 92], [[0, '#fff', 0.42], [0.5, '#fff', 0], [1, '#140C50', 0.3]]),
      ];
      const glossy = (m, fill) => `<g fill="${fill}">${m}</g><g fill="url(#g)">${m}</g><g fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1">${m}</g>`;
      if (icon.group === 'notifs') {
        const tones = { info: ['#4ED8FF', '#5B6CF0'], ok: ['#3FE0C8', '#13907F'], warn: ['#FFC65C', '#FD7D26'], err: ['#FF7A8A', '#D32F5B'] }[icon.tone];
        if (tones) defs.push(gradient('t', [12, 12, 84, 84], evenly(tones)));
        return svg(defs.join(''), glossy(SHAPE[icon.shape], tones ? 'url(#t)' : 'url(#f)') + solidGlyph(icon.id, '#fff'));
      }
      defs.push(gradient('s', [0, 0, 0, 96], [[0, '#4A58D8'], [1, '#2A2A8E']]), gradient('n', [0, 18, 0, 80], [[0, '#0A0F33'], [1, '#171C58']]));
      const f = {
        R: 8, inner: 'url(#n)',
        body: (m) => glossy(m, 'url(#f)'),
        part: (m) => `<g fill="url(#s)">${m}</g>`,
        screen: () => `<path d="M14 49c12-10 22-1 33-6s22-12 35-5v21.5a3.5 3.5 0 0 1-3.5 3.5h-61a3.5 3.5 0 0 1-3.5-3.5z" fill="url(#f)"/><path d="M14 55c14-7 24 0 36-4s20-7 32-3v11.5a3.5 3.5 0 0 1-3.5 3.5h-61a3.5 3.5 0 0 1-3.5-3.5z" fill="#fff" fill-opacity=".22"/>`,
        platter: () => `<circle cx="48" cy="37" r="25" fill="url(#n)"/><circle cx="48" cy="37" r="16" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="2"/><path d="M48 37L66 19a25 25 0 0 1 5 8.5z" fill="#fff" fill-opacity=".16"/><circle cx="48" cy="37" r="6" fill="url(#f)"/><path d="M68 78L57 51" stroke="#EEF1FF" stroke-width="4.5" stroke-linecap="round"/><circle cx="68" cy="78" r="5" fill="#EEF1FF"/><circle cx="25" cy="78" r="3.2" fill="#fff"/><rect x="33" y="75.5" width="20" height="5" rx="2.5" fill="#0A0F33" fill-opacity=".55"/>`,
        label: () => fork('#fff', 3.2),
        photo: () => {
          defs.push(clip('c', 'images'));
          return `<circle cx="60" cy="43" r="7.5" fill="${EMBER}"/><g clip-path="url(#c)"><path d="M14 80l22-28a3 3 0 0 1 4.6 0L62 80z" fill="url(#f)"/><path d="M42 80l14-16a3 3 0 0 1 4.2 0L78 80z" fill="#9FD9FF"/></g>`;
        },
      };
      const inner = OBJECTS[icon.id](f);
      return svg(defs.join(''), inner);
    },
  },
  {
    id: 'c-tuiles', letter: 'C', name: 'Tuiles', text: "Les carrés du menu démarrer : même forme, même trait blanc, mêmes couleurs que les applis.",
    draw(icon) {
      const colour = { 'ce-pc': '#3F5BD9', disque: '#4AB2E7', 'cle-usb': '#1FB5A3', images: '#775FD7', info: '#3B8FD9', ok: '#33B07A', attention: '#E9A23B', erreur: '#D9485F', usb: '#1FB5A3', reseau: '#33B07A', maj: '#5B6CF0', script: '#6B7287' }[icon.id];
      return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 42 42"><rect width="42" height="42" rx="7" fill="${colour}"/><g transform="translate(10 10) scale(.91667)" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${LINE[icon.id]}</g></svg>\n`;
    },
  },
  {
    id: 'd-trait', letter: 'D', name: 'Trait', text: "Le trait seul, sans fond, dans le dégradé d'aurore de l'OS : léger, comme le filet des fenêtres.",
    draw(icon) {
      const stops = { info: ['#7FE3FF', '#8C9BFF'], ok: ['#5CF0D6', '#1FB5A3'], warn: ['#FFD36B', '#FD7D26'], err: ['#FF8A9A', '#E8365D'] }[icon.tone] ?? AURORA_BRIGHT;
      const defs = gradient('a', [3, 3, 21, 21], evenly(stops));
      return svg(defs, lineGlyph(icon.id, 'translate(6 6) scale(3.5)', 'url(#a)', 1.6));
    },
  },
  {
    id: 'e-prisme', letter: 'E', name: 'Prisme', text: "Le nom de l'OS pris au mot : des aplats en facettes, sans dégradé, couleurs de l'aurore.",
    draw(icon) {
      const defs = [];
      const faceted = (m, colour) => {
        defs.push(`<clipPath id="o">${m}</clipPath>`);
        return `<g fill="${colour}">${m}</g><g clip-path="url(#o)"><path d="M0 0H66L20 96H0z" fill="#fff" fill-opacity=".17"/><path d="M96 96V34L56 96z" fill="#0A0E36" fill-opacity=".26"/></g>`;
      };
      if (icon.group === 'notifs') {
        const colour = { info: '#3F6FE0', ok: '#14A08F', warn: '#EE9326', err: '#D63A5C' }[icon.tone] ?? { usb: '#14A08F', reseau: '#2F7FD0', maj: '#5B6CF0', script: '#7A5BD6' }[icon.id];
        const inner = faceted(SHAPE[icon.shape], colour) + solidGlyph(icon.id, '#fff');
        return svg(defs.join(''), inner);
      }
      const base = { 'ce-pc': '#5B6CF0', disque: '#2F7FD0', 'cle-usb': '#14A08F', images: '#8A52D6' }[icon.id];
      const f = {
        R: 5, inner: NUIT.surface,
        body: (m) => faceted(m, base),
        part: (m) => `<g fill="#3A4690">${m}</g>`,
        screen: () => {
          defs.push(clip('c', 'ce-pc'));
          return `<g clip-path="url(#c)"><path d="M14 63V38L42 63z" fill="${AURORA[0]}"/><path d="M28 63L50 27l10 36z" fill="${AURORA_BRIGHT[1]}"/><path d="M50 27l26 36H60z" fill="${AURORA[1]}"/><path d="M60 63l22-30v30z" fill="${AURORA[2]}"/></g>`;
        },
        platter: () => {
          defs.push(clip('c', 'platter'));
          const wedges = Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4, b = ((i + 1) * Math.PI) / 4, r = 30;
            const pt = (t) => `${(48 + r * Math.sin(t)).toFixed(2)} ${(37 - r * Math.cos(t)).toFixed(2)}`;
            return `<path d="M48 37L${pt(a)}L${pt(b)}z" fill="${i % 2 ? '#26325F' : NUIT.surface}"/>`;
          }).join('');
          return `<g clip-path="url(#c)">${wedges}</g><path d="${roundPoly([[48, 30], [53, 32], [55, 37], [53, 42], [48, 44], [43, 42], [41, 37], [43, 32]], 1)}" fill="#E4E9FF"/><path d="M63.5 79.5L54 52.5l5-1.5 9.5 27z" fill="#E4E9FF"/><circle cx="66" cy="79" r="5" fill="#E4E9FF"/><path d="M22 76h6v6h-6z" fill="${AURORA_BRIGHT[0]}"/><path d="M33 76h20v5H33z" fill="#0A0E36" fill-opacity=".5"/>`;
        },
        label: () => {
          defs.push(clip('c', 'label'));
          return `<g clip-path="url(#c)"><path d="M33 81V60l15 21z" fill="${AURORA[0]}"/><path d="M63 81V66L48 81z" fill="${AURORA[2]}"/></g><path d="M48 46l7 8.5h-4.5V66h-5V54.5H41z" fill="#fff"/>`;
        },
        photo: () => {
          defs.push(clip('c', 'images'));
          return `<path d="${roundPoly([[60, 36], [65, 38], [67, 43], [65, 48], [60, 50], [55, 48], [53, 43], [55, 38]], 1)}" fill="${EMBER}"/><g clip-path="url(#c)"><path d="M12 80l26-34 6 34z" fill="${AURORA_BRIGHT[1]}"/><path d="M38 46l24 34H44z" fill="${AURORA[1]}"/><path d="M44 80l16-22 4 22z" fill="${AURORA_BRIGHT[2]}"/><path d="M60 58l20 22H64z" fill="${AURORA[2]}"/></g>`;
        },
      };
      const inner = OBJECTS[icon.id](f);
      return svg(defs.join(''), inner);
    },
  },
  {
    id: 'f-filet', letter: 'F', name: 'Filet', text: "Des objets sombres comme les fenêtres de Nuit, avec leur filet d'aurore en haut : discret, et une touche de couleur.",
    draw(icon) {
      const defs = [gradient('a', [6, 0, 90, 0], evenly(AURORA))];
      const frame = (m, top) => {
        defs.push(`<clipPath id="o">${m}</clipPath>`);
        return `<g fill="${NUIT.surface2}">${m}</g><rect x="0" y="${top}" width="96" height="6" fill="url(#a)" clip-path="url(#o)"/><g fill="none" stroke="#3A4A80" stroke-width="2">${m}</g>`;
      };
      if (icon.group === 'notifs') {
        const tone = { info: '#8FB4FF', ok: '#3FE0C8', warn: '#FFC14D', err: '#FF7D8C' }[icon.tone];
        const inner = tone
          ? `<g fill="${NUIT.surface2}" stroke="${tone}" stroke-width="4">${SHAPE[icon.shape]}</g>${solidGlyph(icon.id, tone)}`
          : frame(SHAPE.tile, 6) + solidGlyph(icon.id, NUIT.text);
        return svg(defs.join(''), inner);
      }
      const tops = { 'ce-pc': 11, disque: 7, 'cle-usb': 27, images: 21 };
      const f = {
        R: 8, inner: NUIT.deep,
        body: (m, key) => frame(m, tops[key]),
        part: (m) => `<g fill="${NUIT.border}" stroke="#3A4A80" stroke-width="1.5">${m}</g>`,
        screen: () => `<path d="M21 52c9-11 15-3 23-8s13-13 21-9 8 6 10 7" fill="none" stroke="${NUIT.accent}" stroke-width="3.5" stroke-linecap="round"/>`,
        platter: () => `<circle cx="48" cy="38" r="23" fill="${NUIT.deep}" stroke="${NUIT.accent}" stroke-width="3.5"/><circle cx="48" cy="38" r="5.5" fill="${NUIT.text}"/><path d="M68 78L57 53" stroke="${NUIT.text}" stroke-width="4" stroke-linecap="round"/><circle cx="68" cy="78" r="4.5" fill="${NUIT.text}"/><circle cx="25" cy="78" r="3" fill="${AURORA_BRIGHT[0]}"/>`,
        label: () => fork(NUIT.accent, 3.2),
        photo: () => {
          defs.push(clip('c', 'images'));
          return `<circle cx="60" cy="43" r="6.5" fill="${EMBER}"/><g clip-path="url(#c)"><path d="M14 80l22-28a3 3 0 0 1 4.6 0L62 80z" fill="${NUIT.accent}"/><path d="M42 80l14-16a3 3 0 0 1 4.2 0L78 80z" fill="#4D5CC4"/></g>`;
        },
      };
      const inner = OBJECTS[icon.id](f);
      return svg(defs.join(''), inner);
    },
  },
];

// ---------------------------------------------------------------- output

const index = { taille: 96, familles: [], icones: ICONS.map(({ id, label, group, name }) => ({ id, label, groupe: group, freedesktop: name })) };
for (const family of FAMILIES) {
  mkdirSync(join(OUT, family.id), { recursive: true });
  for (const icon of ICONS) writeFileSync(join(OUT, family.id, `${icon.id}.svg`), family.draw(icon));
  index.familles.push({ id: family.id, lettre: family.letter, nom: family.name, texte: family.text });
}
writeFileSync(join(OUT, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
console.log(`[OK] ${FAMILIES.length} familles × ${ICONS.length} icônes dans ${OUT}`);

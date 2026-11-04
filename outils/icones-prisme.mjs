// SindryOS's icon set, « Prisme » (family E of M54). Every icon is a plain SVG: no filter, no CSS, no
// script, so librsvg can draw it at build time and no graphics card is needed. The symbols of the
// tiles come from Lucide (ISC, see LICENCE-LUCIDE.txt); the objects are drawn here.
//
//   node icones-prisme.mjs traces <lucide icons dir> <glyph list> <traces.json>   refresh the symbols
//   node icones-prisme.mjs build <traces.json> <out dir>    one file per drawing, plus index.json
//   node icones-prisme.mjs theme <traces.json> <dir>        a ready icon theme, aliases included
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , COMMAND, ...ARGS] = process.argv;

if (COMMAND === 'traces') {
  const [iconsDir, listFile, outFile] = ARGS;
  const names = [...new Set(readFileSync(listFile, 'utf8').split(/\s+/).filter(Boolean))];
  const table = {};
  for (const name of names.sort()) {
    const source = readFileSync(join(iconsDir, `${name}.svg`), 'utf8');
    table[name] = source.slice(source.indexOf('>', source.indexOf('<svg')) + 1, source.lastIndexOf('</svg>')).replace(/\s*\n\s*/g, '').replace(/\s\/>/g, '/>');
  }
  writeFileSync(outFile, `${JSON.stringify(table, null, 0).replace(/","/g, '",\n"')}\n`);
  console.log(`[OK] ${names.length} tracés`);
  process.exit(0);
}

const LUCIDE = JSON.parse(readFileSync(ARGS[0], 'utf8'));

// ---------------------------------------------------------------- colours and shapes

const C = {
  indigo: '#5B6CF0', blue: '#2F7FD0', info: '#3F6FE0', teal: '#14A08F', green: '#2E9E6B', violet: '#8A52D6',
  amber: '#EE9326', folder: '#E39A2C', red: '#D63A5C', slate: '#566089', rose: '#C2469A',
};
const NIGHT = { surface: '#121A33', part: '#3A4690', text: '#E4E9FF', dark: '#0A0E36' };
const AURORA = ['#1FB5A3', '#5B6CF0', '#9A5BE0'];
const AURORA_BRIGHT = ['#3FE0C8', '#7B8CFF', '#C58BFF'];
const EMBER = '#FFB35C';

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

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
const PANES = '<rect x="3.5" y="3.5" width="7.8" height="7.8" rx="1"/><rect x="12.7" y="3.5" width="7.8" height="7.8" rx="1"/><rect x="3.5" y="12.7" width="7.8" height="7.8" rx="1"/><rect x="12.7" y="12.7" width="7.8" height="7.8" rx="1"/>';
const FLAME = '<path d="M12.4 2.6c.6 3.3 3 4.9 4.7 7 1.3 1.6 2 3.3 2 5.1a7 7 0 0 1-14.1.2c0-2.3 1-4 2.4-5.3.3 1.7 1.2 2.8 2.5 3.2-.5-3.6.2-7.3 2.5-10.2z"/>';

// ---------------------------------------------------------------- drawing

function canvas(draw) {
  const defs = [];
  let clips = 0;
  const k = {
    def: (s) => defs.push(s),
    // The Prisme look: a flat colour, one lit facet top left, one shaded facet bottom right, the same
    // on every icon, so that the light comes from one side across the whole set.
    faceted(markup, colour) {
      const id = `o${clips++}`;
      defs.push(`<clipPath id="${id}">${markup}</clipPath>`);
      return `<g fill="${colour}">${markup}</g><g clip-path="url(#${id})"><path d="M0 0H66L20 96H0z" fill="#fff" fill-opacity=".17"/><path d="M96 96V34L56 96z" fill="${NIGHT.dark}" fill-opacity=".26"/></g>`;
    },
    clip(markup) {
      const id = `o${clips++}`;
      defs.push(`<clipPath id="${id}">${markup}</clipPath>`);
      return `url(#${id})`;
    },
  };
  const inner = draw(k);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${defs.length ? `<defs>${defs.join('')}</defs>` : ''}${inner}</svg>\n`;
}

// A symbol on the 24 unit grid: a Lucide name, or { solid } for a filled one of ours.
function symbol(glyph, transform, colour, width) {
  if (glyph.solid) return `<g transform="${transform}" fill="${colour}">${glyph.solid}</g>`;
  if (!(glyph in LUCIDE)) throw new Error(`symbole inconnu : ${glyph}`);
  return `<g transform="${transform}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${LUCIDE[glyph]}</g>`;
}

const tile = (glyph, colour) => canvas((k) => k.faceted(SHAPE.tile, colour) + symbol(glyph, 'translate(15 15) scale(2.75)', '#fff', 2));

const FOLDER_BACK = '<path d="M8 26a6 6 0 0 1 6-6h21a6 6 0 0 1 4.2 1.8L47 30h35a6 6 0 0 1 6 6v8H8z"/>';
const folder = (glyph, colour) => canvas((k) => `<g fill="${shade(colour, -0.28)}">${FOLDER_BACK}</g>`
  + k.faceted('<path d="M8 42a6 6 0 0 1 6-6h68a6 6 0 0 1 6 6v36a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z"/>', colour)
  + (glyph ? symbol(glyph, 'translate(31 43) scale(1.4167)', '#fff', 2.5) : ''));
const folderOpen = (colour) => canvas((k) => `<g fill="${shade(colour, -0.28)}">${FOLDER_BACK}</g>`
  + k.faceted('<path d="M5 48a5 5 0 0 1 5-5h76a4 4 0 0 1 3.9 4.9l-7 31a6 6 0 0 1-5.8 4.7H14a6 6 0 0 1-6-5.5z"/>', colour));

const PAGE = '<path d="M20 7h36l26 26v50a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V13a6 6 0 0 1 6-6z"/>';
const doc = (glyph, colour) => canvas((k) => k.faceted(PAGE, colour)
  + `<path d="M56 7l26 26H62a6 6 0 0 1-6-6z" fill="#fff" fill-opacity=".45"/>`
  + symbol(glyph, 'translate(27 38) scale(1.75)', '#fff', 2.3));

const STATUS_GLYPH = {
  info: (c) => `<g fill="${c}"><circle cx="48" cy="28" r="6.4"/><rect x="42" y="41" width="12" height="33" rx="6"/></g>`,
  ok: (c) => `<path d="M27 50l15 15 28-33" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`,
  warn: (c) => `<g fill="${c}"><rect x="42.5" y="34" width="11" height="28" rx="5.5"/><circle cx="48" cy="72" r="6"/></g>`,
  err: (c) => `<path d="M32 32l32 32M64 32L32 64" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round"/>`,
  ask: (c) => `<path d="M34.5 36a13.5 13.5 0 1 1 20 11.8c-4 2.2-6.5 4.7-6.5 9" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/><circle cx="48" cy="72.5" r="6"/>`.replace('<circle', `<circle fill="${c}"`),
  link: (c) => `<g fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><path d="M31 65l32-32M42 31h22v22"/></g>`,
};
const coded = (shape, colour, mark) => canvas((k) => k.faceted(SHAPE[shape], colour) + STATUS_GLYPH[mark]('#fff'));
const emblem = (colour, glyph) => canvas((k) => k.faceted(SHAPE.circle, colour) + symbol(glyph, 'translate(18 18) scale(2.5)', '#fff', 2.6));

// In the taskbar's tray: a plain white symbol, readable at 16 to 22 px on the dark bar.
const tray = (inner) => canvas(() => inner);
const trayLine = (paths, width = 2.4) => `<g transform="scale(4)" fill="none" stroke="#fff" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
const WIFI = ['M12 20h.01', 'M8.5 16.429a5 5 0 0 1 7 0', 'M5 12.859a10 10 0 0 1 14 0', 'M2 8.820a15 15 0 0 1 20 0'];
function wifi(level) { // 0 to 4 parts lit
  return tray(`<g transform="scale(4)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round">${WIFI.map((d, i) => `<path d="${d}"${i < level ? '' : ' stroke-opacity=".28"'}/>`).join('')}</g>`);
}
const SPEAKER = '<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" fill="#fff" stroke="none"/>';
function volume(level) { // 0 muted, 1 to 3 waves lit
  const waves = ['M15 9a5 5 0 0 1 0 6', 'M18.5 6.5a9 9 0 0 1 0 11'];
  if (!level) return tray(trayLine(`${SPEAKER}<path d="M16 9.5l5 5M21 9.5l-5 5" stroke="${shade(C.red, 0.25)}"/>`));
  return tray(trayLine(SPEAKER + waves.map((d, i) => `<path d="${d}"${i < level - 1 ? '' : ' stroke-opacity=".28"'}/>`).join('')));
}
function battery(level, colour, charging) { // level 0 to 1
  return canvas((k) => {
    const width = Math.max(4, Math.round(level * 64));
    const fill = k.clip('<rect x="10" y="30" width="68" height="36" rx="6"/>');
    return `<rect x="6" y="26" width="76" height="44" rx="9" fill="${NIGHT.surface}" stroke="${NIGHT.text}" stroke-width="4"/><rect x="85" y="39" width="6" height="18" rx="2.5" fill="${NIGHT.text}"/>`
      + `<g clip-path="${fill}"><rect x="12" y="32" width="${width}" height="32" rx="3" fill="${colour}"/><path d="M12 32h${Math.round(width * 0.7)}L12 64z" fill="#fff" fill-opacity=".2"/></g>`
      + (charging ? '<path d="M50 28L30 52h13l-3 17 21-25H47z" fill="#fff" stroke="#121A33" stroke-width="2.5" stroke-linejoin="round"/>' : '');
  });
}

// ---------------------------------------------------------------- the objects

function monitorScreen(k, x, y, w, h) {
  const c = k.clip(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3.5"/>`);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3.5" fill="${NIGHT.surface}"/><g clip-path="${c}" transform="translate(${x} ${y}) scale(${w / 68} ${h / 45})"><path d="M0 45V20L28 45z" fill="${AURORA[0]}"/><path d="M14 45L36 9l10 36z" fill="${AURORA_BRIGHT[1]}"/><path d="M36 9l26 36H46z" fill="${AURORA[1]}"/><path d="M46 45l22-30v30z" fill="${AURORA[2]}"/></g>`;
}
const computer = () => canvas((k) => `<g fill="${NIGHT.part}"><path d="M40 66h16l3.5 13h-23z"/><rect x="25" y="77" width="46" height="8" rx="4"/></g>`
  + k.faceted('<rect x="7" y="11" width="82" height="59" rx="5"/>', C.indigo) + monitorScreen(k, 14, 18, 68, 45));
const display = () => canvas((k) => {
  const c = k.clip('<rect x="14" y="18" width="68" height="45" rx="3.5"/>');
  return `<g fill="${NIGHT.part}"><path d="M40 66h16l3.5 13h-23z"/><rect x="25" y="77" width="46" height="8" rx="4"/></g>`
    + k.faceted('<rect x="7" y="11" width="82" height="59" rx="5"/>', C.blue)
    + `<rect x="14" y="18" width="68" height="45" rx="3.5" fill="${shade(C.blue, 0.25)}"/><g clip-path="${c}"><path d="M14 63V18h44z" fill="#fff" fill-opacity=".25"/></g>`;
});
const laptop = () => canvas((k) => k.faceted('<rect x="15" y="13" width="66" height="53" rx="5"/>', C.indigo) + monitorScreen(k, 21, 19, 54, 41)
  + `<g fill="${NIGHT.part}"><path d="M5 68h86l-3.5 10a5 5 0 0 1-4.7 3.3H13.2A5 5 0 0 1 8.5 78z"/></g><rect x="38" y="68" width="20" height="4" rx="2" fill="#7F8BD8"/>`);
const disk = (colour, inside) => canvas((k) => k.faceted('<rect x="14" y="7" width="68" height="82" rx="5"/>', colour) + inside(k)
  + `<path d="M22 76h6v6h-6z" fill="${AURORA_BRIGHT[0]}"/><path d="M33 76h20v5H33z" fill="${NIGHT.dark}" fill-opacity=".5"/>`);
const platter = (k) => {
  const c = k.clip('<circle cx="48" cy="37" r="25"/>');
  const wedges = Array.from({ length: 8 }, (_, i) => {
    const pt = (t) => `${(48 + 30 * Math.sin(t)).toFixed(2)} ${(37 - 30 * Math.cos(t)).toFixed(2)}`;
    return `<path d="M48 37L${pt((i * Math.PI) / 4)}L${pt(((i + 1) * Math.PI) / 4)}z" fill="${i % 2 ? '#26325F' : NIGHT.surface}"/>`;
  }).join('');
  return `<g clip-path="${c}">${wedges}</g><path d="${roundPoly([[48, 30], [53, 32], [55, 37], [53, 42], [48, 44], [43, 42], [41, 37], [43, 32]], 1)}" fill="${NIGHT.text}"/><path d="M63.5 79.5L54 52.5l5-1.5 9.5 27z" fill="${NIGHT.text}"/><circle cx="66" cy="79" r="5" fill="${NIGHT.text}"/>`;
};
const ssd = () => canvas((k) => k.faceted('<rect x="7" y="20" width="82" height="56" rx="5"/>', C.indigo)
  + `<g fill="${NIGHT.surface}"><rect x="16" y="30" width="20" height="24" rx="2.5"/><rect x="41" y="30" width="20" height="24" rx="2.5"/></g><rect x="66" y="30" width="14" height="10" rx="2" fill="${AURORA_BRIGHT[0]}"/><rect x="66" y="44" width="14" height="10" rx="2" fill="${NIGHT.text}"/>`
  + `<g fill="${NIGHT.text}">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${17 + i * 8}" y="63" width="5" height="6" rx="1"/>`).join('')}</g>`);
const removable = () => canvas((k) => `<rect x="42" y="6" width="12" height="14" rx="2" fill="${NIGHT.part}"/>`
  + k.faceted('<rect x="16" y="17" width="64" height="72" rx="6"/>', C.teal) + symbol('usb', 'translate(27 28) scale(1.75)', '#fff', 2.3)
  + `<path d="M26 77h6v5h-6z" fill="${AURORA_BRIGHT[0]}"/>`);
const stick = (label) => canvas((k) => `<g fill="${NIGHT.part}"><path d="M36 8a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v22H36z"/></g><g fill="${NIGHT.surface}"><rect x="41.5" y="11" width="5" height="7" rx="1"/><rect x="49.5" y="11" width="5" height="7" rx="1"/></g>`
  + k.faceted('<rect x="25" y="27" width="46" height="65" rx="7"/>', C.teal) + label(k));
const stickArrow = (k) => {
  const c = k.clip('<rect x="33" y="39" width="30" height="42" rx="5"/>');
  return `<rect x="33" y="39" width="30" height="42" rx="5" fill="${NIGHT.surface}"/><g clip-path="${c}"><path d="M33 81V60l15 21z" fill="${AURORA[0]}"/><path d="M63 81V66L48 81z" fill="${AURORA[2]}"/></g><path d="M48 46l7 8.5h-4.5V66h-5V54.5H41z" fill="#fff"/>`;
};
const stickMark = (glyph) => () => `<rect x="33" y="39" width="30" height="42" rx="5" fill="${NIGHT.surface}"/>${symbol(glyph, 'translate(36.5 48.5) scale(.9583)', '#fff', 2.4)}`;
const optical = () => canvas((k) => {
  const disc = '<path fill-rule="evenodd" d="M48 7a41 41 0 1 0 0 82 41 41 0 0 0 0-82zm0 32a9 9 0 1 1 0 18 9 9 0 0 1 0-18z"/>';
  const c = k.clip('<path clip-rule="evenodd" d="M48 7a41 41 0 1 0 0 82 41 41 0 0 0 0-82zm0 32a9 9 0 1 1 0 18 9 9 0 0 1 0-18z"/>');
  return `<g fill="#8E9CF5">${disc}</g><g clip-path="${c}"><path d="M48 48L48 0 96 0 96 30z" fill="${AURORA_BRIGHT[0]}" fill-opacity=".75"/><path d="M48 48L96 66 96 96 70 96z" fill="${AURORA[2]}" fill-opacity=".8"/><path d="M48 48L48 96 0 96 0 66z" fill="${AURORA[1]}" fill-opacity=".85"/><path d="M48 48L0 30 0 0 26 0z" fill="#fff" fill-opacity=".4"/></g><path fill-rule="evenodd" d="M48 30a18 18 0 1 0 0 36 18 18 0 0 0 0-36zm0 9a9 9 0 1 1 0 18 9 9 0 0 1 0-18z" fill="#fff" fill-opacity=".45"/>`;
});
const sdCard = () => canvas((k) => k.faceted('<path d="M24 7h36l18 18v58a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6V13a6 6 0 0 1 6-6z"/>', C.violet)
  + `<g fill="${NIGHT.text}">${[0, 1, 2, 3].map((i) => `<rect x="${27 + i * 10}" y="15" width="6" height="${i === 3 ? 12 : 16}" rx="1"/>`).join('')}</g><rect x="27" y="46" width="42" height="33" rx="4" fill="${NIGHT.surface}"/><path d="M34 70l9-11 6 7 4-4 9 8z" fill="${AURORA_BRIGHT[2]}"/>`);
const floppy = () => canvas((k) => k.faceted('<path d="M14 8h54l20 20v54a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z"/>', C.slate)
  + `<rect x="26" y="8" width="38" height="24" rx="2" fill="${NIGHT.text}"/><rect x="49" y="12" width="9" height="16" rx="1.5" fill="${NIGHT.surface}"/><rect x="20" y="48" width="56" height="40" rx="3" fill="${NIGHT.surface}"/><rect x="28" y="58" width="40" height="4" rx="2" fill="${NIGHT.text}"/><rect x="28" y="68" width="28" height="4" rx="2" fill="${NIGHT.text}" fill-opacity=".6"/>`);
const BIN_BODY = '<path d="M21 31h54l-4.8 51a6 6 0 0 1-6 5.4H31.8a6 6 0 0 1-6-5.4z"/>';
const ribs = '<g stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"><path d="M38 44l1.5 30M48 44v30M58 44l-1.5 30"/></g>';
const trash = () => canvas((k) => `<path d="M37 18v-3a5 5 0 0 1 5-5h12a5 5 0 0 1 5 5v3" fill="none" stroke="${NIGHT.text}" stroke-width="5"/><rect x="14" y="17" width="68" height="10" rx="3.5" fill="${NIGHT.text}"/>${k.faceted(BIN_BODY, C.slate)}${ribs}`);
const trashFull = () => canvas((k) => `<g fill="#F4E9D2"><path d="M22 34l6-20 15 5 11-11 12 12 12-3-4 17z"/></g><path d="M28 14l15 5-3 15H22z" fill="${EMBER}" fill-opacity=".55"/><path d="M54 8l12 12-8 14H46z" fill="#fff" fill-opacity=".8"/>${k.faceted(BIN_BODY, C.slate)}${ribs}`);
const photos = () => canvas((k) => {
  const c = k.clip('<rect x="14" y="28" width="64" height="52" rx="3.5"/>');
  return `<g fill="${NIGHT.part}"><rect x="16" y="9" width="70" height="56" rx="7" transform="rotate(-8 51 37)"/></g>${k.faceted('<rect x="7" y="21" width="78" height="66" rx="5"/>', '#8A52D6')}<rect x="14" y="28" width="64" height="52" rx="3.5" fill="${NIGHT.surface}"/>`
    + `<path d="${roundPoly([[60, 36], [65, 38], [67, 43], [65, 48], [60, 50], [55, 48], [53, 43], [55, 38]], 1)}" fill="${EMBER}"/><g clip-path="${c}"><path d="M12 80l26-34 6 34z" fill="${AURORA_BRIGHT[1]}"/><path d="M38 46l24 34H44z" fill="${AURORA[1]}"/><path d="M44 80l16-22 4 22z" fill="${AURORA_BRIGHT[2]}"/><path d="M60 58l20 22H64z" fill="${AURORA[2]}"/></g>`;
});

// ---------------------------------------------------------------- the set

// [theme directory, label of its section]
const SECTIONS = {
  lieux: ['places', 'Dossiers et lieux'],
  materiel: ['devices', 'Disques et matériel'],
  applis: ['apps', 'Applications'],
  reglages: ['apps', 'Paramètres'],
  notifs: ['status', 'Notifications et états'],
  barre: ['status', 'Barre des tâches'],
  session: ['actions', 'Session et démarrage'],
  fichiers: ['mimetypes', 'Types de fichiers'],
  emblemes: ['emblems', 'Emblèmes'],
  categories: ['categories', 'Catégories du menu'],
  sindry: ['apps', 'Propres à SindryOS'],
};
const ICONS = [];
const add = (section, name, label, svg, aliases = []) => ICONS.push({ section, name, label, svg, aliases });
const T = (section, name, label, glyph, colour, aliases) => add(section, name, label, tile(glyph, colour), aliases);
const F = (name, label, glyph, colour, aliases) => add('lieux', name, label, folder(glyph, colour), aliases);
const D = (name, label, glyph, colour, aliases) => add('fichiers', name, label, doc(glyph, colour), aliases);

add('lieux', 'computer', 'Ce PC', computer(), ['user-computer']);
F('folder', 'Dossier', null, C.folder, ['inode-directory', 'folder-visiting', 'stock_folder', 'gtk-directory']);
add('lieux', 'folder-open', 'Dossier ouvert', folderOpen(C.folder), ['folder-drag-accept', 'stock_folder-copy', 'stock_folder-move']);
F('user-home', 'Dossier personnel', 'house', C.indigo, ['folder-home', 'go-home']);
F('user-desktop', 'Bureau', 'monitor', C.slate, ['desktop']);
F('folder-documents', 'Documents', 'file-text', C.blue);
F('folder-download', 'Téléchargements', 'download', C.teal);
F('folder-music', 'Musique', 'music', C.rose);
F('folder-pictures', 'Images', 'image', C.violet);
F('folder-videos', 'Vidéos', 'clapperboard', C.red);
F('folder-publicshare', 'Public', 'share-2', C.green);
F('folder-templates', 'Modèles', 'layout-template', C.slate);
F('folder-remote', 'Dossier distant', 'globe', C.info, ['network-folder']);
F('sindryos-dossier-scripts', 'Scripts', 'square-terminal', C.violet);
add('lieux', 'user-trash', 'Corbeille vide', trash(), ['trashcan_empty']);
add('lieux', 'user-trash-full', 'Corbeille pleine', trashFull(), ['trashcan_full']);
T('lieux', 'user-bookmarks', 'Favoris', 'star', C.folder, ['bookmark-new']);
T('lieux', 'document-open-recent', 'Récents', 'history', C.slate);
T('lieux', 'network-workgroup', 'Réseau', 'network', C.green, ['gnome-fs-network']);
T('lieux', 'network-server', 'Serveur', 'server', C.green);

add('materiel', 'drive-harddisk', 'Disque dur', disk(C.blue, platter), ['gnome-dev-harddisk', 'drive-harddisk-ieee1394', 'drive-harddisk-system']);
add('materiel', 'drive-harddisk-solidstate', 'Disque SSD', ssd(), ['drive-harddisk-nvme']);
add('materiel', 'drive-removable-media', 'Disque externe', removable(), ['media-removable', 'drive-harddisk-usb']);
add('materiel', 'drive-removable-media-usb', 'Clé USB', stick(stickArrow), ['media-removable-usb']);
add('materiel', 'drive-optical', 'Lecteur optique', optical(), ['media-optical', 'media-optical-cd', 'media-optical-dvd', 'media-optical-bd']);
add('materiel', 'media-flash', 'Carte mémoire', sdCard(), ['media-flash-sd-mmc']);
add('materiel', 'media-floppy', 'Disquette', floppy());
add('materiel', 'computer-laptop', 'Portable', laptop(), ['laptop']);
add('materiel', 'video-display', 'Écran', display(), ['monitor']);
T('materiel', 'input-keyboard', 'Clavier', 'keyboard', C.blue, ['keyboard']);
T('materiel', 'input-mouse', 'Souris', 'mouse', C.blue, ['mouse']);
T('materiel', 'input-tablet', 'Tablette', 'tablet', C.blue, ['tablet']);
T('materiel', 'input-gaming', 'Manette', 'gamepad-2', C.blue);
T('materiel', 'printer', 'Imprimante', 'printer', C.blue);
T('materiel', 'scanner', 'Scanner', 'scan', C.blue);
T('materiel', 'camera-photo', 'Appareil photo', 'camera', C.blue);
T('materiel', 'camera-web', 'Webcam', 'webcam', C.blue);
T('materiel', 'camera-video', 'Caméra', 'video', C.blue);
T('materiel', 'phone', 'Téléphone', 'smartphone', C.blue, ['phone-apple-iphone']);
T('materiel', 'multimedia-player', 'Lecteur multimédia', 'music-4', C.blue);
T('materiel', 'modem', 'Modem', 'router', C.blue);
T('materiel', 'audio-headphones', 'Casque', 'headphones', C.blue);
T('materiel', 'audio-speakers', 'Haut-parleur', 'speaker', C.blue, ['audio-card']);
T('materiel', 'audio-input-microphone', 'Micro', 'mic', C.blue, ['microphone']);
T('materiel', 'bluetooth', 'Bluetooth', 'bluetooth', C.blue, ['preferences-system-bluetooth']);
T('materiel', 'network-wired', 'Réseau filaire', 'ethernet-port', C.green);
T('materiel', 'network-wireless', 'Wi-Fi', 'wifi', C.green);
T('materiel', 'ac-adapter', 'Secteur', 'plug-zap', C.teal);
T('materiel', 'uninterruptible-power-supply', 'Onduleur', 'zap', C.teal);
T('materiel', 'sindryos-processeur', 'Processeur', 'cpu', C.indigo, ['cpu']);
T('materiel', 'sindryos-memoire', 'Mémoire', 'memory-stick', C.indigo, ['memory']);

T('applis', 'org.xfce.thunar', 'Fichiers', 'folder-open', C.folder, ['system-file-manager', 'org.xfce.filemanager', 'file-manager']);
T('applis', 'gparted', 'Disques', 'hard-drive', C.blue);
T('applis', 'org.xfce.terminal', 'Terminal', 'square-terminal', C.slate, ['utilities-terminal', 'org.xfce.terminal-settings', 'org.xfce.terminalemulator', 'terminal']);
T('applis', 'org.xfce.mousepad', 'Éditeur de texte', 'notebook-pen', C.info, ['accessories-text-editor', 'text-editor']);
add('applis', 'org.xfce.ristretto', 'Images', photos(), ['image-viewer', 'eog']);
T('applis', 'org.xfce.appfinder', 'Recherche', 'search', C.slate, ['system-search', 'edit-find']);
T('applis', 'web-browser', 'Navigateur', 'globe', C.info, ['org.xfce.webbrowser', 'internet-web-browser', 'applications-internet']);
T('applis', 'org.xfce.about', 'À propos', 'info', C.info, ['help-about']);
T('applis', 'help-browser', 'Aide', 'circle-question-mark', C.info, ['help-contents', 'system-help', 'help-faq']);
T('applis', 'system-software-install', 'Installer', 'package-plus', C.teal, ['applications-other-install']);
T('applis', 'utilities-system-monitor', 'Moniteur système', 'activity', C.teal, ['org.xfce.taskmanager', 'gnome-system-monitor']);
T('applis', 'utilities-file-archiver', 'Archives', 'archive', C.amber, ['org.xfce.xarchiver', 'xarchiver']);
T('applis', 'accessories-calculator', 'Calculatrice', 'calculator', C.slate);
T('applis', 'accessories-screenshot', 'Capture d\'écran', 'image-plus', C.violet, ['org.xfce.screenshooter']);
T('applis', 'multimedia-volume-control', 'Son', 'volume-2', C.rose, ['org.xfce.pulseaudio', 'pavucontrol']);
T('applis', 'system-run', 'Exécuter', 'play', C.indigo);

T('reglages', 'org.xfce.settings.manager', 'Paramètres', 'sliders-horizontal', C.slate, ['preferences-system', 'preferences-desktop', 'preferences-other', 'applications-system', 'xfce4-settings']);
T('reglages', 'preferences-system-network', 'Connexions réseau', 'network', C.green, ['nm-connection-editor', 'network-manager']);
T('reglages', 'org.xfce.settings.appearance', 'Apparence', 'palette', C.violet, ['preferences-desktop-theme']);
T('reglages', 'org.xfce.settings.display', 'Écrans', 'monitor', C.blue, ['preferences-desktop-display']);
T('reglages', 'org.xfce.settings.keyboard', 'Clavier', 'keyboard', C.blue, ['preferences-desktop-keyboard']);
T('reglages', 'org.xfce.settings.mouse', 'Souris et pavé tactile', 'mouse', C.blue, ['preferences-desktop-peripherals']);
T('reglages', 'org.xfce.settings.accessibility', 'Accessibilité', 'accessibility', C.teal, ['preferences-desktop-accessibility']);
T('reglages', 'org.xfce.settings.color', 'Couleurs', 'pipette', C.rose, ['preferences-color']);
T('reglages', 'org.xfce.settings.default-applications', 'Applications par défaut', 'app-window', C.indigo, ['preferences-desktop-default-applications']);
T('reglages', 'org.xfce.settings.editor', 'Éditeur de réglages', 'list-tree', C.slate);
T('reglages', 'org.xfce.xfdesktop', 'Bureau et fond', 'wallpaper', C.violet, ['preferences-desktop-wallpaper']);
T('reglages', 'org.xfce.xfwm4', 'Fenêtres', 'app-window', C.slate, ['preferences-system-windows']);
T('reglages', 'org.xfce.xfwm4-tweaks', 'Fenêtres, plus de réglages', 'sliders-vertical', C.slate);
T('reglages', 'org.xfce.workspaces', 'Espaces de travail', 'layout-grid', C.indigo, ['preferences-desktop-workspaces']);
T('reglages', 'org.xfce.panel', 'Barre des tâches', 'panel-bottom', C.slate, ['xfce4-panel']);
T('reglages', 'org.xfce.powermanager', 'Alimentation', 'battery-charging', C.teal, ['preferences-system-power', 'xfce4-power-manager-settings']);
T('reglages', 'org.xfce.session', 'Session et démarrage', 'rocket', C.indigo, ['preferences-system-session']);
T('reglages', 'org.xfce.volman', 'Disques amovibles', 'usb', C.teal, ['drive-removable-media-settings']);
T('reglages', 'preferences-system-time', 'Date et heure', 'clock', C.slate, ['org.xfce.datetime']);
T('reglages', 'preferences-desktop-locale', 'Langue', 'languages', C.slate);

add('notifs', 'dialog-information', 'Information', coded('circle', C.info, 'info'), ['gtk-dialog-info', 'notification-information', 'sindryos-notif-information']);
add('notifs', 'emblem-ok', 'Réussite', coded('circle', C.teal, 'ok'), ['sindryos-notif-reussite', 'dialog-ok', 'task-complete']);
add('notifs', 'dialog-warning', 'Attention', coded('triangle', C.amber, 'warn'), ['gtk-dialog-warning', 'sindryos-notif-attention']);
add('notifs', 'dialog-error', 'Erreur', coded('octagon', C.red, 'err'), ['gtk-dialog-error', 'sindryos-notif-erreur']);
add('notifs', 'dialog-question', 'Question', coded('circle', C.violet, 'ask'), ['gtk-dialog-question']);
T('notifs', 'dialog-password', 'Mot de passe', 'key', C.slate, ['gtk-dialog-authentication', 'gcr-key', 'gcr-key-pair']);
T('notifs', 'notification-device', 'Clé branchée', 'usb', C.teal, ['sindryos-notif-usb']);
T('notifs', 'notification-network-wireless', 'Réseau connecté', 'wifi', C.blue, ['sindryos-notif-reseau', 'notification-network-wireless-full']);
T('notifs', 'notification-network-disconnected', 'Réseau coupé', 'wifi-off', C.red, ['sindryos-notif-reseau-coupe']);
T('notifs', 'software-update-available', 'Mise à jour', 'refresh-cw', C.indigo, ['system-software-update', 'sindryos-notif-maj']);
T('notifs', 'software-update-urgent', 'Mise à jour urgente', 'refresh-cw', C.red);
T('notifs', 'sindryos-notif-script', 'Script', 'square-terminal', C.violet);
T('notifs', 'sindryos-notif-script-encours', 'Script en cours', 'hourglass', C.indigo, ['appointment-soon']);
T('notifs', 'sindryos-notif-verrou', 'Disque verrouillé', 'lock-keyhole', C.amber);
T('notifs', 'security-high', 'Sécurité : bonne', 'shield-check', C.teal, ['channel-secure']);
T('notifs', 'security-medium', 'Sécurité : moyenne', 'shield-alert', C.amber, ['application-certificate-warning']);
T('notifs', 'security-low', 'Sécurité : faible', 'shield-x', C.red, ['channel-insecure']);
T('notifs', 'mail-unread', 'Message', 'mail', C.info, ['notification-message-im']);

add('barre', 'nm-signal-100', 'Wi-Fi 100 %', wifi(4), ['network-wireless-signal-excellent', 'network-wireless-connected-100']);
add('barre', 'nm-signal-75', 'Wi-Fi 75 %', wifi(3), ['network-wireless-signal-good', 'network-wireless-connected-75']);
add('barre', 'nm-signal-50', 'Wi-Fi 50 %', wifi(2), ['network-wireless-signal-ok', 'network-wireless-connected-50']);
add('barre', 'nm-signal-25', 'Wi-Fi 25 %', wifi(1), ['network-wireless-signal-weak', 'network-wireless-connected-25']);
add('barre', 'nm-signal-00', 'Wi-Fi 0 %', wifi(0), ['network-wireless-signal-none', 'network-wireless-connected-00']);
add('barre', 'nm-device-wired', 'Câble', tray(`<g transform="scale(4)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${LUCIDE['ethernet-port']}</g>`), ['network-idle', 'network-transmit-receive']);
add('barre', 'nm-device-wireless', 'Wi-Fi', wifi(4));
add('barre', 'nm-no-connection', 'Pas de réseau', tray(`<g transform="scale(4)" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${LUCIDE['wifi-off']}</g>`), ['network-offline', 'network-error', 'network-wireless-offline']);
add('barre', 'nm-secure-lock', 'Réseau sécurisé', tray(`<g transform="scale(4)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${LUCIDE.lock}</g>`));
add('barre', 'nm-vpn-active-lock', 'VPN actif', tray(`<g transform="scale(4)" fill="none" stroke="${AURORA_BRIGHT[0]}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${LUCIDE.lock}</g>`), ['network-vpn']);
add('barre', 'audio-volume-high', 'Son fort', volume(3));
add('barre', 'audio-volume-medium', 'Son moyen', volume(2));
add('barre', 'audio-volume-low', 'Son faible', volume(1));
add('barre', 'audio-volume-muted', 'Son coupé', volume(0));
add('barre', 'battery-full', 'Batterie pleine', battery(1, C.teal, false), ['battery', 'gpm-primary-100']);
add('barre', 'battery-full-charged', 'Batterie chargée', battery(1, C.teal, true), ['battery-full-charging']);
add('barre', 'battery-good', 'Batterie 70 %', battery(0.7, C.teal, false));
add('barre', 'battery-good-charging', 'Batterie 70 %, en charge', battery(0.7, C.teal, true));
add('barre', 'battery-low', 'Batterie 35 %', battery(0.35, C.amber, false));
add('barre', 'battery-low-charging', 'Batterie 35 %, en charge', battery(0.35, C.amber, true));
add('barre', 'battery-caution', 'Batterie 15 %', battery(0.15, C.red, false));
add('barre', 'battery-caution-charging', 'Batterie 15 %, en charge', battery(0.15, C.red, true), ['battery-empty-charging']);
add('barre', 'battery-empty', 'Batterie vide', battery(0.04, C.red, false));

T('session', 'system-shutdown', 'Éteindre', 'power', C.red, ['xfsm-shutdown', 'gnome-shutdown']);
T('session', 'system-reboot', 'Redémarrer', 'rotate-cw', C.blue, ['xfsm-reboot']);
T('session', 'system-log-out', 'Fermer la session', 'log-out', C.violet, ['xfsm-logout', 'application-exit']);
T('session', 'system-lock-screen', 'Verrouiller', 'lock', C.slate, ['xfsm-lock']);
T('session', 'system-suspend', 'Mettre en veille', 'moon', C.indigo, ['xfsm-suspend']);
T('session', 'system-hibernate', 'Hiberner', 'hard-drive-download', C.indigo, ['xfsm-hibernate']);
T('session', 'system-switch-user', 'Changer d\'utilisateur', 'users', C.teal, ['xfsm-switch-user']);
T('session', 'avatar-default', 'Session', 'user', C.indigo, ['user-info', 'stock_person', 'system-users']);
T('session', 'sindryos-windows', 'Redémarrer sous Windows', { solid: PANES }, '#3F5BD9');
T('session', 'sindryos-boot-choice', 'Démarrage', 'rocket', C.indigo);

D('text-x-generic', 'Texte', 'file-text', C.slate, ['text-plain', 'application-x-generic-text']);
D('text-x-script', 'Script', 'square-terminal', C.violet, ['application-x-shellscript', 'text-x-python', 'application-x-perl', 'text-x-powershell']);
D('text-x-log', 'Journal', 'scroll-text', C.slate, ['text-log']);
D('text-html', 'Page web', 'code-xml', C.teal, ['application-xhtml+xml']);
D('application-json', 'Données', 'braces', C.indigo, ['text-xml', 'application-xml', 'text-x-yaml']);
D('text-x-ms-regedit', 'Registre Windows', 'list-tree', C.blue, ['application-x-regedit']);
D('application-pdf', 'PDF', 'book-open', C.red, ['x-office-pdf']);
D('image-x-generic', 'Image', 'image', C.violet, ['image-png', 'image-jpeg']);
D('audio-x-generic', 'Son', 'music', C.rose);
D('video-x-generic', 'Vidéo', 'clapperboard', C.red);
D('package-x-generic', 'Archive', 'package', C.amber, ['application-zip', 'application-x-tar', 'application-x-compressed-tar', 'application-x-7z-compressed', 'application-x-rar', 'application-gzip', 'application-x-xz-compressed-tar', 'application-x-archive']);
D('application-x-cd-image', 'Image disque', 'disc-3', C.indigo, ['application-x-iso9660-image', 'application-x-raw-disk-image', 'application-vnd.efi.iso']);
D('application-x-executable', 'Programme', 'binary', C.slate, ['application-x-sharedlib', 'application-x-pie-executable', 'exec']);
D('application-x-ms-dos-executable', 'Programme Windows', { solid: PANES }, C.blue, ['application-x-msdownload', 'application-vnd.microsoft.portable-executable', 'application-x-msi', 'application-x-ms-shortcut']);
D('application-x-desktop', 'Lanceur', 'rocket', C.indigo);
D('font-x-generic', 'Police', 'type', C.slate);
D('x-office-document', 'Document', 'file-text', C.blue, ['application-vnd.oasis.opendocument.text', 'application-msword', 'application-vnd.openxmlformats-officedocument.wordprocessingml.document']);
D('x-office-spreadsheet', 'Tableur', 'table', C.green, ['application-vnd.oasis.opendocument.spreadsheet', 'application-vnd.ms-excel', 'application-vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text-csv']);
D('x-office-presentation', 'Présentation', 'presentation', C.amber, ['application-vnd.oasis.opendocument.presentation', 'application-vnd.ms-powerpoint', 'application-vnd.openxmlformats-officedocument.presentationml.presentation']);
D('application-certificate', 'Certificat', 'badge-check', C.teal, ['gcr-certificate']);
D('unknown', 'Inconnu', 'file-question', C.slate, ['application-octet-stream', 'application-x-generic']);
T('fichiers', 'image-missing', 'Image manquante', 'image-off', C.slate);
T('fichiers', 'image-loading', 'Image en chargement', 'loader', C.slate);

add('emblemes', 'emblem-symbolic-link', 'Raccourci', canvas((k) => k.faceted(SHAPE.circle, C.info) + STATUS_GLYPH.link('#fff')), ['emblem-link']);
add('emblemes', 'emblem-readonly', 'Lecture seule', emblem(C.slate, 'lock'), ['emblem-locked']);
add('emblemes', 'emblem-unreadable', 'Illisible', emblem(C.red, 'x'));
add('emblemes', 'emblem-default', 'Validé', emblem(C.teal, 'check'), ['emblem-checked']);
add('emblemes', 'emblem-important', 'Important', emblem(C.amber, 'triangle-alert'), ['emblem-urgent']);
add('emblemes', 'emblem-synchronizing', 'Synchronisation', emblem(C.indigo, 'refresh-cw'));

T('categories', 'applications-accessories', 'Accessoires', 'puzzle', C.slate);
T('categories', 'applications-development', 'Développement', 'code', C.indigo);
T('categories', 'applications-education', 'Éducation', 'graduation-cap', C.green);
T('categories', 'applications-games', 'Jeux', 'gamepad-2', C.rose);
T('categories', 'applications-graphics', 'Graphisme', 'pen-tool', C.violet);
T('categories', 'applications-multimedia', 'Multimédia', 'clapperboard', C.red);
T('categories', 'applications-office', 'Bureautique', 'briefcase', C.amber);
T('categories', 'applications-other', 'Autres', 'shapes', C.slate);
T('categories', 'applications-science', 'Sciences', 'flask-conical', C.teal);
T('categories', 'applications-utilities', 'Utilitaires', 'wrench', C.slate);

add('sindry', 'sindryos-disque-windows', 'Disque Windows', canvas((k) => k.faceted('<rect x="14" y="7" width="68" height="82" rx="5"/>', '#3F5BD9') + symbol({ solid: PANES }, 'translate(27 16) scale(1.75)', '#fff') + `<path d="M22 76h6v6h-6z" fill="${AURORA_BRIGHT[0]}"/><path d="M33 76h20v5H33z" fill="${NIGHT.dark}" fill-opacity=".5"/>`));
add('sindry', 'sindryos-data', 'SINDRY-DATA', stick(stickMark({ solid: FLAME })));
add('sindry', 'sindryos-cle-demarrage', 'Clé de démarrage', stick(stickMark('power')));
T('sindry', 'sindryos-scripts', 'Scripts', 'file-terminal', C.violet);
T('sindry', 'sindryos-analyse', 'Analyse', 'scan-search', C.teal);
T('sindry', 'sindryos-reparation', 'Réparation', 'wrench', C.indigo);
T('sindry', 'sindryos-sante', 'État du PC', 'heart-pulse', C.rose);
T('sindry', 'sindryos-journaux', 'Journaux', 'scroll-text', C.slate);
T('sindry', 'sindryos-sauvegarde', 'Sauvegarde', 'database', C.blue);
T('sindry', 'sindryos-restauration', 'Restauration', 'archive-restore', C.teal);
T('sindry', 'sindryos-retour', 'Retour arrière', 'undo-2', C.amber);
T('sindry', 'sindryos-registre', 'Registre', 'list-tree', C.blue);
T('sindry', 'sindryos-bitlocker', 'Disque chiffré', 'lock-keyhole', C.amber);
T('sindry', 'sindryos-mise-a-jour', 'Mise à jour de Sindry', 'chevrons-up', C.indigo);

// ---------------------------------------------------------------- output

const THEME_DIRS = {
  apps: 'Applications', actions: 'Actions', categories: 'Categories', devices: 'Devices',
  emblems: 'Emblems', mimetypes: 'MimeTypes', places: 'Places', status: 'Status',
};
const seen = new Set();
for (const icon of ICONS) {
  for (const n of [icon.name, ...icon.aliases]) {
    if (seen.has(n)) throw new Error(`nom en double : ${n}`);
    seen.add(n);
  }
}

if (COMMAND === 'build') {
  const out = ARGS[1];
  for (const icon of ICONS) {
    const dir = join(out, SECTIONS[icon.section][0]);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${icon.name}.svg`), icon.svg);
  }
  writeFileSync(join(out, 'index.json'), `${JSON.stringify({
    sections: Object.fromEntries(Object.entries(SECTIONS).map(([k, [dir, label]]) => [k, { dossier: dir, titre: label }])),
    icones: ICONS.map(({ section, name, label, aliases }) => ({ section, nom: name, label, alias: aliases })),
  }, null, 1)}\n`);
  console.log(`[OK] ${ICONS.length} dessins, ${seen.size} noms`);
} else if (COMMAND === 'theme') {
  const out = ARGS[1];
  for (const icon of ICONS) {
    const dir = join(out, 'scalable', SECTIONS[icon.section][0]);
    mkdirSync(dir, { recursive: true });
    for (const n of [icon.name, ...icon.aliases]) writeFileSync(join(dir, `${n}.svg`), icon.svg);
  }
  const dirs = Object.keys(THEME_DIRS).map((d) => `scalable/${d}`);
  writeFileSync(join(out, 'index.theme'), `[Icon Theme]\nName=Prisme\nComment=Icônes de SindryOS, en facettes, sur Adwaita\nInherits=Adwaita,hicolor\nDirectories=${dirs.join(',')}\n\n${Object.entries(THEME_DIRS).map(([d, c]) => `[scalable/${d}]\nSize=48\nMinSize=16\nMaxSize=512\nType=Scalable\nContext=${c}\n`).join('\n')}`);
  console.log(`[OK] thème : ${seen.size} fichiers pour ${ICONS.length} dessins`);
} else {
  console.error('commande : traces, build ou theme');
  process.exit(1);
}

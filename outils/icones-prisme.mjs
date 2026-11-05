// SindryOS's icon sets, « Prisme » (family E of M54), in two lots drawn from one table:
//   sans-fond   every icon is an object on its own, like « Ce PC » or « Disque dur »;
//   avec-fond   every icon is a white symbol on a square tile, like « Scanner » or « Aide ».
// Every icon is a plain SVG: no filter, no CSS, no script, so librsvg can draw it at build time and no
// graphics card is needed. The symbols come from Lucide (ISC, see LICENCE-LUCIDE.txt).
//
//   node icones-prisme.mjs traces <lucide icons dir> <glyph list> <traces.json>   refresh the symbols
//   node icones-prisme.mjs build <traces.json> <lot> <out dir>    one file per drawing, plus index.json
//   node icones-prisme.mjs theme <traces.json> <lot> <dir>        a ready icon theme, aliases included
//   node icones-prisme.mjs allumage <traces.json> <out dir>       the launcher's four versions
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
  amber: '#EE9326', folder: '#E39A2C', red: '#D63A5C', slate: '#566089', rose: '#C2469A', windows: '#3F5BD9',
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
const LIT = 'M0 0H66L20 96H0z', SHADED = 'M96 96V34L56 96z';

// Own line symbols, on Lucide's 24 unit grid, for what it has no symbol for.
const OWN = {
  stick: '<path d="M9 8.5V3.2h6v5.3"/><rect x="6.8" y="8.5" width="10.4" height="12.5" rx="2.4"/><path d="M11 5.8h.01M13 5.8h.01M12 12.2v4.6"/>',
  ssd: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6.5 10h3.5v4H6.5zM12 10h3.5v4H12zM18.5 10h.01M18.5 14h.01"/>',
  external: '<rect x="6" y="6.5" width="12" height="15" rx="2"/><path d="M10 6.5V2.5h4v4M12 11v5.5"/>',
  sd: '<path d="M7.5 2H16l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5.5z"/><path d="M8.5 6v3.5M12 6v3.5M15.5 6v3.5"/>',
  windowsDisk: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.8 6.5h2.7v2.7H8.8zM12.5 6.5h2.7v2.7h-2.7zM8.8 10.2h2.7v2.7H8.8zM12.5 10.2h2.7v2.7h-2.7zM9 17.5h.01M12.5 17.5h3"/>',
  wiredOff: `<path d="M2 2l20 20"/>`,
};
const WIRED_OFF = `${LUCIDE['ethernet-port'] ?? ''}${OWN.wiredOff}`;

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
      return `<g fill="${colour}">${markup}</g><g clip-path="url(#${id})"><path d="${LIT}" fill="#fff" fill-opacity=".17"/><path d="${SHADED}" fill="${NIGHT.dark}" fill-opacity=".26"/></g>`;
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

// A symbol: a Lucide name; { line } own line markup; { solid } filled; { outline, inner } a Lucide
// outline holding a smaller symbol (a folder or a page with its kind).
function lineMarkup(spec) {
  if (typeof spec === 'string') {
    if (!(spec in LUCIDE)) throw new Error(`symbole inconnu : ${spec}`);
    return LUCIDE[spec];
  }
  if (spec.line) return spec.line;
  throw new Error('symbole sans tracé');
}
function symbol(spec, transform, colour, width) {
  if (spec.solid) return `<g transform="${transform}" fill="${colour}">${spec.solid}</g>`;
  const attrs = `fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;
  if (spec.outline) {
    const [x, y] = spec.outline === 'folder' ? [6.5, 7.6] : [6.5, 9.2];
    const inner = spec.inner.solid
      ? `<g transform="translate(${x} ${y}) scale(.46)" fill="${colour}" stroke="none">${spec.inner.solid}</g>`
      : `<g transform="translate(${x} ${y}) scale(.46)" stroke-width="${(width * 0.84) / 0.46}">${lineMarkup(spec.inner)}</g>`;
    return `<g transform="${transform}" ${attrs}>${LUCIDE[spec.outline]}${inner}</g>`;
  }
  return `<g transform="${transform}" ${attrs}>${lineMarkup(spec)}</g>`;
}

const tileRaw = (inner, colour) => canvas((k) => k.faceted(SHAPE.tile, colour) + inner);
const tile = (spec, colour) => tileRaw(symbol(spec, 'translate(15 15) scale(2.75)', '#fff', 2), colour);

// Turns a line symbol into a filled one: closed forms become flat colour with facets, open strokes
// stay strokes in the same tones, and what sits inside a closed form stands out on top of it.
function pathBox(d) {
  // Read number by number: Lucide writes some arc flags without a separator (« 0 00-1.7 »).
  let at = 0, x = 0, y = 0, cmd = '';
  const xs = [], ys = [];
  const skip = () => { while (at < d.length && /[\s,]/.test(d[at])) at++; };
  const number = () => { skip(); const m = /^[+-]?(\d*\.\d+|\d+\.?)(e[+-]?\d+)?/i.exec(d.slice(at)); at += m[0].length; return Number(m[0]); };
  const flag = () => { skip(); return d[at++]; };
  const put = (a, b) => { x = a; y = b; xs.push(a); ys.push(b); };
  for (skip(); at < d.length; skip()) {
    if (/[a-zA-Z]/.test(d[at])) cmd = d[at++];
    const rel = cmd === cmd.toLowerCase();
    const X = () => (rel ? x : 0) + number(), Y = () => (rel ? y : 0) + number();
    switch (cmd.toLowerCase()) {
      case 'm': case 'l': case 't': { const a = X(), b = Y(); put(a, b); if (cmd === 'm') cmd = 'l'; if (cmd === 'M') cmd = 'L'; break; }
      case 'h': put(X(), y); break;
      case 'v': put(x, Y()); break;
      case 'c': { const a = X(), b = Y(), c = X(), e = Y(), f = X(), g = Y(); xs.push(a, c); ys.push(b, e); put(f, g); break; }
      case 's': case 'q': { const a = X(), b = Y(), f = X(), g = Y(); xs.push(a); ys.push(b); put(f, g); break; }
      case 'a': { number(); number(); number(); flag(); flag(); const f = X(), g = Y(); put(f, g); break; }
      default: break; // z takes no number
    }
  }
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
function parseSymbol(markup) {
  const list = [];
  for (const m of markup.matchAll(/<(path|rect|circle|ellipse|line|polyline|polygon)\b([^>]*?)\/>/g)) {
    const [, tag, raw] = m;
    const a = Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map((v) => [v[1], v[2]]));
    const n = (k) => Number(a[k] ?? 0);
    let box, closed = false;
    if (tag === 'rect') { box = [n('x'), n('y'), n('x') + n('width'), n('y') + n('height')]; closed = true; }
    else if (tag === 'circle') { box = [n('cx') - n('r'), n('cy') - n('r'), n('cx') + n('r'), n('cy') + n('r')]; closed = true; }
    else if (tag === 'ellipse') { box = [n('cx') - n('rx'), n('cy') - n('ry'), n('cx') + n('rx'), n('cy') + n('ry')]; closed = true; }
    else if (tag === 'line') box = [Math.min(n('x1'), n('x2')), Math.min(n('y1'), n('y2')), Math.max(n('x1'), n('x2')), Math.max(n('y1'), n('y2'))];
    else if (tag === 'path') { box = pathBox(a.d); closed = /z\s*$/i.test(a.d); }
    else { const p = a.points.trim().split(/[\s,]+/).map(Number); const xs = p.filter((_, i) => !(i % 2)), ys = p.filter((_, i) => i % 2); box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; closed = tag === 'polygon'; }
    list.push({ source: m[0], box, closed });
  }
  return list;
}
const area = (b) => Math.max(0.01, b[2] - b[0]) * Math.max(0.01, b[3] - b[1]);
const inside = (a, b, margin = 0.05) => a[0] >= b[0] - margin && a[1] >= b[1] - margin && a[2] <= b[2] + margin && a[3] <= b[3] + margin;

// By symbol, by index of its parts: `fill` closes open strokes (a printer's body), `open` keeps a closed
// form as a stroke (a magnifier's lens), `keep` holds a part in the silhouette although it lies inside
// another, `mark` draws a part as a detail although it lies outside; `width` changes the strokes.
const SOLID = JSON.parse(readFileSync(new URL('./icones-prisme-formes.json', import.meta.url), 'utf8'));

function solid(spec, colour, tones) {
  if (spec.solid) {
    return canvas((k) => {
      const body = spec.solid.replace(/<(rect|path|circle)([^>]*)\/>/g, (s, t, rest) => `<${t} transform="translate(6 6) scale(3.5)"${rest}/>`);
      return k.faceted(body, colour);
    });
  }
  const name = typeof spec === 'string' ? spec : spec.name ?? '';
  const opts = SOLID[name] ?? {};
  const parts = parseSymbol(lineMarkup(spec));
  const has = (key, i) => (opts[key] ?? []).includes(i);
  parts.forEach((p, i) => { if (has('fill', i)) p.closed = true; if (has('open', i)) p.closed = false; });
  // The depth of a part: how many closed forms hold it.
  parts.forEach((p, i) => {
    if (has('keep', i)) p.depth = 0;
    else if (has('mark', i)) p.depth = 1;
    else p.depth = parts.filter((q, j) => j !== i && q.closed && !has('keep', j) && !has('mark', j) && area(q.box) > area(p.box) * 1.3 && inside(p.box, q.box)).length;
  });
  // The tiles' slate is too dim for a form that stands alone on the dark theme.
  const body = colour === C.slate ? '#8592CC' : colour;
  const [base, lit, dark, mark, mark2] = tones ?? [body, shade(body, 0.22), shade(body, -0.3), '#FFFFFF', NIGHT.surface];
  const width = opts.width ?? 2;
  const closed = parts.filter((p) => p.closed && !p.depth).map((p) => p.source).join('');
  const open = parts.filter((p) => !p.closed && !p.depth).map((p) => p.source).join('');
  const silhouette = (tone) => `<g transform="translate(6 6) scale(3.5)" stroke="${tone}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><g fill="${tone}">${closed}</g><g fill="none">${open}</g></g>`;
  const details = (depth, tone) => {
    const list = parts.filter((p) => p.depth === depth);
    if (!list.length) return '';
    const closedDetail = list.filter((p) => p.closed).map((p) => p.source).join('');
    const openDetail = list.filter((p) => !p.closed).map((p) => p.source).join('');
    return `<g transform="translate(6 6) scale(3.5)" stroke="${tone}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><g fill="${tone}">${closedDetail}</g><g fill="none">${openDetail}</g></g>`;
  };
  return canvas((k) => {
    k.def(`<clipPath id="l"><path d="${LIT}"/></clipPath><clipPath id="s"><path d="${SHADED}"/></clipPath>`);
    return `${silhouette(base)}<g clip-path="url(#l)">${silhouette(lit)}</g><g clip-path="url(#s)">${silhouette(dark)}</g>${details(1, mark)}${details(2, mark2)}${details(3, mark)}`;
  });
}
// In the taskbar: the same forms in white, for the dark bar, details cut in the bar's colour.
const WHITE = ['#FFFFFF', '#FFFFFF', '#C9D0EE', NIGHT.surface, '#FFFFFF'];
const barSolid = (spec) => solid(spec, '#FFFFFF', WHITE);
// A slash across a filled form, with a gap around it so that it stands out.
const slashed = (svg) => svg.replace('</svg>', `<path d="M13 13l70 70" fill="none" stroke="${NIGHT.surface}" stroke-width="15" stroke-linecap="round"/><path d="M13 13l70 70" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round"/></svg>`);

const FOLDER_BACK = '<path d="M8 26a6 6 0 0 1 6-6h21a6 6 0 0 1 4.2 1.8L47 30h35a6 6 0 0 1 6 6v8H8z"/>';
const folder = (spec, colour) => canvas((k) => `<g fill="${shade(colour, -0.28)}">${FOLDER_BACK}</g>`
  + k.faceted('<path d="M8 42a6 6 0 0 1 6-6h68a6 6 0 0 1 6 6v36a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z"/>', colour)
  + (spec ? symbol(spec, 'translate(31 43) scale(1.4167)', '#fff', 2.5) : ''));
const folderOpen = (colour) => canvas((k) => `<g fill="${shade(colour, -0.28)}">${FOLDER_BACK}</g>`
  + k.faceted('<path d="M5 48a5 5 0 0 1 5-5h76a4 4 0 0 1 3.9 4.9l-7 31a6 6 0 0 1-5.8 4.7H14a6 6 0 0 1-6-5.5z"/>', colour));

const PAGE = '<path d="M20 7h36l26 26v50a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V13a6 6 0 0 1 6-6z"/>';
const doc = (spec, colour) => canvas((k) => k.faceted(PAGE, colour)
  + `<path d="M56 7l26 26H62a6 6 0 0 1-6-6z" fill="#fff" fill-opacity=".45"/>`
  + symbol(spec, 'translate(27 38) scale(1.75)', '#fff', 2.3));

const STATUS_GLYPH = {
  info: (c) => `<g fill="${c}"><circle cx="48" cy="28" r="6.4"/><rect x="42" y="41" width="12" height="33" rx="6"/></g>`,
  ok: (c) => `<path d="M27 50l15 15 28-33" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`,
  warn: (c) => `<g fill="${c}"><rect x="42.5" y="34" width="11" height="28" rx="5.5"/><circle cx="48" cy="72" r="6"/></g>`,
  err: (c) => `<path d="M32 32l32 32M64 32L32 64" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round"/>`,
  ask: (c) => `<path d="M34.5 36a13.5 13.5 0 1 1 20 11.8c-4 2.2-6.5 4.7-6.5 9" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/><circle fill="${c}" cx="48" cy="72.5" r="6"/>`,
  link: (c) => `<g fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><path d="M31 65l32-32M42 31h22v22"/></g>`,
};
const coded = (shape, colour, mark) => canvas((k) => k.faceted(SHAPE[shape], colour) + STATUS_GLYPH[mark]('#fff'));
const emblem = (colour, spec) => canvas((k) => k.faceted(SHAPE.circle, colour) + symbol(spec, 'translate(18 18) scale(2.5)', '#fff', 2.6));

// Wi-Fi by level and sound by level, on the bar.
const WIFI = ['M12 20h.01', 'M8.5 16.429a5 5 0 0 1 7 0', 'M5 12.859a10 10 0 0 1 14 0', 'M2 8.82a15 15 0 0 1 20 0'];
const wifiArcs = (level, transform) => `<g transform="${transform}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round">${WIFI.map((d, i) => `<path d="${d}"${i < level ? '' : ' stroke-opacity=".28"'}/>`).join('')}</g>`;
const SPEAKER = '<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" fill="#fff" stroke="none"/>';
function speakerLevels(level) {
  const waves = ['M15 9a5 5 0 0 1 0 6', 'M18.5 6.5a9 9 0 0 1 0 11'];
  if (!level) return `${SPEAKER}<path d="M16 9.5l5 5M21 9.5l-5 5" stroke="${shade(C.red, 0.25)}"/>`;
  return SPEAKER + waves.map((d, i) => `<path d="${d}"${i < level - 1 ? '' : ' stroke-opacity=".28"'}/>`).join('');
}
const barLine = (inner) => canvas(() => `<g transform="scale(4)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`);

function battery(level, colour, charging) { // level 0 to 1
  return canvas((k) => {
    const width = Math.max(4, Math.round(level * 64));
    const fill = k.clip('<rect x="10" y="30" width="68" height="36" rx="6"/>');
    return `<rect x="6" y="26" width="76" height="44" rx="9" fill="${NIGHT.surface}" stroke="${NIGHT.text}" stroke-width="4"/><rect x="85" y="39" width="6" height="18" rx="2.5" fill="${NIGHT.text}"/>`
      + `<g clip-path="${fill}"><rect x="12" y="32" width="${width}" height="32" rx="3" fill="${colour}"/><path d="M12 32h${Math.round(width * 0.7)}L12 64z" fill="#fff" fill-opacity=".2"/></g>`
      + (charging ? '<path d="M50 28L30 52h13l-3 17 21-25H47z" fill="#fff" stroke="#121A33" stroke-width="2.5" stroke-linejoin="round"/>' : '');
  });
}

// ---------------------------------------------------------------- the launcher

// The power symbol, its bar replaced by a flame. In the 96 unit frame, as filled shapes, so that the
// coloured version can take the same facets as every other icon.
const RING = (() => {
  const p = (r, a) => `${(48 + r * Math.sin((a * Math.PI) / 180)).toFixed(2)} ${(57 - r * Math.cos((a * Math.PI) / 180)).toFixed(2)}`;
  return `<path d="M${p(38.5, 44)}A38.5 38.5 0 1 1 ${p(38.5, 316)}L${p(27.5, 316)}A27.5 27.5 0 1 0 ${p(27.5, 44)}z"/>`;
})();
const IGNITION_FLAME = '<path transform="translate(15.2 .28) scale(.68)" d="M50 4c2 10 10 15 15 22 3.6 5 5.3 10 5.3 15.5a22 22 0 0 1-44 .5c0-7 3-12.3 7.5-16.3 1 5.3 3.8 8.6 7.8 9.8C40 24.5 43 13 50 4z"/>';
const ignitionFlat = (ring, flame) => `<g fill="${ring}">${RING}</g><g fill="${flame}">${IGNITION_FLAME}</g>`;
const IGNITION = {
  clair: () => canvas(() => ignitionFlat('#FFFFFF', '#FFFFFF')),
  sombre: () => canvas(() => ignitionFlat('#141A2E', '#141A2E')),
  couleur: () => canvas((k) => k.faceted(RING, C.indigo) + k.faceted(IGNITION_FLAME, '#F58A2A')),
  officiel: () => canvas(() => ignitionFlat('#A9B1C1', '#FD7D26')),
};
const ignitionTile = () => tileRaw(`<g transform="translate(15.36 15.36) scale(.68)">${ignitionFlat('#FFFFFF', '#FFFFFF')}</g>`, C.indigo);

// ---------------------------------------------------------------- the objects

function monitorScreen(k, x, y, w, h) {
  const c = k.clip(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3.5"/>`);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3.5" fill="${NIGHT.surface}"/><g clip-path="${c}"><g transform="translate(${x} ${y}) scale(${w / 68} ${h / 45})"><path d="M0 45V20L28 45z" fill="${AURORA[0]}"/><path d="M14 45L36 9l10 36z" fill="${AURORA_BRIGHT[1]}"/><path d="M36 9l26 36H46z" fill="${AURORA[1]}"/><path d="M46 45l22-30v30z" fill="${AURORA[2]}"/></g></g>`;
}
const STAND = `<g fill="${NIGHT.part}"><path d="M40 66h16l3.5 13h-23z"/><rect x="25" y="77" width="46" height="8" rx="4"/></g>`;
const computer = () => canvas((k) => STAND + k.faceted('<rect x="7" y="11" width="82" height="59" rx="5"/>', C.indigo) + monitorScreen(k, 14, 18, 68, 45));
const display = () => canvas((k) => {
  const c = k.clip('<rect x="14" y="18" width="68" height="45" rx="3.5"/>');
  return `${STAND}${k.faceted('<rect x="7" y="11" width="82" height="59" rx="5"/>', C.blue)}<rect x="14" y="18" width="68" height="45" rx="3.5" fill="${shade(C.blue, 0.25)}"/><g clip-path="${c}"><path d="M14 63V18h44z" fill="#fff" fill-opacity=".25"/></g>`;
});
const laptop = () => canvas((k) => k.faceted('<rect x="15" y="13" width="66" height="53" rx="5"/>', C.indigo) + monitorScreen(k, 21, 19, 54, 41)
  + `<g fill="${NIGHT.part}"><path d="M5 68h86l-3.5 10a5 5 0 0 1-4.7 3.3H13.2A5 5 0 0 1 8.5 78z"/></g><rect x="38" y="68" width="20" height="4" rx="2" fill="#7F8BD8"/>`);
const disk = (colour, inside_) => canvas((k) => k.faceted('<rect x="14" y="7" width="68" height="82" rx="5"/>', colour) + inside_(k)
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
const stickMark = (spec) => () => `<rect x="33" y="39" width="30" height="42" rx="5" fill="${NIGHT.surface}"/>${symbol(spec, 'translate(36.5 48.5) scale(.9583)', '#fff', 2.4)}`;
const optical = () => canvas((k) => {
  const d = 'M48 7a41 41 0 1 0 0 82 41 41 0 0 0 0-82zm0 32a9 9 0 1 1 0 18 9 9 0 0 1 0-18z';
  const c = k.clip(`<path clip-rule="evenodd" d="${d}"/>`);
  return `<path fill-rule="evenodd" fill="#8E9CF5" d="${d}"/><g clip-path="${c}"><path d="M48 48L48 0 96 0 96 30z" fill="${AURORA_BRIGHT[0]}" fill-opacity=".75"/><path d="M48 48L96 66 96 96 70 96z" fill="${AURORA[2]}" fill-opacity=".8"/><path d="M48 48L48 96 0 96 0 66z" fill="${AURORA[1]}" fill-opacity=".85"/><path d="M48 48L0 30 0 0 26 0z" fill="#fff" fill-opacity=".4"/></g><path fill-rule="evenodd" d="M48 30a18 18 0 1 0 0 36 18 18 0 0 0 0-36zm0 9a9 9 0 1 1 0 18 9 9 0 0 1 0-18z" fill="#fff" fill-opacity=".45"/>`;
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
  return `<g fill="${NIGHT.part}"><rect x="16" y="9" width="70" height="56" rx="7" transform="rotate(-8 51 37)"/></g>${k.faceted('<rect x="7" y="21" width="78" height="66" rx="5"/>', C.violet)}<rect x="14" y="28" width="64" height="52" rx="3.5" fill="${NIGHT.surface}"/>`
    + `<path d="${roundPoly([[60, 36], [65, 38], [67, 43], [65, 48], [60, 50], [55, 48], [53, 43], [55, 38]], 1)}" fill="${EMBER}"/><g clip-path="${c}"><path d="M12 80l26-34 6 34z" fill="${AURORA_BRIGHT[1]}"/><path d="M38 46l24 34H44z" fill="${AURORA[1]}"/><path d="M44 80l16-22 4 22z" fill="${AURORA_BRIGHT[2]}"/><path d="M60 58l20 22H64z" fill="${AURORA[2]}"/></g>`;
});
const flatbed = () => canvas((k) => `<rect x="10" y="21" width="76" height="15" rx="4" fill="${NIGHT.part}"/><rect x="16" y="33" width="64" height="6" fill="${NIGHT.surface}"/>`
  + k.faceted('<rect x="5" y="38" width="86" height="40" rx="6"/>', C.blue)
  + `<rect x="14" y="48" width="68" height="7" rx="3.5" fill="${AURORA_BRIGHT[0]}"/><rect x="14" y="63" width="30" height="5" rx="2.5" fill="${NIGHT.dark}" fill-opacity=".5"/><circle cx="78" cy="65.5" r="4" fill="${NIGHT.text}"/>`);
const windowsDisk = () => canvas((k) => k.faceted('<rect x="14" y="7" width="68" height="82" rx="5"/>', C.windows) + symbol({ solid: PANES }, 'translate(27 16) scale(1.75)', '#fff') + `<path d="M22 76h6v6h-6z" fill="${AURORA_BRIGHT[0]}"/><path d="M33 76h20v5H33z" fill="${NIGHT.dark}" fill-opacity=".5"/>`);

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
// `free` draws the sans-fond version; `tiled` the avec-fond one. Both default from the symbol.
function I(section, name, label, spec, colour, aliases = [], free = null, tiled = null) {
  ICONS.push({ section, name, label, aliases, free: free ?? (() => solid(spec, colour)), tiled: tiled ?? (() => tile(spec, colour)) });
}
const F = (name, label, spec, colour, aliases = []) => I('lieux', name, label, spec, colour, aliases, () => folder(spec, colour), () => tile({ outline: 'folder', inner: spec }, colour));
const D = (name, label, spec, colour, aliases = []) => I('fichiers', name, label, spec, colour, aliases, () => doc(spec, colour), () => tile({ outline: 'file', inner: spec }, colour));
const N = (name, label, shape, colour, mark, spec, aliases = []) => I('notifs', name, label, spec, colour, aliases, () => coded(shape, colour, mark));
// On the bar: white on the bar in the sans-fond lot, a tile in the avec-fond lot.
const B = (name, label, spec, colour, aliases = [], free = null, tiled = null) => I('barre', name, label, spec, colour, aliases, free ?? (() => barSolid(spec)), tiled);

I('lieux', 'computer', 'Ce PC', 'monitor', C.indigo, ['user-computer'], computer);
ICONS.push({ section: 'lieux', name: 'folder', label: 'Dossier', aliases: ['inode-directory', 'folder-visiting', 'stock_folder', 'gtk-directory'], free: () => folder(null, C.folder), tiled: () => tile('folder', C.folder) });
I('lieux', 'folder-open', 'Dossier ouvert', 'folder-open', C.folder, ['folder-drag-accept', 'stock_folder-copy', 'stock_folder-move'], () => folderOpen(C.folder));
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
I('lieux', 'user-trash', 'Corbeille vide', 'trash-2', C.slate, ['trashcan_empty'], trash);
I('lieux', 'user-trash-full', 'Corbeille pleine', 'trash-2', C.amber, ['trashcan_full'], trashFull);
I('lieux', 'user-bookmarks', 'Favoris', 'star', C.folder, ['bookmark-new']);
I('lieux', 'document-open-recent', 'Récents', 'history', C.slate);
I('lieux', 'network-workgroup', 'Réseau', 'network', C.green, ['gnome-fs-network']);
I('lieux', 'network-server', 'Serveur', 'server', C.green);

I('materiel', 'drive-harddisk', 'Disque dur', 'hard-drive', C.blue, ['gnome-dev-harddisk', 'drive-harddisk-ieee1394', 'drive-harddisk-system'], () => disk(C.blue, platter));
I('materiel', 'drive-harddisk-solidstate', 'Disque SSD', { line: OWN.ssd }, C.indigo, ['drive-harddisk-nvme'], ssd);
I('materiel', 'drive-removable-media', 'Disque externe', { line: OWN.external }, C.teal, ['media-removable', 'drive-harddisk-usb'], removable);
I('materiel', 'drive-removable-media-usb', 'Clé USB', { line: OWN.stick }, C.teal, ['media-removable-usb'], () => stick(stickArrow));
I('materiel', 'drive-optical', 'Lecteur optique', 'disc-3', C.indigo, ['media-optical', 'media-optical-cd', 'media-optical-dvd', 'media-optical-bd'], optical);
I('materiel', 'media-flash', 'Carte mémoire', { line: OWN.sd }, C.violet, ['media-flash-sd-mmc'], sdCard);
I('materiel', 'media-floppy', 'Disquette', 'save', C.slate, [], floppy);
I('materiel', 'computer-laptop', 'Portable', 'laptop', C.indigo, ['laptop'], laptop);
I('materiel', 'video-display', 'Écran', 'monitor', C.blue, ['monitor'], display);
I('materiel', 'input-keyboard', 'Clavier', 'keyboard', C.blue, ['keyboard']);
I('materiel', 'input-mouse', 'Souris', 'mouse', C.blue, ['mouse']);
I('materiel', 'input-tablet', 'Tablette', 'tablet', C.blue, ['tablet']);
I('materiel', 'input-gaming', 'Manette', 'gamepad-2', C.blue);
I('materiel', 'printer', 'Imprimante', 'printer', C.blue);
I('materiel', 'scanner', 'Scanner', 'scan', C.blue, [], flatbed);
I('materiel', 'camera-photo', 'Appareil photo', 'camera', C.blue);
I('materiel', 'camera-web', 'Webcam', 'webcam', C.blue);
I('materiel', 'camera-video', 'Caméra', 'video', C.blue);
I('materiel', 'phone', 'Téléphone', 'smartphone', C.blue, ['phone-apple-iphone']);
I('materiel', 'multimedia-player', 'Lecteur multimédia', 'music-4', C.blue);
I('materiel', 'modem', 'Modem', 'router', C.blue);
I('materiel', 'audio-headphones', 'Casque', 'headphones', C.blue);
I('materiel', 'audio-speakers', 'Haut-parleur', 'speaker', C.blue, ['audio-card']);
I('materiel', 'audio-input-microphone', 'Micro', 'mic', C.blue, ['microphone']);
I('materiel', 'bluetooth', 'Bluetooth', 'bluetooth', C.blue, ['preferences-system-bluetooth']);
I('materiel', 'network-wired', 'Réseau filaire', 'ethernet-port', C.green);
I('materiel', 'network-wireless', 'Wi-Fi', 'wifi', C.green);
I('materiel', 'ac-adapter', 'Secteur', 'plug-zap', C.teal);
I('materiel', 'uninterruptible-power-supply', 'Onduleur', 'zap', C.teal);
I('materiel', 'sindryos-processeur', 'Processeur', 'cpu', C.indigo, ['cpu']);
I('materiel', 'sindryos-memoire', 'Mémoire', 'memory-stick', C.indigo, ['memory']);

I('applis', 'org.xfce.thunar', 'Fichiers', 'folder-open', C.folder, ['system-file-manager', 'org.xfce.filemanager', 'file-manager'], () => folderOpen(C.folder));
I('applis', 'gparted', 'Disques', 'hard-drive', C.blue, [], () => disk(C.info, platter));
I('applis', 'org.xfce.terminal', 'Terminal', 'square-terminal', C.slate, ['utilities-terminal', 'org.xfce.terminal-settings', 'org.xfce.terminalemulator', 'terminal']);
I('applis', 'org.xfce.mousepad', 'Éditeur de texte', 'notebook-pen', C.info, ['accessories-text-editor', 'text-editor']);
I('applis', 'org.xfce.ristretto', 'Images', 'image', C.violet, ['image-viewer', 'eog'], photos);
I('applis', 'org.xfce.appfinder', 'Recherche', 'search', C.slate, ['system-search', 'edit-find']);
I('applis', 'web-browser', 'Navigateur', 'globe', C.info, ['org.xfce.webbrowser', 'internet-web-browser', 'applications-internet']);
I('applis', 'org.xfce.about', 'À propos', 'info', C.info, ['help-about']);
I('applis', 'help-browser', 'Aide', 'circle-question-mark', C.info, ['help-contents', 'system-help', 'help-faq']);
I('applis', 'system-software-install', 'Installer', 'package-plus', C.teal, ['applications-other-install']);
I('applis', 'utilities-system-monitor', 'Moniteur système', 'activity', C.teal, ['org.xfce.taskmanager', 'gnome-system-monitor']);
I('applis', 'utilities-file-archiver', 'Archives', 'archive', C.amber, ['org.xfce.xarchiver', 'xarchiver']);
I('applis', 'accessories-calculator', 'Calculatrice', 'calculator', C.slate);
I('applis', 'accessories-screenshot', 'Capture d\'écran', 'image-plus', C.violet, ['org.xfce.screenshooter']);
I('applis', 'multimedia-volume-control', 'Son', 'volume-2', C.rose, ['org.xfce.pulseaudio', 'pavucontrol']);
I('applis', 'system-run', 'Exécuter', 'play', C.indigo);

I('reglages', 'org.xfce.settings.manager', 'Paramètres', 'sliders-horizontal', C.slate, ['preferences-system', 'preferences-desktop', 'preferences-other', 'applications-system', 'xfce4-settings']);
I('reglages', 'preferences-system-network', 'Connexions réseau', 'network', C.green, ['nm-connection-editor', 'network-manager']);
I('reglages', 'org.xfce.settings.appearance', 'Apparence', 'palette', C.violet, ['preferences-desktop-theme']);
I('reglages', 'org.xfce.settings.display', 'Écrans', 'monitor', C.blue, ['preferences-desktop-display'], display);
I('reglages', 'org.xfce.settings.keyboard', 'Clavier', 'keyboard', C.blue, ['preferences-desktop-keyboard']);
I('reglages', 'org.xfce.settings.mouse', 'Souris et pavé tactile', 'mouse', C.blue, ['preferences-desktop-peripherals']);
I('reglages', 'org.xfce.settings.accessibility', 'Ergonomie', 'accessibility', C.teal, ['preferences-desktop-accessibility']);
I('reglages', 'org.xfce.settings.color', 'Couleurs', 'pipette', C.rose, ['preferences-color']);
I('reglages', 'org.xfce.settings.default-applications', 'Applications par défaut', 'app-window', C.indigo, ['preferences-desktop-default-applications']);
I('reglages', 'org.xfce.settings.editor', 'Éditeur de réglages', 'list-tree', C.slate);
I('reglages', 'org.xfce.xfdesktop', 'Bureau et fond', 'wallpaper', C.violet, ['preferences-desktop-wallpaper']);
I('reglages', 'org.xfce.xfwm4', 'Fenêtres', 'app-window', C.slate, ['preferences-system-windows']);
I('reglages', 'org.xfce.xfwm4-tweaks', 'Fenêtres, plus de réglages', 'sliders-vertical', C.slate);
I('reglages', 'org.xfce.workspaces', 'Espaces de travail', 'layout-grid', C.indigo, ['preferences-desktop-workspaces']);
I('reglages', 'org.xfce.panel', 'Barre des tâches', 'panel-bottom', C.slate, ['xfce4-panel']);
I('reglages', 'org.xfce.powermanager', 'Alimentation', 'battery-charging', C.teal, ['preferences-system-power', 'xfce4-power-manager-settings'], () => battery(0.7, C.teal, true));
I('reglages', 'org.xfce.session', 'Session et démarrage', 'rocket', C.indigo, ['preferences-system-session']);
I('reglages', 'org.xfce.volman', 'Disques amovibles', 'usb', C.teal, ['drive-removable-media-settings']);
I('reglages', 'preferences-system-time', 'Date et heure', 'clock', C.slate, ['org.xfce.datetime']);
I('reglages', 'preferences-desktop-locale', 'Langue', 'languages', C.slate);

N('dialog-information', 'Information', 'circle', C.info, 'info', 'info', ['gtk-dialog-info', 'notification-information', 'sindryos-notif-information']);
N('emblem-ok', 'Réussite', 'circle', C.teal, 'ok', 'circle-check', ['sindryos-notif-reussite', 'dialog-ok', 'task-complete']);
N('dialog-warning', 'Attention', 'triangle', C.amber, 'warn', 'triangle-alert', ['gtk-dialog-warning', 'sindryos-notif-attention']);
N('dialog-error', 'Erreur', 'octagon', C.red, 'err', 'octagon-x', ['gtk-dialog-error', 'sindryos-notif-erreur']);
N('dialog-question', 'Question', 'circle', C.violet, 'ask', 'circle-question-mark', ['gtk-dialog-question']);
I('notifs', 'dialog-password', 'Mot de passe', 'key', C.slate, ['gtk-dialog-authentication', 'gcr-key', 'gcr-key-pair']);
I('notifs', 'notification-device', 'Clé branchée', 'usb', C.teal, ['sindryos-notif-usb']);
I('notifs', 'notification-network-wireless', 'Réseau connecté', 'wifi', C.blue, ['sindryos-notif-reseau', 'notification-network-wireless-full']);
I('notifs', 'notification-network-disconnected', 'Réseau coupé', 'wifi-off', C.red, ['sindryos-notif-reseau-coupe']);
I('notifs', 'software-update-available', 'Mise à jour', 'refresh-cw', C.indigo, ['system-software-update', 'sindryos-notif-maj']);
I('notifs', 'software-update-urgent', 'Mise à jour urgente', 'refresh-cw', C.red);
I('notifs', 'sindryos-notif-script', 'Script', 'square-terminal', C.violet);
I('notifs', 'sindryos-notif-script-encours', 'Script en cours', 'hourglass', C.indigo, ['appointment-soon']);
I('notifs', 'sindryos-notif-verrou', 'Disque verrouillé', 'lock-keyhole', C.amber);
I('notifs', 'security-high', 'Sécurité : bonne', 'shield-check', C.teal, ['channel-secure']);
I('notifs', 'security-medium', 'Sécurité : moyenne', 'shield-alert', C.amber, ['application-certificate-warning']);
I('notifs', 'security-low', 'Sécurité : faible', 'shield-x', C.red, ['channel-insecure']);
I('notifs', 'mail-unread', 'Message', 'mail', C.info, ['notification-message-im']);

// The bar. Network first, then sound, power, and what the tray can show.
const wifiTile = (level) => () => tileRaw(wifiArcs(level, 'translate(15 15) scale(2.75)'), C.green);
const wifiFree = (level) => () => canvas(() => wifiArcs(level, 'scale(4)'));
B('nm-signal-100', 'Wi-Fi 100 %', 'wifi', C.green, ['network-wireless-signal-excellent', 'network-wireless-connected-100', 'nm-device-wireless'], wifiFree(4), wifiTile(4));
B('nm-signal-75', 'Wi-Fi 75 %', 'wifi', C.green, ['network-wireless-signal-good', 'network-wireless-connected-75'], wifiFree(3), wifiTile(3));
B('nm-signal-50', 'Wi-Fi 50 %', 'wifi', C.green, ['network-wireless-signal-ok', 'network-wireless-connected-50'], wifiFree(2), wifiTile(2));
B('nm-signal-25', 'Wi-Fi 25 %', 'wifi', C.green, ['network-wireless-signal-weak', 'network-wireless-connected-25'], wifiFree(1), wifiTile(1));
B('nm-signal-00', 'Wi-Fi 0 %', 'wifi', C.green, ['network-wireless-signal-none', 'network-wireless-connected-00'], wifiFree(0), wifiTile(0));
B('nm-no-connection', 'Pas de Wi-Fi', 'wifi-off', C.red, ['network-offline', 'network-error', 'network-wireless-offline']);
B('nm-device-wired', 'Câble', 'ethernet-port', C.green, ['network-idle', 'network-transmit-receive']);
B('network-wired-disconnected', 'Pas de réseau câble', { line: WIRED_OFF }, C.red, ['nm-device-wired-disconnected', 'network-wired-offline'], () => slashed(barSolid('ethernet-port')));
B('network-internet', 'Internet', 'earth', C.info, ['sindryos-barre-internet']);
B('network-vpn', 'VPN', 'globe-lock', C.teal, ['nm-vpn-active-lock', 'sindryos-barre-vpn']);
B('nm-secure-lock', 'Réseau sécurisé', 'lock', C.green);
B('airplane-mode', 'Mode avion', 'plane', C.indigo, ['network-flightmode', 'sindryos-barre-avion']);
B('sindryos-barre-reseau-mobile', 'Réseau mobile', 'signal', C.green, ['network-cellular-connected']);
B('bluetooth-active', 'Bluetooth', 'bluetooth', C.blue, ['sindryos-barre-bluetooth']);
B('bluetooth-paired', 'Bluetooth connecté', 'bluetooth-connected', C.blue);
B('bluetooth-disabled', 'Bluetooth coupé', 'bluetooth-off', C.slate);
B('audio-volume-high', 'Son fort', 'volume-2', C.rose, [], () => barLine(speakerLevels(3)));
B('audio-volume-medium', 'Son moyen', 'volume-1', C.rose, [], () => barLine(speakerLevels(2)));
B('audio-volume-low', 'Son faible', 'volume', C.rose, [], () => barLine(speakerLevels(1)));
B('audio-volume-muted', 'Son coupé', 'volume-x', C.slate, [], () => barLine(speakerLevels(0)));
B('audio-input-microphone-high', 'Micro', 'mic', C.rose, ['microphone-sensitivity-high', 'sindryos-barre-micro']);
B('audio-input-microphone-muted', 'Micro coupé', 'mic-off', C.slate, ['microphone-sensitivity-muted']);
B('battery-full', 'Batterie pleine', 'battery-full', C.teal, ['battery', 'gpm-primary-100'], () => battery(1, C.teal, false));
B('battery-full-charged', 'Batterie chargée', 'battery-charging', C.teal, ['battery-full-charging'], () => battery(1, C.teal, true));
B('battery-good', 'Batterie 70 %', 'battery-medium', C.teal, [], () => battery(0.7, C.teal, false));
B('battery-good-charging', 'Batterie 70 %, en charge', 'battery-charging', C.teal, [], () => battery(0.7, C.teal, true));
B('battery-low', 'Batterie 35 %', 'battery-low', C.amber, [], () => battery(0.35, C.amber, false));
B('battery-low-charging', 'Batterie 35 %, en charge', 'battery-charging', C.amber, [], () => battery(0.35, C.amber, true));
B('battery-caution', 'Batterie 15 %', 'battery-warning', C.red, [], () => battery(0.15, C.red, false));
B('battery-caution-charging', 'Batterie 15 %, en charge', 'battery-charging', C.red, ['battery-empty-charging'], () => battery(0.15, C.red, true));
B('battery-empty', 'Batterie vide', 'battery', C.red, [], () => battery(0.04, C.red, false));
B('display-brightness', 'Luminosité', 'sun', C.amber, ['display-brightness-high', 'xfpm-brightness-lcd', 'sindryos-barre-luminosite']);
B('display-brightness-medium', 'Luminosité moyenne', 'sun-medium', C.amber);
B('display-brightness-low', 'Luminosité faible', 'sun-dim', C.amber);
B('sindryos-barre-notifications', 'Notifications', 'bell', C.violet, ['notifications', 'org.xfce.notification']);
B('notification-new', 'Nouvelle notification', 'bell-dot', C.violet, ['notifications-new']);
B('notification-disabled', 'Ne pas déranger', 'bell-off', C.slate, ['notifications-disabled', 'sindryos-barre-ne-pas-deranger']);
B('sindryos-barre-pc', 'Ce PC', 'monitor', C.indigo);
B('sindryos-barre-usb', 'USB', 'usb', C.teal, ['drive-removable-media-usb-panel']);
B('sindryos-barre-ejecter', 'Éjecter', 'eject', C.teal, ['media-eject']);
B('sindryos-barre-parametres', 'Paramètres', 'sliders-horizontal', C.slate);
B('location-active', 'GPS', 'map-pin', C.red, ['gps', 'find-location', 'sindryos-barre-gps']);
B('location-disabled', 'GPS coupé', 'map-pin-off', C.slate);
B('sindryos-barre-clavier', 'Clavier', 'keyboard', C.blue);
B('sindryos-barre-maj', 'Mise à jour', 'circle-arrow-up', C.indigo, ['software-update-panel']);
B('sindryos-barre-securite', 'Sécurité', 'shield-check', C.teal);
B('sindryos-barre-securite-alerte', 'Sécurité : alerte', 'shield-alert', C.amber);
B('sindryos-barre-recherche', 'Recherche', 'search', C.slate);
B('sindryos-barre-compte', 'Compte', 'circle-user', C.indigo);
B('sindryos-barre-langue', 'Langue', 'languages', C.slate);
B('sindryos-barre-ergonomie', 'Ergonomie', 'accessibility', C.teal);
B('sindryos-barre-theme', 'Clair ou sombre', 'sun-moon', C.violet);
B('sindryos-barre-presse-papiers', 'Presse-papiers', 'clipboard', C.slate);
B('sindryos-barre-capture', 'Capture d\'écran', 'scan-line', C.violet);
B('sindryos-barre-imprimante', 'Imprimante', 'printer', C.blue);
B('sindryos-barre-cast', 'Diffuser sur un écran', 'cast', C.blue);
B('sindryos-barre-script', 'Script en cours', 'square-terminal', C.violet);
B('sindryos-barre-windows', 'Windows détecté', { solid: PANES }, C.windows);

I('session', 'start-here', 'Lanceur', 'power', C.indigo, ['sindryos-demarrer'], IGNITION.couleur, ignitionTile);
I('session', 'system-shutdown', 'Éteindre', 'power', C.red, ['xfsm-shutdown', 'gnome-shutdown']);
I('session', 'system-reboot', 'Redémarrer', 'rotate-cw', C.blue, ['xfsm-reboot']);
I('session', 'system-log-out', 'Fermer la session', 'log-out', C.violet, ['xfsm-logout', 'application-exit']);
I('session', 'system-lock-screen', 'Verrouiller', 'lock', C.slate, ['xfsm-lock']);
I('session', 'system-suspend', 'Mettre en veille', 'moon', C.indigo, ['xfsm-suspend']);
I('session', 'system-hibernate', 'Hiberner', 'hard-drive-download', C.indigo, ['xfsm-hibernate']);
I('session', 'system-switch-user', 'Changer d\'utilisateur', 'users', C.teal, ['xfsm-switch-user']);
I('session', 'avatar-default', 'Session', 'user', C.indigo, ['user-info', 'stock_person', 'system-users']);
I('session', 'sindryos-windows', 'Redémarrer sous Windows', { solid: PANES }, C.windows);
I('session', 'sindryos-boot-choice', 'Démarrage', 'rocket', C.indigo);

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
D('application-x-desktop', 'Lanceur d\'application', 'rocket', C.indigo);
D('font-x-generic', 'Police', 'type', C.slate);
D('x-office-document', 'Document', 'file-text', C.blue, ['application-vnd.oasis.opendocument.text', 'application-msword', 'application-vnd.openxmlformats-officedocument.wordprocessingml.document']);
D('x-office-spreadsheet', 'Tableur', 'table', C.green, ['application-vnd.oasis.opendocument.spreadsheet', 'application-vnd.ms-excel', 'application-vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text-csv']);
D('x-office-presentation', 'Présentation', 'presentation', C.amber, ['application-vnd.oasis.opendocument.presentation', 'application-vnd.ms-powerpoint', 'application-vnd.openxmlformats-officedocument.presentationml.presentation']);
D('application-certificate', 'Certificat', 'badge-check', C.teal, ['gcr-certificate']);
D('unknown', 'Inconnu', 'file-question', C.slate, ['application-octet-stream', 'application-x-generic']);
I('fichiers', 'image-missing', 'Image manquante', 'image-off', C.slate);
I('fichiers', 'image-loading', 'Image en chargement', 'loader', C.slate);

const STATUS_TILE = (spec, colour) => () => tile(spec, colour);
I('emblemes', 'emblem-symbolic-link', 'Raccourci', 'arrow-up-right', C.info, ['emblem-link'], () => canvas((k) => k.faceted(SHAPE.circle, C.info) + STATUS_GLYPH.link('#fff')), STATUS_TILE('arrow-up-right', C.info));
I('emblemes', 'emblem-readonly', 'Lecture seule', 'lock', C.slate, ['emblem-locked'], () => emblem(C.slate, 'lock'));
I('emblemes', 'emblem-unreadable', 'Illisible', 'x', C.red, [], () => emblem(C.red, 'x'));
I('emblemes', 'emblem-default', 'Validé', 'check', C.teal, ['emblem-checked'], () => emblem(C.teal, 'check'));
I('emblemes', 'emblem-important', 'Important', 'triangle-alert', C.amber, ['emblem-urgent'], () => emblem(C.amber, 'triangle-alert'));
I('emblemes', 'emblem-synchronizing', 'Synchronisation', 'refresh-cw', C.indigo, [], () => emblem(C.indigo, 'refresh-cw'));

I('categories', 'applications-accessories', 'Accessoires', 'puzzle', C.slate);
I('categories', 'applications-development', 'Développement', 'code', C.indigo);
I('categories', 'applications-education', 'Éducation', 'graduation-cap', C.green);
I('categories', 'applications-games', 'Jeux', 'gamepad-2', C.rose);
I('categories', 'applications-graphics', 'Graphisme', 'pen-tool', C.violet);
I('categories', 'applications-multimedia', 'Multimédia', 'clapperboard', C.red);
I('categories', 'applications-office', 'Bureautique', 'briefcase', C.amber);
I('categories', 'applications-other', 'Autres', 'shapes', C.slate);
I('categories', 'applications-science', 'Sciences', 'flask-conical', C.teal);
I('categories', 'applications-utilities', 'Utilitaires', 'wrench', C.slate);

I('sindry', 'sindryos-disque-windows', 'Disque Windows', { line: OWN.windowsDisk }, C.windows, [], windowsDisk);
I('sindry', 'sindryos-data', 'SINDRY-DATA', 'flame', C.teal, [], () => stick(stickMark({ solid: FLAME })));
I('sindry', 'sindryos-cle-demarrage', 'Clé de démarrage', 'power', C.teal, [], () => stick(stickMark('power')));
I('sindry', 'sindryos-scripts', 'Scripts', 'file-terminal', C.violet);
I('sindry', 'sindryos-analyse', 'Analyse', 'scan-search', C.teal);
I('sindry', 'sindryos-reparation', 'Réparation', 'wrench', C.indigo);
I('sindry', 'sindryos-sante', 'État du PC', 'heart-pulse', C.rose);
I('sindry', 'sindryos-journaux', 'Journaux', 'scroll-text', C.slate);
I('sindry', 'sindryos-sauvegarde', 'Sauvegarde', 'database', C.blue);
I('sindry', 'sindryos-restauration', 'Restauration', 'archive-restore', C.teal);
I('sindry', 'sindryos-retour', 'Retour arrière', 'undo-2', C.amber);
I('sindry', 'sindryos-registre', 'Registre', 'list-tree', C.blue);
I('sindry', 'sindryos-bitlocker', 'Disque chiffré', 'lock-keyhole', C.amber);
I('sindry', 'sindryos-mise-a-jour', 'Mise à jour de Sindry', 'chevrons-up', C.indigo);

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
const draw = (icon, lot) => {
  if (lot === 'sans-fond') return icon.free();
  if (lot === 'avec-fond') return icon.tiled();
  throw new Error(`lot inconnu : ${lot}`);
};

if (COMMAND === 'build') {
  const [, lot, out] = ARGS;
  for (const icon of ICONS) {
    const dir = join(out, SECTIONS[icon.section][0]);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${icon.name}.svg`), draw(icon, lot));
  }
  writeFileSync(join(out, 'index.json'), `${JSON.stringify({
    sections: Object.fromEntries(Object.entries(SECTIONS).map(([k, [dir, label]]) => [k, { dossier: dir, titre: label }])),
    icones: ICONS.map(({ section, name, label, aliases }) => ({ section, nom: name, label, alias: aliases })),
  }, null, 1)}\n`);
  console.log(`[OK] ${lot} : ${ICONS.length} dessins, ${seen.size} noms`);
} else if (COMMAND === 'theme') {
  const [, lot, out] = ARGS;
  for (const icon of ICONS) {
    const dir = join(out, 'scalable', SECTIONS[icon.section][0]);
    mkdirSync(dir, { recursive: true });
    const svg = draw(icon, lot);
    for (const n of [icon.name, ...icon.aliases]) writeFileSync(join(dir, `${n}.svg`), svg);
  }
  const dirs = Object.keys(THEME_DIRS).map((d) => `scalable/${d}`);
  writeFileSync(join(out, 'index.theme'), `[Icon Theme]\nName=Prisme\nComment=Icônes de SindryOS, en facettes (${lot}), sur Adwaita\nInherits=Adwaita,hicolor\nDirectories=${dirs.join(',')}\n\n${Object.entries(THEME_DIRS).map(([d, c]) => `[scalable/${d}]\nSize=48\nMinSize=16\nMaxSize=512\nType=Scalable\nContext=${c}\n`).join('\n')}`);
  console.log(`[OK] thème ${lot} : ${seen.size} fichiers pour ${ICONS.length} dessins`);
} else if (COMMAND === 'allumage') {
  const out = ARGS[1];
  mkdirSync(out, { recursive: true });
  for (const [version, make] of Object.entries(IGNITION)) writeFileSync(join(out, `allumage-${version}.svg`), make());
  console.log(`[OK] Allumage : ${Object.keys(IGNITION).length} versions`);
} else {
  console.error('commande : traces, build, theme ou allumage');
  process.exit(1);
}

// Ideas for SindryOS's launcher (the start button), each in white for the dark taskbar and in colour.
// Official files stay untouched: only their frame changes when one is reused.
// Usage: node lanceurs.mjs <official icons dir> <design/icon/source.svg> <out dir>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , OFFICIAL, SOURCE, OUT] = process.argv;
const AURORA = ['#1FB5A3', '#5B6CF0', '#9A5BE0'];
const BRIGHT = ['#3FE0C8', '#7B8CFF', '#C58BFF'];
const FLAME_COLOUR = '#FD7D26';
const SOFT = ['#FFFFFF', '#C9D0EE', '#8E9AC0']; // the white version's three tones: never transparent

const wrap = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${defs ? `<defs>${defs}</defs>` : ''}${inner}</svg>\n`;
const flat = (d, fill) => `<path d="${d}" fill="${fill}"/>`;

// The official flames, whole: the layered files are cut around the gear and look bitten once alone,
// so these come from the source of the icon. Only the frame is fitted to them.
function flames(fill) {
  const source = readFileSync(SOURCE, 'utf8');
  const paths = [...source.matchAll(/<path[^>]*fill="#FD7D26"[^>]*>/g)].map((m) => m[0].match(/ d="([^"]+)"/)[1]);
  if (paths.length !== 2) throw new Error(`flammes : ${paths.length} tracés trouvés`);
  const numbers = paths.join(' ').match(/-?\d+(\.\d+)?/g).map(Number);
  const xs = numbers.filter((_, i) => i % 2 === 0), ys = numbers.filter((_, i) => i % 2 === 1);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const side = Math.max(x1 - x0, y1 - y0) * 1.04, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="${(cx - side / 2).toFixed(2)} ${(cy - side / 2).toFixed(2)} ${side.toFixed(2)} ${side.toFixed(2)}">${paths.map((d) => `<path d="${d}" fill="${fill}"/>`).join('')}</svg>
`;
}

// A triangle with three facets, around an inner point, rotated as asked.
function prism(angle, tones) {
  const rotate = ([x, y]) => {
    const a = (angle * Math.PI) / 180, dx = x - 48, dy = y - 52;
    return [(48 + dx * Math.cos(a) - dy * Math.sin(a)).toFixed(2), (52 + dx * Math.sin(a) + dy * Math.cos(a)).toFixed(2)].join(' ');
  };
  const [apex, left, right, core] = [[48, 6], [4, 84], [92, 84], [48, 60]].map(rotate);
  return wrap(flat(`M${apex}L${left}L${core}z`, tones[0]) + flat(`M${apex}L${core}L${right}z`, tones[1]) + flat(`M${left}L${right}L${core}z`, tones[2]));
}

function star(tonesA, tonesB) {
  const point = (r, a) => `${(48 + r * Math.sin(a)).toFixed(2)} ${(48 - r * Math.cos(a)).toFixed(2)}`;
  let inner = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4, step = Math.PI / 8;
    inner += flat(`M48 48L${point(14, a - step)}L${point(45, a)}z`, tonesA[i % tonesA.length]);
    inner += flat(`M48 48L${point(45, a)}L${point(14, a + step)}z`, tonesB[i % tonesB.length]);
  }
  return wrap(inner);
}

const diamond = (cx, cy, r, fill) => `<path d="M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}z" fill="${fill}"/>`;
const diamonds = (tones) => wrap(diamond(48, 23, 20.5, tones[0]) + diamond(73, 48, 20.5, tones[1]) + diamond(23, 48, 20.5, tones[2]) + diamond(48, 73, 20.5, tones[3]));

// The start of a power symbol: a ring open at the top, a flame standing in the gap.
function ignition(ring, flame) {
  const p = (a) => `${(48 + 33 * Math.sin((a * Math.PI) / 180)).toFixed(2)} ${(57 - 33 * Math.cos((a * Math.PI) / 180)).toFixed(2)}`;
  const arc = (from, to, stroke) => `<path d="M${p(from)}A33 33 0 ${to - from > 180 ? 1 : 0} 1 ${p(to)}" fill="none" stroke="${stroke}" stroke-width="11"/>`;
  const rings = ring.length === 1 ? arc(44, 316, ring[0]) : arc(44, 162, ring[0]) + arc(161, 240, ring[1]) + arc(239, 316, ring[2]);
  return wrap(`${rings}<g transform="translate(15.2 .28) scale(.68)"><path d="M50 4c2 10 10 15 15 22 3.6 5 5.3 10 5.3 15.5a22 22 0 0 1-44 .5c0-7 3-12.3 7.5-16.3 1 5.3 3.8 8.6 7.8 9.8C40 24.5 43 13 50 4z" fill="${flame}"/></g>`);
}

// An S cut with sharp corners, its chamfers a shade darker.
function monogram(top, side) {
  return wrap(`<path d="M30 8H82V25H37L31 31V39H66L82 55V72L66 88H14V71H59L65 65V57H30L14 41V24z" fill="${top}"/>`
    + flat('M30 8L37 25L31 31L14 24z', side) + flat('M14 41L30 57L31 39z', side) + flat('M66 39L82 55L65 57z', side) + flat('M82 72L66 88L59 71L65 65z', side));
}

function chevrons(first, second) {
  const c = (y, fill) => `<path d="M48 ${y}L88 ${y + 36}L74 ${y + 50}L48 ${y + 26}L22 ${y + 50}L8 ${y + 36}z" fill="${fill}"/>`;
  return wrap(c(42, second) + c(4, first));
}

const IDEAS = [
  {
    id: 'a-icone-complete', name: "L'icône complète", text: "L'engrenage et ses flammes, tels quels. Les flammes disent « Sindry » et non « réglages ».", limit: 'Les flammes deviennent petites à 24 px.',
    white: () => readFileSync(join(OFFICIAL, 'sindry-icon-white.svg'), 'utf8'), colour: () => readFileSync(join(OFFICIAL, 'sindry-icon-color.svg'), 'utf8'),
  },
  {
    id: 'b-flammes', name: 'Les flammes', text: "Les deux flammes officielles seules, sans la roue : la partie unique de l'icône.", limit: 'Perd le lien avec la roue et le jeu caché.',
    white: () => flames('#FFFFFF'), colour: () => flames(FLAME_COLOUR),
  },
  {
    id: 'c-allumage', name: 'Allumage', text: "Le symbole marche/arrêt, dont la barre devient une flamme : « démarrer », avec la marque de Sindry.", limit: 'Se rapproche du bouton « Éteindre » du menu.',
    white: () => ignition(['#FFFFFF'], '#FFFFFF'), colour: () => ignition(BRIGHT, FLAME_COLOUR),
  },
  {
    id: 'd-prisme', name: 'Prisme', text: "Un prisme à trois facettes, le nom du style de l'OS. Une forme simple qui tient à 16 px.", limit: "Rappelle le triangle « Attention » s'il est peint en orange : il reste dans l'aurore.",
    white: () => prism(0, SOFT), colour: () => prism(0, BRIGHT),
  },
  {
    id: 'e-prisme-lecture', name: 'Prisme couché', text: "Le même prisme, pointe à droite : il se lit aussi « lancer », comme un bouton lecture.", limit: 'Peut passer pour un lecteur de médias.',
    white: () => prism(90, SOFT), colour: () => prism(90, BRIGHT),
  },
  {
    id: 'f-losanges', name: 'Quatre losanges', text: "La grille d'applis, tournée de 45° : le code d'un menu démarrer, sans copier le logo de Windows.", limit: 'Moins personnel : ne dit pas « Sindry ».',
    white: () => diamonds(['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF']), colour: () => diamonds([BRIGHT[0], FLAME_COLOUR, BRIGHT[1], BRIGHT[2]]),
  },
  {
    id: 'g-eclat', name: 'Éclat', text: "Une étoile à huit branches en facettes : les huit dents de la roue, sans la roue.", limit: "Un peu générique, et proche d'une boussole.",
    white: () => star([SOFT[0]], [SOFT[2]]), colour: () => star(BRIGHT, AURORA),
  },
  {
    id: 'h-s-facette', name: 'S facetté', text: "L'initiale de Sindry, taillée à angles vifs, avec des biseaux plus sombres.", limit: "Dépend de l'initiale : ne dit pas ce que fait le bouton.",
    white: () => monogram(SOFT[0], SOFT[2]), colour: () => monogram(BRIGHT[1], AURORA[2]),
  },
  {
    id: 'i-envol', name: 'Envol', text: "Deux chevrons vers le haut : le menu monte au-dessus de la barre, et « lancer » devient visible.", limit: 'Peut se lire « remonter en haut de page ».',
    white: () => chevrons(SOFT[0], SOFT[2]), colour: () => chevrons(BRIGHT[0], BRIGHT[1]),
  },
];

mkdirSync(OUT, { recursive: true });
for (const idea of IDEAS) {
  writeFileSync(join(OUT, `${idea.id}-blanc.svg`), idea.white());
  writeFileSync(join(OUT, `${idea.id}-couleur.svg`), idea.colour());
}
writeFileSync(join(OUT, 'index.json'), `${JSON.stringify(IDEAS.map(({ id, name, text, limit }) => ({ id, nom: name, texte: text, limite: limit })), null, 1)}\n`);
console.log(`[OK] ${IDEAS.length} idées, en blanc et en couleur`);

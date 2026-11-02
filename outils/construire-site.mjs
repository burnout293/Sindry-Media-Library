/**
 * Construit le site GitHub Pages de la médiathèque, sans aucune dépendance.
 *
 *   node outils/construire-site.mjs              construit dans _site/
 *   node outils/construire-site.mjs --out <dir>  construit ailleurs
 *   node outils/construire-site.mjs --strict     une erreur du registre arrête tout
 *   node outils/construire-site.mjs --verifier   vérifie seulement (avant un push)
 *
 * Ce qu'il fait :
 *   - copie la page d'accueil (index.html, accueil/) et chaque dossier de données
 *     de premier niveau (mockups/, icons/, images/, et tout dossier ajouté plus tard) ;
 *   - écrit manifest.json : chaque fichier, sa taille, ses dimensions (images) et la
 *     date de son dernier commit. La page d'accueil ne lit que ce fichier ;
 *   - dans la copie publiée de chaque mockup du registre : le numéro en tête du titre
 *     de l'onglet et un badge en bas à gauche (« M47 · 02/11/2026 10:30 · Titre »),
 *     comme le fait tools/archiver-maquettes.mjs dans le dépôt Sindry ;
 *   - réécrit les chemins de ressources du dépôt Sindry (../../src/fonts/…,
 *     ../../src/marque.png, sindry-256.png) vers mockups/_ressources/.
 *
 * Les fichiers du dépôt ne sont jamais modifiés : seule la copie publiée l'est.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, extname, relative, resolve, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (nom) => args.includes(nom);
const valeur = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 && args[i + 1] ? args[i + 1] : defaut; };
const verifierSeulement = option('--verifier');
const strict = option('--strict') || verifierSeulement;
const sortie = resolve(racine, valeur('--out', '_site'));

const DEPOT = process.env.GITHUB_REPOSITORY || 'burnout293/Sindry-Media-Library';
const BRANCHE = process.env.GITHUB_REF_NAME || 'main';

// Dossiers et fichiers de premier niveau qui ne sont pas des données.
const PAS_DES_DONNEES = new Set(['outils', 'accueil', 'node_modules']);
const PAGE = ['index.html', '.nojekyll'];

const erreurs = [];
const avertissements = [];
const posixe = (p) => p.split(sep).join('/');

// --- Les fichiers de données ------------------------------------------------

function lister(dossier) {
  const fichiers = [];
  for (const nom of readdirSync(dossier).sort((a, b) => a.localeCompare(b, 'fr'))) {
    if (nom.startsWith('.')) continue;
    const chemin = join(dossier, nom);
    const s = statSync(chemin);
    if (s.isDirectory()) fichiers.push(...lister(chemin));
    else if (s.isFile()) fichiers.push(chemin);
  }
  return fichiers;
}

const dossiersDeDonnees = readdirSync(racine)
  .filter((nom) => !nom.startsWith('.') && !nom.startsWith('_') && !PAS_DES_DONNEES.has(nom))
  .filter((nom) => statSync(join(racine, nom)).isDirectory())
  .filter((nom) => resolve(racine, nom) !== sortie)
  .sort();

const fichiersDeDonnees = dossiersDeDonnees.flatMap((d) => lister(join(racine, d))).map((f) => posixe(relative(racine, f)));

// Ce qui est publié mais pas montré comme une donnée : les README, le registre,
// les ressources partagées (tout segment qui commence par « _ »).
const montre = (chemin) => {
  const segments = chemin.split('/');
  if (segments.some((s) => s.startsWith('_'))) return false;
  if (/^(readme|lisezmoi)\.md$/i.test(segments.at(-1))) return false;
  if (chemin === 'mockups/registre.json') return false;
  return true;
};

// --- Dimensions des images, lues dans l'en-tête --------------------------------

function dimensions(buf, ext) {
  try {
    if (ext === '.png' && buf.length >= 24 && buf.readUInt32BE(12) === 0x49484452) return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    if (ext === '.gif' && buf.length >= 10) return [buf.readUInt16LE(6), buf.readUInt16LE(8)];
    if (ext === '.ico' && buf.length >= 8 && buf.readUInt16LE(2) === 1) return [buf[6] || 256, buf[7] || 256];
    if (ext === '.webp' && buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const type = buf.toString('ascii', 12, 16);
      if (type === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
      if (type === 'VP8L') { const b = buf.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >>> 14) & 0x3fff) + 1]; }
      if (type === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
    }
    if (ext === '.jpg' || ext === '.jpeg') {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m === 0xd8 || m === 0x01 || m === 0xff || (m >= 0xd0 && m <= 0xd7)) { i += m === 0xff ? 1 : 2; continue; }
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch { /* en-tête illisible : pas de dimensions */ }
  return null;
}

// --- Date du dernier commit de chaque fichier, en une seule lecture de git ----

function datesGit() {
  const dates = new Map();
  try {
    const log = execFileSync('git', ['-c', 'core.quotepath=off', 'log', '--format=@@%cI', '--name-only', '--', ...dossiersDeDonnees],
      { cwd: racine, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    let courante = null;
    for (const ligne of log.split('\n')) {
      if (ligne.startsWith('@@')) courante = ligne.slice(2);
      else if (ligne && courante && !dates.has(ligne)) dates.set(ligne, courante);
    }
  } catch { /* pas de git (copie hors dépôt) : pas de dates */ }
  return dates;
}

function commitCourant() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: racine, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

// --- Le registre des mockups -------------------------------------------------------

const num = (n) => `M${String(n).padStart(2, '0')}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const dateFr = (d) => { const [j, h] = String(d).split(' '); const [a, m, jj] = j.split('-'); return `${jj}/${m}/${a}${h ? ` ${h}` : ''}`; };

function lireRegistre() {
  const chemin = join(racine, 'mockups', 'registre.json');
  if (!existsSync(chemin)) return null;
  let registre;
  try { registre = JSON.parse(readFileSync(chemin, 'utf8')); }
  catch (e) { erreurs.push(`mockups/registre.json n'est pas un JSON valide : ${e.message}`); return null; }
  if (!Array.isArray(registre.maquettes)) { erreurs.push('mockups/registre.json : la liste « maquettes » manque'); return null; }

  const projets = registre.projets || {};
  const numeros = new Map();
  const fichiers = new Map();
  for (const [i, e] of registre.maquettes.entries()) {
    const ou = `registre, entrée ${i + 1}${e && e.n ? ` (${num(e.n)})` : ''}`;
    if (!e || typeof e !== 'object') { erreurs.push(`${ou} : ce n'est pas un objet`); continue; }
    if (!Number.isInteger(e.n) || e.n < 1) erreurs.push(`${ou} : « n » doit être un entier positif`);
    else if (numeros.has(e.n)) erreurs.push(`${ou} : le numéro ${num(e.n)} est déjà pris par ${numeros.get(e.n)}`);
    else numeros.set(e.n, e.fichier);
    if (typeof e.fichier !== 'string' || !e.fichier) { erreurs.push(`${ou} : « fichier » manque`); continue; }
    if (fichiers.has(e.fichier)) erreurs.push(`${ou} : le fichier ${e.fichier} est déjà au registre`);
    fichiers.set(e.fichier, e.n);
    if (e.fichier.includes('..') || e.fichier.startsWith('/')) erreurs.push(`${ou} : « fichier » doit rester dans mockups/`);
    else if (!existsSync(join(racine, 'mockups', e.fichier))) erreurs.push(`${ou} : mockups/${e.fichier} est introuvable`);
    if (Number.isInteger(e.n) && !e.fichier.startsWith(`${num(e.n)}_`)) avertissements.push(`${ou} : le nom devrait commencer par ${num(e.n)}_`);
    if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(e.date)) erreurs.push(`${ou} : « date » doit être « AAAA-MM-JJ HH:MM »`);
    if (typeof e.titre !== 'string' || !e.titre.trim()) erreurs.push(`${ou} : « titre » manque`);
    if (e.projet && !projets[e.projet]) avertissements.push(`${ou} : le projet « ${e.projet} » n'est pas déclaré dans « projets »`);
  }
  return registre;
}

// --- La copie publiée d'un mockup HTML -------------------------------------------

const EXTERNE = /<(?:script|link|img|iframe)\b[^>]*\b(?:src|href)\s*=\s*["']?(?:https?:)?\/\/|url\(\s*["']?(?:https?:)?\/\//i;

function publierMockup(chemin, html, entree) {
  // Les chemins des ressources Sindry, relatifs au mockup.
  const vers = posix.relative(posix.dirname(chemin), 'mockups/_ressources') || '.';
  html = html.split('../../src/fonts/').join(`${vers}/`);
  html = html.split('../../src/marque.png').join(`${vers}/marque.png`);
  html = html.replace(/(["'(=\s])sindry-256\.png/g, `$1${vers}/sindry-256.png`);
  if (EXTERNE.test(html)) avertissements.push(`${chemin} charge une ressource externe : il doit s'ouvrir seul`);

  if (entree && !html.includes('data-maquette-badge')) {
    const libelle = `${num(entree.n)} · ${dateFr(entree.date)} · ${entree.titre}`;
    html = html.replace(/<title>/i, `<title>${esc(num(entree.n))} · `);
    const badge = `<div data-maquette-badge style="position:fixed;left:10px;bottom:10px;z-index:2147483647;pointer-events:none;`
      + `font:650 12px/1.2 'Segoe UI',system-ui,sans-serif;color:#fff;background:rgba(18,12,26,.9);`
      + `border:1px solid rgba(255,255,255,.22);padding:6px 11px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.35)">${esc(libelle)}</div>`;
    html = /<body[^>]*>/i.test(html) ? html.replace(/(<body[^>]*>)/i, `$1\n${badge}`) : `${badge}\n${html}`;
  }
  return html;
}

// --- La construction ---------------------------------------------------------------

const registre = lireRegistre();
const parFichier = new Map((registre?.maquettes || []).map((e) => [`mockups/${e.fichier}`, e]));

for (const f of fichiersDeDonnees) {
  if (f.startsWith('icons/')) {
    const nom = f.slice(6);
    if (!/^[a-z0-9-]+\.(png|ico)$/.test(nom)) avertissements.push(`${f} : Sindry n'attend que <id>.png ou <id>.ico (minuscules, chiffres, tirets)`);
    else if (statSync(join(racine, f)).size > 128 * 1024) avertissements.push(`${f} : plus de 128 Ko, Sindry la refusera`);
  }
}

for (const a of avertissements) console.warn(`[AVERT] ${a}`);
for (const e of erreurs) console.error(`[ERREUR] ${e}`);
if (erreurs.length && strict) {
  console.error(`[ECHEC] ${erreurs.length} erreur(s) : rien n'est construit, le site en ligne reste celui d'avant.`);
  process.exit(1);
}
if (verifierSeulement) {
  console.log(`[OK] ${fichiersDeDonnees.length} fichiers, ${registre?.maquettes.length ?? 0} mockups au registre.`);
  process.exit(0);
}

if (sortie === racine || racine.startsWith(sortie + sep)) {
  console.error(`[ECHEC] --out ${sortie} : le dossier de sortie ne peut pas contenir le dépôt.`);
  process.exit(1);
}
rmSync(sortie, { recursive: true, force: true });

const copier = (chemin) => {
  const dest = join(sortie, chemin);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(racine, chemin), dest);
};
for (const f of PAGE) if (existsSync(join(racine, f))) copier(f);
if (existsSync(join(racine, 'accueil'))) for (const f of lister(join(racine, 'accueil'))) copier(posixe(relative(racine, f)));

const dates = datesGit();
const manifest = [];
for (const f of fichiersDeDonnees) {
  const dest = join(sortie, f);
  mkdirSync(dirname(dest), { recursive: true });
  const ext = extname(f).toLowerCase();
  const buf = readFileSync(join(racine, f));
  if (f.startsWith('mockups/') && !f.includes('/_') && (ext === '.html' || ext === '.htm')) {
    writeFileSync(dest, publierMockup(f, buf.toString('utf8'), parFichier.get(f)));
  } else {
    writeFileSync(dest, buf);
  }
  if (!montre(f)) continue;
  const entree = { chemin: f, taille: buf.length };
  if (dates.has(f)) entree.date = dates.get(f);
  const dim = dimensions(buf, ext);
  if (dim) [entree.largeur, entree.hauteur] = dim;
  manifest.push(entree);
}

writeFileSync(join(sortie, 'manifest.json'), JSON.stringify({
  format: 1,
  depot: DEPOT,
  branche: BRANCHE,
  commit: commitCourant(),
  genere: new Date().toISOString(),
  registre,
  fichiers: manifest,
}, null, 1));

const parDossier = Object.fromEntries(dossiersDeDonnees.map((d) => [d, manifest.filter((f) => f.chemin.startsWith(`${d}/`)).length]));
console.log(`[OK] ${posixe(relative(racine, sortie)) || sortie} : ${Object.entries(parDossier).map(([d, n]) => `${d} ${n}`).join(', ')}`
  + ` ; ${registre?.maquettes.length ?? 0} mockups au registre.`);

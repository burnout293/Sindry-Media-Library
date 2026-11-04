// Builds M54: the six families of SindryOS icons, compared and shown in place on a fake desktop.
// Icons are embedded as they are in their files and shown through <img>, so what the page shows
// is what the file draws.
// Usage: node maquette-icones.mjs <icons dir> <wallpaper.webp> <gear-white.svg> <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , DIR, WALL, GEAR, OUT] = process.argv;
const HEURE = process.env.HEURE ?? '12:00';
const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8'));
const uri = (f, type) => `data:${type};base64,${readFileSync(f).toString('base64')}`;

const table = {};
for (const family of index.familles) {
  table[family.lettre] = {};
  for (const icon of index.icones) table[family.lettre][icon.id] = uri(join(DIR, family.id, `${icon.id}.svg`), 'image/svg+xml');
}
// The start button's gear, framed on the gear alone as in the OS.
const gear = readFileSync(GEAR, 'utf8').replace(/viewBox="[^"]*"/, 'viewBox="-108 -108 216 216"');
const GEAR_URI = `data:image/svg+xml;base64,${Buffer.from(gear).toString('base64')}`;
const WALL_URI = uri(WALL, 'image/webp');

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>M54 · SindryOS : icônes, six familles</title>
<style>
  @font-face { font-family: 'Inter'; font-weight: 100 900; font-display: swap; src: url('_ressources/inter-latin-wght-normal.woff2') format('woff2'); }
  :root { color-scheme: dark; --surface: #121A33; --surface2: #172142; --border: #2A3760; --text: #E4E9FF; --muted: #8E9AC0; --accent: #7B8CFF; --aurora: linear-gradient(90deg, #1FB5A3, #5B6CF0, #9A5BE0); }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; background: #0B1024; color: var(--text); font: 15px/1.45 Inter, system-ui, "Segoe UI", sans-serif; }
  main { max-width: 1240px; margin: 0 auto; padding: 18px 16px 64px; }
  h1 { margin: 0; font-size: 21px; font-weight: 650; }
  h2 { margin: 30px 0 4px; font-size: 16px; font-weight: 650; }
  p { margin: 4px 0 0; color: var(--muted); }
  button { font: inherit; color: var(--text); background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 6px 11px; cursor: pointer; }
  button:hover { border-color: #46558F; }
  button[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .controls { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 12px; }
  .controls span { color: var(--muted); font-size: 13px; margin-right: 2px; }
  .controls span:not(:first-child) { margin-left: 12px; }
  .controls button { font-size: 13px; }

  /* comparison */
  .scroll { overflow-x: auto; margin-top: 12px; border: 1px solid var(--border); border-radius: 5px; }
  table { border-collapse: collapse; min-width: 980px; width: 100%; }
  th, td { padding: 9px 6px; text-align: center; border-bottom: 1px solid var(--border); }
  tr:last-child td, tr:last-child th { border-bottom: 0; }
  thead th { font-size: 11.5px; font-weight: 500; color: var(--muted); }
  tbody th { text-align: left; font-weight: 400; width: 190px; padding: 9px 10px 9px 12px; cursor: pointer; }
  tbody th b { display: block; font-weight: 650; }
  tbody th small { display: block; font-size: 12px; line-height: 1.35; color: var(--muted); }
  tbody tr { cursor: pointer; }
  tbody tr.selected { box-shadow: inset 3px 0 0 var(--accent); }
  td img { width: 52px; height: 52px; display: block; margin: 0 auto; }
  .sep { border-left: 1px solid var(--border); }
  .on-nuit { background: var(--surface); }
  .on-clair { background: #F8FAFF; color: #141A2E; }
  .on-clair th, .on-clair thead th, .on-clair tbody th small { color: #56607A; }
  .on-clair tbody th b { color: #141A2E; }
  .on-clair th, .on-clair td { border-color: #CFD6EA; }
  .on-fond { background: #0B1838 center / cover no-repeat; }
  .on-fond thead th, .on-fond tbody th small { color: #C8D2F5; }

  /* desktop */
  .fit { margin-top: 12px; border: 1px solid var(--border); border-radius: 5px; overflow: hidden; }
  .desk { position: relative; width: 1180px; height: 664px; background: #0B1838 center / cover no-repeat; transform-origin: 0 0; overflow: hidden; }
  .desk-icons { position: absolute; left: 16px; top: 16px; display: grid; gap: 14px; width: 92px; }
  .desk-icons div { text-align: center; font-size: 12px; color: #fff; }
  .desk-icons img { width: 56px; height: 56px; display: block; margin: 0 auto 4px; }
  .win { position: absolute; left: 130px; top: 26px; width: 620px; height: 430px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; overflow: hidden; }
  .win::before { content: ''; display: block; height: 3px; background: var(--aurora); }
  .bar { display: flex; align-items: center; height: 36px; padding-left: 12px; border-bottom: 1px solid var(--border); font-size: 13px; gap: 8px; }
  .bar img { width: 18px; height: 18px; }
  .bar i { margin-left: auto; color: var(--muted); font-style: normal; letter-spacing: 14px; padding-right: 2px; font-size: 13px; }
  .pane { display: flex; height: calc(100% - 39px); }
  .side { width: 170px; background: var(--surface2); border-right: 1px solid var(--border); padding: 8px 6px; font-size: 13px; }
  .side div { display: flex; align-items: center; gap: 9px; padding: 5px 7px; border-radius: 4px; }
  .side div.on { background: #243061; }
  .side img { width: 20px; height: 20px; }
  .files { flex: 1; padding: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-content: start; font-size: 13px; }
  .file { display: flex; gap: 11px; align-items: center; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface2); }
  .file img { width: 48px; height: 48px; flex: none; }
  .file small { display: block; color: var(--muted); font-size: 12px; }
  .gauge { height: 5px; margin-top: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .gauge span { display: block; height: 100%; background: var(--accent); }
  .toasts { position: absolute; right: 12px; bottom: 56px; width: 330px; display: grid; gap: 8px; }
  .toast { display: flex; gap: 11px; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; font-size: 13px; line-height: 1.35; }
  .toast img { width: 40px; height: 40px; flex: none; }
  .toast b { display: block; font-weight: 600; }
  .toast span { color: var(--muted); font-size: 12.5px; }
  .task { position: absolute; left: 0; right: 0; bottom: 0; height: 46px; background: rgba(14, 20, 42, .94); border-top: 1px solid var(--border); display: flex; align-items: center; padding: 0 12px; gap: 6px; font-size: 13px; }
  .task .start { width: 24px; height: 24px; margin-right: 8px; }
  .task .app { display: flex; align-items: center; gap: 7px; height: 100%; padding: 0 10px; box-shadow: inset 0 -3px 0 #5B6CF0; }
  .task .app img { width: 22px; height: 22px; }
  .tray { margin-left: auto; display: flex; align-items: center; gap: 11px; color: var(--muted); }
  .tray img { width: 20px; height: 20px; }

  /* sizes */
  .sizes { margin-top: 12px; overflow-x: auto; border: 1px solid var(--border); border-radius: 5px; background: var(--surface); padding: 12px; }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 6px 0; }
  .row small { width: 44px; color: var(--muted); font-size: 12px; flex: none; }
  .row img { display: block; flex: none; }
  .notes { margin: 8px 0 0; padding-left: 18px; color: var(--muted); }
</style>
</head>
<body>
<div data-maquette-badge style="position:fixed;left:10px;bottom:10px;z-index:2147483647;pointer-events:none;font:12px/1.3 Inter,system-ui,sans-serif;color:#fff;background:rgba(10,12,40,.82);border:1px solid rgba(255,255,255,.18);border-radius:4px;padding:4px 8px">M54 · 04/11/2026 ${HEURE} · SindryOS : icônes, six familles</div>
<main>
  <h1>SindryOS : les icônes, six familles</h1>
  <p>Douze icônes dessinées six fois : quatre lieux (Ce PC, Disque, Clé USB, Images) et huit notifications. Aucun filtre ni effet : l'OS les dessine une fois à la construction, sans carte graphique.</p>
  <div class="controls">
    <span>Famille</span><span id="chips" style="display:contents"></span>
    <span>Fond</span>
    <button data-bg="nuit">Nuit</button><button data-bg="fond">Fond d'écran</button><button data-bg="clair">Clair</button>
  </div>

  <h2>Les six côte à côte</h2>
  <p>Les notifications gardent leur forme selon leur sens : rond pour une information ou une réussite, triangle pour « Attention », octogone pour « Erreur ». On les distingue donc sans dépendre de la couleur.</p>
  <div class="scroll"><table id="matrix"><thead></thead><tbody></tbody></table></div>

  <h2>En situation</h2>
  <p>Le bureau de SindryOS, thème Nuit, sur le fond à l'engrenage retenu. Le contenu est fictif.</p>
  <div class="controls"><button id="win-toggle" aria-pressed="false">Masquer la fenêtre</button></div>
  <div class="fit" id="fit"><div class="desk" id="desk">
    <div class="desk-icons">
      <div><img data-i="ce-pc" alt="">Ce PC</div>
      <div><img data-i="disque" alt="">Windows (C:)</div>
      <div><img data-i="cle-usb" alt="">SINDRY-DATA</div>
      <div><img data-i="images" alt="">Images</div>
    </div>
    <div class="win" id="win">
      <div class="bar"><img data-i="ce-pc" alt="">Ce PC<i>–□×</i></div>
      <div class="pane">
        <div class="side">
          <div class="on"><img data-i="ce-pc" alt="">Ce PC</div>
          <div><img data-i="disque" alt="">Windows (C:)</div>
          <div><img data-i="cle-usb" alt="">SINDRY-DATA</div>
          <div><img data-i="images" alt="">Images</div>
        </div>
        <div class="files">
          <div class="file"><img data-i="disque" alt=""><div>Windows (C:)<small>112 Go libres sur 476 Go</small><div class="gauge"><span style="width:76%"></span></div></div></div>
          <div class="file"><img data-i="disque" alt=""><div>Données (D:)<small>640 Go libres sur 931 Go</small><div class="gauge"><span style="width:31%"></span></div></div></div>
          <div class="file"><img data-i="cle-usb" alt=""><div>SINDRY-DATA<small>21 Go libres sur 28 Go</small><div class="gauge"><span style="width:25%"></span></div></div></div>
          <div class="file"><img data-i="images" alt=""><div>Images<small>38 éléments</small></div></div>
        </div>
      </div>
    </div>
    <div class="toasts">
      <div class="toast"><img data-i="ok" alt=""><div><b>Script terminé</b><span>Nettoyage du disque : 4,2 Go libérés.</span></div></div>
      <div class="toast"><img data-i="attention" alt=""><div><b>Attention</b><span>Il reste moins de 10 % sur Windows (C:).</span></div></div>
      <div class="toast"><img data-i="erreur" alt=""><div><b>Échec du script</b><span>Le disque est verrouillé par BitLocker.</span></div></div>
      <div class="toast"><img data-i="usb" alt=""><div><b>Clé USB branchée</b><span>« Sauvegardes » est prête.</span></div></div>
      <div class="toast"><img data-i="maj" alt=""><div><b>Mise à jour disponible</b><span>Une nouvelle version de Sindry est prête.</span></div></div>
    </div>
    <div class="task">
      <img class="start" src="${GEAR_URI}" alt="">
      <div class="app"><img data-i="ce-pc" alt="">Ce PC</div>
      <div class="tray">FR<img data-i="reseau" alt=""><img data-i="info" alt="">14:32</div>
    </div>
  </div></div>

  <h2>Toutes les tailles</h2>
  <p>Une icône doit tenir de 96 px (bureau, grands affichages) à 16 px (colonne de gauche, zone de notification).</p>
  <div class="sizes" id="sizes"></div>
</main>
<script>
  const ICONS = ${JSON.stringify(table)};
  const LIST = ${JSON.stringify(index.icones.map(({ id, label, groupe }) => ({ id, label, groupe })))};
  const FAMILIES = ${JSON.stringify(index.familles.map(({ lettre, nom, texte }) => ({ lettre, nom, texte })))};
  const WALL = ${JSON.stringify(WALL_URI)};
  const params = new URLSearchParams(location.search);
  let family = (params.get('f') || 'B').toUpperCase(), bg = params.get('bg') || 'nuit';

  const chips = document.getElementById('chips');
  chips.innerHTML = FAMILIES.map((f) => '<button data-f="' + f.lettre + '">' + f.lettre + ' · ' + f.nom + '</button>').join('');

  const matrix = document.getElementById('matrix');
  const firstNotif = LIST.findIndex((i) => i.groupe === 'notifs');
  matrix.tHead.innerHTML = '<tr><th></th>' + LIST.map((i, n) => '<th' + (n === firstNotif ? ' class="sep"' : '') + '>' + i.label + '</th>').join('') + '</tr>';
  matrix.tBodies[0].innerHTML = FAMILIES.map((f) => '<tr data-f="' + f.lettre + '"><th><b>' + f.lettre + ' · ' + f.nom + '</b><small>' + f.texte + '</small></th>'
    + LIST.map((i, n) => '<td' + (n === firstNotif ? ' class="sep"' : '') + '><img alt="' + i.label + '" src="' + ICONS[f.lettre][i.id] + '"></td>').join('') + '</tr>').join('');

  document.getElementById('desk').style.backgroundImage = 'url(' + WALL + ')';

  const sizes = document.getElementById('sizes');
  function render() {
    document.querySelectorAll('[data-f]').forEach((b) => {
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(b.dataset.f === family));
      else b.classList.toggle('selected', b.dataset.f === family);
    });
    document.querySelectorAll('[data-bg]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bg === bg)));
    matrix.className = 'on-' + bg;
    matrix.style.backgroundImage = bg === 'fond' ? 'url(' + WALL + ')' : '';
    matrix.style.backgroundSize = 'cover';
    document.querySelectorAll('img[data-i]').forEach((img) => { img.src = ICONS[family][img.dataset.i]; });
    sizes.innerHTML = [96, 64, 48, 32, 24, 16].map((s) => '<div class="row"><small>' + s + ' px</small>'
      + LIST.map((i) => '<img alt="" width="' + s + '" height="' + s + '" src="' + ICONS[family][i.id] + '">').join('') + '</div>').join('');
  }
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-f]');
    if (f) { family = f.dataset.f; render(); }
    const b = e.target.closest('[data-bg]');
    if (b) { bg = b.dataset.bg; render(); }
  });

  document.getElementById('win-toggle').addEventListener('click', (e) => {
    const hide = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(hide));
    document.getElementById('win').style.display = hide ? 'none' : '';
  });

  // The desktop has a fixed design size and scales to the column, down to a phone's width.
  const fit = document.getElementById('fit'), desk = document.getElementById('desk');
  function scale() {
    const k = fit.clientWidth / 1180;
    desk.style.transform = 'scale(' + k + ')';
    fit.style.height = Math.ceil(664 * k) + 'px';
  }
  addEventListener('resize', scale);
  scale();
  render();
</script>
</body>
</html>
`;
writeFileSync(OUT, html);
console.log(`[OK] ${OUT} (${Math.round(html.length / 1024)} Ko)`);

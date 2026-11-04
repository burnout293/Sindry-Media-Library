// Builds M55: the whole Prisme icon set of SindryOS, searchable, in place on the desktop, with what
// the system asks for compared to what the set gives.
// Usage: node maquette-prisme.mjs <set dir> <couverture.json> <wallpaper.webp> <gear-white.svg> <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , DIR, COVER, WALL, GEAR, OUT] = process.argv;
const HEURE = process.env.HEURE ?? '12:00';
const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8'));
const cover = JSON.parse(readFileSync(COVER, 'utf8'));
const uri = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;

const FILES = {};
for (const icon of index.icones) FILES[icon.nom] = uri(join(DIR, index.sections[icon.section].dossier, `${icon.nom}.svg`), 'image/svg+xml');
const gear = readFileSync(GEAR, 'utf8').replace(/viewBox="[^"]*"/, 'viewBox="-108 -108 216 216"');
const GEAR_URI = `data:image/svg+xml;base64,${Buffer.from(gear).toString('base64')}`;
const WALL_URI = uri(WALL, 'image/webp');
const nameCount = index.icones.reduce((n, i) => n + 1 + i.alias.length, 0);

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>M55 · SindryOS : le jeu d'icônes Prisme</title>
<style>
  @font-face { font-family: 'Inter'; font-weight: 100 900; font-display: swap; src: url('_ressources/inter-latin-wght-normal.woff2') format('woff2'); }
  :root { color-scheme: dark; --surface: #121A33; --surface2: #172142; --border: #2A3760; --text: #E4E9FF; --muted: #8E9AC0; --accent: #7B8CFF; --aurora: linear-gradient(90deg, #1FB5A3, #5B6CF0, #9A5BE0); }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; background: #0B1024; color: var(--text); font: 15px/1.45 Inter, system-ui, "Segoe UI", sans-serif; }
  main { max-width: 1240px; margin: 0 auto; padding: 18px 16px 64px; }
  h1 { margin: 0; font-size: 21px; font-weight: 650; }
  h2 { margin: 32px 0 4px; font-size: 17px; font-weight: 650; }
  h3 { margin: 18px 0 8px; font-size: 14px; font-weight: 650; }
  h3 small { color: var(--muted); font-weight: 400; margin-left: 6px; }
  p { margin: 4px 0 0; color: var(--muted); }
  button, input { font: inherit; font-size: 13px; color: var(--text); background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 6px 11px; }
  button { cursor: pointer; }
  button:hover { border-color: #46558F; }
  button[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  input { width: 100%; max-width: 280px; }
  input::placeholder { color: var(--muted); }
  .stats { display: flex; flex-wrap: wrap; gap: 22px; margin-top: 12px; }
  .stats b { display: block; font-size: 24px; font-weight: 650; line-height: 1.1; }
  .stats span { color: var(--muted); font-size: 12.5px; }
  .controls { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 12px; }
  .controls > span { color: var(--muted); font-size: 13px; margin: 0 2px 0 10px; }

  /* catalogue */
  #catalog { margin-top: 12px; padding: 4px 14px 16px; border: 1px solid var(--border); border-radius: 5px; background: var(--surface); }
  #catalog.fond { background: #0B1838 center / cover fixed no-repeat; }
  #catalog.clair { background: #F8FAFF; color: #141A2E; }
  #catalog.clair h3 small, #catalog.clair .card small { color: #56607A; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 6px 4px; }
  .card { text-align: center; padding: 6px 2px; font-size: 12px; line-height: 1.25; overflow-wrap: anywhere; }
  .card img { display: block; margin: 0 auto 5px; }
  .card small { display: block; color: var(--muted); font-size: 10px; margin-top: 2px; }
  .none { padding: 18px 0; color: var(--muted); }

  /* desktop */
  .fit { margin-top: 12px; border: 1px solid var(--border); border-radius: 5px; overflow: hidden; }
  .desk { position: relative; width: 1180px; height: 664px; background: #0B1838 center / cover no-repeat; transform-origin: 0 0; overflow: hidden; }
  .desk img { display: block; }
  .desk-icons { position: absolute; left: 14px; top: 14px; display: grid; gap: 10px; width: 88px; }
  .desk-icons div { text-align: center; font-size: 12px; color: #fff; }
  .desk-icons img { width: 52px; height: 52px; margin: 0 auto 3px; }
  .win { position: absolute; left: 120px; top: 20px; width: 680px; height: 490px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; overflow: hidden; }
  .win::before { content: ''; display: block; height: 3px; background: var(--aurora); }
  .bar { display: flex; align-items: center; height: 36px; padding-left: 12px; border-bottom: 1px solid var(--border); font-size: 13px; gap: 8px; }
  .bar img { width: 18px; height: 18px; }
  .bar i { margin-left: auto; color: var(--muted); font-style: normal; letter-spacing: 14px; font-size: 13px; }
  .pane { display: flex; height: calc(100% - 39px); }
  .side { width: 172px; background: var(--surface2); border-right: 1px solid var(--border); padding: 6px; font-size: 12.5px; overflow: hidden; }
  .side h6 { margin: 8px 7px 3px; font-size: 11px; font-weight: 500; color: var(--muted); }
  .side div { display: flex; align-items: center; gap: 8px; padding: 3px 7px; border-radius: 4px; }
  .side div.on { background: #243061; }
  .side img { width: 18px; height: 18px; }
  .files { flex: 1; padding: 10px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; align-content: start; font-size: 12px; text-align: center; line-height: 1.2; }
  .files img { width: 52px; height: 52px; margin: 0 auto 3px; }
  .toasts { position: absolute; right: 10px; bottom: 54px; width: 340px; display: grid; gap: 7px; }
  .toast { display: flex; gap: 11px; padding: 9px 11px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; font-size: 13px; line-height: 1.3; }
  .toast img { width: 38px; height: 38px; flex: none; }
  .toast b { display: block; font-weight: 600; }
  .toast span { color: var(--muted); font-size: 12.5px; }
  .task { position: absolute; left: 0; right: 0; bottom: 0; height: 46px; background: rgba(14, 20, 42, .94); border-top: 1px solid var(--border); display: flex; align-items: center; padding: 0 12px; gap: 6px; font-size: 13px; }
  .task .start { width: 24px; height: 24px; margin-right: 8px; }
  .task .app { display: flex; align-items: center; gap: 7px; height: 100%; padding: 0 10px; }
  .task .app.on { box-shadow: inset 0 -3px 0 #5B6CF0; }
  .task .app img { width: 22px; height: 22px; }
  .tray { margin-left: auto; display: flex; align-items: center; gap: 11px; color: var(--muted); }
  .tray img { width: 20px; height: 20px; }
  .menu { position: absolute; left: 10px; bottom: 54px; width: 720px; height: 560px; display: flex; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; overflow: hidden; }
  .menu .all { width: 230px; border-right: 1px solid var(--border); background: var(--surface2); padding: 8px 6px; font-size: 13px; overflow: hidden; }
  .menu .all h6 { margin: 7px 8px 2px; font-size: 11px; font-weight: 600; color: var(--accent); }
  .menu .all div { display: flex; align-items: center; gap: 9px; padding: 3px 8px; }
  .menu .all img { width: 22px; height: 22px; }
  .menu .right { flex: 1; display: flex; flex-direction: column; padding: 14px; font-size: 13px; min-width: 0; }
  .menu .search { padding: 7px 10px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface2); color: var(--muted); }
  .menu h5 { margin: 14px 0 7px; font-size: 12px; font-weight: 600; color: var(--muted); }
  .pins { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center; font-size: 12px; line-height: 1.2; }
  .pins img { width: 38px; height: 38px; margin: 0 auto 4px; }
  .logo { width: 38px; height: 38px; margin: 0 auto 4px; border: 1px dashed var(--muted); border-radius: 6px; color: var(--muted); font-size: 9px; line-height: 1.1; display: flex; align-items: center; justify-content: center; }
  .wins { display: flex; align-items: center; gap: 10px; padding: 7px 9px; border: 1px solid var(--border); border-radius: 4px; }
  .wins img { width: 26px; height: 26px; }
  .wins small { display: block; color: var(--muted); font-size: 12px; }
  .foot { margin-top: auto; display: flex; align-items: center; gap: 9px; border-top: 1px solid var(--border); padding-top: 10px; }
  .foot img { width: 24px; height: 24px; }
  .foot .sp { flex: 1; }

  /* coverage */
  .cover { margin-top: 12px; display: grid; gap: 6px; }
  details { border: 1px solid var(--border); border-radius: 4px; background: var(--surface); padding: 8px 12px; font-size: 13.5px; }
  summary { cursor: pointer; }
  summary b { font-weight: 650; margin-right: 6px; }
  details p { font-size: 12px; overflow-wrap: anywhere; font-family: "Cascadia Mono", Consolas, monospace; margin-top: 6px; }
  .note { border-left: 3px solid #EE9326; padding: 8px 12px; background: var(--surface); border-radius: 0 4px 4px 0; margin-top: 12px; font-size: 14px; }
  .note p { color: var(--text); margin: 0; }
  .note p + p { margin-top: 6px; }
</style>
</head>
<body>
<div data-maquette-badge style="position:fixed;left:10px;bottom:10px;z-index:2147483647;pointer-events:none;font:12px/1.3 Inter,system-ui,sans-serif;color:#fff;background:rgba(10,12,40,.82);border:1px solid rgba(255,255,255,.18);border-radius:4px;padding:4px 8px">M55 · 04/11/2026 ${HEURE} · SindryOS : le jeu d'icônes Prisme</div>
<main>
  <h1>SindryOS : le jeu d'icônes Prisme</h1>
  <p>La famille E de M54, étendue à tout l'OS, d'après ce que le système de l'image 0.9.0 demande vraiment.</p>
  <div class="stats">
    <div><b>${index.icones.length}</b><span>dessins</span></div>
    <div><b>${nameCount}</b><span>noms système couverts</span></div>
    <div><b>${cover.couverts.length} / ${cover.demandes}</b><span>noms demandés par l'OS</span></div>
  </div>

  <h2>En situation</h2>
  <div class="controls">
    <button data-scene="files" aria-pressed="true">Fichiers et notifications</button><button data-scene="menu" aria-pressed="false">Menu démarrer</button>
  </div>
  <div class="fit" id="fit"><div class="desk" id="desk">
    <div class="desk-icons">
      <div><img data-i="computer" alt="">Ce PC</div>
      <div><img data-i="sindryos-disque-windows" alt="">Windows (C:)</div>
      <div><img data-i="sindryos-data" alt="">SINDRY-DATA</div>
      <div><img data-i="folder-pictures" alt="">Images</div>
      <div><img data-i="user-trash" alt="">Corbeille</div>
    </div>
    <div class="scene" data-scene="files">
      <div class="win">
        <div class="bar"><img data-i="org.xfce.thunar" alt="">Dossier personnel<i>–□×</i></div>
        <div class="pane">
          <div class="side">
            <h6>Mes dossiers</h6>
            <div class="on"><img data-i="user-home" alt="">Dossier personnel</div>
            <div><img data-i="user-desktop" alt="">Bureau</div>
            <div><img data-i="folder-documents" alt="">Documents</div>
            <div><img data-i="folder-download" alt="">Téléchargements</div>
            <div><img data-i="folder-pictures" alt="">Images</div>
            <div><img data-i="folder-music" alt="">Musique</div>
            <div><img data-i="folder-videos" alt="">Vidéos</div>
            <div><img data-i="user-trash" alt="">Corbeille</div>
            <h6>Périphériques</h6>
            <div><img data-i="computer" alt="">Ce PC</div>
            <div><img data-i="drive-harddisk" alt="">Disque dur</div>
            <div><img data-i="sindryos-disque-windows" alt="">Windows (C:)</div>
            <div><img data-i="drive-removable-media-usb" alt="">Clé USB</div>
            <div><img data-i="drive-optical" alt="">Lecteur optique</div>
            <h6>Réseau</h6>
            <div><img data-i="network-workgroup" alt="">Parcourir le réseau</div>
          </div>
          <div class="files">
            <div><img data-i="folder-documents" alt="">Documents</div>
            <div><img data-i="folder-download" alt="">Téléchar&shy;gements</div>
            <div><img data-i="folder-pictures" alt="">Images</div>
            <div><img data-i="sindryos-dossier-scripts" alt="">Scripts</div>
            <div><img data-i="folder" alt="">Rapports</div>
            <div><img data-i="text-x-script" alt="">reparer.ps1</div>
            <div><img data-i="application-x-cd-image" alt="">sindryos.iso</div>
            <div><img data-i="package-x-generic" alt="">journaux.zip</div>
            <div><img data-i="text-x-log" alt="">analyse.log</div>
            <div><img data-i="text-x-ms-regedit" alt="">reglages.reg</div>
            <div><img data-i="application-x-ms-dos-executable" alt="">setup.exe</div>
            <div><img data-i="application-pdf" alt="">facture.pdf</div>
            <div><img data-i="image-x-generic" alt="">capture.png</div>
            <div><img data-i="video-x-generic" alt="">video.mp4</div>
            <div><img data-i="x-office-spreadsheet" alt="">budget.xlsx</div>
          </div>
        </div>
      </div>
      <div class="toasts">
        <div class="toast"><img data-i="emblem-ok" alt=""><div><b>Script terminé</b><span>Nettoyage du disque : 4,2 Go libérés.</span></div></div>
        <div class="toast"><img data-i="dialog-warning" alt=""><div><b>Attention</b><span>Il reste moins de 10 % sur Windows (C:).</span></div></div>
        <div class="toast"><img data-i="sindryos-notif-verrou" alt=""><div><b>Disque verrouillé</b><span>Windows (C:) est chiffré par BitLocker.</span></div></div>
        <div class="toast"><img data-i="notification-device" alt=""><div><b>Clé USB branchée</b><span>« Sauvegardes » est prête.</span></div></div>
      </div>
    </div>
    <div class="scene" data-scene="menu" hidden>
      <div class="menu">
        <div class="all">
          <h6>D</h6><div><img data-i="sindryos-boot-choice" alt="">Démarrage</div><div><img data-i="gparted" alt="">Disques</div><div><img data-i="org.xfce.volman" alt="">Disques amovibles</div>
          <h6>É</h6><div><img data-i="org.xfce.mousepad" alt="">Éditeur de texte</div><div><img data-i="org.xfce.settings.display" alt="">Écrans</div>
          <h6>F</h6><div><img data-i="org.xfce.thunar" alt="">Fichiers</div><div><img data-i="org.xfce.xfwm4" alt="">Fenêtres</div>
          <h6>I</h6><div><img data-i="org.xfce.ristretto" alt="">Images</div>
          <h6>P</h6><div><img data-i="org.xfce.settings.manager" alt="">Paramètres</div><div><img data-i="org.xfce.powermanager" alt="">Alimentation</div>
          <h6>R</h6><div><img data-i="preferences-system-network" alt="">Réseau</div><div><img data-i="sindryos-windows" alt="">Redémarrer sous Windows</div>
          <h6>T</h6><div><img data-i="org.xfce.terminal" alt="">Terminal</div>
        </div>
        <div class="right">
          <div class="search">Rechercher une application</div>
          <h5>Épinglés</h5>
          <div class="pins">
            <div><img data-i="org.xfce.thunar" alt="">Fichiers</div>
            <div><div class="logo">son logo</div>Firefox</div>
            <div><img data-i="org.xfce.terminal" alt="">Terminal</div>
            <div><img data-i="gparted" alt="">Disques</div>
            <div><img data-i="org.xfce.mousepad" alt="">Éditeur de texte</div>
            <div><img data-i="org.xfce.ristretto" alt="">Images</div>
            <div><div class="logo">son logo</div>VLC</div>
            <div><img data-i="org.xfce.settings.manager" alt="">Paramètres</div>
          </div>
          <h5>Windows détectés</h5>
          <div class="wins"><img data-i="sindryos-disque-windows" alt=""><div>Windows 11<small>Disque 0, 476 Go</small></div></div>
          <div class="foot"><img data-i="avatar-default" alt="">Session<span class="sp"></span><img data-i="sindryos-windows" alt=""><img data-i="system-reboot" alt=""><img data-i="system-shutdown" alt=""></div>
        </div>
      </div>
    </div>
    <div class="task">
      <img class="start" src="${GEAR_URI}" alt="">
      <div class="app on"><img data-i="org.xfce.thunar" alt="">Fichiers</div>
      <div class="app"><img data-i="org.xfce.terminal" alt="">Terminal</div>
      <div class="tray">FR<img data-i="nm-signal-75" alt=""><img data-i="audio-volume-medium" alt=""><img data-i="battery-good" alt="">14:32</div>
    </div>
  </div></div>
  <p>Le lanceur reste ici l'engrenage actuel : les idées pour le remplacer sont dans M56. Firefox et VLC gardent leur logo.</p>

  <h2>Tout le jeu</h2>
  <div class="controls">
    <input id="search" type="search" placeholder="Chercher : disque, wifi, folder…" aria-label="Chercher une icône">
    <span>Taille</span><button data-size="24">24</button><button data-size="32">32</button><button data-size="48">48</button><button data-size="64">64</button><button data-size="96">96</button>
    <span>Fond</span><button data-bg="nuit">Nuit</button><button data-bg="fond">Fond d'écran</button><button data-bg="clair">Clair</button>
  </div>
  <div id="catalog"></div>

  <h2>Ce que l'OS demande</h2>
  <p>Le système de l'image 0.9.0 a été extrait et ses programmes passés au crible : ${cover.demandes} noms d'icônes y sont cités, hors symboles monochromes des barres d'outils, qui restent ceux d'Adwaita. ${cover.couverts.length} sont couverts ; les autres restent ceux du système, pour ces raisons :</p>
  <div class="cover" id="cover"></div>
  <div class="note">
    <p><b>À corriger dans l'OS :</b> l'image 0.9.0 n'a pas de programme de notifications (xfce4-notifyd). Sans lui, les icônes de notification sont prêtes mais rien ne les affiche.</p>
    <p>Les icônes de la barre des tâches sont blanches : elles sont faites pour le thème Nuit. Sur le thème clair, il faudra leur donner une version sombre.</p>
    <p>Les symboles des tuiles viennent de Lucide (licence ISC, dans <code>LICENCE-LUCIDE.txt</code>) ; les objets (Ce PC, disques, corbeille…) sont dessinés pour SindryOS. librsvg, le moteur de l'OS, dessine les 209 fichiers de M55 et M56 sans erreur et comme ce navigateur (écart moyen de 0,4 sur 255).</p>
  </div>
</main>
<script>
  const FILES = ${JSON.stringify(FILES)};
  const INDEX = ${JSON.stringify(index)};
  const LEFT = ${JSON.stringify(cover.laisses)};
  const WALL = ${JSON.stringify(WALL_URI)};
  const params = new URLSearchParams(location.search);
  let size = Number(params.get('size')) || 48, bg = params.get('bg') || 'nuit', query = '';

  document.querySelectorAll('img[data-i]').forEach((img) => {
    if (!FILES[img.dataset.i]) throw new Error('icône absente : ' + img.dataset.i);
    img.src = FILES[img.dataset.i];
  });
  document.getElementById('desk').style.backgroundImage = 'url(' + WALL + ')';

  const norm = (s) => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
  const catalog = document.getElementById('catalog');
  function renderCatalog() {
    catalog.className = bg;
    catalog.style.backgroundImage = bg === 'fond' ? 'url(' + WALL + ')' : '';
    let html = '', shown = 0;
    for (const [key, section] of Object.entries(INDEX.sections)) {
      const icons = INDEX.icones.filter((i) => i.section === key && (!query || norm([i.label, i.nom, ...i.alias].join(' ')).includes(query)));
      if (!icons.length) continue;
      shown += icons.length;
      html += '<h3>' + section.titre + '<small>' + icons.length + '</small></h3><div class="grid">' + icons.map((i) => '<div class="card"><img alt="" width="' + size + '" height="' + size + '" src="' + FILES[i.nom] + '">' + i.label + '<small>' + i.nom + (i.alias.length ? ' +' + i.alias.length : '') + '</small></div>').join('') + '</div>';
    }
    catalog.innerHTML = html || '<div class="none">Aucune icône pour cette recherche.</div>';
    document.querySelectorAll('[data-size]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.size) === size)));
    document.querySelectorAll('[data-bg]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bg === bg)));
  }
  document.getElementById('search').addEventListener('input', (e) => { query = norm(e.target.value.trim()); renderCatalog(); });
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-size]');
    if (s) { size = Number(s.dataset.size); renderCatalog(); }
    const b = e.target.closest('[data-bg]');
    if (b) { bg = b.dataset.bg; renderCatalog(); }
    const c = e.target.closest('button[data-scene]');
    if (c) {
      document.querySelectorAll('button[data-scene]').forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      document.querySelectorAll('.scene').forEach((x) => { x.hidden = x.dataset.scene !== c.dataset.scene; });
    }
  });
  document.getElementById('cover').innerHTML = Object.entries(LEFT).map(([reason, names]) => '<details><summary><b>' + names.length + '</b>' + reason + '</summary><p>' + names.join(', ') + '</p></details>').join('');

  const fit = document.getElementById('fit'), desk = document.getElementById('desk');
  function scale() {
    const k = fit.clientWidth / 1180;
    desk.style.transform = 'scale(' + k + ')';
    fit.style.height = Math.ceil(664 * k) + 'px';
  }
  addEventListener('resize', scale);
  scale();
  if (params.get('scene') === 'menu') document.querySelector('button[data-scene="menu"]').click();
  renderCatalog();
</script>
</body>
</html>
`;
writeFileSync(OUT, html);
console.log(`[OK] ${OUT} (${Math.round(html.length / 1024)} Ko)`);

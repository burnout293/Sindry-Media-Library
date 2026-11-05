// Builds M57: the four versions of the Allumage launcher and the two lots of Prisme icons, on one page.
// Icons are embedded as they are in their files and shown through <img>.
// Usage: node maquette-lots.mjs <lot sans-fond> <lot avec-fond> <allumage dir> <couverture.json> <wallpaper.webp> <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , SANS, AVEC, IGNITION, COVER, WALL, OUT] = process.argv;
const HEURE = process.env.HEURE ?? '12:00';
const index = JSON.parse(readFileSync(join(SANS, 'index.json'), 'utf8'));
const cover = JSON.parse(readFileSync(COVER, 'utf8'));
const uri = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;
const read = (dir) => Object.fromEntries(index.icones.map((i) => [i.nom, uri(join(dir, index.sections[i.section].dossier, `${i.nom}.svg`), 'image/svg+xml')]));
const FILES = { sans: read(SANS), avec: read(AVEC) };
const VERSIONS = [
  { id: 'clair', nom: 'Clair', texte: 'Blanc, pour la barre sombre (thème Nuit).', fond: 'sombre' },
  { id: 'sombre', nom: 'Sombre', texte: 'Encre, pour une barre claire (thème Prisme 4).', fond: 'clair' },
  { id: 'couleur', nom: 'Coloré', texte: 'Aplats et facettes, comme les autres icônes : anneau indigo, flamme orangée.', fond: 'sombre' },
  { id: 'officiel', nom: 'Couleurs officielles', texte: "L'anneau au gris de l'engrenage, la flamme à l'orange de Sindry.", fond: 'sombre' },
].map((v) => ({ ...v, src: uri(join(IGNITION, `allumage-${v.id}.svg`), 'image/svg+xml') }));
const WALL_URI = uri(WALL, 'image/webp');
const nameCount = index.icones.reduce((n, i) => n + 1 + i.alias.length, 0);

const SAMPLE = ['computer', 'drive-harddisk', 'drive-removable-media-usb', 'folder', 'folder-documents', 'user-trash', 'org.xfce.terminal', 'org.xfce.settings.manager', 'scanner', 'help-browser', 'dialog-warning', 'text-x-script'];
// The icons asked for by name on 05/11, in their order, then what was added next to them.
const ASKED = ['network-wired-disconnected', 'sindryos-barre-pc', 'network-internet', 'sindryos-barre-usb', 'sindryos-barre-notifications', 'network-vpn', 'sindryos-barre-parametres', 'bluetooth-active', 'airplane-mode', 'display-brightness', 'audio-input-microphone-high', 'location-active', 'sindryos-barre-clavier', 'sindryos-barre-maj', 'sindryos-barre-securite', 'sindryos-barre-recherche', 'sindryos-barre-compte', 'sindryos-barre-langue', 'sindryos-barre-ergonomie'];
const EXTRA = ['bluetooth-paired', 'bluetooth-disabled', 'audio-input-microphone-muted', 'display-brightness-medium', 'display-brightness-low', 'notification-new', 'notification-disabled', 'sindryos-barre-ejecter', 'location-disabled', 'sindryos-barre-securite-alerte', 'sindryos-barre-theme', 'sindryos-barre-presse-papiers', 'sindryos-barre-capture', 'sindryos-barre-imprimante', 'sindryos-barre-cast', 'sindryos-barre-reseau-mobile', 'sindryos-barre-script', 'sindryos-barre-windows'];
for (const n of [...SAMPLE, ...ASKED, ...EXTRA]) if (!FILES.sans[n]) throw new Error(`icône absente : ${n}`);

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>M57 · SindryOS : Allumage et deux lots d'icônes</title>
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
  img { display: block; }
  button, input { font: inherit; font-size: 13px; color: var(--text); background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 6px 11px; }
  button { cursor: pointer; }
  button:hover { border-color: #46558F; }
  button[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  input { width: 100%; max-width: 280px; }
  input::placeholder { color: var(--muted); }
  .controls { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 12px; }
  .controls > span { color: var(--muted); font-size: 13px; margin: 0 2px 0 10px; }
  .controls > span:first-child { margin-left: 0; }
  .lot-switch button { font-size: 15px; font-weight: 600; padding: 9px 16px; }
  .sticky { position: sticky; top: 0; z-index: 5; background: #0B1024; padding: 10px 0; margin-top: 8px; border-bottom: 1px solid var(--border); }

  /* the launcher */
  .versions { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; margin-top: 12px; }
  .version { display: flex; flex-direction: column; justify-content: flex-start; border: 1px solid var(--border); border-radius: 5px; overflow: hidden; cursor: pointer; background: var(--surface); text-align: left; padding: 0; color: inherit; font: inherit; }
  .version[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .show { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 18px 12px; }
  .show.clair { background: #F8FAFF; }
  .show.sombre { background: #0E142A; }
  .show img.big { width: 96px; height: 96px; }
  .sizes4 { display: grid; gap: 8px; justify-items: center; }
  .sizes4 div { display: flex; align-items: center; gap: 8px; }
  .version .txt { display: block; padding: 10px 12px 12px; }
  .version b { display: block; font-weight: 650; }
  .version .txt span { display: block; color: var(--muted); font-size: 13px; margin-top: 2px; }

  /* comparison */
  .scroll { overflow-x: auto; margin-top: 12px; border: 1px solid var(--border); border-radius: 5px; }
  table { border-collapse: collapse; min-width: 900px; width: 100%; background: var(--surface); }
  th, td { padding: 9px 6px; text-align: center; border-bottom: 1px solid var(--border); }
  tr:last-child td, tr:last-child th { border-bottom: 0; }
  thead th { font-size: 11.5px; font-weight: 500; color: var(--muted); }
  tbody th { text-align: left; font-weight: 650; width: 110px; padding-left: 12px; cursor: pointer; }
  tbody tr { cursor: pointer; }
  tbody tr.selected { box-shadow: inset 3px 0 0 var(--accent); }
  td img { width: 56px; height: 56px; margin: 0 auto; }

  /* desktop */
  .fit { margin-top: 12px; border: 1px solid var(--border); border-radius: 5px; overflow: hidden; }
  .desk { position: relative; width: 1180px; height: 664px; background: #0B1838 center / cover no-repeat; transform-origin: 0 0; overflow: hidden; }
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
  .task .start { width: 26px; height: 26px; margin-right: 8px; flex: none; }
  .task .app { display: flex; align-items: center; gap: 7px; height: 100%; padding: 0 10px; white-space: nowrap; }
  .task .app.on { box-shadow: inset 0 -3px 0 #5B6CF0; }
  .task .app img { width: 22px; height: 22px; }
  .tray { margin-left: auto; display: flex; align-items: center; gap: 9px; color: var(--muted); white-space: nowrap; }
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

  /* the bar's icons */
  .strip { position: relative; margin-top: 12px; height: 46px; border: 1px solid var(--border); border-radius: 5px; overflow: hidden; background: rgba(14, 20, 42, 1); }
  .strip .task { position: absolute; overflow: hidden; border-top: 0; }
  .barsec { margin-top: 12px; padding: 4px 14px 14px; border: 1px solid var(--border); border-radius: 5px; background: #0E142A; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 6px 4px; }
  .card { text-align: center; padding: 6px 2px; font-size: 12px; line-height: 1.25; overflow-wrap: anywhere; }
  .card img { margin: 0 auto 5px; }
  .card small { display: block; color: var(--muted); font-size: 10px; margin-top: 2px; }
  .barsec .card img { width: 40px; height: 40px; }

  /* catalogue */
  #catalog { margin-top: 12px; padding: 4px 14px 16px; border: 1px solid var(--border); border-radius: 5px; background: var(--surface); }
  #catalog.fond { background: #0B1838 center / cover fixed no-repeat; }
  #catalog.clair { background: #F8FAFF; color: #141A2E; }
  #catalog.clair h3 small, #catalog.clair .card small { color: #56607A; }
  .none { padding: 18px 0; color: var(--muted); }
  .note { border-left: 3px solid #EE9326; padding: 8px 12px; background: var(--surface); border-radius: 0 4px 4px 0; margin-top: 12px; font-size: 14px; }
  .note p { color: var(--text); margin: 0; }
  .note p + p { margin-top: 6px; }
  .note code { font-size: 12.5px; }
  @media (max-width: 560px) { .task .app.opt { display: none; } }
</style>
</head>
<body>
<div data-maquette-badge style="position:fixed;left:10px;bottom:10px;z-index:2147483647;pointer-events:none;font:12px/1.3 Inter,system-ui,sans-serif;color:#fff;background:rgba(10,12,40,.82);border:1px solid rgba(255,255,255,.18);border-radius:4px;padding:4px 8px">M57 · 05/11/2026 ${HEURE} · SindryOS : Allumage et deux lots d'icônes</div>
<main>
  <h1>SindryOS : Allumage et deux lots d'icônes</h1>
  <p>Le lanceur retenu en quatre versions, et le jeu Prisme en deux lots complets : ${index.icones.length} dessins pour ${nameCount} noms système dans chacun. Cliquer sur une version la pose sur toutes les barres de la page.</p>

  <h2>Allumage, quatre versions</h2>
  <div class="versions" id="versions"></div>

  <h2>Les deux lots, côte à côte</h2>
  <p><b>Sans fond</b> : chaque icône est un objet, comme Ce PC ou Disque dur. <b>Avec fond</b> : chaque icône est un symbole blanc sur une tuile, comme Scanner ou Aide.</p>
  <div class="scroll"><table id="compare"><thead></thead><tbody></tbody></table></div>

  <div class="sticky"><div class="controls lot-switch" style="margin-top:0"><span>Lot affiché</span><button data-lot="sans">Sans fond</button><button data-lot="avec">Avec fond</button></div></div>

  <h2>La barre des tâches</h2>
  <div class="strip"><div class="task">
    <img class="start" data-start alt="Lanceur">
    <div class="app on"><img data-i="org.xfce.thunar" alt="">Fichiers</div>
    <div class="app opt"><img data-i="org.xfce.terminal" alt="">Terminal</div>
    <div class="tray"><img data-i="sindryos-barre-notifications" alt=""><img data-i="sindryos-barre-usb" alt=""><img data-i="network-vpn" alt=""><img data-i="bluetooth-active" alt=""><img data-i="display-brightness" alt=""><img data-i="audio-input-microphone-high" alt=""><img data-i="sindryos-barre-clavier" alt="">FR<img data-i="network-internet" alt=""><img data-i="nm-signal-75" alt=""><img data-i="audio-volume-medium" alt=""><img data-i="battery-good" alt="">14:32</div>
  </div></div>
  <div class="barsec"><h3>Celles que tu as demandées<small>${ASKED.length}</small></h3><div class="grid" id="asked"></div>
  <h3>Ajoutées à côté<small>${EXTRA.length}</small></h3><div class="grid" id="extra"></div></div>

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
      <img class="start" data-start alt="Lanceur">
      <div class="app on"><img data-i="org.xfce.thunar" alt="">Fichiers</div>
      <div class="app"><img data-i="org.xfce.terminal" alt="">Terminal</div>
      <div class="tray"><img data-i="sindryos-barre-notifications" alt=""><img data-i="sindryos-barre-usb" alt="">FR<img data-i="nm-signal-75" alt=""><img data-i="audio-volume-medium" alt=""><img data-i="battery-good" alt="">14:32</div>
    </div>
  </div></div>

  <h2>Tout le lot</h2>
  <div class="controls">
    <input id="search" type="search" placeholder="Chercher : disque, wifi, folder…" aria-label="Chercher une icône">
    <span>Taille</span><button data-size="24">24</button><button data-size="32">32</button><button data-size="48">48</button><button data-size="64">64</button><button data-size="96">96</button>
    <span>Fond</span><button data-bg="nuit">Nuit</button><button data-bg="fond">Fond d'écran</button><button data-bg="clair">Clair</button>
  </div>
  <div id="catalog"></div>

  <div class="note">
    <p><b>Couverture :</b> ${cover.couverts.length} des ${cover.demandes} noms que l'image 0.9.0 demande sont couverts, dans les deux lots. Les autres restent ceux du système (logos de Firefox et VLC, réseau mobile, schémas internes de réglages…).</p>
    <p><b>À corriger dans l'OS :</b> l'image 0.9.0 n'a pas de programme de notifications (xfce4-notifyd). Sans lui, les icônes de notification sont prêtes mais rien ne les affiche.</p>
    <p><b>Lot Sans fond, barre des tâches :</b> les icônes sont blanches, faites pour la barre sombre, comme le lanceur Clair. Sur un thème clair, il leur faudra une version sombre.</p>
  </div>
</main>
<script>
  const FILES = ${JSON.stringify(FILES)};
  const INDEX = ${JSON.stringify(index)};
  const VERSIONS = ${JSON.stringify(VERSIONS)};
  const SAMPLE = ${JSON.stringify(SAMPLE)}, ASKED = ${JSON.stringify(ASKED)}, EXTRA = ${JSON.stringify(EXTRA)};
  const WALL = ${JSON.stringify(WALL_URI)};
  const LABEL = Object.fromEntries(INDEX.icones.map((i) => [i.nom, i.label]));
  const params = new URLSearchParams(location.search);
  let lot = params.get('lot') === 'avec' ? 'avec' : 'sans', size = Number(params.get('size')) || 48, bg = params.get('bg') || 'nuit', query = '', version = params.get('v') || 'clair';

  document.getElementById('versions').innerHTML = VERSIONS.map((v) => '<button class="version" data-version="' + v.id + '" aria-pressed="false"><span class="show ' + v.fond + '"><img class="big" alt="" src="' + v.src + '"><span class="sizes4"><span style="display:flex;align-items:center;gap:8px"><img alt="" width="48" height="48" src="' + v.src + '"><img alt="" width="32" height="32" src="' + v.src + '"></span><span style="display:flex;align-items:center;gap:8px"><img alt="" width="24" height="24" src="' + v.src + '"><img alt="" width="16" height="16" src="' + v.src + '"></span></span></span><span class="txt"><b>' + v.nom + '</b><span>' + v.texte + '</span></span></button>').join('');

  const compare = document.getElementById('compare');
  compare.tHead.innerHTML = '<tr><th></th>' + SAMPLE.map((n) => '<th>' + LABEL[n] + '</th>').join('') + '</tr>';
  compare.tBodies[0].innerHTML = [['sans', 'Sans fond'], ['avec', 'Avec fond']].map(([k, t]) => '<tr data-lot="' + k + '"><th>' + t + '</th>' + SAMPLE.map((n) => '<td><img alt="' + LABEL[n] + '" src="' + FILES[k][n] + '"></td>').join('') + '</tr>').join('');
  document.getElementById('desk').style.backgroundImage = 'url(' + WALL + ')';

  const cards = (names) => names.map((n) => '<div class="card"><img alt="" data-i="' + n + '">' + LABEL[n] + '</div>').join('');
  document.getElementById('asked').innerHTML = cards(ASKED);
  document.getElementById('extra').innerHTML = cards(EXTRA);

  const norm = (s) => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
  const catalog = document.getElementById('catalog');
  function renderCatalog() {
    catalog.className = bg;
    catalog.style.backgroundImage = bg === 'fond' ? 'url(' + WALL + ')' : '';
    let html = '';
    for (const [key, section] of Object.entries(INDEX.sections)) {
      const icons = INDEX.icones.filter((i) => i.section === key && (!query || norm([i.label, i.nom, ...i.alias].join(' ')).includes(query)));
      if (!icons.length) continue;
      html += '<h3>' + section.titre + '<small>' + icons.length + '</small></h3><div class="grid">' + icons.map((i) => '<div class="card"><img alt="" width="' + size + '" height="' + size + '" src="' + FILES[lot][i.nom] + '">' + i.label + '<small>' + i.nom + (i.alias.length ? ' +' + i.alias.length : '') + '</small></div>').join('') + '</div>';
    }
    catalog.innerHTML = html || '<div class="none">Aucune icône pour cette recherche.</div>';
    document.querySelectorAll('[data-size]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.size) === size)));
    document.querySelectorAll('[data-bg]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bg === bg)));
  }
  function render() {
    document.querySelectorAll('img[data-i]').forEach((img) => {
      if (!FILES[lot][img.dataset.i]) throw new Error('icône absente : ' + img.dataset.i);
      img.src = FILES[lot][img.dataset.i];
    });
    const current = VERSIONS.find((v) => v.id === version);
    document.querySelectorAll('img[data-start]').forEach((img) => { img.src = current.src; });
    document.querySelectorAll('.version').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.version === version)));
    document.querySelectorAll('button[data-lot]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lot === lot)));
    document.querySelectorAll('tr[data-lot]').forEach((r) => r.classList.toggle('selected', r.dataset.lot === lot));
    renderCatalog();
  }
  document.getElementById('search').addEventListener('input', (e) => { query = norm(e.target.value.trim()); renderCatalog(); });
  document.addEventListener('click', (e) => {
    const v = e.target.closest('[data-version]');
    if (v) { version = v.dataset.version; render(); }
    const l = e.target.closest('[data-lot]');
    if (l) { lot = l.dataset.lot; render(); }
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

  const fit = document.getElementById('fit'), desk = document.getElementById('desk');
  function scale() {
    const k = fit.clientWidth / 1180;
    desk.style.transform = 'scale(' + k + ')';
    fit.style.height = Math.ceil(664 * k) + 'px';
  }
  addEventListener('resize', scale);
  scale();
  if (params.get('scene') === 'menu') document.querySelector('button[data-scene="menu"]').click();
  render();
</script>
</body>
</html>
`;
writeFileSync(OUT, html);
console.log(`[OK] ${OUT} (${Math.round(html.length / 1024)} Ko)`);

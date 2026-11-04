// Builds M56: ideas for SindryOS's launcher, on the real taskbar, in white and in colour, next to the
// Settings icon they must not be mistaken for.
// Usage: node maquette-lanceur.mjs <ideas dir> <set dir> <wallpaper.webp> <gear-white.svg> <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , IDEAS_DIR, SET, WALL, GEAR, OUT] = process.argv;
const HEURE = process.env.HEURE ?? '12:00';
const ideas = JSON.parse(readFileSync(join(IDEAS_DIR, 'index.json'), 'utf8'));
const uri = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;
const svg = (file) => uri(file, 'image/svg+xml');

const gear = readFileSync(GEAR, 'utf8').replace(/viewBox="[^"]*"/, 'viewBox="-108 -108 216 216"');
const CURRENT = `data:image/svg+xml;base64,${Buffer.from(gear).toString('base64')}`;
const LIST = [
  { id: '0-actuel', nom: "L'engrenage actuel", texte: 'Pour comparer : la roue seule, proche de ce qu\'on attend d\'un bouton de réglages.', limite: 'Se lit « Paramètres ».', blanc: CURRENT, couleur: CURRENT },
  ...ideas.map((i) => ({ ...i, blanc: svg(join(IDEAS_DIR, `${i.id}-blanc.svg`)), couleur: svg(join(IDEAS_DIR, `${i.id}-couleur.svg`)) })),
];
const SET_ICONS = Object.fromEntries(['org.xfce.settings.manager', 'org.xfce.thunar', 'org.xfce.terminal', 'system-shutdown', 'nm-signal-75', 'audio-volume-medium']
  .map((n) => [n, svg(join(SET, n === 'org.xfce.settings.manager' || n === 'org.xfce.thunar' || n === 'org.xfce.terminal' ? 'apps' : n === 'system-shutdown' ? 'actions' : 'status', `${n}.svg`))]));
const WALL_URI = uri(WALL, 'image/webp');

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>M56 · SindryOS : idées de lanceur</title>
<style>
  @font-face { font-family: 'Inter'; font-weight: 100 900; font-display: swap; src: url('_ressources/inter-latin-wght-normal.woff2') format('woff2'); }
  :root { color-scheme: dark; --surface: #121A33; --surface2: #172142; --border: #2A3760; --text: #E4E9FF; --muted: #8E9AC0; --accent: #7B8CFF; }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; background: #0B1024; color: var(--text); font: 15px/1.45 Inter, system-ui, "Segoe UI", sans-serif; }
  main { max-width: 1100px; margin: 0 auto; padding: 18px 16px 64px; }
  h1 { margin: 0; font-size: 21px; font-weight: 650; }
  h2 { margin: 30px 0 4px; font-size: 17px; font-weight: 650; }
  p { margin: 4px 0 0; color: var(--muted); }
  button { font: inherit; font-size: 13px; color: var(--text); background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 6px 11px; cursor: pointer; }
  button:hover { border-color: #46558F; }
  button[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .controls { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 12px; }

  /* the taskbar, on the bottom of the wallpaper */
  .scene { position: relative; margin-top: 12px; height: 180px; border: 1px solid var(--border); border-radius: 5px; overflow: hidden; background: #0B1838 center bottom / cover no-repeat; }
  .task { position: absolute; left: 0; right: 0; bottom: 0; height: 46px; background: rgba(14, 20, 42, .94); border-top: 1px solid var(--border); display: flex; align-items: center; gap: 4px; padding: 0 8px; font-size: 13px; }
  .start { width: 46px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
  .start.hover { background: #243061; }
  .start img { width: 26px; height: 26px; display: block; }
  .app { display: flex; align-items: center; gap: 7px; height: 100%; padding: 0 10px; white-space: nowrap; }
  .app img { width: 22px; height: 22px; display: block; }
  .app.on { box-shadow: inset 0 -3px 0 #5B6CF0; }
  .tray { margin-left: auto; display: flex; align-items: center; gap: 11px; color: var(--muted); white-space: nowrap; }
  .tray img { width: 20px; height: 20px; display: block; }
  @media (max-width: 560px) { .app.opt { display: none; } }

  /* the ideas */
  .ideas { display: grid; gap: 8px; margin-top: 12px; }
  .idea { display: grid; grid-template-columns: 96px 96px minmax(0, 1fr) 150px; gap: 14px; align-items: center; padding: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; cursor: pointer; }
  .idea.on { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .idea img { display: block; }
  .big { width: 96px; height: 96px; }
  .idea b { display: block; font-weight: 650; }
  .idea span { display: block; font-size: 13.5px; color: var(--text); margin-top: 2px; }
  .idea small { display: block; font-size: 12.5px; color: var(--muted); margin-top: 3px; }
  .small { display: grid; grid-template-columns: repeat(4, auto); gap: 8px 10px; align-items: center; justify-content: start; background: #0E142A; border-radius: 4px; padding: 8px; }
  .small img { width: 24px; height: 24px; }
  .small img.tiny { width: 16px; height: 16px; }
  @media (max-width: 720px) {
    .idea { grid-template-columns: 72px 72px minmax(0, 1fr); }
    .big { width: 72px; height: 72px; }
    .small { grid-column: 1 / -1; grid-template-columns: repeat(4, auto); }
  }
</style>
</head>
<body>
<div data-maquette-badge style="position:fixed;left:10px;bottom:10px;z-index:2147483647;pointer-events:none;font:12px/1.3 Inter,system-ui,sans-serif;color:#fff;background:rgba(10,12,40,.82);border:1px solid rgba(255,255,255,.18);border-radius:4px;padding:4px 8px">M56 · 04/11/2026 ${HEURE} · SindryOS : idées de lanceur</div>
<main>
  <h1>SindryOS : neuf idées de lanceur</h1>
  <p>Le bouton de la barre des tâches est aujourd'hui l'engrenage de Sindry, qui fait penser à un bouton de réglages. Chaque idée existe en blanc et en couleur, sur la vraie barre, à côté de l'icône Paramètres.</p>

  <h2>Sur la barre</h2>
  <div class="controls" id="tones"><button data-tone="blanc">Blanc</button><button data-tone="couleur">Couleur</button><button data-hover aria-pressed="false">Survol</button></div>
  <div class="scene" id="scene">
    <div class="task">
      <div class="start" id="start"><img id="mark" alt="Lanceur"></div>
      <div class="app on"><img src="${SET_ICONS['org.xfce.thunar']}" alt="">Fichiers</div>
      <div class="app"><img src="${SET_ICONS['org.xfce.settings.manager']}" alt="">Paramètres</div>
      <div class="app opt"><img src="${SET_ICONS['org.xfce.terminal']}" alt="">Terminal</div>
      <div class="tray">FR<img src="${SET_ICONS['nm-signal-75']}" alt=""><img src="${SET_ICONS['audio-volume-medium']}" alt="">14:32</div>
    </div>
  </div>

  <h2>Les idées</h2>
  <p>Cliquer sur une idée la pose sur la barre. À droite, elle est en blanc et en couleur, à 24 et 16 px.</p>
  <div class="ideas" id="ideas"></div>
</main>
<script>
  const LIST = ${JSON.stringify(LIST)};
  const params = new URLSearchParams(location.search);
  let current = params.get('idee') || LIST[3].id, tone = params.get('ton') || 'blanc';
  document.getElementById('scene').style.backgroundImage = 'url(${WALL_URI})';
  const box = document.getElementById('ideas');
  box.innerHTML = LIST.map((i) => '<div class="idea" data-id="' + i.id + '" role="button" tabindex="0">'
    + '<img class="big" src="' + i.blanc + '" alt=""><img class="big" src="' + i.couleur + '" alt="">'
    + '<div><b>' + i.nom + '</b><span>' + i.texte + '</span><small>' + i.limite + '</small></div>'
    + '<div class="small"><img src="' + i.blanc + '" alt=""><img src="' + i.couleur + '" alt=""><img class="tiny" src="' + i.blanc + '" alt=""><img class="tiny" src="' + i.couleur + '" alt=""></div></div>').join('');
  function render() {
    const idea = LIST.find((i) => i.id === current);
    document.getElementById('mark').src = idea[tone];
    document.querySelectorAll('.idea').forEach((d) => d.classList.toggle('on', d.dataset.id === current));
    document.querySelectorAll('[data-tone]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tone === tone)));
  }
  box.addEventListener('click', (e) => { const d = e.target.closest('.idea'); if (d) { current = d.dataset.id; render(); } });
  box.addEventListener('keydown', (e) => { const d = e.target.closest('.idea'); if (d && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); current = d.dataset.id; render(); } });
  document.getElementById('tones').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.tone) tone = b.dataset.tone;
    else {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      document.getElementById('start').classList.toggle('hover', on);
    }
    render();
  });
  render();
</script>
</body>
</html>
`;
writeFileSync(OUT, html);
console.log(`[OK] ${OUT} (${Math.round(html.length / 1024)} Ko)`);

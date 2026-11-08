/* La page d'accueil de la médiathèque. Elle lit manifest.json, écrit par
   outils/construire-site.mjs. À défaut (site publié directement depuis la branche,
   aperçu sans construction), elle lit l'arbre du dépôt par l'API GitHub.
   Chaque dossier de premier niveau devient une section ; mockups/, icons/ et
   images/ ont leur présentation, tout autre dossier s'affiche en liste de fichiers. */
(() => {
  'use strict';

  const DEPOT = 'burnout293/Sindry-Media-Library';
  const BRANCHE = 'main';
  const PAS_DES_DONNEES = new Set(['outils', 'accueil', 'node_modules']);
  const SECTIONS = {
    suivi: { titre: 'Avancement', un: 'infographie', des: 'infographies', texte: "Où en est le projet Sindry : versions, tâches, décisions qui t'attendent. La plus récente en tête." },
    mockups: { titre: 'Mockups', un: 'mockup', des: 'mockups', texte: "Les maquettes de tous les projets Sindry, numérotées dans l'ordre de création. La plus récente en tête." },
    'icones-sindry': { titre: 'Icônes de Sindry', un: 'icône de Sindry', des: 'icônes de Sindry', texte: "L'icône de Sindry, ses variantes, ses tailles et ses animations. Les planches qui les comparent sont des mockups.",
      vide: 'Aucune icône de Sindry pour l\'instant. Elles se rangent dans icones-sindry/. ' },
    icons: { titre: "Icônes d'applis", un: "icône d'appli", des: "icônes d'applis", texte: "Les icônes des applications du catalogue. Quand un script écrit appicon=<nom>, Sindry télécharge icons/<nom>.png." },
    images: { titre: 'Images', un: 'image', des: 'images', texte: 'Captures, visuels et exports, rangés par projet.',
      vide: 'Aucune image pour l\'instant. Elles se rangent dans images/<projet>/. ' },
  };
  const ORDRE = ['suivi', 'mockups', 'icones-sindry', 'icons', 'images'];
  const EXT_IMAGES = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'avif', 'bmp']);
  const EXT_PAGES = new Set(['html', 'htm']);
  const ICONE_MAX = 128 * 1024;

  // --- Petits outils -----------------------------------------------------------

  const stock = {
    lire(cle) { try { return localStorage.getItem(cle); } catch { return null; } },
    ecrire(cle, v) { try { if (v == null) localStorage.removeItem(cle); else localStorage.setItem(cle, v); } catch { /* stockage indisponible */ } },
  };

  const SVG = {
    ouvrir: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    code: '<path d="m8 8-5 4 5 4"/><path d="m16 8 5 4-5 4"/>',
    copier: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    galerie: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    liste: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  };
  const ico = (nom) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ico'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = SVG[nom]; return s; };

  function el(tag, attrs, ...enfants) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'data') Object.assign(e.dataset, v);
      else if (k === 'style') e.style.cssText = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of enfants.flat()) if (c != null && c !== false) e.append(c instanceof Node ? c : String(c));
    return e;
  }

  const normaliser = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const extension = (chemin) => { const m = /\.([^./]+)$/.exec(chemin); return m ? m[1].toLowerCase() : ''; };
  const nomFichier = (chemin) => chemin.split('/').pop();
  const sansExtension = (nom) => nom.replace(/\.[^.]+$/, '');
  const encoder = (chemin) => chemin.split('/').map(encodeURIComponent).join('/');
  const num = (n) => `M${String(n).padStart(2, '0')}`;

  function taille(octets) {
    if (octets == null) return '';
    if (octets < 1024) return `${octets} o`;
    const ko = octets / 1024;
    if (ko < 1024) return `${ko < 10 ? ko.toFixed(1).replace('.', ',') : Math.round(ko)} Ko`;
    return `${(ko / 1024).toFixed(1).replace('.', ',')} Mo`;
  }
  function dateRegistre(d) {
    if (!d) return '';
    const [j, h] = String(d).split(' ');
    const [a, m, jj] = j.split('-');
    return `${jj}/${m}/${a}${h ? ` ${h}` : ''}`;
  }
  function dateIso(iso, avecHeure) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', avecHeure ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(d);
  }

  let contexte = { depot: DEPOT, branche: BRANCHE };
  const liens = (chemin) => ({
    page: encoder(chemin),
    absolu: new URL(encoder(chemin), location.href).href,
    github: `https://github.com/${contexte.depot}/blob/${contexte.branche}/${encoder(chemin)}`,
    brut: `https://raw.githubusercontent.com/${contexte.depot}/${contexte.branche}/${encoder(chemin)}`,
  });

  function boutonCopier(texte, libelle, titre) {
    return el('button', { class: 'act', type: 'button', title: titre || `Copier ${texte}`, data: { copie: texte } }, ico('copier'), libelle);
  }
  function lienAction(href, nomIco, libelle, attrs) {
    return el('a', { class: 'act', href, ...attrs }, ico(nomIco), libelle);
  }

  // --- La copie dans le presse-papiers, et son toast --------------------------------

  const toast = document.getElementById('toast');
  let minuteur;
  function annoncer(texte) {
    toast.textContent = texte;
    toast.classList.add('visible');
    clearTimeout(minuteur);
    minuteur = setTimeout(() => toast.classList.remove('visible'), 1800);
  }
  async function copier(texte) {
    try { await navigator.clipboard.writeText(texte); }
    catch {
      const zone = el('textarea', { style: 'position:fixed;opacity:0' });
      zone.value = texte;
      document.body.append(zone);
      zone.select();
      try { document.execCommand('copy'); } catch { /* rien d'autre à tenter */ }
      zone.remove();
    }
    annoncer(texte.length > 70 ? 'Lien copié' : `Copié : ${texte}`);
  }
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-copie]');
    if (b) { ev.preventDefault(); copier(b.dataset.copie); }
  });

  // --- Le thème : auto, clair, sombre ---------------------------------------------------

  const boutonTheme = document.getElementById('theme');
  const THEMES = { auto: 'auto', light: 'clair', dark: 'sombre' };
  function appliquerTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
    boutonTheme.textContent = `Thème : ${THEMES[t] || 'auto'}`;
  }
  let theme = stock.lire('mediatheque.theme') || 'auto';
  appliquerTheme(theme);
  boutonTheme.addEventListener('click', () => {
    theme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto';
    stock.ecrire('mediatheque.theme', theme === 'auto' ? null : theme);
    appliquerTheme(theme);
  });

  // --- Les données ------------------------------------------------------------------------

  function estDonnee(chemin) {
    const s = chemin.split('/');
    if (s.length < 2 || PAS_DES_DONNEES.has(s[0])) return false;
    if (s.some((x) => x.startsWith('.') || x.startsWith('_'))) return false;
    if (/^(readme|lisezmoi)\.md$/i.test(s.at(-1))) return false;
    return chemin !== 'mockups/registre.json';
  }

  async function charger() {
    try {
      const r = await fetch('manifest.json', { cache: 'no-cache' });
      if (r.ok) {
        const m = await r.json();
        if (m && Array.isArray(m.fichiers)) return { ...m, source: 'manifest' };
      }
    } catch { /* pas de manifeste : on lit le dépôt */ }

    const r = await fetch(`https://api.github.com/repos/${DEPOT}/git/trees/${BRANCHE}?recursive=1`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(r.status === 403 || r.status === 429
      ? "l'API GitHub limite les lectures à 60 par heure : réessayez dans un moment"
      : `l'API GitHub a répondu ${r.status}`);
    const arbre = await r.json();
    let registre = null;
    for (const url of ['mockups/registre.json', `https://raw.githubusercontent.com/${DEPOT}/${BRANCHE}/mockups/registre.json`]) {
      try {
        const rr = await fetch(url, { cache: 'no-cache' });
        if (rr.ok) { registre = await rr.json(); break; }
      } catch { /* source suivante */ }
    }
    const fichiers = (arbre.tree || [])
      .filter((t) => t.type === 'blob' && estDonnee(t.path))
      .map((t) => ({ chemin: t.path, taille: t.size }));
    return { format: 1, depot: DEPOT, branche: BRANCHE, commit: null, genere: null, registre, fichiers, source: 'api' };
  }

  // --- Les mockups ---------------------------------------------------------------------------

  function lireMaquettes(donnees, fichiers) {
    const registre = donnees.registre || {};
    const projets = registre.projets || {};
    const parChemin = new Map(fichiers.map((f) => [f.chemin, f]));
    const numerotes = (registre.maquettes || []).filter((e) => e && e.fichier).map((e) => ({
      n: e.n, numero: num(e.n), titre: e.titre || e.fichier, resume: e.resume || '',
      date: dateRegistre(e.date), tri: e.date || '', projet: e.projet || null,
      chemin: `mockups/${e.fichier}`, fichier: parChemin.get(`mockups/${e.fichier}`) || null, auRegistre: true,
    }));
    const pris = new Set(numerotes.map((m) => m.chemin));
    const libres = fichiers.filter((f) => !pris.has(f.chemin)).filter((f) => {
      const s = f.chemin.split('/');
      const ext = extension(f.chemin);
      return (s.length === 2 && (EXT_PAGES.has(ext) || EXT_IMAGES.has(ext) || ext === 'pdf')) || (s.length === 3 && /^index\.html?$/i.test(s[2]));
    }).map((f) => {
      const s = f.chemin.split('/');
      const base = sansExtension(s[1]);
      const m = /^M(\d+)_(\d{4}-\d{2}-\d{2})_(.+)$/.exec(base);
      return {
        n: m ? Number(m[1]) : null, numero: m ? num(Number(m[1])) : null,
        titre: (m ? m[3] : base).replace(/[-_]+/g, ' '), resume: '',
        date: m ? dateRegistre(m[2]) : dateIso(f.date), tri: m ? m[2] : (f.date || ''), projet: null,
        chemin: f.chemin, fichier: f, auRegistre: false,
      };
    });
    numerotes.sort((a, b) => b.n - a.n);
    libres.sort((a, b) => (b.n || 0) - (a.n || 0) || b.tri.localeCompare(a.tri));
    return { liste: [...numerotes, ...libres], projets };
  }

  function apercuMaquette(m) {
    const ext = extension(m.chemin);
    const lien = el('a', { class: 'apercu', href: liens(m.chemin).page, 'aria-label': `Ouvrir ${m.numero ? `${m.numero} · ` : ''}${m.titre}` });
    if (m.numero) lien.append(el('span', { class: 'num' }, m.numero));
    if (!m.fichier) return lien;
    if (EXT_PAGES.has(ext)) {
      lien.append(el('iframe', { src: liens(m.chemin).page, loading: 'lazy', tabindex: '-1', 'aria-hidden': 'true', title: m.titre, sandbox: 'allow-scripts allow-same-origin', scrolling: 'no' }));
      observerEchelle(lien);
    } else if (EXT_IMAGES.has(ext)) {
      lien.append(el('img', { src: liens(m.chemin).page, alt: '', loading: 'lazy' }));
    }
    return lien;
  }

  const echelles = 'ResizeObserver' in window ? new ResizeObserver((entrees) => {
    for (const e of entrees) e.target.style.setProperty('--k', String(e.contentRect.width / 1280));
  }) : null;
  function observerEchelle(noeud) { if (echelles) echelles.observe(noeud); }

  function metaMaquette(m, projets) {
    return el('div', { class: 'meta' },
      m.projet ? el('span', { class: 'etiq' }, projets[m.projet] || m.projet) : null,
      !m.auRegistre ? el('span', { class: 'etiq avert', title: 'Ce fichier n\'est pas dans mockups/registre.json' }, 'hors registre') : null,
      !m.fichier ? el('span', { class: 'etiq avert' }, 'fichier introuvable') : null,
      m.date ? el('span', null, m.date) : null);
  }

  function actionsMaquette(m) {
    const l = liens(m.chemin);
    return el('div', { class: 'actions' },
      lienAction(l.page, 'ouvrir', 'Ouvrir', { class: 'act prim' }),
      lienAction(l.github, 'code', 'GitHub', { title: 'Voir le fichier sur GitHub' }),
      boutonCopier(l.absolu, 'Lien', 'Copier le lien du mockup'));
  }

  function rechercheMaquette(m, projets) {
    return normaliser([m.numero, m.titre, m.resume, projets[m.projet], m.projet, m.chemin, m.date].join(' '));
  }

  function carteMaquette(m, projets) {
    return el('article', { class: 'carte filtrable', data: { recherche: rechercheMaquette(m, projets), projet: m.projet || '' } },
      apercuMaquette(m),
      el('div', { class: 'carte-c' },
        el('div', { class: 'carte-t' }, el('a', { href: liens(m.chemin).page }, m.titre)),
        m.resume ? el('p', { class: 'resume' }, m.resume) : null,
        metaMaquette(m, projets),
        actionsMaquette(m)));
  }

  function ligneMaquette(m, projets) {
    return el('div', { class: 'ligne filtrable', data: { recherche: rechercheMaquette(m, projets), projet: m.projet || '' } },
      el('span', { class: 'num' }, m.numero || '—'),
      el('div', { class: 't' }, el('a', { href: liens(m.chemin).page }, m.titre), m.resume ? el('p', null, m.resume) : null),
      el('div', { class: 'd' }, metaMaquette(m, projets), actionsMaquette(m)));
  }

  function sectionMockups(sec, donnees, fichiers) {
    const { liste, projets } = lireMaquettes(donnees, fichiers);
    sec.compte = liste.length;
    if (!liste.length) {
      sec.corps.append(el('div', { class: 'vide' },
        el('b', null, 'Aucun mockup pour l\'instant. '),
        'Chaque conversation Sindry y dépose ses mockups. ',
        el('a', { href: `https://github.com/${contexte.depot}/blob/${contexte.branche}/mockups/README.md` }, 'Les règles de dépôt')));
      return;
    }

    let vue = stock.lire('mediatheque.vue') || (window.innerWidth >= 720 ? 'galerie' : 'liste');
    const boutons = {};
    const seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Affichage' });
    for (const [v, libelle] of [['galerie', 'Galerie'], ['liste', 'Liste']]) {
      boutons[v] = el('button', { type: 'button', 'aria-pressed': String(vue === v) }, ico(v), libelle);
      boutons[v].addEventListener('click', () => { vue = v; stock.ecrire('mediatheque.vue', v); dessiner(); });
      seg.append(boutons[v]);
    }
    sec.outils.append(seg);

    // Un filtre par projet, dès qu'il y en a plus d'un.
    const presents = [...new Set(liste.map((m) => m.projet || ''))];
    if (presents.length > 1) {
      const puces = el('div', { class: 'puces', role: 'group', 'aria-label': 'Projet' });
      const ajouter = (valeur, libelle, n) => {
        const b = el('button', { class: 'puce', type: 'button', 'aria-pressed': String(etat.projet === valeur), data: { valeur } }, libelle, el('span', { class: 'n' }, n));
        b.addEventListener('click', () => {
          etat.projet = valeur;
          for (const x of puces.children) x.setAttribute('aria-pressed', String(x.dataset.valeur === valeur));
          filtrer();
        });
        puces.append(b);
      };
      ajouter('*', 'Tous', liste.length);
      for (const p of presents.filter(Boolean).sort((a, b) => (projets[a] || a).localeCompare(projets[b] || b, 'fr'))) {
        ajouter(p, projets[p] || p, liste.filter((m) => m.projet === p).length);
      }
      if (presents.includes('')) ajouter('', 'Sans projet', liste.filter((m) => !m.projet).length);
      sec.corps.append(puces);
    }

    const zone = el('div');
    sec.corps.append(zone);
    function dessiner() {
      for (const [v, b] of Object.entries(boutons)) b.setAttribute('aria-pressed', String(vue === v));
      if (echelles) echelles.disconnect();
      zone.replaceChildren(vue === 'galerie'
        ? el('div', { class: 'galerie' }, liste.map((m) => carteMaquette(m, projets)))
        : el('div', { class: 'liste' }, liste.map((m) => ligneMaquette(m, projets))));
      filtrer();
    }
    dessiner();
  }

  // --- Les icônes ----------------------------------------------------------------------------

  function sectionIcones(sec, fichiers) {
    const icones = fichiers.filter((f) => f.chemin.split('/').length === 2);
    const autres = fichiers.filter((f) => f.chemin.split('/').length > 2);
    sec.compte = icones.length + autres.length;
    if (!sec.compte) { sec.corps.append(el('div', { class: 'vide' }, 'Aucune icône pour l\'instant.')); return; }
    const grille = el('div', { class: 'icones' });
    for (const f of icones) {
      const nom = sansExtension(nomFichier(f.chemin));
      const l = liens(f.chemin);
      const avertis = [];
      if (f.largeur && (f.largeur !== 64 || f.hauteur !== 64)) avertis.push(`${f.largeur}×${f.hauteur}, 64×64 conseillé`);
      if (f.taille > ICONE_MAX) avertis.push('plus de 128 Ko : Sindry la refuse');
      if (!/^[a-z0-9-]+\.(png|ico)$/.test(nomFichier(f.chemin))) avertis.push('nom ou format inattendu');
      grille.append(el('div', { class: 'icone filtrable', data: { recherche: normaliser(`${nom} ${f.chemin}`) } },
        el('a', { class: 'damier', href: l.page, title: `Ouvrir ${nomFichier(f.chemin)}` }, el('img', { src: l.page, width: '64', height: '64', alt: nom, loading: 'lazy' })),
        el('span', { class: 'nom' }, nom),
        el('div', { class: 'meta' }, f.largeur ? el('span', null, `${f.largeur}×${f.hauteur}`) : null, el('span', null, taille(f.taille))),
        avertis.length ? el('span', { class: 'etiq avert', title: avertis.join(' ; ') }, 'à revoir') : null,
        el('div', { class: 'actions' },
          boutonCopier(`appicon=${nom}`, 'appicon', 'Copier la ligne à mettre dans le script du catalogue'),
          boutonCopier(l.brut, 'URL', "Copier l'adresse que Sindry télécharge"))));
    }
    sec.corps.append(grille);
    if (autres.length) {
      sec.corps.append(el('h3', null, 'Autres fichiers'));
      sec.corps.append(listeFichiers(autres, 'icons/'));
    }
  }

  // --- Les images ----------------------------------------------------------------------------

  function sectionImages(sec, fichiers, racine) {
    sec.compte = fichiers.length;
    if (!fichiers.length) {
      sec.corps.append(el('div', { class: 'vide' },
        el('b', null, (SECTIONS[racine] && SECTIONS[racine].vide) || `Aucun fichier dans ${racine}/ pour l'instant. `),
        el('a', { href: `https://github.com/${contexte.depot}/blob/${contexte.branche}/${racine}/README.md` }, 'Les règles de dépôt')));
      return;
    }
    const groupes = new Map();
    for (const f of fichiers) {
      const rel = f.chemin.slice(racine.length + 1);
      const dossier = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
      if (!groupes.has(dossier)) groupes.set(dossier, []);
      groupes.get(dossier).push(f);
    }
    for (const dossier of [...groupes.keys()].sort((a, b) => a.localeCompare(b, 'fr'))) {
      const bloc = el('div', { class: 'groupe' });
      if (dossier) bloc.append(el('h3', null, `${racine}/${dossier}/`));
      const grille = el('div', { class: 'images' });
      for (const f of groupes.get(dossier).sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.chemin.localeCompare(b.chemin, 'fr'))) {
        const l = liens(f.chemin);
        const nom = nomFichier(f.chemin);
        const ext = extension(f.chemin);
        grille.append(el('div', { class: 'image filtrable', data: { recherche: normaliser(f.chemin) } },
          el('a', { class: 'apercu', href: l.page, 'aria-label': `Ouvrir ${nom}` },
            EXT_IMAGES.has(ext) ? el('img', { src: l.page, alt: '', loading: 'lazy' }) : null),
          el('div', { class: 'carte-c' },
            el('a', { class: 'nom', href: l.page }, nom),
            el('div', { class: 'meta' },
              f.largeur ? el('span', null, `${f.largeur}×${f.hauteur}`) : null,
              el('span', null, taille(f.taille)),
              f.date ? el('span', null, dateIso(f.date)) : null),
            el('div', { class: 'actions' },
              lienAction(l.github, 'code', 'GitHub', { title: 'Voir le fichier sur GitHub' }),
              boutonCopier(l.absolu, 'Lien', "Copier le lien de l'image")))));
      }
      bloc.append(grille);
      sec.corps.append(bloc);
    }
  }

  // --- Les autres dossiers : une liste de fichiers ---------------------------------------------

  function listeFichiers(fichiers, prefixe) {
    const liste = el('div', { class: 'fichiers' });
    for (const f of fichiers) {
      const l = liens(f.chemin);
      liste.append(el('div', { class: 'fichier filtrable', data: { recherche: normaliser(f.chemin) } },
        el('span', { class: 'ext' }, extension(f.chemin) || '—'),
        el('div', null,
          el('a', { class: 'nom', href: l.page }, f.chemin.slice(prefixe.length)),
          el('div', { class: 'meta' }, el('span', null, taille(f.taille)), f.date ? el('span', null, dateIso(f.date)) : null,
            f.largeur ? el('span', null, `${f.largeur}×${f.hauteur}`) : null)),
        el('div', { class: 'actions' },
          lienAction(l.github, 'code', 'GitHub', { title: 'Voir le fichier sur GitHub' }),
          boutonCopier(l.absolu, 'Lien', 'Copier le lien du fichier'))));
    }
    return liste;
  }

  // --- La recherche et les filtres ------------------------------------------------------------------

  const etat = { recherche: '', projet: '*' };
  const sections = [];

  function filtrer() {
    const mots = normaliser(etat.recherche).split(/\s+/).filter(Boolean);
    for (const sec of sections) {
      let visibles = 0;
      let total = 0;
      for (const item of sec.noeud.querySelectorAll('.filtrable')) {
        total++;
        const okProjet = sec.id !== 'mockups' || etat.projet === '*' || item.dataset.projet === etat.projet;
        const okTexte = mots.every((m) => item.dataset.recherche.includes(m));
        item.hidden = !(okProjet && okTexte);
        if (!item.hidden) visibles++;
      }
      for (const g of sec.noeud.querySelectorAll('.groupe')) g.hidden = !g.querySelector('.filtrable:not([hidden])');
      sec.aucun.hidden = !(total && !visibles);
      sec.compteur.textContent = total && visibles !== total ? `${visibles} sur ${sec.compte}` : String(sec.compte);
    }
  }

  const recherche = document.getElementById('recherche');
  recherche.addEventListener('input', () => { etat.recherche = recherche.value; filtrer(); });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === '/' && !/^(input|textarea|select)$/i.test(document.activeElement?.tagName || '')) { ev.preventDefault(); recherche.focus(); }
    if (ev.key === 'Escape' && document.activeElement === recherche && recherche.value) { recherche.value = ''; etat.recherche = ''; filtrer(); }
  });

  // --- L'assemblage -----------------------------------------------------------------------------------

  function creerSection(id) {
    const info = SECTIONS[id] || { titre: id.charAt(0).toUpperCase() + id.slice(1), texte: `Le dossier ${id}/ du dépôt.` };
    const compteur = el('span', { class: 'n' });
    const outils = el('div', { class: 'outils' });
    const corps = el('div');
    const aucun = el('p', { class: 'etat', hidden: true }, 'Rien ne correspond à la recherche.');
    const noeud = el('section', { class: 'sec', id, 'aria-labelledby': `t-${id}` },
      el('div', { class: 'sec-h' },
        el('div', null, el('h2', { id: `t-${id}` }, info.titre, compteur), el('p', null, info.texte)),
        outils),
      corps, aucun);
    const sec = { id, titre: info.titre, un: info.un || null, des: info.des || null, noeud, corps, outils, compteur, aucun, compte: 0 };
    sections.push(sec);
    return sec;
  }

  function afficher(donnees) {
    contexte = { depot: donnees.depot || DEPOT, branche: donnees.branche || BRANCHE };
    const parDossier = new Map();
    for (const f of donnees.fichiers) {
      if (!estDonnee(f.chemin)) continue;
      const d = f.chemin.split('/')[0];
      if (!parDossier.has(d)) parDossier.set(d, []);
      parDossier.get(d).push(f);
    }
    const ids = [...ORDRE, ...[...parDossier.keys()].filter((d) => !ORDRE.includes(d)).sort((a, b) => a.localeCompare(b, 'fr'))];

    const conteneur = document.getElementById('sections');
    conteneur.replaceChildren();
    for (const id of ids) {
      const fichiers = parDossier.get(id) || [];
      const sec = creerSection(id);
      if (id === 'mockups') sectionMockups(sec, donnees, fichiers);
      else if (id === 'icons') sectionIcones(sec, fichiers);
      else if (id === 'images' || id === 'icones-sindry') sectionImages(sec, fichiers, id);
      else { sec.compte = fichiers.length; sec.corps.append(listeFichiers(id === 'suivi' ? [...fichiers].reverse() : fichiers, `${id}/`)); }
      conteneur.append(sec.noeud);
    }

    const nav = document.getElementById('nav');
    const stats = document.getElementById('stats');
    for (const sec of sections) {
      nav.append(el('a', { href: `#${sec.id}` }, sec.titre, el('span', { class: 'n' }, sec.compte)));
      stats.append(el('li', null, el('a', { href: `#${sec.id}` }, el('b', null, sec.compte), ` ${sec.un ? (sec.compte > 1 ? sec.des : sec.un) : `dans ${sec.id}/`}`)));
    }

    const version = document.getElementById('version');
    const lienCommit = donnees.commit ? el('a', { href: `https://github.com/${contexte.depot}/commit/${donnees.commit}` }, donnees.commit) : null;
    if (donnees.source === 'manifest') {
      version.append(`Site construit le ${dateIso(donnees.genere, true)}`, lienCommit ? ', commit ' : '', lienCommit || '', '.');
    } else {
      version.append('Contenu lu en direct dans le dépôt, par l\'API GitHub.');
    }
    document.getElementById('lien-depot').href = `https://github.com/${contexte.depot}`;
    filtrer();
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }

  charger().then(afficher).catch((e) => {
    const p = document.getElementById('chargement');
    p.className = 'etat erreur';
    p.replaceChildren(`Le contenu n'a pas pu être lu : ${e.message}. `,
      el('a', { href: `https://github.com/${DEPOT}` }, 'Le dépôt sur GitHub'), ' reste accessible.');
  });
})();

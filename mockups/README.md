# Mockups

Tous les mockups de Sindry, **tous projets confondus** (Sindry App, Sindry OS, Sindry Game,
Sindry Script, Sindry Icons…), sont déposés ici. Le site les montre, avec un aperçu, sur
<https://burnout293.github.io/Sindry-Media-Library/#mockups>.

La médiathèque commence à **M30** (repris des archives). M01 à M29 restent dans le dépôt Sindry (`docs/mockups/`).

## Déposer un mockup

1. **Partir du dépôt à jour** : `git pull --rebase`, ou un clone de
   <https://github.com/burnout293/Sindry-Media-Library>.
2. **Prendre un numéro** : `max(plancher, plus grand "n" du registre) + 1`.
   [`registre.json`](registre.json) fait foi, avec une seule numérotation pour tous les projets.
   Un mockup qui a déjà un numéro le garde. Prochain numéro libre : voir le registre (M49 au 03/11/2026).
3. **Nommer le fichier** `M<nn>_<AAAA-MM-JJ>_<nom-court>.html`, par exemple
   `M47_2026-11-02_colonnes.html`. Le nom court s'écrit en minuscules, chiffres et tirets.
   - De préférence en **HTML**. Une image (`.png`, `.webp`, `.jpg`) convient pour un rendu figé.
   - Un mockup en plusieurs fichiers va dans un dossier `M47_2026-11-02_colonnes/` qui contient
     `index.html`. Le registre pointe alors vers `M47_2026-11-02_colonnes/index.html`.
4. **Le rendre autonome** : il doit s'ouvrir seul, sans le dépôt de son projet et sans réseau.
   - Les polices et le logo de Sindry sont dans [`_ressources/`](_ressources) :
     `inter-latin-wght-normal.woff2`, `sindry-mono-400.woff2`, `sindry-mono-500.woff2`,
     `marque.png`, `sindry-256.png`. Depuis un mockup de `mockups/`, on écrit
     `_ressources/marque.png`. Les chemins du dépôt Sindry (`../../src/fonts/…`,
     `../../src/marque.png`, `sindry-256.png`) sont réécrits tout seuls dans la copie publiée.
   - Les autres images sont intégrées (`data:`) ou rangées dans le dossier du mockup.
   - **Aucune ressource externe** (CDN, Google Fonts…).
5. **L'inscrire au registre**, dans la liste `maquettes`, dans l'ordre des numéros :

   ```json
   { "n": 47, "fichier": "M47_2026-11-02_colonnes.html", "date": "2026-11-02 10:30",
     "titre": "Sindry OS : colonnes",
     "resume": "Une phrase : ce que montre le mockup, ce qui a été retenu ou rejeté.",
     "projet": "os" }
   ```

   `projet` est une clé de `projets` : `app`, `os`, `game`, `scripts` ou `icones`. Pour un
   nouveau projet, on ajoute sa clé dans `projets`.
6. **Vérifier**, si Node 20 est installé (facultatif) : `node outils/construire-site.mjs --verifier`.
7. **Committer et pousser directement sur `main`** :
   `git add mockups && git commit -m "Mockups : M47, Sindry OS, colonnes" && git push`.
   - Si le push est refusé parce qu'un autre dépôt est arrivé entre-temps : `git pull --rebase`,
     vérifier que le numéro est toujours libre, puis repousser.
   - Si le numéro est déjà pris par un autre mockup : **ne pas renuméroter seul**, demander à
     l'utilisateur.
8. Environ une minute plus tard, le mockup est en ligne à l'adresse
   `https://burnout293.github.io/Sindry-Media-Library/mockups/M47_2026-11-02_colonnes.html`.

## Ce que le site ajoute

Dans la copie publiée (jamais dans le fichier du dépôt), le site ajoute le numéro en tête du
titre de l'onglet, et un badge en bas à gauche : « M47 · 02/11/2026 10:30 · Titre ». C'est le
même badge que dans les archives de `tools/archiver-maquettes.mjs` du dépôt Sindry : un onglet
oublié se reconnaît d'un coup d'œil.

Un registre invalide (numéro en double, fichier introuvable, date mal écrite) n'est pas publié.
Le site en ligne reste alors celui d'avant, et l'échec apparaît dans l'onglet *Actions* du dépôt.

## À ne pas faire

- **Aucune donnée personnelle** : le dépôt est public. Ni vrais noms, ni e-mails, ni nom
  d'utilisateur Windows dans les chemins (`C:\Users\…`), ni nom de PC, ni clé.
- Ne pas réutiliser le numéro d'un mockup publié pour un autre mockup : un nouveau mockup prend
  un nouveau numéro. Corriger une coquille ou un défaut d'affichage reste possible.
- Ne rien déposer dans `icons/` : ce dossier est lu par l'application Sindry. L'icône de Sindry
  et ses variantes vont dans [`icones-sindry/`](../icones-sindry/README.md), les autres images
  dans [`images/`](../images).

## Numéros

| Plage | Où |
|---|---|
| M01 à M29 | Dépôt Sindry, `docs/mockups/` et son `registre.json` (pas repris ici) |
| M30 à M48 | Ici, repris des archives le 02/11/2026 (`plancher` : 48) |
| M49 et suivants | Ici, déposés directement |

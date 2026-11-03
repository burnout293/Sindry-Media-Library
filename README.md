# Sindry-Media-Library

La médiathèque de [Sindry](https://github.com/burnout293/Sindry) : les icônes que l'application
télécharge, et les mockups et images de tous les projets Sindry, accessibles depuis n'importe où.

**Le site : <https://burnout293.github.io/Sindry-Media-Library/>.** Il montre tout ce que
contient le dépôt, avec une recherche et un aperçu de chaque mockup.

| Dossier | Contenu | Règles |
|---|---|---|
| `mockups/` | Les mockups de tous les projets Sindry, numérotés à partir de M30, et leur registre | [mockups/README.md](mockups/README.md) |
| `icones-sindry/` | L'icône de Sindry : version officielle, tailles, variantes, animations | [icones-sindry/README.md](icones-sindry/README.md) |
| `icons/` | Les icônes officielles des applications que propose le catalogue (script « Installer des applications »). **Lu par l'application Sindry** | [ci-dessous](#les-icônes-icons) |
| `images/` | Les autres images : captures, visuels, exports | [images/README.md](images/README.md) |

Un nouveau dossier de premier niveau apparaît tout seul sur le site, en liste de fichiers.
L'application Sindry, elle, ne télécharge **que** dans `icons/`.

## Le site (GitHub Pages)

- `index.html` et `accueil/` : la page d'accueil. Elle lit `manifest.json`, la liste des
  fichiers écrite à la construction.
- `outils/construire-site.mjs` : la construction, sans dépendance. Elle copie les dossiers, écrit
  `manifest.json` et ajoute aux mockups du registre leur numéro et leur badge.
- `.github/workflows/pages.yml` : reconstruit et publie le site à chaque push sur `main`.
  À activer une fois : **Settings > Pages > Source : GitHub Actions**.

Aperçu en local (Node 20) :

```bash
node outils/construire-site.mjs && python3 -m http.server -d _site 8000
```

Avant un push, `node outils/construire-site.mjs --verifier` contrôle le registre des mockups.

## Les icônes (`icons/`)

Sindry montre l'icône d'une application **qui n'est pas encore installée**. Quand un script du
catalogue écrit `appicon=<nom>`, Sindry télécharge `icons/<nom>.png` depuis ce dépôt.

| Règle | Détail |
|---|---|
| Adresse | `https://raw.githubusercontent.com/burnout293/Sindry-Media-Library/main/icons/<nom>.png` |
| Format | PNG (ou ICO), **64 × 64 px** conseillé, **128 Ko au plus**. Jamais de SVG |
| Nom | Minuscules, chiffres, tirets : l'`Id` de l'application dans le catalogue (`vlc`, `7zip`, `keepass`) |
| Absente | Ce n'est pas une erreur : Sindry garde l'icône générique de l'application |

### Ajouter une icône

1. Une image **64 × 64 px**, fond transparent, en PNG.
2. Nommée comme l'**`Id`** de l'application dans `scripts/410_INSTALL_APPS.ps1` du catalogue.
3. Déposée dans `icons/`.

Les premières icônes ont été extraites des programmes installés (leur `.exe`). Pour une
application absente, le kit presse de l'éditeur est la meilleure source.

## Vie privée

- Sindry demande **toutes** les icônes d'une analyse d'un coup, quel que soit l'état de chaque
  application : ce dépôt ne peut pas savoir ce qui est installé sur un PC.
- Une image est gardée **30 jours** sur le PC.
- Le téléchargement se coupe dans les Réglages de Sindry (**3.3**) : plus rien ne quitte le PC.
- Le dépôt et son site sont **publics** : aucun mockup, aucune image ne contient de donnée
  personnelle (nom d'utilisateur, nom du PC, chemins personnels, e-mails).
- Le site ne charge aucune ressource tierce et ne mesure rien. Seule exception : s'il est
  publié sans construction, la page d'accueil lit la liste des fichiers par l'API GitHub.

## Droits — à lire

**Les logos de `icons/` ne nous appartiennent pas.** Chacun est la propriété de son éditeur et
peut être une marque déposée. Ils ne sont publiés ici que pour désigner, dans Sindry,
l'application correspondante.

- Ces images ne sont sous **aucune licence** de notre part : ni celle de Sindry, ni celle de son
  catalogue (MIT) ne s'applique à elles.
- Leur présence ne signifie ni partenariat avec l'éditeur, ni approbation de sa part.
- Un éditeur qui ne souhaite pas voir son logo ici peut ouvrir une *issue* : il sera retiré.

Les polices de `mockups/_ressources/` (Inter et Sindry Mono, dérivée d'IBM Plex Mono) sont
sous licence SIL Open Font License 1.1 : voir
[LICENCE-POLICES.txt](mockups/_ressources/LICENCE-POLICES.txt).

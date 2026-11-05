# Images

Les images de Sindry qui ne sont pas des mockups : captures d'écran, visuels, exports…
Le site les montre sur
<https://burnout293.github.io/Sindry-Media-Library/#images>.

| Règle | Détail |
|---|---|
| Rangement | `images/<projet>/<nom>.<ext>`. `<projet>` est une clé du registre des mockups : `app`, `os`, `game`, `scripts`, `icones` |
| Nom | Minuscules, chiffres, tirets : `images/os/bureau-prisme.png` |
| Formats | `.png`, `.webp`, `.jpg`, `.gif`, `.svg`. Quelques Mo au plus par fichier |
| Adresse | `https://burnout293.github.io/Sindry-Media-Library/images/<projet>/<nom>.<ext>` |

- **Les icônes système de SindryOS** se rangent par famille : `images/os/icones/<famille>/<nom>.svg`.
  Elles sortent de `outils/icones-os.mjs` (comparées dans le mockup M54) : une retouche passe par cet outil.
- **Le jeu Prisme, en deux lots complets** (mockup M57) : `images/os/icones/prisme-sans-fond/` (chaque icône est un objet ; **le lot de l'OS par défaut**) et
  `images/os/icones/prisme-avec-fond/` (chaque icône est un symbole sur une tuile ; gardé de côté), rangés par `<dossier du thème>/<nom système>.svg`.
  `outils/icones-prisme.mjs` les génère ; sa commande `theme` écrit un thème prêt à installer, avec tous les noms. Les symboles viennent
  de Lucide (`LICENCE-LUCIDE.txt`, à garder avec les fichiers). `images/os/icones/prisme/` est la version précédente, celle de M55.
- **Le lanceur** : `images/os/lanceur/` ; les neuf idées (mockup M56) et Allumage, retenu, en quatre versions `allumage-*.svg` (mockup M57). Sur la barre : `allumage-clair.svg`.
- **Aucune donnée personnelle** : le dépôt est public. Sur une capture, on masque le nom
  d'utilisateur, le nom du PC, les chemins personnels.
- **L'icône de Sindry** et ses variantes vont dans [`icones-sindry/`](../icones-sindry/README.md).
- **Pas dans `icons/`** : ce dossier ne contient que les icônes d'applications que Sindry
  télécharge (voir le [README](../README.md#les-icônes-icons)).
- Les images sont poussées directement sur `main`, comme les mockups
  ([règles](../mockups/README.md#déposer-un-mockup)).

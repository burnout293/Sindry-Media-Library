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
- **Le jeu retenu, Prisme** : `images/os/icones/prisme/<dossier du thème>/<nom système>.svg` (mockup M55). `outils/icones-prisme.mjs` le génère ;
  sa commande `theme` écrit un thème prêt à installer, avec tous les noms. Les symboles viennent de Lucide (`LICENCE-LUCIDE.txt`, à garder avec les fichiers).
- **Les idées de lanceur** : `images/os/lanceur/` (mockup M56, `outils/lanceurs-os.mjs`).
- **Aucune donnée personnelle** : le dépôt est public. Sur une capture, on masque le nom
  d'utilisateur, le nom du PC, les chemins personnels.
- **L'icône de Sindry** et ses variantes vont dans [`icones-sindry/`](../icones-sindry/README.md).
- **Pas dans `icons/`** : ce dossier ne contient que les icônes d'applications que Sindry
  télécharge (voir le [README](../README.md#les-icônes-icons)).
- Les images sont poussées directement sur `main`, comme les mockups
  ([règles](../mockups/README.md#déposer-un-mockup)).

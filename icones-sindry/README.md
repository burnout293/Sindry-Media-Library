# Icônes de Sindry

L'icône de Sindry elle-même : la version officielle, ses tailles, ses variantes et ses
animations. Le site les montre sur
<https://burnout293.github.io/Sindry-Media-Library/#icones-sindry>.

À ne pas confondre avec [`icons/`](../icons), qui ne contient que les icônes des applications
du catalogue, celles que l'application Sindry télécharge.

| Règle | Détail |
|---|---|
| Rangement | `icones-sindry/<sujet>/<nom>.<ext>`, par exemple `icones-sindry/officielle/sindry-256.png`, `icones-sindry/animee/chargement.svg`, `icones-sindry/variantes-plates/v3-48.png` |
| Nom | Minuscules, chiffres, tirets. La taille en fin de nom quand il y en a plusieurs : `-16`, `-24`, `-48`, `-256` |
| Formats | `.png`, `.svg`, `.ico`, `.webp`, `.gif`. Une animation en `.svg` animé, `.webp`, `.gif`, ou en `.html` autonome |
| Planches | Une planche qui compare plusieurs variantes est un **mockup** (numéroté, dans [`mockups/`](../mockups/README.md)) ; les fichiers de chaque variante vont ici |
| Adresse | `https://burnout293.github.io/Sindry-Media-Library/icones-sindry/<sujet>/<nom>.<ext>` |

- Chaque icône construite y est déposée dès qu'elle existe, même si elle n'est pas retenue.
  Une icône retenue va aussi dans `icones-sindry/officielle/`.
- Les fichiers sont poussés directement sur `main`, comme les mockups
  ([règles](../mockups/README.md#déposer-un-mockup)).

## L'icône officielle (`officielle/`)

La variante T3 de [M49](../mockups/M49_2026-11-02_icone-flammes-derriere.html), retenue le
02/11/2026 : un engrenage à huit dents et deux flammes nées derrière lui, à 1 h 15 et 2 h 30.
Les douze SVG partagent le même cadre : engrenage et flammes se superposent exactement et
redonnent l'icône complète.

| | Couleurs | Noir | Blanc |
|---|---|---|---|
| Icône complète | `sindry-icon-color.svg` | `sindry-icon-black.svg` | `sindry-icon-white.svg` |
| Engrenage | `sindry-gear-color.svg` | `sindry-gear-black.svg` | `sindry-gear-white.svg` |
| Flammes | `sindry-flames-color.svg` | `sindry-flames-black.svg` | `sindry-flames-white.svg` |
| Animée | `sindry-icon-color-animated.svg` | `sindry-icon-black-animated.svg` | `sindry-icon-white-animated.svg` |

- **Des copies** : la source est dans le dépôt Sindry, `design/icon/`, d'où
  `npm run icon:layers` génère ces fichiers. Une retouche se fait là-bas, puis se recopie ici.
- **Des classes pour les thèmes** : `.gear-body`, `.gear-ring`, `.gear-hub`, `.flame`. Une icône
  insérée dans une page (pas par `<img>`) se recolore en CSS.
- **L'icône animée ne sert qu'aux écrans de chargement** ([M51](../mockups/M51_2026-11-03_icone-animee.html)) :
  la roue tourne dans le sens antihoraire, un tour en 8 s, et les flammes vacillent. Elle reste
  immobile si le système demande moins d'animations. Insérée dans une page, une seule copie par
  page : deux copies partageraient l'identifiant de masque `#sindry-cut`.

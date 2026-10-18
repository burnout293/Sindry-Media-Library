# Sindry-Media-Library

La médiathèque de [Sindry](https://github.com/burnout293/Sindry) : les images que l'application
peut télécharger pour l'affichage. C'est **le seul endroit** d'où Sindry en télécharge.

| Dossier | Contenu |
|---|---|
| `icons/` | Les icônes officielles des applications que propose le catalogue (script « Installer des applications ») |

D'autres dossiers pourront s'y ajouter, toujours pour l'affichage de Sindry.

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

## Droits — à lire

**Les logos de ce dépôt ne nous appartiennent pas.** Chacun est la propriété de son éditeur et
peut être une marque déposée. Ils ne sont publiés ici que pour désigner, dans Sindry,
l'application correspondante.

- Ces images ne sont sous **aucune licence** de notre part : ni celle de Sindry, ni celle de son
  catalogue (MIT) ne s'applique à elles.
- Leur présence ne signifie ni partenariat avec l'éditeur, ni approbation de sa part.
- Un éditeur qui ne souhaite pas voir son logo ici peut ouvrir une *issue* : il sera retiré.

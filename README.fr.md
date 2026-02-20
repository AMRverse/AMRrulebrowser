# AMRrulesBrowser

Ce navigateur web a été développé pour l'exploration interactive des AMRrules. Le paquet AMRrules contient l'ensemble de règles ainsi que des outils pour interpréter les génotypes AMR, actuellement optimisé pour les sorties d'AMRfinderplus.

En appliquant ces règles, le système génère des rapports génomiques qui traduisent des données génétiques complexes en informations exploitables sur l'impact des gènes et mutations sur la sensibilité aux antimicrobiens.

Spécification complète : https://docs.google.com/spreadsheets/d/1F-J-_8Kyo3W0Oh6eDYyd0N8ahqVwiddM2112-Fg1gKc/

## Exemples d'utilisation/de recherche

Vous pouvez construire des liens partageables pour ouvrir le navigateur avec des filtres pré-appliqués (organisme ou recherche). Exemples :

- Naviguer vers un organisme spécifique (utilisez des underscores pour les espaces) :

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli`

- Rechercher un médicament dans tous les fichiers :

  - `https://amrverse.github.io/AMRrulebrowser/?drug=amikacin`

- Recherche combinée (organisme + recherche) :

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli&drug=amikacin`

Remarques :

- `?organism=` accepte les underscores à la place des espaces et n'est pas sensible à la casse.
- `?drug=`, `?gene=`, `?rule=` ou `?q=` effectuent des recherches. Pour une portabilité maximale sur des serveurs statiques simples, utilisez les liens de type query (query-style).

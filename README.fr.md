# AMRrulesBrowser

Ce navigateur web a été développé pour l'exploration interactive des AMRrules. Le paquet AMRrules contient l'ensemble de règles ainsi que des outils pour interpréter les génotypes AMR, actuellement optimisé pour les sorties d'AMRfinderplus.

En appliquant ces règles, le système génère des rapports génomiques qui traduisent des données génétiques complexes en informations exploitables sur l'impact des gènes et mutations sur la sensibilité aux antimicrobiens.

Spécification complète : https://docs.google.com/spreadsheets/d/1F-J-_8Kyo3W0Oh6eDYyd0N8ahqVwiddM2112-Fg1gKc/

## Exemples d'utilisation/de recherche

Vous pouvez construire des liens partageables pour ouvrir le navigateur avec des filtres pré-appliqués (organisme ou recherche). Exemples :

- Naviguer vers un organisme spécifique (utilisez des underscores pour les espaces) :

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli`

- Rechercher un médicament dans tous les organismes :

  - `https://amrverse.github.io/AMRrulebrowser/?drug=amikacin`

- Recherche dans un organisme spécifique et un terme :

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli&search=amikacin`

- Rechercher un gène :

  - `https://amrverse.github.io/AMRrulebrowser/?gene=blaTEM`

- Trouver une règle spécifique par ruleID :

  - `https://amrverse.github.io/AMRrulebrowser/?ruleID=ARO0000001`

Remarques :

- `?organism=` accepte les underscores à la place des espaces et n'est pas sensible à la casse.
- `?drug=`, `?gene=`, `?ruleID=`, `?rule=`, `?search=`, ou `?q=` effectuent des recherches dans les résultats de navigation.
- Vous pouvez combiner `?organism=` avec n'importe quel paramètre de recherche pour chercher dans un organisme spécifique.
- Le navigateur s'affiche toujours en mode navigation avec un menu déroulant de sélection d'organisme, peu importe comment vous y accédez.
- Pour une portabilité maximale sur des serveurs statiques simples, utilisez les liens de style query (query-style).

## Fonctionnalités

- **Navigation directe par organisme** : Sélectionnez des organismes dans le menu déroulant pour afficher toutes les règles sans recherche imposée
- **Recherche multi-paramètres** : Recherchez par médicament, gène, ruleID ou n'importe quel champ, filtrés optionnellement par organisme
- **Liens partageables** : Construisez des liens avec des recherches pré-remplies que d'autres peuvent utiliser
- **Visibilité des colonnes personnalisable** : Utilisez le bouton "Colonnes à afficher" pour afficher/masquer les colonnes. Par défaut, les colonnes suivantes sont masquées (peuvent être montrées si nécessaire) :
  - `txid` (ID de taxonomie NCBI - cliquez sur le nom de l'organisme pour le lien de taxonomie)
  - `breakpoint condition`
  - `ARO accession`
  - `rule curation note`
- **Liens d'aide** : Les icônes d'information (ⓘ) à côté de certains en-têtes de colonne renvoient à une documentation de spécification détaillée
- **Options de téléchargement** : Exportez les résultats de recherche/navigation en tant que fichier TSV
- **Conception réactive** : Fonctionne sur ordinateur de bureau et appareils mobiles avec défilement horizontal pour les grands tableaux

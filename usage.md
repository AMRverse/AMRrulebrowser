Deep-linking examples

You can construct shareable links to open the browser pre-filtered by organism or search terms. Examples below assume the app is hosted at `https://amrverse.github.io/AMRrulebrowser/` or running locally (e.g., `http://localhost:8000/`).

- Browse a specific organism (uses underscores instead of spaces):

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli`

- Search for a drug across all files:

  - `https://amrverse.github.io/AMRrulebrowser/?drug=amikacin`

- Combined search (organism + search):

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli&drug=amikacin`

Notes:

- `?organism=` accepts underscores in place of spaces and is case-insensitive.
- `?drug=`, `?gene=`, `?rule=` or `?q=` perform searches (query names prefer `drug`, `gene`, `rule`, otherwise `q`).
- For maximum portability on simple static servers use the query-style links above (path-style links require an SPA-aware server).

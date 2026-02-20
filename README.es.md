# AMRrulesBrowser

Este navegador web fue desarrollado para la exploración interactiva de AMRrules. El paquete AMRrules contiene el conjunto de reglas y herramientas para interpretar genotipos AMR, optimizado actualmente para la salida de AMRfinderplus.

Al aplicar estas reglas, el sistema genera informes genómicos que traducen datos genéticos complejos en información útil sobre cómo genes y mutaciones afectan la susceptibilidad a antimicrobianos.

Especificación completa: https://docs.google.com/spreadsheets/d/1F-J-_8Kyo3W0Oh6eDYyd0N8ahqVwiddM2112-Fg1gKc/

## Vea los ejemplos de uso/búsqueda

Puede construir enlaces compartibles para abrir el navegador con filtros preestablecidos (organismo o búsqueda). Ejemplos:

- Navegar a un organismo específico (use guiones bajos en lugar de espacios):

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli`

- Buscar un fármaco en todos los archivos:

  - `https://amrverse.github.io/AMRrulebrowser/?drug=amikacin`

- Búsqueda combinada (organismo + búsqueda):

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli&drug=amikacin`

Notas:

- `?organism=` acepta guiones bajos en lugar de espacios y no distingue mayúsculas/minúsculas.
- `?drug=`, `?gene=`, `?rule=` o `?q=` realizan búsquedas. Para máxima compatibilidad en servidores estáticos, use los parámetros de consulta (query-style).

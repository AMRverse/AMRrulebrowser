# AMRrulesBrowser

Este navegador web fue desarrollado para la exploración interactiva de AMRrules. El paquete AMRrules contiene el conjunto de reglas y herramientas para interpretar genotipos AMR, optimizado actualmente para la salida de AMRfinderplus.

Al aplicar estas reglas, el sistema genera informes genómicos que traducen datos genéticos complejos en información útil sobre cómo genes y mutaciones afectan la susceptibilidad a antimicrobianos.

Especificación completa: https://docs.google.com/spreadsheets/d/1F-J-_8Kyo3W0Oh6eDYyd0N8ahqVwiddM2112-Fg1gKc/

## Vea los ejemplos de uso/búsqueda

Puede construir enlaces compartibles para abrir el navegador con filtros preestablecidos (organismo o búsqueda). Ejemplos:

- Navegar a un organismo específico (use guiones bajos en lugar de espacios):

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli`

- Buscar un fármaco en todos los organismos:

  - `https://amrverse.github.io/AMRrulebrowser/?drug=amikacin`

- Búsqueda en organismo y término específico:

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli&search=amikacin`

- Buscar un gen:

  - `https://amrverse.github.io/AMRrulebrowser/?gene=blaTEM`

- Encontrar una regla específica por ruleID:

  - `https://amrverse.github.io/AMRrulebrowser/?ruleID=ARO0000001`

Notas:

- `?organism=` acepta guiones bajos en lugar de espacios y no distingue mayúsculas/minúsculas.
- `?drug=`, `?gene=`, `?ruleID=`, `?rule=`, `?search=`, o `?q=` realizan búsquedas en los resultados de navegación.
- Puede combinar `?organism=` con cualquier parámetro de búsqueda para buscar dentro de un organismo específico.
- El navegador siempre se muestra en modo de navegación con un menú desplegable de selección de organismos, sin importar cómo lo acceda.
- Para máxima compatibilidad en servidores estáticos, use los parámetros de consulta (query-style).

## Características

- **Navegación directa por organismo**: Seleccione organismos del menú desplegable para ver todas las reglas sin búsqueda forzada
- **Búsqueda multiparámetro**: Busque por fármaco, gen, ruleID o cualquier campo, opcionalmente filtrado por organismo
- **Enlaces compartibles**: Construya enlaces con búsquedas prerellenadas que otros pueden usar
- **Visibilidad de columna personalizable**: Use el botón "Columnas a mostrar" para mostrar/ocultar columnas. Por defecto, las siguientes columnas están ocultas (pueden mostrarse si es necesario):
  - `txid` (ID de taxonomía NCBI - haga clic en el nombre del organismo para el enlace de taxonomía)
  - `breakpoint condition`
  - `ARO accession`
  - `rule curation note`
- **Enlaces de ayuda**: Los iconos de información (ⓘ) junto a ciertos encabezados de columna enlazan con documentación de especificación detallada
- **Opciones de descarga**: Exporte resultados de búsqueda/navegación como archivo TSV
- **Diseño responsivo**: Funciona en computadoras de escritorio y dispositivos móviles con desplazamiento horizontal para tablas grandes

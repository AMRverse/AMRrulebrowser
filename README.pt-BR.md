# AMRrulesBrowser

Este navegador web foi desenvolvido para a exploração interativa do AMRrules. O pacote AMRrules contém o conjunto de regras e ferramentas para interpretar genótipos AMR, atualmente otimizado para a saída do AMRfinderplus.

Ao aplicar essas regras, o sistema gera relatórios genômicos que traduzem dados genéticos complexos em informações úteis sobre como genes e mutações influenciam a suscetibilidade a antimicrobianos.

Especificação completa: https://docs.google.com/spreadsheets/d/1F-J-_8Kyo3W0Oh6eDYyd0N8ahqVwiddM2112-Fg1gKc/

## Exemplos de uso/busca

Você pode construir links compartilháveis para abrir o navegador com filtros pré-aplicados (organismo ou pesquisa). Exemplos:

- Navegar para um organismo específico (use underscore em vez de espaços):

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli`

- Buscar por um medicamento em todos os arquivos:

  - `https://amrverse.github.io/AMRrulebrowser/?drug=amikacin`

- Pesquisa combinada (organismo + busca):

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli&drug=amikacin`

Observações:

- `?organism=` aceita underscores no lugar de espaços e não diferencia maiúsculas/minúsculas.
- `?drug=`, `?gene=`, `?rule=` ou `?q=` realizam buscas. Para máxima portabilidade em servidores estáticos simples, use links no estilo query (query-style).

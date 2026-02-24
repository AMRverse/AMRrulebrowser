# AMRrulesBrowser

Este navegador web foi desenvolvido para a exploração interativa do AMRrules. O pacote AMRrules contém o conjunto de regras e ferramentas para interpretar genótipos AMR, atualmente otimizado para a saída do AMRfinderplus.

Ao aplicar essas regras, o sistema gera relatórios genômicos que traduzem dados genéticos complexos em informações úteis sobre como genes e mutações influenciam a suscetibilidade a antimicrobianos.

Especificação completa: https://docs.google.com/spreadsheets/d/1F-J-_8Kyo3W0Oh6eDYyd0N8ahqVwiddM2112-Fg1gKc/

## Exemplos de uso/busca

Você pode construir links compartilháveis para abrir o navegador com filtros pré-aplicados (organismo ou pesquisa). Exemplos:

- Navegar para um organismo específico (use underscore em vez de espaços):

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli`

- Buscar por um medicamento em todos os organismos:

  - `https://amrverse.github.io/AMRrulebrowser/?drug=amikacin`

- Busca em um organismo específico e um termo:

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli&search=amikacin`

- Buscar um gene:

  - `https://amrverse.github.io/AMRrulebrowser/?gene=blaTEM`

- Encontrar uma regra específica por ruleID:

  - `https://amrverse.github.io/AMRrulebrowser/?ruleID=ARO0000001`

Observações:

- `?organism=` aceita underscores no lugar de espaços e não diferencia maiúsculas/minúsculas.
- `?drug=`, `?gene=`, `?ruleID=`, `?rule=`, `?search=`, ou `?q=` realizam buscas nos resultados de navegação.
- Você pode combinar `?organism=` com qualquer parâmetro de busca para pesquisar em um organismo específico.
- O navegador sempre exibe em modo de navegação com um menu suspenso de seleção de organismo, independentemente de como você o acessa.
- Para máxima portabilidade em servidores estáticos simples, use links no estilo query (query-style).

## Recursos

- **Navegação direta por organismo**: Selecione organismos do menu suspenso para visualizar todas as regras sem pesquisa forçada
- **Busca multi-parâmetros**: Busque por medicamento, gene, ruleID ou qualquer campo, opcionalmente filtrado por organismo
- **Links compartilháveis**: Construa links com buscas pré-preenchidas que outros podem usar
- **Visibilidade de coluna personalizável**: Use o botão "Colunas a exibir" para mostrar/ocultar colunas. Por padrão, as seguintes colunas ficam ocultas (podem ser mostradas se necessário):
  - `txid` (ID de taxonomia NCBI - clique no nome do organismo para o link de taxonomia)
  - `breakpoint condition`
  - `ARO accession`
  - `rule curation note`
- **Links de ajuda**: Ícones de informação (ⓘ) ao lado de certos cabeçalhos de coluna vinculam a documentação de especificação detalhada
- **Opções de download**: Exporta os resultados de busca/navegação como arquivo TSV
- **Design responsivo**: Funciona em computadores e dispositivos móveis com rolagem horizontal para tabelas grandes

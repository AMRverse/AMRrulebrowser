[![GitHub version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/AMRverse/AMRrulebrowser)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18751840.svg)](https://doi.org/10.5281/zenodo.18751840) • [🇫🇷](README.fr.md) • [🇧🇷](README.pt-BR.md) • [🇪🇸](README.es.md)


<img src="logo.png" width="180" align="center">


<!-- <p align="left">
  <em><b>Web browser to interactively explore AMRrules</b></em>
</p> -->

This web browser was developed for the interactive exploration of [AMRrules](https://github.com/AMRverse/AMRrules). The AMRrules Python package contains the core rule set alongside tools to interpret AMR genotypes—currently optimised for [AMRfinderplus](https://www.ncbi.nlm.nih.gov/pathogens/antimicrobial-resistance/AMRFinder/), output. By applying these rules, the system generates comprehensive genome reports that translate complex genetic data into expert-level insights on how core genes, acquired genes, and mutations influence antimicrobial susceptibility.

Full specification: [AMRrules spec v0.6](https://docs.google.com/spreadsheets/d/1F-J-_8Kyo3W0Oh6eDYyd0N8ahqVwiddM2112-Fg1gKc/edit?usp=sharing). Note this includes several additional fields beyond those pictured above, including NCBI and CARD ARO accessions to uniquely identify genes; details of the breakpoints and standards used; evidence codes, grades and limitations; and a rule annotation note.

### Available rules

Rule curation is a work in progress, under active development by the [ESGEM-AMR](https://github.com/AMRverse/AMRrulesCuration/) Working Group.

## See the examples of usage/search

You can construct shareable links to open the browser pre-filtered by organism or search terms. Examples below assume the app is hosted at `https://amrverse.github.io/AMRrulebrowser/` or running locally (e.g., `http://localhost:8000/`).

- Browse a specific organism (uses underscores instead of spaces):

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli`

- Search for a drug across all organisms:

  - `https://amrverse.github.io/AMRrulebrowser/?drug=amikacin`

- Search for a specific organism and drug:

  - `https://amrverse.github.io/AMRrulebrowser/?organism=Escherichia_coli&search=amikacin`

- Search for a gene:

  - `https://amrverse.github.io/AMRrulebrowser/?gene=blaTEM`

- Find a specific rule by ruleID:

  - `https://amrverse.github.io/AMRrulebrowser/?ruleID=ARO0000001`

Notes:

- `?organism=` accepts underscores in place of spaces and is case-insensitive.
- `?drug=`, `?gene=`, `?ruleID=`, `?rule=`, `?search=`, or `?q=` perform searches within the browse results.
- You can combine `?organism=` with any search parameter to search within a specific organism.
- The browser always displays in browse mode with an organism selector dropdown, regardless of how you access it.
- For maximum portability on simple static servers use the query-style links above (path-style links require an SPA-aware server).

## Features

- **Direct organism browsing**: Select organisms from the dropdown to view all rules without forced searching
- **Multi-parameter search**: Search by drug, gene, ruleID, or any field, optionally filtered to a specific organism
- **Shareable links**: Construct links with pre-filled searches that others can use
- **Customizable column visibility**: Use the "Columns to display" button to show/hide columns. By default, the following columns are hidden (can be shown if needed):
  - `txid` (NCBI taxonomy ID - click organism name for taxonomy link)
  - `breakpoint condition`
  - `ARO accession`
  - `rule curation note`
- **Help links**: Info icons ⓘ next to certain column headers link to detailed specification documentation
- **Download options**: Export search/browse results as TSV file
- **Responsive design**: Works on desktop and mobile devices with horizontal scrolling for large tables

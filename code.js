document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const fileInput = document.getElementById('fileInput');
    const loadButton = document.getElementById('loadButton');
    const clearButton = document.getElementById('clearButton');
    const searchInput = document.getElementById('searchInput');
    const columnSelect = document.getElementById('columnSelect');
    const searchButton = document.getElementById('searchButton');
    const loadedFilesList = document.getElementById('loadedFilesList');
    const searchResultsDiv = document.getElementById('searchResults');
    const resultsCountDiv = document.getElementById('resultsCount');
    const downloadTsvButton = document.getElementById('downloadTsvButton');
    const downloadCsvButton = document.getElementById('downloadCsvButton');

    const browseModeRadio = document.getElementById('browseMode');
    const searchModeRadio = document.getElementById('searchMode');
    const browseControlsSection = document.getElementById('browseControlsSection');
    const searchControlsSection = document.getElementById('searchControlsSection');
    const browseFileSelect = document.getElementById('browseFileSelect');
    const browseSearchInput = document.getElementById('browseSearchInput');
    const browseSearchButton = document.getElementById('browseSearchButton');
    const browseSearchClearButton = document.getElementById('browseSearchClearButton');
    const resultsHeader = document.getElementById('resultsHeader');

    // --- Flags ---
    let columnsToggleListenerAdded = false;
    const LOCAL_STORAGE_KEY = 'localTxtFileData_v2';
    const GITHUB_REPO = 'AMRverse/AMRrules';
    const GITHUB_BRANCH = 'genome_summary_report_dev';
    const GITHUB_RULES_PATH = 'rules';
    const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_RULES_PATH}?ref=${GITHUB_BRANCH}`;
    const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_RULES_PATH}`;
    let DEFAULT_FILES = []; // Will be populated dynamically
    const FIXED_HEADER_ORDER = [
        'ruleID', 'txid', 'organism', 'gene', 'nodeID', 'protein accession',
        'HMM accession', 'nucleotide accession', 'ARO accession',
        'mutation', 'variation type', 'gene context',
        'drug', 'drug class', 'phenotype', 'clinical category', 'breakpoint',
        'breakpoint standard', 'breakpoint condition', 'PMID', 'evidence code', 
        'evidence grade', 'evidence description', 'evidence limitations', 'rule curation note'
    ];
    const ACCESSION_URLS = {
        'protein accession': 'https://www.ncbi.nlm.nih.gov/protein/',
        'nucleotide accession': 'https://www.ncbi.nlm.nih.gov/nuccore/',
        'PMID': 'https://pubmed.ncbi.nlm.nih.gov/',
        'ARO accession': 'https://card.mcmaster.ca/aro/',
        'evidence code': 'https://evidenceontology.org/term/',
        'nodeID': 'https://www.ncbi.nlm.nih.gov/pathogens/genehierarchy/#',
        'HMM accession': 'https://www.ncbi.nlm.nih.gov/pathogens/hmm/#'
    };
    const HEADER_TOOLTIPS = {
        'ruleID': 'Unique identifier for the rule',
        'txid': 'Taxonomy ID for the organism the rule applies to (NCBI)',
        'organism': 'Name of the organism the rule applies to',
        'gene': 'Name of the gene the rule applies to',
        'nodeID': 'Node ID for the gene the rule applies (NCBI reference gene hierarchy)',
        'protein accession': 'Protein sequence accession for the gene the rule applies to (NCBI)',
        'HMM accession': 'HMM accession for the gene the rule applies to (NCBI)',
        'nucleotide accession': 'Nucleotide sequence accession for the gene the rule applies to (NCBI)',
        'ARO accession': 'Gene accession for the gene the rule applies to (CARD ARO)',
        'mutation': 'Specific mutation within the gene (HGVS nomenclature)',
        'variation type': 'Type of genetic variation',
        'gene context': 'Context of this gene within the species (core/acquired)',
        'drug': 'Name of the drug the rule applies to (CARD ARO term)',
        'drug class': 'Name of the drug class the rule applies to (CARD ARO term)',
        'phenotype': 'Phenotype defined by comparison to epidemiological cutoff (ECOFF)',
        'clinical category': 'Clinical category (S/I/R) defined by comparison to breakpoints',
        'breakpoint': 'Breakpoint value used to define clinical category',
        'breakpoint standard': 'Source of the breakpoint (e.g., EUCAST, CLSI)',
        'breakpoint condition': 'Specific condition to which this breakpoint applies',
        'PMID': 'PubMed ID for article/s supporting this rule',
        'evidence code': 'Type of evidence supporting this rule (ECO ontology)',
        'evidence grade': 'Evidence grade, summarising expert curators assessment of the available evidence for this rule',
        'evidence description': 'Description of the evidence',
        'evidence limitations': 'Limitations of the available evidence',
        'rule curation note': 'Curators note explaining the genetic mechanism and/or reasoning for the rule'
    };
    const EVIDENCE_GRADE_TOOLTIPS = {
        'high': 'The curators are confident in the categorisation, and believe that the likelihood that the effect will be substantially different from this is low.',
        'moderate': 'The curators believe that the categorisation most likely reflects the true effect, and the likelihood that the effect will be substantially different is moderate.',
        'low': 'The curators believe that the categorisation might not reflect the true effect, and the likelihood that the effect will be substantially different is high.',
        'very low': 'The curators have no confidence that the categorisation reflects the true effect, and the likelihood that the effect will be substantially different is high.'
    };

    // --- State Variables ---
    let currentDataForDisplayAndDownload = [];
    let currentHeadersForDisplay = [];
    let sortColumnKey = '';
    let sortDirection = 'asc';
    let originalBrowseData = []; // Track original browse data before filtering
    let currentBrowseSearchTerm = ''; // Track current browse search term for URL updates
    let DRUG_ARO_MAP = {}; // Maps drug names to ARO IDs
    let CLASS_ARO_MAP = {}; // Maps drug class names to ARO IDs

    // --- Initialization ---
    (async () => {
        await fetchAndParseCardMapping(); // Load CARD mapping first
        initializeApplication();
    })();

    // --- Helper Functions for GitHub File Fetching ---
    
    // Mapping for common typos and variations
    const TYPO_CORRECTIONS = {
        'penicillin beta-lactam antibiotc': 'penicillin beta-lactam',
        'sulfonamides': 'sulfonamide antibiotic',
        'aminoglycosides': 'aminoglycoside antibiotic',
        'kanamycin': 'kanamycin a'
    };
    
    // Normalize strings for case-insensitive and hyphen-space matching
    function normalizeKey(str) {
        let normalized = String(str)
            .toLowerCase()
            .replace(/-/g, ' ')  // Replace hyphens with spaces
            .replace(/\s+/g, ' ')  // Collapse multiple spaces
            .trim();
        
        // Apply typo corrections
        if (TYPO_CORRECTIONS[normalized]) {
            normalized = TYPO_CORRECTIONS[normalized];
        }
        
        return normalized;
    }
    
    async function fetchAndParseCardMapping() {
        try {
            // Try loading from GitHub first
            const response = await fetch('https://raw.githubusercontent.com/amrverse/AMRrulebrowser/main/card_drug_names.tsv');
            if (!response.ok) throw new Error(`Failed to fetch CARD mapping: ${response.statusText}`);
            const content = await response.text();
            
            const lines = content.split('\n');
            let drugCount = 0;
            let classCount = 0;
            
            lines.forEach((line, index) => {
                if (line.trim() === '') return; // Skip empty lines
                if (index === 0) return; // Skip header line
                
                const parts = line.split('\t');
                if (parts.length < 3) return;
                
                const aroId = parts[0].trim();
                if (aroId === '-' || !aroId) return; // Skip entries without ARO ID
                
                const aroNumber = aroId.replace('ARO:', '');
                const drugName = parts[1].trim();
                const className = parts[2].trim();
                
                // If it's a drug entry
                if (drugName && drugName !== '-') {
                    const normalizedDrug = normalizeKey(drugName);
                    DRUG_ARO_MAP[normalizedDrug] = aroNumber;
                    drugCount++;
                }
                
                // If it's a class entry
                if (className && className !== '-') {
                    const normalizedClass = normalizeKey(className);
                    CLASS_ARO_MAP[normalizedClass] = aroNumber;
                    classCount++;
                }
            });
            
            console.log(`Loaded ${drugCount} drug entries and ${classCount} class entries from CARD mapping`);
        } catch (error) {
            console.error("Error loading CARD drug/class mapping from GitHub:", error);
            // Continue without the mappings - links won't be created for drugs and classes
        }
    }
    
    async function fetchDefaultFilesFromGitHub() {
        try {
            const response = await fetch(GITHUB_API_URL);
            if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
            const files = await response.json();
            
            // Filter for .txt files and build URLs
            DEFAULT_FILES = files
                .filter(file => file.name.endsWith('.txt'))
                .map(file => ({
                    name: file.name,
                    url: `${GITHUB_RAW_URL}/${file.name}`
                }));
            
            console.log(`Found ${DEFAULT_FILES.length} txt files from GitHub repository`);
            return DEFAULT_FILES;
        } catch (error) {
            console.error("Error fetching file list from GitHub:", error);
            alert("Could not fetch file list from GitHub repository. Check console for details.");
            return [];
        }
    }

    // Helper function to format file names (remove .txt and replace _ with space)
    function formatFileName(fileName) {
        return fileName.replace(/\.txt$/, '').replace(/_/g, ' ');
    }

    // --- Event Listeners ---
    loadButton.addEventListener('click', () => {
        const files = fileInput.files;
        if (files.length === 0) {
            alert('Please select at least one file.');
            return;
        }
        handleFileUploads(files);
    });

    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all loaded data (including defaults)? This will remove them from your browser\'s local storage for this page.')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            resetUIAfterClear();
            alert('All data cleared. Default files will need to be re-fetched if you refresh or can be re-loaded manually if needed.');
        }
    });

    browseModeRadio.addEventListener('change', handleModeChange);
    searchModeRadio.addEventListener('change', handleModeChange);
    browseFileSelect.addEventListener('change', triggerBrowse);

    browseSearchButton.addEventListener('click', performBrowseSearch);
    browseSearchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') performBrowseSearch();
    });
    browseSearchClearButton.addEventListener('click', clearBrowseSearch);

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') performSearch();
    });

    downloadTsvButton.addEventListener('click', () => downloadCurrentData('tsv'));
    downloadCsvButton.addEventListener('click', () => downloadCurrentData('csv'));

    // --- Core Functions ---
    async function initializeApplication() {
        let storedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
        
        // First, fetch the list of available files from GitHub
        resultsCountDiv.textContent = `Fetching file list from GitHub repository...`;
        const defaultFilesFromGitHub = await fetchDefaultFilesFromGitHub();
        
        if (defaultFilesFromGitHub.length === 0) {
            resultsCountDiv.textContent = "Error: Could not fetch files from GitHub.";
            updateUIAfterDataLoad(storedData);
            handleModeChange();
            return;
        }
        
        // Check which files are already stored
        const defaultFileNamesInStorage = defaultFilesFromGitHub.filter(df => storedData[df.name]);
        const defaultFilesToFetch = defaultFilesFromGitHub.filter(df => !storedData[df.name]);

        if (defaultFilesToFetch.length > 0) {
            resultsCountDiv.textContent = `Loading ${defaultFilesToFetch.length} default file(s) from GitHub...`;
            try {
                await Promise.all(defaultFilesToFetch.map(async (fileObj) => {
                    const response = await fetch(fileObj.url);
                    if (!response.ok) throw new Error(`Failed to fetch ${fileObj.name}: ${response.statusText}`);
                    const content = await response.text();
                    const parsed = parseTSV(content);
                    storedData[fileObj.name] = {
                        name: fileObj.name,
                        content: content, // Store raw content
                        headerLineIndex: parsed.headerLineIndex,
                        headers: parsed.headers,
                        rows: parsed.rows,
                        type: 'text/plain',
                        lastModified: new Date().toLocaleDateString() // Placeholder
                    };
                }));
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData));
                resultsCountDiv.textContent = `Loaded ${defaultFilesToFetch.length} file(s) from GitHub. ${defaultFileNamesInStorage.length > 0 ? (defaultFileNamesInStorage.length + ' previously loaded files also available.') : ''}`;
            } catch (error) {
                console.error("Error loading default files from GitHub:", error);
                alert("Could not load some files from GitHub. Check console for details.");
                resultsCountDiv.textContent = "Error loading files from GitHub.";
            }
        } else if (Object.keys(storedData).length > 0) {
             resultsCountDiv.textContent = "Loaded data from previous session.";
        }


        updateUIAfterDataLoad(storedData);

        // After UI is ready, handle any deep-link in the URL (path or query)
        try {
            handleInitialQuery(storedData);
        } catch (e) {
            console.warn('Error processing initial URL query/path', e);
        }

        handleModeChange(); // Set initial mode and display
    }

    function resetUIAfterClear() {
        updateLoadedFilesList([]);
        updateColumnSelector([]);
        updateBrowseFileDropdown([]);
        searchResultsDiv.innerHTML = '';
        resultsCountDiv.textContent = 'No data loaded.';
        currentDataForDisplayAndDownload = [];
        currentHeadersForDisplay = [];
        toggleDownloadButtons(false);
        // Consider if you want to immediately try to reload default files here
        // or just inform the user they will load on next refresh/visit.
        // For now, it's cleared. A refresh will trigger initializeApplication again.
    }

    function updateUIAfterDataLoad(dataObject) {
        const fileNames = Object.keys(dataObject);
        const allHeaders = new Set();
        Object.values(dataObject).forEach(fileData => {
            if (fileData.headers) {
                fileData.headers.forEach(h => allHeaders.add(h));
            }
        });

        updateLoadedFilesList(fileNames.sort());
        updateColumnSelector(Array.from(allHeaders).sort());
        updateBrowseFileDropdown(fileNames.sort());
    }

    // Find a file key in storedData matching an organism-like query
    function findFileKeyByOrganismParam(param, storedData) {
        if (!param) return null;
        const cleaned = String(param).replace(/\.txt$/i, '').replace(/_/g, ' ');
        const normParam = normalizeKey(cleaned);
        for (const key of Object.keys(storedData)) {
            const base = key.replace(/\.txt$/i, '');
            const formatted = formatFileName(key);
            if (normalizeKey(base) === normParam) return key;
            if (normalizeKey(formatted) === normParam) return key;
            // also allow partial matches
            if (normalizeKey(base).includes(normParam) || normalizeKey(formatted).includes(normParam)) return key;
        }
        // If no filename matches, search inside file rows for an organism column matching the param
        for (const key of Object.keys(storedData)) {
            const fileData = storedData[key];
            if (!fileData || !Array.isArray(fileData.rows)) continue;
            for (const r of fileData.rows) {
                let v = r['organism'] || '';
                if (typeof v === 'string') {
                    v = v.trim().replace(/^"|"$/g, '');
                    if (v.startsWith('s__')) v = v.substring(3);
                    if (normalizeKey(v) === normParam) return key;
                }
            }
        }
        return null;
    }

    // Process URL query parameters and pathname to pre-select organism or run a search
    function handleInitialQuery(storedData) {
        if (typeof window === 'undefined' || !window.location) return;
        const path = window.location.pathname || '';
        const pathSegments = path.split('/').filter(s => s && s.trim() !== '');
        let pathCandidate = '';
        if (pathSegments.length > 0) {
            pathCandidate = decodeURIComponent(pathSegments[pathSegments.length - 1]);
            if (/\.html?$/.test(pathCandidate) || pathCandidate.toLowerCase().endsWith('examples')) {
                pathCandidate = '';
            }
        }

        const raw = window.location.search ? window.location.search.slice(1) : '';

        // Prefer path-based organism deep-link if present
        if (pathCandidate) {
            const fileKey = findFileKeyByOrganismParam(pathCandidate, storedData);
            if (fileKey) {
                browseModeRadio.checked = true;
                handleModeChange();
                // Try to find an organism-specific option whose normalized organism matches the pathCandidate
                let matchedOptionValue = null;
                const opts = Array.from(browseFileSelect.querySelectorAll('option'));
                const targetNorm = normalizeKey(pathCandidate);
                for (const o of opts) {
                    if (!o.value) continue;
                    if (!o.value.startsWith(fileKey + '::')) continue;
                    const parts = o.value.split('::');
                    const enc = parts.slice(1).join('::');
                    try {
                        const orgRaw = decodeURIComponent(enc);
                        if (normalizeKey(orgRaw) === targetNorm) {
                            matchedOptionValue = o.value;
                            break;
                        }
                    } catch (e) {
                        // ignore decode errors
                    }
                }
                if (matchedOptionValue) browseFileSelect.value = matchedOptionValue;
                else browseFileSelect.value = fileKey;
                triggerBrowse();
                return;
            }
        }

        // If no '=' present treat as organism shorthand (e.g. ?escherichia_coli)
        if (raw && raw.indexOf('=') === -1) {
            const param = decodeURIComponent(raw);
            const fileKey = findFileKeyByOrganismParam(param, storedData);
            if (fileKey) {
                browseModeRadio.checked = true;
                handleModeChange();
                browseFileSelect.value = fileKey;
                triggerBrowse();
            }
            return;
        }

        const params = new URLSearchParams(raw);
        

        if (params.has('organism') || params.has('org') || params.has('o')) {
            const val = params.get('organism') || params.get('org') || params.get('o');
            if (val) {
                const fileKey = findFileKeyByOrganismParam(val, storedData);
                if (fileKey) {
                    browseModeRadio.checked = true;
                    handleModeChange();
                    // Try to select an organism-specific option if available
                    const rawParam = String(val);
                    const targetNorm = normalizeKey(rawParam.replace(/_/g, ' '));
                    let matchedOptionValue = null;
                    const opts = Array.from(browseFileSelect.querySelectorAll('option'));
                    for (const o of opts) {
                        if (!o.value) continue;
                        if (!o.value.startsWith(fileKey + '::')) continue;
                        const parts = o.value.split('::');
                        const enc = parts.slice(1).join('::');
                        try {
                            const orgRaw = decodeURIComponent(enc);
                            if (normalizeKey(orgRaw) === targetNorm) {
                                matchedOptionValue = o.value;
                                break;
                            }
                        } catch (e) {
                            // ignore decode errors
                        }
                    }
                    if (matchedOptionValue) browseFileSelect.value = matchedOptionValue;
                    else browseFileSelect.value = fileKey;
                    triggerBrowse();
                }
            }
        }

        if (params.has('drug') || params.has('gene') || params.has('ruleID') || params.has('rule') || params.has('search') || params.has('q')) {
            const searchVal = params.get('drug') || params.get('gene') || params.get('ruleID') || params.get('rule') || params.get('search') || params.get('q');
            if (searchVal) {
                // Always stay in browse mode - apply search to browse results instead
                browseModeRadio.checked = true;
                handleModeChange();
                
                // Set organism if provided, otherwise use 'all'
                if (params.has('organism') || params.has('org') || params.has('o')) {
                    const orgVal = params.get('organism') || params.get('org') || params.get('o');
                    const fileKey = findFileKeyByOrganismParam(orgVal, storedData);
                    if (fileKey) {
                        const rawParam = String(orgVal);
                        const targetNorm = normalizeKey(rawParam.replace(/_/g, ' '));
                        let matchedOptionValue = null;
                        const opts = Array.from(browseFileSelect.querySelectorAll('option'));
                        for (const o of opts) {
                            if (!o.value) continue;
                            if (!o.value.startsWith(fileKey + '::')) continue;
                            const parts = o.value.split('::');
                            const enc = parts.slice(1).join('::');
                            try {
                                const orgRaw = decodeURIComponent(enc);
                                if (normalizeKey(orgRaw) === targetNorm) {
                                    matchedOptionValue = o.value;
                                    break;
                                }
                            } catch (e) {}
                        }
                        if (matchedOptionValue) browseFileSelect.value = matchedOptionValue;
                        else browseFileSelect.value = fileKey;
                    }
                } else {
                    browseFileSelect.value = 'all';
                }
                
                // Trigger browse to load data, then apply search
                triggerBrowse();
                browseSearchInput.value = searchVal;
                currentBrowseSearchTerm = searchVal.toLowerCase();
                performBrowseSearch();
            }
        }
    }
    
    function handleFileUploads(files) {
        let existingData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
        let filesProcessed = 0;
        const totalFiles = files.length;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                const parsed = parseTSV(content);
                
                existingData[file.name] = {
                    name: file.name,
                    content: content,
                    headerLineIndex: parsed.headerLineIndex,
                    headers: parsed.headers,
                    rows: parsed.rows,
                    type: file.type,
                    lastModified: file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'N/A'
                };
                filesProcessed++;
                if (filesProcessed === totalFiles) {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingData));
                    updateUIAfterDataLoad(existingData);
                    alert(`${totalFiles} file(s) processed and stored.`);
                    fileInput.value = ''; // Reset file input
                    if (browseModeRadio.checked) {
                        triggerBrowse(); // Refresh browse view if in browse mode
                    }
                }
            };
            reader.onerror = () => {
                alert(`Error reading file: ${file.name}`);
                filesProcessed++;
                 if (filesProcessed === totalFiles) {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingData)); // Save what was processed
                    updateUIAfterDataLoad(existingData);
                }
            };
            reader.readAsText(file);
        });
    }

    function handleModeChange() {
        sortColumnKey = ''; // Reset sort when mode changes
        sortDirection = 'asc';
        if (browseModeRadio.checked) {
            browseControlsSection.style.display = 'block';
            searchControlsSection.style.display = 'none';
            resultsHeader.textContent = 'Browse results:';
            searchInput.value = ''; // Clear search input
            triggerBrowse();
        } else { // Search mode
            browseControlsSection.style.display = 'none';
            searchControlsSection.style.display = 'block';
            resultsHeader.textContent = 'Search results:';
            searchResultsDiv.innerHTML = '<p>Enter search criteria above and click Search.</p>';
            resultsCountDiv.textContent = '';
            currentDataForDisplayAndDownload = [];
            toggleDownloadButtons(false);
        }
    }

    function triggerBrowse() {
        const selectedFileName = browseFileSelect.value;
        const storedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
        let dataToBrowse = [];
        let distinctHeaders = new Set();

        if (Object.keys(storedData).length === 0) {
            searchResultsDiv.innerHTML = '<p>No organisms loaded to browse.</p>';
            resultsCountDiv.textContent = '';
            currentDataForDisplayAndDownload = [];
            currentHeadersForDisplay = [];
            toggleDownloadButtons(false);
            renderTable([], []); // Clear table
            return;
        }
        
        if (selectedFileName === 'all') {
            resultsHeader.textContent = 'Browsing: all organisms';
            Object.values(storedData).forEach(fileData => {
                if (fileData && fileData.rows) dataToBrowse.push(...fileData.rows);
                if (fileData && fileData.headers) fileData.headers.forEach(h => distinctHeaders.add(h));
            });
        } else if (selectedFileName.includes('::')) {
            // option encoded as fileName::encodedOrganism
            const parts = selectedFileName.split('::');
            const fileKey = parts[0];
            const org = decodeURIComponent(parts.slice(1).join('::'));
            if (storedData[fileKey] && storedData[fileKey].rows) {
                resultsHeader.textContent = `Browsing: ${org}`;
                // filter rows for organism, removing s__ prefix and trimming/quotes
                dataToBrowse = storedData[fileKey].rows.filter(r => {
                    let v = r['organism'] || '';
                    if (typeof v !== 'string') v = String(v);
                    v = v.trim().replace(/^"|"$/g, '');
                    if (v.startsWith('s__')) v = v.substring(3);
                    return normalizeKey(v) === normalizeKey(org);
                });
                if (storedData[fileKey].headers) storedData[fileKey].headers.forEach(h => distinctHeaders.add(h));
            }
        } else if (storedData[selectedFileName] && storedData[selectedFileName].rows) {
            resultsHeader.textContent = `Browsing: ${formatFileName(selectedFileName)}`;
            dataToBrowse = storedData[selectedFileName].rows;
            if (storedData[selectedFileName].headers) {
                storedData[selectedFileName].headers.forEach(h => distinctHeaders.add(h));
            }
        }

        currentHeadersForDisplay = FIXED_HEADER_ORDER.filter(h => distinctHeaders.has(h));
        if (currentHeadersForDisplay.length === 0 && distinctHeaders.size > 0) {
            currentHeadersForDisplay = Array.from(distinctHeaders).sort();
        }
        
        originalBrowseData = dataToBrowse;
        currentDataForDisplayAndDownload = dataToBrowse;
        browseSearchInput.value = ''; // Clear browse search input when switching organisms
        currentBrowseSearchTerm = ''; // Clear search term when switching organisms
        sortColumnKey = ''; // Reset sort when browsing new data
        sortDirection = 'asc';
        sortAndDisplayData();
        resultsCountDiv.textContent = `Displaying ${dataToBrowse.length} row(s).`;
        toggleDownloadButtons(dataToBrowse.length > 0);

        // Update URL to reflect current browse selection
        try {
            updateUrlForBrowseSelection(selectedFileName);
        } catch (e) {
            console.warn('Could not update URL for browse selection', e);
        }
    }

    function updateUrlForBrowseSelection(selectedValue, searchTerm) {
        if (typeof window === 'undefined' || !window.history || !window.location) return;
        // Build base path (directory hosting the app). Keep trailing slash.
        let base = window.location.pathname || '/';
        if (base.endsWith('index.html')) base = base.slice(0, -'index.html'.length);
        if (!base.endsWith('/')) base = base.replace(/[^\/]*$/, '');

        // Use provided searchTerm or current state variable
        const activeTerm = searchTerm !== undefined ? searchTerm : currentBrowseSearchTerm;

        if (!selectedValue || selectedValue === 'all') {
            // If search term exists, include it
            if (activeTerm) {
                const newUrl = base + '?search=' + encodeURIComponent(activeTerm);
                history.replaceState(null, '', newUrl);
            } else {
                // Clear organism-specific part
                const newUrl = base;
                history.replaceState(null, '', newUrl);
            }
            return;
        }

        if (selectedValue.includes('::')) {
            const parts = selectedValue.split('::');
            const fileKey = parts[0];
            const orgEncoded = parts.slice(1).join('::');
            let orgRaw = orgEncoded;
            try { orgRaw = decodeURIComponent(orgEncoded); } catch (e) {}
            // Use query param ?organism= so multi-organism selections are linkable and consistent
            const orgForParam = orgRaw.replace(/\s+/g, '_');
            
            // Include search term if present
            let newUrl = base + '?organism=' + encodeURIComponent(orgForParam);
            if (activeTerm) {
                newUrl += '&search=' + encodeURIComponent(activeTerm);
            }
            history.replaceState(null, '', newUrl);
            return;
        }

        // file-level selection: set an organism query param so it's linkable
        const fileBase = selectedValue.replace(/\.txt$/i, '');
        const fileForParam = fileBase.replace(/\s+/g, '_');
        let newUrl = base + '?organism=' + encodeURIComponent(fileForParam);
        if (activeTerm) {
            newUrl += '&search=' + encodeURIComponent(activeTerm);
        }
        history.replaceState(null, '', newUrl);
    }

    function performBrowseSearch() {
        const searchTerm = browseSearchInput.value.trim().toLowerCase();
        currentBrowseSearchTerm = searchTerm; // Track for URL updates
        
        if (!searchTerm) {
            alert('Please enter a search term.');
            return;
        }

        let matchedRows = [];
        originalBrowseData.forEach(row => {
            if (Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm))) {
                matchedRows.push(row);
            }
        });

        currentDataForDisplayAndDownload = matchedRows;
        sortColumnKey = ''; // Reset sort for new search
        sortDirection = 'asc';
        sortAndDisplayData();
        resultsCountDiv.textContent = `Found ${matchedRows.length} match(es) in browse results.`;
        toggleDownloadButtons(matchedRows.length > 0);
        if (matchedRows.length === 0) {
             searchResultsDiv.innerHTML = '<p>No results found.</p>';
        }
        
        // Update URL to reflect current browse state (organism + search term)
        try {
            updateUrlForBrowseSelection(browseFileSelect.value, searchTerm);
        } catch (e) {
            console.warn('Could not update URL for browse search', e);
        }
    }

    function clearBrowseSearch() {
        browseSearchInput.value = '';
        currentBrowseSearchTerm = ''; // Clear search term
        currentDataForDisplayAndDownload = originalBrowseData;
        sortColumnKey = '';
        sortDirection = 'asc';
        sortAndDisplayData();
        resultsCountDiv.textContent = `Displaying ${originalBrowseData.length} row(s).`;
        toggleDownloadButtons(originalBrowseData.length > 0);
        
        // Update URL to remove search term
        try {
            updateUrlForBrowseSelection(browseFileSelect.value);
        } catch (e) {
            console.warn('Could not update URL for browse clear', e);
        }
    }

    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedSearchCol = columnSelect.value; // Renamed to avoid conflict
        
        if (!searchTerm) {
            alert('Please enter a search term.');
            searchResultsDiv.innerHTML = '<p>Please enter a search term.</p>';
            resultsCountDiv.textContent = '';
            currentDataForDisplayAndDownload = [];
            currentHeadersForDisplay = [];
            toggleDownloadButtons(false);
            renderTable([], []);
            return;
        }

        const storedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
        if (!storedData || Object.keys(storedData).length === 0) {
            alert('No files loaded to search.');
            return;
        }

        let matchedRows = [];
        let distinctHeadersInMatches = new Set();

        Object.values(storedData).forEach(fileData => {
            const fileHeaders = fileData.headers || [];
            const fileRows = fileData.rows || [];

            fileRows.forEach(row => {
                let rowMatched = false;
                if (selectedSearchCol === 'all') {
                    if (Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm))) {
                        rowMatched = true;
                    }
                } else {
                    if (row.hasOwnProperty(selectedSearchCol) && String(row[selectedSearchCol]).toLowerCase().includes(searchTerm)) {
                        rowMatched = true;
                    }
                }
                if (rowMatched) {
                    matchedRows.push(row);
                    fileHeaders.forEach(h => distinctHeadersInMatches.add(h));
                }
            });
        });
        
        currentHeadersForDisplay = FIXED_HEADER_ORDER.filter(h => distinctHeadersInMatches.has(h));
         if (currentHeadersForDisplay.length === 0 && distinctHeadersInMatches.size > 0) {
            currentHeadersForDisplay = Array.from(distinctHeadersInMatches).sort();
        }

        currentDataForDisplayAndDownload = matchedRows;
        sortColumnKey = ''; // Reset sort for new search
        sortDirection = 'asc';
        sortAndDisplayData();
        resultsCountDiv.textContent = `Found ${matchedRows.length} match(es).`;
        // update URL to reflect search
        try {
            updateUrlForSearch(searchTerm, selectedSearchCol);
        } catch (e) {
            console.warn('Could not update URL for search', e);
        }
        toggleDownloadButtons(matchedRows.length > 0);
        if (matchedRows.length === 0) {
             searchResultsDiv.innerHTML = '<p>No results found.</p>';
        }
    }

    function updateUrlForSearch(term, column) {
        if (typeof window === 'undefined' || !window.history || !window.location) return;
        let base = window.location.pathname || '/';
        if (base.endsWith('index.html')) base = base.slice(0, -'index.html'.length);
        if (!base.endsWith('/')) base = base.replace(/[^\/]*$/, '');

        const encoded = encodeURIComponent(term);
        let q = '';
        if (column && column !== 'all') {
            if (column === 'ruleID') q = `?rule=${encoded}`;
            else q = `?${encodeURIComponent(column)}=${encoded}`;
        } else {
            q = `?q=${encoded}`;
        }
        history.replaceState(null, '', base + q);
    }

    function updateLoadedFilesList(fileNames) {
        loadedFilesList.innerHTML = '';
        if (fileNames.length === 0) {
            loadedFilesList.innerHTML = '<li>No files loaded.</li>';
        } else {
            fileNames.forEach(name => {
                const li = document.createElement('li');
                li.textContent = name;
                loadedFilesList.appendChild(li);
            });
        }
    }

    function updateBrowseFileDropdown(fileNames) {
        browseFileSelect.innerHTML = '<option value="all">All organisms</option>';
        const storedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
        fileNames.forEach(name => {
            const fileData = storedData[name];
            // If file has an 'organism' header and multiple distinct organisms, show organism-level options
            if (fileData && fileData.headers && fileData.headers.includes('organism') && Array.isArray(fileData.rows)) {
                const orgSet = new Set();
                fileData.rows.forEach(r => {
                    let v = r['organism'] || '';
                    if (typeof v === 'string') {
                        v = v.trim().replace(/^"|"$/g, '');
                        if (v.startsWith('s__')) v = v.substring(3);
                        if (v !== '') orgSet.add(v);
                    }
                });

                if (orgSet.size > 1) {
                    // Create an option per organism (value encodes file and organism)
                    Array.from(orgSet).sort().forEach(org => {
                        const option = document.createElement('option');
                        option.value = `${name}::${encodeURIComponent(org)}`;
                        option.textContent = org.replace(/_/g, ' ');
                        browseFileSelect.appendChild(option);
                    });
                    return; // skip adding file-level option
                }
            }

            // Default: add file-level option
            const option = document.createElement('option');
            option.value = name;
            option.textContent = formatFileName(name);
            browseFileSelect.appendChild(option);
        });
    }

    function updateColumnSelector(headers) {
        columnSelect.innerHTML = '<option value="all">All Columns</option>';
        FIXED_HEADER_ORDER.forEach(fixedHeader => {
            if (headers.includes(fixedHeader)) {
                const option = document.createElement('option');
                option.value = fixedHeader;
                option.textContent = fixedHeader;
                columnSelect.appendChild(option);
            }
        });
        headers.forEach(header => {
            if (!FIXED_HEADER_ORDER.includes(header) && header.trim() !== '') {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                columnSelect.appendChild(option);
            }
        });
    }

    function parseTSV(content) {
        const lines = content.split('\n');
        let headerLineIndex = -1;
        let headers = [];

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() !== '') {
                headerLineIndex = i;
                headers = lines[i].split('\t').map(h => h.trim());
                break;
            }
        }
        if (headerLineIndex === -1) return { headers: [], rows: [], headerLineIndex: -1 };
        
        const dataRows = lines.slice(headerLineIndex + 1);
        const rows = dataRows.map(line => {
            const values = line.split('\t');
            const rowObject = {};
            headers.forEach((header, index) => {
                // Comprehensive trimming to remove all leading/trailing whitespace
                let value = values[index] || '';
                value = value.trim().replace(/\s+$/g, '').replace(/^\s+/g, '');
                rowObject[header] = value;
            });
            return rowObject;
        }).filter(row => {
            // Filter out specific ruleIDs (handle potential quote characters)
            const ruleID = String(row.ruleID || '').trim().replace(/"/g, '');
            const blockedRuleIDs = [];
            if (blockedRuleIDs.includes(ruleID)) {
                return false;
            }
            return Object.values(row).some(val => val && String(val).trim() !== '');
        });
        return { headers, rows, headerLineIndex };
    }
    
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') {
            unsafe = String(unsafe); // Ensure it's a string
        }
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // Create a single shared custom tooltip element for fast, responsive header tooltips
    const customTooltip = document.createElement('div');
    customTooltip.className = 'custom-tooltip';
    document.body.appendChild(customTooltip);
    let tooltipShowTimer = null;
    let tooltipHideTimer = null;
    const TOOLTIP_SHOW_DELAY = 120; // ms
    const TOOLTIP_HIDE_DELAY = 50; // ms to allow quick re-entry without flicker

    // Mapping of column headers to spec documentation URLs for the info icon
    const INFO_LINKS = {
        'variation type': 'https://amrrules.readthedocs.io/en/genome_summary_report_dev/specification.html#variation-type',
        'evidence code': 'https://amrrules.readthedocs.io/en/genome_summary_report_dev/specification.html#evidence-codes',
        'mutation': 'https://amrrules.readthedocs.io/en/genome_summary_report_dev/specification.html#syntax-for-mutations',
        'evidence grade': 'https://amrrules.readthedocs.io/en/genome_summary_report_dev/specification.html#evidence-grade',
        'evidence limitations': 'https://amrrules.readthedocs.io/en/genome_summary_report_dev/specification.html#evidence-limitations'
    };

    function generateLink(headerKey, value, rowData) {
        let sValue = String(value).trim(); // Trim immediately when converting to string
        
        // Remove "s__" prefix from organism column
        if (headerKey === 'organism' && sValue.startsWith('s__')) {
            sValue = sValue.substring(3);
        }
        
        // Remove surrounding double quotes from rule curation note
        if (headerKey === 'rule curation note') {
            sValue = sValue.replace(/^"|"$/g, '');
        }
        
        if (!sValue || sValue === '-' || sValue.trim() === '') {
            return sValue; // Return original non-values as is
        }
        
        // Handle organism column: create link using txid from row data
        if (headerKey === 'organism' && rowData && rowData.txid) {
            const txidValue = String(rowData.txid).trim();
            if (txidValue && txidValue !== '-') {
                const TXID_URL = 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=';
                return `<a href="${TXID_URL}${encodeURIComponent(txidValue)}" target="_blank">${escapeHtml(sValue)}</a>`;
            }
        }
        
        // Skip linking for txid column
        if (headerKey === 'txid') {
            return escapeHtml(sValue);
        }

        // Handle drug and drug class fields with CARD mappings (using normalized lookups)
        if (headerKey === 'drug') {
            const normalizedDrug = normalizeKey(sValue);
            if (DRUG_ARO_MAP[normalizedDrug]) {
                const aroNumber = DRUG_ARO_MAP[normalizedDrug];
                return `<a href="https://card.mcmaster.ca/aro/${aroNumber}" target="_blank">${escapeHtml(sValue)}</a>`;
            }
        }
        
        if (headerKey === 'drug class') {
            const normalizedClass = normalizeKey(sValue);
            if (CLASS_ARO_MAP[normalizedClass]) {
                const aroNumber = CLASS_ARO_MAP[normalizedClass];
                return `<a href="https://card.mcmaster.ca/aro/${aroNumber}" target="_blank">${escapeHtml(sValue)}</a>`;
            }
        }

        // Handle evidence grade with tooltips
        if (headerKey === 'evidence grade' && EVIDENCE_GRADE_TOOLTIPS[sValue.toLowerCase()]) {
            const tooltip = EVIDENCE_GRADE_TOOLTIPS[sValue.toLowerCase()];
            return `<span title="${escapeHtml(tooltip)}">${escapeHtml(sValue)}</span>`;
        }

        const baseUrl = ACCESSION_URLS[headerKey];
        if (baseUrl) {
            // Special handling for evidence code: extract ECO codes and keep full text as display
            if (headerKey === 'evidence code') {
                // Split by comma or semicolon first, then process each entry
                const ecoEntries = sValue.split(/[,;]/).map(entry => entry.trim().replace(/^"|"$/g, '')).filter(entry => entry);
                
                if (ecoEntries.length > 1) {
                    // Multiple evidence codes
                    return ecoEntries.map(entry => {
                        const ecoMatch = entry.match(/ECO:\d+/);
                        if (ecoMatch) {
                            const ecoCode = ecoMatch[0];
                            return `<a href="${baseUrl}${ecoCode}" target="_blank">${escapeHtml(entry)}</a>`;
                        }
                        return escapeHtml(entry);
                    }).join(', ');
                } else if (ecoEntries.length === 1) {
                    // Single evidence code
                    const entry = ecoEntries[0];
                    const ecoMatch = entry.match(/ECO:\d+/);
                    if (ecoMatch) {
                        const ecoCode = ecoMatch[0];
                        return `<a href="${baseUrl}${ecoCode}" target="_blank">${escapeHtml(entry)}</a>`;
                    }
                    return escapeHtml(entry);
                }
            }
            
            // Modified: Add replace to remove surrounding double quotes from IDs
            const ids = sValue.split(/[,;\s]+/).map(id => id.trim().replace(/^"|"$/g, '')).filter(id => id && id.trim() !== '');

            const buildLinkTag = (displayAndProcessValue) => {
                let suffixPart = displayAndProcessValue.trim(); // Extra trim for safety
                
                if (headerKey === 'ARO accession' && suffixPart.startsWith('ARO:')) {
                    suffixPart = suffixPart.substring(4);
                } else if (headerKey === 'HMM accession' && suffixPart.includes('.')) {
                    suffixPart = suffixPart;
                }

                let urlSuffix;
                if (headerKey === 'evidence code' && suffixPart.startsWith('ECO:')) {
                    urlSuffix = suffixPart; // Use as-is, not encoded, per original implicit logic
                } else {
                    urlSuffix = encodeURIComponent(suffixPart.trim()); // Extra trim before encoding
                    // Ensure colons are not encoded in the final URL suffix
                    urlSuffix = urlSuffix.replace(/%3A/g, ':');
                }

            if (headerKey === 'PMID') {

                }
                // Link text is the original displayAndProcessValue, HTML escaped.
                return `<a href="${baseUrl}${urlSuffix}" target="_blank">${escapeHtml(displayAndProcessValue)}</a>`;
            };

            if (ids.length > 1) { // Multiple distinct IDs found
                return ids.map(id => buildLinkTag(id)).join(', ');
            } else { // Single ID or original sValue if no (or one) ID was parsed
                return buildLinkTag(sValue);
            }
        }
        return escapeHtml(sValue); // Fallback: return value, HTML escaped for safety in table
    }


    function sortAndDisplayData() {
        let dataToDisplay = [...currentDataForDisplayAndDownload];

        if (sortColumnKey && currentHeadersForDisplay.includes(sortColumnKey)) {
            dataToDisplay.sort((a, b) => {
                let valA = String(a[sortColumnKey] || '');
                let valB = String(b[sortColumnKey] || '');

                const numA = parseFloat(valA);
                const numB = parseFloat(valB);

                let compareResult;
                if (!isNaN(numA) && !isNaN(numB) && valA.match(/^[\d.-]+$/) && valB.match(/^[\d.-]+$/)) { // Check if they are purely numeric strings
                    compareResult = numA - numB;
                } else {
                    compareResult = valA.toLowerCase().localeCompare(valB.toLowerCase());
                }

                return sortDirection === 'asc' ? compareResult : -compareResult;
            });
        }
        renderTable(currentHeadersForDisplay, dataToDisplay);
    }
    
    function renderTable(headers, rowsData) {
        searchResultsDiv.innerHTML = '';
        if (!headers || headers.length === 0) {
             if (browseModeRadio.checked && currentDataForDisplayAndDownload.length > 0) {
                searchResultsDiv.innerHTML = '<p>No common headers found for selected data, or headers configuration issue.</p>';
            } else if (!browseModeRadio.checked && currentDataForDisplayAndDownload.length > 0) {
                 searchResultsDiv.innerHTML = '<p>No headers defined for search results.</p>';
            }
            // If no data at all, specific messages are handled by callers.
            return;
        }


        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        // Build colgroup with proportional widths and per-column wrap/no-wrap classes
        const colgroup = document.createElement('colgroup');

        // Heuristic weights for columns (higher = wider)
        const WIDTH_HINTS = {
            'ruleID': 6,
            'txid': 5,
            'organism': 8,
            'gene': 6,
            'nodeID': 5,
            'protein accession': 6,
            'HMM accession': 6,
            'nucleotide accession': 6,
            'ARO accession': 6,
            'mutation': 10,
            'variation type': 6,
            'gene context': 10,
            'drug': 8,
            'drug class': 7,
            'phenotype': 6,
            'clinical category': 6,
            'breakpoint': 5,
            'breakpoint standard': 5,
            'breakpoint condition': 6,
            'PMID': 5,
            'evidence code': 8,
            'evidence grade': 4,
            'evidence description': 12,
            'evidence limitations': 10,
            'rule curation note': 18
        };

        // Columns that should not wrap
        const NOWRAP_COLUMNS = new Set(['ruleID', 'txid', 'PMID', 'evidence grade', 'nodeID', 'protein accession', 'nucleotide accession']);

        // Determine total weight
        let totalWeight = 0;
        const weights = headers.map(h => {
            const w = WIDTH_HINTS[h] || 6;
            totalWeight += w;
            return w;
        });

        headers.forEach((headerKey, idx) => {
            const col = document.createElement('col');
            const pct = Math.max(5, Math.round((weights[idx] / totalWeight) * 100));
            col.style.width = pct + '%';
            if (NOWRAP_COLUMNS.has(headerKey)) col.className = 'col-nowrap';
            else col.className = 'col-wrap';
            // store column key for access when hiding/unhiding
            col.dataset.columnKey = headerKey;
            colgroup.appendChild(col);
        });
        table.appendChild(colgroup);

        headers.forEach(headerKey => {
            const th = document.createElement('th');
            th.textContent = headerKey;
            th.dataset.columnKey = headerKey;

            // Attach tooltip text to the header cell (used by custom tooltip)
            const tooltipText = HEADER_TOOLTIPS[headerKey];
            if (tooltipText) {
                th.dataset.tooltip = tooltipText;
            }

            const arrowSpan = document.createElement('span');
            arrowSpan.classList.add('sort-arrow');
            if (headerKey === sortColumnKey) {
                th.classList.add(sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
                arrowSpan.innerHTML = sortDirection === 'asc' ? ' ↑' : ' ↓';
            }
            th.appendChild(arrowSpan);
            // Apply nowrap/wrap classes to header
            if (NOWRAP_COLUMNS && NOWRAP_COLUMNS.has(headerKey)) th.classList.add('col-nowrap');
            else th.classList.add('col-wrap');
            // attach data-column-key to header for checkbox mapping
            th.dataset.columnKey = headerKey;

            // Add an info icon/link next to the header when applicable
            const infoUrl = INFO_LINKS[headerKey];
            if (infoUrl) {
                const infoLink = document.createElement('a');
                infoLink.href = infoUrl;
                infoLink.target = '_blank';
                infoLink.rel = 'noopener noreferrer';
                infoLink.className = 'info-icon';
                infoLink.title = 'Open specification';
                infoLink.innerHTML = 'i';
                // Prevent header click (sort) when clicking the info icon
                infoLink.addEventListener('click', (ev) => ev.stopPropagation());
                th.appendChild(infoLink);
            }

            // Show custom tooltip when mouse is within the header cell (fast, responsive)
            th.addEventListener('mouseenter', (e) => {
                const tip = th.dataset.tooltip;
                if (!tip) return;
                // Clear any hide timer if re-entering quickly
                if (tooltipHideTimer) {
                    clearTimeout(tooltipHideTimer);
                    tooltipHideTimer = null;
                }
                // Start show timer
                tooltipShowTimer = setTimeout(() => {
                    customTooltip.textContent = tip;
                    customTooltip.classList.add('visible');
                    // Position initially near header bottom
                    const rect = th.getBoundingClientRect();
                    const top = rect.bottom + 8;
                    let left = rect.left + 8;
                    customTooltip.style.top = `${top}px`;
                    customTooltip.style.left = `${left}px`;
                }, TOOLTIP_SHOW_DELAY);
            });
            th.addEventListener('mousemove', (e) => {
                // If tooltip isn't visible yet, do nothing (it will be positioned on show)
                if (!customTooltip.classList.contains('visible')) return;
                const tooltipWidth = customTooltip.offsetWidth || 200;
                let left = e.clientX + 12;
                if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - tooltipWidth - 8;
                customTooltip.style.left = `${left}px`;
                customTooltip.style.top = `${e.clientY + 16}px`;
            });
            th.addEventListener('mouseleave', () => {
                // Cancel pending show
                if (tooltipShowTimer) {
                    clearTimeout(tooltipShowTimer);
                    tooltipShowTimer = null;
                }
                // Start hide timer so small mouse slips don't hide instantly
                tooltipHideTimer = setTimeout(() => {
                    customTooltip.classList.remove('visible');
                    tooltipHideTimer = null;
                }, TOOLTIP_HIDE_DELAY);
            });

            th.addEventListener('click', () => {
                if (sortColumnKey === headerKey) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumnKey = headerKey;
                    sortDirection = 'asc';
                }
                sortAndDisplayData();
            });
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const fragment = document.createDocumentFragment(); // For performance
        if (rowsData.length > 0) {
            rowsData.forEach(rowDataItem => {
                const rowElement = document.createElement('tr');
                headers.forEach(headerKey => {
                    const td = document.createElement('td');
                    const cellValue = rowDataItem[headerKey] === undefined ? '' : rowDataItem[headerKey];
                    td.innerHTML = generateLink(headerKey, cellValue, rowDataItem);

                    // If this is an evidence grade cell, attach the shared custom tooltip to the whole cell
                    if (headerKey === 'evidence grade') {
                        const gradeKey = String(cellValue).toLowerCase().trim();
                        const gradeTooltip = EVIDENCE_GRADE_TOOLTIPS[gradeKey];
                        if (gradeTooltip) {
                            td.dataset.tooltip = gradeTooltip;

                            // Attach mouse handlers to use the shared custom tooltip (same behaviour as headers)
                            td.addEventListener('mouseenter', (e) => {
                                if (tooltipHideTimer) {
                                    clearTimeout(tooltipHideTimer);
                                    tooltipHideTimer = null;
                                }
                                tooltipShowTimer = setTimeout(() => {
                                    customTooltip.textContent = td.dataset.tooltip;
                                    customTooltip.classList.add('visible');
                                    const rect = td.getBoundingClientRect();
                                    const top = rect.bottom + 8;
                                    let left = rect.left + 8;
                                    customTooltip.style.top = `${top}px`;
                                    customTooltip.style.left = `${left}px`;
                                }, TOOLTIP_SHOW_DELAY);
                            });
                            td.addEventListener('mousemove', (e) => {
                                if (!customTooltip.classList.contains('visible')) return;
                                const tooltipWidth = customTooltip.offsetWidth || 200;
                                let left = e.clientX + 12;
                                if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - tooltipWidth - 8;
                                customTooltip.style.left = `${left}px`;
                                customTooltip.style.top = `${e.clientY + 16}px`;
                            });
                            td.addEventListener('mouseleave', () => {
                                if (tooltipShowTimer) {
                                    clearTimeout(tooltipShowTimer);
                                    tooltipShowTimer = null;
                                }
                                tooltipHideTimer = setTimeout(() => {
                                    customTooltip.classList.remove('visible');
                                    tooltipHideTimer = null;
                                }, TOOLTIP_HIDE_DELAY);
                            });
                        }
                    }

                    // mark td with column key for easy show/hide
                    td.dataset.columnKey = headerKey;
                    rowElement.appendChild(td);
                });
                fragment.appendChild(rowElement);
            });
        }
        tbody.appendChild(fragment);
        table.appendChild(tbody);
        searchResultsDiv.appendChild(table);

        // Populate columns panel with checkboxes
        try {
            populateColumnsPanel(headers);
        } catch (e) {
            console.warn('Error populating columns panel', e);
        }

        if (rowsData.length === 0 && browseModeRadio.checked) {
             resultsCountDiv.textContent = `Displaying 0 rows. ${ (browseFileSelect.value !== 'all' && Object.keys(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {}).length > 0) ? 'Selected file might be empty or header-only.' : ''}`;
        } else if (rowsData.length === 0 && searchModeRadio.checked) {
            resultsCountDiv.textContent = "Found 0 match(es)."
            // No specific message here, performSearch handles it
        }

    }

    function toggleDownloadButtons(enable) {
        downloadTsvButton.disabled = !enable;
        downloadCsvButton.disabled = !enable;
    }

    // Column show/hide management
    const COLUMN_PREF_KEY = 'amrrules_hidden_columns_v1';
    const DEFAULT_HIDDEN_COLUMNS = ['txid', 'breakpoint condition', 'ARO accession', 'rule curation note'];

    function getHiddenColumnsFromStorage() {
        try {
            const raw = localStorage.getItem(COLUMN_PREF_KEY);
            if (!raw) return new Set(DEFAULT_HIDDEN_COLUMNS);
            const arr = JSON.parse(raw);
            return new Set(arr);
        } catch (e) {
            return new Set(DEFAULT_HIDDEN_COLUMNS);
        }
    }

    function saveHiddenColumnsToStorage(setOfKeys) {
        try {
            const arr = Array.from(setOfKeys);
            localStorage.setItem(COLUMN_PREF_KEY, JSON.stringify(arr));
        } catch (e) {
            console.warn('Could not save column prefs', e);
        }
    }

    function populateColumnsPanel(headers) {
        const container = document.getElementById('columnsCheckboxes');
        const panel = document.getElementById('columnsPanel');
        const toggle = document.getElementById('columnsToggle');
        if (!container || !panel || !toggle) return;

        // Position panel relative to toggle
        if (!columnsToggleListenerAdded) {
            toggle.addEventListener('click', () => {
                if (panel.style.display === 'none' || panel.style.display === '') panel.style.display = 'block';
                else panel.style.display = 'none';
            });
            columnsToggleListenerAdded = true;
        }

        // Close panel when clicking outside
        document.addEventListener('click', (ev) => {
            if (!panel || !toggle) return;
            if (panel.style.display === 'none') return;
            if (panel.contains(ev.target) || toggle.contains(ev.target)) return;
            panel.style.display = 'none';
        });

        container.innerHTML = '';
        const hiddenSet = getHiddenColumnsFromStorage();

        headers.forEach((h) => {
            const id = 'colchk_' + h.replace(/[^a-z0-9]/gi, '_');
            const label = document.createElement('label');
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.id = id;
            chk.checked = !hiddenSet.has(h);
            chk.dataset.columnKey = h;
            const span = document.createElement('span');
            span.textContent = ' ' + h;
            label.appendChild(chk);
            label.appendChild(span);
            container.appendChild(label);

            chk.addEventListener('change', (e) => {
                const key = e.target.dataset.columnKey;
                if (!key) return;
                if (e.target.checked) hiddenSet.delete(key);
                else hiddenSet.add(key);
                saveHiddenColumnsToStorage(hiddenSet);
                // Apply visibility to current table immediately
                applyColumnVisibility(key, !hiddenSet.has(key));
            });

            // Apply initial visibility
            applyColumnVisibility(h, !hiddenSet.has(h));
        });
    }

    function applyColumnVisibility(columnKey, visible) {
        const table = searchResultsDiv.querySelector('table');
        if (!table) return;
        // find header index
        const thead = table.querySelector('thead');
        if (!thead) return;
        const ths = Array.from(thead.querySelectorAll('th'));
        const idx = ths.findIndex(t => t.dataset && t.dataset.columnKey === columnKey);
        if (idx === -1) return;
        // toggle th
        ths[idx].style.display = visible ? '' : 'none';
        // toggle col
        const col = table.querySelectorAll('col')[idx];
        if (col) col.style.display = visible ? '' : 'none';
        // toggle every td in that column
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        rows.forEach(r => {
            const tds = Array.from(r.querySelectorAll('td'));
            if (tds[idx]) tds[idx].style.display = visible ? '' : 'none';
        });
    }

    function downloadCurrentData(format) {
        if (currentDataForDisplayAndDownload.length === 0) {
            alert("No data to download.");
            return;
        }
        
        const headersForDownload = currentHeadersForDisplay;
        const separator = format === 'tsv' ? '\t' : ',';
        let content = headersForDownload.map(h => (format === 'csv' && h !== 'rule curation note' ? `"${String(h).replace(/"/g, '""')}"` : String(h))).join(separator) + '\n';

        currentDataForDisplayAndDownload.forEach(rowItem => {
            const rowValues = headersForDownload.map(headerKey => {
                let value = rowItem[headerKey] === undefined ? '' : rowItem[headerKey];
                if (format === 'csv' && headerKey !== 'rule curation note') {
                    value = `"${String(value).replace(/"/g, '""')}"`;
                }
                return value;
            });
            content += rowValues.join(separator) + '\n';
        });

        const blob = new Blob([content], { type: `text/${format === 'tsv' ? 'tab-separated-values' : 'csv'};charset=utf-8;` });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `AMRruleBrowser_data.${format}`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
});

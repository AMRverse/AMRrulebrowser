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

    // --- Constants ---
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
        'txid': 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=',
        'PMID': 'https://pubmed.ncbi.nlm.nih.gov/',
        'ARO accession': 'https://card.mcmaster.ca/aro/',
        'evidence code': 'https://evidenceontology.org/term/',
        'nodeID': 'https://www.ncbi.nlm.nih.gov/pathogens/genehierarchy/#',
        'HMM accession': 'https://www.ncbi.nlm.nih.gov/pathogens/hmm/#'
    };
    const HEADER_TOOLTIPS = {
        'ruleID': 'Unique identifier for the rule',
        'txid': 'NCBI taxonomy ID',
        'organism': 'Organism name',
        'gene': 'Gene name',
        'nodeID': 'NCBI node ID',
        'protein accession': 'NCBI protein accession number',
        'HMM accession': 'Hidden Markov Model accession number',
        'nucleotide accession': 'NCBI nucleotide accession number',
        'ARO accession': 'Antibiotic Resistance Ontology accession',
        'mutation': 'Specific mutation',
        'variation type': 'Type of genetic variation',
        'gene context': 'Context information about the gene',
        'drug': 'Drug name',
        'drug class': 'Drug classification',
        'phenotype': 'Observable phenotype',
        'clinical category': 'Clinical significance category',
        'breakpoint': 'MIC breakpoint value',
        'breakpoint standard': 'Standard for breakpoint (e.g., CLSI, EUCAST)',
        'breakpoint condition': 'Condition for breakpoint application',
        'PMID': 'PubMed article ID',
        'evidence code': 'Evidence Ontology code',
        'evidence grade': 'Grade of evidence quality',
        'evidence description': 'Description of the evidence',
        'evidence limitations': 'Limitations of the evidence',
        'rule curation note': 'Curator notes about the rule'
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
        handleModeChange(); // Set initial mode and display (e.g., browse all)
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
        sortColumnKey = ''; // Reset sort when browsing new data
        sortDirection = 'asc';
        sortAndDisplayData(); 
        resultsCountDiv.textContent = `Displaying ${dataToBrowse.length} row(s).`;
        toggleDownloadButtons(dataToBrowse.length > 0);
    }

    function performBrowseSearch() {
        const searchTerm = browseSearchInput.value.trim().toLowerCase();
        
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
    }

    function clearBrowseSearch() {
        browseSearchInput.value = '';
        currentDataForDisplayAndDownload = originalBrowseData;
        sortColumnKey = '';
        sortDirection = 'asc';
        sortAndDisplayData();
        resultsCountDiv.textContent = `Displaying ${originalBrowseData.length} row(s).`;
        toggleDownloadButtons(originalBrowseData.length > 0);
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
        toggleDownloadButtons(matchedRows.length > 0);
        if (matchedRows.length === 0) {
             searchResultsDiv.innerHTML = '<p>No results found.</p>';
        }
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
        fileNames.forEach(name => {
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
            const blockedRuleIDs = ['24566181', 'KOX0008', 'KOX0009'];
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
    customTooltip.style.display = 'none';
    document.body.appendChild(customTooltip);

    // Mapping of column headers to spec documentation URLs for the info icon
    const INFO_LINKS = {
        'variation type': 'https://amrrules.readthedocs.io/en/genome_summary_report_dev/specification.html#variation-type',
        'evidence code': 'https://amrrules.readthedocs.io/en/genome_summary_report_dev/specification.html#evidence-codes',
        'mutation': 'https://amrrules.readthedocs.io/en/genome_summary_report_dev/specification.html#syntax-for-mutations'
    };

    function generateLink(headerKey, value) {
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
                customTooltip.textContent = tip;
                customTooltip.style.display = 'block';
                // Initial position below header
                const rect = th.getBoundingClientRect();
                const top = rect.bottom + 6;
                let left = rect.left + 6;
                customTooltip.style.top = `${top}px`;
                customTooltip.style.left = `${left}px`;
            });
            th.addEventListener('mousemove', (e) => {
                if (customTooltip.style.display === 'none') return;
                const tooltipWidth = customTooltip.offsetWidth || 200;
                let left = e.clientX + 12;
                if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - tooltipWidth - 8;
                customTooltip.style.left = `${left}px`;
                customTooltip.style.top = `${e.clientY + 16}px`;
            });
            th.addEventListener('mouseleave', () => {
                customTooltip.style.display = 'none';
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
                    td.innerHTML = generateLink(headerKey, cellValue);
                    rowElement.appendChild(td);
                });
                fragment.appendChild(rowElement);
            });
        }
        tbody.appendChild(fragment);
        table.appendChild(tbody);
        searchResultsDiv.appendChild(table);

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
        link.setAttribute("download", `amrrules_data.${format}`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
});
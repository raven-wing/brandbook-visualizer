/**
 * Brandbook Data Model and Export Module
 * Handles the brandbook data structure, export, and import
 */

const BrandbookModule = (function() {
    const STORAGE_KEY = 'brandbook-visualizer-data';

    // Current brandbook data
    let currentBrandbook = createEmptyBrandbook();

    /**
     * Create an empty brandbook structure
     * @returns {Object} Empty brandbook object
     */
    function createEmptyBrandbook() {
        return {
            version: '1.0',
            meta: {
                name: 'My Brand',
                created: new Date().toISOString(),
                generator: 'brandbook-visualizer'
            },
            colors: {
                primary: { hex: '#FF5733', name: 'Sunset Orange' },
                secondary: { hex: '#2C3E50', name: 'Midnight Blue' },
                accent: { hex: '#27AE60', name: 'Emerald', optional: true }
            },
            typography: {
                primary: {
                    family: 'Montserrat',
                    source: 'google',
                    weights: [400, 700],
                    usage: 'Headings'
                },
                secondary: {
                    family: 'Open Sans',
                    source: 'google',
                    weights: [400, 600],
                    usage: 'Body text',
                    optional: true
                }
            },
            logo: {
                svg: null,
                png: null,
                usage: 'Primary logo'
            }
        };
    }

    /**
     * Get the current brandbook data
     * @returns {Object} Current brandbook
     */
    function getBrandbook() {
        return currentBrandbook;
    }

    /**
     * Update brand name
     * @param {string} name - Brand name
     */
    function setBrandName(name) {
        currentBrandbook.meta.name = name;
        saveToLocalStorage();
    }

    /**
     * Update a color in the palette
     * @param {string} type - 'primary', 'secondary', or 'accent'
     * @param {string} hex - Hex color value
     * @param {string} name - Color name
     */
    function setColor(type, hex, name) {
        if (currentBrandbook.colors[type]) {
            currentBrandbook.colors[type].hex = hex;
            currentBrandbook.colors[type].name = name;
            saveToLocalStorage();
        }
    }

    /**
     * Update typography settings
     * @param {string} type - 'primary' or 'secondary'
     * @param {string} family - Font family name
     * @param {string} usage - Usage description
     */
    function setTypography(type, family, usage) {
        if (currentBrandbook.typography[type]) {
            currentBrandbook.typography[type].family = family;
            currentBrandbook.typography[type].usage = usage;
            saveToLocalStorage();
        }
    }

    /**
     * Set logo from file
     * @param {File} file - Logo file (SVG or PNG)
     * @returns {Promise<string>} Base64 data URL
     */
    function setLogo(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const isSvg = file.type === 'image/svg+xml';

                if (isSvg) {
                    currentBrandbook.logo.svg = dataUrl;
                    currentBrandbook.logo.png = null;
                } else {
                    currentBrandbook.logo.png = dataUrl;
                    currentBrandbook.logo.svg = null;
                }

                saveToLocalStorage();
                resolve(dataUrl);
            };

            reader.onerror = () => {
                reject(new Error('Failed to read logo file'));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Clear the logo
     */
    function clearLogo() {
        currentBrandbook.logo.svg = null;
        currentBrandbook.logo.png = null;
        saveToLocalStorage();
    }

    /**
     * Get the logo data URL (SVG or PNG)
     * @returns {string|null} Logo data URL or null
     */
    function getLogoUrl() {
        return currentBrandbook.logo.svg || currentBrandbook.logo.png || null;
    }

    /**
     * Export brandbook as JSON string
     * @returns {string} JSON string
     */
    function exportToJson() {
        currentBrandbook.meta.created = new Date().toISOString();
        return JSON.stringify(currentBrandbook, null, 2);
    }

    /**
     * Download brandbook as .brandbook file
     */
    function downloadBrandbook() {
        const json = exportToJson();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentBrandbook.meta.name.toLowerCase().replace(/\s+/g, '-')}.brandbook`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Import brandbook from JSON file
     * @param {File} file - JSON file
     * @returns {Promise<Object>} Imported brandbook data
     */
    function importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Validate structure
                    if (!data.version || !data.meta || !data.colors || !data.typography) {
                        throw new Error('Invalid brandbook format');
                    }

                    // Merge with defaults to ensure all fields exist
                    currentBrandbook = {
                        ...createEmptyBrandbook(),
                        ...data,
                        meta: { ...createEmptyBrandbook().meta, ...data.meta },
                        colors: { ...createEmptyBrandbook().colors, ...data.colors },
                        typography: { ...createEmptyBrandbook().typography, ...data.typography },
                        logo: { ...createEmptyBrandbook().logo, ...data.logo }
                    };

                    resolve(currentBrandbook);
                } catch (error) {
                    reject(new Error('Failed to parse brandbook file: ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Reset brandbook to defaults
     */
    function reset() {
        currentBrandbook = createEmptyBrandbook();
        saveToLocalStorage();
    }

    /**
     * Save current brandbook to localStorage
     */
    function saveToLocalStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentBrandbook));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    /**
     * Load brandbook from localStorage
     * @returns {boolean} True if data was loaded
     */
    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                // Merge with defaults to ensure all fields exist
                currentBrandbook = {
                    ...createEmptyBrandbook(),
                    ...data,
                    meta: { ...createEmptyBrandbook().meta, ...data.meta },
                    colors: { ...createEmptyBrandbook().colors, ...data.colors },
                    typography: { ...createEmptyBrandbook().typography, ...data.typography },
                    logo: { ...createEmptyBrandbook().logo, ...data.logo }
                };
                return true;
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
        return false;
    }

    /**
     * Clear localStorage data
     */
    function clearLocalStorage() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('Could not clear localStorage:', e);
        }
    }

    /**
     * Check if there's saved data in localStorage
     * @returns {boolean}
     */
    function hasSavedData() {
        try {
            return localStorage.getItem(STORAGE_KEY) !== null;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get color contrast (light or dark) for text on given background
     * @param {string} hexColor - Background color
     * @returns {string} 'light' or 'dark'
     */
    function getContrastColor(hexColor) {
        // Remove # if present
        const hex = hexColor.replace('#', '');

        // Convert to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    /**
     * Get brandbook data for QR code (without logo to keep size small)
     * @returns {Object} Brandbook data without logo
     */
    function getShareableData() {
        return {
            version: currentBrandbook.version,
            meta: {
                name: currentBrandbook.meta.name,
                generator: currentBrandbook.meta.generator
            },
            colors: currentBrandbook.colors,
            typography: currentBrandbook.typography
        };
    }

    /**
     * Generate a shareable URL with brandbook data encoded
     * @param {string} baseUrl - Base URL of the app (e.g., https://username.github.io/brandbook-visualizer/)
     * @returns {string} Full URL with encoded brandbook data
     */
    function generateShareUrl(baseUrl) {
        const data = getShareableData();
        const jsonString = JSON.stringify(data);
        // Use base64 encoding for URL safety
        const encoded = btoa(unescape(encodeURIComponent(jsonString)));
        // Remove trailing = padding to save space
        const compactEncoded = encoded.replace(/=+$/, '');
        return `${baseUrl}?data=${compactEncoded}`;
    }

    /**
     * Import brandbook data from URL parameter
     * @param {string} encodedData - Base64 encoded JSON data from URL
     * @returns {Object|null} Imported brandbook data or null if invalid
     */
    function importFromUrlData(encodedData) {
        try {
            // Add back padding if needed
            const padded = encodedData + '='.repeat((4 - encodedData.length % 4) % 4);
            const jsonString = decodeURIComponent(escape(atob(padded)));
            const data = JSON.parse(jsonString);

            // Validate structure
            if (!data.version || !data.meta || !data.colors || !data.typography) {
                throw new Error('Invalid brandbook format');
            }

            // Merge with defaults to ensure all fields exist
            currentBrandbook = {
                ...createEmptyBrandbook(),
                ...data,
                meta: { ...createEmptyBrandbook().meta, ...data.meta },
                colors: { ...createEmptyBrandbook().colors, ...data.colors },
                typography: { ...createEmptyBrandbook().typography, ...data.typography },
                // Keep logo empty since it's not in shareable data
                logo: createEmptyBrandbook().logo
            };

            saveToLocalStorage();
            return currentBrandbook;
        } catch (e) {
            console.error('Failed to import from URL data:', e);
            return null;
        }
    }

    /**
     * Get the current page base URL (for generating share URLs)
     * @returns {string} Base URL without query parameters
     */
    function getBaseUrl() {
        return window.location.origin + window.location.pathname;
    }

    return {
        createEmptyBrandbook,
        getBrandbook,
        setBrandName,
        setColor,
        setTypography,
        setLogo,
        clearLogo,
        getLogoUrl,
        exportToJson,
        downloadBrandbook,
        importFromFile,
        reset,
        getContrastColor,
        saveToLocalStorage,
        loadFromLocalStorage,
        clearLocalStorage,
        hasSavedData,
        getShareableData,
        generateShareUrl,
        importFromUrlData,
        getBaseUrl
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.BrandbookModule = BrandbookModule;
}

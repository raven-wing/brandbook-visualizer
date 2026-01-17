/**
 * Google Fonts Integration Module
 * Handles font loading and selection
 */

const FontsModule = (function() {
    // Popular Google Fonts list (curated selection)
    const POPULAR_FONTS = [
        'Roboto',
        'Open Sans',
        'Lato',
        'Montserrat',
        'Poppins',
        'Oswald',
        'Source Sans Pro',
        'Raleway',
        'PT Sans',
        'Merriweather',
        'Ubuntu',
        'Playfair Display',
        'Nunito',
        'Roboto Condensed',
        'Roboto Slab',
        'Noto Sans',
        'Fira Sans',
        'Work Sans',
        'Quicksand',
        'Rubik',
        'Lora',
        'Inter',
        'Mulish',
        'Nunito Sans',
        'Barlow',
        'Heebo',
        'DM Sans',
        'Manrope',
        'Karla',
        'Josefin Sans',
        'Cabin',
        'Libre Baskerville',
        'Arimo',
        'Dosis',
        'Libre Franklin',
        'Bitter',
        'Inconsolata',
        'Source Code Pro',
        'IBM Plex Sans',
        'IBM Plex Serif',
        'Crimson Text',
        'Exo 2',
        'Assistant',
        'Maven Pro',
        'Overpass',
        'Archivo',
        'Space Grotesk',
        'Outfit',
        'Plus Jakarta Sans',
        'Red Hat Display'
    ];

    // Track loaded fonts to avoid duplicate loading
    const loadedFonts = new Set();

    /**
     * Get the list of available fonts
     * @returns {string[]} Array of font names
     */
    function getFontList() {
        return [...POPULAR_FONTS].sort();
    }

    /**
     * Load a Google Font dynamically
     * @param {string} fontFamily - The font family name
     * @param {number[]} weights - Array of font weights to load
     * @returns {Promise} Resolves when font is loaded
     */
    function loadFont(fontFamily, weights = [400, 700]) {
        if (loadedFonts.has(fontFamily)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const weightString = weights.join(';');
            const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weightString}&display=swap`;

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = fontUrl;

            link.onload = () => {
                loadedFonts.add(fontFamily);
                resolve();
            };

            link.onerror = () => {
                reject(new Error(`Failed to load font: ${fontFamily}`));
            };

            document.head.appendChild(link);
        });
    }

    /**
     * Populate a select element with font options
     * @param {HTMLSelectElement} selectElement - The select element to populate
     * @param {string} selectedFont - The currently selected font
     */
    function populateFontSelect(selectElement, selectedFont = 'Montserrat') {
        const fonts = getFontList();
        selectElement.innerHTML = '';

        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            if (font === selectedFont) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }

    /**
     * Filter font options based on search query
     * @param {HTMLSelectElement} selectElement - The select element to filter
     * @param {string} query - Search query
     * @param {string} currentValue - Currently selected value
     */
    function filterFonts(selectElement, query, currentValue) {
        const fonts = getFontList();
        const filtered = query
            ? fonts.filter(f => f.toLowerCase().includes(query.toLowerCase()))
            : fonts;

        selectElement.innerHTML = '';

        filtered.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            if (font === currentValue) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }

    /**
     * Initialize font picker with search functionality
     * @param {HTMLInputElement} searchInput - Search input element
     * @param {HTMLSelectElement} selectElement - Select element
     * @param {HTMLElement} previewElement - Preview element
     * @param {string} defaultFont - Default font to select
     * @param {function} onChange - Callback when font changes
     */
    function initFontPicker(searchInput, selectElement, previewElement, defaultFont, onChange) {
        // Populate initial list
        populateFontSelect(selectElement, defaultFont);

        // Load default font
        loadFont(defaultFont).then(() => {
            if (previewElement) {
                previewElement.style.fontFamily = `'${defaultFont}', sans-serif`;
            }
        });

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            filterFonts(selectElement, e.target.value, selectElement.value);
        });

        // Selection change
        selectElement.addEventListener('change', async (e) => {
            const fontFamily = e.target.value;

            try {
                await loadFont(fontFamily);

                if (previewElement) {
                    previewElement.style.fontFamily = `'${fontFamily}', sans-serif`;
                }

                if (onChange) {
                    onChange(fontFamily);
                }
            } catch (error) {
                console.error('Failed to load font:', error);
            }
        });
    }

    /**
     * Get font CSS URL for embedding
     * @param {string} fontFamily - Font family name
     * @param {number[]} weights - Weights to include
     * @returns {string} CSS URL
     */
    function getFontCssUrl(fontFamily, weights = [400, 700]) {
        const weightString = weights.join(';');
        return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weightString}&display=swap`;
    }

    return {
        getFontList,
        loadFont,
        populateFontSelect,
        filterFonts,
        initFontPicker,
        getFontCssUrl
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.FontsModule = FontsModule;
}

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
     * Populate a custom dropdown with font options
     * @param {HTMLElement} dropdownElement - The dropdown container element
     * @param {string} selectedFont - The currently selected font
     * @param {string} filterQuery - Optional filter query
     */
    function populateFontDropdown(dropdownElement, selectedFont = 'Montserrat', filterQuery = '') {
        const fonts = getFontList();
        const menu = dropdownElement.querySelector('.font-dropdown-menu');
        const filtered = filterQuery
            ? fonts.filter(f => f.toLowerCase().includes(filterQuery.toLowerCase()))
            : fonts;

        menu.innerHTML = '';

        filtered.forEach(font => {
            const item = document.createElement('div');
            item.className = 'font-dropdown-item';
            item.setAttribute('role', 'option');
            item.setAttribute('data-value', font);
            item.textContent = font;
            if (font === selectedFont) {
                item.classList.add('selected');
                item.setAttribute('aria-selected', 'true');
            }
            menu.appendChild(item);
        });
    }

    /**
     * Get the current value of a custom dropdown
     * @param {HTMLElement} dropdownElement - The dropdown container
     * @returns {string} The selected value
     */
    function getDropdownValue(dropdownElement) {
        return dropdownElement.getAttribute('data-value') || '';
    }

    /**
     * Set the value of a custom dropdown
     * @param {HTMLElement} dropdownElement - The dropdown container
     * @param {string} value - The value to set
     */
    function setDropdownValue(dropdownElement, value) {
        dropdownElement.setAttribute('data-value', value);
        const toggle = dropdownElement.querySelector('.font-dropdown-toggle');
        if (toggle) {
            toggle.textContent = value;
        }
        // Update selected state in menu
        const items = dropdownElement.querySelectorAll('.font-dropdown-item');
        items.forEach(item => {
            if (item.getAttribute('data-value') === value) {
                item.classList.add('selected');
                item.setAttribute('aria-selected', 'true');
            } else {
                item.classList.remove('selected');
                item.removeAttribute('aria-selected');
            }
        });
    }

    /**
     * Initialize font picker with search functionality (custom dropdown version)
     * @param {HTMLInputElement} searchInput - Search input element
     * @param {HTMLElement} dropdownElement - Custom dropdown element
     * @param {HTMLElement} previewElement - Preview element
     * @param {string} defaultFont - Default font to select
     * @param {function} onChange - Callback when font changes
     */
    function initFontPicker(searchInput, dropdownElement, previewElement, defaultFont, onChange) {
        const toggle = dropdownElement.querySelector('.font-dropdown-toggle');
        const menu = dropdownElement.querySelector('.font-dropdown-menu');

        // Populate initial list
        populateFontDropdown(dropdownElement, defaultFont);
        setDropdownValue(dropdownElement, defaultFont);

        // Load default font
        loadFont(defaultFont).then(() => {
            if (previewElement) {
                previewElement.style.fontFamily = `'${defaultFont}', sans-serif`;
            }
        });

        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdownElement.classList.contains('open');

            // Close all other dropdowns
            document.querySelectorAll('.font-dropdown.open').forEach(d => {
                d.classList.remove('open');
                d.querySelector('.font-dropdown-toggle').setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                dropdownElement.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdownElement.contains(e.target)) {
                dropdownElement.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Handle item selection
        menu.addEventListener('click', async (e) => {
            const item = e.target.closest('.font-dropdown-item');
            if (!item) return;

            const fontFamily = item.getAttribute('data-value');
            setDropdownValue(dropdownElement, fontFamily);
            dropdownElement.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            searchInput.value = '';
            populateFontDropdown(dropdownElement, fontFamily);

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

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const currentValue = getDropdownValue(dropdownElement);
            populateFontDropdown(dropdownElement, currentValue, e.target.value);
            if (!dropdownElement.classList.contains('open')) {
                dropdownElement.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
            }
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const items = menu.querySelectorAll('.font-dropdown-item');
                const highlighted = menu.querySelector('.font-dropdown-item.highlighted');
                let index = Array.from(items).indexOf(highlighted);

                if (e.key === 'ArrowDown') {
                    index = index < items.length - 1 ? index + 1 : 0;
                } else {
                    index = index > 0 ? index - 1 : items.length - 1;
                }

                items.forEach(i => i.classList.remove('highlighted'));
                if (items[index]) {
                    items[index].classList.add('highlighted');
                    items[index].scrollIntoView({ block: 'nearest' });
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const highlighted = menu.querySelector('.font-dropdown-item.highlighted');
                if (highlighted) {
                    highlighted.click();
                }
            } else if (e.key === 'Escape') {
                dropdownElement.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
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
        populateFontDropdown,
        initFontPicker,
        getFontCssUrl,
        getDropdownValue,
        setDropdownValue
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.FontsModule = FontsModule;
}

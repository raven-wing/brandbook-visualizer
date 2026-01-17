/**
 * Main Application Module
 * Handles initialization and event binding
 */

(function() {
    'use strict';

    // DOM Elements
    const elements = {
        // Brand name
        brandName: document.getElementById('brand-name'),

        // Colors
        colorPrimary: document.getElementById('color-primary'),
        colorPrimaryHex: document.getElementById('color-primary-hex'),
        colorPrimaryName: document.getElementById('color-primary-name'),

        colorSecondary: document.getElementById('color-secondary'),
        colorSecondaryHex: document.getElementById('color-secondary-hex'),
        colorSecondaryName: document.getElementById('color-secondary-name'),

        colorAccent: document.getElementById('color-accent'),
        colorAccentHex: document.getElementById('color-accent-hex'),
        colorAccentName: document.getElementById('color-accent-name'),

        // Fonts
        fontPrimarySearch: document.getElementById('font-primary-search'),
        fontPrimary: document.getElementById('font-primary-dropdown'),
        fontPrimaryPreview: document.getElementById('font-primary-preview'),
        fontPrimaryUsage: document.getElementById('font-primary-usage'),

        fontSecondarySearch: document.getElementById('font-secondary-search'),
        fontSecondary: document.getElementById('font-secondary-dropdown'),
        fontSecondaryPreview: document.getElementById('font-secondary-preview'),
        fontSecondaryUsage: document.getElementById('font-secondary-usage'),

        // Logo
        logoDropzone: document.getElementById('logo-dropzone'),
        logoInput: document.getElementById('logo-input'),
        logoPreviewContainer: document.getElementById('logo-preview-container'),
        logoPreview: document.getElementById('logo-preview'),
        logoRemove: document.getElementById('logo-remove'),

        // Buttons
        btnExportJson: document.getElementById('btn-export-json'),
        btnExportPdf: document.getElementById('btn-export-pdf'),
        btnImport: document.getElementById('btn-import'),
        importInput: document.getElementById('import-input'),
        btnShareLink: document.getElementById('btn-share-link'),

        // Share Modal
        shareModal: document.getElementById('share-modal'),
        shareModalClose: document.getElementById('share-modal-close'),
        shareLinkInput: document.getElementById('share-link-input'),
        btnCopyLink: document.getElementById('btn-copy-link'),
        copyFeedback: document.getElementById('copy-feedback')
    };

    /**
     * Initialize the application
     */
    async function init() {
        // Initialize font pickers
        initFontPickers();

        // Initialize mockup tabs
        MockupsModule.initTabs();

        // Bind event listeners
        bindEvents();

        // Check for URL parameter data (from QR code scan)
        const urlData = checkUrlForData();
        if (urlData) {
            // Import from URL data
            const brandbook = BrandbookModule.importFromUrlData(urlData);
            if (brandbook) {
                await updateUIFromBrandbook(brandbook);
                showToast('Brandbook imported from QR code!', 'success');
                // Clean up URL (remove data parameter)
                cleanupUrl();
                // Initial mockup update
                MockupsModule.updateAll();
                return;
            }
        }

        // Try to load saved data from localStorage
        const hasSaved = BrandbookModule.loadFromLocalStorage();

        if (hasSaved) {
            // Restore UI from saved data
            const brandbook = BrandbookModule.getBrandbook();
            await updateUIFromBrandbook(brandbook);
            showToast('Previous session restored', 'success');
        } else {
            // Load default fonts and sample logo
            await loadDefaultFonts();
            await loadSampleLogo();
        }

        // Initial mockup update
        MockupsModule.updateAll();
    }

    /**
     * Check URL for brandbook data parameter (from QR code)
     * @returns {string|null} Encoded data or null
     */
    function checkUrlForData() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('data');
    }

    /**
     * Remove data parameter from URL without page reload
     */
    function cleanupUrl() {
        const url = new URL(window.location);
        url.searchParams.delete('data');
        window.history.replaceState({}, document.title, url.pathname);
    }

    /**
     * Load sample logo for live preview
     */
    async function loadSampleLogo() {
        try {
            const response = await fetch('assets/sample-logo.svg');
            const svgText = await response.text();
            const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgText);

            // Set in brandbook
            const brandbook = BrandbookModule.getBrandbook();
            brandbook.logo.svg = dataUrl;

            // Show preview
            elements.logoPreview.src = dataUrl;
            elements.logoDropzone.style.display = 'none';
            elements.logoPreviewContainer.style.display = 'block';

            // Update mockups
            MockupsModule.updateAll();
        } catch (e) {
            console.warn('Could not load sample logo:', e);
        }
    }

    /**
     * Initialize font picker components
     */
    function initFontPickers() {
        // Re-query font dropdown elements to ensure DOM is ready
        const fontPrimaryDropdown = document.getElementById('font-primary-dropdown');
        const fontSecondaryDropdown = document.getElementById('font-secondary-dropdown');

        // Primary font picker
        FontsModule.initFontPicker(
            elements.fontPrimarySearch,
            fontPrimaryDropdown,
            elements.fontPrimaryPreview,
            'Montserrat',
            (fontFamily) => {
                BrandbookModule.setTypography('primary', fontFamily, elements.fontPrimaryUsage.value);
                MockupsModule.updateAll();
            }
        );

        // Secondary font picker
        FontsModule.initFontPicker(
            elements.fontSecondarySearch,
            fontSecondaryDropdown,
            elements.fontSecondaryPreview,
            'Open Sans',
            (fontFamily) => {
                BrandbookModule.setTypography('secondary', fontFamily, elements.fontSecondaryUsage.value);
                MockupsModule.updateAll();
            }
        );
    }

    /**
     * Load default fonts
     */
    async function loadDefaultFonts() {
        try {
            await FontsModule.loadFont('Montserrat', [400, 700]);
            await FontsModule.loadFont('Open Sans', [400, 600]);
        } catch (e) {
            console.warn('Failed to load default fonts:', e);
        }
    }

    /**
     * Bind all event listeners
     */
    function bindEvents() {
        // Brand name
        elements.brandName.addEventListener('input', handleBrandNameChange);

        // Color inputs
        bindColorInputs('primary');
        bindColorInputs('secondary');
        bindColorInputs('accent');

        // Font usage inputs
        elements.fontPrimaryUsage.addEventListener('input', () => {
            const brandbook = BrandbookModule.getBrandbook();
            BrandbookModule.setTypography('primary', brandbook.typography.primary.family, elements.fontPrimaryUsage.value);
        });

        elements.fontSecondaryUsage.addEventListener('input', () => {
            const brandbook = BrandbookModule.getBrandbook();
            BrandbookModule.setTypography('secondary', brandbook.typography.secondary.family, elements.fontSecondaryUsage.value);
        });

        // Logo upload
        elements.logoDropzone.addEventListener('click', () => elements.logoInput.click());
        elements.logoDropzone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                elements.logoInput.click();
            }
        });
        elements.logoDropzone.addEventListener('dragover', handleDragOver);
        elements.logoDropzone.addEventListener('dragleave', handleDragLeave);
        elements.logoDropzone.addEventListener('drop', handleLogoDrop);
        elements.logoInput.addEventListener('change', handleLogoSelect);

        // Remove button - stop propagation so container click doesn't fire
        elements.logoRemove.addEventListener('click', (e) => {
            e.stopPropagation();
            handleLogoRemove();
        });

        // Click on logo preview to change logo
        elements.logoPreviewContainer.addEventListener('click', () => {
            elements.logoInput.click();
        });
        elements.logoPreviewContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                elements.logoInput.click();
            }
        });

        // Export/Import buttons
        elements.btnExportJson.addEventListener('click', handleExportJson);
        elements.btnExportPdf.addEventListener('click', handleExportPdf);
        elements.btnImport.addEventListener('click', () => elements.importInput.click());
        elements.importInput.addEventListener('change', handleImport);

        // Share link button and modal
        elements.btnShareLink.addEventListener('click', handleShareLink);
        elements.shareModalClose.addEventListener('click', closeShareModal);
        elements.shareModal.querySelector('.modal-backdrop').addEventListener('click', closeShareModal);
        elements.btnCopyLink.addEventListener('click', handleCopyLink);

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.shareModal.style.display !== 'none') {
                closeShareModal();
            }
        });
    }

    function getColorElements(type) {
        const key = capitalize(type);
        return {
            colorInput: elements[`color${key}`],
            hexInput: elements[`color${key}Hex`],
            nameInput: elements[`color${key}Name`]
        };
    }

    function bindColorInputs(type) {
        const { colorInput, hexInput, nameInput } = getColorElements(type);

        // Color picker change
        colorInput.addEventListener('input', (e) => {
            hexInput.value = e.target.value.toUpperCase();
            hexInput.classList.remove('error');
            hexInput.classList.add('valid');
            updateColor(type);
        });

        // Hex input change with validation
        hexInput.addEventListener('input', (e) => {
            let value = e.target.value.trim();

            // Auto-add # if missing
            if (value && !value.startsWith('#')) {
                value = '#' + value;
                hexInput.value = value;
            }

            // Validate hex format
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                hexInput.classList.remove('error');
                hexInput.classList.add('valid');
                colorInput.value = value;
                updateColor(type);
            } else if (value.length > 0) {
                hexInput.classList.remove('valid');
                hexInput.classList.add('error');
            } else {
                hexInput.classList.remove('valid', 'error');
            }
        });

        // Validate on blur
        hexInput.addEventListener('blur', (e) => {
            const value = e.target.value.trim();
            if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
                showToast(`Invalid hex color: ${value}`, 'error');
            }
        });

        // Name input change
        nameInput.addEventListener('input', () => {
            updateColor(type);
        });
    }

    function updateColor(type) {
        const { hexInput, nameInput } = getColorElements(type);
        BrandbookModule.setColor(type, hexInput.value, nameInput.value);
        MockupsModule.updateAll();
    }

    /**
     * Handle brand name change
     */
    function handleBrandNameChange(e) {
        const value = e.target.value.trim();

        if (value.length === 0) {
            e.target.classList.add('error');
        } else {
            e.target.classList.remove('error');
            BrandbookModule.setBrandName(value);
            MockupsModule.updateAll();
        }
    }

    /**
     * Handle drag over on dropzone
     */
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.logoDropzone.classList.add('dragover');
    }

    /**
     * Handle drag leave on dropzone
     */
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.logoDropzone.classList.remove('dragover');
    }

    /**
     * Handle logo drop
     */
    async function handleLogoDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.logoDropzone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await processLogoFile(files[0]);
        }
    }

    /**
     * Handle logo file selection
     */
    async function handleLogoSelect(e) {
        if (e.target.files.length > 0) {
            await processLogoFile(e.target.files[0]);
        }
    }

    /**
     * Process logo file
     */
    async function processLogoFile(file) {
        // Validate file type
        const validTypes = ['image/svg+xml', 'image/png'];
        if (!validTypes.includes(file.type)) {
            showToast('Please upload an SVG or PNG file', 'error');
            return;
        }

        try {
            const dataUrl = await BrandbookModule.setLogo(file);

            // Show preview
            elements.logoPreview.src = dataUrl;
            elements.logoDropzone.style.display = 'none';
            elements.logoPreviewContainer.style.display = 'block';

            // Update mockups
            MockupsModule.updateAll();

            showToast('Logo uploaded successfully', 'success');
        } catch (error) {
            showToast('Failed to upload logo', 'error');
            console.error(error);
        }
    }

    /**
     * Handle logo remove
     */
    function handleLogoRemove() {
        BrandbookModule.clearLogo();

        elements.logoPreview.src = '';
        elements.logoDropzone.style.display = 'block';
        elements.logoPreviewContainer.style.display = 'none';
        elements.logoInput.value = '';

        MockupsModule.updateAll();
    }

    /**
     * Handle JSON export
     */
    function handleExportJson() {
        BrandbookModule.downloadBrandbook();
        showToast('Brandbook downloaded', 'success');
    }

    async function handleExportPdf() {
        const btn = elements.btnExportPdf;
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = 'Generating PDF...';

        try {
            await PdfModule.generatePdf();
            showToast('PDF downloaded', 'success');
        } catch (error) {
            showToast('Failed to generate PDF', 'error');
            console.error(error);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }

    /**
     * Handle brandbook import
     */
    async function handleImport(e) {
        if (e.target.files.length === 0) return;

        const file = e.target.files[0];

        try {
            const brandbook = await BrandbookModule.importFromFile(file);

            // Update UI with imported data
            updateUIFromBrandbook(brandbook);

            // Update mockups
            MockupsModule.updateAll();

            showToast('Brandbook imported successfully', 'success');
        } catch (error) {
            showToast('Failed to import brandbook: ' + error.message, 'error');
            console.error(error);
        }

        // Reset file input
        e.target.value = '';
    }

    /**
     * Handle share link button click
     */
    function handleShareLink() {
        // Generate share URL
        const baseUrl = BrandbookModule.getBaseUrl();
        const shareUrl = BrandbookModule.generateShareUrl(baseUrl);

        // Set the URL in the input
        elements.shareLinkInput.value = shareUrl;

        // Hide any previous feedback
        elements.copyFeedback.style.display = 'none';

        // Show modal
        elements.shareModal.style.display = 'flex';

        // Focus and select the input
        setTimeout(() => {
            elements.shareLinkInput.focus();
            elements.shareLinkInput.select();
        }, 100);
    }

    /**
     * Close share modal
     */
    function closeShareModal() {
        elements.shareModal.style.display = 'none';
        elements.copyFeedback.style.display = 'none';
    }

    /**
     * Handle copy link button click
     */
    async function handleCopyLink() {
        const url = elements.shareLinkInput.value;

        try {
            await navigator.clipboard.writeText(url);
            elements.copyFeedback.style.display = 'block';

            // Hide feedback after 3 seconds
            setTimeout(() => {
                elements.copyFeedback.style.display = 'none';
            }, 3000);
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            elements.shareLinkInput.select();
            document.execCommand('copy');
            elements.copyFeedback.style.display = 'block';

            setTimeout(() => {
                elements.copyFeedback.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Update UI elements from brandbook data
     */
    async function updateUIFromBrandbook(brandbook) {
        // Brand name
        elements.brandName.value = brandbook.meta.name;

        // Colors
        updateColorUI('primary', brandbook.colors.primary);
        updateColorUI('secondary', brandbook.colors.secondary);
        if (brandbook.colors.accent) {
            updateColorUI('accent', brandbook.colors.accent);
        }

        // Typography
        await updateFontUI('primary', brandbook.typography.primary);
        if (brandbook.typography.secondary) {
            await updateFontUI('secondary', brandbook.typography.secondary);
        }

        // Logo
        const logoUrl = BrandbookModule.getLogoUrl();
        if (logoUrl) {
            elements.logoPreview.src = logoUrl;
            elements.logoDropzone.style.display = 'none';
            elements.logoPreviewContainer.style.display = 'block';
        } else {
            elements.logoDropzone.style.display = 'block';
            elements.logoPreviewContainer.style.display = 'none';
        }
    }

    function updateColorUI(type, color) {
        const { colorInput, hexInput, nameInput } = getColorElements(type);
        colorInput.value = color.hex;
        hexInput.value = color.hex.toUpperCase();
        nameInput.value = color.name || '';
    }

    /**
     * Update font UI elements
     */
    async function updateFontUI(type, typography) {
        const searchInput = elements[`font${capitalize(type)}Search`];
        const dropdownElement = document.getElementById(`font-${type}-dropdown`);
        const previewInput = elements[`font${capitalize(type)}Preview`];
        const usageInput = elements[`font${capitalize(type)}Usage`];

        searchInput.value = '';
        FontsModule.setDropdownValue(dropdownElement, typography.family);
        FontsModule.populateFontDropdown(dropdownElement, typography.family);
        usageInput.value = typography.usage || '';

        try {
            await FontsModule.loadFont(typography.family);
            previewInput.style.fontFamily = `'${typography.family}', sans-serif`;
        } catch (e) {
            console.warn('Failed to load font:', e);
        }
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Capitalize first letter
     */
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

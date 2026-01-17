/**
 * PDF Generation Module - Modern Design
 * Creates professional brandbook PDFs
 */

const PdfModule = (function() {
    // PDF dimensions (A4 in mm)
    const PAGE_WIDTH = 210;
    const PAGE_HEIGHT = 297;
    const MARGIN = 25;
    const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

    /**
     * Generate and download PDF brandbook
     */
    async function generatePdf() {
        const brandbook = BrandbookModule.getBrandbook();
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true  // Enable compression for smaller file size
        });

        // Title page
        await addTitlePage(pdf, brandbook);

        // Color palette page
        pdf.addPage();
        addColorPalettePage(pdf, brandbook);

        // Typography page
        pdf.addPage();
        addTypographyPage(pdf, brandbook);

        // Logo guidelines page
        if (BrandbookModule.getLogoUrl()) {
            pdf.addPage();
            await addLogoPage(pdf, brandbook);
        }

        // Mockups pages
        await addMockupPages(pdf, brandbook);

        // Download PDF
        const fileName = `${brandbook.meta.name.toLowerCase().replace(/\s+/g, '-')}-brandbook.pdf`;
        pdf.save(fileName);
    }

    /**
     * Add modern title page
     */
    async function addTitlePage(pdf, brandbook) {
        const primaryColor = hexToRgb(brandbook.colors.primary.hex);
        const secondaryColor = hexToRgb(brandbook.colors.secondary.hex);

        // Dark background
        pdf.setFillColor(15, 15, 26);
        pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

        // Gradient accent bar at top
        const gradientSteps = 50;
        for (let i = 0; i < gradientSteps; i++) {
            const ratio = i / gradientSteps;
            const r = Math.round(primaryColor.r + (secondaryColor.r - primaryColor.r) * ratio);
            const g = Math.round(primaryColor.g + (secondaryColor.g - primaryColor.g) * ratio);
            const b = Math.round(primaryColor.b + (secondaryColor.b - primaryColor.b) * ratio);
            pdf.setFillColor(r, g, b);
            pdf.rect(i * (PAGE_WIDTH / gradientSteps), 0, PAGE_WIDTH / gradientSteps + 1, 8, 'F');
        }

        // Logo centered
        const logoUrl = BrandbookModule.getLogoUrl();
        if (logoUrl) {
            try {
                await addImageToPdf(pdf, logoUrl, PAGE_WIDTH / 2 - 30, 80, 60, 60);
            } catch (e) {
                console.warn('Could not add logo to PDF:', e);
            }
        }

        // Brand name - large, centered
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(42);
        pdf.setFont('helvetica', 'bold');
        const brandNameY = logoUrl ? 165 : 120;
        pdf.text(brandbook.meta.name, PAGE_WIDTH / 2, brandNameY, { align: 'center' });

        // Subtitle
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(255, 255, 255, 0.6);
        pdf.text('Brand Guidelines', PAGE_WIDTH / 2, brandNameY + 15, { align: 'center' });

        // Decorative line
        pdf.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
        pdf.setLineWidth(0.5);
        pdf.line(PAGE_WIDTH / 2 - 30, brandNameY + 25, PAGE_WIDTH / 2 + 30, brandNameY + 25);

        // Color swatches preview at bottom
        const swatchY = PAGE_HEIGHT - 70;
        const swatchSize = 20;
        const swatchGap = 15;
        const colors = [brandbook.colors.primary, brandbook.colors.secondary, brandbook.colors.accent].filter(c => c);
        const totalWidth = (colors.length * swatchSize) + ((colors.length - 1) * swatchGap);
        let swatchX = (PAGE_WIDTH - totalWidth) / 2;

        colors.forEach(color => {
            if (color) {
                const rgb = hexToRgb(color.hex);
                pdf.setFillColor(rgb.r, rgb.g, rgb.b);
                roundedRect(pdf, swatchX, swatchY, swatchSize, swatchSize, 3, 'F');

                // Hex code under swatch
                pdf.setFontSize(8);
                pdf.setTextColor(200, 200, 200);
                pdf.text(color.hex.toUpperCase(), swatchX + swatchSize / 2, swatchY + swatchSize + 10, { align: 'center' });

                swatchX += swatchSize + swatchGap;
            }
        });

        // Footer
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        pdf.text('Generated with Brandbook Visualizer', PAGE_WIDTH / 2, PAGE_HEIGHT - 20, { align: 'center' });
        pdf.setFontSize(8);
        pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            PAGE_WIDTH / 2, PAGE_HEIGHT - 14, { align: 'center' });
    }

    /**
     * Add color palette page with modern layout
     */
    function addColorPalettePage(pdf, brandbook) {
        const primaryColor = hexToRgb(brandbook.colors.primary.hex);

        // Dark background
        pdf.setFillColor(15, 15, 26);
        pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

        // Header
        addModernPageHeader(pdf, 'Color Palette', '01', brandbook);

        // Large color swatches
        let yPos = 70;
        const swatchWidth = 50;
        const swatchHeight = 70;
        const colors = [
            { key: 'primary', label: 'PRIMARY', color: brandbook.colors.primary },
            { key: 'secondary', label: 'SECONDARY', color: brandbook.colors.secondary },
            { key: 'accent', label: 'ACCENT', color: brandbook.colors.accent }
        ];

        const totalSwatchWidth = (colors.length * swatchWidth) + ((colors.length - 1) * 12);
        let xPos = (PAGE_WIDTH - totalSwatchWidth) / 2;

        colors.forEach(item => {
            if (item.color) {
                const rgb = hexToRgb(item.color.hex);

                // Color swatch
                pdf.setFillColor(rgb.r, rgb.g, rgb.b);
                roundedRect(pdf, xPos, yPos, swatchWidth, swatchHeight, 4, 'F');

                // Label
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(120, 120, 120);
                pdf.text(item.label, xPos + swatchWidth / 2, yPos + swatchHeight + 12, { align: 'center' });

                // Color name
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(255, 255, 255);
                pdf.text(item.color.name || 'Unnamed', xPos + swatchWidth / 2, yPos + swatchHeight + 22, { align: 'center' });

                // Hex value
                pdf.setFontSize(9);
                pdf.setTextColor(180, 180, 180);
                pdf.text(item.color.hex.toUpperCase(), xPos + swatchWidth / 2, yPos + swatchHeight + 32, { align: 'center' });

                // RGB value
                pdf.setFontSize(8);
                pdf.setTextColor(140, 140, 140);
                pdf.text(`RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`, xPos + swatchWidth / 2, yPos + swatchHeight + 42, { align: 'center' });

                xPos += swatchWidth + 12;
            }
        });

        // Color usage section
        yPos = 210;
        pdf.setFillColor(25, 25, 40);
        roundedRect(pdf, MARGIN, yPos, CONTENT_WIDTH, 70, 6, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Usage Guidelines', MARGIN + 15, yPos + 18);

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(200, 200, 200);

        const guidelines = [
            'Primary: Main brand elements, headers, buttons, and key UI components',
            'Secondary: Supporting elements, backgrounds, borders, and text',
            'Accent: Highlights, notifications, and emphasis elements'
        ];

        let guideY = yPos + 32;
        guidelines.forEach(line => {
            pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
            pdf.circle(MARGIN + 19, guideY - 1.5, 1.5, 'F');
            pdf.text(line, MARGIN + 26, guideY);
            guideY += 14;
        });

        addPageNumber(pdf, 2);
    }

    /**
     * Add typography page
     */
    function addTypographyPage(pdf, brandbook) {
        const primaryColor = hexToRgb(brandbook.colors.primary.hex);

        // Dark background
        pdf.setFillColor(15, 15, 26);
        pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

        // Header
        addModernPageHeader(pdf, 'Typography', '02', brandbook);

        // Primary font section
        let yPos = 70;
        const primaryFont = brandbook.typography.primary;

        pdf.setFillColor(25, 25, 40);
        roundedRect(pdf, MARGIN, yPos, CONTENT_WIDTH, 85, 6, 'F');

        // Label
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        pdf.text('PRIMARY FONT', MARGIN + 15, yPos + 18);

        // Font name large
        pdf.setFontSize(28);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(primaryFont.family, MARGIN + 15, yPos + 42);

        // Usage
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(180, 180, 180);
        pdf.text(`Usage: ${primaryFont.usage}  •  Source: Google Fonts`, MARGIN + 15, yPos + 55);

        // Sample text - split into two lines for better fit
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn', MARGIN + 15, yPos + 68);
        pdf.text('Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz', MARGIN + 15, yPos + 78);

        // Secondary font section
        const secondaryFont = brandbook.typography.secondary;
        if (secondaryFont) {
            yPos = 175;

            pdf.setFillColor(25, 25, 40);
            roundedRect(pdf, MARGIN, yPos, CONTENT_WIDTH, 85, 6, 'F');

            // Label
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
            pdf.text('SECONDARY FONT', MARGIN + 15, yPos + 18);

            // Font name large
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(255, 255, 255);
            pdf.text(secondaryFont.family, MARGIN + 15, yPos + 42);

            // Usage
            pdf.setFontSize(9);
            pdf.setTextColor(180, 180, 180);
            pdf.text(`Usage: ${secondaryFont.usage}  •  Source: Google Fonts`, MARGIN + 15, yPos + 55);

            // Sample text - split into two lines for better fit
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn', MARGIN + 15, yPos + 68);
            pdf.text('Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz', MARGIN + 15, yPos + 78);
        }

        addPageNumber(pdf, 3);
    }

    /**
     * Add logo guidelines page
     */
    async function addLogoPage(pdf, brandbook) {
        const primaryColor = hexToRgb(brandbook.colors.primary.hex);
        const secondaryColor = hexToRgb(brandbook.colors.secondary.hex);

        // Dark background
        pdf.setFillColor(15, 15, 26);
        pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

        // Header
        addModernPageHeader(pdf, 'Logo', '03', brandbook);

        const logoUrl = BrandbookModule.getLogoUrl();
        if (logoUrl) {
            try {
                // Main logo display area
                pdf.setFillColor(25, 25, 40);
                roundedRect(pdf, MARGIN, 70, CONTENT_WIDTH, 100, 6, 'F');

                await addImageToPdf(pdf, logoUrl, PAGE_WIDTH / 2 - 35, 90, 70, 60);

            } catch (e) {
                console.warn('Could not add logo to PDF:', e);
            }
        }

        // Logo on backgrounds section
        let yPos = 190;
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Background Applications', MARGIN, yPos);

        yPos += 15;
        const boxSize = 35;
        const boxGap = 10;
        const backgrounds = [
            { color: brandbook.colors.primary.hex, label: 'Primary' },
            { color: brandbook.colors.secondary.hex, label: 'Secondary' },
            { color: '#FFFFFF', label: 'White' },
            { color: '#000000', label: 'Black' }
        ];

        backgrounds.forEach((bg, index) => {
            const xPos = MARGIN + (index * (boxSize + boxGap));
            const rgb = hexToRgb(bg.color);
            pdf.setFillColor(rgb.r, rgb.g, rgb.b);
            roundedRect(pdf, xPos, yPos, boxSize, boxSize, 4, 'F');

            pdf.setFontSize(7);
            pdf.setTextColor(150, 150, 150);
            pdf.text(bg.label, xPos + boxSize / 2, yPos + boxSize + 8, { align: 'center' });
        });

        addPageNumber(pdf, 4);
    }

    /**
     * Pre-capture all mockups to avoid visible flashing
     */
    async function captureMockups(brandbook) {
        const mockupConfigs = [
            { id: 'mockup-business-card', title: 'Business Card', num: '05' },
            { id: 'mockup-social-avatar', title: 'Social Avatar', num: '06' },
            { id: 'mockup-letterhead', title: 'Letterhead', num: '07' },
            { id: 'mockup-envelope', title: 'Envelope', num: '08' },
            { id: 'mockup-presentation', title: 'Presentation', num: '09' }
        ];

        const captures = [];

        // Single container for all captures (visible - will flash briefly)
        // Use dark background matching PDF page to ensure shadows blend correctly
        const PDF_BG_COLOR = '#0f0f1a';
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `position:fixed;left:0;top:0;z-index:99999;background:${PDF_BG_COLOR};padding:20px;min-width:800px;`;
        document.body.appendChild(tempContainer);

        for (const config of mockupConfigs) {
            const element = document.getElementById(config.id);
            if (!element) continue;

            const wasActive = element.classList.contains('active');
            element.classList.add('active');

            try {
                // Clone and prepare
                tempContainer.innerHTML = '';
                const clone = element.cloneNode(true);
                clone.style.display = 'block';
                clone.classList.add('active');
                tempContainer.appendChild(clone);
                prepareCloneForCapture(clone, brandbook);

                await new Promise(r => setTimeout(r, 100));

                // Capture as PNG with dark background matching PDF
                const pngData = await htmlToImage.toPng(tempContainer, {
                    pixelRatio: 1.5,
                    cacheBust: true,
                    backgroundColor: PDF_BG_COLOR
                });

                // Get dimensions
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = pngData;
                });

                captures.push({
                    ...config,
                    imgData: pngData,
                    width: img.width,
                    height: img.height
                });

            } catch (e) {
                console.warn(`Could not capture ${config.id}:`, e);
            }

            if (!wasActive) element.classList.remove('active');
        }

        document.body.removeChild(tempContainer);
        return captures;
    }

    /**
     * Add mockup pages from pre-captured images
     */
    async function addMockupPages(pdf, brandbook) {
        let pageNum = BrandbookModule.getLogoUrl() ? 5 : 4;

        // Capture all mockups first
        const captures = await captureMockups(brandbook);

        // Now add pages from captures (no more DOM manipulation)
        for (const capture of captures) {
            pdf.addPage();

            // Dark background
            pdf.setFillColor(15, 15, 26);
            pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

            // Header
            addModernPageHeader(pdf, capture.title, capture.num, brandbook);

            // Calculate dimensions - make mockups bigger
            const maxWidth = CONTENT_WIDTH;
            const maxHeight = PAGE_HEIGHT - 100;

            let width = maxWidth;
            let height = (capture.height / capture.width) * width;

            if (height > maxHeight) {
                height = maxHeight;
                width = (capture.width / capture.height) * height;
            }

            const xPos = (PAGE_WIDTH - width) / 2;
            const yPos = 70;

            pdf.addImage(capture.imgData, 'PNG', xPos, yPos, width, height);

            addPageNumber(pdf, pageNum++);
        }
    }

    /**
     * Prepare cloned element for PDF capture by applying explicit inline styles
     * Uses setAttribute to completely override any CSS
     */
    function prepareCloneForCapture(clone, brandbook) {
        const primaryColor = brandbook.colors.primary.hex;
        const secondaryColor = brandbook.colors.secondary.hex;

        // Helper to set style attribute completely
        const setStyle = (el, styles) => {
            if (el) el.setAttribute('style', styles);
        };

        // Force opacity: 1 on clone and remove problematic styles
        clone.style.opacity = '1';
        clone.querySelectorAll('*').forEach(el => {
            const current = el.getAttribute('style') || '';
            el.setAttribute('style', current + '; opacity: 1 !important; transform: none !important; transition: none !important;');
        });

        // Business card container - ensure both sides show side by side
        const businessCard = clone.querySelector('.business-card');
        if (businessCard) {
            setStyle(businessCard, `
                display: flex !important;
                gap: 2rem !important;
                justify-content: center !important;
                flex-wrap: nowrap !important;
                align-items: stretch !important;
                opacity: 1 !important;
                min-width: 760px !important;
            `);
        }

        // Business card front - solid secondary color background
        const cardFront = clone.querySelector('.business-card-front');
        if (cardFront) {
            setStyle(cardFront, `
                background-color: ${secondaryColor} !important;
                background-image: none !important;
                color: #ffffff !important;
                border-bottom: 4px solid ${primaryColor} !important;
                border-radius: 12px !important;
                padding: 24px !important;
                width: 360px !important;
                height: 210px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
                opacity: 1 !important;
                flex-shrink: 0 !important;
            `);
        }

        // Business card back
        const cardBack = clone.querySelector('.business-card-back');
        if (cardBack) {
            setStyle(cardBack, `
                background: #ffffff !important;
                background-color: #ffffff !important;
                border-left: 4px solid ${primaryColor} !important;
                border-radius: 12px !important;
                padding: 24px !important;
                width: 360px !important;
                height: 210px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
                opacity: 1 !important;
                flex-shrink: 0 !important;
                filter: none !important;
                backdrop-filter: none !important;
            `);

            const contactName = cardBack.querySelector('.contact-name');
            if (contactName) setStyle(contactName, `color: ${primaryColor} !important; font-weight: bold !important;`);
        }

        // Social avatar - use solid primary color (gradients don't render well)
        const socialAvatar = clone.querySelector('.social-avatar');
        if (socialAvatar) {
            setStyle(socialAvatar, `
                background-color: ${primaryColor} !important;
                background-image: none !important;
                width: 140px !important;
                height: 140px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin: 20px auto 30px auto !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                opacity: 1 !important;
            `);
        }

        const platformAvatar = clone.querySelector('.platform-avatar');
        if (platformAvatar) {
            setStyle(platformAvatar, `
                background-color: ${primaryColor} !important;
                background-image: none !important;
                width: 48px !important;
                height: 48px !important;
                border-radius: 50% !important;
                flex-shrink: 0 !important;
                opacity: 1 !important;
            `);
        }

        // Platform card
        const platformCard = clone.querySelector('.platform-card');
        if (platformCard) {
            setStyle(platformCard, `
                background: #ffffff !important;
                background-color: #ffffff !important;
                border-radius: 12px !important;
                padding: 12px 16px !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                opacity: 1 !important;
                filter: none !important;
                backdrop-filter: none !important;
            `);
        }

        // Letterhead
        const letterhead = clone.querySelector('.letterhead');
        if (letterhead) setStyle(letterhead, 'background: #ffffff !important; background-color: #ffffff !important; opacity: 1 !important; box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important; border-radius: 8px !important; filter: none !important; backdrop-filter: none !important;');

        const letterheadHeader = clone.querySelector('.letterhead-header');
        if (letterheadHeader) setStyle(letterheadHeader, `border-bottom-color: ${primaryColor} !important; color: ${primaryColor} !important;`);

        const signatureName = clone.querySelector('.signature-name');
        if (signatureName) setStyle(signatureName, `color: ${primaryColor} !important;`);

        const letterheadFooter = clone.querySelector('.letterhead-footer');
        if (letterheadFooter) setStyle(letterheadFooter, `border-top-color: ${secondaryColor} !important; color: ${secondaryColor} !important;`);

        // Envelope - preserve proper layout
        const envelope = clone.querySelector('.envelope');
        if (envelope) {
            setStyle(envelope, `
                background: #ffffff !important;
                background-color: #ffffff !important;
                border-top: 3px solid ${primaryColor} !important;
                border-radius: 12px !important;
                padding: 1.5rem !important;
                position: relative !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                opacity: 1 !important;
                filter: none !important;
                backdrop-filter: none !important;
            `);
        }

        const envelopeSender = clone.querySelector('.envelope-sender');
        if (envelopeSender) {
            setStyle(envelopeSender, `
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 0.25rem !important;
            `);
        }

        const envelopeLogo = clone.querySelector('.envelope-logo');
        if (envelopeLogo) {
            setStyle(envelopeLogo, `
                width: 32px !important;
                height: 32px !important;
                background-size: contain !important;
                background-repeat: no-repeat !important;
                background-position: center !important;
                margin-bottom: 0.5rem !important;
            `);
        }

        const envelopeBrand = clone.querySelector('.envelope-brand');
        if (envelopeBrand) {
            setStyle(envelopeBrand, `
                color: ${primaryColor} !important;
                font-weight: 700 !important;
                font-size: 0.875rem !important;
            `);
        }

        const envelopeAddress = clone.querySelector('.envelope-address');
        if (envelopeAddress) {
            setStyle(envelopeAddress, `
                opacity: 0.6 !important;
                line-height: 1.5 !important;
                font-size: 0.75rem !important;
            `);
        }

        const envelopeRecipient = clone.querySelector('.envelope-recipient');
        if (envelopeRecipient) {
            setStyle(envelopeRecipient, `
                position: absolute !important;
                left: 50% !important;
                top: 55% !important;
                transform: translate(-50%, -50%) !important;
                text-align: center !important;
                font-size: 0.875rem !important;
                line-height: 1.6 !important;
            `);
        }

        // Presentation slide - need explicit dimensions since aspect-ratio may not work in capture
        const slide = clone.querySelector('.presentation-slide');
        if (slide) {
            setStyle(slide, `
                background: #ffffff !important;
                background-color: #ffffff !important;
                border-bottom: 5px solid ${primaryColor} !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                padding: 30px !important;
                opacity: 1 !important;
                filter: none !important;
                backdrop-filter: none !important;
                width: 640px !important;
                height: 360px !important;
                display: flex !important;
                flex-direction: column !important;
                position: relative !important;
            `);
        }

        const slideHeader = clone.querySelector('.slide-header');
        if (slideHeader) setStyle(slideHeader, 'display: flex !important; justify-content: flex-end !important; margin-bottom: 20px !important;');

        const slideContent = clone.querySelector('.slide-content');
        if (slideContent) setStyle(slideContent, 'flex: 1 !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; text-align: center !important;');

        const slideTitle = clone.querySelector('.slide-title');
        if (slideTitle) setStyle(slideTitle, `color: ${secondaryColor} !important; font-size: 28px !important; font-weight: bold !important; margin-bottom: 10px !important;`);

        const slideSubtitle = clone.querySelector('.slide-subtitle');
        if (slideSubtitle) setStyle(slideSubtitle, 'color: #666666 !important; font-size: 14px !important;');

        const slideFooter = clone.querySelector('.slide-footer');
        if (slideFooter) setStyle(slideFooter, 'display: flex !important; justify-content: space-between !important; font-size: 10px !important; color: #999999 !important; margin-top: auto !important;');

        const slideLogo = clone.querySelector('.slide-logo');
        if (slideLogo) setStyle(slideLogo, 'width: 60px !important; height: 60px !important; background-size: contain !important; background-repeat: no-repeat !important;');

        // Add CSS to remove pseudo-elements that might cause issues
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            * { opacity: 1 !important; }
            *::before, *::after { content: none !important; display: none !important; }
        `;
        clone.prepend(styleTag);
    }

    /**
     * Add modern page header
     */
    function addModernPageHeader(pdf, title, pageNum, brandbook) {
        const primaryColor = hexToRgb(brandbook.colors.primary.hex);

        // Small accent bar
        pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
        pdf.rect(MARGIN, 25, 40, 3, 'F');

        // Page number
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        pdf.text(pageNum, MARGIN, 42);

        // Title
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(title, MARGIN, 55);
    }

    /**
     * Add page number
     */
    function addPageNumber(pdf, num) {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(String(num).padStart(2, '0'), PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 15, { align: 'right' });
    }

    /**
     * Draw rounded rectangle
     */
    function roundedRect(pdf, x, y, width, height, radius, style) {
        pdf.roundedRect(x, y, width, height, radius, radius, style);
    }

    /**
     * Add image to PDF with aspect ratio preservation
     */
    async function addImageToPdf(pdf, dataUrl, x, y, maxWidth, maxHeight, preserveAspect = true) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    // Calculate dimensions preserving aspect ratio
                    let finalWidth = maxWidth;
                    let finalHeight = maxHeight;
                    let finalX = x;
                    let finalY = y;

                    if (preserveAspect && img.width && img.height) {
                        const imgAspect = img.width / img.height;
                        const boxAspect = maxWidth / maxHeight;

                        if (imgAspect > boxAspect) {
                            // Image is wider - fit to width
                            finalWidth = maxWidth;
                            finalHeight = maxWidth / imgAspect;
                            finalY = y + (maxHeight - finalHeight) / 2;
                        } else {
                            // Image is taller - fit to height
                            finalHeight = maxHeight;
                            finalWidth = maxHeight * imgAspect;
                            finalX = x + (maxWidth - finalWidth) / 2;
                        }
                    }

                    const format = dataUrl.includes('image/png') ? 'PNG' :
                        dataUrl.includes('image/svg') ? 'PNG' : 'JPEG';

                    if (dataUrl.includes('image/svg')) {
                        const canvas = document.createElement('canvas');
                        // Reduced scale for smaller file size (was 3)
                        const scale = 2;
                        canvas.width = (img.width || 200) * scale;
                        canvas.height = (img.height || 200) * scale;
                        const ctx = canvas.getContext('2d');
                        ctx.scale(scale, scale);
                        ctx.drawImage(img, 0, 0, img.width || 200, img.height || 200);
                        const pngData = canvas.toDataURL('image/png');
                        pdf.addImage(pngData, 'PNG', finalX, finalY, finalWidth, finalHeight);
                    } else if (dataUrl.includes('image/png')) {
                        // Convert PNG to JPEG for smaller size (unless it has transparency)
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        const jpegData = canvas.toDataURL('image/jpeg', 0.9);
                        pdf.addImage(jpegData, 'JPEG', finalX, finalY, finalWidth, finalHeight);
                    } else {
                        pdf.addImage(dataUrl, format, finalX, finalY, finalWidth, finalHeight);
                    }
                    resolve();
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /**
     * Convert hex color to RGB
     */
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    return {
        generatePdf
    };
})();

if (typeof window !== 'undefined') {
    window.PdfModule = PdfModule;
}

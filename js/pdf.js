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

        // QR Code page (last page)
        pdf.addPage();
        await addQrCodePage(pdf, brandbook);

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
        // Transparent background so mockups float on dark PDF page
        // Container needs to be large enough for the biggest mockups (letterhead is 1440x2037)
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:transparent;padding:20px;min-width:3000px;';
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

                // Capture as PNG with transparent background
                const pngData = await htmlToImage.toPng(tempContainer, {
                    pixelRatio: 1.5,
                    cacheBust: true
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

        // Business card container - stack vertically (one under another), 4x bigger
        const businessCard = clone.querySelector('.business-card');
        if (businessCard) {
            setStyle(businessCard, `
                display: flex !important;
                flex-direction: column !important;
                flex-wrap: nowrap !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 4rem !important;
                opacity: 1 !important;
                width: 100% !important;
                perspective: none !important;
            `);
        }

        // Business card front - solid secondary color background, 4x bigger (1440x840)
        const cardFront = clone.querySelector('.business-card-front');
        if (cardFront) {
            setStyle(cardFront, `
                background-color: ${secondaryColor} !important;
                background-image: none !important;
                color: #ffffff !important;
                border-bottom: 16px solid ${primaryColor} !important;
                border-radius: 48px !important;
                padding: 96px !important;
                width: 1440px !important;
                height: 840px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                box-shadow: 0 32px 128px rgba(0,0,0,0.4) !important;
                opacity: 1 !important;
                flex-shrink: 0 !important;
            `);

            const cardLogo = cardFront.querySelector('.card-logo');
            if (cardLogo) {
                const logoUrl = BrandbookModule.getLogoUrl();
                const bgImage = logoUrl ? `url(${logoUrl})` : 'none';
                setStyle(cardLogo, `width: 256px !important; height: 256px !important; margin-bottom: 4rem !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; background-image: ${bgImage} !important; display: block !important;`);
            }

            const cardBrandName = cardFront.querySelector('.card-brand-name');
            if (cardBrandName) setStyle(cardBrandName, `font-size: 5.5rem !important; font-weight: 700 !important; margin-bottom: 1.5rem !important;`);

            const cardTagline = cardFront.querySelector('.card-tagline');
            if (cardTagline) setStyle(cardTagline, `font-size: 3rem !important; opacity: 0.8 !important;`);
        }

        // Business card back - 4x bigger (1440x840)
        const cardBack = clone.querySelector('.business-card-back');
        if (cardBack) {
            setStyle(cardBack, `
                background: #ffffff !important;
                background-color: #ffffff !important;
                border-left: 16px solid ${primaryColor} !important;
                border-radius: 48px !important;
                padding: 96px !important;
                width: 1440px !important;
                height: 840px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                box-shadow: 0 32px 128px rgba(0,0,0,0.4) !important;
                opacity: 1 !important;
                flex-shrink: 0 !important;
                filter: none !important;
                backdrop-filter: none !important;
            `);

            const cardContact = cardBack.querySelector('.card-contact');
            if (cardContact) setStyle(cardContact, `display: flex !important; flex-direction: column !important; width: 100% !important;`);

            const contactName = cardBack.querySelector('.contact-name');
            if (contactName) setStyle(contactName, `color: ${primaryColor} !important; font-weight: bold !important; font-size: 4.5rem !important; margin-bottom: 1rem !important; display: block !important;`);

            const contactTitle = cardBack.querySelector('.contact-title');
            if (contactTitle) setStyle(contactTitle, `font-size: 3rem !important; opacity: 0.6 !important; margin-bottom: 5rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; display: block !important; color: #333 !important;`);

            const contactInfo = cardBack.querySelector('.contact-info');
            if (contactInfo) {
                setStyle(contactInfo, `font-size: 3.25rem !important; gap: 1.5rem !important; display: flex !important; flex-direction: column !important; color: #333 !important;`);
                contactInfo.querySelectorAll('span').forEach(span => {
                    setStyle(span, `display: block !important; font-size: 3.25rem !important; color: #333 !important;`);
                });
            }
        }

        // Social avatar container - center everything
        const socialAvatarContainer = clone.querySelector('.social-avatar-container');
        if (socialAvatarContainer) {
            setStyle(socialAvatarContainer, `
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                width: 100% !important;
                padding: 80px 0 !important;
                gap: 120px !important;
            `);
        }

        // Social avatar - use solid primary color (gradients don't render well)
        const socialAvatar = clone.querySelector('.social-avatar');
        if (socialAvatar) {
            setStyle(socialAvatar, `
                background-color: ${primaryColor} !important;
                background-image: none !important;
                width: 1800px !important;
                height: 1800px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin: 0 !important;
                box-shadow: 0 80px 200px rgba(0,0,0,0.4), 0 0 0 32px rgba(255,255,255,0.1) !important;
                opacity: 1 !important;
            `);

            const avatarLogo = socialAvatar.querySelector('.avatar-logo');
            if (avatarLogo) {
                const logoUrl = BrandbookModule.getLogoUrl();
                const bgImage = logoUrl ? `url(${logoUrl})` : 'none';
                setStyle(avatarLogo, `width: 960px !important; height: 960px !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; background-image: ${bgImage} !important; filter: drop-shadow(0 8px 24px rgba(0,0,0,0.2)) !important;`);
            }
        }

        // Avatar platforms container - centered
        const avatarPlatforms = clone.querySelector('.avatar-platforms');
        if (avatarPlatforms) {
            setStyle(avatarPlatforms, `
                width: 2400px !important;
                max-width: 2400px !important;
                margin: 0 auto !important;
            `);
        }

        // Platform preview container - better styling
        const platformPreview = clone.querySelector('.platform-preview');
        if (platformPreview) {
            setStyle(platformPreview, `
                background: #ffffff !important;
                border-radius: 120px !important;
                padding: 120px 160px !important;
                box-shadow: 0 48px 160px rgba(0,0,0,0.25) !important;
                margin: 0 !important;
            `);

            const platformLabel = platformPreview.querySelector('.platform-label');
            if (platformLabel) setStyle(platformLabel, `
                font-size: 64px !important;
                margin-bottom: 96px !important;
                color: #6b7280 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.1em !important;
                font-weight: 600 !important;
                display: block !important;
            `);
        }

        // Platform card
        const platformCard = clone.querySelector('.platform-card');
        if (platformCard) {
            setStyle(platformCard, `
                display: flex !important;
                align-items: center !important;
                gap: 96px !important;
                background: transparent !important;
            `);
        }

        const platformAvatar = clone.querySelector('.platform-avatar');
        if (platformAvatar) {
            setStyle(platformAvatar, `
                background-color: ${primaryColor} !important;
                background-image: none !important;
                width: 320px !important;
                height: 320px !important;
                border-radius: 50% !important;
                flex-shrink: 0 !important;
                opacity: 1 !important;
                box-shadow: 0 16px 48px rgba(0,0,0,0.15) !important;
            `);
        }

        const platformInfo = clone.querySelector('.platform-info');
        if (platformInfo) {
            setStyle(platformInfo, `
                display: flex !important;
                flex-direction: column !important;
                gap: 24px !important;
            `);
        }

        const platformName = clone.querySelector('.platform-name');
        if (platformName) setStyle(platformName, `font-size: 96px !important; font-weight: 700 !important; color: #1a1a2e !important;`);

        const platformHandle = clone.querySelector('.platform-handle');
        if (platformHandle) setStyle(platformHandle, `font-size: 72px !important; color: #6b7280 !important;`);

        // Letterhead - portrait orientation like real letter paper (2000x2750)
        const letterhead = clone.querySelector('.letterhead');
        if (letterhead) setStyle(letterhead, `
            background: #ffffff !important;
            background-color: #ffffff !important;
            opacity: 1 !important;
            box-shadow: 0 24px 120px rgba(0,0,0,0.3) !important;
            border-radius: 24px !important;
            filter: none !important;
            backdrop-filter: none !important;
            width: 2000px !important;
            min-width: 2000px !important;
            max-width: 2000px !important;
            height: 2750px !important;
            min-height: 2750px !important;
            padding: 100px !important;
            display: flex !important;
            flex-direction: column !important;
            margin: 0 auto !important;
            color: #1a1a2e !important;
            box-sizing: border-box !important;
        `);

        const letterheadHeader = clone.querySelector('.letterhead-header');
        if (letterheadHeader) setStyle(letterheadHeader, `
            border-bottom: 6px solid ${primaryColor} !important;
            color: ${primaryColor} !important;
            display: flex !important;
            align-items: center !important;
            gap: 2rem !important;
            padding-bottom: 2rem !important;
            margin-bottom: 3rem !important;
            width: 100% !important;
            flex-shrink: 0 !important;
        `);

        const letterheadLogo = clone.querySelector('.letterhead-logo');
        if (letterheadLogo) {
            const logoUrl = BrandbookModule.getLogoUrl();
            const bgImage = logoUrl ? `url(${logoUrl})` : 'none';
            setStyle(letterheadLogo, `width: 125px !important; height: 125px !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; flex-shrink: 0 !important; background-image: ${bgImage} !important;`);
        }

        const letterheadBrand = clone.querySelector('.letterhead-brand');
        if (letterheadBrand) setStyle(letterheadBrand, `font-size: 3.75rem !important; font-weight: 700 !important;`);

        const letterheadContent = clone.querySelector('.letterhead-content');
        if (letterheadContent) setStyle(letterheadContent, `flex: 1 !important; font-size: 2.2rem !important; line-height: 1.8 !important; width: 100% !important;`);

        const letterDate = clone.querySelector('.letter-date');
        if (letterDate) setStyle(letterDate, `margin-bottom: 2.5rem !important; opacity: 0.6 !important; font-size: 1.9rem !important;`);

        const letterGreeting = clone.querySelector('.letter-greeting');
        if (letterGreeting) setStyle(letterGreeting, `margin-bottom: 2rem !important; font-weight: 500 !important; font-size: 2.2rem !important;`);

        const letterBody = clone.querySelector('.letter-body');
        if (letterBody) {
            setStyle(letterBody, `font-size: 2.2rem !important; width: 100% !important;`);
            letterBody.querySelectorAll('p').forEach(p => setStyle(p, `margin-bottom: 2rem !important; opacity: 0.8 !important;`));
        }

        const letterSignature = clone.querySelector('.letter-signature');
        if (letterSignature) setStyle(letterSignature, `margin-top: 4rem !important; font-size: 2.2rem !important;`);

        const signatureName = clone.querySelector('.signature-name');
        if (signatureName) setStyle(signatureName, `color: ${primaryColor} !important; font-weight: 700 !important; margin-top: 2rem !important; font-size: 2.2rem !important;`);

        const signatureTitle = clone.querySelector('.signature-title');
        if (signatureTitle) setStyle(signatureTitle, `font-size: 1.9rem !important; opacity: 0.6 !important;`);

        const letterheadFooter = clone.querySelector('.letterhead-footer');
        if (letterheadFooter) setStyle(letterheadFooter, `
            border-top: 3px solid ${secondaryColor} !important;
            color: ${secondaryColor} !important;
            display: flex !important;
            justify-content: space-between !important;
            gap: 2.5rem !important;
            padding-top: 2.5rem !important;
            font-size: 1.9rem !important;
            opacity: 0.5 !important;
            width: 100% !important;
            flex-shrink: 0 !important;
            margin-top: auto !important;
        `);

        // Envelope - 4x bigger (2080px x 1040px) - using absolute positioning
        const envelope = clone.querySelector('.envelope');
        if (envelope) {
            setStyle(envelope, `
                background: #ffffff !important;
                background-color: #ffffff !important;
                border-top: 12px solid ${primaryColor} !important;
                border-radius: 48px !important;
                padding: 0 !important;
                box-shadow: 0 16px 80px rgba(0,0,0,0.3) !important;
                opacity: 1 !important;
                filter: none !important;
                backdrop-filter: none !important;
                width: 2080px !important;
                min-width: 2080px !important;
                height: 1040px !important;
                margin: 0 auto !important;
                color: #1a1a2e !important;
                display: block !important;
                position: relative !important;
                box-sizing: border-box !important;
                overflow: visible !important;
            `);
        }

        const envelopeSender = clone.querySelector('.envelope-sender');
        if (envelopeSender) {
            setStyle(envelopeSender, `
                display: block !important;
                position: absolute !important;
                left: 100px !important;
                top: 100px !important;
                text-align: left !important;
                width: 600px !important;
            `);
        }

        const envelopeLogo = clone.querySelector('.envelope-logo');
        if (envelopeLogo) {
            const logoUrl = BrandbookModule.getLogoUrl();
            const bgImage = logoUrl ? `url(${logoUrl})` : 'none';
            setStyle(envelopeLogo, `
                width: 128px !important;
                height: 128px !important;
                background-size: contain !important;
                background-repeat: no-repeat !important;
                background-position: center !important;
                margin-bottom: 24px !important;
                display: block !important;
                background-image: ${bgImage} !important;
            `);
        }

        const envelopeBrand = clone.querySelector('.envelope-brand');
        if (envelopeBrand) {
            setStyle(envelopeBrand, `
                color: ${primaryColor} !important;
                font-weight: 700 !important;
                font-size: 3.5rem !important;
                margin-bottom: 8px !important;
                display: block !important;
            `);
        }

        const envelopeAddress = clone.querySelector('.envelope-address');
        if (envelopeAddress) {
            setStyle(envelopeAddress, `
                opacity: 0.6 !important;
                line-height: 1.5 !important;
                font-size: 2.5rem !important;
                display: block !important;
            `);
        }

        const envelopeRecipient = clone.querySelector('.envelope-recipient');
        if (envelopeRecipient) {
            setStyle(envelopeRecipient, `
                display: block !important;
                position: absolute !important;
                right: 200px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                text-align: center !important;
                font-size: 3.5rem !important;
                line-height: 1.8 !important;
                width: 700px !important;
            `);
        }

        // Presentation mockup wrapper
        const presentationMockup = clone.classList.contains('mockup-presentation') ? clone : clone.querySelector('.mockup-presentation');
        if (presentationMockup) {
            setStyle(presentationMockup, `
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 100% !important;
                min-width: 3200px !important;
            `);
        }

        // Presentation slide - 7x bigger (3200x1800)
        const slide = clone.querySelector('.presentation-slide');
        if (slide) {
            setStyle(slide, `
                background: #ffffff !important;
                background-color: #ffffff !important;
                border-bottom: 24px solid ${primaryColor} !important;
                border-radius: 40px !important;
                box-shadow: 0 24px 120px rgba(0,0,0,0.3) !important;
                padding: 160px !important;
                opacity: 1 !important;
                filter: none !important;
                backdrop-filter: none !important;
                width: 3200px !important;
                min-width: 3200px !important;
                height: 1800px !important;
                min-height: 1800px !important;
                display: flex !important;
                flex-direction: column !important;
                position: relative !important;
                margin: 0 auto !important;
                color: #1a1a2e !important;
                box-sizing: border-box !important;
            `);
        }

        const slideHeader = clone.querySelector('.slide-header');
        if (slideHeader) setStyle(slideHeader, 'display: flex !important; justify-content: flex-end !important; margin-bottom: 100px !important;');

        const slideContent = clone.querySelector('.slide-content');
        if (slideContent) setStyle(slideContent, 'flex: 1 !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; text-align: center !important;');

        const slideTitle = clone.querySelector('.slide-title');
        if (slideTitle) setStyle(slideTitle, `color: ${secondaryColor} !important; font-size: 160px !important; font-weight: bold !important; margin-bottom: 50px !important; display: block !important;`);

        const slideSubtitle = clone.querySelector('.slide-subtitle');
        if (slideSubtitle) setStyle(slideSubtitle, 'color: #666666 !important; font-size: 80px !important; display: block !important;');

        const slideFooter = clone.querySelector('.slide-footer');
        if (slideFooter) setStyle(slideFooter, 'display: flex !important; justify-content: space-between !important; font-size: 50px !important; color: #999999 !important; margin-top: auto !important; width: 100% !important;');

        const slideLogo = clone.querySelector('.slide-logo');
        if (slideLogo) {
            const logoUrl = BrandbookModule.getLogoUrl();
            const bgImage = logoUrl ? `url(${logoUrl})` : 'none';
            setStyle(slideLogo, `width: 320px !important; height: 320px !important; background-size: contain !important; background-repeat: no-repeat !important; background-image: ${bgImage} !important; display: block !important;`);
        }

        // Add CSS to remove pseudo-elements that might cause issues
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            * { opacity: 1 !important; }
            *::before, *::after { content: none !important; display: none !important; }
        `;
        clone.prepend(styleTag);
    }

    /**
     * Add QR code page for easy brandbook sharing
     */
    async function addQrCodePage(pdf, brandbook) {
        const primaryColor = hexToRgb(brandbook.colors.primary.hex);
        const secondaryColor = hexToRgb(brandbook.colors.secondary.hex);

        // Dark background
        pdf.setFillColor(15, 15, 26);
        pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

        // Header
        const pageNum = BrandbookModule.getLogoUrl() ? '10' : '09';
        addModernPageHeader(pdf, 'Quick Import', pageNum, brandbook);

        // Generate shareable URL
        const baseUrl = BrandbookModule.getBaseUrl();
        const shareUrl = BrandbookModule.generateShareUrl(baseUrl);

        // Create temporary container for QR code generation
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body.appendChild(tempContainer);

        const qrContainer = document.createElement('div');
        tempContainer.appendChild(qrContainer);

        try {
            // Generate QR code with QRCode.js
            const qr = new QRCode(qrContainer, {
                text: shareUrl,
                width: 400,
                height: 400,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M // Medium error correction for balance
            });

            // Wait for QR code to render
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get the canvas from QR code
            const qrCanvas = qrContainer.querySelector('canvas');
            if (qrCanvas) {
                const qrDataUrl = qrCanvas.toDataURL('image/png');

                // Calculate QR code size and position (centered, ~80mm square)
                const qrSize = 80;
                const qrX = (PAGE_WIDTH - qrSize) / 2;
                const qrY = 85;

                // White background for QR code with rounded corners
                pdf.setFillColor(255, 255, 255);
                roundedRect(pdf, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 8, 'F');

                // Add QR code image
                pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
            }
        } catch (e) {
            console.warn('Could not generate QR code for PDF:', e);
        } finally {
            document.body.removeChild(tempContainer);
        }

        // Instructions title
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const instructionY = 185;
        pdf.text('Scan to Import Brandbook', PAGE_WIDTH / 2, instructionY, { align: 'center' });

        // Clickable link for digital viewing
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        const linkText = 'Or click here to open directly';
        const linkWidth = pdf.getTextWidth(linkText);
        const linkX = (PAGE_WIDTH - linkWidth) / 2;
        const linkY = instructionY + 10;
        pdf.textWithLink(linkText, linkX, linkY, { url: shareUrl });
        // Underline the link
        pdf.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
        pdf.setLineWidth(0.3);
        pdf.line(linkX, linkY + 1, linkX + linkWidth, linkY + 1);

        // Instruction box
        const boxY = 205;
        pdf.setFillColor(25, 25, 40);
        roundedRect(pdf, MARGIN, boxY, CONTENT_WIDTH, 55, 6, 'F');

        // Instructions
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(200, 200, 200);

        const instructions = [
            '1. Scan this QR code with your smartphone camera',
            '2. Open the link in your mobile browser',
            '3. The brand colors and typography will auto-import',
            '4. Note: Logo is not included in QR data (upload separately)'
        ];

        let instructionLineY = boxY + 16;
        instructions.forEach((line, index) => {
            pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
            pdf.circle(MARGIN + 14, instructionLineY - 1.5, 1.5, 'F');
            pdf.text(line, MARGIN + 22, instructionLineY);
            instructionLineY += 11;
        });

        // What's included section
        const includedY = 270;
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Included in QR:', MARGIN, includedY);

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);

        // Color swatches preview
        const swatchY = includedY + 8;
        const swatchSize = 8;
        const colors = [brandbook.colors.primary, brandbook.colors.secondary, brandbook.colors.accent].filter(c => c);
        let swatchX = MARGIN;

        colors.forEach(color => {
            if (color) {
                const rgb = hexToRgb(color.hex);
                pdf.setFillColor(rgb.r, rgb.g, rgb.b);
                roundedRect(pdf, swatchX, swatchY, swatchSize, swatchSize, 2, 'F');
                swatchX += swatchSize + 4;
            }
        });
        pdf.text('Brand Colors', swatchX + 4, swatchY + 6);

        // Typography info
        const typographyY = swatchY + 15;
        pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        pdf.text('Aa', MARGIN, typographyY + 1);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`${brandbook.typography.primary.family}${brandbook.typography.secondary ? ' + ' + brandbook.typography.secondary.family : ''}`, MARGIN + 12, typographyY);

        // Page number
        const totalPages = BrandbookModule.getLogoUrl() ? 10 : 9;
        addPageNumber(pdf, totalPages);
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

    /**
     * Generate only the social avatar page for quick testing
     */
    async function generateSocialAvatarOnly() {
        const brandbook = BrandbookModule.getBrandbook();
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        // Dark background
        pdf.setFillColor(15, 15, 26);
        pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

        // Header
        addModernPageHeader(pdf, 'Social Avatar', '06', brandbook);

        // Capture only the social avatar mockup
        const capture = await captureSingleMockup('mockup-social-avatar', brandbook);

        if (capture) {
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
        }

        addPageNumber(pdf, 1);

        // Download PDF
        pdf.save('social-avatar-test.pdf');
    }

    /**
     * Capture a single mockup for testing
     */
    async function captureSingleMockup(mockupId, brandbook) {
        const element = document.getElementById(mockupId);
        if (!element) return null;

        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:transparent;padding:20px;min-width:3000px;';
        document.body.appendChild(tempContainer);

        const wasActive = element.classList.contains('active');
        element.classList.add('active');

        try {
            tempContainer.innerHTML = '';
            const clone = element.cloneNode(true);
            clone.style.display = 'block';
            clone.classList.add('active');
            tempContainer.appendChild(clone);
            prepareCloneForCapture(clone, brandbook);

            await new Promise(r => setTimeout(r, 100));

            const pngData = await htmlToImage.toPng(tempContainer, {
                pixelRatio: 1.5,
                cacheBust: true
            });

            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = pngData;
            });

            return {
                imgData: pngData,
                width: img.width,
                height: img.height
            };
        } catch (e) {
            console.warn(`Could not capture ${mockupId}:`, e);
            return null;
        } finally {
            if (!wasActive) element.classList.remove('active');
            document.body.removeChild(tempContainer);
        }
    }

    return {
        generatePdf,
        generateSocialAvatarOnly
    };
})();

if (typeof window !== 'undefined') {
    window.PdfModule = PdfModule;
}

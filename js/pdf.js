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
     * Performance timing utility for PDF generation profiling
     */
    // Enable timing with ?debug=true in URL
    const debugMode = new URLSearchParams(window.location.search).has('debug');

    const PdfTiming = {
        marks: {},
        durations: {},
        mockupBreakdown: {},
        enabled: debugMode,

        start(label) {
            if (!this.enabled) return;
            this.marks[label] = performance.now();
        },

        end(label) {
            if (!this.enabled) return 0;
            const duration = performance.now() - (this.marks[label] || performance.now());
            this.durations[label] = duration;
            return duration;
        },

        recordMockup(mockupId, duration) {
            if (!this.enabled) return;
            this.mockupBreakdown[mockupId] = duration;
        },

        reset() {
            this.marks = {};
            this.durations = {};
            this.mockupBreakdown = {};
        },

        getReport() {
            const total = this.durations['generatePdf_total'] || 0;
            const preloadLogo = this.durations['preloadLogo'] || 0;
            const mockupsTotal = this.durations['captureMockups_total'] || 0;
            const titlePage = this.durations['addTitlePage'] || 0;
            const logoPage = this.durations['addLogoPage'] || 0;
            const qrCodePage = this.durations['addQrCodePage'] || 0;
            const mockupPagesAssembly = this.durations['addMockupPagesFromCaptures'] || 0;
            const pdfSave = this.durations['pdfSave'] || 0;
            const colorPalettePage = this.durations['addColorPalettePage'] || 0;
            const typographyPage = this.durations['addTypographyPage'] || 0;

            const mockupsPercent = total > 0 ? ((mockupsTotal / total) * 100).toFixed(0) : 0;

            return {
                total,
                preloadLogo,
                mockupsTotal,
                mockupsPercent,
                mockupBreakdown: { ...this.mockupBreakdown },
                titlePage,
                logoPage,
                qrCodePage,
                mockupPagesAssembly,
                pdfSave,
                colorPalettePage,
                typographyPage
            };
        },

        printReport() {
            const r = this.getReport();
            const lines = [
                '',
                '\u2550'.repeat(43),
                '  PDF Generation Timing Report',
                '\u2550'.repeat(43),
                `  Total:                    ${r.total.toFixed(0)}ms`,
                '\u2500'.repeat(43),
                `  Mockup Captures:          ${r.mockupsTotal.toFixed(0)}ms (${r.mockupsPercent}%)`
            ];

            // Add mockup breakdown
            const mockupNames = {
                'mockup-business-card': 'Business Card',
                'mockup-social-avatar': 'Social Avatar',
                'mockup-letterhead': 'Letterhead',
                'mockup-envelope': 'Envelope',
                'mockup-presentation': 'Presentation'
            };

            const mockupIds = Object.keys(r.mockupBreakdown);
            mockupIds.forEach((id, index) => {
                const name = mockupNames[id] || id;
                const duration = r.mockupBreakdown[id];
                const prefix = index === mockupIds.length - 1 ? '\u2514\u2500' : '\u251C\u2500';
                lines.push(`    ${prefix} ${name.padEnd(16)} ${duration.toFixed(0)}ms`);
            });

            lines.push('\u2500'.repeat(43));
            if (r.preloadLogo > 0) {
                lines.push(`  Logo Preload:             ${r.preloadLogo.toFixed(0)}ms`);
            }
            lines.push(`  Title Page:               ${r.titlePage.toFixed(0)}ms`);
            lines.push(`  Color Palette Page:       ${r.colorPalettePage.toFixed(0)}ms`);
            lines.push(`  Typography Page:          ${r.typographyPage.toFixed(0)}ms`);
            if (r.logoPage > 0) {
                lines.push(`  Logo Page:                ${r.logoPage.toFixed(0)}ms`);
            }
            lines.push(`  QR Code Page:             ${r.qrCodePage.toFixed(0)}ms`);
            lines.push(`  Mockup Pages Assembly:    ${r.mockupPagesAssembly.toFixed(0)}ms`);
            lines.push(`  PDF Save:                 ${r.pdfSave.toFixed(0)}ms`);
            lines.push('\u2550'.repeat(43));

            console.log(lines.join('\n'));
            return lines.join('\n');
        },

        downloadReport() {
            const report = this.printReport();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pdf-timing-report-${timestamp}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    /**
     * Preload and process logo image for reuse across PDF pages
     * Returns cached image data ready for pdf.addImage()
     */
    async function preloadLogo() {
        const logoUrl = BrandbookModule.getLogoUrl();
        if (!logoUrl) return null;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    let imageData, format;

                    if (logoUrl.includes('image/svg')) {
                        // Convert SVG to PNG (preserves transparency)
                        const canvas = document.createElement('canvas');
                        const scale = 2;
                        canvas.width = (img.width || 200) * scale;
                        canvas.height = (img.height || 200) * scale;
                        const ctx = canvas.getContext('2d');
                        ctx.scale(scale, scale);
                        ctx.drawImage(img, 0, 0, img.width || 200, img.height || 200);
                        imageData = canvas.toDataURL('image/png');
                        format = 'PNG';
                    } else if (logoUrl.includes('image/png')) {
                        // Keep PNG format to preserve transparency
                        imageData = logoUrl;
                        format = 'PNG';
                    } else {
                        // JPEG or other formats
                        imageData = logoUrl;
                        format = 'JPEG';
                    }

                    resolve({
                        imageData,
                        format,
                        width: img.width,
                        height: img.height
                    });
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = reject;
            img.src = logoUrl;
        });
    }

    /**
     * Add cached logo to PDF at specified position
     */
    function addCachedLogoToPdf(pdf, cachedLogo, x, y, maxWidth, maxHeight) {
        if (!cachedLogo) return;

        let finalWidth = maxWidth;
        let finalHeight = maxHeight;
        let finalX = x;
        let finalY = y;

        if (cachedLogo.width && cachedLogo.height) {
            const imgAspect = cachedLogo.width / cachedLogo.height;
            const boxAspect = maxWidth / maxHeight;

            if (imgAspect > boxAspect) {
                finalWidth = maxWidth;
                finalHeight = maxWidth / imgAspect;
                finalY = y + (maxHeight - finalHeight) / 2;
            } else {
                finalHeight = maxHeight;
                finalWidth = maxHeight * imgAspect;
                finalX = x + (maxWidth - finalWidth) / 2;
            }
        }

        pdf.addImage(cachedLogo.imageData, cachedLogo.format, finalX, finalY, finalWidth, finalHeight);
    }

    /**
     * Generate and download PDF brandbook
     */
    async function generatePdf() {
        // Reset and start timing
        PdfTiming.reset();
        PdfTiming.start('generatePdf_total');

        const brandbook = BrandbookModule.getBrandbook();
        const { jsPDF } = window.jspdf;

        // Preload logo once for reuse
        PdfTiming.start('preloadLogo');
        const cachedLogo = await preloadLogo();
        PdfTiming.end('preloadLogo');

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true  // Enable compression for smaller file size
        });

        // Start capturing mockups early (parallel with static pages)
        const mockupCapturesPromise = captureMockups(brandbook);

        // Title page
        PdfTiming.start('addTitlePage');
        await addTitlePage(pdf, brandbook, cachedLogo);
        PdfTiming.end('addTitlePage');

        // Color palette page
        pdf.addPage();
        PdfTiming.start('addColorPalettePage');
        addColorPalettePage(pdf, brandbook);
        PdfTiming.end('addColorPalettePage');

        // Typography page
        pdf.addPage();
        PdfTiming.start('addTypographyPage');
        addTypographyPage(pdf, brandbook);
        PdfTiming.end('addTypographyPage');

        // Logo guidelines page
        if (cachedLogo) {
            pdf.addPage();
            PdfTiming.start('addLogoPage');
            await addLogoPage(pdf, brandbook, cachedLogo);
            PdfTiming.end('addLogoPage');
        }

        // Wait for mockup captures to complete and add pages
        const captures = await mockupCapturesPromise;
        PdfTiming.start('addMockupPagesFromCaptures');
        await addMockupPagesFromCaptures(pdf, captures, brandbook);
        PdfTiming.end('addMockupPagesFromCaptures');

        // QR Code page (last page)
        pdf.addPage();
        PdfTiming.start('addQrCodePage');
        await addQrCodePage(pdf, brandbook);
        PdfTiming.end('addQrCodePage');

        // Download PDF
        PdfTiming.start('pdfSave');
        const fileName = `${brandbook.meta.name.toLowerCase().replace(/\s+/g, '-')}-brandbook.pdf`;
        pdf.save(fileName);
        PdfTiming.end('pdfSave');

        // Complete total timing and print report (if enabled)
        PdfTiming.end('generatePdf_total');
        if (PdfTiming.enabled) {
            PdfTiming.printReport();
        }
    }

    /**
     * Add modern title page
     */
    async function addTitlePage(pdf, brandbook, cachedLogo) {
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

        // Logo centered (using cached logo)
        if (cachedLogo) {
            addCachedLogoToPdf(pdf, cachedLogo, PAGE_WIDTH / 2 - 30, 80, 60, 60);
        }

        // Brand name - large, centered
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(42);
        pdf.setFont('helvetica', 'bold');
        const brandNameY = cachedLogo ? 165 : 120;
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
    async function addLogoPage(pdf, brandbook, cachedLogo) {
        const primaryColor = hexToRgb(brandbook.colors.primary.hex);
        const secondaryColor = hexToRgb(brandbook.colors.secondary.hex);

        // Dark background
        pdf.setFillColor(15, 15, 26);
        pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

        // Header
        addModernPageHeader(pdf, 'Logo', '03', brandbook);

        if (cachedLogo) {
            // Main logo display area
            pdf.setFillColor(25, 25, 40);
            roundedRect(pdf, MARGIN, 70, CONTENT_WIDTH, 100, 6, 'F');

            addCachedLogoToPdf(pdf, cachedLogo, PAGE_WIDTH / 2 - 35, 90, 70, 60);
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
     * Embed Google Fonts as base64 CSS for html-to-image
     * Returns CSS string with fonts embedded as data URIs
     */
    async function embedFontsAsBase64(fontFamilies) {
        let embeddedCss = '';

        for (const family of fontFamilies) {
            const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;700&display=swap`;

            try {
                const response = await fetch(cssUrl);
                if (!response.ok) continue;

                let css = await response.text();

                // Find all font URLs and replace with base64
                const urlRegex = /url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g;
                const urls = [...css.matchAll(urlRegex)].map(m => m[1]);

                for (const fontUrl of urls) {
                    try {
                        const fontResponse = await fetch(fontUrl);
                        const fontBuffer = await fontResponse.arrayBuffer();
                        const base64 = btoa(String.fromCharCode(...new Uint8Array(fontBuffer)));
                        const mimeType = fontUrl.includes('.woff2') ? 'font/woff2' : 'font/woff';
                        const dataUri = `data:${mimeType};base64,${base64}`;
                        css = css.replace(fontUrl, dataUri);
                    } catch (e) {
                        // Skip this font file
                    }
                }

                embeddedCss += css + '\n';
            } catch (e) {
                console.warn('Could not load font:', family);
            }
        }

        return embeddedCss;
    }

    /**
     * Suppress CORS errors from html-to-image during capture
     */
    function suppressCorsErrors() {
        const originalError = console.error;
        console.error = (...args) => {
            const msg = args[0]?.toString() || '';
            // Suppress known CORS errors from html-to-image
            if (msg.includes('Error inlining remote css') ||
                msg.includes('Error loading remote stylesheet') ||
                msg.includes('Error while reading CSS rules')) {
                return;
            }
            originalError.apply(console, args);
        };
        return () => { console.error = originalError; };
    }

    /**
     * Pre-capture all mockups sequentially (parallel causes issues with htmlToImage)
     */
    async function captureMockups(brandbook) {
        PdfTiming.start('captureMockups_total');

        // Suppress CORS errors from html-to-image
        const restoreConsole = suppressCorsErrors();

        // Embed fonts as base64 CSS for html-to-image
        const primaryFont = brandbook.typography.primary.family;
        const secondaryFont = brandbook.typography.secondary?.family || primaryFont;
        const fontsToLoad = [primaryFont];
        if (secondaryFont !== primaryFont) fontsToLoad.push(secondaryFont);
        const fontEmbedCSS = await embedFontsAsBase64(fontsToLoad);

        const mockupConfigs = [
            { id: 'mockup-business-card', title: 'Business Card', num: '05' },
            { id: 'mockup-social-avatar', title: 'Social Avatar', num: '06' },
            { id: 'mockup-letterhead', title: 'Letterhead', num: '07' },
            { id: 'mockup-envelope', title: 'Envelope', num: '08' },
            { id: 'mockup-presentation', title: 'Presentation', num: '09' }
        ];

        const captures = [];

        // Create overlay to hide capture process from user
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:#0f0f1a;z-index:100000;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.5rem;';
        overlay.textContent = 'Generating PDF...';
        document.body.appendChild(overlay);

        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:transparent;padding:20px;min-width:3000px;';
        document.body.appendChild(tempContainer);

        for (const config of mockupConfigs) {
            const mockupStartTime = performance.now();

            const element = document.getElementById(config.id);
            if (!element) continue;

            const wasActive = element.classList.contains('active');
            element.classList.add('active');

            try {
                tempContainer.innerHTML = '';
                const clone = element.cloneNode(true);
                clone.style.display = 'block';
                clone.classList.add('active');
                tempContainer.appendChild(clone);
                prepareCloneForCapture(clone, brandbook);

                // Wait for DOM settling - fonts are already loaded via FontFace API
                await new Promise(r => setTimeout(r, 50));

                // Use JPEG for ALL mockups - significantly reduces data size
                // which speeds up pdf.addImage() (the main bottleneck)
                tempContainer.style.background = '#0f0f1a';
                let imgData;

                // Time the actual htmlToImage conversion
                const htmlToImageStart = performance.now();
                imgData = await htmlToImage.toJpeg(tempContainer, {
                    pixelRatio: 1.0,  // Lower ratio = smaller image = faster pdf.addImage
                    quality: 0.85,
                    backgroundColor: '#0f0f1a',
                    cacheBust: true,
                    fontEmbedCSS: fontEmbedCSS
                });
                const htmlToImageDuration = performance.now() - htmlToImageStart;
                if (PdfTiming.enabled) {
                    console.log(`[PDF Timing] htmlToImage ${config.id}: ${htmlToImageDuration.toFixed(0)}ms`);
                }

                // Get dimensions via Image
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imgData;
                });

                captures.push({
                    ...config,
                    imgData,
                    width: img.width,
                    height: img.height,
                    format: 'JPEG'
                });

            } catch (e) {
                console.warn(`Could not capture ${config.id}:`, e);
            }

            if (!wasActive) element.classList.remove('active');

            // Record per-mockup timing
            const mockupDuration = performance.now() - mockupStartTime;
            PdfTiming.recordMockup(config.id, mockupDuration);
        }

        document.body.removeChild(tempContainer);
        document.body.removeChild(overlay);

        // Restore console.error
        restoreConsole();

        PdfTiming.end('captureMockups_total');
        return captures;
    }

    // Mockup layout configuration for PDF pages
    const MOCKUP_LAYOUTS = {
        'mockup-business-card': { yPos: 70, maxWidth: CONTENT_WIDTH },
        'mockup-social-avatar': { yPos: 70, maxWidth: CONTENT_WIDTH },
        'mockup-letterhead': { yPos: 70, maxWidth: CONTENT_WIDTH },
        'mockup-envelope': { yPos: 95, maxWidth: PAGE_WIDTH - 20 },
        'mockup-presentation': { yPos: 105, maxWidth: PAGE_WIDTH - 20 }
    };

    const DEFAULT_MOCKUP_LAYOUT = { yPos: 70, maxWidth: CONTENT_WIDTH };

    /**
     * Calculate scaled dimensions that fit within bounds while preserving aspect ratio
     */
    function calculateFitDimensions(sourceWidth, sourceHeight, maxWidth, maxHeight) {
        let width = maxWidth;
        let height = (sourceHeight / sourceWidth) * width;

        if (height > maxHeight) {
            height = maxHeight;
            width = (sourceWidth / sourceHeight) * height;
        }

        return { width, height };
    }

    /**
     * Add mockup pages from pre-captured images
     */
    function addMockupPagesFromCaptures(pdf, captures, brandbook) {
        let pageNum = BrandbookModule.getLogoUrl() ? 5 : 4;

        // Now add pages from captures (no more DOM manipulation)
        for (const capture of captures) {
            pdf.addPage();

            // Dark background
            pdf.setFillColor(15, 15, 26);
            pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

            // Header
            addModernPageHeader(pdf, capture.title, capture.num, brandbook);

            // Get layout configuration for this mockup type
            const layout = MOCKUP_LAYOUTS[capture.id] || DEFAULT_MOCKUP_LAYOUT;
            const maxHeight = PAGE_HEIGHT - 100;
            const { width, height } = calculateFitDimensions(capture.width, capture.height, layout.maxWidth, maxHeight);
            const xPos = (PAGE_WIDTH - width) / 2;

            pdf.addImage(capture.imgData, capture.format || 'PNG', xPos, layout.yPos, width, height);

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
        const primaryFont = brandbook.typography.primary.family;
        const secondaryFont = brandbook.typography.secondary?.family || primaryFont;

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

        // Business card container - stack vertically (one under another), 8x bigger
        const businessCard = clone.querySelector('.business-card');
        if (businessCard) {
            setStyle(businessCard, `
                display: flex !important;
                flex-direction: column !important;
                flex-wrap: nowrap !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 8rem !important;
                opacity: 1 !important;
                width: 100% !important;
                perspective: none !important;
            `);
        }

        // Business card front - original size (2880x1680)
        const cardFront = clone.querySelector('.business-card-front');
        if (cardFront) {
            setStyle(cardFront, `
                background-color: ${secondaryColor} !important;
                background-image: none !important;
                color: #ffffff !important;
                border-bottom: 32px solid ${primaryColor} !important;
                border-radius: 96px !important;
                padding: 192px !important;
                width: 2880px !important;
                height: 1680px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                box-shadow: 0 64px 256px rgba(0,0,0,0.4) !important;
                opacity: 1 !important;
                flex-shrink: 0 !important;
            `);

            const cardLogo = cardFront.querySelector('.card-logo');
            if (cardLogo) {
                const logoUrl = BrandbookModule.getLogoUrl();
                const bgImage = logoUrl ? `url(${logoUrl})` : 'none';
                setStyle(cardLogo, `width: 512px !important; height: 512px !important; margin-bottom: 8rem !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; background-image: ${bgImage} !important; display: block !important;`);
            }

            const cardBrandName = cardFront.querySelector('.card-brand-name');
            if (cardBrandName) setStyle(cardBrandName, `font-family: '${primaryFont}', sans-serif !important; font-size: 11rem !important; font-weight: 700 !important; margin-bottom: 3rem !important;`);

            const cardTagline = cardFront.querySelector('.card-tagline');
            if (cardTagline) setStyle(cardTagline, `font-family: '${secondaryFont}', sans-serif !important; font-size: 6rem !important; opacity: 0.8 !important;`);
        }

        // Business card back - original size (2880x1680)
        const cardBack = clone.querySelector('.business-card-back');
        if (cardBack) {
            setStyle(cardBack, `
                background: #ffffff !important;
                background-color: #ffffff !important;
                border-left: 32px solid ${primaryColor} !important;
                border-radius: 96px !important;
                padding: 192px !important;
                width: 2880px !important;
                height: 1680px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                box-shadow: 0 64px 256px rgba(0,0,0,0.4) !important;
                opacity: 1 !important;
                flex-shrink: 0 !important;
                filter: none !important;
                backdrop-filter: none !important;
            `);

            const cardContact = cardBack.querySelector('.card-contact');
            if (cardContact) setStyle(cardContact, `display: flex !important; flex-direction: column !important; width: 100% !important;`);

            const contactName = cardBack.querySelector('.contact-name');
            if (contactName) setStyle(contactName, `font-family: '${primaryFont}', sans-serif !important; color: ${primaryColor} !important; font-weight: bold !important; font-size: 9rem !important; margin-bottom: 2rem !important; display: block !important;`);

            const contactTitle = cardBack.querySelector('.contact-title');
            if (contactTitle) setStyle(contactTitle, `font-family: '${secondaryFont}', sans-serif !important; font-size: 6rem !important; opacity: 0.6 !important; margin-bottom: 10rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; display: block !important; color: #333 !important;`);

            const contactInfo = cardBack.querySelector('.contact-info');
            if (contactInfo) {
                setStyle(contactInfo, `font-family: '${secondaryFont}', sans-serif !important; font-size: 6.5rem !important; gap: 3rem !important; display: flex !important; flex-direction: column !important; color: #333 !important;`);
                contactInfo.querySelectorAll('span').forEach(span => {
                    setStyle(span, `font-family: '${secondaryFont}', sans-serif !important; display: block !important; font-size: 6.5rem !important; color: #333 !important;`);
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
                font-family: '${secondaryFont}', sans-serif !important;
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
        if (platformName) setStyle(platformName, `font-family: '${primaryFont}', sans-serif !important; font-size: 96px !important; font-weight: 700 !important; color: #1a1a2e !important;`);

        const platformHandle = clone.querySelector('.platform-handle');
        if (platformHandle) setStyle(platformHandle, `font-family: '${secondaryFont}', sans-serif !important; font-size: 72px !important; color: #6b7280 !important;`);

        // Letterhead - optimized size (3000x4125)
        const letterhead = clone.querySelector('.letterhead');
        if (letterhead) setStyle(letterhead, `
            background: #ffffff !important;
            background-color: #ffffff !important;
            opacity: 1 !important;
            box-shadow: 0 36px 180px rgba(0,0,0,0.3) !important;
            border-radius: 36px !important;
            filter: none !important;
            backdrop-filter: none !important;
            width: 3000px !important;
            min-width: 3000px !important;
            max-width: 3000px !important;
            height: 4125px !important;
            min-height: 4125px !important;
            padding: 150px !important;
            display: flex !important;
            flex-direction: column !important;
            margin: 0 auto !important;
            color: #1a1a2e !important;
            box-sizing: border-box !important;
        `);

        const letterheadHeader = clone.querySelector('.letterhead-header');
        if (letterheadHeader) setStyle(letterheadHeader, `
            border-bottom: 9px solid ${primaryColor} !important;
            color: ${primaryColor} !important;
            display: flex !important;
            align-items: center !important;
            gap: 3rem !important;
            padding-bottom: 3rem !important;
            margin-bottom: 4.5rem !important;
            width: 100% !important;
            flex-shrink: 0 !important;
        `);

        const letterheadLogo = clone.querySelector('.letterhead-logo');
        if (letterheadLogo) {
            const logoUrl = BrandbookModule.getLogoUrl();
            const bgImage = logoUrl ? `url(${logoUrl})` : 'none';
            setStyle(letterheadLogo, `width: 186px !important; height: 186px !important; background-size: contain !important; background-repeat: no-repeat !important; background-position: center !important; flex-shrink: 0 !important; background-image: ${bgImage} !important;`);
        }

        const letterheadBrand = clone.querySelector('.letterhead-brand');
        if (letterheadBrand) setStyle(letterheadBrand, `font-family: '${primaryFont}', sans-serif !important; font-size: 5.6rem !important; font-weight: 700 !important;`);

        const letterheadContent = clone.querySelector('.letterhead-content');
        if (letterheadContent) setStyle(letterheadContent, `font-family: '${secondaryFont}', sans-serif !important; flex: 1 !important; font-size: 3.3rem !important; line-height: 1.8 !important; width: 100% !important;`);

        const letterDate = clone.querySelector('.letter-date');
        if (letterDate) setStyle(letterDate, `font-family: '${secondaryFont}', sans-serif !important; margin-bottom: 3.75rem !important; opacity: 0.6 !important; font-size: 2.85rem !important;`);

        const letterGreeting = clone.querySelector('.letter-greeting');
        if (letterGreeting) setStyle(letterGreeting, `font-family: '${secondaryFont}', sans-serif !important; margin-bottom: 3rem !important; font-weight: 500 !important; font-size: 3.3rem !important;`);

        const letterBody = clone.querySelector('.letter-body');
        if (letterBody) {
            setStyle(letterBody, `font-family: '${secondaryFont}', sans-serif !important; font-size: 3.3rem !important; width: 100% !important;`);
            letterBody.querySelectorAll('p').forEach(p => setStyle(p, `font-family: '${secondaryFont}', sans-serif !important; margin-bottom: 3rem !important; opacity: 0.8 !important;`));
        }

        const letterSignature = clone.querySelector('.letter-signature');
        if (letterSignature) setStyle(letterSignature, `font-family: '${secondaryFont}', sans-serif !important; margin-top: 6rem !important; font-size: 3.3rem !important;`);

        const signatureName = clone.querySelector('.signature-name');
        if (signatureName) setStyle(signatureName, `font-family: '${primaryFont}', sans-serif !important; color: ${primaryColor} !important; font-weight: 700 !important; margin-top: 3rem !important; font-size: 3.3rem !important;`);

        const signatureTitle = clone.querySelector('.signature-title');
        if (signatureTitle) setStyle(signatureTitle, `font-family: '${secondaryFont}', sans-serif !important; font-size: 2.85rem !important; opacity: 0.6 !important;`);

        const letterheadFooter = clone.querySelector('.letterhead-footer');
        if (letterheadFooter) setStyle(letterheadFooter, `
            font-family: '${secondaryFont}', sans-serif !important;
            border-top: 4.5px solid ${secondaryColor} !important;
            color: ${secondaryColor} !important;
            display: flex !important;
            justify-content: space-between !important;
            gap: 3.75rem !important;
            padding-top: 3.75rem !important;
            font-size: 2.85rem !important;
            opacity: 0.5 !important;
            width: 100% !important;
            flex-shrink: 0 !important;
            margin-top: auto !important;
        `);

        // Envelope - optimized size (2500x1250)
        const envelope = clone.querySelector('.envelope');
        if (envelope) {
            setStyle(envelope, `
                background: #ffffff !important;
                background-color: #ffffff !important;
                border-top: 14px solid ${primaryColor} !important;
                border-radius: 58px !important;
                padding: 0 !important;
                box-shadow: 0 19px 96px rgba(0,0,0,0.3) !important;
                opacity: 1 !important;
                filter: none !important;
                backdrop-filter: none !important;
                width: 2500px !important;
                min-width: 2500px !important;
                height: 1250px !important;
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
                left: 120px !important;
                top: 120px !important;
                text-align: left !important;
                width: 720px !important;
            `);
        }

        const envelopeLogo = clone.querySelector('.envelope-logo');
        if (envelopeLogo) {
            const logoUrl = BrandbookModule.getLogoUrl();
            const bgImage = logoUrl ? `url(${logoUrl})` : 'none';
            setStyle(envelopeLogo, `
                width: 154px !important;
                height: 154px !important;
                background-size: contain !important;
                background-repeat: no-repeat !important;
                background-position: center !important;
                margin-bottom: 29px !important;
                display: block !important;
                background-image: ${bgImage} !important;
            `);
        }

        const envelopeBrand = clone.querySelector('.envelope-brand');
        if (envelopeBrand) {
            setStyle(envelopeBrand, `
                font-family: '${primaryFont}', sans-serif !important;
                color: ${primaryColor} !important;
                font-weight: 700 !important;
                font-size: 4.2rem !important;
                margin-bottom: 10px !important;
                display: block !important;
            `);
        }

        const envelopeAddress = clone.querySelector('.envelope-address');
        if (envelopeAddress) {
            setStyle(envelopeAddress, `
                font-family: '${secondaryFont}', sans-serif !important;
                opacity: 0.6 !important;
                line-height: 1.5 !important;
                font-size: 3rem !important;
                display: block !important;
            `);
        }

        const envelopeRecipient = clone.querySelector('.envelope-recipient');
        if (envelopeRecipient) {
            setStyle(envelopeRecipient, `
                font-family: '${secondaryFont}', sans-serif !important;
                display: block !important;
                position: absolute !important;
                right: 240px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                text-align: center !important;
                font-size: 4.2rem !important;
                line-height: 1.8 !important;
                width: 840px !important;
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
                min-width: 2400px !important;
            `);
        }

        // Presentation slide - optimized size (2400x1350)
        const slide = clone.querySelector('.presentation-slide');
        if (slide) {
            setStyle(slide, `
                background: #ffffff !important;
                background-color: #ffffff !important;
                border-bottom: 18px solid ${primaryColor} !important;
                border-radius: 30px !important;
                box-shadow: 0 18px 90px rgba(0,0,0,0.3) !important;
                padding: 120px !important;
                opacity: 1 !important;
                filter: none !important;
                backdrop-filter: none !important;
                width: 2400px !important;
                min-width: 2400px !important;
                height: 1350px !important;
                min-height: 1350px !important;
                display: flex !important;
                flex-direction: column !important;
                position: relative !important;
                margin: 0 auto !important;
                color: #1a1a2e !important;
                box-sizing: border-box !important;
            `);
        }

        const slideHeader = clone.querySelector('.slide-header');
        if (slideHeader) setStyle(slideHeader, 'display: flex !important; justify-content: flex-end !important; margin-bottom: 75px !important;');

        const slideContent = clone.querySelector('.slide-content');
        if (slideContent) setStyle(slideContent, 'flex: 1 !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; text-align: center !important;');

        const slideTitle = clone.querySelector('.slide-title');
        if (slideTitle) setStyle(slideTitle, `font-family: '${primaryFont}', sans-serif !important; color: ${secondaryColor} !important; font-size: 120px !important; font-weight: bold !important; margin-bottom: 38px !important; display: block !important;`);

        const slideSubtitle = clone.querySelector('.slide-subtitle');
        if (slideSubtitle) setStyle(slideSubtitle, `font-family: '${secondaryFont}', sans-serif !important; color: #666666 !important; font-size: 60px !important; display: block !important;`);

        const slideFooter = clone.querySelector('.slide-footer');
        if (slideFooter) setStyle(slideFooter, `font-family: '${secondaryFont}', sans-serif !important; display: flex !important; justify-content: space-between !important; font-size: 38px !important; color: #999999 !important; margin-top: auto !important; width: 100% !important;`);

        const slideLogo = clone.querySelector('.slide-logo');
        if (slideLogo) {
            const logoUrl = BrandbookModule.getLogoUrl();
            const bgImage = logoUrl ? `url(${logoUrl})` : 'none';
            setStyle(slideLogo, `width: 240px !important; height: 240px !important; background-size: contain !important; background-repeat: no-repeat !important; background-image: ${bgImage} !important; display: block !important;`);
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
            await new Promise(resolve => setTimeout(resolve, 50));

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

    // Configuration for single mockup test PDFs
    const SINGLE_MOCKUP_CONFIGS = {
        'mockup-letterhead': { title: 'Letterhead', pageNum: '07', fileName: 'letterhead-test.pdf' },
        'mockup-business-card': { title: 'Business Card', pageNum: '05', fileName: 'business-card-test.pdf' },
        'mockup-social-avatar': { title: 'Social Avatar', pageNum: '06', fileName: 'social-avatar-test.pdf' },
        'mockup-envelope': { title: 'Envelope', pageNum: '08', fileName: 'envelope-test.pdf' }
    };

    /**
     * Generate a single mockup page PDF for quick testing
     */
    async function generateSingleMockupPdf(mockupId) {
        const config = SINGLE_MOCKUP_CONFIGS[mockupId];
        if (!config) {
            console.warn(`Unknown mockup ID: ${mockupId}`);
            return;
        }

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
        addModernPageHeader(pdf, config.title, config.pageNum, brandbook);

        // Capture the mockup
        const capture = await captureSingleMockup(mockupId, brandbook);

        if (capture) {
            const layout = MOCKUP_LAYOUTS[mockupId] || DEFAULT_MOCKUP_LAYOUT;
            const maxHeight = PAGE_HEIGHT - 100;
            const { width, height } = calculateFitDimensions(capture.width, capture.height, layout.maxWidth, maxHeight);
            const xPos = (PAGE_WIDTH - width) / 2;

            pdf.addImage(capture.imgData, 'PNG', xPos, layout.yPos, width, height);
        }

        addPageNumber(pdf, 1);

        pdf.save(config.fileName);
    }

    /**
     * Capture a single mockup for testing
     */
    async function captureSingleMockup(mockupId, brandbook) {
        const element = document.getElementById(mockupId);
        if (!element) return null;

        // Embed fonts as base64 CSS
        const primaryFont = brandbook.typography.primary.family;
        const secondaryFont = brandbook.typography.secondary?.family || primaryFont;
        const fontsToLoad = [primaryFont];
        if (secondaryFont !== primaryFont) fontsToLoad.push(secondaryFont);
        const fontEmbedCSS = await embedFontsAsBase64(fontsToLoad);

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

            await new Promise(r => setTimeout(r, 50));

            const pngData = await htmlToImage.toPng(tempContainer, {
                pixelRatio: 1.5,
                cacheBust: true,
                fontEmbedCSS: fontEmbedCSS
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
        generateSingleMockupPdf,
        timing: PdfTiming
    };
})();

if (typeof window !== 'undefined') {
    window.PdfModule = PdfModule;
}

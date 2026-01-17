/**
 * Mockups Module
 * Handles rendering and updating mockup previews
 */

const MockupsModule = (function() {
    function getBrandData(brandbook) {
        return {
            primaryColor: brandbook.colors.primary.hex,
            secondaryColor: brandbook.colors.secondary.hex,
            accentColor: brandbook.colors.accent?.hex || brandbook.colors.primary.hex,
            primaryFont: brandbook.typography.primary.family,
            secondaryFont: brandbook.typography.secondary?.family || brandbook.typography.primary.family,
            logoUrl: BrandbookModule.getLogoUrl(),
            brandName: brandbook.meta.name
        };
    }

    function setLogoBackground(element, logoUrl) {
        if (!element) return;
        element.style.backgroundImage = logoUrl ? `url(${logoUrl})` : 'none';
    }

    function updateAll() {
        const brandbook = BrandbookModule.getBrandbook();

        updateBusinessCard(brandbook);
        updateLetterhead(brandbook);
        updateEnvelope(brandbook);
        updateSocialAvatar(brandbook);
        updatePresentation(brandbook);
    }

    /**
     * Update business card mockup
     * @param {Object} brandbook - Brandbook data
     */
    function updateBusinessCard(brandbook) {
        const mockup = document.getElementById('mockup-business-card');
        if (!mockup) return;

        const { primaryColor, secondaryColor, primaryFont, secondaryFont, logoUrl, brandName } = getBrandData(brandbook);

        const front = mockup.querySelector('.business-card-front');
        front.style.background = secondaryColor;
        front.style.color = '#ffffff';
        front.style.borderBottom = `4px solid ${primaryColor}`;

        setLogoBackground(front.querySelector('.card-logo'), logoUrl);

        const cardBrandName = front.querySelector('.card-brand-name');
        cardBrandName.textContent = brandName;
        cardBrandName.style.fontFamily = `'${primaryFont}', sans-serif`;

        front.querySelector('.card-tagline').style.fontFamily = `'${secondaryFont}', sans-serif`;

        const back = mockup.querySelector('.business-card-back');
        back.style.borderLeft = `4px solid ${primaryColor}`;
        back.style.background = '#ffffff';
        back.style.color = secondaryColor;

        const contactName = back.querySelector('.contact-name');
        contactName.style.fontFamily = `'${primaryFont}', sans-serif`;
        contactName.style.color = primaryColor;

        back.querySelector('.contact-title').style.fontFamily = `'${secondaryFont}', sans-serif`;
        back.querySelector('.contact-info').style.fontFamily = `'${secondaryFont}', sans-serif`;
    }

    /**
     * Update letterhead mockup
     * @param {Object} brandbook - Brandbook data
     */
    function updateLetterhead(brandbook) {
        const mockup = document.getElementById('mockup-letterhead');
        if (!mockup) return;

        const { primaryColor, secondaryColor, primaryFont, secondaryFont, logoUrl, brandName } = getBrandData(brandbook);
        const letterhead = mockup.querySelector('.letterhead');

        const header = letterhead.querySelector('.letterhead-header');
        header.style.borderBottomColor = primaryColor;
        header.style.color = primaryColor;

        setLogoBackground(header.querySelector('.letterhead-logo'), logoUrl);

        const letterheadBrand = header.querySelector('.letterhead-brand');
        letterheadBrand.textContent = brandName;
        letterheadBrand.style.fontFamily = `'${primaryFont}', sans-serif`;

        const content = letterhead.querySelector('.letterhead-content');
        content.style.fontFamily = `'${secondaryFont}', sans-serif`;

        const signatureName = content.querySelector('.signature-name');
        signatureName.style.fontFamily = `'${primaryFont}', sans-serif`;
        signatureName.style.color = primaryColor;

        const footer = letterhead.querySelector('.letterhead-footer');
        footer.style.borderTopColor = secondaryColor;
        footer.style.color = secondaryColor;
    }

    /**
     * Update envelope mockup
     * @param {Object} brandbook - Brandbook data
     */
    function updateEnvelope(brandbook) {
        const mockup = document.getElementById('mockup-envelope');
        if (!mockup) return;

        const { primaryColor, primaryFont, secondaryFont, logoUrl, brandName } = getBrandData(brandbook);
        const envelope = mockup.querySelector('.envelope');
        envelope.style.borderTop = `3px solid ${primaryColor}`;

        setLogoBackground(envelope.querySelector('.envelope-logo'), logoUrl);

        const envelopeBrand = envelope.querySelector('.envelope-brand');
        envelopeBrand.textContent = brandName;
        envelopeBrand.style.fontFamily = `'${primaryFont}', sans-serif`;
        envelopeBrand.style.color = primaryColor;

        envelope.querySelector('.envelope-address').style.fontFamily = `'${secondaryFont}', sans-serif`;
        envelope.querySelector('.envelope-recipient').style.fontFamily = `'${secondaryFont}', sans-serif`;
    }

    /**
     * Update social avatar mockup
     * @param {Object} brandbook - Brandbook data
     */
    function updateSocialAvatar(brandbook) {
        const mockup = document.getElementById('mockup-social-avatar');
        if (!mockup) return;

        const { primaryColor, secondaryColor, primaryFont, logoUrl, brandName } = getBrandData(brandbook);
        const gradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

        const avatar = mockup.querySelector('.social-avatar');
        avatar.style.background = gradient;
        setLogoBackground(avatar.querySelector('.avatar-logo'), logoUrl);

        const platformAvatar = mockup.querySelector('.platform-avatar');
        platformAvatar.style.background = gradient;
        if (logoUrl) {
            platformAvatar.style.backgroundImage = `url(${logoUrl})`;
            platformAvatar.style.backgroundSize = 'contain';
            platformAvatar.style.backgroundPosition = 'center';
            platformAvatar.style.backgroundRepeat = 'no-repeat';
        }

        const platformName = mockup.querySelector('.platform-name');
        platformName.textContent = brandName;
        platformName.style.fontFamily = `'${primaryFont}', sans-serif`;

        mockup.querySelector('.platform-handle').textContent = '@' + brandName.toLowerCase().replace(/\s+/g, '');
    }

    /**
     * Update presentation slide mockup
     * @param {Object} brandbook - Brandbook data
     */
    function updatePresentation(brandbook) {
        const mockup = document.getElementById('mockup-presentation');
        if (!mockup) return;

        const { primaryColor, secondaryColor, primaryFont, secondaryFont, logoUrl, brandName } = getBrandData(brandbook);

        const slide = mockup.querySelector('.presentation-slide');
        slide.style.background = '#ffffff';
        slide.style.borderBottom = `5px solid ${primaryColor}`;

        setLogoBackground(slide.querySelector('.slide-logo'), logoUrl);

        const slideTitle = slide.querySelector('.slide-title');
        slideTitle.textContent = `Welcome to ${brandName}`;
        slideTitle.style.fontFamily = `'${primaryFont}', sans-serif`;
        slideTitle.style.color = secondaryColor;

        slide.querySelector('.slide-subtitle').style.fontFamily = `'${secondaryFont}', sans-serif`;
    }

    /**
     * Switch active mockup tab
     * @param {string} mockupId - Mockup ID to show
     */
    function switchMockup(mockupId) {
        // Update tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const isActive = btn.dataset.mockup === mockupId;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Update mockups
        document.querySelectorAll('.mockup').forEach(mockup => {
            mockup.classList.toggle('active', mockup.id === `mockup-${mockupId}`);
        });
    }

    /**
     * Initialize mockup tabs
     */
    function initTabs() {
        const tabs = document.querySelectorAll('.tab-btn');

        tabs.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                switchMockup(btn.dataset.mockup);
            });

            // Keyboard navigation for tabs
            btn.addEventListener('keydown', (e) => {
                let targetIndex = index;

                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    targetIndex = (index + 1) % tabs.length;
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    targetIndex = (index - 1 + tabs.length) % tabs.length;
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    targetIndex = 0;
                } else if (e.key === 'End') {
                    e.preventDefault();
                    targetIndex = tabs.length - 1;
                } else {
                    return;
                }

                tabs[targetIndex].focus();
                switchMockup(tabs[targetIndex].dataset.mockup);
            });
        });
    }

    /**
     * Clone mockups for PDF rendering
     * @param {HTMLElement} container - Container to clone mockups into
     */
    function cloneForPdf(container) {
        container.innerHTML = '';

        const brandbook = BrandbookModule.getBrandbook();
        const mockupIds = ['business-card', 'letterhead', 'envelope', 'social-avatar', 'presentation'];

        mockupIds.forEach(id => {
            const original = document.getElementById(`mockup-${id}`);
            if (original) {
                const clone = original.cloneNode(true);
                clone.classList.add('active');
                clone.style.marginBottom = '40px';
                container.appendChild(clone);
            }
        });
    }

    return {
        updateAll,
        updateBusinessCard,
        updateLetterhead,
        updateEnvelope,
        updateSocialAvatar,
        updatePresentation,
        switchMockup,
        initTabs,
        cloneForPdf
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MockupsModule = MockupsModule;
}

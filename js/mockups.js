/**
 * Mockups Module
 * Handles rendering and updating mockup previews
 */

const MockupsModule = (function() {
    /**
     * Update all mockups with current brandbook data
     */
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

        const primaryColor = brandbook.colors.primary.hex;
        const secondaryColor = brandbook.colors.secondary.hex;
        const primaryFont = brandbook.typography.primary.family;
        const secondaryFont = brandbook.typography.secondary?.family || primaryFont;
        const logoUrl = BrandbookModule.getLogoUrl();
        const brandName = brandbook.meta.name;

        // Front card - use secondary color as solid background for better readability
        const front = mockup.querySelector('.business-card-front');
        front.style.background = secondaryColor;
        front.style.color = '#ffffff';
        front.style.borderBottom = `4px solid ${primaryColor}`;

        const cardLogo = front.querySelector('.card-logo');
        if (logoUrl) {
            cardLogo.style.backgroundImage = `url(${logoUrl})`;
        } else {
            cardLogo.style.backgroundImage = 'none';
        }

        const cardBrandName = front.querySelector('.card-brand-name');
        cardBrandName.textContent = brandName;
        cardBrandName.style.fontFamily = `'${primaryFont}', sans-serif`;

        const cardTagline = front.querySelector('.card-tagline');
        cardTagline.style.fontFamily = `'${secondaryFont}', sans-serif`;

        // Back card
        const back = mockup.querySelector('.business-card-back');
        back.style.borderLeft = `4px solid ${primaryColor}`;
        back.style.background = '#ffffff';
        back.style.color = secondaryColor;

        const contactName = back.querySelector('.contact-name');
        contactName.style.fontFamily = `'${primaryFont}', sans-serif`;
        contactName.style.color = primaryColor;

        const contactTitle = back.querySelector('.contact-title');
        contactTitle.style.fontFamily = `'${secondaryFont}', sans-serif`;
        contactTitle.style.color = '#666666';

        const contactInfo = back.querySelector('.contact-info');
        contactInfo.style.fontFamily = `'${secondaryFont}', sans-serif`;
        contactInfo.style.color = '#333333';
    }

    /**
     * Update letterhead mockup
     * @param {Object} brandbook - Brandbook data
     */
    function updateLetterhead(brandbook) {
        const mockup = document.getElementById('mockup-letterhead');
        if (!mockup) return;

        const primaryColor = brandbook.colors.primary.hex;
        const secondaryColor = brandbook.colors.secondary.hex;
        const primaryFont = brandbook.typography.primary.family;
        const secondaryFont = brandbook.typography.secondary?.family || primaryFont;
        const logoUrl = BrandbookModule.getLogoUrl();
        const brandName = brandbook.meta.name;

        const letterhead = mockup.querySelector('.letterhead');

        // Header
        const header = letterhead.querySelector('.letterhead-header');
        header.style.borderBottomColor = primaryColor;
        header.style.color = primaryColor;

        const letterheadLogo = header.querySelector('.letterhead-logo');
        if (logoUrl) {
            letterheadLogo.style.backgroundImage = `url(${logoUrl})`;
        } else {
            letterheadLogo.style.backgroundImage = 'none';
        }

        const letterheadBrand = header.querySelector('.letterhead-brand');
        letterheadBrand.textContent = brandName;
        letterheadBrand.style.fontFamily = `'${primaryFont}', sans-serif`;

        // Content
        const content = letterhead.querySelector('.letterhead-content');
        content.style.fontFamily = `'${secondaryFont}', sans-serif`;

        const signatureName = content.querySelector('.signature-name');
        signatureName.style.fontFamily = `'${primaryFont}', sans-serif`;
        signatureName.style.color = primaryColor;

        // Footer
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

        const primaryColor = brandbook.colors.primary.hex;
        const primaryFont = brandbook.typography.primary.family;
        const secondaryFont = brandbook.typography.secondary?.family || primaryFont;
        const logoUrl = BrandbookModule.getLogoUrl();
        const brandName = brandbook.meta.name;

        const envelope = mockup.querySelector('.envelope');
        envelope.style.borderTop = `3px solid ${primaryColor}`;

        // Sender section
        const envelopeLogo = envelope.querySelector('.envelope-logo');
        if (logoUrl) {
            envelopeLogo.style.backgroundImage = `url(${logoUrl})`;
        } else {
            envelopeLogo.style.backgroundImage = 'none';
        }

        const envelopeBrand = envelope.querySelector('.envelope-brand');
        envelopeBrand.textContent = brandName;
        envelopeBrand.style.fontFamily = `'${primaryFont}', sans-serif`;
        envelopeBrand.style.color = primaryColor;

        const envelopeAddress = envelope.querySelector('.envelope-address');
        envelopeAddress.style.fontFamily = `'${secondaryFont}', sans-serif`;

        // Recipient
        const recipient = envelope.querySelector('.envelope-recipient');
        recipient.style.fontFamily = `'${secondaryFont}', sans-serif`;
    }

    /**
     * Update social avatar mockup
     * @param {Object} brandbook - Brandbook data
     */
    function updateSocialAvatar(brandbook) {
        const mockup = document.getElementById('mockup-social-avatar');
        if (!mockup) return;

        const primaryColor = brandbook.colors.primary.hex;
        const secondaryColor = brandbook.colors.secondary.hex;
        const primaryFont = brandbook.typography.primary.family;
        const logoUrl = BrandbookModule.getLogoUrl();
        const brandName = brandbook.meta.name;

        // Main avatar
        const avatar = mockup.querySelector('.social-avatar');
        avatar.style.background = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

        const avatarLogo = avatar.querySelector('.avatar-logo');
        if (logoUrl) {
            avatarLogo.style.backgroundImage = `url(${logoUrl})`;
        } else {
            avatarLogo.style.backgroundImage = 'none';
        }

        // Platform preview
        const platformAvatar = mockup.querySelector('.platform-avatar');
        platformAvatar.style.background = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
        if (logoUrl) {
            platformAvatar.style.backgroundImage = `url(${logoUrl})`;
            platformAvatar.style.backgroundSize = 'contain';
            platformAvatar.style.backgroundPosition = 'center';
            platformAvatar.style.backgroundRepeat = 'no-repeat';
        }

        const platformName = mockup.querySelector('.platform-name');
        platformName.textContent = brandName;
        platformName.style.fontFamily = `'${primaryFont}', sans-serif`;

        const platformHandle = mockup.querySelector('.platform-handle');
        platformHandle.textContent = '@' + brandName.toLowerCase().replace(/\s+/g, '');
    }

    /**
     * Update presentation slide mockup
     * @param {Object} brandbook - Brandbook data
     */
    function updatePresentation(brandbook) {
        const mockup = document.getElementById('mockup-presentation');
        if (!mockup) return;

        const primaryColor = brandbook.colors.primary.hex;
        const secondaryColor = brandbook.colors.secondary.hex;
        const accentColor = brandbook.colors.accent?.hex || primaryColor;
        const primaryFont = brandbook.typography.primary.family;
        const secondaryFont = brandbook.typography.secondary?.family || primaryFont;
        const logoUrl = BrandbookModule.getLogoUrl();
        const brandName = brandbook.meta.name;

        const slide = mockup.querySelector('.presentation-slide');
        slide.style.background = '#ffffff';
        slide.style.borderBottom = `5px solid ${primaryColor}`;

        // Logo
        const slideLogo = slide.querySelector('.slide-logo');
        if (logoUrl) {
            slideLogo.style.backgroundImage = `url(${logoUrl})`;
        } else {
            slideLogo.style.backgroundImage = 'none';
        }

        // Content
        const slideTitle = slide.querySelector('.slide-title');
        slideTitle.textContent = `Welcome to ${brandName}`;
        slideTitle.style.fontFamily = `'${primaryFont}', sans-serif`;
        slideTitle.style.color = secondaryColor;

        const slideSubtitle = slide.querySelector('.slide-subtitle');
        slideSubtitle.style.fontFamily = `'${secondaryFont}', sans-serif`;
        slideSubtitle.style.color = '#666666';

        // Footer
        const slideFooter = slide.querySelector('.slide-footer');
        slideFooter.style.color = '#999999';
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

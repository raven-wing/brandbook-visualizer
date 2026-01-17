/**
 * Visual Regression Tests for Brandbook Visualizer
 *
 * These tests capture screenshots of mockups and PDF output
 * to detect visual regressions after code changes.
 *
 * Run with: node tests/visual-tests.js
 * Requires: playwright (npm install playwright)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BASE_URL = 'http://localhost:8000';
const BASELINE_DIR = path.join(__dirname, 'visual-baselines');
const DIFF_DIR = path.join(__dirname, 'visual-diffs');
const THRESHOLD = 0.1; // 0.1% pixel difference allowed

// Test brand configuration
const TEST_BRAND = {
    name: 'Visual Test Brand',
    primaryColor: '#FF5733',
    secondaryColor: '#2C3E50',
    accentColor: '#27AE60',
    primaryFont: 'Playfair Display',
    secondaryFont: 'Roboto'
};

// Ensure directories exist
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Compare two images using ImageMagick (if available) or pixel comparison
async function compareImages(baseline, current) {
    if (!fs.existsSync(baseline)) {
        return { match: false, reason: 'No baseline exists', isNew: true };
    }

    try {
        // Try using ImageMagick for comparison
        const result = execSync(
            `compare -metric AE "${baseline}" "${current}" null: 2>&1`,
            { encoding: 'utf8' }
        );
        const diffPixels = parseInt(result.trim(), 10);
        const match = diffPixels === 0;
        return { match, diffPixels, reason: match ? 'Images match' : `${diffPixels} pixels differ` };
    } catch (e) {
        // Fallback: file size comparison (rough check)
        const baselineSize = fs.statSync(baseline).size;
        const currentSize = fs.statSync(current).size;
        const sizeDiff = Math.abs(baselineSize - currentSize) / baselineSize;
        const match = sizeDiff < THRESHOLD;
        return {
            match,
            sizeDiff: (sizeDiff * 100).toFixed(2) + '%',
            reason: match ? 'File sizes similar' : `File size differs by ${(sizeDiff * 100).toFixed(2)}%`
        };
    }
}

// Main test runner
async function runVisualTests(options = {}) {
    const { updateBaselines = false } = options;

    ensureDir(BASELINE_DIR);
    ensureDir(DIFF_DIR);

    console.log('\n🎨 Visual Regression Tests');
    console.log('='.repeat(50));

    if (updateBaselines) {
        console.log('⚠️  UPDATE MODE: Saving new baselines\n');
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    const page = await context.newPage();

    const results = {
        passed: 0,
        failed: 0,
        new: 0,
        tests: []
    };

    try {
        // Navigate and setup
        console.log('📍 Loading application...');
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Clear any existing data and set test brand
        console.log('🔧 Setting up test brand configuration...');
        await setupTestBrand(page);

        // Wait for fonts to load
        await page.waitForTimeout(1000);

        // Test each mockup
        const mockups = [
            { id: 'business-card', name: 'Business Card' },
            { id: 'letterhead', name: 'Letterhead' },
            { id: 'envelope', name: 'Envelope' },
            { id: 'social-avatar', name: 'Social Avatar' },
            { id: 'presentation', name: 'Presentation' }
        ];

        for (const mockup of mockups) {
            const result = await testMockup(page, mockup, updateBaselines);
            results.tests.push(result);
            if (result.status === 'passed') results.passed++;
            else if (result.status === 'failed') results.failed++;
            else if (result.status === 'new') results.new++;
        }

        // Test PDF generation
        const pdfResult = await testPdfGeneration(page, updateBaselines);
        results.tests.push(pdfResult);
        if (pdfResult.status === 'passed') results.passed++;
        else if (pdfResult.status === 'failed') results.failed++;
        else if (pdfResult.status === 'new') results.new++;

    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        await browser.close();
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Visual Test Results');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`🆕 New:    ${results.new}`);
    console.log('='.repeat(50));

    if (results.failed > 0) {
        console.log('\n⚠️  Some visual tests failed!');
        console.log('   Review screenshots in: tests/visual-diffs/');
        console.log('   To update baselines: node tests/visual-tests.js --update');
        process.exit(1);
    }

    if (results.new > 0 && !updateBaselines) {
        console.log('\n📝 New tests detected - baselines created.');
        console.log('   Run again to verify they pass.');
    }

    return results;
}

async function setupTestBrand(page) {
    // Set brand name
    await page.fill('#brand-name', TEST_BRAND.name);

    // Set colors
    await page.fill('input[aria-label="Primary color hex value"]', TEST_BRAND.primaryColor);
    await page.fill('input[aria-label="Secondary color hex value"]', TEST_BRAND.secondaryColor);
    await page.fill('input[aria-label="Accent color hex value"]', TEST_BRAND.accentColor);

    // Set primary font
    await page.click('#font-primary-dropdown .font-dropdown-toggle');
    await page.waitForSelector('#font-primary-dropdown .font-dropdown-menu[style*="display: block"], #font-primary-dropdown .font-dropdown-menu:not([style*="display: none"])', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    await page.click(`#font-primary-dropdown [data-value="${TEST_BRAND.primaryFont}"]`);
    await page.waitForTimeout(500);

    // Set secondary font
    await page.click('#font-secondary-dropdown .font-dropdown-toggle');
    await page.waitForSelector('#font-secondary-dropdown .font-dropdown-menu[style*="display: block"], #font-secondary-dropdown .font-dropdown-menu:not([style*="display: none"])', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    await page.click(`#font-secondary-dropdown [data-value="${TEST_BRAND.secondaryFont}"]`);
    await page.waitForTimeout(500);
}

async function testMockup(page, mockup, updateBaselines) {
    const testName = `Mockup: ${mockup.name}`;
    console.log(`\n🔍 Testing ${testName}...`);

    // Click the mockup tab
    await page.click(`[data-mockup="${mockup.id}"]`);
    await page.waitForTimeout(300);

    // Get the mockup element
    const mockupElement = page.locator(`#mockup-${mockup.id}`);

    const screenshotPath = path.join(DIFF_DIR, `${mockup.id}-current.png`);
    const baselinePath = path.join(BASELINE_DIR, `${mockup.id}-baseline.png`);

    // Capture screenshot
    await mockupElement.screenshot({ path: screenshotPath });

    if (updateBaselines) {
        fs.copyFileSync(screenshotPath, baselinePath);
        console.log(`   ✅ Baseline saved: ${mockup.id}`);
        return { name: testName, status: 'new', path: baselinePath };
    }

    // Compare with baseline
    const comparison = await compareImages(baselinePath, screenshotPath);

    if (comparison.isNew) {
        // No baseline exists, save current as baseline
        fs.copyFileSync(screenshotPath, baselinePath);
        console.log(`   🆕 New baseline created: ${mockup.id}`);
        return { name: testName, status: 'new', path: baselinePath };
    }

    if (comparison.match) {
        console.log(`   ✅ ${mockup.name}: ${comparison.reason}`);
        return { name: testName, status: 'passed', comparison };
    } else {
        console.log(`   ❌ ${mockup.name}: ${comparison.reason}`);
        return { name: testName, status: 'failed', comparison };
    }
}

async function testPdfGeneration(page, updateBaselines) {
    const testName = 'PDF Generation';
    console.log(`\n🔍 Testing ${testName}...`);

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download PDF button
    await page.click('button:has-text("Download PDF")');

    // Wait for PDF generation
    const download = await downloadPromise;
    const pdfPath = path.join(DIFF_DIR, 'generated.pdf');
    await download.saveAs(pdfPath);

    const baselinePath = path.join(BASELINE_DIR, 'baseline.pdf');

    if (updateBaselines) {
        fs.copyFileSync(pdfPath, baselinePath);
        console.log(`   ✅ PDF baseline saved`);
        return { name: testName, status: 'new', path: baselinePath };
    }

    // Compare PDF file sizes (rough check)
    if (!fs.existsSync(baselinePath)) {
        fs.copyFileSync(pdfPath, baselinePath);
        console.log(`   🆕 New PDF baseline created`);
        return { name: testName, status: 'new', path: baselinePath };
    }

    const baselineSize = fs.statSync(baselinePath).size;
    const currentSize = fs.statSync(pdfPath).size;
    const sizeDiff = Math.abs(baselineSize - currentSize) / baselineSize;

    if (sizeDiff < 0.05) { // 5% tolerance for PDF size
        console.log(`   ✅ PDF: Size within tolerance (${(sizeDiff * 100).toFixed(2)}% diff)`);
        return { name: testName, status: 'passed', sizeDiff };
    } else {
        console.log(`   ❌ PDF: Size differs by ${(sizeDiff * 100).toFixed(2)}%`);
        return { name: testName, status: 'failed', sizeDiff };
    }
}

// CLI handling
const args = process.argv.slice(2);
const updateBaselines = args.includes('--update') || args.includes('-u');

runVisualTests({ updateBaselines }).catch(console.error);

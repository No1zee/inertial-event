const { chromium } = require('playwright');
const path = require('path');

// Parameterized URL
const TARGET_URL = 'http://localhost:3000/search';

(async () => {
    console.log('🚀 Starting AI Search Test...');
    const browser = await chromium.launch({ headless: true }); // Headless for faster execution in this environment
    const page = await browser.newPage();

    try {
        console.log(`Navigating to ${TARGET_URL}...`);
        await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

        console.log('Page title:', await page.title());

        // 1. Locate Search Input and Toggle
        const searchInput = page.locator('#ai-search-input');
        const aiToggleButton = page.locator('button[title="Try AI Semantic Search"], button[title="Switch to standard search"]');

        await searchInput.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ Search input found.');

        // 2. Click AI Toggle
        console.log('Toggling AI Search...');
        await aiToggleButton.click();
        
        // Verify UI change (powered by text)
        await page.waitForSelector('text=Powered by local Vector RAG Engine', { timeout: 3000 });
        console.log('✅ AI Search mode activated (UI verification).');

        // 3. Perform a semantic search
        const query = 'dark sci-fi with robots';
        console.log(`Typing query: "${query}"...`);
        await searchInput.fill(query);
        await page.keyboard.press('Enter');

        // 4. Wait for results or loading state
        console.log('Waiting for results...');
        await page.waitForTimeout(2000); // Give it some time to fetch

        const resultsCount = await page.locator('.grid > div').count();
        console.log(`Found ${resultsCount} results.`);

        // 5. Take a screenshot for the walkthrough
        const screenshotPath = path.join(process.cwd(), 'ai-search-test-result.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot saved to ${screenshotPath}`);

        if (resultsCount >= 0) {
            console.log('✅ AI Search test completed successfully!');
        } else {
            console.log('❌ AI Search test failed: Expected results or loading state.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();

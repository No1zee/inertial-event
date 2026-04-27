const { chromium } = require('@playwright/test');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'frontend_home.png', fullPage: true });
    console.log("Screenshot saved to frontend_home.png");
    await browser.close();
})();

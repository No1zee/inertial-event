import { _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function runAudit() {
  const mainPath = path.resolve('electron/main.js');
  console.log(`[Audit] Launching Electron from: ${mainPath}`);

  const electronApp = await electron.launch({
    args: [mainPath],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_TEST_MODE: 'true',
    }
  });

  try {
    console.log('[Audit] Waiting for main window...');
    const window = await electronApp.firstWindow();
    
    // Check if electron-specific globals are present
    const isElectron = await window.evaluate(() => !!(window as any).electron);
    console.log(`[Audit] window.electron detected: ${isElectron}`);

    // Set viewport to a standard size
    await window.setViewportSize({ width: 1440, height: 900 });

    console.log('[Audit] Waiting for page load...');
    await window.waitForLoadState('networkidle');

    // Audit results storage
    const results: any = {
      pages: [],
      errors: [],
      performance: {}
    };

    // Helper to audit a page
    const auditPage = async (name: string, route: string) => {
      console.log(`[Audit] Auditing ${name} (${route})...`);
      
      // Capture performance metrics
      const metrics = await window.evaluate(() => {
        const perf = window.performance.getEntriesByType('navigation')[0] as any;
        return {
          loadTime: perf?.duration,
          domReady: perf?.domContentLoadedEventEnd,
        };
      });
      
      const screenshotPath = path.resolve(`artifacts/audit_${name.toLowerCase()}.png`);
      await window.screenshot({ path: screenshotPath });
      
      results.pages.push({
        name,
        route,
        metrics,
        screenshot: screenshotPath
      });
    };

    // 1. Home
    await auditPage('Home', '/');

    // 2. Shorts (using data-testid)
    console.log('[Audit] Navigating to Shorts...');
    const shortsLink = window.locator('[data-testid="nav-shorts"]');
    if (await shortsLink.isVisible()) {
        await shortsLink.click();
        await window.waitForTimeout(2000);
        await auditPage('Shorts', '/shorts');
    } else {
        console.log('[Audit] Shorts link not visible in sidebar, attempting direct navigation');
        await window.evaluate(() => window.location.href = '/shorts');
        await window.waitForTimeout(2000);
        await auditPage('Shorts', '/shorts');
    }

    // 3. Movies
    console.log('[Audit] Navigating to Movies...');
    const moviesLink = window.locator('[data-testid="nav-movies"]');
    if (await moviesLink.isVisible()) {
        await moviesLink.click();
        await window.waitForTimeout(2000);
        await auditPage('Movies', '/browse/movies');
    }

    // 4. Test Resizing
    console.log('[Audit] Testing Mobile Viewport...');
    await window.setViewportSize({ width: 375, height: 812 });
    await window.waitForTimeout(1000);
    await window.screenshot({ path: path.resolve('artifacts/audit_mobile.png') });

    // Collect errors from logs
    window.on('pageerror', (err) => {
      results.errors.push(`Page Error: ${err.message}`);
    });
    
    console.log('[Audit] Audit complete. Generating report...');
    fs.writeFileSync(path.resolve('artifacts/audit_results.json'), JSON.stringify(results, null, 2));

  } finally {
    await electronApp.close();
  }
}

runAudit().catch(err => {
  console.error('[Audit Error]', err);
  process.exit(1);
});

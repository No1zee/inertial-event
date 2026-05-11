import { _electron as electron } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function runDeepAudit() {
  const mainPath = path.resolve('electron/main.js');
  const electronApp = await electron.launch({ args: [mainPath] });

  try {
    const window = await electronApp.firstWindow();
    await window.setViewportSize({ width: 1440, height: 900 });
    await window.goto('http://localhost:3000/');
    await window.waitForLoadState('networkidle');

    // 1. Check for broken images
    const brokenImages = await window.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });
    console.log(`[Audit] Broken Images Found: ${brokenImages.length}`);
    if (brokenImages.length > 0) {
      console.log(`[Audit] Broken Image URLs: ${brokenImages.slice(0, 5).join(', ')}`);
    }

    // 2. Check for interactive elements without aria-labels or names
    const unlabeledElements = await window.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, input, select'));
      return elements
        .filter(el => !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.innerText && !el.getAttribute('placeholder'))
        .map(el => el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : ''));
    });
    console.log(`[Audit] Unlabeled interactive elements: ${unlabeledElements.length}`);

    // 3. Check for specific Electron features
    const hasElectronGlobal = await window.evaluate(() => !!(window as any).electron);
    console.log(`[Audit] Native Electron Bridge: ${hasElectronGlobal ? 'PRESENT' : 'MISSING'}`);

    // 4. Final Screenshot of Home with highlighted interactive areas (debug)
    await window.evaluate(() => {
        document.querySelectorAll('[data-testid]').forEach(el => {
            (el as HTMLElement).style.outline = '2px solid rgba(255, 0, 0, 0.5)';
        });
    });
    await window.screenshot({ path: path.resolve('artifacts/audit_debug.png') });

  } finally {
    await electronApp.close();
  }
}

runDeepAudit().catch(console.error);

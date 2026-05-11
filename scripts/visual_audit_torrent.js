const { _electron: electron } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function runAudit() {
  const mainPath = path.resolve(__dirname, '../electron/main.js');
  console.log(`[Audit] Target Electron Main: ${mainPath}`);

  console.log('[Audit] Launching Electron...');
  const electronApp = await electron.launch({
    args: [mainPath],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_TEST_MODE: 'true',
    }
  });

  try {
    // Pipe logs
    electronApp.process().stdout.on('data', (data) => console.log(`[Main] ${data.toString().trim()}`));
    electronApp.process().stderr.on('data', (data) => console.error(`[Main Error] ${data.toString().trim()}`));

    console.log('[Audit] Waiting for window...');
    const window = await electronApp.firstWindow();
    
    // Inject test flags
    await window.addInitScript(() => {
      window.NOVA_TEST_BYPASS_ONBOARDING = true;
      window.ELECTRON_TEST_MODE = true;
    });

    // Console logs from renderer
    window.on('console', msg => console.log(`[Console] ${msg.text()}`));

    console.log('[Audit] Navigating to Sintel Torrent...');
    const testMagnet = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel';
    const url = `http://localhost:3000/watch?id=550&type=movie&source=${encodeURIComponent(testMagnet)}`;
    
    await window.goto(url);
    await window.waitForLoadState('networkidle');

    console.log('[Audit] Waiting for playback to initialize...');
    
    // Wait for the video element to be attached
    const video = window.locator('video');
    await video.waitFor({ state: 'attached', timeout: 30000 });

    console.log('[Audit] Video element found. Waiting for playback (duration > 0)...');
    
    let playbackStarted = false;
    for (let i = 0; i < 60; i++) {
      const duration = await video.evaluate(el => el.duration);
      const currentTime = await video.evaluate(el => el.currentTime);
      console.log(`[Audit] Progress: ${currentTime.toFixed(2)}s / ${duration.toFixed(2)}s`);
      
      if (duration > 0 && currentTime > 0.5) {
        playbackStarted = true;
        break;
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    if (playbackStarted) {
      console.log('[Audit] SUCCESS: Torrent playback confirmed and progressing.');
      const screenshotPath = path.resolve(__dirname, '../artifacts/torrent_audit_success.png');
      await window.screenshot({ path: screenshotPath });
      console.log(`[Audit] Screenshot saved to: ${screenshotPath}`);
    } else {
      console.error('[Audit] FAILED: Playback did not start within timeout.');
      const screenshotPath = path.resolve(__dirname, '../artifacts/torrent_audit_failed.png');
      await window.screenshot({ path: screenshotPath });
    }

  } catch (err) {
    console.error('[Audit] Error during execution:', err);
  } finally {
    console.log('[Audit] Closing app...');
    await electronApp.close();
  }
}

runAudit().catch(err => {
  console.error('[Audit] Fatal error:', err);
  process.exit(1);
});

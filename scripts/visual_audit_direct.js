const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runAudit() {
  const auditLogPath = path.join(__dirname, 'audit_output.log');
  const log = (msg) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`;
    console.log(formatted);
    try { fs.appendFileSync(auditLogPath, formatted + '\n'); } catch(e) {}
  };

  log('[Audit] Starting Torrent Playback Verification...');
  
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      log('[Audit] ERROR: No contexts found!');
      process.exit(1);
    }

    const pages = contexts[0].pages();
    if (pages.length === 0) {
      log('[Audit] ERROR: No pages found!');
      process.exit(1);
    }

    const page = pages[0];
    log(`[Audit] Connected to: "${await page.title()}"`);

    const magnet = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337';
    const watchUrl = `http://localhost:3000/watch?id=550&type=movie&source=${encodeURIComponent(magnet)}`;
    
    log(`[Audit] Navigating: ${watchUrl}`);
    await page.goto(watchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    log('[Audit] Waiting for <video> (Max 120s)...');
    try {
      await page.waitForSelector('video', { timeout: 120000 });
      log('[Audit] SUCCESS: <video> element detected!');
    } catch (e) {
      log('[Audit] FAILURE: <video> element not found');
      await page.screenshot({ path: 'artifacts/audit_timeout.png' });
      process.exit(1);
    }

    let initialTime = await page.evaluate(() => document.querySelector('video').currentTime);
    log(`[Audit] initialTime: ${initialTime}s`);

    await new Promise(r => setTimeout(r, 20000));

    let finalTime = await page.evaluate(() => document.querySelector('video').currentTime);
    log(`[Audit] finalTime: ${finalTime}s`);

    if (finalTime > initialTime) {
      log('[Audit] SUCCESS: Torrent playback confirmed.');
      await page.screenshot({ path: 'artifacts/torrent_playback_audit.png' });
      process.exit(0);
    } else {
      log('[Audit] FAILURE: Video detected but not playing.');
      process.exit(1);
    }

  } catch (err) {
    log(`[Audit] FATAL: ${err.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runAudit();

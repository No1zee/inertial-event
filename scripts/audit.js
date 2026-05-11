const { chromium } = require('playwright');
async function run() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = (await browser.contexts()[0].pages())[0];
  const magnet = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel';
  await page.goto(`http://localhost:3000/watch?id=550&type=movie&source=${encodeURIComponent(magnet)}`);
  await page.waitForSelector('video', { timeout: 120000 });
  console.log('Video found');
  await new Promise(r => setTimeout(r, 15000));
  const t = await page.evaluate(() => document.querySelector('video').currentTime);
  console.log('Time:', t);
  await page.screenshot({ path: 'artifacts/torrent_success.png' });
  process.exit(t > 0 ? 0 : 1);
}
run();

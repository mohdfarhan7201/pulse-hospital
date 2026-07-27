const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER_ERROR:', err.toString()));
    
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();

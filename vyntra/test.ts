import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 });
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("BODY TEXT:", bodyText);
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log("BODY HTML:", bodyHTML);
  await browser.close();
})().catch(console.error);

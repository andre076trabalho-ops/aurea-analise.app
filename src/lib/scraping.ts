import puppeteer from 'puppeteer';

export async function capturePage(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Captura o HTML renderizado
  const html = await page.content();

  // Captura screenshot da página inteira
  const screenshotBuffer = await page.screenshot({ fullPage: true });

  await browser.close();

  return { html, screenshotBuffer };
}

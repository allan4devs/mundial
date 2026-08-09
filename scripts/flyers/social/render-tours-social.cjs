const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1450 }, deviceScaleFactor: 1 });
  const file = path.resolve(__dirname, "tours-social-2026.html");
  await page.goto(`file:///${file.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const tours = await page.evaluate(() => window.flyerTours.map(({ slug }) => slug));
  for (const slug of tours) {
    await page.locator(`[id="${slug}"]`).screenshot({
      path: path.resolve(__dirname, `${slug}-social-1080x1350.png`)
    });
  }
  await browser.close();
  console.log(`Rendered ${tours.length} social flyers.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

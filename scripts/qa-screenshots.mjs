import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173";
const outputDir = resolve(".tmp", "qa-slides");
const browserCandidates = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].filter(Boolean);
const browserPath = browserCandidates.find((candidate) => existsSync(candidate));

if (!browserPath) {
  throw new Error("Chrome or Chromium was not found. Set CHROME_BIN to its executable path.");
}

mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ executablePath: browserPath, headless: true });
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1
});

await page.goto(`${baseUrl}/#/0`, { waitUntil: "networkidle" });
await page.waitForSelector(".reveal.ready");

const slideCount = await page.locator(".reveal .slides > section").count();

for (let index = 0; index < slideCount; index += 1) {
  if (index > 0) {
    await page.keyboard.press("ArrowRight");
  }
  await page.waitForTimeout(2200);
  const activeSlide = page.locator(".reveal .slides > section.present");
  await activeSlide.waitFor();
  const label = (await activeSlide.getAttribute("data-slide")) || String(index + 1).padStart(2, "0");
  await page.screenshot({
    path: resolve(outputDir, `slide-${label}.png`),
    fullPage: false
  });
}

await browser.close();
console.log(`Captured ${slideCount} slides in ${outputDir}`);

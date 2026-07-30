import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173";
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

const browser = await chromium.launch({ executablePath: browserPath, headless: true });
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1
});
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

await page.goto(`${baseUrl}/#/0`, { waitUntil: "networkidle" });
await page.waitForSelector(".reveal.ready");

const slideCount = await page.locator(".reveal .slides > section").count();
const failures = [];

for (let index = 0; index < slideCount; index += 1) {
  if (index > 0) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(2200);

  const result = await page.locator(".reveal .slides > section.present").evaluate((slide) => {
    const slideRect = slide.getBoundingClientRect();
    const tolerance = 2;
    const selectors = "h1,h2,h3,p,blockquote,ul,ol,img,[data-animate],.slide-frame,.corner-label";
    const overflow = [];

    for (const element of slide.querySelectorAll(selectors)) {
      if (element.closest("aside.notes")) continue;
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      if (
        rect.left < slideRect.left - tolerance ||
        rect.top < slideRect.top - tolerance ||
        rect.right > slideRect.right + tolerance ||
        rect.bottom > slideRect.bottom + tolerance
      ) {
        overflow.push({
          element: element.tagName.toLowerCase(),
          className: element.className,
          rect: {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom)
          }
        });
      }
    }

    const brokenImages = [...slide.querySelectorAll("img")]
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"));

    return {
      label: slide.getAttribute("data-slide"),
      overflow,
      brokenImages
    };
  });

  if (result.overflow.length || result.brokenImages.length) failures.push(result);
}

await browser.close();

if (consoleErrors.length || failures.length) {
  console.error(JSON.stringify({ consoleErrors, failures }, null, 2));
  process.exit(1);
}

console.log(`Layout QA passed for ${slideCount} slides with no overflow, broken images, or console errors.`);

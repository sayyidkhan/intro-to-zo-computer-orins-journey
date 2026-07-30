import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, "..");
const outputPath = resolve(projectDir, "public", "orins-journey.pdf");
const port = 4173;
const url = `http://127.0.0.1:${port}/?print-pdf`;

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

mkdirSync(dirname(outputPath), { recursive: true });

const preview = spawn(
  process.execPath,
  [resolve(projectDir, "node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", String(port)],
  {
    cwd: projectDir,
    stdio: "ignore"
  }
);

async function waitForServer() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Preview server is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error("Timed out waiting for the Vite preview server.");
}

let browser;

try {
  await waitForServer();
  browser = await chromium.launch({ executablePath: browserPath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector(".reveal.ready"));
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: outputPath,
    width: "1920px",
    height: "1080px",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log(`PDF exported to ${outputPath}`);
} finally {
  if (browser) await browser.close();
  preview.kill("SIGTERM");
}

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const outDir = path.join(__dirname, "../screenshots");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  console.log(`Launching browser using: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const routes = [
    { url: "http://localhost:3000/", name: "overview.png" },
    { url: "http://localhost:3000/runs", name: "runs.png" },
    { url: "http://localhost:3000/policies", name: "policies.png" },
    { url: "http://localhost:3000/transaction", name: "transactions.png" },
    { url: "http://localhost:3000/report", name: "reports.png" },
  ];

  for (const r of routes) {
    console.log(`Navigating to ${r.url}...`);
    try {
      await page.goto(r.url, { waitUntil: "networkidle0", timeout: 15000 });
      // Give 500ms for animations and layout to settle
      await new Promise((resolve) => setTimeout(resolve, 500));
      const dest = path.join(outDir, r.name);
      await page.screenshot({ path: dest, fullPage: false });
      console.log(`Captured ${dest}`);
    } catch (err) {
      console.error(`Error capturing ${r.url}:`, err.message);
    }
  }

  await browser.close();
  console.log("Screenshots captured successfully.");
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});


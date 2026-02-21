import puppeteer from "puppeteer-core";
import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BCI_API = "https://api-nlm.bcicentral.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: "new",
    args: ["--no-sandbox", "--disable-web-security"],
  });
  let authToken = null;
  const customHeaders = {};
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36");
    page.on("request", (req) => {
      if (req.url().includes("api-nlm.bcicentral.com") && req.method() !== "OPTIONS") {
        const h = req.headers();
        if (h.authorization && !authToken) authToken = h.authorization;
        if (h["x-subscriber-id"] && !customHeaders["x-subscriber-id"]) {
          Object.assign(customHeaders, {
            "x-subscriber-id": h["x-subscriber-id"],
            "x-source": h["x-source"] || "asia",
            "x-device-id": h["x-device-id"] || "",
            "x-browser-version": h["x-browser-version"] || "Chrome 131",
          });
        }
      }
    });
    await page.goto("https://sso.bcicentral.com/login?app=lm", { waitUntil: "networkidle2" });
    await page.evaluate(() => { document.querySelectorAll("button").forEach((b) => { if (["Accept All","Deny","Accept"].includes(b.textContent.trim())) b.click(); }); });
    await sleep(1500);
    await page.click("#login-form-username", { clickCount: 3 });
    await page.type("#login-form-username", process.env.BCI_CLIENT_ID, { delay: 30 });
    await page.click("#login-form-password", { clickCount: 3 });
    await page.type("#login-form-password", process.env.BCI_PASSWORD, { delay: 30 });
    await sleep(500);
    await page.evaluate(() => document.getElementById("login-form").submit());
    try { await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }); } catch {}
    await sleep(3000);
    for (let i = 0; i < 10; i++) {
      const found = await page.evaluate(() => { for (const el of document.querySelectorAll("button, a, span, div")) { if (el.textContent.includes("Switch to This Device") && el.children.length === 0) { el.click(); return true; } } return false; });
      if (found) { try { await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }); } catch {} await sleep(5000); break; }
      await sleep(1000);
    }
    if (!page.url().includes("app-leadmanager")) {
      await page.goto("https://app-leadmanager.bcicentral.com/main/dashboard", { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(5000);
    }
    if (!authToken) await sleep(10000);
    if (!authToken) throw new Error("No token");
    return { Authorization: authToken, "Content-Type": "application/json;charset=UTF-8", Accept: "application/json", ...customHeaders };
  } finally { await browser.close(); }
}

async function searchCount(headers, extraBody = {}) {
  const filter = JSON.stringify({ limit: 10000, sortby: "last_updated", offset: 0, last_update: "" });
  const body = {
    advanceKeyword: { projectName: "", projectDescription: "", projectDocument: "" },
    companyIds: [], lastUpdate: "2011-05-01", outsideSubscription: 0,
    ...extraBody,
  };
  const res = await fetch(`${BCI_API}/asia/api/v2/search/projects/count?filter=${encodeURIComponent(filter)}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  const data = await res.json();
  return data?.data?.attributes?.totalMatchedProjectFounds || 0;
}

async function main() {
  const headers = await login();
  console.log("Logged in!\n");

  // Test stage filter in format matching pipeline data
  console.log("=== Stage filter (pipeline format) ===");
  const stageFormats = [
    { name: "Concept", body: { stage: [{ id: 2 }] } },
    { name: "Design", body: { stage: [{ id: 4 }] } },
    { name: "PreCon", body: { stage: [{ id: 6 }] } },
    { name: "Construction", body: { stage: [{ id: 8 }] } },
    { name: "Concept+Design", body: { stage: [{ id: 2 }, { id: 4 }] } },
  ];
  for (const s of stageFormats) {
    const count = await searchCount(headers, s.body);
    console.log(`  ${s.name}: ${count}`);
    await sleep(1000);
  }

  // Test different date ranges via lastUpdate
  console.log("\n=== Date range via lastUpdate ===");
  const dates = [
    "2026-01-01",
    "2025-06-01",
    "2025-01-01",
    "2024-01-01",
    "2023-01-01",
    "2020-01-01",
    "2011-05-01",
  ];
  for (const d of dates) {
    const count = await searchCount(headers, { lastUpdate: d });
    console.log(`  since ${d}: ${count}`);
    await sleep(1000);
  }

  // Test constructionStartDate range
  console.log("\n=== Construction start date filter ===");
  const conDateFormats = [
    { name: "conStartFrom 2025", body: { constructionStartDateFrom: "2025-01-01" } },
    { name: "conStartFrom 2026", body: { constructionStartDateFrom: "2026-01-01" } },
    { name: "conStartTo 2025", body: { constructionStartDateTo: "2025-12-31" } },
    { name: "dateFrom 2025", body: { dateFrom: "2025-01-01" } },
    { name: "dateTo 2025", body: { dateTo: "2025-12-31" } },
    { name: "publishedDateFrom 2025", body: { publishedDateFrom: "2025-01-01" } },
    { name: "lastUpdateTo 2025-06", body: { lastUpdateTo: "2025-06-01" } },
    { name: "modifiedDateFrom 2025", body: { modifiedDateFrom: "2025-01-01" } },
  ];
  for (const f of conDateFormats) {
    const count = await searchCount(headers, f.body);
    console.log(`  ${f.name}: ${count}`);
    await sleep(1000);
  }

  // Test with actual stage/substage format from pipeline
  console.log("\n=== Stage with substages ===");
  const stageWithSub = [
    { name: "Concept full", body: { stage: [{ id: 2, substage: [{ id: 102 }, { id: 101 }, { id: 122 }, { id: 123 }, { id: 124 }, { id: 103 }] }] } },
    { name: "Construction full", body: { stage: [{ id: 8, substage: [{ id: 121 }, { id: 113 }, { id: 115 }, { id: 160 }, { id: 161 }, { id: 163 }, { id: 164 }, { id: 162 }, { id: 159 }] }] } },
  ];
  for (const s of stageWithSub) {
    const count = await searchCount(headers, s.body);
    console.log(`  ${s.name}: ${count}`);
    await sleep(1000);
  }
}

main().catch(console.error);

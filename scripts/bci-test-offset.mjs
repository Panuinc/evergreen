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

async function testOffset(headers, offset, limit = 10000) {
  const filter = JSON.stringify({ limit, sortby: "last_updated", offset, last_update: "" });
  const body = {
    advanceKeyword: { projectName: "", projectDescription: "", projectDocument: "" },
    companyIds: [], lastUpdate: "2011-05-01", outsideSubscription: 0,
  };
  const res = await fetch(`${BCI_API}/asia/api/v2/search/projects2?filter=${encodeURIComponent(filter)}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  if (!res.ok) return { offset, status: res.status, count: 0 };
  const data = await res.json();
  const count = (data?.data || []).length;
  const hasMore = !!data?.links?.searchAfter;
  return { offset, status: res.status, count, total: data?.links?.total, hasMore, resLimit: data?.links?.limit };
}

async function testStage(headers, stageIds) {
  const filter = JSON.stringify({ limit: 10000, sortby: "last_updated", offset: 0, last_update: "" });
  const body = {
    advanceKeyword: { projectName: "", projectDescription: "", projectDocument: "" },
    companyIds: [], lastUpdate: "2011-05-01", outsideSubscription: 0,
    stageIds,
  };
  const res = await fetch(`${BCI_API}/asia/api/v2/search/projects/count?filter=${encodeURIComponent(filter)}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  if (!res.ok) return { stageIds, status: res.status };
  const data = await res.json();
  return { stageIds, count: data?.data?.attributes?.totalMatchedProjectFounds };
}

async function main() {
  const headers = await login();
  console.log("Logged in!\n");

  // Test 1: Offset-based pagination
  console.log("=== Testing offsets ===");
  for (const offset of [0, 5000, 10000, 20000, 30000]) {
    const r = await testOffset(headers, offset);
    console.log(`offset=${offset} → status=${r.status}, got=${r.count}, total=${r.total}, hasMore=${r.hasMore}, resLimit=${r.resLimit}`);
    await sleep(2000);
  }

  // Test 2: Stage-based filtering
  console.log("\n=== Testing stage counts ===");
  const stages = [
    { ids: [2], name: "Concept" },
    { ids: [4], name: "Design & Documentation" },
    { ids: [6], name: "Pre-Construction" },
    { ids: [8], name: "Construction" },
    { ids: [11], name: "Completed" },
  ];
  for (const s of stages) {
    const r = await testStage(headers, s.ids);
    console.log(`Stage ${s.name} (${JSON.stringify(s.ids)}) → count=${r.count || r.status}`);
    await sleep(1000);
  }

  // Test 3: Try different body fields for filtering
  console.log("\n=== Testing stage filter in projects2 ===");
  for (const s of stages) {
    const filter = JSON.stringify({ limit: 100, sortby: "last_updated", offset: 0, last_update: "" });
    const body = {
      advanceKeyword: { projectName: "", projectDescription: "", projectDocument: "" },
      companyIds: [], lastUpdate: "2011-05-01", outsideSubscription: 0,
      stageIds: s.ids,
    };
    const res = await fetch(`${BCI_API}/asia/api/v2/search/projects2?filter=${encodeURIComponent(filter)}`, {
      method: "POST", headers, body: JSON.stringify(body),
    });
    const data = await res.json();
    const count = (data?.data || []).length;
    const total = data?.links?.total;
    console.log(`Stage ${s.name}: got=${count}, total=${total}`);
    await sleep(1000);
  }
}

main().catch(console.error);

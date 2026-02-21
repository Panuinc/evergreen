import puppeteer from "puppeteer-core";
import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BCI_API = "https://api-nlm.bcicentral.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Reuse login from test-sync
async function login() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: "new",
    args: ["--no-sandbox", "--disable-web-security"],
  });
  let authToken = null;
  const customHeaders = {};
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
    page.on("request", (req) => {
      if (req.url().includes("api-nlm.bcicentral.com") && req.method() !== "OPTIONS") {
        const h = req.headers();
        if (h.authorization && !authToken) authToken = h.authorization;
        if (h["x-subscriber-id"] && !customHeaders["x-subscriber-id"]) {
          customHeaders["x-subscriber-id"] = h["x-subscriber-id"];
          customHeaders["x-source"] = h["x-source"] || "asia";
          customHeaders["x-device-id"] = h["x-device-id"] || "";
          customHeaders["x-browser-version"] = h["x-browser-version"] || "Chrome 131";
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
      const found = await page.evaluate(() => {
        for (const el of document.querySelectorAll("button, a, [role=button], span, div")) {
          if (el.textContent.includes("Switch to This Device") && el.children.length === 0) { el.click(); return true; }
        }
        return false;
      });
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

async function testLimit(headers, limit) {
  const filter = JSON.stringify({ limit, sortby: "last_updated", offset: 0, last_update: "" });
  const body = {
    advanceKeyword: { projectName: "", projectDescription: "", projectDocument: "" },
    companyIds: [], lastUpdate: "2011-05-01", outsideSubscription: 0,
  };
  const res = await fetch(`${BCI_API}/asia/api/v2/search/projects2?filter=${encodeURIComponent(filter)}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  if (!res.ok) return { limit, status: res.status, count: 0 };
  const data = await res.json();
  const count = (data?.data || []).length;
  const total = data?.links?.total;
  const hasMore = !!data?.links?.searchAfter;
  const responseLimit = data?.links?.limit;
  return { limit, status: res.status, count, total, hasMore, responseLimit };
}

async function main() {
  const headers = await login();
  console.log("Logged in!\n");

  // Test various limits
  const limits = [100, 500, 1000, 2000, 5000, 10000, 20000];
  for (const limit of limits) {
    const r = await testLimit(headers, limit);
    console.log(`limit=${limit} → status=${r.status}, got=${r.count}, total=${r.total}, hasMore=${r.hasMore}, responseLimit=${r.responseLimit}`);
    await sleep(2000);
  }
}

main().catch(console.error);

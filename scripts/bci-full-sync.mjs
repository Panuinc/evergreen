/**
 * BCI Full Sync — fetches projects published since 2024.
 * With lastUpdate=2024-01-01, results are well under 10,000 → single search.
 */
import puppeteer from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BCI_API = "https://api-nlm.bcicentral.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login() {
  console.log("[Login] Starting...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: "new",
    args: ["--no-sandbox", "--disable-web-security"],
  });
  let authToken = null;
  const ch = {};
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
    page.on("request", (req) => {
      if (req.url().includes("api-nlm.bcicentral.com") && req.method() !== "OPTIONS") {
        const h = req.headers();
        if (h.authorization && !authToken) authToken = h.authorization;
        if (h["x-subscriber-id"] && !ch["x-subscriber-id"]) {
          Object.assign(ch, { "x-subscriber-id": h["x-subscriber-id"], "x-source": h["x-source"] || "asia", "x-device-id": h["x-device-id"] || "", "x-browser-version": h["x-browser-version"] || "Chrome 131" });
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
      const f = await page.evaluate(() => { for (const el of document.querySelectorAll("button, a, span, div")) { if (el.textContent.includes("Switch to This Device") && el.children.length === 0) { el.click(); return true; } } return false; });
      if (f) { try { await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }); } catch {} await sleep(5000); break; }
      await sleep(1000);
    }
    if (!page.url().includes("app-leadmanager")) {
      await page.goto("https://app-leadmanager.bcicentral.com/main/dashboard", { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(5000);
    }
    if (!authToken) await sleep(10000);
    if (!authToken) throw new Error("No token");
    console.log(`[Login] OK! Subscriber: ${ch["x-subscriber-id"]}`);
    return { Authorization: authToken, "Content-Type": "application/json;charset=UTF-8", Accept: "application/json", ...ch };
  } finally { await browser.close(); }
}

async function getCount(headers, lastUpdate = "2024-01-01") {
  const filter = JSON.stringify({ limit: 10000, sortby: "last_updated", offset: 0, last_update: "" });
  const body = { advanceKeyword: { projectName: "", projectDescription: "", projectDocument: "" }, companyIds: [], lastUpdate, outsideSubscription: 0 };
  const res = await fetch(`${BCI_API}/asia/api/v2/search/projects/count?filter=${encodeURIComponent(filter)}`, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json();
  return data?.data?.attributes?.totalMatchedProjectFounds || 0;
}

async function fetchAll(headers, lastUpdate = "2024-01-01") {
  const filter = JSON.stringify({ limit: 10000, sortby: "last_updated", offset: 0, last_update: "" });
  const baseBody = { advanceKeyword: { projectName: "", projectDescription: "", projectDocument: "" }, companyIds: [], lastUpdate, outsideSubscription: 0 };

  let all = [];
  let searchAfter = null;
  let page = 0;

  while (true) {
    page++;
    const body = { ...baseBody };
    if (searchAfter) body.searchAfter = searchAfter;

    const res = await fetch(`${BCI_API}/asia/api/v2/search/projects2?filter=${encodeURIComponent(filter)}`, {
      method: "POST", headers, body: JSON.stringify(body),
    });
    if (!res.ok) { console.log(`HTTP ${res.status} on page ${page}`); break; }

    const data = await res.json();
    const projects = (data?.data || []).map((p) => p.attributes || p);
    if (projects.length === 0) break;

    all = all.concat(projects);
    searchAfter = data?.links?.searchAfter || null;
    process.stdout.write(`\r  Page ${page}: ${all.length} projects    `);
    if (!searchAfter) break;
    await sleep(800);
  }
  console.log();
  return all;
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
function parseCategory(val) {
  if (!val) return null;
  try { const arr = JSON.parse(val); return Array.isArray(arr) ? arr.join(", ") : val; } catch { return val; }
}
function mapProject(p) {
  return {
    projectId: p.PROJECT_ID, projectName: p.NAME || null, projectType: p.TYPE || null,
    projectDescription: p.PROJECT_DESCRIPTION || p.REMARKS || null,
    streetName: p.STREET_NAME || null, cityOrTown: p.CITYORTOWN || null,
    stateProvince: p.STATE_PROVINCE || null, region: p.REGION || null, country: p.COUNTRY || null,
    value: p.VALUE || null, currency: p.CURRENCY || "THB",
    projectStage: p.PROJECT_STAGE || null, projectStageStatus: p.PROJECT_STAGE_STATUS || null,
    developmentType: p.DEVELOPMENT_TYPE || null, ownershipType: p.OWNERSHIP_TYPE || null,
    category: parseCategory(p.CATEGORY), subCategory: parseCategory(p.SUB_CATEGORY),
    storeys: p.STOREY || null, floorArea: p.FLOOR_AREA || null, siteArea: p.SITE_AREA || null,
    lat: p.LAT ? parseFloat(p.LAT) : null, lon: p.LON ? parseFloat(p.LON) : null,
    constructionStartDate: parseDate(p.CONSTRUCTION_START_DATE), constructionEndDate: parseDate(p.CONSTRUCTION_END_DATE),
    constructionStartString: p.CONSTRUCTION_START_DATE_STRING || null, constructionEndString: p.CONSTRUCTION_END_DATE_STRING || null,
    remarks: p.REMARKS || null, statusText: p.STATUS_TEXT || null, sourceText: p.SOURCE_TEXT || null,
    bciResearcher: p.BCI_RESEARCHER || null, versionNumber: p.VERSION_NUMBER || null,
    publishedDate: parseDate(p.PUBLISHED_DATE), modifiedDate: parseDate(p.MODIFIED_DATE),
    stageId: p.STAGE_ID || null, statusId: p.STATUS_ID || null, categoryId: p.CATEGORY_ID || null,
    developmentTypeId: p.DEVELOPMENT_TYPE_ID || null,
    mainContractorMethod: p.MAIN_CONTRACTOR_APPOINTMENT_METHOD || null,
    syncedAt: new Date().toISOString(),
  };
}

async function main() {
  const headers = await login();

  // 1. Count
  const count = await getCount(headers);
  console.log(`\nProjects since 2024: ${count}\n`);

  // 2. Fetch
  console.log("Fetching...");
  const projects = await fetchAll(headers);
  console.log(`Fetched ${projects.length} projects`);

  // 3. Dedup
  const uniqueMap = new Map();
  for (const p of projects) uniqueMap.set(p.PROJECT_ID, p);
  console.log(`Unique: ${uniqueMap.size}`);

  // 4. Clear old data & upsert
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Delete all existing rows first (clean slate for 2024+ only)
  console.log("Clearing old data...");
  const { error: delErr } = await supabase.from("bciProjects").delete().lt("publishedDate", "2024-01-01T00:00:00.000Z");
  if (delErr) console.log("Delete old error:", delErr.message);
  // Also delete rows with null publishedDate from old syncs
  const { error: delNull } = await supabase.from("bciProjects").delete().is("publishedDate", null);
  if (delNull) console.log("Delete null error:", delNull.message);

  const mapped = [...uniqueMap.values()].map(mapProject).filter((p) => p.projectId);
  let upserted = 0;
  for (let i = 0; i < mapped.length; i += 500) {
    const batch = mapped.slice(i, i + 500);
    const { error } = await supabase.from("bciProjects").upsert(batch, { onConflict: "projectId" });
    if (error) { console.error(`Error at batch ${i}: ${error.message}`); continue; }
    upserted += batch.length;
    if (upserted % 2000 === 0 || i + 500 >= mapped.length) console.log(`  Upserted ${upserted}/${mapped.length}`);
  }

  console.log(`\n✓ Done! ${upserted} projects synced (2024+).`);
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });

/**
 * Test BCI sync: login via Puppeteer, fetch projects, upsert to Supabase.
 * This is a standalone script that mimics what the sync API route does.
 */
import puppeteer from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BCI_API = "https://api-nlm.bcicentral.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loginAndGetAuth() {
  console.log("[Login] Starting Puppeteer SSO login...");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
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
    await page.evaluate(() => {
      document.querySelectorAll("button").forEach((b) => {
        if (["Accept All", "Deny", "Accept"].includes(b.textContent.trim())) b.click();
      });
    });
    await sleep(1500);

    await page.click("#login-form-username", { clickCount: 3 });
    await page.type("#login-form-username", process.env.BCI_CLIENT_ID, { delay: 30 });
    await page.click("#login-form-password", { clickCount: 3 });
    await page.type("#login-form-password", process.env.BCI_PASSWORD, { delay: 30 });
    await sleep(500);

    await page.evaluate(() => document.getElementById("login-form").submit());
    try { await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }); } catch {}
    await sleep(3000);

    // Handle "Multiple Logins Detected"
    for (let i = 0; i < 10; i++) {
      const found = await page.evaluate(() => {
        for (const el of document.querySelectorAll("button, a, [role=button], span, div")) {
          if (el.textContent.includes("Switch to This Device") && el.children.length === 0) {
            el.click(); return true;
          }
        }
        return false;
      });
      if (found) {
        try { await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }); } catch {}
        await sleep(5000);
        break;
      }
      await sleep(1000);
    }

    if (!page.url().includes("app-leadmanager")) {
      await page.goto("https://app-leadmanager.bcicentral.com/main/dashboard", {
        waitUntil: "networkidle2", timeout: 30000,
      });
      await sleep(5000);
      const sw = await page.evaluate(() => {
        for (const el of document.querySelectorAll("button, a")) {
          if (el.textContent.includes("Switch to This Device")) { el.click(); return true; }
        }
        return false;
      });
      if (sw) {
        try { await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }); } catch {}
        await sleep(5000);
      }
    }

    if (!authToken) await sleep(10000);
    if (!authToken) throw new Error("Login failed — no JWT token");

    console.log(`[Login] Success! Subscriber: ${customHeaders["x-subscriber-id"]}`);
    return {
      Authorization: authToken,
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
      ...customHeaders,
    };
  } finally {
    await browser.close();
  }
}

async function fetchBatch(headers, searchAfterCursor = null) {
  const filter = JSON.stringify({ limit: 10000, sortby: "last_updated", offset: 0, last_update: "" });
  const baseBody = {
    advanceKeyword: { projectName: "", projectDescription: "", projectDocument: "" },
    companyIds: [],
    lastUpdate: "2011-05-01",
    outsideSubscription: 0,
  };

  let batchProjects = [];
  let searchAfter = searchAfterCursor;
  let page = 0;
  let lastProject = null;

  while (true) {
    page++;
    const body = { ...baseBody };
    if (searchAfter) body.searchAfter = searchAfter;

    const res = await fetch(`${BCI_API}/asia/api/v2/search/projects2?filter=${encodeURIComponent(filter)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text.substring(0, 200)}`);
    }

    const data = await res.json();
    const projects = (data?.data || []).map((p) => p.attributes || p);
    if (projects.length === 0) break;

    batchProjects = batchProjects.concat(projects);
    lastProject = projects[projects.length - 1];

    searchAfter = data?.links?.searchAfter || null;
    const total = data?.links?.total || "?";
    process.stdout.write(`\r[Fetch] Page ${page}: ${batchProjects.length} / ${total}    `);

    if (!searchAfter) break;
    await sleep(800);
  }

  console.log();
  return { projects: batchProjects, lastProject };
}

async function fetchAllProjects(headers) {
  let allProjects = [];
  let batchNum = 0;
  let cursor = null;

  while (true) {
    batchNum++;
    console.log(`\n[Batch ${batchNum}] Fetching (have ${allProjects.length} so far)...`);

    const { projects, lastProject } = await fetchBatch(headers, cursor);
    if (projects.length === 0) break;

    allProjects = allProjects.concat(projects);
    console.log(`[Batch ${batchNum}] Got ${projects.length} projects (total: ${allProjects.length})`);

    // If we got exactly 10,000, construct cursor from last project to continue
    if (projects.length >= 10000 && lastProject) {
      const ts = new Date(lastProject.MODIFIED_DATE || lastProject.PUBLISHED_DATE).getTime();
      const versionId = lastProject.PROJECT_VERSION_ID;
      cursor = {
        type: "project_search_result",
        value: [ts, versionId],
        lastCount: allProjects.length,
      };
      console.log(`[Batch ${batchNum}] Continuing with cursor: ts=${new Date(ts).toISOString()}, versionId=${versionId}`);
      await sleep(3000); // extra pause between batches
    } else {
      break;
    }
  }

  return allProjects;
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
    projectId: p.PROJECT_ID,
    projectName: p.NAME || null,
    projectType: p.TYPE || null,
    projectDescription: p.PROJECT_DESCRIPTION || p.REMARKS || null,
    streetName: p.STREET_NAME || null,
    cityOrTown: p.CITYORTOWN || null,
    stateProvince: p.STATE_PROVINCE || null,
    region: p.REGION || null,
    country: p.COUNTRY || null,
    value: p.VALUE || null,
    currency: p.CURRENCY || "THB",
    projectStage: p.PROJECT_STAGE || null,
    projectStageStatus: p.PROJECT_STAGE_STATUS || null,
    developmentType: p.DEVELOPMENT_TYPE || null,
    ownershipType: p.OWNERSHIP_TYPE || null,
    category: parseCategory(p.CATEGORY),
    subCategory: parseCategory(p.SUB_CATEGORY),
    storeys: p.STOREY || null,
    floorArea: p.FLOOR_AREA || null,
    siteArea: p.SITE_AREA || null,
    lat: p.LAT ? parseFloat(p.LAT) : null,
    lon: p.LON ? parseFloat(p.LON) : null,
    constructionStartDate: parseDate(p.CONSTRUCTION_START_DATE),
    constructionEndDate: parseDate(p.CONSTRUCTION_END_DATE),
    constructionStartString: p.CONSTRUCTION_START_DATE_STRING || null,
    constructionEndString: p.CONSTRUCTION_END_DATE_STRING || null,
    remarks: p.REMARKS || null,
    statusText: p.STATUS_TEXT || null,
    sourceText: p.SOURCE_TEXT || null,
    bciResearcher: p.BCI_RESEARCHER || null,
    versionNumber: p.VERSION_NUMBER || null,
    publishedDate: parseDate(p.PUBLISHED_DATE),
    modifiedDate: parseDate(p.MODIFIED_DATE),
    stageId: p.STAGE_ID || null,
    statusId: p.STATUS_ID || null,
    categoryId: p.CATEGORY_ID || null,
    developmentTypeId: p.DEVELOPMENT_TYPE_ID || null,
    mainContractorMethod: p.MAIN_CONTRACTOR_APPOINTMENT_METHOD || null,
    syncedAt: new Date().toISOString(),
  };
}

async function main() {
  // 1. Login
  const headers = await loginAndGetAuth();

  // 2. Fetch ALL projects
  console.log("\n[Fetch] Fetching ALL projects...");
  const projects = await fetchAllProjects(headers);
  console.log(`\n[Fetch] Got ${projects.length} projects`);

  // Show first project
  if (projects.length > 0) {
    const first = mapProject(projects[0]);
    console.log("\n[Sample] First project:");
    console.log(`  Name: ${first.projectName}`);
    console.log(`  Value: ${first.value ? (first.value / 1e6).toFixed(1) + "M" : "-"}`);
    console.log(`  Stage: ${first.projectStage}`);
    console.log(`  Status: ${first.projectStageStatus}`);
    console.log(`  Location: ${first.cityOrTown}, ${first.stateProvince}`);
    console.log(`  Category: ${first.category}`);
    console.log(`  Dev Type: ${first.developmentType}`);
  }

  // 3. Upsert to Supabase
  console.log("\n[Supabase] Upserting to bciProjects...");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const mapped = projects.map(mapProject).filter((p) => p.projectId);
  let upserted = 0;
  for (let i = 0; i < mapped.length; i += 200) {
    const batch = mapped.slice(i, i + 200);
    const { error } = await supabase.from("bciProjects").upsert(batch, { onConflict: "projectId" });
    if (error) {
      console.error(`[Supabase] Error: ${error.message}`);
      console.error(`[Supabase] Details: ${JSON.stringify(error)}`);
      break;
    }
    upserted += batch.length;
    console.log(`[Supabase] Upserted ${upserted}/${mapped.length}`);
  }

  console.log(`\n✓ Done! ${upserted} projects synced to Supabase.`);
}

main().catch((e) => console.error("Error:", e.message));

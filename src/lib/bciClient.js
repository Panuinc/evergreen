/**
 * BCI Central (LeadManager) Internal API Client
 * Uses Puppeteer for SSO login, then internal API for data.
 *
 * API: https://api-nlm.bcicentral.com/asia/api/v2/
 * Auth: Bearer JWT + x-subscriber-id header
 */

const BCI_API = "https://api-nlm.bcicentral.com";
const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let cachedAuth = null;
let authExpiry = 0;

/**
 * Login via SSO and get JWT token + required headers.
 * Uses Puppeteer to handle the JavaScript-based SSO flow.
 */
async function loginViaPuppeteer() {
  const puppeteer = await import("puppeteer-core");
  const browser = await puppeteer.default.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-web-security"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );

    let authToken = null;
    const customHeaders = {};

    page.on("request", (req) => {
      const url = req.url();
      if (
        url.includes("api-nlm.bcicentral.com") &&
        req.method() !== "OPTIONS"
      ) {
        const h = req.headers();
        if (h.authorization && !authToken) {
          authToken = h.authorization;
        }
        if (h["x-subscriber-id"] && !customHeaders["x-subscriber-id"]) {
          customHeaders["x-subscriber-id"] = h["x-subscriber-id"];
          customHeaders["x-source"] = h["x-source"] || "asia";
          customHeaders["x-device-id"] = h["x-device-id"] || "";
          customHeaders["x-browser-version"] =
            h["x-browser-version"] || "Chrome 131";
        }
      }
    });

    const clientId = process.env.BCI_CLIENT_ID;
    const password = process.env.BCI_PASSWORD;
    if (!clientId || !password) {
      throw new Error("BCI_CLIENT_ID and BCI_PASSWORD required");
    }

    // Load SSO login page
    await page.goto("https://sso.bcicentral.com/login?app=lm", {
      waitUntil: "networkidle2",
    });

    // Dismiss cookie consent
    await page.evaluate(() => {
      document.querySelectorAll("button").forEach((b) => {
        const t = b.textContent.trim();
        if (["Accept All", "Deny", "Accept"].includes(t)) b.click();
      });
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Fill and submit login form
    await page.click("#login-form-username", { clickCount: 3 });
    await page.type("#login-form-username", clientId, { delay: 30 });
    await page.click("#login-form-password", { clickCount: 3 });
    await page.type("#login-form-password", password, { delay: 30 });
    await new Promise((r) => setTimeout(r, 500));

    await page.evaluate(() =>
      document.getElementById("login-form").submit(),
    );
    try {
      await page.waitForNavigation({
        waitUntil: "networkidle0",
        timeout: 15000,
      });
    } catch {}
    await new Promise((r) => setTimeout(r, 3000));

    // Handle "Multiple Logins Detected" — retry up to 10 times
    for (let i = 0; i < 10; i++) {
      const found = await page.evaluate(() => {
        for (const el of document.querySelectorAll(
          "button, a, [role=button], span, div",
        )) {
          if (
            el.textContent.includes("Switch to This Device") &&
            el.children.length === 0
          ) {
            el.click();
            return true;
          }
        }
        return false;
      });
      if (found) {
        try {
          await page.waitForNavigation({
            waitUntil: "networkidle2",
            timeout: 20000,
          });
        } catch {}
        await new Promise((r) => setTimeout(r, 5000));
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Navigate to dashboard if needed
    if (!page.url().includes("app-leadmanager")) {
      await page.goto(
        "https://app-leadmanager.bcicentral.com/main/dashboard",
        { waitUntil: "networkidle2", timeout: 30000 },
      );
      await new Promise((r) => setTimeout(r, 5000));

      // Check for switch again
      const switchAgain = await page.evaluate(() => {
        for (const el of document.querySelectorAll("button, a")) {
          if (el.textContent.includes("Switch to This Device")) {
            el.click();
            return true;
          }
        }
        return false;
      });
      if (switchAgain) {
        try {
          await page.waitForNavigation({
            waitUntil: "networkidle2",
            timeout: 20000,
          });
        } catch {}
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    // Wait for token
    if (!authToken) {
      await new Promise((r) => setTimeout(r, 10000));
    }

    if (!authToken) {
      throw new Error("BCI login failed — no JWT token obtained");
    }

    return { authToken, customHeaders };
  } finally {
    await browser.close();
  }
}

/**
 * Get authenticated headers (login if needed).
 * Caches token for 30 minutes.
 */
async function getAuth() {
  if (cachedAuth && Date.now() < authExpiry) return cachedAuth;

  const { authToken, customHeaders } = await loginViaPuppeteer();
  cachedAuth = {
    Authorization: authToken,
    "Content-Type": "application/json;charset=UTF-8",
    Accept: "application/json",
    ...customHeaders,
  };
  authExpiry = Date.now() + 30 * 60 * 1000; // 30 min
  return cachedAuth;
}

/**
 * Make authenticated API call to BCI internal API.
 */
async function bciApi(method, path, body = null) {
  const headers = await getAuth();
  const url = `${BCI_API}${path}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BCI API ${method} ${path}: ${res.status} — ${text.substring(0, 200)}`);
  }
  return res.json();
}

/* ── Public API ── */

/**
 * Get total project count matching search criteria.
 */
export async function getProjectCount(searchBody = {}) {
  const filter = JSON.stringify({
    limit: 10000,
    sortby: "last_updated",
    offset: 0,
    last_update: "",
  });
  const body = {
    advanceKeyword: {
      projectName: "",
      projectDescription: "",
      projectDocument: "",
    },
    companyIds: [],
    lastUpdate: "2024-01-01",
    ...searchBody,
  };
  const data = await bciApi(
    "POST",
    `/asia/api/v2/search/projects/count?filter=${encodeURIComponent(filter)}`,
    body,
  );
  return data?.data?.attributes || {};
}

/**
 * Search projects with cursor-based pagination.
 * Returns up to maxResults projects.
 */
export async function searchProjects({
  lastUpdate,
  maxResults = 5000,
  onPage,
} = {}) {
  const filter = JSON.stringify({
    limit: 10000,
    sortby: "last_updated",
    offset: 0,
    last_update: "",
  });

  const baseBody = {
    advanceKeyword: {
      projectName: "",
      projectDescription: "",
      projectDocument: "",
    },
    companyIds: [],
    lastUpdate: lastUpdate || "2024-01-01",
    outsideSubscription: 0,
  };

  let allProjects = [];
  let searchAfter = null;
  let pageNum = 0;

  while (allProjects.length < maxResults) {
    pageNum++;
    const body = { ...baseBody };
    if (searchAfter) body.searchAfter = searchAfter;

    const data = await bciApi(
      "POST",
      `/asia/api/v2/search/projects2?filter=${encodeURIComponent(filter)}`,
      body,
    );

    const projects = data?.data || [];
    if (projects.length === 0) break;

    const items = projects.map((p) => p.attributes || p);
    allProjects = allProjects.concat(items);

    if (onPage) onPage(pageNum, items.length, allProjects.length);

    // Get cursor for next page
    searchAfter = data?.links?.searchAfter || null;
    if (!searchAfter) break;

    // Respect rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  return allProjects;
}

/**
 * Get dashboard latest projects (quick summary).
 */
export async function getLatestProjects() {
  return bciApi("GET", "/asia/api/v2/main/dashboard/latest-projects");
}

/**
 * Get subscriber info (subscription details).
 */
export async function getSubscriberInfo() {
  return bciApi("GET", "/asia/api/v2/main/subscriber-info");
}

/**
 * Get reference data: project stages.
 */
export async function getProjectStages() {
  return bciApi("GET", "/asia/api/v2/main/redis/project-stages");
}

/**
 * Get reference data: categories.
 */
export async function getCategories() {
  return bciApi("GET", "/asia/api/v2/main/redis/categories");
}

/**
 * Get reference data: locations.
 */
export async function getLocations() {
  return bciApi("GET", "/asia/api/v2/main/redis/locations");
}

/**
 * Test connection — login and return subscriber info.
 */
export async function testConnection() {
  const headers = await getAuth();
  return { success: true, subscriberId: headers["x-subscriber-id"] };
}

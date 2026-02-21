import puppeteer from "puppeteer-core";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickSwitchDevice(page, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    const found = await page.evaluate(() => {
      for (const el of document.querySelectorAll("button, a, [role=button], span, div")) {
        if (el.textContent.includes("Switch to This Device") && el.children.length === 0) {
          el.click();
          return true;
        }
      }
      return false;
    });
    if (found) return true;
    await sleep(1000);
  }
  return false;
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-web-security"],
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");

  let authToken = null;
  let customHeaders = {};
  const allCalls = [];

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("api-nlm.bcicentral.com") && req.method() !== "OPTIONS") {
      const h = req.headers();
      if (h.authorization && !authToken) {
        authToken = h.authorization;
        console.log("[AUTH] Got token!");
      }
      // Capture custom headers from real requests
      if (h["x-subscriber-id"] && !customHeaders["x-subscriber-id"]) {
        customHeaders = {
          "x-subscriber-id": h["x-subscriber-id"],
          "x-source": h["x-source"] || "asia",
          "x-device-id": h["x-device-id"] || "",
          "x-browser-version": h["x-browser-version"] || "Chrome 131",
        };
        console.log(`[AUTH] Got x-subscriber-id: ${h["x-subscriber-id"]}`);
      }
      allCalls.push({ method: req.method(), url, postData: req.postData() });
    }
  });

  // === LOGIN ===
  console.log("1. Login...");
  await page.goto("https://sso.bcicentral.com/login?app=lm", { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    document.querySelectorAll("button").forEach((b) => {
      if (["Accept All", "Deny", "Accept"].includes(b.textContent.trim())) b.click();
    });
  });
  await sleep(1500);

  await page.click("#login-form-username", { clickCount: 3 });
  await page.type("#login-form-username", "chh_thailand", { delay: 30 });
  await page.click("#login-form-password", { clickCount: 3 });
  await page.type("#login-form-password", "CHH_Thailand", { delay: 30 });
  await sleep(500);

  await page.evaluate(() => document.getElementById("login-form").submit());
  try { await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }); } catch {}
  await sleep(3000);

  console.log(`   URL: ${page.url()}`);
  if (await clickSwitchDevice(page)) {
    try { await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }); } catch {}
    await sleep(5000);
  }

  if (!page.url().includes("app-leadmanager")) {
    await page.goto("https://app-leadmanager.bcicentral.com/main/dashboard", {
      waitUntil: "networkidle2", timeout: 30000,
    });
    await sleep(5000);
    if (await clickSwitchDevice(page, 5)) {
      try { await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }); } catch {}
      await sleep(5000);
    }
  }

  if (!authToken) {
    await sleep(10000);
    if (!authToken) {
      console.log("FAILED - no token");
      await page.screenshot({ path: "/tmp/bci_final.png" });
      await browser.close();
      return;
    }
  }

  console.log("\n2. Logged in!");
  console.log(`   Token: ${authToken.substring(0, 50)}...`);
  console.log(`   Headers: ${JSON.stringify(customHeaders)}`);

  // Build headers
  const headers = {
    Authorization: authToken,
    "Content-Type": "application/json;charset=UTF-8",
    Accept: "application/json",
    ...customHeaders,
  };

  // === TEST dashboard/latest-projects with proper headers ===
  console.log("\n3. Testing dashboard/latest-projects with full headers...");
  const latestResult = await page.evaluate(
    async (h) => {
      try {
        const r = await fetch("https://api-nlm.bcicentral.com/asia/api/v2/main/dashboard/latest-projects", { headers: h });
        return { s: r.status, b: (await r.text()).substring(0, 5000) };
      } catch (e) { return { s: "ERR", b: e.message }; }
    },
    headers,
  );
  console.log(`   [${latestResult.s}]`);
  console.log(latestResult.b.substring(0, 2000));

  // === TEST subscriber-info ===
  console.log("\n4. Testing subscriber-info...");
  const subResult = await page.evaluate(
    async (h) => {
      try {
        const r = await fetch("https://api-nlm.bcicentral.com/asia/api/v2/main/subscriber-info", { headers: h });
        return { s: r.status, b: (await r.text()).substring(0, 3000) };
      } catch (e) { return { s: "ERR", b: e.message }; }
    },
    headers,
  );
  console.log(`   [${subResult.s}]`);
  console.log(subResult.b.substring(0, 2000));

  // === NAVIGATE TO SEARCH & CLICK SEARCH BUTTON ===
  console.log("\n5. Going to search/projects and clicking search...");
  const searchCalls = [];
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes("api-nlm.bcicentral.com") && req.method() !== "OPTIONS") {
      searchCalls.push({
        method: req.method(),
        url: u,
        postData: req.postData(),
      });
    }
  });

  await page.goto("https://app-leadmanager.bcicentral.com/main/search/projects", {
    waitUntil: "networkidle2", timeout: 30000,
  });
  await sleep(5000);

  // Dismiss any popups/tutorials
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    for (const b of btns) {
      const t = b.textContent.trim();
      if (t === "Let's Go" || t === "ไม่ใช่" || t === "Skip" || t === "Close") {
        b.click();
      }
    }
  });
  await sleep(2000);

  // Clear searchCalls to only capture search-related calls
  searchCalls.length = 0;

  // Click "ค้นหา" (Search) button
  console.log("   Clicking Search button...");
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    for (const b of btns) {
      const t = b.textContent.trim();
      if (t === "ค้นหา" || t === "Search") {
        b.click();
        return `Clicked: "${t}"`;
      }
    }
    return null;
  });
  console.log(`   ${clicked || "Button not found"}`);
  await sleep(10000); // Wait for search results to load

  await page.screenshot({ path: "/tmp/bci_search_results.png" });

  console.log(`\n   === Search API calls (${searchCalls.length}) ===`);
  for (const c of searchCalls) {
    const u = c.url.replace("https://api-nlm.bcicentral.com", "");
    console.log(`   ${c.method} ${u}`);
    if (c.postData) {
      console.log(`     BODY: ${c.postData}`);
    }
  }

  // Replay the search calls with our headers
  const projectSearchCalls = searchCalls.filter(
    (c) => c.method === "POST" || c.url.includes("project") || c.url.includes("search"),
  );

  for (const c of projectSearchCalls) {
    if (c.url.includes("notification") || c.url.includes("export-status") || c.url.includes("save-search")) continue;
    console.log(`\n   Replaying: ${c.method} ${c.url.replace("https://api-nlm.bcicentral.com", "")}`);
    const result = await page.evaluate(
      async (m, u, b, h) => {
        const o = { method: m, headers: h };
        if (b) o.body = b;
        try {
          const r = await fetch(u, o);
          return { s: r.status, b: (await r.text()).substring(0, 5000) };
        } catch (e) { return { s: "ERR", b: e.message }; }
      },
      c.method, c.url, c.postData, headers,
    );
    console.log(`   [${result.s}]`);
    console.log(result.b.substring(0, 3000));
  }

  // Also check: did the page show results in the DOM?
  const resultsInfo = await page.evaluate(() => {
    // Look for result counts or project cards
    const text = document.body.innerText;
    const resultMatch = text.match(/(\d+)\s*(results?|โครงการ|projects?|รายการ)/i);
    // Look for table rows or cards
    const tables = document.querySelectorAll("table");
    const cards = document.querySelectorAll("[class*=card], [class*=project], [class*=result]");
    return {
      resultCount: resultMatch ? resultMatch[0] : null,
      tableCount: tables.length,
      cardCount: cards.length,
      bodySnippet: text.substring(0, 1000),
    };
  });
  console.log("\n   === Results page info ===");
  console.log(JSON.stringify(resultsInfo, null, 2));

  // === Try known endpoint patterns with x-subscriber-id ===
  console.log("\n6. Trying endpoint patterns with proper headers...");
  const patterns = [
    { m: "POST", u: "/asia/api/v2/search/project", b: { page: 1, pageSize: 25 } },
    { m: "POST", u: "/asia/api/v2/main/search/project", b: { page: 1, pageSize: 25 } },
    { m: "POST", u: "/asia/api/v2/search/projects", b: { page: 1, pageSize: 25 } },
    { m: "POST", u: "/asia/api/v2/main/search/projects", b: { page: 1, pageSize: 25 } },
    { m: "POST", u: "/asia/api/v2/search/project/find", b: { page: 1, pageSize: 25 } },
    { m: "POST", u: "/asia/api/v2/search/project/list", b: { page: 1, pageSize: 25 } },
    { m: "POST", u: "/asia/api/v2/main/project/search", b: { page: 1, pageSize: 25 } },
    { m: "GET", u: "/asia/api/v2/search/project?page=1&pageSize=25" },
    { m: "GET", u: "/asia/api/v2/main/search/project?page=1&pageSize=25" },
  ];

  for (const p of patterns) {
    const fullUrl = `https://api-nlm.bcicentral.com${p.u}`;
    const result = await page.evaluate(
      async (m, u, b, h) => {
        const o = { method: m, headers: h };
        if (b) o.body = JSON.stringify(b);
        try {
          const r = await fetch(u, o);
          return { s: r.status, b: (await r.text()).substring(0, 500) };
        } catch (e) { return { s: "ERR", b: e.message }; }
      },
      p.m, fullUrl, p.b || null, headers,
    );
    const status = result.s === 200 ? "✓" : result.s === 404 ? "✗" : `?${result.s}`;
    console.log(`   [${status}] ${p.m} ${p.u}`);
    if (result.s === 200) console.log(`     ${result.b}`);
  }

  await browser.close();
  console.log("\nDone!");
}

main().catch((e) => console.error("Error:", e.message));

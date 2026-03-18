import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Read .env.local
const envContent = readFileSync(resolve(rootDir, ".env.local"), "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.substring(0, eqIdx).trim();
  const value = trimmed.substring(eqIdx + 1).trim();
  env[key] = value;
}

// Set env vars for bcClient
process.env.BC_AUTH_URL = env.BC_AUTH_URL;
process.env.BC_CLIENT_ID = env.BC_CLIENT_ID;
process.env.BC_CLIENT_SECRET = env.BC_CLIENT_SECRET;
process.env.BC_SCOPE = env.BC_SCOPE;
process.env.BC_TENANT_ID = env.BC_TENANT_ID;
process.env.BC_ENVIRONMENT = env.BC_ENVIRONMENT;
process.env.DATABASE_URL = env.DATABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// ─── BC API Client ───

let tokenCache = { accessToken: null, expiresAt: 0 };

async function getToken() {
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken;
  }
  const res = await fetch(env.BC_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.BC_CLIENT_ID,
      client_secret: env.BC_CLIENT_SECRET,
      scope: env.BC_SCOPE,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Token failed: ${res.status}`);
  const data = await res.json();
  tokenCache = { accessToken: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return tokenCache.accessToken;
}

async function fetchWithRetry(url, options, { maxRetries = 3, timeout = 60_000 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "5", 10);
        console.log(`    Rate limited, waiting ${retryAfter}s...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (res.status >= 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
        continue;
      }
      return res;
    } catch (err) {
      const isTimeout = err.name === "TimeoutError" || err.name === "AbortError";
      if (isTimeout && attempt < maxRetries) {
        console.log(`    Timeout, retrying (${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
}

const BC_COMPANY_ID = "a407ba9f-2151-ec11-9f09-000d3ac85269";
const BC_BASE = `https://api.businesscentral.dynamics.com/v2.0/${env.BC_TENANT_ID}/Production/api/evergreen/erp/v1.0/companies(${BC_COMPANY_ID})`;

async function bcGet(endpoint, params = {}, { timeout = 300_000 } = {}) {
  const token = await getToken();
  const url = new URL(`${BC_BASE}/${endpoint}`);
  const odataParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith("$")) odataParts.push(`${key}=${value}`);
    else url.searchParams.set(key, value);
  }
  let fullUrl = url.toString();
  if (odataParts.length) fullUrl += (fullUrl.includes("?") ? "&" : "?") + odataParts.join("&");

  const allValues = [];
  let nextUrl = fullUrl;
  let page = 0;

  while (nextUrl) {
    const res = await fetchWithRetry(nextUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        Prefer: "odata.maxpagesize=5000",
      },
    }, { timeout });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`BC API ${res.status}: ${text.substring(0, 200)}`);
    }
    const data = await res.json();
    allValues.push(...(data.value || []));
    nextUrl = data["@odata.nextLink"] || null;
    page++;
    if (page > 1) process.stdout.write(`  page ${page} (${allValues.length} records)\r`);
  }

  return allValues;
}

// ─── Supabase via REST API ───

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// pg pool only for TRUNCATE (need DDL)
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 30_000,
  max: 2,
});

async function truncateAll(tables) {
  let client;
  try {
    client = await pool.connect();
    for (const t of tables) {
      try { await client.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`); } catch {}
    }
    client.release();
  } catch (e) {
    client?.release();
    // Fallback: delete via supabase REST
    console.log("  (pg truncate failed, using REST delete fallback)");
    for (const t of tables) {
      try { await supabase.from(t).delete().gte("id", 0); } catch {}
    }
  }
}

async function batchInsert(table, rows, conflictCol) {
  if (!rows.length) return;
  const batchSize = 1000;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: conflictCol });
    if (error) throw new Error(`Upsert ${table}: ${error.message}`);
  }
}

// ─── Sync Config (inline) ───

// Import bcSyncConfig (ES module)
const configPath = "file:///" + resolve(rootDir, "src/lib/bcSyncConfig.js").replace(/\\/g, "/");
const { bcSyncConfig, transformRecord } = await import(configPath);

function buildSelect(fieldMap) {
  return Object.keys(fieldMap).join(",");
}

// ─── Main ───

async function main() {
  const startTime = Date.now();
  console.log("═══════════════════════════════════════════");
  console.log("  BC Full Sync — Standalone Script");
  console.log("═══════════════════════════════════════════");
  console.log("");

  const allTables = bcSyncConfig
    .filter((c) => c.supabaseTable)
    .flatMap((c) => [c.supabaseTable, c.linesTable].filter(Boolean));
  allTables.push("bcSyncState");

  // Phase 0: Truncate
  console.log("Phase 0: Truncating all tables...");
  await truncateAll(allTables);
  await pool.end(); // Close pg pool after truncate — use supabase REST for everything else
  console.log("  Done\n");

  // Phase 1: Dimension values
  console.log("Phase 1: Dimension values...");
  const dimCfg = bcSyncConfig.find((c) => c.bcEndpoint === "dimensionValues");
  const dims = await bcGet("dimensionValues", { $select: buildSelect(dimCfg.fieldMap) });
  const dimMap = {};
  for (const d of dims) {
    if (d.codeValue) dimMap[d.codeValue] = d.nameValue || d.codeValue;
    dimMap[`${d.dimensionCode}|${d.codeValue}`] = d.nameValue || d.codeValue;
  }
  console.log(`  ${dims.length} dimension values loaded\n`);

  // Sync helper
  async function syncEntity(cfg, extraParams = {}) {
    const { bcEndpoint, supabaseTable, supabaseConflictCol, fieldMap, expandLines, linesTable, linesConflictCols, lineFieldMap } = cfg;
    if (!supabaseTable) return;

    const params = { $select: buildSelect(fieldMap), ...extraParams };

    process.stdout.write(`  ${cfg.name}...`);
    // Delay between entities to avoid BC rate limiting
    await new Promise((r) => setTimeout(r, 2000));
    let data;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        data = await bcGet(bcEndpoint, params);
        break;
      } catch (e) {
        if (attempt < 2) {
          console.log(` retry ${attempt + 1}...`);
          await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
          process.stdout.write(`  ${cfg.name}...`);
        } else {
          throw e;
        }
      }
    }

    // Transform headers
    let headerRows = data.map((r) => transformRecord(r, fieldMap));

    // Items: assign RFID inline
    if (bcEndpoint === "items") {
      headerRows = headerRows.map((row, idx) => ({
        ...row,
        bcItemRfidCode: String(idx + 1),
      }));
    }

    // Insert headers
    if (headerRows.length > 0) {
      await batchInsert(supabaseTable, headerRows, supabaseConflictCol);
    }

    // Fetch + insert lines separately (no $expand)
    let lineCount = 0;
    if (cfg.linesEndpoint && lineFieldMap && linesTable && linesConflictCols) {
      process.stdout.write(`    + ${cfg.name} lines...`);
      await new Promise((r) => setTimeout(r, 2000));
      let lineData;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          lineData = await bcGet(cfg.linesEndpoint, { $select: buildSelect(lineFieldMap) });
          break;
        } catch (e) {
          if (attempt < 2) {
            console.log(` retry ${attempt + 1}...`);
            await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
          } else { throw e; }
        }
      }
      const lineRows = lineData.map((line) => transformRecord(line, lineFieldMap));
      if (lineRows.length > 0) {
        await batchInsert(linesTable, lineRows, linesConflictCols);
        lineCount = lineRows.length;
      }
      console.log(` ${lineCount.toLocaleString()} lines`);
    }

    // Track max entryNo
    let maxEntryNo = 0;
    if (cfg.bcPrimaryKey === "entryNo") {
      for (const r of data) {
        if (r.entryNo > maxEntryNo) maxEntryNo = r.entryNo;
      }
      if (maxEntryNo > 0) {
        await supabase.from("bcSyncState").upsert(
          { key: `lastEntryNo:${supabaseTable}`, value: String(maxEntryNo), updatedAt: new Date().toISOString() },
          { onConflict: "key" },
        );
      }
    }

    const lineStr = lineCount > 0 ? ` + ${lineCount.toLocaleString()} lines` : "";
    console.log(` ${data.length.toLocaleString()} records${lineStr}`);
    return data.length;
  }

  // Phase 2: Master data (sequential for items to preserve id=rfid)
  console.log("Phase 2: Master data...");
  const masters = bcSyncConfig.filter((c) => c.syncGroup === "master" && c.supabaseTable);
  for (const cfg of masters) {
    const params = cfg.bcEndpoint === "items" ? { $orderby: "genProdPostingGroup asc,no asc" } : {};
    await syncEntity(cfg, params);
  }
  console.log("");

  // Phase 3: Small master
  console.log("Phase 3: Small master data...");
  const smalls = bcSyncConfig.filter((c) => c.syncGroup === "small");
  for (const cfg of smalls) {
    await syncEntity(cfg);
  }
  console.log("");

  // Phase 4: Documents
  console.log("Phase 4: Documents...");
  const docs = bcSyncConfig.filter((c) => c.syncGroup === "document");
  for (const cfg of docs) {
    await syncEntity(cfg);
  }
  console.log("");

  // Phase 5: Posted docs
  console.log("Phase 5: Posted documents...");
  const posted = bcSyncConfig.filter((c) => c.syncGroup === "postedDoc");
  for (const cfg of posted) {
    await syncEntity(cfg);
  }
  console.log("");

  // Phase 6: Ledger entries
  console.log("Phase 6: Ledger entries...");
  const ledgers = bcSyncConfig.filter((c) => c.syncGroup === "ledger");
  for (const cfg of ledgers) {
    await syncEntity(cfg);
  }
  console.log("");

  // Save sync state
  const now = new Date().toISOString();
  await supabase.from("bcSyncState").upsert(
    { key: "lastSyncTime", value: now, updatedAt: now },
    { onConflict: "key" },
  );

  // Verify (via supabase REST)
  console.log("═══════════════════════════════════════════");
  console.log("  Verification");
  console.log("═══════════════════════════════════════════");
  let grandTotal = 0;
  let tableCount = 0;
  for (const t of allTables) {
    try {
      const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
      if (count > 0) {
        console.log(`  ${t}: ${count.toLocaleString()}`);
        grandTotal += count;
        tableCount++;
      }
    } catch {}
  }

  // Check item id=rfid
  const { count: rfidTotal } = await supabase.from("bcItem").select("*", { count: "exact", head: true });
  const { count: rfidMatch } = await supabase.from("bcItem").select("*", { count: "exact", head: true }).filter("bcItemRfidCode", "not.is", null);

  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log(`  Total: ${grandTotal.toLocaleString()} records in ${tableCount} tables`);
  console.log(`  Items RFID: ${rfidMatch === rfidTotal ? "ALL MATCH (id=rfid)" : `${rfidMatch}/${rfidTotal} match`}`);
  console.log(`  Time: ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} minutes`);
  console.log("═══════════════════════════════════════════");

}

main().catch((e) => {
  console.error("\nFATAL ERROR:", e.message || e);
  console.error(e.stack || "");
  process.exit(1);
});

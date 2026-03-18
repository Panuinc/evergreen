import { createClient } from "@supabase/supabase-js";
import { bcCustomApiGet } from "@/lib/bcClient";
import {
  bcSyncConfig,
  getAllSupabaseTables,
  transformRecord,
  bcDate,
  bcTimestamp,
} from "@/lib/bcSyncConfig";

export const maxDuration = 300;

// ─── Helpers ───

async function batchUpsert(
  supabase,
  table,
  rows,
  { batchSize = 1000, concurrency = 3, onConflictCol, onProgress } = {},
) {
  if (!rows.length) return;
  const batches = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }
  let done = 0;
  for (let i = 0; i < batches.length; i += concurrency) {
    const chunk = batches.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map((batch) =>
        supabase.from(table).upsert(batch, { onConflict: onConflictCol }),
      ),
    );
    for (const { error } of results) {
      if (error) throw error;
    }
    done += chunk.length;
    onProgress?.(Math.min(done * batchSize, rows.length), rows.length);
  }
}

async function runParallel(tasks, concurrency) {
  const results = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const chunk = tasks.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(chunk.map((fn) => fn()));
    results.push(...chunkResults);
  }
  return results;
}

function buildSelectParam(fieldMap) {
  return Object.keys(fieldMap).join(",");
}



// ─── Sync state helpers ───

async function getSyncState(supabase, key) {
  const { data } = await supabase
    .from("bcSyncState")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value || null;
}

async function setSyncState(supabase, key, value) {
  await supabase.from("bcSyncState").upsert(
    { key, value: String(value), updatedAt: new Date().toISOString() },
    { onConflict: "key" },
  );
}

// ─── Lock ───

let syncLock = null;
const LOCK_TTL = 5 * 60 * 1000;

// ─── Route handler ───

export async function GET(request) {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (syncLock && Date.now() - syncLock < LOCK_TTL) {
    return Response.json(
      { error: "Sync is already running", lockedSince: new Date(syncLock).toISOString() },
      { status: 429 },
    );
  }
  syncLock = Date.now();

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode"); // "full" or null (incremental)
  const stream = url.searchParams.get("stream") !== "0"; // default SSE on

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!stream) {
    try {
      const result = await runSync(supabase, mode, () => {});
      return Response.json(result);
    } finally {
      syncLock = null;
    }
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      try {
        const result = await runSync(supabase, mode, send);
        send("done", result);
      } catch (e) {
        send("error", { message: e.message });
      } finally {
        syncLock = null;
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ─── Main sync orchestrator ───

async function runSync(supabase, mode, send) {
  const isFullSync = mode === "full";
  const results = {};
  const errors = {};
  const now = new Date().toISOString();

  // ── Phase 1: dimensionValues → build dimMap ──
  send("progress", { phase: "dimensionValues", step: "fetching", label: "Fetching dimension values..." });
  let dimMap = {};
  try {
    const dimCfg = bcSyncConfig.find((c) => c.bcEndpoint === "dimensionValues");
    const dims = await bcCustomApiGet("dimensionValues", {
      $select: buildSelectParam(dimCfg.fieldMap),
    });
    for (const d of dims) {
      // Use dimensionCode + codeValue as key to avoid duplicates across dimensions
      const key = `${d.dimensionCode}|${d.codeValue}`;
      dimMap[key] = d.nameValue || d.codeValue;
      // Also store by codeValue alone for backward compatibility
      if (d.codeValue) dimMap[d.codeValue] = d.nameValue || d.codeValue;
    }
    results.dimensionValues = dims.length;
    send("progress", { phase: "dimensionValues", step: "done", count: dims.length, label: `Dimension values: ${dims.length}` });
  } catch (e) {
    errors.dimensionValues = e.message;
    send("progress", { phase: "dimensionValues", step: "error", error: e.message });
  }

  // ── Full sync: delete all rows (use standalone script for TRUNCATE RESTART IDENTITY) ──
  if (isFullSync) {
    send("progress", { phase: "truncate", step: "truncating", label: "Deleting all rows..." });
    const allTables = getAllSupabaseTables();
    for (const table of allTables) {
      try {
        await supabase.from(table).delete().gte("id", 0);
      } catch {}
    }
    send("progress", { phase: "truncate", step: "done", label: "Tables cleared" });
  }

  // ── Phase 2: Master data (customers, vendors, items) ──
  send("progress", { phase: "master", step: "starting", label: "Syncing master data..." });

  const masterConfigs = bcSyncConfig.filter(
    (c) => c.syncGroup === "master" && c.supabaseTable,
  );

  if (isFullSync) {
    // Full sync: fetch all, no filter
    await runParallel(
      masterConfigs.map((cfg) => () => syncEntity(supabase, cfg, { isFullSync, send, results, errors, now })),
      3,
    );
  } else {
    // Incremental: master data does full upsert (no filter) to catch balance changes etc.
    await runParallel(
      masterConfigs.map((cfg) => () => syncEntity(supabase, cfg, { isFullSync: false, noFilter: true, send, results, errors, now })),
      3,
    );
  }

  // ── Items RFID logic (incremental only — full sync assigns inline) ──
  if (!isFullSync) {
    const itemCfg = bcSyncConfig.find((c) => c.bcEndpoint === "items");
    if (results[itemCfg.bcEndpoint] && results[itemCfg.bcEndpoint].count > 0) {
      send("progress", { phase: "items-rfid", step: "assigning", label: "Assigning RFID codes..." });
      try {
        await assignRfidCodes(supabase, itemCfg, isFullSync, send);
        send("progress", { phase: "items-rfid", step: "done", label: "RFID codes assigned" });
      } catch (e) {
        errors["items-rfid"] = e.message;
        send("progress", { phase: "items-rfid", step: "error", error: e.message });
      }
    }
  }

  if (isFullSync) {
    // ── Phase 3: Small master data ──
    send("progress", { phase: "small", step: "starting", label: "Syncing small master data..." });
    const smallConfigs = bcSyncConfig.filter((c) => c.syncGroup === "small");
    await runParallel(
      smallConfigs.map((cfg) => () => syncEntity(supabase, cfg, { isFullSync, send, results, errors, now })),
      5,
    );

    // ── Phase 4: Documents (salesOrders, purchaseOrders, salesInvoices, productionOrders) ──
    send("progress", { phase: "document", step: "starting", label: "Syncing documents..." });
    const docConfigs = bcSyncConfig.filter((c) => c.syncGroup === "document");
    await runParallel(
      docConfigs.map((cfg) => () => syncEntity(supabase, cfg, { isFullSync, send, results, errors, now })),
      4,
    );

    // ── Phase 5: Posted docs ──
    send("progress", { phase: "postedDoc", step: "starting", label: "Syncing posted documents..." });
    const postedConfigs = bcSyncConfig.filter((c) => c.syncGroup === "postedDoc");
    await runParallel(
      postedConfigs.map((cfg) => () => syncEntity(supabase, cfg, { isFullSync, send, results, errors, now })),
      4,
    );

    // ── Phase 6: Large ledger entries (valueEntries, itemLedgerEntries, gLEntries, customerLedgerEntries) ──
    send("progress", { phase: "ledger-large", step: "starting", label: "Syncing large ledger entries..." });
    const largeLedger = ["valueEntries", "itemLedgerEntries", "gLEntries", "customerLedgerEntries"];
    const largeLedgerConfigs = bcSyncConfig.filter((c) => largeLedger.includes(c.bcEndpoint));
    await runParallel(
      largeLedgerConfigs.map((cfg) => () => syncEntity(supabase, cfg, { isFullSync, send, results, errors, now })),
      4,
    );

    // ── Phase 7: Small ledger entries ──
    send("progress", { phase: "ledger-small", step: "starting", label: "Syncing small ledger entries..." });
    const smallLedger = ["vendorLedgerEntries", "detailedCustLedgerEntries", "detailedVendorLedgerEntries", "bankAccountLedgerEntries", "faLedgerEntries"];
    const smallLedgerConfigs = bcSyncConfig.filter((c) => smallLedger.includes(c.bcEndpoint));
    await runParallel(
      smallLedgerConfigs.map((cfg) => () => syncEntity(supabase, cfg, { isFullSync, send, results, errors, now })),
      5,
    );
  } else {
    // ── Incremental: all other entities in parallel with filters ──
    send("progress", { phase: "incremental", step: "starting", label: "Syncing incremental changes..." });
    const otherConfigs = bcSyncConfig.filter(
      (c) => c.syncGroup !== "master" && c.supabaseTable,
    );
    await runParallel(
      otherConfigs.map((cfg) => () => syncEntity(supabase, cfg, { isFullSync: false, send, results, errors, now })),
      5,
    );
  }

  // ── Update sync state ──
  try {
    await setSyncState(supabase, "lastSyncTime", now);
    // Update lastEntryNo for ledger tables
    for (const cfg of bcSyncConfig.filter((c) => c.syncGroup === "ledger")) {
      if (results[cfg.bcEndpoint] && typeof results[cfg.bcEndpoint] === "object" && results[cfg.bcEndpoint].maxEntryNo) {
        await setSyncState(supabase, `lastEntryNo:${cfg.supabaseTable}`, results[cfg.bcEndpoint].maxEntryNo);
      }
    }
  } catch (e) {
    errors.syncState = e.message;
  }

  send("progress", { phase: "complete", step: "done", label: "Sync complete" });
  return { ok: true, syncedAt: now, mode: isFullSync ? "full" : "incremental", results, errors: Object.keys(errors).length ? errors : undefined };
}

// ─── Generic entity sync ───

async function syncEntity(supabase, cfg, { isFullSync, noFilter, send, results, errors, now }) {
  const { bcEndpoint, supabaseTable, supabaseConflictCol, fieldMap, linesEndpoint, linesTable, linesConflictCols, lineFieldMap, incrementalFilter, bcPrimaryKey } = cfg;
  if (!supabaseTable) return; // skip dimensionValues

  send("progress", { phase: bcEndpoint, step: "fetching", label: `Fetching ${cfg.name}...` });

  try {
    // Build query params
    const params = {};
    const selectFields = buildSelectParam(fieldMap);
    params.$select = selectFields;

    // Lines are now fetched separately (no $expand)

    // Items special ordering for full sync
    if (bcEndpoint === "items" && isFullSync) {
      params.$orderby = "genProdPostingGroup asc,no asc";
    }

    // Incremental filter
    if (!isFullSync && !noFilter && incrementalFilter) {
      const lastSync = await getSyncState(supabase, "lastSyncTime");
      const lastEntryNo = await getSyncState(supabase, `lastEntryNo:${supabaseTable}`);

      if (incrementalFilter.length >= 2 && lastEntryNo) {
        // Ledger-style: filter by entryNo
        params.$filter = incrementalFilter(lastSync, parseInt(lastEntryNo));
      } else if (lastSync) {
        params.$filter = incrementalFilter(lastSync);
      }
      // If no lastSync and no lastEntryNo, fetch everything (first run)
    }

    // Fetch from BC (larger timeout for big tables like valueEntries)
    const bigEntities = ["valueEntries", "itemLedgerEntries", "gLEntries", "salesOrders", "postedSalesInvoices", "postedSalesShipments", "purchaseOrders", "postedPurchInvoices"];
    const fetchTimeout = bigEntities.includes(bcEndpoint) ? 300_000 : 180_000;
    const data = await bcCustomApiGet(bcEndpoint, params, { timeout: fetchTimeout });

    send("progress", {
      phase: bcEndpoint,
      step: "transforming",
      count: data.length,
      label: `${cfg.name}: ${data.length.toLocaleString()} records fetched`,
    });

    // Transform header rows
    let headerRows = data.map((record) => transformRecord(record, fieldMap));

    // Items: assign RFID inline during full sync (so id === rfid)
    if (bcEndpoint === "items" && isFullSync) {
      headerRows = headerRows.map((row, idx) => ({
        ...row,
        bcItemRfidCode: String(idx + 1),
      }));
    }

    // Fetch lines only if headers changed (or full sync)
    let lineRows = [];
    if (linesEndpoint && lineFieldMap && linesTable && (headerRows.length > 0 || isFullSync)) {
      send("progress", { phase: `${bcEndpoint}-lines`, step: "fetching", label: `Fetching ${cfg.name} lines...` });
      const lineParams = { $select: buildSelectParam(lineFieldMap) };
      const lineData = await bcCustomApiGet(linesEndpoint, lineParams, { timeout: fetchTimeout });
      lineRows = lineData.map((line) => transformRecord(line, lineFieldMap));
    }

    // Track max entryNo for ledger tables
    let maxEntryNo = 0;
    if (bcPrimaryKey === "entryNo") {
      for (const record of data) {
        if (record.entryNo > maxEntryNo) maxEntryNo = record.entryNo;
      }
    }

    // Upsert headers
    if (headerRows.length > 0) {
      send("progress", {
        phase: bcEndpoint,
        step: "saving",
        label: `Saving ${cfg.name}: ${headerRows.length.toLocaleString()} records...`,
      });
      // Items full sync: sequential upsert (concurrency 1) so id matches rfid order
      const upsertConcurrency = (bcEndpoint === "items" && isFullSync) ? 1 : 3;
      await batchUpsert(supabase, supabaseTable, headerRows, {
        concurrency: upsertConcurrency,
        onConflictCol: supabaseConflictCol,
        onProgress: (done, total) =>
          send("progress", {
            phase: bcEndpoint,
            step: "saving",
            done,
            total,
            label: `${cfg.name}: ${done.toLocaleString()}/${total.toLocaleString()}`,
          }),
      });
    }

    // Upsert lines
    if (lineRows.length > 0 && linesTable && linesConflictCols) {
      send("progress", {
        phase: `${bcEndpoint}-lines`,
        step: "saving",
        label: `Saving ${cfg.name} lines: ${lineRows.length.toLocaleString()} records...`,
      });
      await batchUpsert(supabase, linesTable, lineRows, {
        onConflictCol: linesConflictCols,
        onProgress: (done, total) =>
          send("progress", {
            phase: `${bcEndpoint}-lines`,
            step: "saving",
            done,
            total,
            label: `${cfg.name} lines: ${done.toLocaleString()}/${total.toLocaleString()}`,
          }),
      });
    }

    // Record results
    const result = { count: headerRows.length };
    if (lineRows.length > 0) result.lines = lineRows.length;
    if (maxEntryNo > 0) result.maxEntryNo = maxEntryNo;
    results[bcEndpoint] = result;

    send("progress", {
      phase: bcEndpoint,
      step: "done",
      count: headerRows.length,
      lines: lineRows.length || undefined,
      label: `${cfg.name}: ${headerRows.length.toLocaleString()} records${lineRows.length ? ` + ${lineRows.length.toLocaleString()} lines` : ""}`,
    });
  } catch (e) {
    errors[bcEndpoint] = e.message;
    send("progress", { phase: bcEndpoint, step: "error", error: e.message });
  }
}

// ─── Items RFID assignment ───

async function assignRfidCodes(supabase, itemCfg, isFullSync, send) {
  const table = itemCfg.supabaseTable;
  const pkCol = "bcItemNo";

  if (isFullSync) {
    // Full sync: sort by genProdPostingGroup ASC, no ASC and assign sequential 1, 2, 3...
    // Fetch all items ordered
    const allItems = [];
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select(`${pkCol}, bcItemGenProdPostingGroup`)
        .order("bcItemGenProdPostingGroup", { ascending: true })
        .order(pkCol, { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allItems.push(...data);
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    // Assign sequential RFID codes
    const updates = allItems.map((item, idx) => ({
      [pkCol]: item[pkCol],
      bcItemRfidCode: String(idx + 1),
    }));

    if (updates.length > 0) {
      await batchUpsert(supabase, table, updates, {
        onConflictCol: pkCol,
        onProgress: (done, total) =>
          send("progress", {
            phase: "items-rfid",
            step: "assigning",
            done,
            total,
            label: `RFID: ${done.toLocaleString()}/${total.toLocaleString()}`,
          }),
      });
    }
  } else {
    // Incremental: keep existing RFID codes, assign new for items without one
    // Get max existing RFID
    // Get max existing RFID
    let maxExisting = 0;
    const allRfid = [];
    let rfidOffset = 0;
    while (true) {
      const { data } = await supabase
        .from(table)
        .select("bcItemRfidCode")
        .not("bcItemRfidCode", "is", null)
        .range(rfidOffset, rfidOffset + 999);
      if (!data || data.length === 0) break;
      allRfid.push(...data);
      if (data.length < 1000) break;
      rfidOffset += 1000;
    }
    maxExisting = allRfid.reduce((max, r) => Math.max(max, parseInt(r.bcItemRfidCode) || 0), 0);

    // Find items without RFID (paginate to get all)
    const noRfid = [];
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error: fetchErr } = await supabase
        .from(table)
        .select(pkCol)
        .is("bcItemRfidCode", null)
        .order("bcItemGenProdPostingGroup", { ascending: true })
        .order(pkCol, { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (fetchErr) throw fetchErr;
      if (!data || data.length === 0) break;
      noRfid.push(...data);
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    if (noRfid && noRfid.length > 0) {
      let nextCode = maxExisting + 1;
      const updates = noRfid.map((item) => ({
        [pkCol]: item[pkCol],
        bcItemRfidCode: String(nextCode++),
      }));

      await batchUpsert(supabase, table, updates, {
        onConflictCol: pkCol,
        onProgress: (done, total) =>
          send("progress", {
            phase: "items-rfid",
            step: "assigning",
            done,
            total,
            label: `New RFID: ${done.toLocaleString()}/${total.toLocaleString()}`,
          }),
      });
    }
  }
}

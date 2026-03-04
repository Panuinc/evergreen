import { normalizeName } from "./parsers/base";

/**
 * Auto-match credit bank entries against open sales invoices.
 *
 * Strategies (in order):
 * 1. EXACT_AMOUNT_NAME  (0.95) — amount matches + customer name fuzzy match
 * 2. EXACT_AMOUNT_UNIQUE (0.90) — amount matches exactly one invoice
 * 3. CHECK_REF          (0.85) — cheque/ref number matches externalDocumentNumber
 * 4. AMOUNT_SUM         (0.75) — entry amount = sum of multiple invoices for same customer
 * 5. CUSTOMER_FIFO      (0.70) — name match → allocate FIFO from oldest invoices (partial/bulk)
 * 6. EXACT_AMOUNT_MULTI (0.60) — amount matches multiple invoices → suggested
 */
export function autoMatch(entries, invoices, customers) {
  // Build customer name lookup: customerNumber → normalized names
  const custNameMap = new Map();
  for (const c of customers) {
    const names = [
      normalizeName(c.bcCustomerDisplayName || ""),
      normalizeName(c.bcCustomerContact || ""),
    ].filter(Boolean);
    if (c.bcCustomerNumber) {
      custNameMap.set(c.bcCustomerNumber, names);
    }
  }

  // Build invoice lookup by remaining amount
  const invoicesByAmount = new Map();
  for (const inv of invoices) {
    const remaining = Number(inv.remainingAmount || inv.totalAmountIncludingTax || 0);
    if (remaining <= 0) continue;
    const key = remaining.toFixed(2);
    if (!invoicesByAmount.has(key)) invoicesByAmount.set(key, []);
    invoicesByAmount.get(key).push(inv);
  }

  // Group invoices by customer for sum/FIFO matching
  const invoicesByCustomer = new Map();
  for (const inv of invoices) {
    const remaining = Number(inv.remainingAmount || inv.totalAmountIncludingTax || 0);
    if (remaining <= 0) continue;
    const custNo = inv.customerNumber;
    if (!custNo) continue;
    if (!invoicesByCustomer.has(custNo)) invoicesByCustomer.set(custNo, []);
    invoicesByCustomer.get(custNo).push(inv);
  }

  const results = [];
  const matchedInvoiceIds = new Set();

  console.log(`[Match] ${entries.length} credit entries, ${invoices.length} open invoices, ${customers.length} customers`);

  for (const entry of entries) {
    if (entry.direction !== "credit") continue;
    if (entry.matchStatus !== "unmatched") continue;

    const entryAmount = Number(entry.amount);
    const entryCustomer = extractCustomerFromDesc(entry.description || "");
    const amountKey = entryAmount.toFixed(2);

    let bestMatch = null;

    // Strategy 1: EXACT_AMOUNT_NAME
    const amountMatches = (invoicesByAmount.get(amountKey) || []).filter(
      (inv) => !matchedInvoiceIds.has(inv.number || inv.id),
    );

    if (amountMatches.length > 0 && entryCustomer) {
      for (const inv of amountMatches) {
        const custNo = inv.customerNumber;
        const custNames = custNameMap.get(custNo) || [];
        const invCustName = normalizeName(inv.customerName || "");
        const allNames = [...custNames, invCustName].filter(Boolean);

        if (fuzzyNameMatch(entryCustomer, allNames)) {
          bestMatch = {
            entryId: entry.id,
            confidence: 0.95,
            method: "EXACT_AMOUNT_NAME",
            matches: [makeMatchRecord(inv, entryAmount)],
          };
          break;
        }
      }
    }

    // Strategy 2: EXACT_AMOUNT_UNIQUE
    if (!bestMatch && amountMatches.length === 1) {
      bestMatch = {
        entryId: entry.id,
        confidence: 0.90,
        method: "EXACT_AMOUNT_UNIQUE",
        matches: [makeMatchRecord(amountMatches[0], entryAmount)],
      };
    }

    // Strategy 3: CHECK_REF (cheque number in description)
    if (!bestMatch) {
      const refMatch = (entry.description || "").match(/\d{6,}/);
      if (refMatch) {
        const ref = refMatch[0];
        const refInv = invoices.find(
          (inv) =>
            !matchedInvoiceIds.has(inv.number || inv.id) &&
            (inv.externalDocumentNumber || "").includes(ref),
        );
        if (refInv) {
          bestMatch = {
            entryId: entry.id,
            confidence: 0.85,
            method: "CHECK_REF",
            matches: [makeMatchRecord(refInv, entryAmount)],
          };
        }
      }
    }

    // Strategy 4: AMOUNT_SUM — entry = sum of multiple invoices for same customer
    if (!bestMatch && entryCustomer) {
      for (const [custNo, custInvs] of invoicesByCustomer) {
        const custNames = custNameMap.get(custNo) || [];
        const invCustName = normalizeName(custInvs[0]?.customerName || "");
        const allNames = [...custNames, invCustName].filter(Boolean);
        if (!fuzzyNameMatch(entryCustomer, allNames)) continue;

        const available = custInvs.filter((inv) => !matchedInvoiceIds.has(inv.number || inv.id));
        const combo = findSubsetSum(available, entryAmount);
        if (combo && combo.length > 1) {
          bestMatch = {
            entryId: entry.id,
            confidence: 0.75,
            method: "AMOUNT_SUM",
            matches: combo.map((inv) => makeMatchRecord(inv, Number(inv.remainingAmount || inv.totalAmountIncludingTax))),
          };
          break;
        }
      }
    }

    // Strategy 5: CUSTOMER_FIFO — name match → allocate from oldest invoices first
    if (!bestMatch && entryCustomer) {
      const custMatch = findCustomerByName(entryCustomer, custNameMap, invoicesByCustomer);
      if (custMatch) {
        const available = custMatch.custInvs
          .filter((inv) => !matchedInvoiceIds.has(inv.number || inv.id))
          .sort((a, b) => (a.invoiceDate || "").localeCompare(b.invoiceDate || ""));

        if (available.length > 0) {
          let remaining = entryAmount;
          const allocated = [];

          for (const inv of available) {
            if (remaining <= 0.01) break;
            const invRemaining = Number(inv.remainingAmount || inv.totalAmountIncludingTax || 0);
            const allocate = Math.min(remaining, invRemaining);
            allocated.push(makeMatchRecord(inv, allocate));
            remaining -= allocate;
          }

          if (allocated.length > 0) {
            bestMatch = {
              entryId: entry.id,
              confidence: 0.70,
              method: "CUSTOMER_FIFO",
              matches: allocated,
            };
          }
        }
      }
    }

    // Strategy 6: EXACT_AMOUNT_MULTI (suggested — multiple invoices same amount)
    if (!bestMatch && amountMatches.length > 1) {
      bestMatch = {
        entryId: entry.id,
        confidence: 0.60,
        method: "EXACT_AMOUNT_MULTI",
        matches: amountMatches.map((inv) => makeMatchRecord(inv, entryAmount)),
      };
    }

    if (bestMatch) {
      console.log(`[Match] ✓ ${entry.description?.slice(0, 40)} → ${bestMatch.method} (${bestMatch.matches.map((m) => m.invoiceNumber).join(",")})`);
      if (bestMatch.method !== "EXACT_AMOUNT_MULTI" && bestMatch.method !== "CUSTOMER_FIFO") {
        for (const m of bestMatch.matches) {
          matchedInvoiceIds.add(m.invoiceNumber);
        }
      }
      results.push(bestMatch);
    } else {
      console.log(`[Match] ✗ ${entry.description?.slice(0, 40)} | amt=${entryAmount} | cust="${entryCustomer}"`);
    }
  }

  console.log(`[Match] Done: ${results.length} matched/suggested out of ${entries.length} entries`);
  return results;
}

// ─── Bank description → customer name extraction ───

// Noise to strip from bank descriptions before name matching
const DESC_NOISE = [
  // Transfer prefixes
  /^จาก\s*/,
  /^โอนจาก\s*/,
  /^โอนเข้าจาก\s*/,
  /^รับโอนจาก\s*/,
  // Transfer channel prefixes
  /\bSMART\b\s*/gi,
  /\bDIRECT\s*CREDIT?\b\s*/gi,
  /\bDIRECT\s*CR\b\s*/gi,
  /\bKBANK\s*PAYROLL\b\s*/gi,
  // Reference code prefix (no customer name)
  /รหัสอ้างอิง\s*/g,
  // Bank codes
  /\b(BBL|SCB|KTB|KBANK|KBank|TMB|TTB|TBANK|GSB|BAY|UOBT|CIMB|LHBANK|TISCO|BAAC|GHB)\b\s*/gi,
  // Account fragments like X1234, X12345
  /X\d{3,}\s*/g,
  // Ref patterns
  /\bRef\b\s*/gi,
  // PromptPay / Internet Banking
  /พร้อมเพย์\s*/g,
  /Internet\/Mobile\s*/gi,
  // Cheque patterns (no customer name — return empty)
  /เช็คเลขที่\s*\d+/g,
  // Standalone long numbers (account numbers, refs)
  /\b\d{4,}\b\s*/g,
  // Truncation markers anywhere
  /\+\+/g,
];

/**
 * Extract customer name from bank transaction description.
 * Strips bank-specific noise (transfer prefixes, bank codes, account numbers)
 * then normalizes the remaining text as a customer name.
 *
 * "จาก X8321 บจก. โฮม โปรดักส์ ++" → "โฮม โปรดักส์"
 * "จาก BBL X4181 MISS SUPASIRI VUDT++" → "supasiri vudt"
 * "UOBT 0123 เช็คเลขที่ 10183647" → "" (no customer name)
 */
function extractCustomerFromDesc(desc) {
  if (!desc) return "";
  let s = desc;
  // Strip noise patterns (includes ++ removal)
  for (const re of DESC_NOISE) {
    s = s.replace(re, " ");
  }
  s = s.replace(/\s+/g, " ").trim();
  // Now normalize as customer name (strips บริษัท/บจก./นาย/etc.)
  return normalizeName(s);
}

// Words to ignore when doing word-based matching (too common / not distinctive)
const NOISE_WORDS = new Set([
  "จำกัด", "มหาชน", "co", "ltd", "co.", "ltd.", "plc", "pcl",
  "company", "limited", "public", "the", "and", "of",
]);

/**
 * Check if extracted customer name matches any of the known customer names.
 * Uses includes check + word-based matching for truncated names.
 */
function fuzzyNameMatch(entryCustomer, names) {
  if (!entryCustomer) return false;
  for (const name of names) {
    if (!name) continue;
    // Direct includes (handles truncated names from ++)
    if (entryCustomer.includes(name) || name.includes(entryCustomer)) return true;
    // Word-based matching: if ≥50% of meaningful name words appear in description
    const nameWords = name.split(/\s+/).filter((w) => w.length >= 2 && !NOISE_WORDS.has(w));
    if (nameWords.length >= 2) {
      const matchCount = nameWords.filter((w) => entryCustomer.includes(w)).length;
      if (matchCount / nameWords.length >= 0.5) return true;
    }
    // Also check reverse: if entry words appear in the customer name
    const entryWords = entryCustomer.split(/\s+/).filter((w) => w.length >= 2 && !NOISE_WORDS.has(w));
    if (entryWords.length >= 2) {
      const matchCount = entryWords.filter((w) => name.includes(w)).length;
      if (matchCount / entryWords.length >= 0.5) return true;
    }
  }
  return false;
}

/**
 * Find a customer whose name appears in the bank entry description.
 * Returns { custNo, custInvs } or null.
 */
function findCustomerByName(entryCustomer, custNameMap, invoicesByCustomer) {
  for (const [custNo, names] of custNameMap) {
    if (!invoicesByCustomer.has(custNo)) continue;
    if (fuzzyNameMatch(entryCustomer, names)) {
      return { custNo, custInvs: invoicesByCustomer.get(custNo) };
    }
  }
  for (const [custNo, custInvs] of invoicesByCustomer) {
    const invCustName = normalizeName(custInvs[0]?.customerName || "");
    if (fuzzyNameMatch(entryCustomer, [invCustName])) {
      return { custNo, custInvs };
    }
  }
  return null;
}

function makeMatchRecord(invoice, matchedAmount) {
  return {
    invoiceNumber: invoice.number || invoice.id,
    customerNumber: invoice.customerNumber || "",
    customerName: invoice.customerName || "",
    invoiceAmount: Number(invoice.totalAmountIncludingTax || 0),
    remainingAmount: Number(invoice.remainingAmount || invoice.totalAmountIncludingTax || 0),
    matchedAmount,
  };
}

/**
 * Find a subset of invoices whose remaining amounts sum to target.
 * Simple brute-force for small sets (≤15 invoices per customer).
 */
function findSubsetSum(invoices, target, tolerance = 0.01) {
  if (invoices.length > 15) return null;
  const n = invoices.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    let sum = 0;
    const combo = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += Number(invoices[i].remainingAmount || invoices[i].totalAmountIncludingTax || 0);
        combo.push(invoices[i]);
      }
    }
    if (Math.abs(sum - target) < tolerance) return combo;
  }
  return null;
}

import { normalizeName } from "./parsers/base";


export function autoMatch(entries, invoices, customers, arByCustomer = new Map()) {

  const custNameMap = new Map();
  for (const c of customers) {
    const names = [
      normalizeName(c.bcCustomerNameValue || ""),
      normalizeName(c.bcCustomerContact || ""),
    ].filter(Boolean);
    if (c.bcCustomerNo) {
      custNameMap.set(c.bcCustomerNo, names);
    }
  }


  const invoicesByAmount = new Map();
  for (const inv of invoices) {
    const remaining = Number(inv.remainingAmount || inv.totalAmountIncludingTax || 0);
    if (remaining <= 0) continue;
    const key = remaining.toFixed(2);
    if (!invoicesByAmount.has(key)) invoicesByAmount.set(key, []);
    invoicesByAmount.get(key).push(inv);
  }


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


    if (!bestMatch && amountMatches.length === 1) {
      bestMatch = {
        entryId: entry.id,
        confidence: 0.90,
        method: "EXACT_AMOUNT_UNIQUE",
        matches: [makeMatchRecord(amountMatches[0], entryAmount)],
      };
    }


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


    if (!bestMatch && entryCustomer && arByCustomer.size > 0) {
      for (const [custNo, ar] of arByCustomer) {
        const arBalance = Number(ar.balanceDue || 0);
        if (arBalance <= 0 || Math.abs(entryAmount - arBalance) > 0.01) continue;


        const custNames = custNameMap.get(custNo) || [];
        const arName = normalizeName(ar.name || "");
        const allNames = [...custNames, arName].filter(Boolean);
        if (!fuzzyNameMatch(entryCustomer, allNames)) continue;


        const custInvs = (invoicesByCustomer.get(custNo) || [])
          .filter((inv) => !matchedInvoiceIds.has(inv.number || inv.id))
          .sort((a, b) => (a.invoiceDate || "").localeCompare(b.invoiceDate || ""));

        if (custInvs.length > 0) {
          let remaining = entryAmount;
          const allocated = [];
          for (const inv of custInvs) {
            if (remaining <= 0.01) break;
            const invRemaining = Number(inv.remainingAmount || inv.totalAmountIncludingTax || 0);
            const allocate = Math.min(remaining, invRemaining);
            allocated.push(makeMatchRecord(inv, allocate));
            remaining -= allocate;
          }
          if (allocated.length > 0) {
            bestMatch = {
              entryId: entry.id,
              confidence: 0.80,
              method: "AR_BALANCE",
              matches: allocated,
            };
            break;
          }
        }
      }
    }


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




const DESC_NOISE = [

  /^จาก\s*/,
  /^โอนจาก\s*/,
  /^โอนเข้าจาก\s*/,
  /^รับโอนจาก\s*/,

  /\bSMART\b\s*/gi,
  /\bDIRECT\s*CREDIT?\b\s*/gi,
  /\bDIRECT\s*CR\b\s*/gi,
  /\bKBANK\s*PAYROLL\b\s*/gi,

  /รหัสอ้างอิง\s*/g,

  /\b(BBL|SCB|KTB|KBANK|KBank|TMB|TTB|TBANK|GSB|BAY|UOBT|CIMB|LHBANK|TISCO|BAAC|GHB)\b\s*/gi,

  /X\d{3,}\s*/g,

  /\bRef\b\s*/gi,

  /พร้อมเพย์\s*/g,
  /Internet\/Mobile\s*/gi,

  /เช็คเลขที่\s*\d+/g,

  /\b\d{4,}\b\s*/g,

  /\+\+/g,
];


function extractCustomerFromDesc(desc) {
  if (!desc) return "";
  let s = desc;

  for (const re of DESC_NOISE) {
    s = s.replace(re, " ");
  }
  s = s.replace(/\s+/g, " ").trim();

  return normalizeName(s);
}


const NOISE_WORDS = new Set([
  "จำกัด", "มหาชน", "co", "ltd", "co.", "ltd.", "plc", "pcl",
  "company", "limited", "public", "the", "and", "of",
]);


function fuzzyNameMatch(entryCustomer, names) {
  if (!entryCustomer) return false;
  for (const name of names) {
    if (!name) continue;

    if (entryCustomer.includes(name) || name.includes(entryCustomer)) return true;

    const nameWords = name.split(/\s+/).filter((w) => w.length >= 2 && !NOISE_WORDS.has(w));
    if (nameWords.length >= 2) {
      const matchCount = nameWords.filter((w) => entryCustomer.includes(w)).length;
      if (matchCount / nameWords.length >= 0.5) return true;
    }

    const entryWords = entryCustomer.split(/\s+/).filter((w) => w.length >= 2 && !NOISE_WORDS.has(w));
    if (entryWords.length >= 2) {
      const matchCount = entryWords.filter((w) => name.includes(w)).length;
      if (matchCount / entryWords.length >= 0.5) return true;
    }
  }
  return false;
}


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

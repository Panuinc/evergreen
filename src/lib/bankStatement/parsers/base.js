/**
 * Base utilities for bank statement parsing.
 * All bank-specific parsers return the same shape:
 *
 * {
 *   metadata: { bankCode, accountNumber, periodStart, periodEnd, openingBalance, closingBalance },
 *   entries: [{ lineNumber, txDate, txTime, channel, description, txType, amount, balance, direction }]
 * }
 */

// Thai company/name prefixes to strip for matching
// IMPORTANT: longer prefixes MUST come before shorter ones (นางสาว before นาง)
const PREFIXES = [
  "ห้างหุ้นส่วนจำกัด",
  "บริษัท", "บจก.", "บจก", "บจ.", "บมจ.", "บมจ",
  "หจก.", "หจก",
  "นางสาว", "น.ส.", "น.ส", "นาง", "นาย", "คุณ",
  "MISS", "MRS.", "MRS", "MR.", "MR", "MS.",
  "CO.,LTD.", "CO.,LTD", "CO.LTD.", "CO. LTD.",
  "PUBLIC COMPANY LIMITED", "PCL.", "PCL",
  "จำกัด", "(มหาชน)",
];

/**
 * Normalize a Thai name/company for fuzzy comparison.
 * Strips prefixes, removes ++, trims, lowercases.
 */
export function normalizeName(text) {
  if (!text) return "";
  let s = text.trim();
  // Remove ++ truncation marker
  s = s.replace(/\+\+$/, "").replace(/\+\s*\+$/, "").trim();
  // Uppercase for prefix removal
  let upper = s.toUpperCase();
  for (const p of PREFIXES) {
    const pu = p.toUpperCase();
    if (upper.startsWith(pu)) {
      s = s.slice(p.length).trim();
      upper = s.toUpperCase();
    }
  }
  // Collapse whitespace and lowercase
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Parse a Thai numeric string like "1,234,567.89" → number.
 */
export function parseAmount(s) {
  if (!s) return 0;
  return Number(String(s).replace(/,/g, "")) || 0;
}

/**
 * Convert KBank-style date "DD-MM-YY" → ISO "YYYY-MM-DD".
 * YY is Buddhist Era mod 100 but KBank uses CE year.
 */
export function parseDateDDMMYY(d) {
  if (!d) return null;
  const parts = d.split("-");
  if (parts.length !== 3) return null;
  const [dd, mm, yy] = parts;
  const year = 2000 + parseInt(yy, 10);
  return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

// Transaction types that indicate deposits (credits)
export const CREDIT_TYPES = new Set([
  "รับโอนเงิน",
  "รับโอนเงินอัตโนมัติ",
  "ฝากด้วยเช็ค",
  "ฝากเงินสด",
  "ฝากเงิน",
  "รับชำระเงิน",
]);

// Transaction types that indicate withdrawals (debits)
export const DEBIT_TYPES = new Set([
  "โอนเงิน",
  "ชำระเงิน",
  "หักบัญชีอัตโนมัติ",
  "ถอนเงิน",
  "ค่าธรรมเนียม",
  "ค่าธรรมเนียม SMS ขยันบอก / อื่น ๆ",
]);

/**
 * Convert BBL-style date "DD/MM/YYYY" → ISO "YYYY-MM-DD".
 */
export function parseDateDDMMYYYY(d) {
  if (!d) return null;
  const parts = d.split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

/**
 * Determine direction from txType text.
 */
export function getDirection(txType) {
  if (!txType) return "debit";
  for (const ct of CREDIT_TYPES) {
    if (txType.includes(ct)) return "credit";
  }
  return "debit";
}

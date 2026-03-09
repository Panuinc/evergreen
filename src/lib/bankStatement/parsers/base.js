


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


export function normalizeName(text) {
  if (!text) return "";
  let s = text.trim();

  s = s.replace(/\+\+$/, "").replace(/\+\s*\+$/, "").trim();

  let upper = s.toUpperCase();
  for (const p of PREFIXES) {
    const pu = p.toUpperCase();
    if (upper.startsWith(pu)) {
      s = s.slice(p.length).trim();
      upper = s.toUpperCase();
    }
  }

  return s.replace(/\s+/g, " ").trim().toLowerCase();
}


export function parseAmount(s) {
  if (!s) return 0;
  return Number(String(s).replace(/,/g, "")) || 0;
}


export function parseDateDDMMYY(d) {
  if (!d) return null;
  const parts = d.split("-");
  if (parts.length !== 3) return null;
  const [dd, mm, yy] = parts;
  const year = 2000 + parseInt(yy, 10);
  return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}


export const CREDIT_TYPES = new Set([
  "รับโอนเงิน",
  "รับโอนเงินอัตโนมัติ",
  "ฝากด้วยเช็ค",
  "ฝากเงินสด",
  "ฝากเงิน",
  "รับชำระเงิน",
]);


export const DEBIT_TYPES = new Set([
  "โอนเงิน",
  "ชำระเงิน",
  "หักบัญชีอัตโนมัติ",
  "ถอนเงิน",
  "ค่าธรรมเนียม",
  "ค่าธรรมเนียม SMS ขยันบอก / อื่น ๆ",
]);


export function parseDateDDMMYYYY(d) {
  if (!d) return null;
  const parts = d.split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}


export function getDirection(txType) {
  if (!txType) return "debit";
  for (const ct of CREDIT_TYPES) {
    if (txType.includes(ct)) return "credit";
  }
  return "debit";
}

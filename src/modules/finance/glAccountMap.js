/**
 * GL Account Mapping for CHH Financial Reports
 * Based on CFO's Excel structure (งบการเงิน CHH)
 *
 * Key insight: Some 52xx/53xx accounts are reclassified to COGS
 * because they are manufacturing-related (factory rent, maintenance, depreciation)
 */

// ─── Manufacturing Overhead → COGS (โสหุ้ยการผลิต) ───
// These 52xx/53xx accounts are factory costs → classified as COGS per TAS cost accounting
export const COGS_OVERRIDE_ACCOUNTS = new Set([
  "52000-09",   // ค่าเช่าโรงงาน (Factory Rent)
  "53200-06",   // ซ่อมบำรุง-อาคารและสิ่งปลูกสร้าง
  "53200-08",   // ซ่อมบำรุง-เครื่องจักร
  "53200-13",   // ซ่อมบำรุง-อาคารโรงงาน
  "53200-14",   // ค่าน้ำมันรถโฟล์คลิฟท์
  "53400-01",   // ค่าเสื่อมราคา-อาคารและสิ่งปลูกสร้าง
  "53400-02",   // ค่าเสื่อมราคา-เครื่องจักร
  "53900-14",   // ค่าแรงบวกกลับ
]);

// ─── Interest (ต้นทุนทางการเงิน) ───
// 53710-xx accounts are finance costs, separated from admin per Manager Account Excel
export const INTEREST_ACCOUNTS = new Set([
  "53710-01",   // ดอกเบี้ยจ่าย-เงินกู้ธนาคาร
  "53710-02",   // ดอกเบี้ยจ่าย-เช่าซื้อ
  "53710-03",   // ดอกเบี้ยจ่าย-เงินกู้กรรมการ
  "53710-04",   // ดอกเบี้ยจ่าย-อื่นๆ
  "53710-05",   // ดอกเบี้ยเช่าซื้อ
]);

// ─── Admin Override (ค่าใช้จ่ายบริหาร) ───
// 52000-10 ค่าเช่ายานพาหนะ is admin per Manager Account Excel
export const ADMIN_OVERRIDE_ACCOUNTS = new Set([
  "52000-10",   // ค่าเช่ายานพาหนะ (Vehicle Rental → Admin)
]);

// ─── COGS Structure (matches ต้นทุน_68 sheet) ───
export const COGS_STRUCTURE = [
  {
    key: "beginningInventory",
    label: "สินค้าคงเหลือต้นงวด",
    labelEn: "Beginning Inventory",
    accounts: ["51200-00"],
    isHeader: false,
  },
  {
    key: "rawMaterials",
    label: "ซื้อวัตถุดิบและอุปกรณ์",
    labelEn: "Raw Materials & Equipment",
    accounts: ["51400-01"],
  },
  {
    key: "supplies",
    label: "วัสดุสิ้นเปลือง",
    labelEn: "Supplies",
    accounts: ["51400-02"],
  },
  {
    key: "purchaseDiscounts",
    label: "ส่วนลดรับ",
    labelEn: "Purchase Discounts",
    accounts: ["51400-03"],
  },
  {
    key: "importFreight",
    label: "ค่าระวางและค่าขนส่ง",
    labelEn: "Import Freight",
    accounts: ["51410-01"],
  },
  {
    key: "importDuties",
    label: "ค่าอากรขาเข้า",
    labelEn: "Import Duties",
    accounts: ["51410-02"],
  },
  {
    key: "otherImport",
    label: "ค่าใช้จ่ายนำเข้าอื่นๆ",
    labelEn: "Other Import Costs",
    accounts: ["51410-03", "51410-04"],
  },
  {
    key: "laborDaily",
    label: "ค่าจ้างแรงงานรายวัน",
    labelEn: "Daily Worker Wages",
    accounts: ["51420-01"],
  },
  {
    key: "laborSubcontract",
    label: "ค่าจ้างแรงงานช่างเหมา",
    labelEn: "Subcontractor Labor",
    accounts: ["51420-02"],
  },
  {
    key: "laborOutsource",
    label: "ค่าจ้างแรงงานนอก",
    labelEn: "Outsourced Labor",
    accounts: ["51420-03"],
  },
  {
    key: "laborPainting",
    label: "ค่าจ้างแรงงานช่างเหมา (ทำสี)",
    labelEn: "Painting Labor",
    accounts: ["51420-04"],
  },
  {
    key: "laborMfg",
    label: "ค่าจ้างทำของ",
    labelEn: "Manufacturing Labor",
    accounts: ["51420-05"],
  },
  {
    key: "services",
    label: "ค่าบริการ",
    labelEn: "Services",
    accounts: ["51430-01"],
  },
  // ─── Manufacturing Overhead (โสหุ้ยการผลิต) ───
  {
    key: "factoryRent",
    label: "ค่าเช่าโรงงาน",
    labelEn: "Factory Rent",
    accounts: ["52000-09"],
  },
  {
    key: "maintenanceBuilding",
    label: "ซ่อมบำรุง-อาคารและสิ่งปลูกสร้าง",
    labelEn: "Building Maintenance",
    accounts: ["53200-06"],
  },
  {
    key: "maintenanceMachine",
    label: "ซ่อมบำรุง-เครื่องจักร",
    labelEn: "Machine Maintenance",
    accounts: ["53200-08"],
  },
  {
    key: "maintenanceFactory",
    label: "ซ่อมบำรุง-อาคารโรงงาน",
    labelEn: "Factory Building Maintenance",
    accounts: ["53200-13"],
  },
  {
    key: "forkliftFuel",
    label: "ค่าน้ำมันรถโฟล์คลิฟท์",
    labelEn: "Forklift Fuel",
    accounts: ["53200-14"],
  },
  {
    key: "depreciationBuilding",
    label: "ค่าเสื่อมราคา-อาคารและสิ่งปลูกสร้าง",
    labelEn: "Building Depreciation",
    accounts: ["53400-01"],
  },
  {
    key: "depreciationMachine",
    label: "ค่าเสื่อมราคา-เครื่องจักร",
    labelEn: "Machine Depreciation",
    accounts: ["53400-02"],
  },
  {
    key: "laborAdjust",
    label: "ค่าแรงบวกกลับ",
    labelEn: "Labor Adjustment",
    accounts: ["53900-14"],
  },
];

// ─── Calendar Year Constants (January–December, ปีปฏิทิน) ───
export const CAL_MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
export const CAL_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/**
 * Get 2-digit BE year suffix for a calendar month column.
 * @param {number} i - index in CAL_MONTHS (0=Jan, ..., 11=Dec)
 * @param {number} adYear - the AD year (e.g. 2025 for พ.ศ. 2568)
 */
export function calMonthBE(i, adYear) {
  return String((adYear + 543) % 100).padStart(2, "0");
}

// ─── Inventory accounts (for ending inventory deduction in COGS) ───
export const INVENTORY_ACCOUNTS = [
  { key: "rawMaterial", label: "วัตถุดิบคงเหลือ", labelEn: "Raw Material", account: "11500-01" },
  { key: "wip", label: "สินค้าระหว่างผลิต", labelEn: "Work-in-Process", account: "11500-02" },
  { key: "finishedGoods", label: "สินค้าสำเร็จรูป", labelEn: "Finished Goods", account: "11500-03" },
];

// ─── P&L Row Definitions (for Monthly P&L table) ───
export const PNL_ROWS = [
  // Revenue
  { key: "h_revenue", label: "รายได้", type: "header" },
  { key: "41000-01", label: "รายได้จากการขายสินค้า", type: "account", prefix: "41000-01" },
  { key: "41000-03", label: "ส่วนลดจ่าย", type: "account", prefix: "41000-03" },
  { key: "sub_salesRevenue", label: "รายได้จากการขายสุทธิ", type: "subtotal", sumKeys: ["41000-01", "41000-03"] },
  { key: "h_otherIncome", label: "รายได้อื่นๆ", type: "header" },
  { key: "42000-02", label: "รายได้จากการบริการ", type: "account", prefix: "42000-02" },
  { key: "42000-03", label: "รายได้ค่าขนส่ง", type: "account", prefix: "42000-03" },
  { key: "43000-01", label: "ดอกเบี้ยรับ", type: "account", prefix: "43000-01" },
  { key: "43000-03", label: "กำไร(ขาดทุน) จากอัตราแลกเปลี่ยน", type: "account", prefix: "43000-03" },
  { key: "43000-05", label: "รายได้อื่นๆ", type: "account", prefix: "43000-05" },
  { key: "43000-06", label: "รายได้จากการประนอมหนี้", type: "account", prefix: "43000-06" },
  { key: "sub_otherIncome", label: "รวมรายได้อื่น", type: "subtotal", group: "otherIncome" },
  { key: "total_revenue", label: "รวมรายได้", type: "total", sumGroups: ["salesRevenue", "otherIncome"] },
  // COGS
  { key: "h_cogs", label: "ต้นทุนขาย", type: "header" },
  { key: "computed_cogs", label: "ต้นทุนการขาย", type: "computed", computeKey: "cogs" },
  // Expenses
  { key: "h_selling", label: "ค่าใช้จ่ายในการขาย", type: "header" },
  { key: "computed_selling", label: "ค่าใช้จ่ายในการขาย", type: "computed", computeKey: "selling" },
  { key: "h_admin", label: "ค่าใช้จ่ายในการบริหาร", type: "header" },
  { key: "computed_admin", label: "ค่าใช้จ่ายในการบริหาร", type: "computed", computeKey: "admin" },
  { key: "total_expenses", label: "รวมค่าใช้จ่าย", type: "total", sumGroups: ["cogs", "selling", "admin"] },
  // Profit
  { key: "h_profit", label: "กำไร", type: "header" },
  { key: "computed_netProfit", label: "กำไรสุทธิก่อนภาษี", type: "grandTotal", computeKey: "netProfit" },
];

// ─── Account Classification ───

export function classifyAccount(accountNumber) {
  if (!accountNumber) return "other";
  // Manufacturing overhead → COGS (โสหุ้ยการผลิต)
  if (COGS_OVERRIDE_ACCOUNTS.has(accountNumber)) return "cogs";
  // Interest → ต้นทุนทางการเงิน (separated from admin per Manager Account Excel)
  if (INTEREST_ACCOUNTS.has(accountNumber)) return "interest";
  // Vehicle rental → admin (52000-10)
  if (ADMIN_OVERRIDE_ACCOUNTS.has(accountNumber)) return "admin";
  const prefix = accountNumber.substring(0, 2);
  switch (prefix) {
    case "11": case "12": return "assets";
    case "21": case "22": return "liabilities";
    case "31": case "33": return "equity";
    case "41": return "salesRevenue";
    case "42": return "serviceRevenue";
    case "43": return "otherIncome";
    case "51": return "cogs";
    case "52": return "selling";
    case "53": return "admin";
    default: return "other";
  }
}

// ─── COGS from GL totals ───

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

/**
 * Return COGS from GL monthly totals.
 *
 * monthlyTotals["cogs"] includes all 51xxx accounts:
 *   51200-00 (Beginning Inventory, debit = positive)
 *   51300-00 (Ending Inventory, credit = negative)
 *   51400-xx (Purchases), 51420-xx (Labor), 51430-xx (Services)
 *
 * For a closed fiscal year this equals:
 *   BeginInv + Purchases + Labor + Services + Overhead − EndInv = correct COGS
 *
 * No further inventory adjustment is needed here; page.jsx handles
 * unclosed-year adjustments using trial-balance inventory balances.
 */
export function computeAdjustedCogs(byAccount, monthlyTotals) {
  const raw = monthlyTotals?.["cogs"] || { months: {}, total: 0 };
  const months = {};
  for (const m of MONTHS) months[m] = raw.months[m] || 0;
  return { months, total: raw.total };
}

// ─── GL Entry Aggregation ───

/**
 * Aggregate raw GL entries into monthly summaries per account.
 * @param {Array} entries - Raw GL entries from BC API
 * @returns {{ byAccount: Object, monthlyTotals: Object }}
 */
export function aggregateGlEntries(entries) {
  if (!entries || !entries.length) return { byAccount: {}, monthlyTotals: {} };

  const byAccount = {};

  for (const entry of entries) {
    const mm = entry.postingDate?.substring(5, 7); // "01"-"12"
    const acct = entry.accountNumber;
    if (!mm || !acct) continue;

    if (!byAccount[acct]) {
      byAccount[acct] = {
        account: acct,
        name: entry.accountName || acct,
        category: classifyAccount(acct),
        months: {},
        total: 0,
      };
    }

    const debit = entry.debitAmount || 0;
    const credit = entry.creditAmount || 0;
    // For expense/COGS accounts: net = debit - credit (positive = expense)
    // For revenue accounts: net = credit - debit (positive = income)
    const cat = byAccount[acct].category;
    const isCredit = ["salesRevenue", "serviceRevenue", "otherIncome", "liabilities", "equity"].includes(cat);
    const net = isCredit ? (credit - debit) : (debit - credit); // interest is debit-side (expense)

    if (!byAccount[acct].months[mm]) byAccount[acct].months[mm] = 0;
    byAccount[acct].months[mm] += net;
    byAccount[acct].total += net;
  }

  // Compute monthly totals by category
  const monthlyTotals = {};
  for (const acct of Object.values(byAccount)) {
    const cat = acct.category;
    if (!monthlyTotals[cat]) {
      monthlyTotals[cat] = { months: {}, total: 0 };
      for (const m of MONTHS) monthlyTotals[cat].months[m] = 0;
    }
    for (const m of MONTHS) {
      monthlyTotals[cat].months[m] += acct.months[m] || 0;
    }
    monthlyTotals[cat].total += acct.total;
  }

  return { byAccount, monthlyTotals };
}

/**
 * Compute monthly P&L summary from aggregated data.
 * Returns array of rows for the Monthly P&L table.
 */
export function computeMonthlyPnL(byAccount, monthlyTotals) {
  if (!monthlyTotals || !Object.keys(monthlyTotals).length) return [];

  const mt = (cat) => monthlyTotals[cat] || { months: {}, total: 0 };
  const sumMonths = (...cats) => {
    const result = {};
    for (const m of MONTHS) {
      result[m] = cats.reduce((sum, cat) => sum + (mt(cat).months[m] || 0), 0);
    }
    return result;
  };
  const sumTotal = (...cats) => cats.reduce((sum, cat) => sum + (mt(cat).total || 0), 0);

  // Revenue
  const salesRevenueMonths = mt("salesRevenue").months;
  const salesRevenueTotal = mt("salesRevenue").total;
  const serviceMonths = mt("serviceRevenue").months;
  const serviceTotal = mt("serviceRevenue").total;
  const otherIncMonths = mt("otherIncome").months;
  const otherIncTotal = mt("otherIncome").total;
  const totalRevMonths = sumMonths("salesRevenue", "serviceRevenue", "otherIncome");
  const totalRevTotal = sumTotal("salesRevenue", "serviceRevenue", "otherIncome");

  // COGS (adjusted for inventory change)
  const adjustedCogs = computeAdjustedCogs(byAccount, monthlyTotals);
  const cogsMonths = adjustedCogs.months;
  const cogsTotal = adjustedCogs.total;

  // Gross profit
  const grossMonths = {};
  for (const m of MONTHS) grossMonths[m] = (totalRevMonths[m] || 0) - (cogsMonths[m] || 0);
  const grossTotal = totalRevTotal - cogsTotal;

  // Expenses
  const sellingMonths = mt("selling").months;
  const sellingTotal = mt("selling").total;
  const adminMonths = mt("admin").months;
  const adminTotal = mt("admin").total;
  const interestMonths = mt("interest").months;
  const interestTotal = mt("interest").total;

  // Operating profit = Gross Profit - Selling - Admin
  const opMonths = {};
  for (const m of MONTHS) {
    opMonths[m] = (grossMonths[m] || 0) - (sellingMonths[m] || 0) - (adminMonths[m] || 0);
  }
  const opTotal = grossTotal - sellingTotal - adminTotal;

  // Net profit = Operating Profit - Interest
  const netMonths = {};
  for (const m of MONTHS) {
    netMonths[m] = (opMonths[m] || 0) - (interestMonths[m] || 0);
  }
  const netTotal = opTotal - interestTotal;

  return [
    { key: "salesRevenue", label: "รายได้จากการขาย", months: salesRevenueMonths, total: salesRevenueTotal, type: "item" },
    { key: "serviceRevenue", label: "รายได้จากบริการ", months: serviceMonths, total: serviceTotal, type: "item" },
    { key: "otherIncome", label: "รายได้อื่น", months: otherIncMonths, total: otherIncTotal, type: "item" },
    { key: "totalRevenue", label: "รวมรายได้", months: totalRevMonths, total: totalRevTotal, type: "subtotal" },
    { key: "_sep1", type: "separator" },
    { key: "cogs", label: "ต้นทุนขาย", months: cogsMonths, total: cogsTotal, type: "item" },
    { key: "grossProfit", label: "กำไรขั้นต้น", months: grossMonths, total: grossTotal, type: "subtotal" },
    { key: "_sep2", type: "separator" },
    { key: "selling", label: "ค่าใช้จ่ายในการขาย", months: sellingMonths, total: sellingTotal, type: "item" },
    { key: "admin", label: "ค่าใช้จ่ายในการบริหาร", months: adminMonths, total: adminTotal, type: "item" },
    { key: "operatingProfit", label: "กำไรก่อนต้นทุนทางการเงิน", months: opMonths, total: opTotal, type: "subtotal" },
    { key: "_sep3", type: "separator" },
    { key: "interest", label: "ต้นทุนทางการเงิน (53710-xx)", months: interestMonths, total: interestTotal, type: "item" },
    { key: "netProfit", label: "กำไรสุทธิก่อนภาษี", months: netMonths, total: netTotal, type: "grandTotal" },
  ];
}

/**
 * Compute COGS detail from aggregated data.
 * Matches the ต้นทุน_68 sheet structure.
 */
export function computeCogsDetail(byAccount) {
  if (!byAccount || !Object.keys(byAccount).length) return [];

  const getRow = (struct) => {
    const months = {};
    let total = 0;
    for (const acctNo of struct.accounts) {
      const acct = byAccount[acctNo];
      if (!acct) continue;
      for (const m of MONTHS) {
        if (!months[m]) months[m] = 0;
        months[m] += acct.months[m] || 0;
      }
      total += acct.total;
    }
    return { key: struct.key, label: struct.label, labelEn: struct.labelEn, months, total, type: "item" };
  };

  const rows = COGS_STRUCTURE.map(getRow);

  // Compute production total
  const prodMonths = {};
  let prodTotal = 0;
  for (const row of rows) {
    for (const m of MONTHS) {
      if (!prodMonths[m]) prodMonths[m] = 0;
      prodMonths[m] += row.months[m] || 0;
    }
    prodTotal += row.total;
  }
  rows.push({ key: "productionTotal", label: "ต้นทุนสินค้าที่ผลิตได้", type: "subtotal", months: prodMonths, total: prodTotal });

  // Ending inventory (deduction) — known accounts as named rows
  const knownInvAccounts = new Set(INVENTORY_ACCOUNTS.map((i) => i.account));
  const invRows = INVENTORY_ACCOUNTS.map((inv) => {
    const acct = byAccount[inv.account];
    const months = {};
    let total = 0;
    if (acct) {
      for (const m of MONTHS) {
        months[m] = -(acct.months[m] || 0); // negate: deduction from COGS
      }
      total = -acct.total;
    }
    return { key: inv.key, label: `หัก: ${inv.label}`, labelEn: `Less: ${inv.labelEn}`, months, total, type: "deduction" };
  });

  // Catch additional 115xx inventory accounts not in the known list
  for (const [acctNo, acct] of Object.entries(byAccount)) {
    if (!acctNo.startsWith("115") || knownInvAccounts.has(acctNo)) continue;
    const months = {};
    let total = 0;
    for (const m of MONTHS) months[m] = -(acct.months[m] || 0);
    total = -acct.total;
    invRows.push({ key: acctNo, label: `หัก: ${acct.name || acctNo}`, months, total, type: "deduction" });
  }
  rows.push(...invRows);

  // Total ending inventory
  const endInvMonths = {};
  let endInvTotal = 0;
  for (const r of invRows) {
    for (const m of MONTHS) {
      if (!endInvMonths[m]) endInvMonths[m] = 0;
      endInvMonths[m] += r.months[m] || 0;
    }
    endInvTotal += r.total;
  }
  rows.push({ key: "endingInventory", label: "หัก: สินค้าคงเหลือปลายงวด", type: "subtotal", months: endInvMonths, total: endInvTotal });

  // COGS total — must subtract beginning inventory (51200-00) from production
  // total to avoid double-counting (same fix as computeAdjustedCogs).
  const beginInv = byAccount?.["51200-00"];
  const beginInvMonths = {};
  let beginInvTotal = 0;
  if (beginInv) {
    for (const m of MONTHS) beginInvMonths[m] = beginInv.months[m] || 0;
    beginInvTotal = beginInv.total || 0;
  }

  const cogsMonths = {};
  for (const m of MONTHS) {
    cogsMonths[m] = (prodMonths[m] || 0) - (beginInvMonths[m] || 0) + (endInvMonths[m] || 0);
  }
  const cogsTotal = prodTotal - beginInvTotal + endInvTotal;
  rows.push({ key: "cogsTotal", label: "ต้นทุนขาย", type: "grandTotal", months: cogsMonths, total: cogsTotal });

  return rows;
}

/**
 * Compute expense detail from aggregated data.
 * Groups accounts by account number, separated into selling vs admin.
 */
export function computeExpenseDetail(byAccount, type) {
  if (!byAccount) return [];

  const rows = [];
  const accounts = Object.values(byAccount).filter((a) => a.category === type);
  accounts.sort((a, b) => a.account.localeCompare(b.account));

  let totalMonths = {};
  let totalAmount = 0;

  for (const acct of accounts) {
    rows.push({
      key: acct.account,
      label: acct.name,
      account: acct.account,
      months: acct.months,
      total: acct.total,
      type: "item",
    });
    for (const m of MONTHS) {
      if (!totalMonths[m]) totalMonths[m] = 0;
      totalMonths[m] += acct.months[m] || 0;
    }
    totalAmount += acct.total;
  }

  const totalLabels = {
    selling: "รวมค่าใช้จ่ายในการขาย",
    admin: "รวมค่าใช้จ่ายในการบริหาร",
    interest: "รวมต้นทุนทางการเงิน",
  };
  rows.push({
    key: `total_${type}`,
    label: totalLabels[type] || `รวม ${type}`,
    months: totalMonths,
    total: totalAmount,
    type: "grandTotal",
  });

  return rows;
}

/**
 * Compute revenue detail from aggregated data.
 */
export function computeRevenueDetail(byAccount) {
  if (!byAccount) return [];

  const rows = [];
  const revenueTypes = ["salesRevenue", "serviceRevenue", "otherIncome"];
  const accounts = Object.values(byAccount).filter((a) => revenueTypes.includes(a.category));
  accounts.sort((a, b) => a.account.localeCompare(b.account));

  let totalMonths = {};
  let totalAmount = 0;

  for (const acct of accounts) {
    rows.push({
      key: acct.account,
      label: acct.name,
      account: acct.account,
      months: acct.months,
      total: acct.total,
      type: "item",
    });
    for (const m of MONTHS) {
      if (!totalMonths[m]) totalMonths[m] = 0;
      totalMonths[m] += acct.months[m] || 0;
    }
    totalAmount += acct.total;
  }

  rows.push({
    key: "total_revenue",
    label: "รวมรายได้ทั้งหมด",
    months: totalMonths,
    total: totalAmount,
    type: "grandTotal",
  });

  return rows;
}

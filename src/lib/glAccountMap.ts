


interface GlAccountEntry {
  account: string;
  name: string;
  category: string;
  months: Record<string, number>;
  total: number;
}

interface GlRow {
  key: string;
  label?: string;
  labelEn?: string;
  account?: string;
  months: Record<string, number>;
  total: number;
  type: string;
}

export const cogsOverrideAccounts = new Set([
  "52000-09",
  "53200-06",
  "53200-08",
  "53200-13",
  "53200-14",
  "53400-01",
  "53400-02",
  "53900-14",
]);


export const interestAccounts = new Set([
  "53710-01",
  "53710-02",
  "53710-03",
  "53710-04",
  "53710-05",
]);


export const adminOverrideAccounts = new Set([
  "52000-10",
]);


export const cogsStructure = [
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


export const calMonths = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
export const calMonthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];


export function calMonthBE(i: number, adYear: number): string {
  return String((adYear + 543) % 100).padStart(2, "0");
}


export const inventoryAccounts = [
  { key: "rawMaterial", label: "วัตถุดิบคงเหลือ", labelEn: "Raw Material", account: "11500-01" },
  { key: "wip", label: "สินค้าระหว่างผลิต", labelEn: "Work-in-Process", account: "11500-02" },
  { key: "finishedGoods", label: "สินค้าสำเร็จรูป", labelEn: "Finished Goods", account: "11500-03" },
];


export const pnlRows = [

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

  { key: "h_cogs", label: "ต้นทุนขาย", type: "header" },
  { key: "computed_cogs", label: "ต้นทุนการขาย", type: "computed", computeKey: "cogs" },

  { key: "h_selling", label: "ค่าใช้จ่ายในการขาย", type: "header" },
  { key: "computed_selling", label: "ค่าใช้จ่ายในการขาย", type: "computed", computeKey: "selling" },
  { key: "h_admin", label: "ค่าใช้จ่ายในการบริหาร", type: "header" },
  { key: "computed_admin", label: "ค่าใช้จ่ายในการบริหาร", type: "computed", computeKey: "admin" },
  { key: "total_expenses", label: "รวมค่าใช้จ่าย", type: "total", sumGroups: ["cogs", "selling", "admin"] },

  { key: "h_profit", label: "กำไร", type: "header" },
  { key: "computed_netProfit", label: "กำไรสุทธิก่อนภาษี", type: "grandTotal", computeKey: "netProfit" },
];



export function classifyAccount(accountNumber: string): string {
  if (!accountNumber) return "other";

  if (cogsOverrideAccounts.has(accountNumber)) return "cogs";

  if (interestAccounts.has(accountNumber)) return "interest";

  if (adminOverrideAccounts.has(accountNumber)) return "admin";
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



const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];


export function computeAdjustedCogs(byAccount: Record<string, GlAccountEntry>, monthlyTotals: Record<string, { months: Record<string, number>; total: number }>) {
  const raw = monthlyTotals?.["cogs"] || { months: {}, total: 0 };
  const result = {};
  for (const m of months) result[m] = raw.months[m] || 0;
  return { months: result, total: raw.total };
}




export function aggregateGlEntries(entries: Array<{ postingDate?: string; accountNumber?: string; accountName?: string; debitAmount?: number; creditAmount?: number }>) {
  if (!entries || !entries.length) return { byAccount: {}, monthlyTotals: {} };

  const byAccount: Record<string, GlAccountEntry> = {};

  for (const entry of entries) {
    const mm = entry.postingDate?.substring(5, 7);
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


    const cat = byAccount[acct].category;
    const isCredit = ["salesRevenue", "serviceRevenue", "otherIncome", "liabilities", "equity"].includes(cat);
    const net = isCredit ? (credit - debit) : (debit - credit);

    if (!byAccount[acct].months[mm]) byAccount[acct].months[mm] = 0;
    byAccount[acct].months[mm] += net;
    byAccount[acct].total += net;
  }


  const monthlyTotals = {};
  for (const acct of Object.values(byAccount)) {
    const cat = acct.category;
    if (!monthlyTotals[cat]) {
      monthlyTotals[cat] = { months: {}, total: 0 };
      for (const m of months) monthlyTotals[cat].months[m] = 0;
    }
    for (const m of months) {
      monthlyTotals[cat].months[m] += acct.months[m] || 0;
    }
    monthlyTotals[cat].total += acct.total;
  }

  return { byAccount, monthlyTotals };
}


export function computeMonthlyPnL(byAccount: Record<string, GlAccountEntry>, monthlyTotals: Record<string, { months: Record<string, number>; total: number }>) {
  if (!monthlyTotals || !Object.keys(monthlyTotals).length) return [];

  const mt = (cat) => monthlyTotals[cat] || { months: {}, total: 0 };
  const sumMonths = (...cats) => {
    const result = {};
    for (const m of months) {
      result[m] = cats.reduce((sum, cat) => sum + (mt(cat).months[m] || 0), 0);
    }
    return result;
  };
  const sumTotal = (...cats) => cats.reduce((sum, cat) => sum + (mt(cat).total || 0), 0);


  const salesRevenueMonths = mt("salesRevenue").months;
  const salesRevenueTotal = mt("salesRevenue").total;
  const serviceMonths = mt("serviceRevenue").months;
  const serviceTotal = mt("serviceRevenue").total;
  const otherIncMonths = mt("otherIncome").months;
  const otherIncTotal = mt("otherIncome").total;
  const totalRevMonths = sumMonths("salesRevenue", "serviceRevenue", "otherIncome");
  const totalRevTotal = sumTotal("salesRevenue", "serviceRevenue", "otherIncome");


  const adjustedCogs = computeAdjustedCogs(byAccount, monthlyTotals);
  const cogsMonths = adjustedCogs.months;
  const cogsTotal = adjustedCogs.total;


  const grossMonths = {};
  for (const m of months) grossMonths[m] = (totalRevMonths[m] || 0) - (cogsMonths[m] || 0);
  const grossTotal = totalRevTotal - cogsTotal;


  const sellingMonths = mt("selling").months;
  const sellingTotal = mt("selling").total;
  const adminMonths = mt("admin").months;
  const adminTotal = mt("admin").total;
  const interestMonths = mt("interest").months;
  const interestTotal = mt("interest").total;


  const opMonths = {};
  for (const m of months) {
    opMonths[m] = (grossMonths[m] || 0) - (sellingMonths[m] || 0) - (adminMonths[m] || 0);
  }
  const opTotal = grossTotal - sellingTotal - adminTotal;


  const netMonths = {};
  for (const m of months) {
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


export function computeCogsDetail(byAccount: Record<string, GlAccountEntry>) {
  if (!byAccount || !Object.keys(byAccount).length) return [];

  const getRow = (struct) => {
    const result = {};
    let total = 0;
    for (const acctNo of struct.accounts) {
      const acct = byAccount[acctNo];
      if (!acct) continue;
      for (const m of months) {
        if (!result[m]) result[m] = 0;
        result[m] += acct.months[m] || 0;
      }
      total += acct.total;
    }
    return { key: struct.key, label: struct.label, labelEn: struct.labelEn, months: result, total, type: "item" };
  };

  const rows: GlRow[] = cogsStructure.map(getRow);


  const prodMonths = {};
  let prodTotal = 0;
  for (const row of rows) {
    for (const m of months) {
      if (!prodMonths[m]) prodMonths[m] = 0;
      prodMonths[m] += row.months[m] || 0;
    }
    prodTotal += row.total;
  }
  rows.push({ key: "productionTotal", label: "ต้นทุนสินค้าที่ผลิตได้", months: prodMonths, total: prodTotal, type: "subtotal" });


  const knownInvAccounts = new Set(inventoryAccounts.map((i) => i.account));
  const invRows: GlRow[] = inventoryAccounts.map((inv) => {
    const acct = byAccount[inv.account];
    const mths = {};
    let total = 0;
    if (acct) {
      for (const m of months) {
        mths[m] = -(acct.months[m] || 0);
      }
      total = -acct.total;
    }
    return { key: inv.key, label: `หัก: ${inv.label}`, labelEn: `Less: ${inv.labelEn}`, months: mths, total, type: "deduction" };
  });


  for (const [acctNo, acct] of Object.entries(byAccount)) {
    if (!acctNo.startsWith("115") || knownInvAccounts.has(acctNo)) continue;
    const mths: Record<string, number> = {};
    let total = 0;
    for (const m of months) mths[m] = -(acct.months[m] || 0);
    total = -acct.total;
    invRows.push({ key: acctNo, label: `หัก: ${acct.name || acctNo}`, months: mths, total, type: "deduction" });
  }
  rows.push(...invRows);


  const endInvMonths = {};
  let endInvTotal = 0;
  for (const r of invRows) {
    for (const m of months) {
      if (!endInvMonths[m]) endInvMonths[m] = 0;
      endInvMonths[m] += r.months[m] || 0;
    }
    endInvTotal += r.total;
  }
  rows.push({ key: "endingInventory", label: "หัก: สินค้าคงเหลือปลายงวด", months: endInvMonths, total: endInvTotal, type: "subtotal" });



  const beginInv = byAccount?.["51200-00"];
  const beginInvMonths = {};
  let beginInvTotal = 0;
  if (beginInv) {
    for (const m of months) beginInvMonths[m] = beginInv.months[m] || 0;
    beginInvTotal = beginInv.total || 0;
  }

  const cogsMonths = {};
  for (const m of months) {
    cogsMonths[m] = (prodMonths[m] || 0) - (beginInvMonths[m] || 0) + (endInvMonths[m] || 0);
  }
  const cogsTotal = prodTotal - beginInvTotal + endInvTotal;
  rows.push({ key: "cogsTotal", label: "ต้นทุนขาย", months: cogsMonths, total: cogsTotal, type: "grandTotal" });

  return rows;
}


export function computeExpenseDetail(byAccount: Record<string, GlAccountEntry>, type: string) {
  if (!byAccount) return [];

  const rows: GlRow[] = [];
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
    for (const m of months) {
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


export function computeRevenueDetail(byAccount: Record<string, GlAccountEntry>) {
  if (!byAccount) return [];

  const rows: GlRow[] = [];
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
    for (const m of months) {
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

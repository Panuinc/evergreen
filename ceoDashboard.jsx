import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// ═══════════════════════════════════════
// EVERGREEN CEO DASHBOARD — Real Data FY2568
// ═══════════════════════════════════════

const C = {
  bg: "#0B0F14",
  surface: "#111820",
  card: "#161D27",
  cardHover: "#1A2332",
  border: "#1E2A38",
  borderLight: "#253347",
  gold: "#D4A844",
  goldMuted: "#B8943D",
  goldBright: "#F0C75E",
  green: "#34D399",
  greenDark: "#059669",
  greenMuted: "#047857",
  red: "#F87171",
  redDark: "#DC2626",
  redMuted: "#991B1B",
  amber: "#FBBF24",
  amberDark: "#D97706",
  blue: "#60A5FA",
  blueDark: "#2563EB",
  purple: "#A78BFA",
  purpleDark: "#7C3AED",
  cyan: "#22D3EE",
  cyanDark: "#0891B2",
  rose: "#FB7185",
  t1: "#F1F0EC",
  t2: "#C8C5BD",
  t3: "#8B8780",
  t4: "#5C5852",
};

const FM = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";
const F = "'Instrument Sans', 'DM Sans', system-ui, sans-serif";
const S = "system-ui, sans-serif";

// ─── DATA ───────────────────────────────
const monthlyData = [
  {
    m: "ม.ค.",
    rev: 5.53,
    cogs: 4.42 + 0.62 + 0.37 + 0.25,
    sell: 0.29 + 0.05 + 0.04 + 0.01 + 0.01,
    admin: 0.31 + 0.2 + 0.03 + 0.19 + 0.09 + 0.09,
    total_rev: 5.12,
    budget: 9.9,
  },
  {
    m: "ก.พ.",
    rev: 2.97,
    cogs: 5.61 + 0.36 + 0.18 + 0.03,
    sell: 0.29 + 0.05 + 0.04,
    admin: 0.32 + 0.2 + 0.03 + 0.18 + 0.08,
    total_rev: 3.25,
    budget: 5.32,
  },
  {
    m: "มี.ค.",
    rev: 7.8,
    cogs: 4.73 + 0.29 + 0.38 + 0.05,
    sell: 0.32 + 0.1 + 0.04,
    admin: 0.28 + 0.2 + 0.03 + 0.26 + 0.09,
    total_rev: 8.04,
    budget: 13.98,
  },
  {
    m: "เม.ย.",
    rev: 6.45,
    cogs: 5.06 + 0.36 + 0.2 + 0.01,
    sell: 0.24 + 0.02 + 0.04,
    admin: 0.39 + 0.2 + 0.03 + 0.22 + 0.09,
    total_rev: 6.76,
    budget: 11.56,
  },
  {
    m: "พ.ค.",
    rev: 4.38,
    cogs: 3.02 + 0.38 + 0.43 + 0.01,
    sell: 0.17 + 0.01 + 0.04,
    admin: 0.39 + 0.2 + 0.03 + 0.18 + 0.09,
    total_rev: 4.52,
    budget: 7.86,
  },
  {
    m: "มิ.ย.",
    rev: 7.89,
    cogs: 4.07 + 0.36 + 0.41 + 0.01,
    sell: 0.23 + 0.01 + 0.04,
    admin: 0.42 + 0.2 + 0.03 + 0.16 + 0.09,
    total_rev: 8.1,
    budget: 14.14,
  },
  {
    m: "ก.ค.",
    rev: 13.86,
    cogs: 7.51 + 0.48 + 0.72 + 0.05,
    sell: 0.17 + 0.01 + 0.05,
    admin: 0.48 + 0.2 + 0.03 + 0.21 + 0.09,
    total_rev: 14.24,
    budget: 24.84,
  },
  {
    m: "ส.ค.",
    rev: 9.51,
    cogs: 10.32 + 0.53 + 0.68 + 0.05,
    sell: 0.19 + 0.06 + 0.04,
    admin: 0.49 + 0.2 + 0.04 + 0.22 + 0.09,
    total_rev: 9.92,
    budget: 17.04,
  },
  {
    m: "ก.ย.",
    rev: 13.04,
    cogs: 11.45 + 0.61 + 0.86 + 0.03,
    sell: 0.35 + 0.29 + 0.04,
    admin: 0.58 + 0.2 + 0.05 + 0.21 + 0.09,
    total_rev: 14.3,
    budget: 23.36,
  },
  {
    m: "ต.ค.",
    rev: 20.76,
    cogs: 8.84 + 1.08 + 1.06 + 0.02,
    sell: 0.17 + 0.33 + 0.05,
    admin: 0.63 + 0.2 + 0.05 + 0.22 + 0.09,
    total_rev: 21.6,
    budget: 37.2,
  },
  {
    m: "พ.ย.",
    rev: 10.81,
    cogs: 6.14 + 0.31 + 1.16 + 0.45,
    sell: 0.2 + 0.23 + 0.05,
    admin: 0.64 + 0.2 + 0.05 + 0.19 + 0.09,
    total_rev: 11.24,
    budget: 19.36,
  },
  {
    m: "ธ.ค.",
    rev: 8.61,
    cogs: 6.43 + 0.21 + 0.43 + 0.06,
    sell: 0.16 + 0.16 + 0.05,
    admin: 0.7 + 0.2 + 0.04 + 0.15 + 0.09,
    total_rev: 8.84,
    budget: 15.44,
  },
];

const simplifiedMonthly = [
  { m: "ม.ค.", rev: 5.53, total: 5.12 },
  { m: "ก.พ.", rev: 2.97, total: 3.25 },
  { m: "มี.ค.", rev: 7.8, total: 8.04 },
  { m: "เม.ย.", rev: 6.45, total: 6.76 },
  { m: "พ.ค.", rev: 4.38, total: 4.52 },
  { m: "มิ.ย.", rev: 7.89, total: 8.1 },
  { m: "ก.ค.", rev: 13.86, total: 14.24 },
  { m: "ส.ค.", rev: 9.51, total: 9.92 },
  { m: "ก.ย.", rev: 13.04, total: 14.3 },
  { m: "ต.ค.", rev: 20.76, total: 21.6 },
  { m: "พ.ย.", rev: 10.81, total: 11.24 },
  { m: "ธ.ค.", rev: 8.61, total: 8.84 },
];

const historicalPL = [
  {
    year: "2562",
    rev: 136.05,
    cogs: 102.05,
    sga: 29.84,
    net: 2.99,
    margin: 2.2,
  },
  { year: "2563", rev: 71.52, cogs: 44.78, sga: 24.04, net: 1.89, margin: 2.6 },
  { year: "2564", rev: 84.41, cogs: 55.42, sga: 26.3, net: 1.6, margin: 1.9 },
  { year: "2565", rev: 113.6, cogs: 62.92, sga: 47.65, net: 1.89, margin: 1.7 },
  { year: "2566", rev: 89.04, cogs: 47.0, sga: 38.93, net: 2.1, margin: 2.4 },
  {
    year: "2567",
    rev: 111.61,
    gp: 37.16,
    ebitda: 18.38,
    ebt: 12.57,
    margin: 10.8,
  },
];

// ─── SALARY & HEADCOUNT DATA ────────────
const salaryMonthly = [
  {
    m: "ม.ค.",
    office67: 268119,
    office68: 363365,
    sales67: 290000,
    sales68: 285000,
    daily67: 187418,
    daily68: 175847,
    dailyNoSS67: 152646,
    dailyNoSS68: 189828,
    subcon67: 895504,
    subcon68: 254476,
    foreman67: 50480,
    foreman68: 60160,
    outside67: 26250,
    outside68: 27000,
    total67: 1793687,
    total68: 2909940,
    hcTotal67: 67,
    hcTotal68: 65,
    hcOffice67: 12,
    hcOffice68: 15,
    hcSales67: 6,
    hcSales68: 6,
    hcDaily67: 33,
    hcDaily68: 31,
    hcSubcon67: 12,
    hcSubcon68: 11,
    hcForeman67: 2,
    hcForeman68: 2,
    hcOutside67: 2,
    hcOutside68: 0,
  },
  {
    m: "ก.พ.",
    office67: 292698,
    office68: 370194,
    sales67: 365500,
    sales68: 285000,
    daily67: 237204,
    daily68: 184335,
    dailyNoSS67: 219988,
    dailyNoSS68: 199878,
    subcon67: 518153,
    subcon68: 360785,
    foreman67: 54320,
    foreman68: 59920,
    outside67: 42000,
    outside68: 36000,
    total67: 1633543,
    total68: 2665054,
    hcTotal67: 74,
    hcTotal68: 66,
    hcOffice67: 15,
    hcOffice68: 16,
    hcSales67: 8,
    hcSales68: 6,
    hcDaily67: 35,
    hcDaily68: 31,
    hcSubcon67: 12,
    hcSubcon68: 11,
    hcForeman67: 2,
    hcForeman68: 2,
    hcOutside67: 2,
    hcOutside68: 0,
  },
  {
    m: "มี.ค.",
    office67: 333346,
    office68: 365636,
    sales67: 366000,
    sales68: 285000,
    daily67: 180383,
    daily68: 169636,
    dailyNoSS67: 264320,
    dailyNoSS68: 197070,
    subcon67: 952426,
    subcon68: 286034,
    foreman67: 54740,
    foreman68: 60120,
    outside67: 33000,
    outside68: 36000,
    total67: 2096476,
    total68: 2939796,
    hcTotal67: 77,
    hcTotal68: 68,
    hcOffice67: 15,
    hcOffice68: 16,
    hcSales67: 8,
    hcSales68: 6,
    hcDaily67: 38,
    hcDaily68: 33,
    hcSubcon67: 12,
    hcSubcon68: 11,
    hcForeman67: 2,
    hcForeman68: 2,
    hcOutside67: 2,
    hcOutside68: 0,
  },
  {
    m: "เม.ย.",
    office67: 464788,
    office68: 385876,
    sales67: 366000,
    sales68: 285000,
    daily67: 180723,
    daily68: 198466,
    dailyNoSS67: 217558,
    dailyNoSS68: 221991,
    subcon67: 1026452,
    subcon68: 356775,
    foreman67: 54910,
    foreman68: 52900,
    outside67: 24000,
    outside68: 28500,
    total67: 2255522,
    total68: 3101104,
    hcTotal67: 77,
    hcTotal68: 70,
    hcOffice67: 15,
    hcOffice68: 16,
    hcSales67: 8,
    hcSales68: 6,
    hcDaily67: 38,
    hcDaily68: 35,
    hcSubcon67: 12,
    hcSubcon68: 11,
    hcForeman67: 2,
    hcForeman68: 2,
    hcOutside67: 2,
    hcOutside68: 0,
  },
  {
    m: "พ.ค.",
    office67: 342600,
    office68: 392292,
    sales67: 331600,
    sales68: 218200,
    daily67: 231571,
    daily68: 166523,
    dailyNoSS67: 319500,
    dailyNoSS68: 212419,
    subcon67: 832793,
    subcon68: 434904,
    foreman67: 57620,
    foreman68: 57590,
    outside67: 42750,
    outside68: 36000,
    total67: 2058063,
    total68: 2903963,
    hcTotal67: 75,
    hcTotal68: 73,
    hcOffice67: 14,
    hcOffice68: 19,
    hcSales67: 8,
    hcSales68: 5,
    hcDaily67: 37,
    hcDaily68: 36,
    hcSubcon67: 12,
    hcSubcon68: 11,
    hcForeman67: 2,
    hcForeman68: 2,
    hcOutside67: 2,
    hcOutside68: 0,
  },
  {
    m: "มิ.ย.",
    office67: 345790,
    office68: 419957,
    sales67: 299600,
    sales68: 271000,
    daily67: 188228,
    daily68: 175311,
    dailyNoSS67: 249253,
    dailyNoSS68: 238127,
    subcon67: 1107752,
    subcon68: 357074,
    foreman67: 64410,
    foreman68: 56800,
    outside67: 36000,
    outside68: 36000,
    total67: 2190623,
    total68: 3327826,
    hcTotal67: 76,
    hcTotal68: 74,
    hcOffice67: 14,
    hcOffice68: 21,
    hcSales67: 7,
    hcSales68: 4,
    hcDaily67: 39,
    hcDaily68: 36,
    hcSubcon67: 12,
    hcSubcon68: 11,
    hcForeman67: 2,
    hcForeman68: 2,
    hcOutside67: 2,
    hcOutside68: 0,
  },
  {
    m: "ก.ค.",
    office67: 357670,
    office68: 478220,
    sales67: 247000,
    sales68: 211000,
    daily67: 173091,
    daily68: 220938,
    dailyNoSS67: 225680,
    dailyNoSS68: 318138,
    subcon67: 969917,
    subcon68: 724206,
    foreman67: 62080,
    foreman68: 84870,
    outside67: 35944,
    outside68: 38813,
    total67: 1973358,
    total68: 3793045,
    hcTotal67: 74,
    hcTotal68: 88,
    hcOffice67: 15,
    hcOffice68: 23,
    hcSales67: 5,
    hcSales68: 4,
    hcDaily67: 38,
    hcDaily68: 46,
    hcSubcon67: 12,
    hcSubcon68: 12,
    hcForeman67: 2,
    hcForeman68: 3,
    hcOutside67: 2,
    hcOutside68: 0,
  },
  {
    m: "ส.ค.",
    office67: 336080,
    office68: 494562,
    sales67: 289160,
    sales68: 231790,
    daily67: 211308,
    daily68: 419310,
    dailyNoSS67: 283976,
    dailyNoSS68: 192345,
    subcon67: 824134,
    subcon68: 691222,
    foreman67: 61600,
    foreman68: 90600,
    outside67: 46426,
    outside68: 36000,
    total67: 1944658,
    total68: 3855289,
    hcTotal67: 76,
    hcTotal68: 90,
    hcOffice67: 15,
    hcOffice68: 19,
    hcSales67: 7,
    hcSales68: 5,
    hcDaily67: 39,
    hcDaily68: 51,
    hcSubcon67: 11,
    hcSubcon68: 12,
    hcForeman67: 2,
    hcForeman68: 3,
    hcOutside67: 2,
    hcOutside68: 0,
  },
  {
    m: "ก.ย.",
    office67: 349750,
    office68: 580672,
    sales67: 312200,
    sales68: 215940,
    daily67: 187630,
    daily68: 432921,
    dailyNoSS67: 220860,
    dailyNoSS68: 244258,
    subcon67: 340630,
    subcon68: 858794,
    foreman67: 59040,
    foreman68: 95600,
    outside67: 35250,
    outside68: 39975,
    total67: 1411069,
    total68: 3797255,
    hcTotal67: 79,
    hcTotal68: 99,
    hcOffice67: 17,
    hcOffice68: 21,
    hcSales67: 7,
    hcSales68: 5,
    hcDaily67: 40,
    hcDaily68: 56,
    hcSubcon67: 11,
    hcSubcon68: 12,
    hcForeman67: 2,
    hcForeman68: 3,
    hcOutside67: 2,
    hcOutside68: 2,
  },
  {
    m: "ต.ค.",
    office67: 377511,
    office68: 617950,
    sales67: 285000,
    sales68: 211000,
    daily67: 215188,
    daily68: 410142,
    dailyNoSS67: 263899,
    dailyNoSS68: 307884,
    subcon67: 354212,
    subcon68: 1063520,
    foreman67: 57880,
    foreman68: 88560,
    outside67: 41250,
    outside68: 37988,
    total67: 1495810,
    total68: 4134174,
    hcTotal67: 78,
    hcTotal68: 99,
    hcOffice67: 17,
    hcOffice68: 22,
    hcSales67: 6,
    hcSales68: 4,
    hcDaily67: 40,
    hcDaily68: 56,
    hcSubcon67: 11,
    hcSubcon68: 12,
    hcForeman67: 2,
    hcForeman68: 3,
    hcOutside67: 2,
    hcOutside68: 2,
  },
  {
    m: "พ.ย.",
    office67: 355184,
    office68: 641350,
    sales67: 263040,
    sales68: 198400,
    daily67: 169373,
    daily68: 399619,
    dailyNoSS67: 247710,
    dailyNoSS68: 264610,
    subcon67: 98660,
    subcon68: 1154999,
    foreman67: 58040,
    foreman68: 87900,
    outside67: 37078,
    outside68: 37500,
    total67: 1133967,
    total68: 3906433,
    hcTotal67: 75,
    hcTotal68: 104,
    hcOffice67: 15,
    hcOffice68: 27,
    hcSales67: 6,
    hcSales68: 4,
    hcDaily67: 39,
    hcDaily68: 56,
    hcSubcon67: 11,
    hcSubcon68: 12,
    hcForeman67: 2,
    hcForeman68: 3,
    hcOutside67: 2,
    hcOutside68: 2,
  },
  {
    m: "ธ.ค.",
    office67: 359768,
    office68: 691747,
    sales67: 285000,
    sales68: 269032,
    daily67: 255129,
    daily68: 592920,
    dailyNoSS67: 265073,
    dailyNoSS68: 204270,
    subcon67: 55410,
    subcon68: 205279,
    foreman67: 65350,
    foreman68: 85600,
    outside67: 35982,
    outside68: 16500,
    total67: 1220381,
    total68: 3416859,
    hcTotal67: 69,
    hcTotal68: 103,
    hcOffice67: 15,
    hcOffice68: 27,
    hcSales67: 6,
    hcSales68: 6,
    hcDaily67: 33,
    hcDaily68: 53,
    hcSubcon67: 11,
    hcSubcon68: 12,
    hcForeman67: 2,
    hcForeman68: 3,
    hcOutside67: 2,
    hcOutside68: 2,
  },
];

const salaryTotals = {
  total67: 22343555,
  total68: 23139928,
  change: 796373,
  changePct: 3.6,
  grossTotal67: 21207155,
  grossTotal68: 40750737,
  office67: 4183304,
  office68: 5801820,
  officePct: 38.7,
  sales67: 3700100,
  sales68: 2966362,
  salesPct: -19.8,
  daily67: 2417245,
  daily68: 3545967,
  dailyPct: 46.7,
  dailyNoSS67: 2930463,
  dailyNoSS68: 2790817,
  dailyNoSSPct: -4.8,
  subcon67: 7976043,
  subcon68: 6748067,
  subconPct: -15.4,
  foreman67: 700470,
  foreman68: 880620,
  foremanPct: 25.7,
  outside67: 435930,
  outside68: 406276,
  outsidePct: -6.8,
  avgHC67: 75,
  avgHC68: 83,
  hcDec68: 103,
  revPerEmp: 1340661,
  payrollRevRatio: 20.7,
  avgCostPerHead: 23233,
};

// ─── CORE VALUES DATA ───────────────────
const coreValues = [
  {
    id: 1,
    name: "Customer Centric",
    nameTH: "คิดแทนลูกค้า ทำเกินความคาดหวัง",
    motto: "Think Beyond Expectations",
    color: "#22C55E",
    icon: "💡",
    behaviors: [
      "คาดเดาความต้องการของลูกค้า (Anticipate Customer Needs)",
      "สร้างสรรค์ประสบการณ์ที่ยอดเยี่ยม (Create Excellent Experiences)",
    ],
  },
  {
    id: 2,
    name: "Heartwork Smartwork",
    nameTH: "ทำด้วยใจ คิดด้วยระบบ",
    motto: "Work with Heart, Win with System",
    color: "#10B981",
    icon: "⚙️",
    behaviors: [
      "ทำงานด้วยความตั้งใจและใส่ใจ (Work with Dedication & Care)",
      "ใช้ระบบที่มีประสิทธิภาพ (Utilize Effective Systems)",
    ],
  },
  {
    id: 3,
    name: "Happy Workplace",
    nameTH: "องค์กรที่สุข สร้างผลงานที่เหนือกว่า",
    motto: "Happy People, Higher Performance",
    color: "#F59E0B",
    icon: "☀️",
    behaviors: [
      "สร้างวัฒนธรรมแห่งความสุข (Create a Culture of Happiness)",
      "ผลักดันความสำเร็จร่วมกัน (Drive Collective Success)",
    ],
  },
  {
    id: 4,
    name: "Collaboration",
    nameTH: "ไปไกล ต้องไปด้วยกัน",
    motto: "Grow Together, Succeed Together",
    color: "#3B82F6",
    icon: "🤝",
    behaviors: [
      "ทำงานร่วมกันเป็นทีม (Work Together as a Team)",
      "แบ่งปันความรู้และเป้าหมาย (Share Knowledge & Goals)",
    ],
  },
  {
    id: 5,
    name: "Honest Integrity",
    nameTH: "ซื่อสัตย์ โปร่งใส ตรวจสอบได้",
    motto: "Integrity Builds Trust",
    color: "#06B6D4",
    icon: "🛡️",
    behaviors: [
      "ยึดมั่นในความซื่อสัตย์ (Uphold Integrity)",
      "รักษาความโปร่งใสในทุกการกระทำ (Maintain Transparency in all Actions)",
    ],
  },
  {
    id: 6,
    name: "Humble",
    nameTH: "ถ่อมตน เรียนรู้ เติบโต",
    motto: "Humble to Learn, Ready to Grow",
    color: "#EC4899",
    icon: "📖",
    behaviors: [
      "เปิดใจเรียนรู้สิ่งใหม่ๆ เสมอ (Always Open to New Learning)",
      "รับฟังและปรับปรุงตนเอง (Listen & Self-Improve)",
    ],
  },
];

const budgetComparison = [
  { item: "รายได้รวม", actual: 115.93, budget: 207.74 },
  { item: "กำไรขั้นต้น", actual: 37.16, budget: 72.71 },
  { item: "EBT", actual: 12.57, budget: 28.65 },
];

// ─── COMPONENTS ─────────────────────────

function MetricCard({
  label,
  value,
  sub,
  trend,
  trendDir,
  color = C.t1,
  icon,
  small,
}) {
  const isUp = trendDir === "up";
  const isDown = trendDir === "down";
  return (
    <div
      style={{
        background: small ? `${color}06` : C.card,
        border: `1px solid ${small ? color + "15" : C.border}`,
        borderRadius: 14,
        padding: small ? "12px 14px" : "18px 20px",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s",
        cursor: "default",
      }}
    >
      {!small && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: color,
          }}
        />
      )}
      {icon && (
        <div style={{ fontSize: small ? 16 : 22, marginBottom: 4 }}>{icon}</div>
      )}
      <div
        style={{
          fontSize: small ? 10 : 11,
          color: C.t3,
          fontFamily: S,
          fontWeight: 600,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          marginBottom: small ? 4 : 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: small ? 20 : 28,
          fontWeight: 800,
          color: color,
          fontFamily: FM,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.t4, marginTop: 2, fontFamily: S }}>
          {sub}
        </div>
      )}
      {trend && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isUp ? C.green : isDown ? C.red : C.amber,
            marginTop: 6,
            fontFamily: FM,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          {isUp ? "▲" : isDown ? "▼" : "→"} {trend}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, title, sub, tag }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div
          style={{ fontSize: 18, fontWeight: 800, color: C.t1, fontFamily: F }}
        >
          {title}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: C.t3, fontFamily: S }}>{sub}</div>
        )}
      </div>
      {tag && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: C.gold,
            background: C.gold + "12",
            padding: "4px 10px",
            borderRadius: 20,
            fontFamily: FM,
            letterSpacing: "0.08em",
          }}
        >
          {tag}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ level }) {
  const conf = {
    good: { color: C.green, bg: C.green + "15", label: "HEALTHY" },
    warning: { color: C.amber, bg: C.amber + "15", label: "CAUTION" },
    danger: { color: C.red, bg: C.red + "15", label: "CRITICAL" },
    info: { color: C.blue, bg: C.blue + "15", label: "INFO" },
  };
  const c = conf[level] || conf.info;
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: c.color,
        background: c.bg,
        padding: "3px 8px",
        borderRadius: 10,
        fontFamily: FM,
      }}
    >
      {c.label}
    </span>
  );
}

function RatioRow({ label, value, unit, target, status, note }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ flex: 1, fontSize: 13, color: C.t2, fontFamily: S }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: C.t1,
          fontFamily: FM,
          minWidth: 70,
          textAlign: "right",
        }}
      >
        {value}
        <span style={{ fontSize: 11, color: C.t4, fontWeight: 500 }}>
          {" "}
          {unit}
        </span>
      </div>
      {target && (
        <div
          style={{ fontSize: 11, color: C.t4, fontFamily: FM, minWidth: 80 }}
        >
          Target: {target}
        </div>
      )}
      <StatusBadge level={status} />
    </div>
  );
}

function ProgressBar({ value, max, color, label }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 8 }}>
      {label && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 11, color: C.t3, fontFamily: S }}>
            {label}
          </span>
          <span
            style={{ fontSize: 11, fontWeight: 700, color, fontFamily: FM }}
          >
            {value.toFixed(1)}%
          </span>
        </div>
      )}
      <div
        style={{
          height: 6,
          background: C.border,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${color}, ${color}AA)`,
            borderRadius: 3,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ─────────────────────

export default function CEODashboard() {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "P=S−C−E−L+D", icon: "◆" },
    { id: "financial", label: "Financial Health", icon: "📊" },
    { id: "people", label: "People & Payroll", icon: "👥" },
    { id: "values", label: "Core Values", icon: "🏠" },
    { id: "monthly", label: "Monthly Trend", icon: "📈" },
    { id: "ratios", label: "Key Ratios", icon: "🔬" },
    { id: "budget", label: "Budget 2569", icon: "🎯" },
    { id: "risks", label: "Risk & Action", icon: "⚡" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: F,
        color: C.t1,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.surface}, ${C.card})`,
          borderBottom: `1px solid ${C.border}`,
          padding: "20px 28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.gold,
                letterSpacing: "0.2em",
                fontFamily: FM,
                marginBottom: 4,
              }}
            >
              EVERGREEN — CHH INDUSTRY CO., LTD.
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: C.t1,
                fontFamily: F,
              }}
            >
              CEO Strategic Dashboard
            </div>
            <div
              style={{ fontSize: 12, color: C.t3, fontFamily: S, marginTop: 2 }}
            >
              งบการเงิน FY2568 (Jan–Dec 2025) | Enterprise Architecture View
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: C.gold,
                fontFamily: FM,
              }}
            >
              115.93M
            </div>
            <div style={{ fontSize: 11, color: C.t3, fontFamily: S }}>
              Total Revenue FY2568
            </div>
          </div>
        </div>

        {/* Top KPI Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 10,
            marginTop: 16,
          }}
        >
          <MetricCard
            label="Revenue"
            value="111.6M"
            sub="จากการขาย"
            trend="+25.4% YoY"
            trendDir="up"
            color={C.green}
            small
          />
          <MetricCard
            label="Gross Profit"
            value="37.16M"
            sub="GP Margin 32.1%"
            trend="vs 2566: -"
            trendDir="up"
            color={C.blue}
            small
          />
          <MetricCard
            label="EBITDA"
            value="18.38M"
            sub="15.86% Margin"
            trend="Strong"
            trendDir="up"
            color={C.cyan}
            small
          />
          <MetricCard
            label="EBT"
            value="12.57M"
            sub="10.84% Margin"
            trend="vs 2.65M (2566)"
            trendDir="up"
            color={C.gold}
            small
          />
          <MetricCard
            label="Total Assets"
            value="89.15M"
            sub="D/E Ratio: 1.38x"
            trend="⚠️ High leverage"
            trendDir="down"
            color={C.amber}
            small
          />
          <MetricCard
            label="Cash"
            value="11.93M"
            sub="Cash Ratio: 0.28x"
            trend="CCC: 121 days"
            trendDir="down"
            color={C.purple}
            small
          />
          <MetricCard
            label="Headcount"
            value="103"
            sub="ธ.ค. 68 (avg 83)"
            trend="+54% in-year"
            trendDir="up"
            color={C.rose}
            small
          />
          <MetricCard
            label="Payroll"
            value="23.14M"
            sub="20.7% of Rev"
            trend="✓ +3.6% YoY"
            trendDir="up"
            color={C.green}
            small
          />
        </div>
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
          padding: "0 28px",
          overflowX: "auto",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: F,
              padding: "12px 18px",
              fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? C.gold : C.t3,
              borderBottom:
                tab === t.id ? `2px solid ${C.gold}` : "2px solid transparent",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding: "24px 28px", maxWidth: 1280, margin: "0 auto" }}>
        {tab === "overview" && <OverviewTab />}
        {tab === "financial" && <FinancialTab />}
        {tab === "people" && <PeopleTab />}
        {tab === "values" && <CoreValuesTab />}
        {tab === "monthly" && <MonthlyTab />}
        {tab === "ratios" && <RatiosTab />}
        {tab === "budget" && <BudgetTab />}
        {tab === "risks" && <RisksTab />}
      </div>
    </div>
  );
}

// ═══ TAB: OVERVIEW ═══════════════════════
function OverviewTab() {
  const formulaVars = [
    {
      v: "S",
      name: "Sales Revenue",
      value: "111.61M",
      pct: "100%",
      color: C.green,
      icon: "💰",
      target: "200M (Budget '69)",
      actual: 111.61,
      targetN: 200,
    },
    {
      v: "C",
      name: "COGS",
      value: "91.46M",
      pct: "81.9%*",
      color: C.red,
      icon: "🏭",
      target: "65% (Budget '69)",
      actual: 91.46,
      note: "*P&L basis incl. inv adj",
    },
    {
      v: "E",
      name: "SGA Expenses",
      value: "23.97M",
      pct: "21.5%",
      color: C.amber,
      icon: "📋",
      target: "<18.35%",
      actual: 23.97,
      targetN: 18.35,
    },
    {
      v: "L",
      name: "Loss/Interest",
      value: "0.62M",
      pct: "0.56%",
      color: C.purple,
      icon: "⚠️",
      target: "<0.5%",
      actual: 0.62,
    },
    {
      v: "D",
      name: "Development",
      value: "~0.73M",
      pct: "0.65%",
      color: C.cyan,
      icon: "🚀",
      target: "3-5%",
      actual: 0.73,
    },
    {
      v: "P",
      name: "EBT Profit",
      value: "12.57M",
      pct: "10.84%",
      color: C.gold,
      icon: "⭐",
      target: ">13.8% (Budget '69)",
      actual: 12.57,
    },
  ];

  const waterfallData = [
    { name: "S: Revenue", value: 115.93, fill: C.green },
    { name: "C: COGS", value: -91.46, fill: C.red },
    { name: "Gross Profit", value: 24.47, fill: C.green + "80" },
    { name: "E: Selling", value: -4.46, fill: C.amber },
    { name: "E: Admin", value: -19.51, fill: C.amberDark },
    { name: "EBIT", value: 0.5, fill: C.blue },
    { name: "L: Interest", value: -0.62, fill: C.purple },
    { name: "P: EBT*", value: -0.12, fill: C.red },
  ];

  // Use Financial Ratios reconciled view
  const reconciledData = [
    { name: "Revenue", value: 115.93, fill: C.green },
    { name: "COGS(adj)", value: -78.77, fill: C.red },
    { name: "GP", value: 37.16, fill: C.greenDark },
    { name: "SGA", value: -23.97, fill: C.amber },
    { name: "EBIT", value: 13.19, fill: C.blue },
    { name: "Interest", value: -0.62, fill: C.purple },
    { name: "EBT", value: 12.57, fill: C.gold },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Formula Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.card}, ${C.surface})`,
          border: `1px solid ${C.gold}20`,
          borderRadius: 20,
          padding: "28px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: C.gold,
            letterSpacing: "0.2em",
            fontFamily: FM,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          EVERGREEN PROFIT ARCHITECTURE — FY2568 ACTUAL
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            fontFamily: FM,
            lineHeight: 1.2,
            marginBottom: 6,
          }}
        >
          <span style={{ color: C.gold }}>P</span>
          <span style={{ color: C.t4, margin: "0 10px" }}>=</span>
          <span style={{ color: C.green }}>S</span>
          <span style={{ color: C.t4, margin: "0 10px" }}>−</span>
          <span style={{ color: C.red }}>C</span>
          <span style={{ color: C.t4, margin: "0 10px" }}>−</span>
          <span style={{ color: C.amber }}>E</span>
          <span style={{ color: C.t4, margin: "0 10px" }}>−</span>
          <span style={{ color: C.purple }}>L</span>
          <span style={{ color: C.t4, margin: "0 10px" }}>+</span>
          <span style={{ color: C.cyan }}>D</span>
        </div>
        <div style={{ fontSize: 14, color: C.t3, fontFamily: S }}>
          <span style={{ fontWeight: 700, color: C.gold }}>
            12.57M THB (EBT)
          </span>{" "}
          = 111.61M − 78.77M(adj) − 23.97M − 0.62M + Dev Investment
        </div>
      </div>

      {/* Variable Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {formulaVars.map((v) => (
          <div
            key={v.v}
            style={{
              background: `${v.color}06`,
              border: `1px solid ${v.color}18`,
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 24 }}>{v.icon}</span>
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: v.color,
                    fontFamily: FM,
                  }}
                >
                  {v.v}
                </div>
                <div style={{ fontSize: 10, color: C.t4 }}>{v.name}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: v.color,
                    fontFamily: FM,
                  }}
                >
                  {v.value}
                </div>
                <div style={{ fontSize: 11, color: C.t3 }}>
                  {v.pct} of Revenue
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: C.t3,
                padding: "6px 10px",
                background: v.color + "08",
                borderRadius: 8,
              }}
            >
              🎯 Target: {v.target}
            </div>
            {v.note && (
              <div
                style={{
                  fontSize: 10,
                  color: C.t4,
                  marginTop: 4,
                  fontStyle: "italic",
                }}
              >
                {v.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Profit Bridge (Reconciled) */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <SectionTitle
          icon="📊"
          title="Profit Bridge — Reconciled Financial Ratios View"
          sub="COGS adjusted per Financial Ratio analysis = 78.77M"
          tag="RECONCILED"
        />
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <BarChart
              data={reconciledData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis
                dataKey="name"
                tick={{ fill: C.t3, fontSize: 11, fontFamily: S }}
              />
              <YAxis tick={{ fill: C.t3, fontSize: 11, fontFamily: FM }} />
              <Tooltip
                contentStyle={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontFamily: FM,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {reconciledData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 12,
          }}
        >
          <div
            style={{
              background: C.green + "08",
              border: `1px solid ${C.green}15`,
              borderRadius: 10,
              padding: 12,
              fontSize: 12,
              color: C.t2,
            }}
          >
            <span style={{ fontWeight: 700, color: C.green }}>
              ✅ Positive Signal:
            </span>{" "}
            GP Margin improved to 32.05% (reconciled basis), EBITDA margin
            15.86%, ROE 29.32%
          </div>
          <div
            style={{
              background: C.red + "08",
              border: `1px solid ${C.red}15`,
              borderRadius: 10,
              padding: 12,
              fontSize: 12,
              color: C.t2,
            }}
          >
            <span style={{ fontWeight: 700, color: C.red }}>
              ⚠️ Key Concern:
            </span>{" "}
            P&L basis COGS 81.9% needs reconciliation. CCC 121 days, AR
            Collection 104 days, D/E 1.38x
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ TAB: FINANCIAL ═══════════════════════
function FinancialTab() {
  const bsData = [
    { name: "เงินสด", value: 11.93, fill: C.green },
    { name: "ลูกหนี้", value: 31.8, fill: C.blue },
    { name: "สินค้าคงเหลือ", value: 15.22, fill: C.amber },
    { name: "กู้ยืมบริษัทในเครือ", value: 1.4, fill: C.purple },
    { name: "สินทรัพย์หมุนเวียนอื่น", value: 0.88, fill: C.cyan },
    { name: "PPE สุทธิ", value: 27.67, fill: C.rose },
    { name: "สินทรัพย์ไม่หมุนเวียนอื่น", value: 0.25, fill: C.t4 },
  ];

  const liabData = [
    { name: "เจ้าหนี้การค้า", value: 11.48, fill: C.red },
    { name: "เงินกู้ระยะสั้น", value: 18.47, fill: C.rose },
    { name: "ค่าใช้จ่ายค้างจ่าย", value: 11.34, fill: C.amber },
    { name: "หนี้สินหมุนเวียนอื่น", value: 1.06, fill: C.amberDark },
    { name: "เงินกู้ระยะยาว", value: 16.64, fill: C.purple },
    { name: "ส่วนของผู้ถือหุ้น", value: 30.16, fill: C.gold },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Balance Sheet Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <SectionTitle icon="📦" title="สินทรัพย์ — 89.15M THB" tag="ASSETS" />
          <div style={{ height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={bsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {bsData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => `${v.toFixed(2)}M`}
                  contentStyle={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {bsData.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: d.fill,
                  }}
                />
                <span style={{ color: C.t2 }}>{d.name}</span>
              </div>
              <span style={{ fontWeight: 700, color: d.fill, fontFamily: FM }}>
                {d.value.toFixed(2)}M
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <SectionTitle
            icon="💳"
            title="หนี้สิน + ทุน — 89.15M THB"
            tag="LIAB & EQUITY"
          />
          <div style={{ height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={liabData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {liabData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => `${v.toFixed(2)}M`}
                  contentStyle={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {liabData.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: d.fill,
                  }}
                />
                <span style={{ color: C.t2 }}>{d.name}</span>
              </div>
              <span style={{ fontWeight: 700, color: d.fill, fontFamily: FM }}>
                {d.value.toFixed(2)}M
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* P&L Summary */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <SectionTitle
          icon="📋"
          title="งบกำไรขาดทุน FY2568 (Reconciled)"
          sub="Financial Ratios Sheet Basis"
          tag="P&L"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginTop: 12,
          }}
        >
          <MetricCard
            label="Gross Margin"
            value="32.05%"
            color={C.green}
            trend="กำไรหลังหักต้นทุน"
            icon="📈"
            small
          />
          <MetricCard
            label="EBIT Margin"
            value="11.38%"
            color={C.blue}
            trend="Operating Profit"
            icon="⚙️"
            small
          />
          <MetricCard
            label="EBITDA Margin"
            value="15.86%"
            color={C.cyan}
            trend="Cash Earnings"
            icon="💰"
            small
          />
          <MetricCard
            label="EBT Margin"
            value="10.84%"
            color={C.gold}
            trend="Before Tax Profit"
            icon="⭐"
            small
          />
        </div>

        {/* Key Figures */}
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          {[
            { l: "รายได้รวม", v: "115.93M", c: C.green },
            { l: "ต้นทุนขาย (adj)", v: "78.77M", c: C.red },
            { l: "กำไรขั้นต้น", v: "37.16M", c: C.green },
            { l: "EBITDA", v: "18.38M", c: C.cyan },
            { l: "EBIT", v: "13.19M", c: C.blue },
            { l: "EBT", v: "12.57M", c: C.gold },
            { l: "ดอกเบี้ยจ่าย", v: "0.62M", c: C.purple },
            { l: "ROA", v: "14.10%", c: C.green },
            { l: "ROE", v: "29.32%", c: C.gold },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: item.c + "06",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 12, color: C.t3, fontFamily: S }}>
                {item.l}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: item.c,
                  fontFamily: FM,
                }}
              >
                {item.v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ TAB: MONTHLY ═══════════════════════
function MonthlyTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Monthly Revenue vs Budget */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <SectionTitle
          icon="📈"
          title="Monthly Revenue — Actual FY2568 vs Budget FY2569"
          sub="หน่วย: ล้านบาท"
          tag="TREND"
        />
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={simplifiedMonthly.map((d, i) => ({
                ...d,
                budget69: [
                  9.9, 5.32, 13.98, 11.56, 7.86, 14.14, 24.84, 17.04, 23.36,
                  37.2, 19.36, 15.44,
                ][i],
              }))}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="m" tick={{ fill: C.t3, fontSize: 11 }} />
              <YAxis tick={{ fill: C.t3, fontSize: 11, fontFamily: FM }} />
              <Tooltip
                contentStyle={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend />
              <Bar
                dataKey="rev"
                name="Actual Revenue '68"
                fill={C.green}
                radius={[4, 4, 0, 0]}
              />
              <Line
                dataKey="budget69"
                name="Budget '69"
                stroke={C.gold}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: C.gold, r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Seasonality */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <SectionTitle
          icon="🔄"
          title="Revenue Seasonality Pattern"
          sub="% ของยอดขายรวมต่อเดือน — ใช้เป็น Seasonal Weight สำหรับ Budget 2569"
          tag="PATTERN"
        />
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <BarChart
              data={simplifiedMonthly.map((d) => ({
                ...d,
                pct: ((d.rev / 111.61) * 100).toFixed(1),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="m" tick={{ fill: C.t3, fontSize: 11 }} />
              <YAxis
                tick={{ fill: C.t3, fontSize: 11, fontFamily: FM }}
                unit="%"
              />
              <Tooltip
                formatter={(v) => `${v}%`}
                contentStyle={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                }}
              />
              <Bar
                dataKey="pct"
                name="% Revenue Share"
                fill={C.blue}
                radius={[4, 4, 0, 0]}
              >
                {simplifiedMonthly.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.rev > 10 ? C.green : d.rev > 7 ? C.blue : C.amber}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginTop: 12,
          }}
        >
          <div
            style={{
              background: C.green + "10",
              borderRadius: 8,
              padding: 10,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: C.t4 }}>Peak Month</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: C.green,
                fontFamily: FM,
              }}
            >
              ต.ค. 20.76M
            </div>
          </div>
          <div
            style={{
              background: C.red + "10",
              borderRadius: 8,
              padding: 10,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: C.t4 }}>Low Month</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: C.red,
                fontFamily: FM,
              }}
            >
              ก.พ. 2.97M
            </div>
          </div>
          <div
            style={{
              background: C.blue + "10",
              borderRadius: 8,
              padding: 10,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: C.t4 }}>Avg Monthly</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: C.blue,
                fontFamily: FM,
              }}
            >
              9.30M
            </div>
          </div>
          <div
            style={{
              background: C.gold + "10",
              borderRadius: 8,
              padding: 10,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: C.t4 }}>Std Dev</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: C.gold,
                fontFamily: FM,
              }}
            >
              ±4.8M
            </div>
          </div>
        </div>
      </div>

      {/* Historical Revenue Trend */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <SectionTitle
          icon="📉"
          title="Historical P&L — FY2562 to FY2568"
          sub="7 ปีย้อนหลัง + Budget 2569"
          tag="5-YEAR"
        />
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={[
                ...historicalPL.map((d) => ({ ...d, revN: d.rev })),
                { year: "Bdgt'69", revN: 200, net: 28.65, margin: 13.8 },
              ]}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="year" tick={{ fill: C.t3, fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                tick={{ fill: C.t3, fontSize: 11, fontFamily: FM }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: C.gold, fontSize: 11, fontFamily: FM }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="revN"
                name="Revenue (M)"
                fill={C.green + "60"}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                dataKey="margin"
                name="EBT Margin %"
                stroke={C.gold}
                strokeWidth={3}
                dot={{ fill: C.gold, r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ═══ TAB: RATIOS ═══════════════════════
function RatiosTab() {
  const radarData = [
    { metric: "GP Margin", value: 32, max: 40 },
    { metric: "EBITDA %", value: 15.9, max: 20 },
    { metric: "Current Ratio", value: 72.5, max: 100 },
    { metric: "D/E Health", value: 58, max: 100 },
    { metric: "AR Speed", value: 35, max: 100 },
    { metric: "Cash Ratio", value: 28, max: 100 },
    { metric: "ROE", value: 73, max: 100 },
    { metric: "Interest Cov", value: 85, max: 100 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Health Radar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <SectionTitle
            icon="🎯"
            title="Financial Health Radar"
            tag="OVERVIEW"
          />
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <RadarChart outerRadius={100} data={radarData}>
                <PolarGrid stroke={C.border} />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: C.t3, fontSize: 10 }}
                />
                <PolarRadiusAxis tick={false} />
                <Radar
                  name="Health Score"
                  dataKey="value"
                  stroke={C.gold}
                  fill={C.gold}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <SectionTitle
            icon="🏷️"
            title="DuPont Analysis — ROE 29.32%"
            tag="DUPONT"
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 12,
            }}
          >
            <div
              style={{
                background: C.gold + "08",
                border: `1px solid ${C.gold}15`,
                borderRadius: 12,
                padding: 14,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: C.gold,
                  fontFamily: FM,
                }}
              >
                ROE = 29.32%
              </div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
                = Margin × Turnover × Leverage
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              <div
                style={{
                  background: C.green + "08",
                  borderRadius: 10,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: C.green,
                    fontFamily: FM,
                  }}
                >
                  10.84%
                </div>
                <div style={{ fontSize: 10, color: C.t4 }}>Net Margin</div>
              </div>
              <div
                style={{
                  background: C.blue + "08",
                  borderRadius: 10,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: C.blue,
                    fontFamily: FM,
                  }}
                >
                  1.30x
                </div>
                <div style={{ fontSize: 10, color: C.t4 }}>Asset Turnover</div>
              </div>
              <div
                style={{
                  background: C.amber + "08",
                  borderRadius: 10,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: C.amber,
                    fontFamily: FM,
                  }}
                >
                  2.08x
                </div>
                <div style={{ fontSize: 10, color: C.t4 }}>
                  Equity Multiplier
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Ratios */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <SectionTitle
          icon="🔬"
          title="Financial Ratios — All Categories"
          sub="จากงบการเงิน FY2568 (Financial Ratios Sheet)"
          tag="COMPLETE"
        />

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.green,
            marginTop: 16,
            marginBottom: 8,
            fontFamily: FM,
          }}
        >
          PROFITABILITY
        </div>
        <RatioRow
          label="Gross Profit Margin"
          value="32.05"
          unit="%"
          target="≥35%"
          status="warning"
        />
        <RatioRow
          label="EBIT Margin (Operating)"
          value="11.38"
          unit="%"
          target="≥10%"
          status="good"
        />
        <RatioRow
          label="EBT Margin"
          value="10.84"
          unit="%"
          target="≥12%"
          status="warning"
        />
        <RatioRow
          label="EBITDA Margin"
          value="15.86"
          unit="%"
          target="≥15%"
          status="good"
        />
        <RatioRow
          label="ROA"
          value="14.10"
          unit="%"
          target="≥10%"
          status="good"
        />
        <RatioRow
          label="ROE"
          value="29.32"
          unit="%"
          target="≥20%"
          status="good"
        />

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.blue,
            marginTop: 20,
            marginBottom: 8,
            fontFamily: FM,
          }}
        >
          LIQUIDITY
        </div>
        <RatioRow
          label="Current Ratio"
          value="1.45"
          unit="x"
          target="≥1.5"
          status="warning"
        />
        <RatioRow
          label="Quick Ratio"
          value="1.09"
          unit="x"
          target="≥1.0"
          status="good"
        />
        <RatioRow
          label="Cash Ratio"
          value="0.28"
          unit="x"
          target="≥0.3"
          status="warning"
        />

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.amber,
            marginTop: 20,
            marginBottom: 8,
            fontFamily: FM,
          }}
        >
          LEVERAGE
        </div>
        <RatioRow
          label="D/E Ratio"
          value="1.38"
          unit="x"
          target="≤1.5"
          status="warning"
        />
        <RatioRow
          label="Debt Ratio"
          value="66.17"
          unit="%"
          target="≤60%"
          status="danger"
        />
        <RatioRow
          label="Interest Coverage"
          value="21.15"
          unit="x"
          target="≥3"
          status="good"
        />

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.purple,
            marginTop: 20,
            marginBottom: 8,
            fontFamily: FM,
          }}
        >
          EFFICIENCY
        </div>
        <RatioRow
          label="AR Collection Period"
          value="104"
          unit="วัน"
          target="≤60 วัน"
          status="danger"
        />
        <RatioRow
          label="Inventory Days"
          value="71"
          unit="วัน"
          target="≤60 วัน"
          status="warning"
        />
        <RatioRow
          label="AP Payment Period"
          value="53"
          unit="วัน"
          target="30-60 วัน"
          status="good"
        />
        <RatioRow
          label="Cash Conversion Cycle"
          value="121"
          unit="วัน"
          target="≤90 วัน"
          status="danger"
        />
        <RatioRow
          label="Asset Turnover"
          value="1.30"
          unit="x"
          target="≥1.5"
          status="warning"
        />
      </div>
    </div>
  );
}

// ═══ TAB: BUDGET ═══════════════════════
function BudgetTab() {
  const compData = [
    { name: "Revenue", actual: 115.93, budget: 207.74, growth: "+79.2%" },
    { name: "COGS", actual: 78.77, budget: 135.03, growth: "65% target" },
    { name: "GP", actual: 37.16, budget: 72.71, growth: "+95.8%" },
    { name: "SGA", actual: 23.97, budget: 38.12, growth: "18.35% cap" },
    { name: "EBT", actual: 12.57, budget: 28.65, growth: "+128.0%" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Budget Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.gold}08, ${C.card})`,
          border: `1px solid ${C.gold}25`,
          borderRadius: 20,
          padding: 28,
        }}
      >
        <SectionTitle
          icon="🎯"
          title="Budget 2569 — Target 200M Revenue"
          sub="เป้าหมายยอดขายเพิ่ม 79.2% | ปรับปรุง COGS สู่ 65% | EBT Margin 13.8%"
          tag="BUDGET '69"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 12,
            marginTop: 16,
          }}
        >
          <MetricCard
            label="Revenue Target"
            value="200M"
            color={C.green}
            trend="+79.2% vs FY68"
            trendDir="up"
            small
          />
          <MetricCard
            label="COGS Target"
            value="65.0%"
            color={C.red}
            trend="vs 67.95% actual"
            trendDir="up"
            small
          />
          <MetricCard
            label="SGA Target"
            value="18.35%"
            color={C.amber}
            trend="vs 20.67% actual"
            trendDir="up"
            small
          />
          <MetricCard
            label="Marketing Budget"
            value="5.0M"
            color={C.blue}
            trend="2.5% of rev"
            trendDir="up"
            small
          />
          <MetricCard
            label="EBT Target"
            value="28.65M"
            color={C.gold}
            trend="13.8% margin"
            trendDir="up"
            small
          />
        </div>
      </div>

      {/* Comparison Chart */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <SectionTitle
          icon="📊"
          title="Actual FY2568 vs Budget FY2569"
          tag="COMPARISON"
        />
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <BarChart
              data={compData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fill: C.t3, fontSize: 12 }} />
              <YAxis tick={{ fill: C.t3, fontSize: 11, fontFamily: FM }} />
              <Tooltip
                contentStyle={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend />
              <Bar
                dataKey="actual"
                name="Actual FY2568"
                fill={C.blue + "80"}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="budget"
                name="Budget FY2569"
                fill={C.gold}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assumptions */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <SectionTitle
          icon="📝"
          title="Budget 2569 Assumptions & Marketing Strategy"
          tag="ASSUMPTIONS"
        />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.gold,
                marginBottom: 10,
                fontFamily: FM,
              }}
            >
              KEY ASSUMPTIONS
            </div>
            {[
              {
                label: "COGS % Target",
                from: "67.95%",
                to: "65.00%",
                color: C.green,
              },
              {
                label: "Selling % Target",
                from: "3.85%",
                to: "3.85%",
                color: C.blue,
              },
              {
                label: "Admin % Target",
                from: "16.83%",
                to: "14.50%",
                color: C.amber,
              },
              {
                label: "Interest % Target",
                from: "0.54%",
                to: "0.45%",
                color: C.purple,
              },
              {
                label: "Marketing Budget",
                from: "0.23%",
                to: "2.50%",
                color: C.rose,
              },
            ].map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <span style={{ fontSize: 12, color: C.t2, flex: 1 }}>
                  {a.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.t4,
                    fontFamily: FM,
                  }}
                >
                  {a.from}
                </span>
                <span style={{ color: C.gold }}>→</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: a.color,
                    fontFamily: FM,
                  }}
                >
                  {a.to}
                </span>
              </div>
            ))}
          </div>

          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.gold,
                marginBottom: 10,
                fontFamily: FM,
              }}
            >
              MARKETING BUDGET SPLIT — 5.0M
            </div>
            {[
              {
                label: "Online Ads (40%)",
                value: "2.0M",
                pct: 40,
                color: C.blue,
              },
              {
                label: "Exhibition (25%)",
                value: "1.25M",
                pct: 25,
                color: C.green,
              },
              {
                label: "Print / Catalog (15%)",
                value: "0.75M",
                pct: 15,
                color: C.amber,
              },
              {
                label: "Promotion (10%)",
                value: "0.5M",
                pct: 10,
                color: C.purple,
              },
              { label: "Reserve (10%)", value: "0.5M", pct: 10, color: C.t4 },
            ].map((m, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <ProgressBar
                  value={m.pct}
                  max={100}
                  color={m.color}
                  label={`${m.label} — ${m.value}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ TAB: PEOPLE & PAYROLL ═══════════════
function PeopleTab() {
  const payrollChart = salaryMonthly.map((d) => {
    const sum67 =
      d.office67 +
      d.sales67 +
      d.daily67 +
      (d.dailyNoSS67 || 0) +
      d.subcon67 +
      d.foreman67 +
      d.outside67;
    const sum68 =
      d.office68 +
      d.sales68 +
      d.daily68 +
      (d.dailyNoSS68 || 0) +
      d.subcon68 +
      d.foreman68 +
      d.outside68;
    return {
      m: d.m,
      total67: +(sum67 / 1000000).toFixed(2),
      total68: +(sum68 / 1000000).toFixed(2),
      hc67: d.hcTotal67,
      hc68: d.hcTotal68,
      costPerHead68: d.hcTotal68 > 0 ? Math.round(sum68 / d.hcTotal68) : 0,
    };
  });

  const categoryBreakdown = [
    {
      name: "Office",
      v67: salaryTotals.office67,
      v68: salaryTotals.office68,
      pct: salaryTotals.officePct,
      color: C.blue,
    },
    {
      name: "Sales",
      v67: salaryTotals.sales67,
      v68: salaryTotals.sales68,
      pct: salaryTotals.salesPct,
      color: C.cyan,
    },
    {
      name: "Daily (มี ปกส.)",
      v67: salaryTotals.daily67,
      v68: salaryTotals.daily68,
      pct: salaryTotals.dailyPct,
      color: C.green,
    },
    {
      name: "Daily (ไม่มี ปกส.)",
      v67: salaryTotals.dailyNoSS67,
      v68: salaryTotals.dailyNoSS68,
      pct: salaryTotals.dailyNoSSPct,
      color: C.greenDark,
    },
    {
      name: "Subcontractor",
      v67: salaryTotals.subcon67,
      v68: salaryTotals.subcon68,
      pct: salaryTotals.subconPct,
      color: C.amber,
    },
    {
      name: "Foreman",
      v67: salaryTotals.foreman67,
      v68: salaryTotals.foreman68,
      pct: salaryTotals.foremanPct,
      color: C.purple,
    },
    {
      name: "Outside",
      v67: salaryTotals.outside67,
      v68: salaryTotals.outside68,
      pct: salaryTotals.outsidePct,
      color: C.rose,
    },
  ];

  const pie68 = categoryBreakdown.map((c) => ({ name: c.name, value: c.v68 }));
  const pieColors = categoryBreakdown.map((c) => c.color);

  const hcTrend = salaryMonthly.map((d) => ({
    m: d.m,
    office: d.hcOffice68,
    sales: d.hcSales68,
    daily: d.hcDaily68,
    subcon: d.hcSubcon68,
    foreman: d.hcForeman68,
    total: d.hcTotal68,
  }));

  const revPerEmpMonthly = [
    { m: "ม.ค.", rpe: 5530000 / 65 },
    { m: "ก.พ.", rpe: 2970000 / 66 },
    { m: "มี.ค.", rpe: 7800000 / 68 },
    { m: "เม.ย.", rpe: 6450000 / 70 },
    { m: "พ.ค.", rpe: 4380000 / 73 },
    { m: "มิ.ย.", rpe: 7890000 / 74 },
    { m: "ก.ค.", rpe: 13860000 / 88 },
    { m: "ส.ค.", rpe: 9510000 / 90 },
    { m: "ก.ย.", rpe: 13040000 / 99 },
    { m: "ต.ค.", rpe: 20760000 / 99 },
    { m: "พ.ย.", rpe: 10810000 / 104 },
    { m: "ธ.ค.", rpe: 8610000 / 103 },
  ].map((d) => ({ ...d, rpe: Math.round(d.rpe) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle
        icon="👥"
        title="People & Payroll Analytics — FY2568"
        sub="ข้อมูลเงินเดือน/รายได้เปรียบเทียบ FY2567 vs FY2568"
        tag="PEOPLE"
      />

      {/* Top KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
        }}
      >
        <MetricCard
          label="Total Payroll FY68"
          value="23.14M"
          sub="เงินเดือนรวมทุกประเภท"
          trend="+3.6% vs FY67"
          trendDir="up"
          color={C.green}
          icon="💰"
        />
        <MetricCard
          label="Headcount (Dec)"
          value="103"
          sub="เฉลี่ย 83 คน/เดือน"
          trend="+54% vs ม.ค. (65)"
          trendDir="up"
          color={C.blue}
          icon="👤"
        />
        <MetricCard
          label="Revenue per Emp"
          value="1.34M"
          sub="ต่อปี/คน"
          trend="เป้า IPO: 2.0M+"
          trendDir="down"
          color={C.amber}
          icon="📊"
        />
        <MetricCard
          label="Payroll/Revenue"
          value="20.7%"
          sub="23.14M / 111.6M"
          trend="ควบคุมดี ✓"
          trendDir="up"
          color={C.green}
          icon="⚖️"
        />
        <MetricCard
          label="Cost per Head"
          value="23.2K"
          sub="เฉลี่ย/คน/เดือน"
          trend="ต.ค.สูงสุด 27.6K"
          trendDir="up"
          color={C.cyan}
          icon="💵"
        />
      </div>

      {/* Insight Banner */}
      <div
        style={{
          background: `${C.green}0A`,
          border: `1px solid ${C.green}25`,
          borderRadius: 14,
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 28 }}>✅</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>
            Payroll ควบคุมได้ดี: +3.6% YoY ขณะที่ Revenue +25.4%
          </div>
          <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>
            เงินเดือนรวม 23.14M (20.7% of Rev) — แต่ Headcount เพิ่มจาก 65→103
            คนใน H2 ซึ่ง Gross Total รวม OT/โบนัส/สวัสดิการ = 40.75M ต้องวางแผน
            Headcount Budget FY69 ให้สอดคล้องกับเป้า 200M
          </div>
        </div>
      </div>

      {/* Row 1: Payroll Trend + Pie */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.t1,
              marginBottom: 12,
            }}
          >
            📊 Payroll รายเดือน (ล้านบาท) — FY67 vs FY68
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={payrollChart}
              margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="m" tick={{ fill: C.t3, fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: C.t3, fontSize: 10 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: C.t3, fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: C.t1,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                yAxisId="left"
                dataKey="total67"
                name="FY67 (M)"
                fill={C.t4}
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Bar
                yAxisId="left"
                dataKey="total68"
                name="FY68 (M)"
                fill={C.gold}
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="hc68"
                name="Headcount 68"
                stroke={C.cyan}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.t1,
              marginBottom: 8,
            }}
          >
            💼 สัดส่วน Payroll FY68
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pie68}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                dataKey="value"
                paddingAngle={2}
              >
                {pie68.map((_, i) => (
                  <Cell key={i} fill={pieColors[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `${(v / 1000000).toFixed(2)}M`}
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 11,
                  color: C.t1,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              justifyContent: "center",
            }}
          >
            {categoryBreakdown.map((c) => (
              <span
                key={c.name}
                style={{
                  fontSize: 10,
                  color: c.color,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: c.color,
                    borderRadius: 2,
                    display: "inline-block",
                  }}
                />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 18,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.t1,
            marginBottom: 12,
          }}
        >
          📋 เปรียบเทียบเงินเดือนตามประเภท (FY67 → FY68)
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr 1.5fr",
            gap: 0,
          }}
        >
          {["ประเภท", "FY2567", "FY2568", "เปลี่ยนแปลง", "ข้อสังเกต"].map(
            (h) => (
              <div
                key={h}
                style={{
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.gold,
                  borderBottom: `1px solid ${C.border}`,
                  background: C.surface,
                }}
              >
                {h}
              </div>
            ),
          )}
          {categoryBreakdown.map((c) => [
            <div
              key={c.name + "n"}
              style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${C.border}08`,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: c.color,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>
                {c.name}
              </span>
            </div>,
            <div
              key={c.name + "67"}
              style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${C.border}08`,
                fontSize: 12,
                fontFamily: FM,
                color: C.t2,
              }}
            >
              {(c.v67 / 1000000).toFixed(2)}M
            </div>,
            <div
              key={c.name + "68"}
              style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${C.border}08`,
                fontSize: 12,
                fontFamily: FM,
                color: C.t1,
                fontWeight: 700,
              }}
            >
              {(c.v68 / 1000000).toFixed(2)}M
            </div>,
            <div
              key={c.name + "pct"}
              style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${C.border}08`,
                fontSize: 12,
                fontFamily: FM,
                fontWeight: 700,
                color: c.pct > 0 ? C.red : C.green,
              }}
            >
              {c.pct > 0 ? "+" : ""}
              {c.pct}%
            </div>,
            <div
              key={c.name + "note"}
              style={{
                padding: "10px 12px",
                borderBottom: `1px solid ${C.border}08`,
                fontSize: 11,
                color: C.t3,
              }}
            >
              {c.name === "Office" && "เพิ่ม HC จาก 12→27 คน (H2 expansion)"}
              {c.name === "Sales" && "ลด HC จาก 8→4-6 คน — ต้องเพิ่มใหม่"}
              {c.name === "Daily (มี ปกส.)" &&
                "HC เพิ่มตาม Production volume H2"}
              {c.name === "Daily (ไม่มี ปกส.)" &&
                "ค่อนข้างคงที่ ลดเล็กน้อย -4.8%"}
              {c.name === "Subcontractor" &&
                "ลดลง -15% แม้งานเพิ่ม = ประสิทธิภาพ↑"}
              {c.name === "Foreman" && "เพิ่ม 1 คน (2→3) ตามทีม Production"}
              {c.name === "Outside" && "ค่อนข้างคงที่ — ใช้เฉพาะกิจ"}
            </div>,
          ])}
          {/* Total Row */}
          <div
            style={{
              padding: "10px 12px",
              fontSize: 12,
              fontWeight: 800,
              color: C.gold,
              background: C.surface,
            }}
          >
            รวมทั้งหมด
          </div>
          <div
            style={{
              padding: "10px 12px",
              fontSize: 12,
              fontFamily: FM,
              fontWeight: 700,
              color: C.t2,
              background: C.surface,
            }}
          >
            22.34M
          </div>
          <div
            style={{
              padding: "10px 12px",
              fontSize: 12,
              fontFamily: FM,
              fontWeight: 800,
              color: C.gold,
              background: C.surface,
            }}
          >
            23.14M
          </div>
          <div
            style={{
              padding: "10px 12px",
              fontSize: 12,
              fontFamily: FM,
              fontWeight: 800,
              color: C.green,
              background: C.surface,
            }}
          >
            +3.6%
          </div>
          <div
            style={{
              padding: "10px 12px",
              fontSize: 11,
              color: C.green,
              fontWeight: 600,
              background: C.surface,
            }}
          >
            ควบคุมดี — Gross Total รวม OT/โบนัส = 40.75M
          </div>
        </div>
      </div>

      {/* Row 2: Headcount Trend + Revenue per Employee */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.t1,
              marginBottom: 12,
            }}
          >
            👤 Headcount Trend FY68 (by type)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={hcTrend}
              margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="m" tick={{ fill: C.t3, fontSize: 10 }} />
              <YAxis tick={{ fill: C.t3, fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 11,
                  color: C.t1,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="office"
                name="Office"
                stackId="1"
                fill={C.blue}
                stroke={C.blue}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="sales"
                name="Sales"
                stackId="1"
                fill={C.cyan}
                stroke={C.cyan}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="daily"
                name="Daily"
                stackId="1"
                fill={C.green}
                stroke={C.green}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="subcon"
                name="Subcon"
                stackId="1"
                fill={C.amber}
                stroke={C.amber}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="foreman"
                name="Foreman"
                stackId="1"
                fill={C.purple}
                stroke={C.purple}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.t1,
              marginBottom: 12,
            }}
          >
            💎 Revenue per Employee (บาท/คน/เดือน)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart
              data={revPerEmpMonthly}
              margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="m" tick={{ fill: C.t3, fontSize: 10 }} />
              <YAxis
                tick={{ fill: C.t3, fontSize: 10 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(v) => `${v.toLocaleString()} THB`}
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 11,
                  color: C.t1,
                }}
              />
              <Bar
                dataKey="rpe"
                name="Revenue/Employee"
                fill={C.gold}
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Line
                type="monotone"
                dataKey={() => 166667}
                name="เป้า 2.0M/yr (167K/mo)"
                stroke={C.red}
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* People Insights */}
      <div
        style={{
          background: `${C.gold}06`,
          border: `1px solid ${C.gold}20`,
          borderRadius: 16,
          padding: 20,
        }}
      >
        <SectionTitle
          icon="🎯"
          title="People Strategy Insights"
          tag="EA ANALYSIS"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          {[
            {
              title: "Headcount Budget FY69",
              desc: "ตั้งเป้า 120 คน สำหรับ Revenue 200M = Rev/Emp 1.67M (ใกล้เป้า 2.0M) — ต้องเลือกรับคนที่ช่วย Scale ได้จริง",
              color: C.blue,
              icon: "📋",
            },
            {
              title: "Payroll Ratio Maintain",
              desc: "รักษา Payroll/Rev ≤25% = Budget เงินเดือน ~50M สำหรับ 200M Revenue — ปัจจุบัน 20.7% ถือว่าดีมาก ต้องรักษาไว้",
              color: C.green,
              icon: "⚖️",
            },
            {
              title: "Sales Team Rebuild",
              desc: "Sales HC ลดจาก 8→4 คน (-50%) ขณะที่ต้องโต 79% — เร่งรับ Sales ใหม่ 4-6 คนใน Q1/69 + CRM Pipeline",
              color: C.red,
              icon: "🔥",
            },
          ].map((w) => (
            <div
              key={w.title}
              style={{
                background: w.color + "08",
                border: `1px solid ${w.color}20`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{w.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>
                {w.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.t3,
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                {w.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ TAB: CORE VALUES ═══════════════════
function CoreValuesTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.gold,
            letterSpacing: "0.15em",
            fontFamily: FM,
            marginBottom: 8,
          }}
        >
          CHH² = CULTURE OF HEART & HIGH PERFORMANCE
        </div>
        <div
          style={{ fontSize: 28, fontWeight: 900, color: C.t1, fontFamily: F }}
        >
          Core Values
        </div>
        <div
          style={{
            fontSize: 13,
            color: C.t3,
            marginTop: 6,
            maxWidth: 600,
            margin: "6px auto 0",
          }}
        >
          6 ค่านิยมหลักที่ขับเคลื่อน Evergreen จาก "โรงงาน" สู่
          "องค์กรแห่งคุณค่า" — เป็นรากฐานของทุกการตัดสินใจ ทุกกระบวนการ และทุกคน
        </div>
      </div>

      {/* Values Grid — House Shape */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {coreValues.map((v) => (
          <div
            key={v.id}
            style={{
              background: C.card,
              border: `1px solid ${v.color}25`,
              borderRadius: 16,
              padding: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Roof */}
            <div
              style={{
                background: `linear-gradient(135deg, ${v.color}15, ${v.color}08)`,
                padding: "20px 20px 16px",
                borderBottom: `2px solid ${v.color}30`,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 16,
                  fontSize: 32,
                  opacity: 0.3,
                }}
              >
                {v.icon}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: v.color,
                  fontFamily: FM,
                  letterSpacing: "0.1em",
                  marginBottom: 4,
                }}
              >
                VALUE #{v.id}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.t1 }}>
                {v.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: v.color,
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {v.nameTH}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.t4,
                  fontStyle: "italic",
                  marginTop: 4,
                }}
              >
                "{v.motto}"
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: "16px 20px 20px" }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.t4,
                  marginBottom: 8,
                  letterSpacing: "0.05em",
                }}
              >
                พฤติกรรมที่คาดหวัง
              </div>
              {v.behaviors.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 8,
                    padding: "8px 10px",
                    background: `${v.color}06`,
                    borderRadius: 8,
                    border: `1px solid ${v.color}10`,
                  }}
                >
                  <span
                    style={{
                      color: v.color,
                      fontSize: 14,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ fontSize: 12, color: C.t2, lineHeight: 1.4 }}>
                    {b}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Values Integration Map */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <SectionTitle
          icon="🔗"
          title="Values × Enterprise Architecture Integration"
          sub="Core Values เชื่อมกับทุกระดับของ Architecture"
          tag="ALIGNMENT"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {[
            {
              layer: "Strategy",
              value: "Customer Centric + Honest Integrity",
              how: "กลยุทธ์ต้องเริ่มจากลูกค้า และตรวจสอบได้ทุกขั้น",
              icon: "🧭",
              color: C.green,
            },
            {
              layer: "Process",
              value: "Heartwork Smartwork",
              how: "SOP ทุกตัวต้องใส่ Heart (คุณภาพ) + System (ประสิทธิภาพ)",
              icon: "⚙️",
              color: C.blue,
            },
            {
              layer: "Governance",
              value: "Honest Integrity + Humble",
              how: "Audit, KPI, COSO — โปร่งใส ยอมรับข้อผิดพลาด เรียนรู้ต่อ",
              icon: "🛡️",
              color: C.cyan,
            },
            {
              layer: "People",
              value: "Happy Workplace + Collaboration",
              how: "ABCD Evaluation + 5ส Alignment — วัดผลร่วม ไม่ทิ้งใคร",
              icon: "👥",
              color: C.amber,
            },
            {
              layer: "Technology",
              value: "Heartwork Smartwork",
              how: "D365 BC / n8n / Power BI — ระบบต้องช่วยคน ไม่ใช่แทนคน",
              icon: "💻",
              color: C.purple,
            },
            {
              layer: "Culture",
              value: "ทั้ง 6 ค่านิยม",
              how: "ทุกอย่างเริ่มจาก CHH² — Heart & High Performance เป็นรากของทุกสิ่ง",
              icon: "🌱",
              color: C.gold,
            },
          ].map((item) => (
            <div
              key={item.layer}
              style={{
                background: `${item.color}06`,
                border: `1px solid ${item.color}15`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: item.color,
                      fontFamily: FM,
                    }}
                  >
                    {item.layer}
                  </div>
                  <div style={{ fontSize: 10, color: C.t4 }}>{item.value}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
                {item.how}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Values Assessment Suggestion */}
      <div
        style={{
          background: `${C.gold}06`,
          border: `1px solid ${C.gold}20`,
          borderRadius: 16,
          padding: 20,
        }}
      >
        <SectionTitle
          icon="📊"
          title="Values Assessment — CEO Action Items"
          tag="NEXT STEP"
        />
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {[
            {
              action: "Quarterly Values Survey",
              desc: "วัดผลพฤติกรรม 6 Core Values ทุกไตรมาส ผ่าน ABCD Evaluation — ผูกกับ KPI และ Bonus",
              priority: "HIGH",
              color: C.green,
            },
            {
              action: "Values Champion Program",
              desc: "เลือกตัวแทนแต่ละ Value 6 คน/ทีม เป็น Role Model + จัด Monthly Story Sharing",
              priority: "MEDIUM",
              color: C.blue,
            },
            {
              action: "Onboarding Integration",
              desc: "ทุก New Hire ต้องผ่าน CHH² Workshop 1 วัน — เข้าใจ Values ก่อนเริ่มงาน",
              priority: "HIGH",
              color: C.amber,
            },
            {
              action: "Values-Based Decision Matrix",
              desc: "ทุกการตัดสินใจสำคัญ (>50K) ต้อง Check กับ Core Values ผ่าน โยนิโสมนสิการ Framework",
              priority: "MEDIUM",
              color: C.purple,
            },
          ].map((a) => (
            <div
              key={a.action}
              style={{
                background: a.color + "08",
                border: `1px solid ${a.color}20`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: a.color,
                    background: a.color + "15",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontFamily: FM,
                  }}
                >
                  {a.priority}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>
                  {a.action}
                </span>
              </div>
              <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>
                {a.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ TAB: RISKS ═══════════════════════
function RisksTab() {
  const risks = [
    {
      area: "AR Collection",
      severity: "critical",
      value: "104 วัน",
      target: "≤60 วัน",
      impact: "Cash trap ~31.8M ใน AR — ส่งผลต่อสภาพคล่อง",
      action:
        "AR Follow-up SOP + Auto-escalation via n8n + Credit Policy Review",
      owner: "Finance + Sales",
      system: "D365 BC + n8n",
    },
    {
      area: "Cash Conversion Cycle",
      severity: "critical",
      value: "121 วัน",
      target: "≤90 วัน",
      impact: "Working Capital ถูกล็อค — ต้องกู้เพิ่ม",
      action: "Shorten AR + Optimize inventory + Negotiate DPO",
      owner: "CFO",
      system: "D365 BC + Power BI",
    },
    {
      area: "Debt Ratio",
      severity: "high",
      value: "66.17%",
      target: "≤60%",
      impact: "สินทรัพย์ 2/3 มาจากหนี้ — IPO risk",
      action: "Retained earnings strategy + Debt restructuring",
      owner: "CFO + CEO",
      system: "Financial Planning",
    },
    {
      area: "Revenue Volatility",
      severity: "high",
      value: "±4.8M/mo",
      target: "Smooth",
      impact: "ก.พ. ต่ำสุด 2.97M vs ต.ค. สูงสุด 20.76M = 7x gap",
      action: "Channel diversification (B2C + Dealer) + Retainer contracts",
      owner: "Sales Director",
      system: "CRM + Pipeline",
    },
    {
      area: "COGS Reconciliation",
      severity: "high",
      value: "81.9% vs 67.9%",
      target: "Align",
      impact: "P&L basis vs Ratio basis ต่างกัน — ต้อง reconcile",
      action: "Standard Costing implementation + BOM accuracy in D365 BC",
      owner: "CFO + Production",
      system: "D365 BC Costing",
    },
    {
      area: "D Investment",
      severity: "medium",
      value: "0.65%",
      target: "3-5%",
      impact: "Under-investing ใน People + Technology + R&D",
      action: "Allocate 3-5% Revenue to Training + Digital + R&D",
      owner: "CEO + EA",
      system: "Budget Allocation",
    },
    {
      area: "Fixed Cost Creep",
      severity: "medium",
      value: "18.97M/yr",
      target: "Monitor",
      impact: "Fixed cost เพิ่มจาก headcount + consulting",
      action: "Breakeven analysis + Automation ROI tracking",
      owner: "CFO",
      system: "Power BI Dashboard",
    },
    {
      area: "Bad Debt Reserve",
      severity: "medium",
      value: "8.61M",
      target: "Reduce",
      impact: "ค่าเผื่อหนี้สงสัยจะสูญสูง",
      action: "AR aging review + Write-off policy + Credit scoring",
      owner: "Finance",
      system: "D365 BC AR",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionTitle
        icon="⚡"
        title="Risk Register & Action Items — CEO Priority"
        sub="จากการวิเคราะห์งบการเงิน FY2568"
        tag="TOP 8 RISKS"
      />

      {risks.map((r, i) => {
        const sevColor =
          r.severity === "critical"
            ? C.red
            : r.severity === "high"
              ? C.amber
              : C.blue;
        return (
          <div
            key={i}
            style={{
              background: C.card,
              border: `1px solid ${sevColor}25`,
              borderRadius: 14,
              padding: 18,
              borderLeft: `4px solid ${sevColor}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: sevColor,
                  background: sevColor + "15",
                  padding: "3px 10px",
                  borderRadius: 10,
                  fontFamily: FM,
                  textTransform: "uppercase",
                }}
              >
                {r.severity}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.t1,
                  fontFamily: F,
                }}
              >
                {r.area}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 14,
                  fontWeight: 800,
                  color: sevColor,
                  fontFamily: FM,
                }}
              >
                {r.value}
              </span>
              <span style={{ fontSize: 11, color: C.t4 }}>
                Target: {r.target}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.t3, marginBottom: 8 }}>
              💥 <strong>Impact:</strong> {r.impact}
            </div>
            <div style={{ fontSize: 12, color: C.green, marginBottom: 4 }}>
              ✅ <strong>Action:</strong> {r.action}
            </div>
            <div
              style={{ display: "flex", gap: 16, fontSize: 11, color: C.t4 }}
            >
              <span>👤 {r.owner}</span>
              <span>🔧 {r.system}</span>
            </div>
          </div>
        );
      })}

      {/* Quick Win Summary */}
      <div
        style={{
          background: `${C.gold}06`,
          border: `1px solid ${C.gold}20`,
          borderRadius: 16,
          padding: 20,
        }}
      >
        <SectionTitle
          icon="🏆"
          title="CEO Quick Win — Top 3 Actions"
          tag="90 DAYS"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          {[
            {
              n: 1,
              title: "AR Collection Blitz",
              desc: "ลด DSO จาก 104 → 60 วัน = ปลดล็อค ~14M cash",
              color: C.green,
              kpi: "DSO ≤60 วัน",
            },
            {
              n: 2,
              title: "Standard Costing Setup",
              desc: "Reconcile COGS + ตั้ง Std Cost ทุก SKU ใน D365 BC",
              color: C.blue,
              kpi: "Variance ≤5%",
            },
            {
              n: 3,
              title: "Budget '69 Kick-off",
              desc: "เริ่ม Revenue 200M plan: Channel mix + Marketing 5M",
              color: C.gold,
              kpi: "Pipeline 60M by Q1",
            },
          ].map((w) => (
            <div
              key={w.n}
              style={{
                background: w.color + "08",
                border: `1px solid ${w.color}20`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: w.color,
                  fontFamily: FM,
                }}
              >
                #{w.n}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.t1,
                  marginTop: 4,
                }}
              >
                {w.title}
              </div>
              <div style={{ fontSize: 12, color: C.t3, marginTop: 6 }}>
                {w.desc}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: w.color,
                  marginTop: 8,
                  padding: "4px 10px",
                  background: w.color + "10",
                  borderRadius: 6,
                  display: "inline-block",
                  fontFamily: FM,
                }}
              >
                KPI: {w.kpi}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

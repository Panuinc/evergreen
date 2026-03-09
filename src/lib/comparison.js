


export function getComparisonRanges(mode, ref = new Date()) {
  const year = ref.getFullYear();
  const month = ref.getMonth();

  if (mode === "ytm") {

    const endDate = new Date(year, month + 1, 0);
    return {
      current: {
        start: `${year}-01-01`,
        end: endDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }),
        label: `ม.ค.–${endDate.toLocaleDateString("th-TH", { month: "short" })} ${String(year % 100).padStart(2, "0")}`,
      },
      previous: {
        start: `${year - 1}-01-01`,
        end: `${year - 1}-${String(month + 1).padStart(2, "0")}-${String(new Date(year - 1, month + 1, 0).getDate()).padStart(2, "0")}`,
        label: `ม.ค.–${new Date(year - 1, month, 1).toLocaleDateString("th-TH", { month: "short" })} ${String((year - 1) % 100).padStart(2, "0")}`,
      },
    };
  }


  return {
    current: {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      label: `ปี ${String(year % 100).padStart(2, "0")}`,
    },
    previous: {
      start: `${year - 1}-01-01`,
      end: `${year - 1}-12-31`,
      label: `ปี ${String((year - 1) % 100).padStart(2, "0")}`,
    },
  };
}


export function pctChange(current, previous) {
  if (!previous || previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}


export function filterByDateRange(arr, dateField, start, end) {
  return arr.filter((item) => {
    const d = item[dateField];
    if (!d) return false;
    const dateStr = d.slice(0, 10);
    return dateStr >= start && dateStr <= end;
  });
}


export function groupByMonth(arr, dateField) {
  const map = {};
  for (const item of arr) {
    const d = item[dateField];
    if (!d) continue;
    const month = d.slice(0, 7);
    if (!map[month]) map[month] = [];
    map[month].push(item);
  }
  return map;
}


export function getFinancePeriodRanges(periodType, periodValue) {
  const { year } = periodValue;
  const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const pad = (n) => String(n).padStart(2, "0");
  const be = (y) => String((y + 543) % 100).padStart(2, "0");

  if (periodType === "year") {

    return {
      current: {
        start: `${year - 1}-04-01`,
        end: `${year}-03-31`,
        label: `ปี ${be(year)}`,
      },
      previous: {
        start: `${year - 2}-04-01`,
        end: `${year - 1}-03-31`,
        label: `ปี ${be(year - 1)}`,
      },
    };
  }

  if (periodType === "quarter") {
    const q = periodValue.quarter;
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    const lastDay = new Date(year, endMonth, 0).getDate();
    const prevLastDay = new Date(year - 1, endMonth, 0).getDate();
    const qLabel = `Q${q}`;
    return {
      current: {
        start: `${year}-${pad(startMonth)}-01`,
        end: `${year}-${pad(endMonth)}-${pad(lastDay)}`,
        label: `${qLabel}/${be(year)}`,
      },
      previous: {
        start: `${year - 1}-${pad(startMonth)}-01`,
        end: `${year - 1}-${pad(endMonth)}-${pad(prevLastDay)}`,
        label: `${qLabel}/${be(year - 1)}`,
      },
    };
  }


  const m = periodValue.month;
  const lastDay = new Date(year, m, 0).getDate();
  const prevLastDay = new Date(year - 1, m, 0).getDate();
  return {
    current: {
      start: `${year}-${pad(m)}-01`,
      end: `${year}-${pad(m)}-${pad(lastDay)}`,
      label: `${THAI_MONTHS_SHORT[m - 1]} ${be(year)}`,
    },
    previous: {
      start: `${year - 1}-${pad(m)}-01`,
      end: `${year - 1}-${pad(m)}-${pad(prevLastDay)}`,
      label: `${THAI_MONTHS_SHORT[m - 1]} ${be(year - 1)}`,
    },
  };
}


export function mergeMonthlyData(currentData, previousData, valueKey, currentYear) {
  const months = [];
  const maxMonth = currentYear ? 12 : Number(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }).split("-")[1]);

  for (let m = 1; m <= maxMonth; m++) {
    const mm = String(m).padStart(2, "0");
    const curKey = `${currentYear}-${mm}`;
    const prevKey = `${currentYear - 1}-${mm}`;
    const curItem = currentData.find((d) => d.month === curKey);
    const prevItem = previousData.find((d) => d.month === prevKey);
    months.push({
      month: mm,
      monthLabel: new Date(currentYear, m - 1, 1).toLocaleDateString("th-TH", { month: "short" }),
      current: curItem ? curItem[valueKey] : 0,
      previous: prevItem ? prevItem[valueKey] : 0,
    });
  }
  return months;
}

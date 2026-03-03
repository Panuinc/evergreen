/**
 * YTM / YTY comparison utilities
 *
 * YTM (Year-to-Month): Jan 1 → end of current month, this year vs last year
 * YTY (Year-to-Year):  Jan 1 → Dec 31, this year vs last year (month-by-month)
 */

/**
 * Get date ranges for comparison
 * @param {"ytm"|"yty"} mode
 * @param {Date} [ref] reference date (default: now)
 * @returns {{ current: { start: string, end: string, label: string }, previous: { start: string, end: string, label: string } }}
 */
export function getComparisonRanges(mode, ref = new Date()) {
  const year = ref.getFullYear();
  const month = ref.getMonth(); // 0-based

  if (mode === "ytm") {
    // YTM: Jan 1 → last day of current month
    const endDate = new Date(year, month + 1, 0); // last day of current month
    return {
      current: {
        start: `${year}-01-01`,
        end: endDate.toISOString().slice(0, 10),
        label: `ม.ค.–${endDate.toLocaleDateString("th-TH", { month: "short" })} ${String(year % 100).padStart(2, "0")}`,
      },
      previous: {
        start: `${year - 1}-01-01`,
        end: `${year - 1}-${String(month + 1).padStart(2, "0")}-${String(new Date(year - 1, month + 1, 0).getDate()).padStart(2, "0")}`,
        label: `ม.ค.–${new Date(year - 1, month, 1).toLocaleDateString("th-TH", { month: "short" })} ${String((year - 1) % 100).padStart(2, "0")}`,
      },
    };
  }

  // YTY: full year Jan 1 → Dec 31
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

/**
 * Calculate percentage change
 * @returns {number|null} percentage change, null if previous is 0
 */
export function pctChange(current, previous) {
  if (!previous || previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

/**
 * Filter an array by a date field within a range (inclusive)
 * @param {Array} arr
 * @param {string} dateField - property name containing date string
 * @param {string} start - YYYY-MM-DD
 * @param {string} end - YYYY-MM-DD
 */
export function filterByDateRange(arr, dateField, start, end) {
  return arr.filter((item) => {
    const d = item[dateField];
    if (!d) return false;
    const dateStr = d.slice(0, 10);
    return dateStr >= start && dateStr <= end;
  });
}

/**
 * Group items by month (YYYY-MM) using a date field
 * @param {Array} arr
 * @param {string} dateField
 * @returns {Object<string, Array>}
 */
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

/**
 * Build monthly comparison chart data for YTY mode
 * Maps previous year months to align with current year months
 * @param {Array<{month: string, [key]: number}>} currentData - e.g. [{month: "2026-01", value: 100}]
 * @param {Array<{month: string, [key]: number}>} previousData - e.g. [{month: "2025-01", value: 80}]
 * @param {string} valueKey - the key to extract value from
 * @param {number} currentYear
 * @returns {Array<{month: string, current: number, previous: number}>}
 */
export function mergeMonthlyData(currentData, previousData, valueKey, currentYear) {
  const months = [];
  const maxMonth = currentYear ? 12 : new Date().getMonth() + 1;

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

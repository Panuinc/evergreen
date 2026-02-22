import * as XLSX from "xlsx";

/**
 * Export data to Excel (.xlsx) with Thai language support.
 * Uses the same column config pattern as exportCsv.
 *
 * @param {string} filename - e.g. "bci-projects.xlsx"
 * @param {{ header: string, key: string, formatter?: (val, row) => string, width?: number }[]} columns
 * @param {object[]} data
 */
export function exportToExcel(filename, columns, data) {
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((c) => getCellValue(row, c.key, c.formatter))
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws["!cols"] = columns.map((c) => ({ wch: c.width || 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  XLSX.writeFile(wb, filename);
}

function getCellValue(row, key, formatter) {
  const value = key.includes(".")
    ? key.split(".").reduce((o, k) => o?.[k], row)
    : row[key];
  if (formatter) return formatter(value, row);
  if (value == null) return "";
  return value;
}

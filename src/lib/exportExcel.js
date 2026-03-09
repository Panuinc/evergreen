import * as XLSX from "xlsx";


export function exportToExcel(filename, columns, data) {
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((c) => getCellValue(row, c.key, c.formatter))
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);


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

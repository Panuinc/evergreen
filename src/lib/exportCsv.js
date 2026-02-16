export function exportToCsv(filename, columns, data) {
  const BOM = "\uFEFF";
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const rows = data.map((row) =>
    columns.map((c) => escapeCell(getCellValue(row, c.key, c.formatter))).join(",")
  );
  const csv = BOM + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getCellValue(row, key, formatter) {
  const value = key.includes(".") ? key.split(".").reduce((o, k) => o?.[k], row) : row[key];
  if (formatter) return formatter(value, row);
  if (value == null) return "";
  return String(value);
}

function escapeCell(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

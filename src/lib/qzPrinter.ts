import { getPrinterConfig } from "./printerConfig";

const printApi = "/api/warehouse/print";

async function callPrintApi(body) {
  const response = await fetch(printApi, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || "พิมพ์ไม่สำเร็จ");
  return data;
}

export async function testConnection() {
  return callPrintApi({ action: "testConnection" });
}

export async function printRfidLabels(_printerName, item, quantity) {
  const cfg = getPrinterConfig();
  return callPrintApi({ action: "print", item, quantity, config: cfg });
}

export async function printTestLabel() {
  const cfg = getPrinterConfig();
  return callPrintApi({
    action: "print",
    item: { number: "TEST-001" },
    quantity: 1,
    config: cfg,
  });
}

export async function previewLabel(item, quantity) {
  const cfg = getPrinterConfig();
  return callPrintApi({ action: "preview", item, quantity, config: cfg });
}

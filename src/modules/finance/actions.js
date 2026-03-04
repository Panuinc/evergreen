import { get, post } from "@/lib/apiClient";


export async function getTrialBalance() {
  return get("/api/finance/trialBalance");
}

export async function getGlMonthlySummary(year) {
  return get(
    `/api/finance/glEntries?start=${year}-01-01&end=${year}-12-31&summarize=monthly`,
  );
}

export async function getAgedReceivables() {
  return get("/api/finance/agedReceivables");
}

export async function getAgedPayables() {
  return get("/api/finance/agedPayables");
}

export async function getSalesInvoices(status = "Open", expand = true) {
  return get(`/api/finance/salesInvoices?status=${status}&expand=${expand}`);
}

export async function getPurchaseInvoices(status = "Open", expand = true) {
  return get(`/api/finance/purchaseInvoices?status=${status}&expand=${expand}`);
}

export async function getGlEntries(start, end) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString();
  return get(`/api/finance/glEntries${qs ? `?${qs}` : ""}`);
}

export async function getCollections(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
  ).toString();
  return get(`/api/finance/collections${query ? `?${query}` : ""}`);
}

export async function createFollowUp(data) {
  return post("/api/finance/collections", data);
}

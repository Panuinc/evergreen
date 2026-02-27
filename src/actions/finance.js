import { get } from "@/lib/apiClient";

export async function getBalanceSheet() {
  return get("/api/finance/balanceSheet");
}

export async function getIncomeStatement() {
  return get("/api/finance/incomeStatement");
}

export async function getTrialBalance() {
  return get("/api/finance/trialBalance");
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

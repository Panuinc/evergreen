import { get, post, put, del } from "@/lib/apiClient";

// ==================== Leads ====================

export async function getLeads() {
  return get("/api/sales/leads");
}

export async function createLead(data) {
  return post("/api/sales/leads", data);
}

export async function updateLead(id, data) {
  return put(`/api/sales/leads/${id}`, data);
}

export async function deleteLead(id) {
  return del(`/api/sales/leads/${id}`);
}

export async function convertLead(id) {
  return post(`/api/sales/leads/${id}`, { action: "convert" });
}

// ==================== Contacts ====================

export async function getContacts() {
  return get("/api/sales/contacts");
}

export async function createContact(data) {
  return post("/api/sales/contacts", data);
}

export async function updateContact(id, data) {
  return put(`/api/sales/contacts/${id}`, data);
}

export async function deleteContact(id) {
  return del(`/api/sales/contacts/${id}`);
}

// ==================== Accounts ====================

export async function getAccounts() {
  return get("/api/sales/accounts");
}

export async function createAccount(data) {
  return post("/api/sales/accounts", data);
}

export async function updateAccount(id, data) {
  return put(`/api/sales/accounts/${id}`, data);
}

export async function deleteAccount(id) {
  return del(`/api/sales/accounts/${id}`);
}

// ==================== Opportunities ====================

export async function getOpportunities() {
  return get("/api/sales/opportunities");
}

export async function createOpportunity(data) {
  return post("/api/sales/opportunities", data);
}

export async function updateOpportunity(id, data) {
  return put(`/api/sales/opportunities/${id}`, data);
}

export async function deleteOpportunity(id) {
  return del(`/api/sales/opportunities/${id}`);
}

// ==================== Quotations ====================

export async function getQuotationsList() {
  return get("/api/sales/quotations");
}

export async function getQuotation(id) {
  return get(`/api/sales/quotations/${id}`);
}

export async function createQuotation(data) {
  return post("/api/sales/quotations", data);
}

export async function updateQuotation(id, data) {
  return put(`/api/sales/quotations/${id}`, data);
}

export async function deleteQuotation(id) {
  return del(`/api/sales/quotations/${id}`);
}

export async function quotationAction(id, action, note) {
  return post(`/api/sales/quotations/${id}`, { action, note });
}

// ==================== Orders ====================

export async function getOrders() {
  return get("/api/sales/orders");
}

export async function createOrder(data) {
  return post("/api/sales/orders", data);
}

export async function updateOrder(id, data) {
  return put(`/api/sales/orders/${id}`, data);
}

export async function deleteOrder(id) {
  return del(`/api/sales/orders/${id}`);
}

// ==================== Activities ====================

export async function getActivities(params) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  return get(`/api/sales/activities${query}`);
}

export async function createActivity(data) {
  return post("/api/sales/activities", data);
}

export async function updateActivity(id, data) {
  return put(`/api/sales/activities/${id}`, data);
}

export async function deleteActivity(id) {
  return del(`/api/sales/activities/${id}`);
}

// ==================== Dashboard ====================

export async function getSalesDashboard() {
  return get("/api/sales/dashboard");
}

import { get, post, put } from "@/lib/apiClient";

// Stock Items / Price List
export async function getStockItems() {
  return get("/api/marketing/omnichannel/stockItems");
}

export async function saveStockItemPrices(items) {
  return post("/api/marketing/omnichannel/stockItems", { items });
}

// Quotations
export async function getQuotations(statusFilter) {
  const url =
    statusFilter === "all"
      ? "/api/marketing/omnichannel/quotations"
      : `/api/marketing/omnichannel/quotations?status=${statusFilter}`;
  return get(url);
}

export async function getQuotation(id) {
  return get(`/api/marketing/omnichannel/quotations/${id}`);
}

export async function updateQuotation(id, data) {
  return put(`/api/marketing/omnichannel/quotations/${id}`, data);
}

export async function quotationAction(id, action, note) {
  const res = await fetch(`/api/marketing/omnichannel/quotations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, note }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error);
  }
  return res.json();
}

// Conversation Detail - Quotations
export async function getQuotationsByConversation(conversationId) {
  return get(`/api/marketing/omnichannel/quotations?omConversationId=${conversationId}`);
}

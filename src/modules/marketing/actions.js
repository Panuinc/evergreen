import { get, post, put, del } from "@/lib/apiClient";



export async function generateMarketingImage(imageFile, prompt, size = "1024x1024") {
  const form = new FormData();
  form.append("image", imageFile);
  form.append("prompt", prompt);
  form.append("size", size);

  const res = await fetch("/api/marketing/ai/generate-image", {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Image generation failed");
  return data;
}

export async function getImageGenerationHistory(limit = 20) {
  return get(`/api/marketing/ai/generate-image?limit=${limit}`);
}



export async function getConversations(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/marketing/omnichannel/conversations${qs ? `?${qs}` : ""}`);
}

export async function getConversation(id) {
  return get(`/api/marketing/omnichannel/conversations/${id}`);
}

export async function updateConversation(id, data) {
  return put(`/api/marketing/omnichannel/conversations/${id}`, data);
}

export async function deleteConversation(id) {
  return del(`/api/marketing/omnichannel/conversations/${id}`);
}



export async function getMessages(conversationId) {
  return get(`/api/marketing/omnichannel/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId, content) {
  return post("/api/marketing/omnichannel/send", { conversationId, content });
}



export async function suggestReply(conversationId) {
  return post("/api/marketing/omnichannel/ai/suggest", { conversationId });
}

export async function getAiSettings() {
  return get("/api/marketing/omnichannel/ai/settings");
}

export async function updateAiSettings(data) {
  return put("/api/marketing/omnichannel/ai/settings", data);
}



export async function getMarketingAnalytics(refresh = false, period = "all", startDate, endDate) {
  const params = new URLSearchParams();
  if (refresh) params.set("refresh", "1");
  if (startDate && endDate) {
    params.set("startDate", startDate);
    params.set("endDate", endDate);
  } else if (period && period !== "all") {
    params.set("period", period);
  }
  const qs = params.toString();
  return get(`/api/marketing/analytics${qs ? `?${qs}` : ""}`);
}



export async function getSalesOrders() {
  return get("/api/marketing/salesOrders");
}

export async function getSalesOrder(no) {
  return get(`/api/marketing/salesOrders/${encodeURIComponent(no)}`);
}



export async function getStockItems() {
  return get("/api/marketing/omnichannel/stockItems");
}

export async function saveStockItemPrices(items) {
  return post("/api/marketing/omnichannel/stockItems", { items });
}



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

export async function getQuotationsByConversation(conversationId) {
  return get(`/api/marketing/omnichannel/quotations?conversationId=${conversationId}`);
}

import { get, post, put, del } from "@/lib/apiClient";

// ==================== Conversations ====================

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

// ==================== Messages ====================

export async function getMessages(conversationId) {
  return get(`/api/marketing/omnichannel/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId, content) {
  return post("/api/marketing/omnichannel/send", { conversationId, content });
}

// ==================== AI Agent ====================

export async function suggestReply(conversationId) {
  return post("/api/marketing/omnichannel/ai/suggest", { conversationId });
}

export async function getAiSettings() {
  return get("/api/marketing/omnichannel/ai/settings");
}

export async function updateAiSettings(data) {
  return put("/api/marketing/omnichannel/ai/settings", data);
}

// ==================== Analytics ====================

export async function getMarketingAnalytics(refresh = false, period = "all") {
  const params = new URLSearchParams();
  if (refresh) params.set("refresh", "1");
  if (period && period !== "all") params.set("period", period);
  const qs = params.toString();
  return get(`/api/marketing/analytics${qs ? `?${qs}` : ""}`);
}

// ==================== Sales Orders ====================

export async function getSalesOrders() {
  return get("/api/marketing/salesOrders");
}

export async function getSalesOrder(no) {
  return get(`/api/marketing/salesOrders/${encodeURIComponent(no)}`);
}

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

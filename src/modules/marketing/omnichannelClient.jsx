"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { get, post, put, del } from "@/lib/apiClient";
import OmnichannelView from "@/modules/marketing/components/omnichannelView";

const pollInterval = 3000;

export default function OmnichannelClient() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestedText, setSuggestedText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const selectedConvRef = useRef(null);
  const realtimeConnected = useRef(false);
  const pollTimerRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (channelFilter !== "all") params.channel = channelFilter;
      if (searchQuery) params.search = searchQuery;
      const qs = new URLSearchParams(params).toString();
      const data = await get(`/api/marketing/omnichannel/conversations${qs ? `?${qs}` : ""}`);
      setConversations(data);
    } catch (error) {
      toast.error("โหลดการสนทนาล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter, searchQuery]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const selectConversation = useCallback(async (conversation) => {
    setSelectedConversation(conversation);
    if (!conversation) {
      setMessages([]);
      return;
    }

    try {
      setMessagesLoading(true);
      const data = await get(`/api/marketing/omnichannel/conversations/${conversation.omConversationId}/messages`);
      setMessages(data);

      if (conversation.omConversationUnreadCount > 0) {
        await put(`/api/marketing/omnichannel/conversations/${conversation.omConversationId}`, {
          omConversationUnreadCount: 0,
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.omConversationId === conversation.omConversationId
              ? { ...c, omConversationUnreadCount: 0 }
              : c
          )
        );
      }
    } catch (error) {
      toast.error("โหลดข้อความล้มเหลว");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      if (!selectedConversation || !content.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        omMessageId: tempId,
        omMessageConversationId: selectedConversation.omConversationId,
        omMessageSenderType: "agent",
        omMessageContent: content,
        omMessageType: "text",
        omMessageCreatedAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        setSending(true);
        setSuggestedText("");
        const savedMsg = await post("/api/marketing/omnichannel/send", { conversationId: selectedConversation.omConversationId, content });

        setMessages((prev) =>
          prev.map((m) => (m.omMessageId === tempId ? savedMsg : m))
        );
      } catch (error) {
        setMessages((prev) => prev.filter((m) => m.omMessageId !== tempId));
        toast.error(error.message || "ส่งข้อความล้มเหลว");
      } finally {
        setSending(false);
      }
    },
    [selectedConversation]
  );

  const logNote = useCallback(
    async (content) => {
      if (!selectedConversation || !content.trim()) return;
      try {
        const savedMsg = await post("/api/marketing/omnichannel/logNote", { conversationId: selectedConversation.omConversationId, content });
        setMessages((prev) => [...prev, savedMsg]);
        toast.success("บันทึกข้อความเรียบร้อย");
      } catch (error) {
        toast.error(error.message || "บันทึกข้อความล้มเหลว");
      }
    },
    [selectedConversation]
  );

  const updateStatus = useCallback(
    async (conversationId, status) => {
      try {
        const updated = await put(`/api/marketing/omnichannel/conversations/${conversationId}`, {
          omConversationStatus: status,
        });
        setConversations((prev) =>
          prev.map((c) => (c.omConversationId === conversationId ? updated : c))
        );
        if (selectedConversation?.omConversationId === conversationId) {
          setSelectedConversation(updated);
        }
        toast.success(`อัปเดตสถานะการสนทนาเป็น ${status} สำเร็จ`);
      } catch (error) {
        toast.error("อัปเดตสถานะล้มเหลว");
      }
    },
    [selectedConversation]
  );

  const updateContact = useCallback(
    async (contactId, updates) => {
      try {
        const { error } = await supabase
          .from("omContact")
          .update(updates)
          .eq("omContactId", contactId);
        if (error) throw error;

        if (selectedConversation) {
          setSelectedConversation((prev) => ({
            ...prev,
            omContact: { ...prev.omContact, ...updates },
          }));
        }
        toast.success("อัปเดตผู้ติดต่อสำเร็จ");
      } catch (error) {
        toast.error("อัปเดตผู้ติดต่อล้มเหลว");
      }
    },
    [selectedConversation]
  );

  const deleteConversation = useCallback(
    async (conversationId) => {
      try {
        await del(`/api/marketing/omnichannel/conversations/${conversationId}`);
        setConversations((prev) =>
          prev.filter((c) => c.omConversationId !== conversationId)
        );
        if (selectedConversation?.omConversationId === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
        toast.success("ลบการสนทนาแล้ว");
      } catch (error) {
        toast.error("ลบการสนทนาล้มเหลว");
      }
    },
    [selectedConversation]
  );

  const toggleAiAutoReply = useCallback(
    async (conversationId, enabled) => {
      try {
        const updated = await put(`/api/marketing/omnichannel/conversations/${conversationId}`, {
          omConversationAiAutoReply: enabled,
        });
        setConversations((prev) =>
          prev.map((c) => (c.omConversationId === conversationId ? updated : c))
        );
        if (selectedConversation?.omConversationId === conversationId) {
          setSelectedConversation(updated);
        }
        toast.success(enabled ? "เปิด AI Auto-Reply แล้ว" : "ปิด AI Auto-Reply แล้ว");
      } catch (error) {
        toast.error("เปลี่ยนสถานะ AI Auto-Reply ล้มเหลว");
      }
    },
    [selectedConversation]
  );

  const suggestReply = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      setSuggestLoading(true);
      setSuggestedText("");
      const result = await post("/api/marketing/omnichannel/ai/suggest", { conversationId: selectedConversation.omConversationId });
      setSuggestedText(result.suggestion);
    } catch (error) {
      toast.error("AI ไม่สามารถแนะนำคำตอบได้");
    } finally {
      setSuggestLoading(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  /* Polling */
  useEffect(() => {
    const poll = async () => {
      const currentConv = selectedConvRef.current;

      if (currentConv) {
        try {
          const freshMessages = await get(`/api/marketing/omnichannel/conversations/${currentConv.omConversationId}/messages`);
          setMessages((prev) => {
            if (freshMessages.length !== prev.length ||
                (freshMessages.length > 0 && prev.length > 0 &&
                 freshMessages[freshMessages.length - 1]?.omMessageId !== prev[prev.length - 1]?.omMessageId &&
                 !prev[prev.length - 1]?.omMessageId?.startsWith?.("temp-"))) {
              const tempMsgs = prev.filter((m) => m.omMessageId?.startsWith?.("temp-"));
              return [...freshMessages, ...tempMsgs];
            }
            return prev;
          });
        } catch {}
      }

      try {
        const params = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (channelFilter !== "all") params.channel = channelFilter;
        if (searchQuery) params.search = searchQuery;
        const pollQs = new URLSearchParams(params).toString();
        const freshConvs = await get(`/api/marketing/omnichannel/conversations${pollQs ? `?${pollQs}` : ""}`);
        setConversations(freshConvs);
      } catch {}
    };

    pollTimerRef.current = setInterval(poll, pollInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [statusFilter, channelFilter, searchQuery]);

  /* Realtime */
  useEffect(() => {
    const channelName = `omnichannel-rt-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "omMessage" },
        (payload) => {
          const newMessage = payload.new;
          const currentConv = selectedConvRef.current;

          if (
            currentConv &&
            newMessage.omMessageConversationId === currentConv.omConversationId
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.omMessageId === newMessage.omMessageId)) return prev;
              if (newMessage.omMessageSenderType === "agent") {
                const tempIdx = prev.findIndex(
                  (m) => m.omMessageId?.startsWith?.("temp-") && m.omMessageContent === newMessage.omMessageContent
                );
                if (tempIdx !== -1) {
                  const updated = [...prev];
                  updated[tempIdx] = newMessage;
                  return updated;
                }
              }
              return [...prev, newMessage];
            });
          }

          setConversations((prev) =>
            prev.map((c) => {
              if (c.omConversationId === newMessage.omMessageConversationId) {
                return {
                  ...c,
                  omConversationLastMessageAt: newMessage.omMessageCreatedAt,
                  omConversationLastMessagePreview: newMessage.omMessageContent?.slice(0, 100),
                  omConversationUnreadCount:
                    currentConv?.omConversationId === c.omConversationId
                      ? 0
                      : (c.omConversationUnreadCount || 0) + (newMessage.omMessageSenderType === "customer" ? 1 : 0),
                };
              }
              return c;
            })
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "omConversation" },
        (payload) => {
          const updated = payload.new;
          const currentConv = selectedConvRef.current;

          setConversations((prev) =>
            prev.map((c) =>
              c.omConversationId === updated.omConversationId
                ? { ...c, ...updated }
                : c
            )
          );
          if (currentConv?.omConversationId === updated.omConversationId) {
            setSelectedConversation((prev) => ({ ...prev, ...updated }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "omConversation" },
        () => {
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Status:", status);
        realtimeConnected.current = status === "SUBSCRIBED";
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations]);

  return (
    <OmnichannelView
      conversations={conversations}
      selectedConversation={selectedConversation}
      messages={messages}
      loading={loading}
      messagesLoading={messagesLoading}
      sending={sending}
      statusFilter={statusFilter}
      channelFilter={channelFilter}
      searchQuery={searchQuery}
      setStatusFilter={setStatusFilter}
      setChannelFilter={setChannelFilter}
      setSearchQuery={setSearchQuery}
      selectConversation={selectConversation}
      sendMessage={sendMessage}
      updateStatus={updateStatus}
      updateContact={updateContact}
      deleteConversation={deleteConversation}
      suggestLoading={suggestLoading}
      suggestedText={suggestedText}
      toggleAiAutoReply={toggleAiAutoReply}
      suggestReply={suggestReply}
      logNote={logNote}
    />
  );
}

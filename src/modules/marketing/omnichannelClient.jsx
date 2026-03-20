"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { get, post, put, del } from "@/lib/apiClient";
import OmnichannelView from "@/modules/marketing/components/omnichannelView";

const pollInterval = 3000;
const fetcher = (url) => get(url);

export default function OmnichannelClient() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestedText, setSuggestedText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const selectedConvRef = useRef(null);
  const realtimeConnected = useRef(false);
  // conversations is SWR-managed — use mutateConversations to update

  const convParams = new URLSearchParams();
  if (statusFilter !== "all") convParams.set("status", statusFilter);
  if (channelFilter !== "all") convParams.set("channel", channelFilter);
  if (searchQuery) convParams.set("search", searchQuery);
  const qs = convParams.toString();
  const convUrl = `/api/marketing/omnichannel/conversations${qs ? `?${qs}` : ""}`;

  const { data: conversations = [], isLoading: loading, mutate: mutateConversations } = useSWR(
    convUrl,
    fetcher,
    { refreshInterval: pollInterval },
  );

  const loadConversations = mutateConversations;

  const selectConversation = useCallback(async (conversation) => {
    setSelectedConversation(conversation);
    if (!conversation) {
      setMessages([]);
      return;
    }

    try {
      setMessagesLoading(true);
      const data = await get(`/api/marketing/omnichannel/conversations/${conversation.mktConversationId}/messages`);
      setMessages(data);

      if (conversation.mktConversationUnreadCount > 0) {
        await put(`/api/marketing/omnichannel/conversations/${conversation.mktConversationId}`, {
          mktConversationUnreadCount: 0,
        });
        mutateConversations(
          (prev = []) => prev.map((c) =>
            c.mktConversationId === conversation.mktConversationId ? { ...c, mktConversationUnreadCount: 0 } : c
          ),
          { revalidate: false },
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
        mktMessageId: tempId,
        mktMessageConversationId: selectedConversation.mktConversationId,
        mktMessageSenderType: "agent",
        mktMessageContent: content,
        mktMessageType: "text",
        mktMessageCreatedAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        setSending(true);
        setSuggestedText("");
        const savedMsg = await post("/api/marketing/omnichannel/send", { conversationId: selectedConversation.mktConversationId, content });

        setMessages((prev) =>
          prev.map((m) => (m.mktMessageId === tempId ? savedMsg : m))
        );
      } catch (error) {
        setMessages((prev) => prev.filter((m) => m.mktMessageId !== tempId));
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
        const savedMsg = await post("/api/marketing/omnichannel/logNote", { conversationId: selectedConversation.mktConversationId, content });
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
          mktConversationStatus: status,
        });
        mutateConversations(
          (prev = []) => prev.map((c) => (c.mktConversationId === conversationId ? updated : c)),
          { revalidate: false },
        );
        if (selectedConversation?.mktConversationId === conversationId) {
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
        await put(`/api/marketing/omnichannel/contacts/${contactId}`, updates);

        if (selectedConversation) {
          setSelectedConversation((prev) => ({
            ...prev,
            mktContact: { ...prev.mktContact, ...updates },
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
        mutateConversations(
          (prev = []) => prev.filter((c) => c.mktConversationId !== conversationId),
          { revalidate: false },
        );
        if (selectedConversation?.mktConversationId === conversationId) {
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
          mktConversationAiAutoReply: enabled,
        });
        mutateConversations(
          (prev = []) => prev.map((c) => (c.mktConversationId === conversationId ? updated : c)),
          { revalidate: false },
        );
        if (selectedConversation?.mktConversationId === conversationId) {
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
      const result = await post("/api/marketing/omnichannel/ai/suggest", { conversationId: selectedConversation.mktConversationId });
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

  /* Message polling */
  useEffect(() => {
    const poll = async () => {
      const currentConv = selectedConvRef.current;
      if (!currentConv) return;
      try {
        const freshMessages = await get(`/api/marketing/omnichannel/conversations/${currentConv.mktConversationId}/messages`);
        setMessages((prev) => {
          if (freshMessages.length !== prev.length ||
              (freshMessages.length > 0 && prev.length > 0 &&
               freshMessages[freshMessages.length - 1]?.mktMessageId !== prev[prev.length - 1]?.mktMessageId &&
               !prev[prev.length - 1]?.mktMessageId?.startsWith?.("temp-"))) {
            const tempMsgs = prev.filter((m) => m.mktMessageId?.startsWith?.("temp-"));
            return [...freshMessages, ...tempMsgs];
          }
          return prev;
        });
      } catch {}
    };

    const timer = setInterval(poll, pollInterval);
    return () => clearInterval(timer);
  }, []);

  /* Realtime */
  useEffect(() => {
    const channelName = `omnichannel-rt-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mktMessage" },
        (payload) => {
          const newMessage = payload.new;
          const currentConv = selectedConvRef.current;

          if (
            currentConv &&
            newMessage.mktMessageConversationId === currentConv.mktConversationId
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.mktMessageId === newMessage.mktMessageId)) return prev;
              if (newMessage.mktMessageSenderType === "agent") {
                const tempIdx = prev.findIndex(
                  (m) => m.mktMessageId?.startsWith?.("temp-") && m.mktMessageContent === newMessage.mktMessageContent
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

          mutateConversations(
            (prev = []) => prev.map((c) => {
              if (c.mktConversationId === newMessage.mktMessageConversationId) {
                return {
                  ...c,
                  mktConversationLastMessageAt: newMessage.mktMessageCreatedAt,
                  mktConversationLastMessagePreview: newMessage.mktMessageContent?.slice(0, 100),
                  mktConversationUnreadCount:
                    currentConv?.mktConversationId === c.mktConversationId
                      ? 0
                      : (c.mktConversationUnreadCount || 0) + (newMessage.mktMessageSenderType === "customer" ? 1 : 0),
                };
              }
              return c;
            }),
            { revalidate: false },
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mktConversation" },
        (payload) => {
          const updated = payload.new;
          const currentConv = selectedConvRef.current;

          mutateConversations(
            (prev = []) => prev.map((c) =>
              c.mktConversationId === updated.mktConversationId ? { ...c, ...updated } : c
            ),
            { revalidate: false },
          );
          if (currentConv?.mktConversationId === updated.mktConversationId) {
            setSelectedConversation((prev) => ({ ...prev, ...updated }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mktConversation" },
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
  }, [mutateConversations]);

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

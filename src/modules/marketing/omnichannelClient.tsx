"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { supabase } from "@/lib/supabase/client";
import { get, post, put, del } from "@/lib/apiClient";
import OmnichannelView from "@/modules/marketing/components/omnichannelView";
import type { MktConversation, MktContact, MktMessage } from "@/modules/marketing/types";

const pollInterval = 3000;
const fetcher = (url: string) => get<MktConversation[]>(url);

export default function OmnichannelClient() {
  const [selectedConversation, setSelectedConversation] = useState<MktConversation | null>(null);
  const [messages, setMessages] = useState<MktMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestedText, setSuggestedText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const selectedConvRef = useRef<MktConversation | null>(null);
  const realtimeConnected = useRef(false);
  // conversations is SWR-managed — use mutateConversations to update

  const convParams = new URLSearchParams();
  if (statusFilter !== "all") convParams.set("status", statusFilter);
  if (channelFilter !== "all") convParams.set("channel", channelFilter);
  if (searchQuery) convParams.set("search", searchQuery);
  const qs = convParams.toString();
  const convUrl = `/api/marketing/omnichannel/conversations${qs ? `?${qs}` : ""}`;

  const { data: conversations = [], isLoading: loading, mutate: mutateConversations } = useSWR<MktConversation[]>(
    convUrl,
    fetcher,
    { refreshInterval: pollInterval },
  );

  const loadConversations = mutateConversations;

  const selectConversation = useCallback(async (conversation: MktConversation | null) => {
    setSelectedConversation(conversation);
    if (!conversation) {
      setMessages([]);
      return;
    }

    try {
      setMessagesLoading(true);
      const data = await get<MktMessage[]>(`/api/marketing/omnichannel/conversations/${conversation.mktConversationId}/messages`);
      setMessages(data ?? []);

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
  }, [mutateConversations]);

  const sendMessage = useCallback(
    async (content) => {
      if (!selectedConversation || !content.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: MktMessage = {
        mktMessageId: tempId,
        mktMessageConversationId: selectedConversation.mktConversationId,
        mktMessageSenderType: "agent",
        mktMessageContent: content,
        mktMessageType: "text",
        mktMessageImageUrl: null,
        mktMessageIsAi: false,
        mktMessageOcrData: null,
        mktMessageCreatedAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        setSending(true);
        setSuggestedText("");
        const savedMsg = await post<MktMessage>("/api/marketing/omnichannel/send", { conversationId: selectedConversation.mktConversationId, content });

        setMessages((prev) =>
          prev.map((m) => (m.mktMessageId === tempId ? (savedMsg as MktMessage) : m))
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
        const savedMsg = await post<MktMessage>("/api/marketing/omnichannel/logNote", { conversationId: selectedConversation.mktConversationId, content });
        setMessages((prev) => [...prev, savedMsg as MktMessage]);
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
        const updated = await put<MktConversation>(`/api/marketing/omnichannel/conversations/${conversationId}`, {
          mktConversationStatus: status,
        });
        mutateConversations(
          (prev = []) => prev.map((c) => (c.mktConversationId === conversationId ? (updated as MktConversation) : c)),
          { revalidate: false },
        );
        if (selectedConversation?.mktConversationId === conversationId) {
          setSelectedConversation(updated as MktConversation);
        }
        toast.success(`อัปเดตสถานะการสนทนาเป็น ${status} สำเร็จ`);
      } catch (error) {
        toast.error("อัปเดตสถานะล้มเหลว");
      }
    },
    [selectedConversation, mutateConversations]
  );

  const updateContact = useCallback(
    async (contactId: string, updates: Partial<MktContact>) => {
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
    [selectedConversation, mutateConversations]
  );

  const toggleAiAutoReply = useCallback(
    async (conversationId, enabled) => {
      try {
        const updated = await put<MktConversation>(`/api/marketing/omnichannel/conversations/${conversationId}`, {
          mktConversationAiAutoReply: enabled,
        });
        mutateConversations(
          (prev = []) => prev.map((c) => (c.mktConversationId === conversationId ? (updated as MktConversation) : c)),
          { revalidate: false },
        );
        if (selectedConversation?.mktConversationId === conversationId) {
          setSelectedConversation(updated as MktConversation);
        }
        toast.success(enabled ? "เปิด AI Auto-Reply แล้ว" : "ปิด AI Auto-Reply แล้ว");
      } catch (error) {
        toast.error("เปลี่ยนสถานะ AI Auto-Reply ล้มเหลว");
      }
    },
    [selectedConversation, mutateConversations]
  );

  const suggestReply = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      setSuggestLoading(true);
      setSuggestedText("");
      const result = await post<{ suggestion: string }>("/api/marketing/omnichannel/ai/suggest", { conversationId: selectedConversation.mktConversationId });
      setSuggestedText(result?.suggestion ?? "");
    } catch (error) {
      toast.error("AI ไม่สามารถแนะนำคำตอบได้");
    } finally {
      setSuggestLoading(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  /* Message updates handled by Realtime subscription below */

  /* Realtime */
  useEffect(() => {
    const channelName = `omnichannel-rt-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mktMessage" },
        (payload) => {
          const newMessage = payload.new as MktMessage;
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
  }, [mutateConversations, loadConversations]);

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

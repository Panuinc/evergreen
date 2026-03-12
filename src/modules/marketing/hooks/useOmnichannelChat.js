"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageAction,
  logNote as logNoteAction,
  updateConversation,
  deleteConversation as deleteConversationAction,
  suggestReply as suggestReplyAction,
} from "@/modules/marketing/actions";

const POLL_INTERVAL = 3000;

export function useOmnichannelChat() {
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
      const data = await getConversations(params);
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
      const data = await getMessages(conversation.omConversationId);
      setMessages(data);


      if (conversation.omConversationUnreadCount > 0) {
        await updateConversation(conversation.omConversationId, {
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


  const handleSendMessage = useCallback(
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
        const savedMsg = await sendMessageAction(selectedConversation.omConversationId, content);

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


  const handleLogNote = useCallback(
    async (content) => {
      if (!selectedConversation || !content.trim()) return;
      try {
        const savedMsg = await logNoteAction(selectedConversation.omConversationId, content);
        setMessages((prev) => [...prev, savedMsg]);
        toast.success("บันทึกข้อความเรียบร้อย");
      } catch (error) {
        toast.error(error.message || "บันทึกข้อความล้มเหลว");
      }
    },
    [selectedConversation]
  );

  const handleUpdateStatus = useCallback(
    async (conversationId, status) => {
      try {
        const updated = await updateConversation(conversationId, {
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


  const handleUpdateContact = useCallback(
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


  const handleDeleteConversation = useCallback(
    async (conversationId) => {
      try {
        await deleteConversationAction(conversationId);
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


  const handleToggleAiAutoReply = useCallback(
    async (conversationId, enabled) => {
      try {
        const updated = await updateConversation(conversationId, {
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


  const handleSuggestReply = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      setSuggestLoading(true);
      setSuggestedText("");
      const result = await suggestReplyAction(selectedConversation.omConversationId);
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


  useEffect(() => {
    const poll = async () => {
      const currentConv = selectedConvRef.current;


      if (currentConv) {
        try {
          const freshMessages = await getMessages(currentConv.omConversationId);
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
        } catch {

        }
      }


      try {
        const params = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (channelFilter !== "all") params.channel = channelFilter;
        if (searchQuery) params.search = searchQuery;
        const freshConvs = await getConversations(params);
        setConversations(freshConvs);
      } catch {

      }
    };

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [statusFilter, channelFilter, searchQuery]);


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

  return {
    conversations,
    selectedConversation,
    messages,
    loading,
    messagesLoading,
    sending,
    statusFilter,
    channelFilter,
    searchQuery,
    setStatusFilter,
    setChannelFilter,
    setSearchQuery,
    selectConversation,
    sendMessage: handleSendMessage,
    logNote: handleLogNote,
    updateStatus: handleUpdateStatus,
    updateContact: handleUpdateContact,
    deleteConversation: handleDeleteConversation,
    loadConversations,
    suggestLoading,
    suggestedText,
    toggleAiAutoReply: handleToggleAiAutoReply,
    suggestReply: handleSuggestReply,
  };
}

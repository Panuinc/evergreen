"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageAction,
  updateConversation,
  deleteConversation as deleteConversationAction,
  suggestReply as suggestReplyAction,
} from "@/actions/marketing";

const POLL_INTERVAL = 3000; // 3 seconds

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

  // Load conversations
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
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter, searchQuery]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Select conversation and load messages
  const selectConversation = useCallback(async (conversation) => {
    setSelectedConversation(conversation);
    if (!conversation) {
      setMessages([]);
      return;
    }

    try {
      setMessagesLoading(true);
      const data = await getMessages(conversation.conversationId);
      setMessages(data);

      // Mark as read
      if (conversation.conversationUnreadCount > 0) {
        await updateConversation(conversation.conversationId, {
          conversationUnreadCount: 0,
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === conversation.conversationId
              ? { ...c, conversationUnreadCount: 0 }
              : c
          )
        );
      }
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Send message with optimistic update
  const handleSendMessage = useCallback(
    async (content) => {
      if (!selectedConversation || !content.trim()) return;

      // Optimistic: add message to UI immediately
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        messageId: tempId,
        messageConversationId: selectedConversation.conversationId,
        messageSenderType: "agent",
        messageContent: content,
        messageType: "text",
        messageCreatedAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        setSending(true);
        setSuggestedText("");
        const savedMsg = await sendMessageAction(selectedConversation.conversationId, content);
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((m) => (m.messageId === tempId ? savedMsg : m))
        );
      } catch (error) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.messageId !== tempId));
        toast.error(error.message || "Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [selectedConversation]
  );

  // Update conversation status
  const handleUpdateStatus = useCallback(
    async (conversationId, status) => {
      try {
        const updated = await updateConversation(conversationId, {
          conversationStatus: status,
        });
        setConversations((prev) =>
          prev.map((c) => (c.conversationId === conversationId ? updated : c))
        );
        if (selectedConversation?.conversationId === conversationId) {
          setSelectedConversation(updated);
        }
        toast.success(`Conversation ${status}`);
      } catch (error) {
        toast.error("Failed to update status");
      }
    },
    [selectedConversation]
  );

  // Update contact tags/notes via conversation's contact
  const handleUpdateContact = useCallback(
    async (contactId, updates) => {
      try {
        const { error } = await supabase
          .from("omContacts")
          .update(updates)
          .eq("contactId", contactId);
        if (error) throw error;

        // Refresh selected conversation
        if (selectedConversation) {
          setSelectedConversation((prev) => ({
            ...prev,
            omContacts: { ...prev.omContacts, ...updates },
          }));
        }
        toast.success("Contact updated");
      } catch (error) {
        toast.error("Failed to update contact");
      }
    },
    [selectedConversation]
  );

  // Delete conversation
  const handleDeleteConversation = useCallback(
    async (conversationId) => {
      try {
        await deleteConversationAction(conversationId);
        setConversations((prev) =>
          prev.filter((c) => c.conversationId !== conversationId)
        );
        if (selectedConversation?.conversationId === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
        toast.success("ลบการสนทนาแล้ว");
      } catch (error) {
        toast.error("Failed to delete conversation");
      }
    },
    [selectedConversation]
  );

  // Toggle AI auto-reply for a conversation
  const handleToggleAiAutoReply = useCallback(
    async (conversationId, enabled) => {
      try {
        const updated = await updateConversation(conversationId, {
          conversationAiAutoReply: enabled,
        });
        setConversations((prev) =>
          prev.map((c) => (c.conversationId === conversationId ? updated : c))
        );
        if (selectedConversation?.conversationId === conversationId) {
          setSelectedConversation(updated);
        }
        toast.success(enabled ? "เปิด AI Auto-Reply แล้ว" : "ปิด AI Auto-Reply แล้ว");
      } catch (error) {
        toast.error("Failed to toggle AI auto-reply");
      }
    },
    [selectedConversation]
  );

  // Request AI suggestion
  const handleSuggestReply = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      setSuggestLoading(true);
      setSuggestedText("");
      const result = await suggestReplyAction(selectedConversation.conversationId);
      setSuggestedText(result.suggestion);
    } catch (error) {
      toast.error("AI ไม่สามารถแนะนำคำตอบได้");
    } finally {
      setSuggestLoading(false);
    }
  }, [selectedConversation]);

  // Keep ref in sync with state
  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  // Polling fallback for messages + conversations
  useEffect(() => {
    const poll = async () => {
      const currentConv = selectedConvRef.current;

      // Poll messages for selected conversation
      if (currentConv) {
        try {
          const freshMessages = await getMessages(currentConv.conversationId);
          setMessages((prev) => {
            // Only update if there are new messages
            if (freshMessages.length !== prev.length ||
                (freshMessages.length > 0 && prev.length > 0 &&
                 freshMessages[freshMessages.length - 1]?.messageId !== prev[prev.length - 1]?.messageId &&
                 !prev[prev.length - 1]?.messageId?.startsWith?.("temp-"))) {
              // Preserve any optimistic temp messages
              const tempMsgs = prev.filter((m) => m.messageId?.startsWith?.("temp-"));
              return [...freshMessages, ...tempMsgs];
            }
            return prev;
          });
        } catch {
          // Silently ignore polling errors
        }
      }

      // Poll conversations list
      try {
        const params = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (channelFilter !== "all") params.channel = channelFilter;
        if (searchQuery) params.search = searchQuery;
        const freshConvs = await getConversations(params);
        setConversations(freshConvs);
      } catch {
        // Silently ignore
      }
    };

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [statusFilter, channelFilter, searchQuery]);

  // Supabase Realtime subscriptions (bonus: instant updates when it works)
  useEffect(() => {
    const channelName = `omnichannel-rt-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "omMessages" },
        (payload) => {
          const newMessage = payload.new;
          const currentConv = selectedConvRef.current;

          if (
            currentConv &&
            newMessage.messageConversationId === currentConv.conversationId
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.messageId === newMessage.messageId)) return prev;
              if (newMessage.messageSenderType === "agent") {
                const tempIdx = prev.findIndex(
                  (m) => m.messageId?.startsWith?.("temp-") && m.messageContent === newMessage.messageContent
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
              if (c.conversationId === newMessage.messageConversationId) {
                return {
                  ...c,
                  conversationLastMessageAt: newMessage.messageCreatedAt,
                  conversationLastMessagePreview: newMessage.messageContent?.slice(0, 100),
                  conversationUnreadCount:
                    currentConv?.conversationId === c.conversationId
                      ? 0
                      : (c.conversationUnreadCount || 0) + (newMessage.messageSenderType === "customer" ? 1 : 0),
                };
              }
              return c;
            })
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "omConversations" },
        (payload) => {
          const updated = payload.new;
          const currentConv = selectedConvRef.current;

          setConversations((prev) =>
            prev.map((c) =>
              c.conversationId === updated.conversationId
                ? { ...c, ...updated }
                : c
            )
          );
          if (currentConv?.conversationId === updated.conversationId) {
            setSelectedConversation((prev) => ({ ...prev, ...updated }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "omConversations" },
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

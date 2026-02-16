"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageAction,
  updateConversation,
} from "@/actions/marketing";

export function useOmnichannelChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const channelRef = useRef(null);

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

  // Send message
  const handleSendMessage = useCallback(
    async (content) => {
      if (!selectedConversation || !content.trim()) return;
      try {
        setSending(true);
        await sendMessageAction(selectedConversation.conversationId, content);
      } catch (error) {
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

  // Supabase Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("omnichannel-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "omMessages" },
        (payload) => {
          const newMessage = payload.new;

          // If this message belongs to selected conversation, append it
          if (
            selectedConversation &&
            newMessage.messageConversationId === selectedConversation.conversationId
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.messageId === newMessage.messageId)) return prev;
              return [...prev, newMessage];
            });
          }

          // Update conversation list
          setConversations((prev) =>
            prev.map((c) => {
              if (c.conversationId === newMessage.messageConversationId) {
                return {
                  ...c,
                  conversationLastMessageAt: newMessage.messageCreatedAt,
                  conversationLastMessagePreview: newMessage.messageContent?.slice(0, 100),
                  conversationUnreadCount:
                    selectedConversation?.conversationId === c.conversationId
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
          setConversations((prev) =>
            prev.map((c) =>
              c.conversationId === updated.conversationId
                ? { ...c, ...updated }
                : c
            )
          );
          if (selectedConversation?.conversationId === updated.conversationId) {
            setSelectedConversation((prev) => ({ ...prev, ...updated }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "omConversations" },
        () => {
          // New conversation from webhook - reload list
          loadConversations();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [selectedConversation, loadConversations]);

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
    loadConversations,
  };
}

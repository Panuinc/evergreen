"use client";

import { useOmnichannelChat } from "@/modules/marketing/hooks/useOmnichannelChat";
import OmnichannelView from "@/modules/marketing/components/OmnichannelView";

export default function OmnichannelPage() {
  const {
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
    sendMessage,
    updateStatus,
    updateContact,
    deleteConversation,
    suggestLoading,
    suggestedText,
    toggleAiAutoReply,
    suggestReply,
    logNote,
  } = useOmnichannelChat();

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

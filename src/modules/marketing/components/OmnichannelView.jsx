import { useState } from "react";
import { Button, useDisclosure } from "@heroui/react";
import { Settings } from "lucide-react";
import ConversationList from "@/modules/marketing/components/ConversationList";
import ChatWindow from "@/modules/marketing/components/ChatWindow";
import ConversationDetail from "@/modules/marketing/components/ConversationDetail";
import EmptyState from "@/modules/marketing/components/EmptyState";
import ChannelSettings from "@/modules/marketing/components/ChannelSettings";

export default function OmnichannelView({
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
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [mobileView, setMobileView] = useState("list");
  const settingsModal = useDisclosure();

  const handleSelectConversation = (conv) => {
    selectConversation(conv);
    setMobileView("chat");
  };

  const handleBack = () => {
    selectConversation(null);
    setMobileView("list");
  };

  return (
    <div className="flex flex-col w-full h-full">
      {}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-light">แชทรวมช่องทาง</p>
        <Button
          variant="bordered"
          size="md"
          radius="md"
          startContent={<Settings />}
          onPress={settingsModal.onOpen}
        >
          ตั้งค่าช่องทาง
        </Button>
      </div>

      {}
      <div className="flex flex-1 min-h-0 border border-border rounded-xl overflow-hidden">
        {}
        <div
          className={`${
            mobileView === "list" ? "flex" : "hidden"
          } md:flex flex-col w-full md:w-4/12 border-r border-border`}
        >
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            loading={loading}
            statusFilter={statusFilter}
            channelFilter={channelFilter}
            searchQuery={searchQuery}
            onStatusFilterChange={setStatusFilter}
            onChannelFilterChange={setChannelFilter}
            onSearchChange={setSearchQuery}
            onSelect={handleSelectConversation}
          />
        </div>

        {}
        <div
          className={`${
            mobileView === "chat" ? "flex" : "hidden"
          } md:flex flex-col flex-1 min-w-0 overflow-hidden`}
        >
          {selectedConversation ? (
            <div className="flex flex-1 min-h-0 min-w-0">
              <div className={`flex flex-col min-w-0 ${showDetail ? "w-full md:w-7/12" : "w-full"}`}>
                <ChatWindow
                  conversation={selectedConversation}
                  messages={messages}
                  messagesLoading={messagesLoading}
                  sending={sending}
                  onSendMessage={sendMessage}
                  onUpdateStatus={updateStatus}
                  onDelete={deleteConversation}
                  onBack={mobileView === "chat" ? handleBack : undefined}
                  onToggleDetail={() => setShowDetail(!showDetail)}
                  onToggleAiAutoReply={toggleAiAutoReply}
                  onSuggestReply={suggestReply}
                  suggestLoading={suggestLoading}
                  suggestedText={suggestedText}
                  onLogNote={logNote}
                />
              </div>
              {showDetail && (
                <div className="hidden md:flex flex-col w-5/12 border-l border-border">
                  <ConversationDetail
                    conversation={selectedConversation}
                    onUpdateContact={updateContact}
                    onClose={() => setShowDetail(false)}
                  />
                </div>
              )}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {}
      <ChannelSettings
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.onClose}
      />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import {
  Button,
  Chip,
  Spinner,
  ScrollShadow,
  Switch,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { ArrowLeft, Info, X as CloseIcon, RotateCcw, Trash2, Bot, Sparkles, Receipt } from "lucide-react";
import ChannelBadge from "./ChannelBadge";
import MessageInput from "./MessageInput";

const STATUS_COLORS = {
  open: "success",
  waiting: "warning",
  closed: "default",
};

function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderMessageContent(text) {
  if (!text) return null;
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function ChatWindow({
  conversation,
  messages,
  messagesLoading,
  sending,
  onSendMessage,
  onUpdateStatus,
  onDelete,
  onBack,
  onToggleDetail,
  onToggleAiAutoReply,
  onSuggestReply,
  suggestLoading,
  suggestedText,
}) {
  const scrollRef = useRef(null);
  const deleteModal = useDisclosure();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const contact = conversation?.omContact;
  const isClosed = conversation?.omConversationStatus === "closed";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border">
        {onBack && (
          <Button isIconOnly variant="light" size="md" radius="md" onPress={onBack}>
            <ArrowLeft size={18} />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-light truncate">
              {contact?.omContactDisplayName || "ไม่ทราบ"}
            </span>
            <ChannelBadge channelType={conversation?.omConversationChannelType} />
            <Chip
              size="sm"
              color={STATUS_COLORS[conversation?.omConversationStatus] || "default"}
              variant="flat"
            >
              {conversation?.omConversationStatus}
            </Chip>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="AI ตอบอัตโนมัติ">
            <div className="flex items-center gap-1 px-2">
              <Bot size={14} className="text-secondary" />
              <Switch
                size="sm"
                color="secondary"
                isSelected={conversation?.omConversationAiAutoReply || false}
                onValueChange={(val) => onToggleAiAutoReply(conversation.omConversationId, val)}
              />
            </div>
          </Tooltip>
          {isClosed ? (
            <Button
              size="md"
              variant="shadow"
              radius="md"
              startContent={<RotateCcw size={14} />}
              onPress={() => onUpdateStatus(conversation.omConversationId, "open")}
            >
              เปิดอีกครั้ง
            </Button>
          ) : (
            <Button
              size="md"
              variant="bordered"
              radius="md"
              color="danger"
              startContent={<CloseIcon size={14} />}
              onPress={() => onUpdateStatus(conversation.omConversationId, "closed")}
            >
              ปิด
            </Button>
          )}
          <Button
            isIconOnly
            variant="light"
            size="md"
            radius="md"
            color="danger"
            onPress={deleteModal.onOpen}
          >
            <Trash2 size={18} />
          </Button>
          <Button isIconOnly variant="light" size="md" radius="md" onPress={onToggleDetail}>
            <Info size={18} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollShadow ref={scrollRef} className="flex-1 p-3 overflow-y-auto">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            ยังไม่มีข้อความ
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.omMessageId}
                className={`flex ${msg.omMessageSenderType === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                    msg.omMessageSenderType === "agent"
                      ? msg.omMessageIsAi
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                      : "bg-default-100"
                  }`}
                >
                  {msg.omMessageIsAi && (
                    <div className="flex items-center gap-1 mb-1 text-[10px] opacity-70">
                      <Sparkles size={10} />
                      <span>AI</span>
                    </div>
                  )}
                  {msg.omMessageType === "image" && msg.omMessageImageUrl ? (
                    <div className="space-y-2">
                      <a href={msg.omMessageImageUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={msg.omMessageImageUrl}
                          alt="รูปภาพ"
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ maxHeight: 300 }}
                        />
                      </a>
                      {msg.omMessageOcrData && (
                        <div className="bg-default-50 rounded-lg p-2 text-sm space-y-1 border border-border">
                          <div className="flex items-center gap-1 font-light text-foreground mb-1">
                            <Receipt size={12} />
                            <span>ข้อมูลสลิป</span>
                          </div>
                          {msg.omMessageOcrData.amount && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ยอดเงิน</span>
                              <span className="font-light">{Number(msg.omMessageOcrData.amount).toLocaleString()} บาท</span>
                            </div>
                          )}
                          {msg.omMessageOcrData.fromBank && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">จาก</span>
                              <span>{msg.omMessageOcrData.fromBank}</span>
                            </div>
                          )}
                          {msg.omMessageOcrData.toBank && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ไปยัง</span>
                              <span>{msg.omMessageOcrData.toBank}</span>
                            </div>
                          )}
                          {msg.omMessageOcrData.datetime && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">วันเวลา</span>
                              <span>{msg.omMessageOcrData.datetime}</span>
                            </div>
                          )}
                          {msg.omMessageOcrData.reference && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">อ้างอิง</span>
                              <span>{msg.omMessageOcrData.reference}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{renderMessageContent(msg.omMessageContent)}</p>
                  )}
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.omMessageSenderType === "agent"
                        ? msg.omMessageIsAi
                          ? "text-secondary-foreground/70"
                          : "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatMessageTime(msg.omMessageCreatedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollShadow>

      {/* Input */}
      <MessageInput
        onSend={onSendMessage}
        onSuggest={onSuggestReply}
        sending={sending}
        suggestLoading={suggestLoading}
        disabled={isClosed}
        suggestedText={suggestedText}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} size="sm">
        <ModalContent>
          <ModalHeader>ยืนยันการลบ</ModalHeader>
          <ModalBody>
            <p>ต้องการลบการสนทนากับ <strong>{contact?.omContactDisplayName || "ไม่ทราบ"}</strong> หรือไม่?</p>
            <p className="text-sm text-muted-foreground">ข้อความทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={deleteModal.onClose}>
              ยกเลิก
            </Button>
            <Button
              color="danger"
              size="md"
              radius="md"
              onPress={() => {
                onDelete(conversation.omConversationId);
                deleteModal.onClose();
              }}
            >
              ลบการสนทนา
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

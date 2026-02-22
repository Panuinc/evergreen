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

  const contact = conversation?.omContacts;
  const isClosed = conversation?.conversationStatus === "closed";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b-2 border-default">
        {onBack && (
          <Button isIconOnly variant="light" size="sm" radius="md" onPress={onBack}>
            <ArrowLeft size={18} />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">
              {contact?.contactDisplayName || "ไม่ทราบ"}
            </span>
            <ChannelBadge channelType={conversation?.conversationChannelType} />
            <Chip
              size="sm"
              color={STATUS_COLORS[conversation?.conversationStatus] || "default"}
              variant="flat"
            >
              {conversation?.conversationStatus}
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
                isSelected={conversation?.conversationAiAutoReply || false}
                onValueChange={(val) => onToggleAiAutoReply(conversation.conversationId, val)}
              />
            </div>
          </Tooltip>
          {isClosed ? (
            <Button
              size="sm"
              variant="bordered"
              radius="md"
              startContent={<RotateCcw size={14} />}
              onPress={() => onUpdateStatus(conversation.conversationId, "open")}
            >
              เปิดอีกครั้ง
            </Button>
          ) : (
            <Button
              size="sm"
              variant="bordered"
              radius="md"
              color="danger"
              startContent={<CloseIcon size={14} />}
              onPress={() => onUpdateStatus(conversation.conversationId, "closed")}
            >
              ปิด
            </Button>
          )}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            radius="md"
            color="danger"
            onPress={deleteModal.onOpen}
          >
            <Trash2 size={18} />
          </Button>
          <Button isIconOnly variant="light" size="sm" radius="md" onPress={onToggleDetail}>
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
          <div className="flex items-center justify-center h-full text-default-400">
            ยังไม่มีข้อความ
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.messageId}
                className={`flex ${msg.messageSenderType === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                    msg.messageSenderType === "agent"
                      ? msg.messageIsAi
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                      : "bg-default-100"
                  }`}
                >
                  {msg.messageIsAi && (
                    <div className="flex items-center gap-1 mb-1 text-[10px] opacity-70">
                      <Sparkles size={10} />
                      <span>AI</span>
                    </div>
                  )}
                  {msg.messageType === "image" && msg.messageImageUrl ? (
                    <div className="space-y-2">
                      <a href={msg.messageImageUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={msg.messageImageUrl}
                          alt="รูปภาพ"
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ maxHeight: 300 }}
                        />
                      </a>
                      {msg.messageOcrData && (
                        <div className="bg-default-50 rounded-lg p-2 text-xs space-y-1 border border-default-200">
                          <div className="flex items-center gap-1 font-semibold text-default-600 mb-1">
                            <Receipt size={12} />
                            <span>ข้อมูลสลิป</span>
                          </div>
                          {msg.messageOcrData.amount && (
                            <div className="flex justify-between">
                              <span className="text-default-400">ยอดเงิน</span>
                              <span className="font-semibold">{Number(msg.messageOcrData.amount).toLocaleString()} บาท</span>
                            </div>
                          )}
                          {msg.messageOcrData.fromBank && (
                            <div className="flex justify-between">
                              <span className="text-default-400">จาก</span>
                              <span>{msg.messageOcrData.fromBank}</span>
                            </div>
                          )}
                          {msg.messageOcrData.toBank && (
                            <div className="flex justify-between">
                              <span className="text-default-400">ไปยัง</span>
                              <span>{msg.messageOcrData.toBank}</span>
                            </div>
                          )}
                          {msg.messageOcrData.datetime && (
                            <div className="flex justify-between">
                              <span className="text-default-400">วันเวลา</span>
                              <span>{msg.messageOcrData.datetime}</span>
                            </div>
                          )}
                          {msg.messageOcrData.reference && (
                            <div className="flex justify-between">
                              <span className="text-default-400">อ้างอิง</span>
                              <span>{msg.messageOcrData.reference}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{renderMessageContent(msg.messageContent)}</p>
                  )}
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.messageSenderType === "agent"
                        ? msg.messageIsAi
                          ? "text-secondary-foreground/70"
                          : "text-primary-foreground/70"
                        : "text-default-400"
                    }`}
                  >
                    {formatMessageTime(msg.messageCreatedAt)}
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
            <p>ต้องการลบการสนทนากับ <strong>{contact?.contactDisplayName || "ไม่ทราบ"}</strong> หรือไม่?</p>
            <p className="text-sm text-default-400">ข้อความทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" radius="md" onPress={deleteModal.onClose}>
              ยกเลิก
            </Button>
            <Button
              color="danger"
              radius="md"
              onPress={() => {
                onDelete(conversation.conversationId);
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

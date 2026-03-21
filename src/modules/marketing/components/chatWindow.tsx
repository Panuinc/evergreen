"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Button,
  Chip,  ScrollShadow,
  Switch,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { ArrowLeft, Info, X as CloseIcon, RotateCcw, Trash2, Bot, Sparkles, Receipt, FileDown, FileText, MessageSquarePlus } from "lucide-react";
import ChannelBadge from "./channelBadge";
import MessageInput from "./messageInput";
import Loading from "@/components/ui/loading";
import type { ChatWindowProps } from "@/modules/marketing/types";

const statusColors = {
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

const urlRegex = /(https?:\/\/[^\s]+)/g;

function renderMessageContent(text) {
  if (!text) return null;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
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
  onLogNote,
}: ChatWindowProps) {
  const scrollRef = useRef(null);
  const deleteModal = useDisclosure();
  const logNoteModal = useDisclosure();
  const [logNoteText, setLogNoteText] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const contact = conversation?.mktContact;
  const isClosed = conversation?.mktConversationStatus === "closed";

  return (
    <div className="flex flex-col h-full min-w-0 overflow-hidden">
      {}
      <div className="flex items-center gap-2 p-2 md:p-3 border-b border-border min-w-0">
        {onBack && (
          <Button isIconOnly variant="light" size="sm" radius="md" onPress={onBack} className="shrink-0">
            <ArrowLeft size={18} />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-light truncate text-sm">
              {contact?.mktContactDisplayName || "ไม่ทราบ"}
            </span>
            <ChannelBadge channelType={conversation?.mktConversationChannelType} />
            <Chip
              size="sm"
              color={statusColors[conversation?.mktConversationStatus] || "default"}
              variant="flat"
            >
              {conversation?.mktConversationStatus}
            </Chip>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip content="AI ตอบอัตโนมัติ">
            <div className="flex items-center gap-0.5 px-1">
              <Bot size={16} className="text-secondary hidden md:block" />
              <Switch
                size="sm"
                color="secondary"
                isSelected={conversation?.mktConversationAiAutoReply || false}
                onValueChange={(val) => onToggleAiAutoReply(conversation.mktConversationId, val)}
              />
            </div>
          </Tooltip>
          <Tooltip content="บันทึกข้อความที่ส่งผ่าน LINE OA">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              radius="md"
              onPress={logNoteModal.onOpen}
            >
              <MessageSquarePlus size={16} />
            </Button>
          </Tooltip>
          {isClosed ? (
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              radius="md"
              className="md:hidden"
              onPress={() => onUpdateStatus(conversation.mktConversationId, "open")}
            >
              <RotateCcw size={16} />
            </Button>
          ) : (
            <Button
              isIconOnly
              variant="bordered"
              size="sm"
              radius="md"
              color="danger"
              className="md:hidden"
              onPress={() => onUpdateStatus(conversation.mktConversationId, "closed")}
            >
              <CloseIcon size={16} />
            </Button>
          )}
          {isClosed ? (
            <Button
              size="sm"
              variant="flat"
              radius="md"
              startContent={<RotateCcw size={14} />}
              onPress={() => onUpdateStatus(conversation.mktConversationId, "open")}
              className="hidden md:flex"
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
              onPress={() => onUpdateStatus(conversation.mktConversationId, "closed")}
              className="hidden md:flex"
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
            <Trash2 size={16} />
          </Button>
          <Button isIconOnly variant="light" size="sm" radius="md" onPress={onToggleDetail}>
            <Info size={16} />
          </Button>
        </div>
      </div>

      <div className="px-2 md:px-3 py-1.5 bg-warning-50 border-b border-warning-200 text-xs text-warning-700">
        <span className="md:hidden">ตอบผ่านระบบนี้ เพื่อให้ AI มีบริบทครบ</span>
        <span className="hidden md:inline">ควรตอบลูกค้าผ่านระบบนี้ เพื่อให้ AI มีบริบทครบถ้วน หากตอบผ่าน LINE OA โดยตรง กดปุ่ม <MessageSquarePlus size={14} className="inline" /> เพื่อบันทึกข้อความ</span>
      </div>

      {}
      <ScrollShadow ref={scrollRef} className="flex-1 p-2 md:p-3 overflow-y-auto">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loading />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            ยังไม่มีข้อความ
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.mktMessageId}
                className={`flex ${msg.mktMessageSenderType === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] px-3 py-2 rounded-xl text-xs overflow-hidden break-words ${
                    msg.mktMessageSenderType === "agent"
                      ? msg.mktMessageIsAi
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                      : "bg-default-100"
                  }`}
                >
                  {msg.mktMessageIsAi && (
                    <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                      <Sparkles />
                      <span>AI</span>
                    </div>
                  )}
                  {msg.mktMessageType === "file" && msg.mktMessageImageUrl ? (
                    <a
                      href={msg.mktMessageImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-50 border border-border hover:bg-default-100 transition-colors"
                    >
                      <FileText size={20} className="text-primary shrink-0" />
                      <span className="text-sm truncate max-w-[200px]">
                        {msg.mktMessageContent && msg.mktMessageContent !== "[file]"
                          ? msg.mktMessageContent
                          : "ไฟล์แนบ"}
                      </span>
                      <FileDown size={16} className="text-default-400 shrink-0 ml-auto" />
                    </a>
                  ) : msg.mktMessageType === "image" && msg.mktMessageImageUrl ? (
                    <div className="space-y-2">
                      <a href={msg.mktMessageImageUrl} target="_blank" rel="noopener noreferrer">
                        <div className="relative max-w-full" style={{ maxHeight: 300 }}>
                          <Image
                            src={msg.mktMessageImageUrl}
                            alt="รูปภาพ"
                            width={0}
                            height={0}
                            unoptimized
                            className="w-auto max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxHeight: 300, height: "auto" }}
                          />
                        </div>
                      </a>
                      {msg.mktMessageOcrData && (
                        <div className="bg-default-50 rounded-lg p-2 text-xs space-y-1 border border-border">
                          <div className="flex items-center gap-1 font-light text-foreground mb-1">
                            <Receipt />
                            <span>ข้อมูลสลิป</span>
                          </div>
                          {msg.mktMessageOcrData.amount && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ยอดเงิน</span>
                              <span className="font-light">{Number(msg.mktMessageOcrData.amount).toLocaleString()} บาท</span>
                            </div>
                          )}
                          {msg.mktMessageOcrData.fromBank && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">จาก</span>
                              <span>{msg.mktMessageOcrData.fromBank}</span>
                            </div>
                          )}
                          {msg.mktMessageOcrData.toBank && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ไปยัง</span>
                              <span>{msg.mktMessageOcrData.toBank}</span>
                            </div>
                          )}
                          {msg.mktMessageOcrData.datetime && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">วันเวลา</span>
                              <span>{msg.mktMessageOcrData.datetime}</span>
                            </div>
                          )}
                          {msg.mktMessageOcrData.reference && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">อ้างอิง</span>
                              <span>{msg.mktMessageOcrData.reference}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{renderMessageContent(msg.mktMessageContent)}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      msg.mktMessageSenderType === "agent"
                        ? msg.mktMessageIsAi
                          ? "text-secondary-foreground/70"
                          : "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatMessageTime(msg.mktMessageCreatedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollShadow>

      {}
      <MessageInput
        onSend={onSendMessage}
        onSuggest={onSuggestReply}
        sending={sending}
        suggestLoading={suggestLoading}
        disabled={isClosed}
        suggestedText={suggestedText}
      />

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} size="md">
        <ModalContent>
          <ModalHeader>ยืนยันการลบ</ModalHeader>
          <ModalBody>
            <p>ต้องการลบการสนทนากับ <strong>{contact?.mktContactDisplayName || "ไม่ทราบ"}</strong> หรือไม่?</p>
            <p className="text-xs text-muted-foreground">ข้อความทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้</p>
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
                onDelete(conversation.mktConversationId);
                deleteModal.onClose();
              }}
            >
              ลบการสนทนา
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={logNoteModal.isOpen} onClose={logNoteModal.onClose} size="md">
        <ModalContent>
          <ModalHeader>บันทึกข้อความที่ส่งผ่าน LINE OA</ModalHeader>
          <ModalBody>
            <p className="text-xs text-muted-foreground mb-2">
              ใช้สำหรับบันทึกข้อความที่แอดมินส่งผ่าน LINE OA โดยตรง เพื่อให้ AI มีบริบทครบถ้วน
            </p>
            <Textarea
              placeholder="พิมพ์ข้อความที่ส่งผ่าน LINE OA..."
              variant="bordered"
              size="md"
              radius="md"
              minRows={3}
              value={logNoteText}
              onValueChange={setLogNoteText}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={() => { logNoteModal.onClose(); setLogNoteText(""); }}>
              ยกเลิก
            </Button>
            <Button
              color="primary"
              size="md"
              radius="md"
              isDisabled={!logNoteText.trim()}
              onPress={() => {
                onLogNote(logNoteText.trim());
                setLogNoteText("");
                logNoteModal.onClose();
              }}
            >
              บันทึก
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

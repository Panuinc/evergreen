"use client";

import { useEffect, useRef, useState } from "react";
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
import ChannelBadge from "./ChannelBadge";
import MessageInput from "./MessageInput";
import Loading from "@/components/ui/Loading";

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
  onLogNote,
}) {
  const scrollRef = useRef(null);
  const deleteModal = useDisclosure();
  const logNoteModal = useDisclosure();
  const [logNoteText, setLogNoteText] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const contact = conversation?.omContact;
  const isClosed = conversation?.omConversationStatus === "closed";

  return (
    <div className="flex flex-col h-full">
      {}
      <div className="flex items-center gap-3 p-3 border-b border-border">
        {onBack && (
          <Button isIconOnly variant="light" size="md" radius="md" onPress={onBack}>
            <ArrowLeft />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-light truncate">
              {contact?.omContactDisplayName || "ไม่ทราบ"}
            </span>
            <ChannelBadge channelType={conversation?.omConversationChannelType} />
            <Chip
              size="md"
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
              <Bot className="text-secondary" />
              <Switch
                size="md"
                color="secondary"
                isSelected={conversation?.omConversationAiAutoReply || false}
                onValueChange={(val) => onToggleAiAutoReply(conversation.omConversationId, val)}
              />
            </div>
          </Tooltip>
          <Tooltip content="บันทึกข้อความที่ส่งผ่าน LINE OA">
            <Button
              isIconOnly
              variant="light"
              size="md"
              radius="md"
              onPress={logNoteModal.onOpen}
            >
              <MessageSquarePlus />
            </Button>
          </Tooltip>
          {isClosed ? (
            <Button
              size="md"
              variant="flat"
              radius="md"
              startContent={<RotateCcw />}
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
              startContent={<CloseIcon />}
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
            <Trash2 />
          </Button>
          <Button isIconOnly variant="light" size="md" radius="md" onPress={onToggleDetail}>
            <Info />
          </Button>
        </div>
      </div>

      <div className="px-3 py-2 bg-warning-50 border-b border-warning-200 text-xs text-warning-700">
        ควรตอบลูกค้าผ่านระบบนี้ เพื่อให้ AI มีบริบทครบถ้วน หากตอบผ่าน LINE OA โดยตรง กดปุ่ม <MessageSquarePlus size={14} className="inline" /> เพื่อบันทึกข้อความ
      </div>

      {}
      <ScrollShadow ref={scrollRef} className="flex-1 p-3 overflow-y-auto">
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
                key={msg.omMessageId}
                className={`flex ${msg.omMessageSenderType === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${
                    msg.omMessageSenderType === "agent"
                      ? msg.omMessageIsAi
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                      : "bg-default-100"
                  }`}
                >
                  {msg.omMessageIsAi && (
                    <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                      <Sparkles />
                      <span>AI</span>
                    </div>
                  )}
                  {msg.omMessageType === "file" && msg.omMessageImageUrl ? (
                    <a
                      href={msg.omMessageImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-50 border border-border hover:bg-default-100 transition-colors"
                    >
                      <FileText size={20} className="text-primary shrink-0" />
                      <span className="text-sm truncate max-w-[200px]">
                        {msg.omMessageContent && msg.omMessageContent !== "[file]"
                          ? msg.omMessageContent
                          : "ไฟล์แนบ"}
                      </span>
                      <FileDown size={16} className="text-default-400 shrink-0 ml-auto" />
                    </a>
                  ) : msg.omMessageType === "image" && msg.omMessageImageUrl ? (
                    <div className="space-y-2">
                      <a href={msg.omMessageImageUrl} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.omMessageImageUrl}
                          alt="รูปภาพ"
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ maxHeight: 300 }}
                        />
                      </a>
                      {msg.omMessageOcrData && (
                        <div className="bg-default-50 rounded-lg p-2 text-xs space-y-1 border border-border">
                          <div className="flex items-center gap-1 font-light text-foreground mb-1">
                            <Receipt />
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
                    className={`text-xs mt-1 ${
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
            <p>ต้องการลบการสนทนากับ <strong>{contact?.omContactDisplayName || "ไม่ทราบ"}</strong> หรือไม่?</p>
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
                onDelete(conversation.omConversationId);
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

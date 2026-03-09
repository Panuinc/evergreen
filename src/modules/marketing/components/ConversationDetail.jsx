"use client";

import { useState, useEffect } from "react";
import { Button, Input, Chip, Textarea } from "@heroui/react";
import { X, Plus, Tag, StickyNote, FileText, ExternalLink } from "lucide-react";
import { getQuotationsByConversation } from "@/modules/marketing/actions";
import ChannelBadge from "./ChannelBadge";

export default function ConversationDetail({ conversation, onUpdateContact, onClose }) {
  const contact = conversation?.omContact;
  const [newTag, setNewTag] = useState("");
  const [notes, setNotes] = useState(contact?.omContactNotes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    if (!conversation?.omConversationId) return;
    getQuotationsByConversation(conversation.omConversationId)
      .then((data) => setQuotations(data || []))
      .catch(() => setQuotations([]));
  }, [conversation?.omConversationId]);

  if (!conversation || !contact) return null;

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    const currentTags = contact.omContactTags || [];
    if (currentTags.includes(tag)) return;
    onUpdateContact(contact.omContactId, { omContactTags: [...currentTags, tag] });
    setNewTag("");
  };

  const handleRemoveTag = (tag) => {
    const currentTags = contact.omContactTags || [];
    onUpdateContact(contact.omContactId, {
      omContactTags: currentTags.filter((t) => t !== tag),
    });
  };

  const handleSaveNotes = () => {
    onUpdateContact(contact.omContactId, { omContactNotes: notes });
    setEditingNotes(false);
  };

  return (
    <div className="flex flex-col h-full">
      {}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="font-light">รายละเอียด</span>
        <Button isIconOnly variant="light" size="md" radius="md" onPress={onClose}>
          <X />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-4">
          {}
          <div className="flex flex-col gap-2">
            <p className="font-light text-xs">ข้อมูลลูกค้า</p>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ชื่อ</span>
                <span>{contact.omContactDisplayName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ช่องทาง</span>
                <ChannelBadge channelType={contact.omContactChannelType} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">External ID</span>
                <span className="text-xs truncate max-w-[150px]">{contact.omContactExternalId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">สถานะ</span>
                <Chip size="md" variant="flat" color={
                  conversation.omConversationStatus === "open" ? "success" :
                  conversation.omConversationStatus === "waiting" ? "warning" : "default"
                }>
                  {conversation.omConversationStatus}
                </Chip>
              </div>
            </div>
          </div>

          {}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag />
              <p className="font-light text-xs">แท็ก</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(contact.omContactTags || []).map((tag) => (
                <Chip
                  key={tag}
                  size="md"
                  variant="flat"
                  onClose={() => handleRemoveTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                size="md"
                variant="flat"
                radius="md"
                placeholder="เพิ่ม tag..."
                value={newTag}
                onValueChange={setNewTag}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button isIconOnly size="md" variant="bordered" radius="md" onPress={handleAddTag}>
                <Plus />
              </Button>
            </div>
          </div>

          {}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <StickyNote />
              <p className="font-light text-xs">หมายเหตุ</p>
            </div>
            {editingNotes ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  variant="bordered"
                  radius="md"
                  size="md"
                  minRows={3}
                  value={notes}
                  onValueChange={setNotes}
                />
                <div className="flex gap-1 justify-end">
                  <Button size="md" variant="bordered" radius="md" onPress={() => setEditingNotes(false)}>
                    ยกเลิก
                  </Button>
                  <Button size="md" color="primary" radius="md" onPress={handleSaveNotes}>
                    บันทึก
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingNotes(true)}
                className="text-xs text-muted-foreground cursor-pointer p-2 rounded-md hover:bg-default/50 min-h-[60px]"
              >
                {contact.omContactNotes || "คลิกเพื่อเพิ่มหมายเหตุ..."}
              </div>
            )}
          </div>

          {}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FileText />
              <p className="font-light text-xs">ใบเสนอราคา</p>
            </div>
            {quotations.length === 0 ? (
              <p className="text-xs text-muted-foreground">ยังไม่มีใบเสนอราคา</p>
            ) : (
              <div className="flex flex-col gap-2">
                {quotations.map((q) => (
                  <div
                    key={q.omQuotationId}
                    className="flex items-center justify-between p-2 rounded-md bg-default/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-light">{q.omQuotationNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(q.omQuotationCreatedAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Chip size="md" variant="flat" color={q.omQuotationStatus === "draft" ? "warning" : "success"}>
                        {q.omQuotationStatus === "draft" ? "ร่าง" : q.omQuotationStatus}
                      </Chip>
                      <Button
                        isIconOnly
                        size="md"
                        variant="light"
                        radius="md"
                        onPress={() => window.open(`/marketing/omnichannel/quotations/${q.omQuotationId}`, "_self")}
                      >
                        <ExternalLink />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

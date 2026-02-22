"use client";

import { useState, useEffect } from "react";
import { Button, Input, Chip, Textarea } from "@heroui/react";
import { X, Plus, Tag, StickyNote, FileText, ExternalLink } from "lucide-react";
import { getQuotationsByConversation } from "@/actions/omnichannel";
import ChannelBadge from "./ChannelBadge";

export default function ConversationDetail({ conversation, onUpdateContact, onClose }) {
  const contact = conversation?.omContacts;
  const [newTag, setNewTag] = useState("");
  const [notes, setNotes] = useState(contact?.contactNotes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    if (!conversation?.conversationId) return;
    getQuotationsByConversation(conversation.conversationId)
      .then((data) => setQuotations(data || []))
      .catch(() => setQuotations([]));
  }, [conversation?.conversationId]);

  if (!conversation || !contact) return null;

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    const currentTags = contact.contactTags || [];
    if (currentTags.includes(tag)) return;
    onUpdateContact(contact.contactId, { contactTags: [...currentTags, tag] });
    setNewTag("");
  };

  const handleRemoveTag = (tag) => {
    const currentTags = contact.contactTags || [];
    onUpdateContact(contact.contactId, {
      contactTags: currentTags.filter((t) => t !== tag),
    });
  };

  const handleSaveNotes = () => {
    onUpdateContact(contact.contactId, { contactNotes: notes });
    setEditingNotes(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b-2 border-default">
        <span className="font-semibold">รายละเอียด</span>
        <Button isIconOnly variant="light" size="sm" radius="md" onPress={onClose}>
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-4">
          {/* Contact Info */}
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm">ข้อมูลลูกค้า</p>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-default-400">ชื่อ</span>
                <span>{contact.contactDisplayName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-400">ช่องทาง</span>
                <ChannelBadge channelType={contact.contactChannelType} />
              </div>
              <div className="flex justify-between">
                <span className="text-default-400">External ID</span>
                <span className="text-[10px] truncate max-w-[150px]">{contact.contactExternalId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-400">สถานะ</span>
                <Chip size="sm" variant="flat" color={
                  conversation.conversationStatus === "open" ? "success" :
                  conversation.conversationStatus === "waiting" ? "warning" : "default"
                }>
                  {conversation.conversationStatus}
                </Chip>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag size={14} />
              <p className="font-semibold text-sm">แท็ก</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(contact.contactTags || []).map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="flat"
                  onClose={() => handleRemoveTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                size="sm"
                variant="bordered"
                radius="md"
                placeholder="เพิ่ม tag..."
                value={newTag}
                onValueChange={setNewTag}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button isIconOnly size="sm" variant="bordered" radius="md" onPress={handleAddTag}>
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <StickyNote size={14} />
              <p className="font-semibold text-sm">หมายเหตุ</p>
            </div>
            {editingNotes ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  variant="bordered"
                  radius="md"
                  size="sm"
                  minRows={3}
                  value={notes}
                  onValueChange={setNotes}
                />
                <div className="flex gap-1 justify-end">
                  <Button size="sm" variant="bordered" radius="md" onPress={() => setEditingNotes(false)}>
                    ยกเลิก
                  </Button>
                  <Button size="sm" color="primary" radius="md" onPress={handleSaveNotes}>
                    บันทึก
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setEditingNotes(true)}
                className="text-sm text-default-400 cursor-pointer p-2 rounded-md hover:bg-default/50 min-h-[60px]"
              >
                {contact.contactNotes || "คลิกเพื่อเพิ่มหมายเหตุ..."}
              </div>
            )}
          </div>

          {/* Quotations */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FileText size={14} />
              <p className="font-semibold text-sm">ใบเสนอราคา</p>
            </div>
            {quotations.length === 0 ? (
              <p className="text-sm text-default-400">ยังไม่มีใบเสนอราคา</p>
            ) : (
              <div className="flex flex-col gap-2">
                {quotations.map((q) => (
                  <div
                    key={q.quotationId}
                    className="flex items-center justify-between p-2 rounded-md bg-default/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{q.quotationNumber}</span>
                      <span className="text-[10px] text-default-400">
                        {new Date(q.quotationCreatedAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Chip size="sm" variant="flat" color={q.quotationStatus === "draft" ? "warning" : "success"}>
                        {q.quotationStatus === "draft" ? "ร่าง" : q.quotationStatus}
                      </Chip>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        radius="md"
                        onPress={() => window.open(`/marketing/omnichannel/quotations/${q.quotationId}`, "_self")}
                      >
                        <ExternalLink size={14} />
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

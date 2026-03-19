"use client";

import { useState, useEffect } from "react";
import { Button, Input, Chip, Textarea } from "@heroui/react";
import { X, Plus, Tag, StickyNote, FileText, ExternalLink, Clock, CalendarPlus } from "lucide-react";
import { get, post, del } from "@/lib/apiClient";
import ChannelBadge from "./channelBadge";

export default function ConversationDetail({ conversation, onUpdateContact, onClose }) {
  const contact = conversation?.omContact;
  const [newTag, setNewTag] = useState("");
  const [notes, setNotes] = useState(contact?.omContactNotes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("10:00");
  const [followUpMessage, setFollowUpMessage] = useState("");

  useEffect(() => {
    if (!conversation?.omConversationId) return;
    get(`/api/marketing/omnichannel/quotations?conversationId=${conversation.omConversationId}`)
      .then((data) => setQuotations(data || []))
      .catch(() => setQuotations([]));
    get(`/api/marketing/omnichannel/followUp?conversationId=${conversation.omConversationId}`)
      .then((data) => setFollowUps(data || []))
      .catch(() => setFollowUps([]));
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

  const handleCreateFollowUp = async () => {
    if (!followUpDate) return;
    try {
      const scheduledAt = new Date(`${followUpDate}T${followUpTime || "10:00"}:00+07:00`).toISOString();
      const result = await post("/api/marketing/omnichannel/followUp", {
        conversationId: conversation.omConversationId,
        scheduledAt,
        message: followUpMessage || null,
      });
      setFollowUps((prev) => [...prev, result]);
      setShowFollowUpForm(false);
      setFollowUpDate("");
      setFollowUpTime("10:00");
      setFollowUpMessage("");
    } catch {
      // handled in actions
    }
  };

  const handleDeleteFollowUp = async (id) => {
    try {
      await del(`/api/marketing/omnichannel/followUp/${id}`);
      setFollowUps((prev) => prev.filter((f) => f.omFollowUpId !== id));
    } catch {
      // handled in actions
    }
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <p className="font-light text-xs">ติดตามลูกค้า</p>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setShowFollowUpForm(!showFollowUpForm)}
              >
                <CalendarPlus size={14} />
              </Button>
            </div>
            {showFollowUpForm && (
              <div className="flex flex-col gap-2 p-2 rounded-md bg-default/50">
                <div className="flex gap-2">
                  <Input
                    size="sm"
                    variant="bordered"
                    radius="md"
                    type="date"
                    label="วันที่"
                    labelPlacement="outside"
                    value={followUpDate}
                    onValueChange={setFollowUpDate}
                  />
                  <Input
                    size="sm"
                    variant="bordered"
                    radius="md"
                    type="time"
                    label="เวลา"
                    labelPlacement="outside"
                    value={followUpTime}
                    onValueChange={setFollowUpTime}
                  />
                </div>
                <Textarea
                  size="sm"
                  variant="bordered"
                  radius="md"
                  placeholder="ข้อความ (เว้นว่างให้ AI สร้างเอง)"
                  minRows={2}
                  value={followUpMessage}
                  onValueChange={setFollowUpMessage}
                />
                <div className="flex gap-1 justify-end">
                  <Button size="sm" variant="bordered" radius="md" onPress={() => setShowFollowUpForm(false)}>
                    ยกเลิก
                  </Button>
                  <Button size="sm" color="primary" radius="md" onPress={handleCreateFollowUp} isDisabled={!followUpDate}>
                    ตั้งเวลา
                  </Button>
                </div>
              </div>
            )}
            {followUps.filter((f) => f.omFollowUpStatus === "pending").length === 0 && !showFollowUpForm ? (
              <p className="text-xs text-muted-foreground">ยังไม่มีการตั้งเวลาติดตาม</p>
            ) : (
              <div className="flex flex-col gap-1">
                {followUps
                  .filter((f) => f.omFollowUpStatus === "pending")
                  .map((f) => (
                    <div key={f.omFollowUpId} className="flex items-center justify-between p-2 rounded-md bg-default/50">
                      <div className="flex flex-col">
                        <span className="text-xs">
                          {new Date(f.omFollowUpScheduledAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" })}
                        </span>
                        {f.omFollowUpMessage && (
                          <span className="text-xs text-muted-foreground line-clamp-1">{f.omFollowUpMessage}</span>
                        )}
                        {!f.omFollowUpMessage && (
                          <span className="text-xs text-muted-foreground">AI จะสร้างข้อความเอง</span>
                        )}
                      </div>
                      <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDeleteFollowUp(f.omFollowUpId)}>
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
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
                        {new Date(q.omQuotationCreatedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
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

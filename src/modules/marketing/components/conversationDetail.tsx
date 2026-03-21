"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button, Input, Chip, Textarea } from "@heroui/react";
import { X, Plus, Tag, StickyNote, FileText, ExternalLink, Clock, CalendarPlus } from "lucide-react";
import { get, post, del } from "@/lib/apiClient";
import ChannelBadge from "./channelBadge";
import type { ConversationDetailProps, MktQuotation, MktFollowUp } from "@/modules/marketing/types";

export default function ConversationDetail({ conversation, onUpdateContact, onClose }: ConversationDetailProps) {
  const contact = conversation?.mktContact;
  const [newTag, setNewTag] = useState("");
  const [notes, setNotes] = useState(contact?.mktContactNotes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const convId = conversation?.mktConversationId;
  const { data: quotations = [] } = useSWR<MktQuotation[]>(
    convId ? `/api/marketing/omnichannel/quotations?conversationId=${convId}` : null,
    (url: string) => get<MktQuotation[]>(url).catch(() => []),
  );
  const { data: followUpsData = [], mutate: mutateFollowUps } = useSWR<MktFollowUp[]>(
    convId ? `/api/marketing/omnichannel/followUp?conversationId=${convId}` : null,
    (url: string) => get<MktFollowUp[]>(url).catch(() => []),
  );
  const followUps = followUpsData;
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("10:00");
  const [followUpMessage, setFollowUpMessage] = useState("");


  if (!conversation || !contact) return null;

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    const currentTags = contact.mktContactTags || [];
    if (currentTags.includes(tag)) return;
    onUpdateContact(contact.mktContactId, { mktContactTags: [...currentTags, tag] });
    setNewTag("");
  };

  const handleRemoveTag = (tag) => {
    const currentTags = contact.mktContactTags || [];
    onUpdateContact(contact.mktContactId, {
      mktContactTags: currentTags.filter((t) => t !== tag),
    });
  };

  const handleSaveNotes = () => {
    onUpdateContact(contact.mktContactId, { mktContactNotes: notes });
    setEditingNotes(false);
  };

  const handleCreateFollowUp = async () => {
    if (!followUpDate) return;
    try {
      const scheduledAt = new Date(`${followUpDate}T${followUpTime || "10:00"}:00+07:00`).toISOString();
      const result = await post<MktFollowUp>("/api/marketing/omnichannel/followUp", {
        conversationId: conversation.mktConversationId,
        scheduledAt,
        message: followUpMessage || null,
      });
      mutateFollowUps((prev = []) => [...prev, result as MktFollowUp], { revalidate: false });
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
      mutateFollowUps((prev = []) => prev.filter((f) => f.mktFollowUpId !== id), { revalidate: false });
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
                <span>{contact.mktContactDisplayName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ช่องทาง</span>
                <ChannelBadge channelType={contact.mktContactChannelType} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">External ID</span>
                <span className="text-xs truncate max-w-[150px]">{contact.mktContactExternalRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">สถานะ</span>
                <Chip size="md" variant="flat" color={
                  conversation.mktConversationStatus === "open" ? "success" :
                  conversation.mktConversationStatus === "waiting" ? "warning" : "default"
                }>
                  {conversation.mktConversationStatus}
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
              {(contact.mktContactTags || []).map((tag) => (
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
                {contact.mktContactNotes || "คลิกเพื่อเพิ่มหมายเหตุ..."}
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
            {followUps.filter((f) => f.mktFollowUpStatus === "pending").length === 0 && !showFollowUpForm ? (
              <p className="text-xs text-muted-foreground">ยังไม่มีการตั้งเวลาติดตาม</p>
            ) : (
              <div className="flex flex-col gap-1">
                {followUps
                  .filter((f) => f.mktFollowUpStatus === "pending")
                  .map((f) => (
                    <div key={f.mktFollowUpId} className="flex items-center justify-between p-2 rounded-md bg-default/50">
                      <div className="flex flex-col">
                        <span className="text-xs">
                          {new Date(f.mktFollowUpScheduledAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" })}
                        </span>
                        {f.mktFollowUpMessage && (
                          <span className="text-xs text-muted-foreground line-clamp-1">{f.mktFollowUpMessage}</span>
                        )}
                        {!f.mktFollowUpMessage && (
                          <span className="text-xs text-muted-foreground">AI จะสร้างข้อความเอง</span>
                        )}
                      </div>
                      <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDeleteFollowUp(f.mktFollowUpId)}>
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
                    key={q.mktQuotationId}
                    className="flex items-center justify-between p-2 rounded-md bg-default/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-light">{q.mktQuotationNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(q.mktQuotationCreatedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Chip size="md" variant="flat" color={q.mktQuotationStatus === "draft" ? "warning" : "success"}>
                        {q.mktQuotationStatus === "draft" ? "ร่าง" : q.mktQuotationStatus}
                      </Chip>
                      <Button
                        isIconOnly
                        size="md"
                        variant="light"
                        radius="md"
                        onPress={() => window.open(`/marketing/omnichannel/quotations/${q.mktQuotationId}`, "_self")}
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
